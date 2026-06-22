# LOKI RUNTIME TRACE REPORT
**Session:** VPORT Menu QR Module — Post-Security Remediation Trace
**Date:** 2026-05-27
**TypeScript output allowed:** NO
**Application Scope:** VCSM + ENGINE

---

## LOKI TARGET

```
Observed flow:      VPORT Menu QR module — 3 changed flows post-remediation
Application Scope:  VCSM + ENGINE
Entry points:       /profile/:slug/menu | /actor/:actorId/menu/flyer | BookingQrLinksPanel
Reason:             Runtime trace of all flows changed during VEMON security remediation pass
TypeScript output allowed: NO
```

---

## TRACE IDENTITY

| Field | Value |
|---|---|
| Trace ID | LOKI-2026-05-27-VPORT-QR-001 |
| Route A | `/profile/:slug/menu` |
| Route B | `/actor/:actorId/menu/flyer` |
| Route C | BookingQrLinksPanel (dashboard) |
| Screen A | Public menu page |
| Screen B | VportActorMenuFlyerScreen |
| Screen C | BookingQrLinksPanel |
| Session state class A | anonymous |
| Session state class B | authenticated VPORT owner |
| Session state class C | authenticated VPORT owner |
| Environment | Development trace (static analysis) |
| Timestamp | 2026-05-27 |

---

## FLOW 1: Public Menu Page

**Entry:** `/profile/:slug/menu`
**Session class:** anonymous

### Full Chain

```
useVportPublicDetails({ actorId })
  └─ getVportPublicDetailsController({ actorId })
       └─ readVportPublicDetailsRpcDAL({ actorId })
            ├─ [PRIMARY]  vport.public_menu_read_model_v  → SELECT (1 round-trip)
            │    hit: returns data → done
            └─ [FALLBACK] vport.public_actor_seo_v        → SELECT (1 round-trip)
                 only executed when primary returns null
  └─ mapVportPublicDetailsRpcResult(raw)
       └─ pure transform — no DB round-trips
```

### Round-trip Count

| Scenario | Round-trips |
|---|---|
| VPORT has menu items (happy path) | **1** |
| VPORT has no menu items (fallback path) | **2** |

**N+1 risk:** NO — single entity lookup, no list fan-out.

### Cache Behavior

- **No cache exists** on this read path. `useVportPublicDetails` holds result in local `useState`. Re-mount (navigation away and back) fires a fresh DB read.
- `actorId` change invalidates naturally via `useCallback([actorId])` dependency.
- No TTL cache, no ref cache, no Zustand store hydration for this flow.

Evidence Type: INFERRED
Observation Source: Static call-chain analysis
Confidence: HIGH

### Observability Gaps

1. **Silent fallback path** — When the primary view (`public_menu_read_model_v`) returns null and the fallback (`public_actor_seo_v`) is used, no log or signal distinguishes this from a primary hit. Operators cannot tell whether a VPORT has no menu items or whether the primary view is broken.
2. **Controller catch not instrumented** — `useVportPublicDetails` catches errors and sets local `error` state. If `readVportPublicDetailsRpcDAL` throws (e.g. schema permission error), the hook sets `error` and silently stops. No monitoring call fires. This is invisible to production operators.
3. **No timeout boundary** — If the Supabase query hangs, `loading` stays `true` forever. There is no `AbortSignal`, no timeout, and no UI escape hatch beyond the loading spinner.
4. **Model `catch {}` on URL parsing** — `toSafeUrl` and related model helpers swallow parse errors silently. This is intentional for pure transforms, but URL parse failures are unobservable.

---

## FLOW 2: Flyer Viewer

**Entry:** `/actor/:actorId/menu/flyer`
**Session class:** authenticated VPORT owner

### Full Chain

```
VportActorMenuFlyerScreen
  ├─ useIdentity()
  │    └─ Zustand store read — 0 DB round-trips (cached in identity store)
  │
  └─ useVportOwnership(viewerActorId, actorId)        [NEW — added this session]
       └─ useEffect → checkVportOwnershipController({ callerActorId, targetActorId })
            ├─ BRANCH A: callerActorId === targetActorId (acting-as vport mode)
            │    └─ getActorByIdDAL({ actorId: callerActorId })
            │         └─ vc.actors SELECT id,kind,profile_id,vport_id,is_void  (1 round-trip)
            │
            └─ BRANCH B: caller is a user actor managing a vport
                 └─ assertActorOwnsVportActorController({ requestActorId, targetActorId })
                      ├─ dalGetActorById({ actorId: requestActorId })
                      │    └─ vc.actors SELECT  (1 round-trip)
                      └─ dalReadActorOwnerLink({ targetActorId, userProfileId })
                           └─ vc.actor_owners SELECT  (1 round-trip)
```

### Round-trip Count on Mount

| Scenario | Round-trips |
|---|---|
| Acting-as mode (callerActorId = targetActorId, kind=vport) | **1** |
| User-owns-vport mode | **2** |
| callerActorId or targetActorId is null (not authed) | **0** |

**N+1 risk:** NO — fixed number of lookups, not proportional to a list.

### Focus/Visibility Re-check Behavior (WATCH)

`useVportOwnership` attaches `window.addEventListener('focus', ...)` and `document.addEventListener('visibilitychange', ...)`. Every tab focus or visibility restore triggers a silent re-check of ownership. In Branch B this fires **2 additional DB reads** per re-focus event. This is intentional (revocation detection) but has no rate-limit or debounce.

- Rapid tab-switching by a user would cause repeated `vc.actors` + `vc.actor_owners` reads.
- No exponential backoff, no debounce, no minimum interval between re-checks.

Evidence Type: INFERRED (confirmed by source — lines 45-57 of useVportOwnership.js)
Confidence: HIGH

### Cache Behavior

- **No cache** — `useVportOwnership` uses plain `useState`. Each effect run is a fresh DB fetch.
- `useIdentity()` is Zustand-backed (cached) — 0 cost.
- Ownership check result is NOT cached between focus events.

### Observability Gaps

1. **`catch {}` with no logging** — `checkVportOwnershipController` wraps the whole ownership chain in try/catch and returns `false` on any error. A DB failure, RLS rejection, or network timeout is silently swallowed as "not owner." No monitoring call fires. An operator cannot distinguish a DB outage from a legitimately non-owner visitor.
2. **No rate-limit on focus re-checks** — Each window focus event fires DB reads with no debounce. Not a correctness gap but an observability blind spot: query volume from this hook may appear anomalous without context.
3. **`ownershipLoading` never resets on focus re-check** — The `initial` flag in `check(false)` skips `setOwnershipLoading`. This is correct UX, but means loading state is a one-shot signal — operators cannot distinguish "first load" from "silent re-verify."

---

## FLOW 3: QR Links Dashboard Panel

**Entry:** BookingQrLinksPanel (dashboard, authenticated VPORT owner)
**Session class:** authenticated VPORT owner

### Full Chain

```
useQrLinks({ actorId, enabled })
  │
  ├─ [PHASE 1 — first render only, ref-guarded]
  │   resolveVportProfileIdController({ actorId })
  │     └─ getVportProfileIdByActorIdDAL({ actorId })
  │          └─ vport.profiles SELECT id WHERE actor_id=actorId  (1 round-trip)
  │
  └─ [PHASE 2 — every load() call]
      listQrLinksByProfile({ requestActorId: actorId, profileId })
        └─ [ENGINE: listQrLinks.controller.js]
             ├─ dalGetActorByProfileId({ profileId })
             │    └─ vc.actors SELECT id,kind,profile_id,... WHERE profile_id=profileId  (1 round-trip)
             │
             ├─ BRANCH A: profileActor.id === requestActorId  (self-check passes)
             │    → skip assertActorOwnsVportActor
             │    └─ dalListQrLinksByProfile({ profileId })
             │         └─ vport.qr_links SELECT ... WHERE profile_id=profileId  (1 round-trip)
             │
             └─ BRANCH B: different actor (delegated management)
                  └─ assertActorOwnsVportActor({ requestActorId, targetActorId })
                       ├─ dalGetActorById({ actorId: requestActorId })
                       │    └─ vc.actors SELECT  (1 round-trip)
                       └─ dalReadActorOwnerLink({ targetActorId, userProfileId })
                            └─ vc.actor_owners SELECT  (1 round-trip)
                  └─ dalListQrLinksByProfile({ profileId })
                       └─ vport.qr_links SELECT  (1 round-trip)
```

### Round-trip Count on First Mount

| Scenario | Round-trips |
|---|---|
| First mount — self-owned VPORT (Branch A) | **3** (profiles + actors + qr_links) |
| First mount — delegated management (Branch B) | **5** (profiles + actors + actors + actor_owners + qr_links) |
| Subsequent mount (same actorId, ref cached) | **2** (actors + qr_links) — profiles lookup skipped |
| `addQrLink` then reload | **2** (actors + qr_links) — profiles ref still held |

**N+1 risk:** NO — all reads are single-row lookups or a single list read. No per-row fan-out.

### Ref Cache Behavior (resolvedProfileId.current)

- `resolvedProfileId.current` is a `useRef` that caches the resolved `profileId` after first resolution.
- A `useEffect([actorId])` resets `resolvedProfileId.current = null` when `actorId` changes.
- **Correct invalidation:** switching between VPORT actors clears the cache and triggers a fresh `vport.profiles` read.
- **Gap:** `resolvedProfileId.current` is NOT reset between `load()` calls within the same actorId. This is correct — no regression.
- **Gap:** If `getVportProfileIdByActorIdDAL` returns `null` (e.g. network flake), `resolvedProfileId.current` remains `null` and will retry on next `load()` call. This is correct behavior, but a persistent null (vport with no profile) will silently short-circuit every time with `setQrLinks([])` and no error surface.

### Observability Gaps

1. **`getVportProfileIdByActorIdDAL` silently returns null on error** — The DAL has a blanket `catch { return null; }`. A Supabase schema permission error, network error, or missing row all produce the same outcome: null, then `setQrLinks([])`, then no error state. The hook never sets `error` in this case; the catch in `load()` only catches throws. The null path exits early without error.
2. **`listQrLinksByProfile` engine throws propagate correctly** — `dalGetActorByProfileId` throws on DB error; `assertActorOwnsVportActor` throws on permission failure. These propagate to `useQrLinks`'s `catch (e) { setError(e); }`. This is good — these are visible to the UI. However, no `captureMonitoringError` call fires.
3. **No loading timeout** — same as Flow 1. Infinite loading possible on hang.
4. **`createQrLink` error path** — `addQrLink` catches errors and returns `{ ok: false, error: e }` but does NOT call `captureMonitoringError`. A booking mutation failure is invisible to production operators.

---

## RUNTIME SUMMARY (Aggregated)

| Flow | Min Round-trips | Max Round-trips | Primary Records | Amplification Score |
|---|---:|---:|---:|---|
| Public menu (happy path) | 1 | 1 | 1 VPORT details | **1.0** (HEALTHY) |
| Public menu (fallback) | 2 | 2 | 1 VPORT details | **2.0** (WATCH) |
| Flyer viewer (acting-as) | 1 | 1 | 1 ownership check | **1.0** (HEALTHY) |
| Flyer viewer (user owns vport) | 2 | 2 | 1 ownership check | **2.0** (WATCH) |
| QR links — first mount, self | 3 | 3 | N QR links | **3 / N** |
| QR links — first mount, delegated | 5 | 5 | N QR links | **5 / N** |
| QR links — subsequent mount | 2 | 2 | N QR links | **2 / N** |

No flow exceeds an amplification score of 5 at current load. All are within WATCH range or better.

---

## EXECUTION FLOW MAP

### Flow 1 — Public Menu

| Step | Operation | Caller | Mode | Tables |
|---|---|---|---|---|
| 1 | Hook mount | useVportPublicDetails | PARALLEL (single) | — |
| 2 | Controller call | getVportPublicDetailsController | SERIAL | — |
| 3 | DAL primary | readVportPublicDetailsRpcDAL | SERIAL | vport.public_menu_read_model_v |
| 4 | DAL fallback (conditional) | readVportPublicDetailsRpcDAL | SERIAL | vport.public_actor_seo_v |
| 5 | Model transform | mapVportPublicDetailsRpcResult | SERIAL (sync) | — |

Execution mode: SERIAL (no parallelism opportunity — fallback is conditional on primary null).

### Flow 2 — Flyer Viewer

| Step | Operation | Caller | Mode | Tables |
|---|---|---|---|---|
| 1 | Identity read | useIdentity | SYNC/CACHED | Zustand store |
| 2 | Ownership effect mount | useVportOwnership | PARALLEL with identity | — |
| 3 | Controller call | checkVportOwnershipController | SERIAL | — |
| 4a | Actor read (acting-as) | dalGetActorById | SERIAL | vc.actors |
| 4b | Actor read (user mode) | dalGetActorById | SERIAL | vc.actors |
| 5b | Owner link read (user mode) | dalReadActorOwnerLink | SERIAL | vc.actor_owners |

Execution mode: SERIAL within ownership check. Identity is already resolved (cached).

### Flow 3 — QR Links

| Step | Operation | Caller | Mode | Tables |
|---|---|---|---|---|
| 1 | Profile ID resolution (first mount) | resolveVportProfileIdController | SERIAL | vport.profiles |
| 2 | Actor lookup by profileId | dalGetActorByProfileId | SERIAL | vc.actors |
| 3a | Self-check passes — skip assertion | — | — | — |
| 3b | Actor ownership assertion (delegated) | assertActorOwnsVportActor | SERIAL | vc.actors, vc.actor_owners |
| 4 | QR list read | dalListQrLinksByProfile | SERIAL | vport.qr_links |

Execution mode: SERIAL (each step depends on prior). No parallel opportunity without restructuring.

---

## DATABASE READ SUMMARY

| Table/View | Operation | Flows | Max Reads/Mount | Duplicate Risk |
|---|---|---|---:|---|
| vport.public_menu_read_model_v | SELECT (view) | Flow 1 | 1 | None |
| vport.public_actor_seo_v | SELECT (view) | Flow 1 fallback | 1 | None |
| vc.actors | SELECT (maybeSingle) | Flows 2, 3 | 2 (delegated) | Low — different filter keys |
| vc.actor_owners | SELECT (maybeSingle) | Flows 2, 3 | 1 | None |
| vport.profiles | SELECT (maybeSingle) | Flow 3 | 1 (ref-cached) | None after first mount |
| vport.qr_links | SELECT (list) | Flow 3 | 1 | None |

**vc.actors duplication risk:** In Flow 3 Branch B (delegated management), `dalGetActorByProfileId` fetches the target VPORT actor, then `assertActorOwnsVportActor` fetches the requester actor in a second `vc.actors` read. These are different rows (different filter keys: `profile_id` vs `id`), so they are not duplicate fingerprints — but they do represent 2 separate reads from the same table within a single load. If merged into a single RPC or if the controller were restructured to pass the already-resolved target actor, 1 round-trip could be saved.

---

## DUPLICATE QUERY FINGERPRINTS

No exact duplicate fingerprints observed. The two `vc.actors` reads in Flow 3 Branch B have different filter keys (`profile_id` vs `id`) and serve different purposes.

| Fingerprint | Count | Caller | Impact |
|---|---:|---|---|
| vc.actors WHERE profile_id=X | 1 | dalGetActorByProfileId | Clean |
| vc.actors WHERE id=X | 1 | dalGetActorById (in assertActorOwns) | Clean — different key |

---

## TIMING BUDGET STATUS

Timing values are INFERRED (no live instrumentation). Budget status based on architecture pattern.

| Runtime Area | Observed | Budget | Status |
|---|---|---:|---|
| Route/screen load | UNKNOWN | 1500ms | UNKNOWN |
| Controller orchestration | UNKNOWN | 300ms | UNKNOWN |
| DAL total (Flow 1, happy) | ~1 query | 500ms | LIKELY PASS |
| DAL total (Flow 3, delegated) | ~5 queries serial | 500ms | WATCH |
| Single DB read | UNKNOWN | 150ms | UNKNOWN |
| Hydration/render | UNKNOWN | 500ms | UNKNOWN |

**Note on Flow 3 serial depth:** 5 serial DB round-trips in a single `load()` call means each individual query budget of 150ms compounds. At 150ms average, total DAL time reaches ~750ms, which exceeds the 500ms DAL budget. This warrants monitoring in production.

---

## CACHE OBSERVATIONS

| Cache | Caller | Status | Evidence | Impact |
|---|---|---|---|---|
| resolvedProfileId (useRef) | useQrLinks | MISS on first mount, HIT thereafter | Source line 37: `if (!resolvedProfileId.current)` | Saves 1 vport.profiles read on reload |
| Zustand identity store | useIdentity | HIT (pre-loaded) | Platform-wide identity hydration | 0 DB cost on flyer screen |
| useVportOwnership state | useVportOwnership | MISS on every focus/visibility event | No ref cache on ownership result | Repeated reads on tab-switch |
| useVportPublicDetails state | hook useState | MISS on every mount | No TTL/ref cache | Re-reads on remount |

---

## RENDER / HOOK CHURN

| Component/Hook | Re-trigger Source | DB Impact | Risk |
|---|---|---|---|
| useVportOwnership | window focus + visibilitychange | 1–2 DB reads per event | WATCH — no debounce |
| useVportPublicDetails | actorId change only | 1–2 DB reads | LOW — stable dependency |
| useQrLinks | actorId change + load() calls | 2–5 DB reads per load | LOW — ref cache guards profile resolution |

---

## LOKI RUNTIME FINDINGS

---

### LOKI RUNTIME FINDING — LF-001

- **Finding ID:** LF-001
- **Location:** `apps/VCSM/src/features/booking/dal/getVportProfileIdByActorId.dal.js` — catch block line 26
- **Application Scope:** VCSM
- **Runtime Risk Category:** Cache bypass / silent failure
- **Evidence Type:** INFERRED
- **Observation Source:** Static source analysis — `catch { return null; }` pattern
- **Confidence:** HIGH
- **Current runtime behavior:** Any error from `vport.profiles` query (network, RLS, schema) returns `null`. `useQrLinks` sees `null` profileId, sets `qrLinks = []`, and exits without setting `error` state. The `catch(e) { setError(e) }` in `load()` never fires because the null path returns early without throwing.
- **Runtime impact:** QR panel silently shows empty list on DB/RLS error. Owner sees no error. Production operators see no signal.
- **Read Amplification:** N/A — no reads occur when null is returned
- **Timing impact:** Minimal
- **Caller chain:** useQrLinks → resolveVportProfileIdController → getVportProfileIdByActorIdDAL → catch → null
- **Cache status:** resolvedProfileId.current stays null; retries on next load() but same failure recurs silently
- **Severity:** MEDIUM
- **Recommended handoff:** VENOM (trust boundary — null bypass could be exploited if null is incorrectly treated downstream), DEADPOOL (silent failure root cause)
- **Rationale:** A booking-adjacent identity resolution failure that silently produces an empty list is a debugging and trust-boundary concern. The null return was intentional for simplicity but removes all error observability.

---

### LOKI RUNTIME FINDING — LF-002

- **Finding ID:** LF-002
- **Location:** `apps/VCSM/src/features/dashboard/vport/hooks/useVportOwnership.js` — lines 32-34, 45-57
- **Application Scope:** VCSM
- **Runtime Risk Category:** Cache bypass + repeated auth/context reads
- **Evidence Type:** INFERRED
- **Observation Source:** Static source — event listeners on focus and visibilitychange with no debounce
- **Confidence:** HIGH
- **Current runtime behavior:** Every window focus or tab visibility restore triggers a full ownership re-check: 1 DB read (acting-as mode) or 2 DB reads (user owns vport mode). No debounce, no minimum interval, no backoff.
- **Runtime impact:** A user rapidly switching tabs while on the flyer viewer will fire repeated `vc.actors` + `vc.actor_owners` reads. Under normal use this is acceptable; under automated tooling or rapid switching, it could cause query bursts.
- **Read Amplification:** 1–2 reads per focus event
- **Timing impact:** Each event adds 150–300ms of serial DB time
- **Caller chain:** window/focus event → check(false) → checkVportOwnershipController → dalGetActorById / dalReadActorOwnerLink
- **Cache status:** BYPASS — no caching of ownership result between events
- **Severity:** LOW
- **Recommended handoff:** KRAVEN (performance — debounce recommendation)
- **Rationale:** Intentional design for revocation detection, but unguarded. A 30-second minimum interval or leading-edge debounce would eliminate redundant reads without compromising the security property.

---

### LOKI RUNTIME FINDING — LF-003

- **Finding ID:** LF-003
- **Location:** `apps/VCSM/src/features/dashboard/vport/controller/checkVportOwnership.controller.js` — catch block line 16-18
- **Application Scope:** VCSM
- **Runtime Risk Category:** Silent bottleneck / observability gap
- **Evidence Type:** INFERRED
- **Observation Source:** Static source — `catch { return false; }`
- **Confidence:** HIGH
- **Current runtime behavior:** Any DB error, network timeout, or RLS rejection during ownership check is silently converted to `isOwner = false`. The flyer viewer shows "You can only view flyers for your own vport" to an authenticated owner during a DB outage.
- **Runtime impact:** Owner is incorrectly denied access during DB instability. They see a misleading message with no indication of a system error.
- **Read Amplification:** N/A
- **Timing impact:** N/A
- **Caller chain:** useVportOwnership → checkVportOwnershipController → catch → return false → setIsOwner(false)
- **Cache status:** N/A
- **Severity:** MEDIUM
- **Recommended handoff:** DEADPOOL (runtime bug — incorrect error messaging on infra failure), SENTRY (captureMonitoringError candidate)
- **Rationale:** Ownership check errors should be distinguishable from ownership denial. The current pattern conflates two distinct states.

---

### LOKI RUNTIME FINDING — LF-004

- **Finding ID:** LF-004
- **Location:** `apps/VCSM/src/features/public/vportMenu/hooks/useVportPublicDetails.js` — catch block line 24-26
- **Application Scope:** VCSM
- **Runtime Risk Category:** Observability gap
- **Evidence Type:** INFERRED
- **Observation Source:** Static source — catch sets local error state only
- **Confidence:** HIGH
- **Current runtime behavior:** DAL throws (schema error, RLS, network timeout) → caught → `setError(err)` → loading stops → UI shows whatever the error component renders. No `captureMonitoringError` fires. Public menu page failure is invisible to production operators.
- **Runtime impact:** Public-facing VPORT menu pages can fail silently from an operations perspective. A misconfigured RLS policy or schema breakage would only surface via user complaints.
- **Read Amplification:** N/A
- **Timing impact:** N/A
- **Caller chain:** useVportPublicDetails → catch(err) → setError(err) [no monitoring]
- **Cache status:** N/A
- **Severity:** MEDIUM
- **Recommended handoff:** SENTRY (captureMonitoringError candidate — public-facing page failure)
- **Rationale:** This is a public-facing route. Failures here affect non-authenticated visitors and external site embeds (e.g. tripointlockandkeys.com). Operational visibility matters.

---

### LOKI RUNTIME FINDING — LF-005

- **Finding ID:** LF-005
- **Location:** `apps/VCSM/src/features/public/vportMenu/dal/readVportPublicDetails.rpc.dal.js` — lines 30-57
- **Application Scope:** VCSM
- **Runtime Risk Category:** Serial bottleneck (conditional)
- **Evidence Type:** INFERRED
- **Observation Source:** Static source — sequential await pattern with conditional second query
- **Confidence:** HIGH
- **Current runtime behavior:** When a VPORT has no menu items, the fallback to `vport.public_actor_seo_v` fires as a second serial DB read. No logging distinguishes this path from the primary path. If the fallback is frequently triggered (many VPORTs have no menu items yet), this doubles the DB load for this route.
- **Runtime impact:** 2x DB reads for VPORTs without menu items. No operational signal when fallback fires.
- **Read Amplification:** 2.0 in fallback case
- **Timing impact:** +1 serial DB read (~150ms additional)
- **Caller chain:** readVportPublicDetailsRpcDAL → primary query null → fallback query
- **Cache status:** No cache on either path
- **Severity:** LOW
- **Recommended handoff:** KRAVEN (performance — cache or signal the fallback path), LOGAN (document the fallback contract clearly)
- **Rationale:** Expected and correct behavior, but unobservable. Knowing the fallback hit rate would inform whether primary view population (menu items) is a blocking issue for VPORT onboarding.

---

### LOKI RUNTIME FINDING — LF-006

- **Finding ID:** LF-006
- **Location:** `engines/booking/src/controller/listQrLinks.controller.js` — lines 46-54 (Branch B serial pattern)
- **Application Scope:** ENGINE
- **Runtime Risk Category:** Serial bottleneck
- **Evidence Type:** INFERRED
- **Observation Source:** Static source — sequential await chain
- **Confidence:** MEDIUM
- **Current runtime behavior:** In delegated management case (Branch B), `listQrLinksByProfile` executes: `dalGetActorByProfileId` → `assertActorOwnsVportActor` (which itself does `dalGetActorById` + `dalReadActorOwnerLink`) → `dalListQrLinksByProfile`. This is 4 serial DB reads before the data fetch.
- **Runtime impact:** 4 serial reads at ~150ms each = ~600ms before any QR link data is returned. This exceeds the 500ms DAL budget.
- **Read Amplification:** 5 total reads (including profile resolution in hook) for delegated case
- **Timing impact:** Potential 750ms+ DAL time in worst case
- **Caller chain:** useQrLinks → listQrLinksByProfile → dalGetActorByProfileId → assertActorOwnsVportActor → dalGetActorById → dalReadActorOwnerLink → dalListQrLinksByProfile
- **Cache status:** No caching at engine layer
- **Severity:** MEDIUM
- **Recommended handoff:** KRAVEN (performance — parallelization or batching opportunity)
- **Rationale:** The `dalGetActorByProfileId` call already retrieves the target actor. The result could be passed into `assertActorOwnsVportActor` to avoid a second actor lookup, reducing to 3 reads. This is a clean structural improvement with no security tradeoff.

---

### LOKI RUNTIME FINDING — LF-007

- **Finding ID:** LF-007
- **Location:** `apps/VCSM/src/features/booking/hooks/useQrLinks.js` — lines 60-72 (addQrLink)
- **Application Scope:** VCSM
- **Runtime Risk Category:** Observability gap
- **Evidence Type:** INFERRED
- **Observation Source:** Static source — catch returns `{ ok: false }` with no monitoring
- **Confidence:** HIGH
- **Current runtime behavior:** `createQrLink` failure is caught, error is set in local state, and `{ ok: false, error: e }` is returned to caller. No `captureMonitoringError` fires. A booking mutation failure (QR link creation) is invisible to production operators.
- **Runtime impact:** Failed QR link creations produce no monitoring signal. Operators cannot distinguish a RLS failure, a schema constraint violation, or a network timeout.
- **Read Amplification:** N/A
- **Timing impact:** N/A
- **Caller chain:** addQrLink → createQrLink (engine) → catch(e) → setError(e) [no monitoring]
- **Cache status:** N/A
- **Severity:** MEDIUM
- **Recommended handoff:** SENTRY (captureMonitoringError — booking mutation failure)
- **Rationale:** QR link creation is a booking-adjacent mutation. Failures affect a revenue-adjacent workflow and should be visible to production operators.

---

## SENTRY MONITORING GAP REVIEW

| Flow | Location | Current Behavior | Auto-Captured? | Missing Signal | Severity | Recommendation |
|---|---|---|---|---|---|---|
| Public menu | useVportPublicDetails catch | Sets local error state | NO | DAL/RLS/network failures on public-facing route | MEDIUM | Add captureMonitoringError |
| Flyer viewer | checkVportOwnership catch | Returns false silently | NO | Ownership check failures during DB instability | MEDIUM | Add captureMonitoringError |
| QR links — profile resolve | getVportProfileIdByActorIdDAL catch | Returns null silently | NO | vport.profiles lookup failures | MEDIUM | Throw instead of return null, or log before returning |
| QR links — list | useQrLinks catch(e) | Sets error state | NO (handled) | Engine assertion/DB failures on list read | MEDIUM | Add captureMonitoringError |
| QR links — create | addQrLink catch(e) | Returns {ok:false} | NO (handled) | Booking mutation failure | MEDIUM | Add captureMonitoringError |

---

## SENTRY INSTRUMENTATION RECOMMENDATIONS

### REC-001

```
SENTRY INSTRUMENTATION RECOMMENDATION
Location: apps/VCSM/src/features/public/vportMenu/hooks/useVportPublicDetails.js — catch block
Failure type: Public-facing DAL failure (RLS, schema, network)
Current behavior: Sets local error state only
Why Sentry does not see it: Handled catch does not throw; RouteErrorBoundary not reached
Recommended call:
  captureMonitoringError(err, {
    feature: 'vportPublicMenu',
    hook: 'useVportPublicDetails',
    operation: 'fetchPublicDetails',
    actorId,
    stage: 'dal_read'
  })
Production-safe: YES — no PII, no tokens, no session data
Noise risk: LOW — only fires on unexpected DAL failures
Payload: sanitized metadata only
Owner: LOKI → SENTRY
```

### REC-002

```
SENTRY INSTRUMENTATION RECOMMENDATION
Location: apps/VCSM/src/features/dashboard/vport/controller/checkVportOwnership.controller.js — catch block
Failure type: Ownership verification failure during DB instability
Current behavior: Returns false silently, showing misleading "not owner" message
Why Sentry does not see it: Handled catch; no throw reaches global handler
Recommended call:
  captureMonitoringError(err, {
    feature: 'flyerViewer',
    controller: 'checkVportOwnership',
    operation: 'ownershipCheck',
    callerActorId,
    targetActorId,
    stage: 'ownership_verify'
  })
Production-safe: YES — actorId is non-sensitive in app convention
Noise risk: LOW — ownership checks rarely fail due to infrastructure
Payload: sanitized metadata only
Owner: LOKI → SENTRY
```

### REC-003

```
SENTRY INSTRUMENTATION RECOMMENDATION
Location: apps/VCSM/src/features/booking/hooks/useQrLinks.js — addQrLink catch block
Failure type: QR link creation mutation failure
Current behavior: Returns {ok:false, error} to caller, sets local error state, no monitoring
Why Sentry does not see it: Handled catch; booking engine errors do not propagate to RouteErrorBoundary
Recommended call:
  captureMonitoringError(e, {
    feature: 'qrLinks',
    hook: 'useQrLinks',
    operation: 'createQrLink',
    actorId,
    stage: 'mutation'
  })
Production-safe: YES
Noise risk: MEDIUM — user errors (duplicate slug, constraint violations) would also fire; add error.code filter
Payload: sanitized metadata only; exclude booking notes, profile data
Owner: LOKI → SENTRY
```

### REC-004

```
SENTRY INSTRUMENTATION RECOMMENDATION
Location: apps/VCSM/src/features/booking/hooks/useQrLinks.js — load() catch block
Failure type: QR list read failure (engine assertion or DB error)
Current behavior: Sets local error state, no monitoring
Why Sentry does not see it: Handled catch block in hook
Recommended call:
  captureMonitoringError(e, {
    feature: 'qrLinks',
    hook: 'useQrLinks',
    operation: 'listQrLinks',
    actorId,
    stage: 'list_read'
  })
Production-safe: YES
Noise risk: LOW — list reads rarely fail for authenticated owners
Payload: sanitized metadata only
Owner: LOKI → SENTRY
```

---

## OBSERVABILITY GAP REVIEW

| Flow | Current Visibility | Missing Signals | Severity | Recommended Instrumentation |
|---|---|---|---|---|
| Public menu primary read | None — no logging on success or failure | Fallback path firing, DAL errors | MEDIUM | Log fallback trigger; captureMonitoringError on DAL throw |
| Public menu fallback read | None | Frequency of fallback, seoData null path | LOW | Dev-only log on fallback branch |
| Flyer viewer ownership check | None | Check failures vs. check successes | MEDIUM | captureMonitoringError on catch |
| Flyer viewer focus re-check | None | Re-check frequency, result changes | LOW | Dev-only counter/log |
| QR profile resolution | None — null returned silently | DB/RLS errors vs. genuine missing profiles | MEDIUM | Distinguish error null from not-found null |
| QR list read | Local error state only | Engine assertion failures, DB errors | MEDIUM | captureMonitoringError in load() catch |
| QR create mutation | Local error state only | Mutation failures by error type | MEDIUM | captureMonitoringError in addQrLink catch |

---

## AUDIT TRAIL WARNINGS

### AUDIT TRAIL WARNING — AT-001

```
Flow: QR link creation (addQrLink → createQrLink engine)
Missing audit evidence: No correlation ID or traceId on QR link creation
Operational risk: Cannot trace a created QR link back to the originating actor session
Recommended audit event: Log { actorId, profileId, qrLinkId, qrType, slug, timestamp } on successful creation
```

### AUDIT TRAIL WARNING — AT-002

```
Flow: Ownership verification (useVportOwnership re-check on focus)
Missing audit evidence: No record of ownership re-verification events or result changes
Operational risk: Cannot detect ownership revocation race conditions in production
Recommended audit event: Dev-only log when isOwner result changes between initial check and re-check
```

---

## CORRELATION ID REVIEW

| Flow | Correlation Present | Risk | Recommendation |
|---|---|---|---|
| Public menu page load | NO | LOW — read-only, public | Not required |
| Flyer viewer ownership check | NO | MEDIUM — gated access | Add sessionCorrelationId to ownership check |
| QR link creation | NO | MEDIUM — booking-adjacent mutation | Add traceId to createQrLink call |
| QR list load | NO | LOW — read operation | Not required |

---

## HANDOFF MATRIX

| Finding | Recommended Handoff | Reason |
|---|---|---|
| LF-001 — getVportProfileId silent null | VENOM + DEADPOOL | Trust-boundary null bypass + silent failure root cause |
| LF-002 — Ownership focus re-check (no debounce) | KRAVEN | Performance — repeated auth reads without rate-limit |
| LF-003 — checkVportOwnership swallows errors | DEADPOOL + SENTRY | Runtime bug (wrong message on infra failure) + monitoring gap |
| LF-004 — useVportPublicDetails no monitoring | SENTRY | Public-facing route failure invisible to operators |
| LF-005 — Fallback path unobservable | KRAVEN + LOGAN | Performance signal missing + contract documentation |
| LF-006 — listQrLinks serial 4-read chain | KRAVEN | Serial bottleneck exceeding DAL time budget |
| LF-007 — addQrLink no monitoring | SENTRY | Booking mutation failure invisible to operators |

---

## OBSERVABILITY GOVERNANCE STATUS

| Area | Coverage | Missing Visibility | Risk |
|---|---|---|---|
| Public menu DAL errors | NONE | All failure modes | MEDIUM |
| Flyer viewer ownership errors | NONE | Infrastructure failures vs. auth denial | MEDIUM |
| QR profile resolution errors | NONE | DB vs. not-found distinction | MEDIUM |
| QR list read errors | LOCAL ONLY | No operator signal | MEDIUM |
| QR mutation errors | LOCAL ONLY | No operator signal | MEDIUM |
| Fallback path usage | NONE | VPORT onboarding health signal | LOW |
| Ownership re-check frequency | NONE | Query burst detection | LOW |

---

## OBSERVABILITY MATURITY

**Current rating: BASIC**

Major flows have local error state (visible to users), but no production operator signals exist for any of the three changed flows. Runtime reconstruction after an incident is not possible without DB query logs. No correlation IDs exist on mutation paths.

---

## LOKI SUMMARY

```
FLOW: Public Menu Page
Entry: /profile/:slug/menu
Chain:
  useVportPublicDetails → getVportPublicDetailsController → readVportPublicDetailsRpcDAL
  → vport.public_menu_read_model_v (round-trips: 1, happy path)
  → vport.public_actor_seo_v (round-trips: 1, fallback only)
Total round-trips on mount: 1–2
N+1 risk: NO
Cache: None — remount fires fresh reads
Observability gaps: DAL errors swallowed with no monitoring, fallback path unobservable
```

```
FLOW: Flyer Viewer
Entry: /actor/:actorId/menu/flyer
Chain:
  useIdentity (Zustand — cached, 0 DB) +
  useVportOwnership → checkVportOwnershipController
    → [acting-as] dalGetActorById → vc.actors (round-trips: 1)
    → [user-owns] dalGetActorById + dalReadActorOwnerLink → vc.actors + vc.actor_owners (round-trips: 2)
Total round-trips on mount: 1–2
N+1 risk: NO
Cache: None on ownership; identity cached in Zustand
Observability gaps: Ownership catch swallows all errors silently; focus re-check unbounded
```

```
FLOW: QR Links Dashboard Panel
Entry: BookingQrLinksPanel
Chain:
  useQrLinks → resolveVportProfileIdController → getVportProfileIdByActorIdDAL
    → vport.profiles (round-trips: 1, first mount only — ref-cached)
  → listQrLinksByProfile → dalGetActorByProfileId → vc.actors (round-trips: 1)
    → [self] dalListQrLinksByProfile → vport.qr_links (round-trips: 1)
    → [delegated] assertActorOwnsVportActor → vc.actors + vc.actor_owners + dalListQrLinksByProfile (round-trips: 3)
Total round-trips on mount: 3 (self) / 5 (delegated)
N+1 risk: NO (fixed lookups, not per-row fan-out)
Cache: resolvedProfileId.current (ref) — correctly invalidated on actorId change; no engine-layer cache
Observability gaps: Profile resolution null is silent; load/mutation errors have no monitoring calls; 5-read serial chain may exceed DAL time budget
```

---

## LOKI SUMMARY TABLE

| Flow | Round-trips | N+1 Risk | Cache | Observability Gaps |
|---|---|---|---|---|
| Public menu (happy) | 1 | NO | None | DAL errors invisible to operators |
| Public menu (fallback) | 2 | NO | None | Fallback path unobservable |
| Flyer viewer (acting-as) | 1 | NO | Identity cached | Ownership errors silently return false |
| Flyer viewer (user owns) | 2 | NO | Identity cached | Same; focus re-check unbounded |
| QR links — self, first mount | 3 | NO | Ref cache (profiles) | Profile null silent; no monitoring on errors |
| QR links — delegated, first mount | 5 | NO | Ref cache (profiles) | Serial 5-read chain; DAL budget risk |
| QR links — subsequent mount | 2 | NO | Ref cache active | Same monitoring gaps |

---

## FINAL LOKI STATUS: WATCH

**OVERALL POSTURE: WATCH**

No critical N+1 patterns or runaway loops exist. The primary concern is a uniform absence of production monitoring across all three changed flows — every error path either returns null silently or sets local state only, leaving production operators blind to failures on booking-adjacent and public-facing routes. The 5-read serial chain in delegated QR management warrants a timing measurement in production before any optimization work begins.
