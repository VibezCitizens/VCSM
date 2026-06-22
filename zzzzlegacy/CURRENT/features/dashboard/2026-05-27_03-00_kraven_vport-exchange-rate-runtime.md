# KRAVEN PERFORMANCE REPORT

**Date:** 2026-05-27
**Time:** 03:00
**Scope:** VCSM
**Target:** VPORT Exchange Rate Dashboard — full runtime path analysis
**Evidence type:** INFERRED (static source tracing — no live LOKI trace available)
**LOKI Evidence Status:** MISSING — findings are statically inferred, confidence HIGH for DB read counts, MEDIUM for latency estimates

---

## KRAVEN TARGET

```
Feature / Route:   /actor/:actorId/dashboard/exchange
Application Scope: VCSM
Entry point:       VportDashboardExchangeScreen (lazy)
Reason:            Post-fix runtime audit — verify stale-read closure, count DB reads, trace publish latency
```

---

## RUNTIME CRITICALITY REVIEW

| Area | Criticality | Reason |
|---|---|---|
| Exchange screen mount | Background-only | Owner-only dashboard surface, not in critical user acquisition path |
| Rate write (upsert) | Background-only | Internal owner action |
| Feed publish path | Background-only | Optional, non-blocking after save |
| Cache invalidation | Background-only | Correctness impact, not latency-critical |
| Ownership verification | Identity-critical | Security gate on every mount and write |

---

## LOKI EVIDENCE STATUS

**MISSING** — No live runtime traces available. All findings are derived from static source tracing.
Consequence: DB read counts are exact (code is deterministic), latency estimates are approximate.
Recommendation: LOKI trace recommended for publish path latency and ownership re-verify frequency before any optimization is applied.

---

## RUNTIME EVIDENCE

```
RUNTIME EVIDENCE — Cold Mount (all TTL caches empty)

Observed controllers:
  checkVportOwnershipController      → vc.actors, vc.actor_owners
  getVportRatesController            → vport.profiles (via resolveVportProfileId), vport.rates

Observed DAL calls (cold, non-self-owned path):
  getActorByIdDAL                    → vc.actors          (no cache)
  readActorOwnerLinkByActorAndUserProfileDAL → vc.actor_owners  (no cache)
  resolveVportProfileId              → vport.profiles.id  (30s TTL, MISS on cold)
  readVportRatesByActorDal           → vport.rates         (60s TTL, MISS on cold)

Observed tables (mount):
  vc.actors           — 1 read (actor kind/profile_id lookup)
  vc.actor_owners     — 1 read (ownership link lookup)
  vport.profiles      — 1 read (profile_id resolution)
  vport.rates         — 1 read (rate list)

Duplicate read signals:
  vport.profiles accessed AGAIN on publish path (resolveVportExchangeNameDAL → name column)
  vc.actors + vc.actor_owners accessed AGAIN on write path (assertActorOwnsVportActorController)

Timing observations (inferred):
  Each DB round-trip: ~10-40ms depending on Supabase region
  Cold mount estimated: 4 sequential reads ≈ 40-160ms
  Warm mount estimated: 2 reads ≈ 20-80ms
```

---

## DB READ COUNT BREAKDOWN

### Cold mount — user owns vport (non-self path)

| Step | Table | Schema | Cache | Read# |
|---|---|---|---|---|
| checkVportOwnershipController: getActorByIdDAL | vc.actors | vc | NONE | 1 |
| checkVportOwnershipController: readActorOwnerLinkByActorAndUserProfileDAL | vc.actor_owners | vc | NONE | 2 |
| readVportRatesByActorDal: resolveVportProfileId | vport.profiles | vport | MISS (cold) | 3 |
| readVportRatesByActorDal: rate list | vport.rates | vport | MISS (cold) | 4 |

**Total cold mount (non-self): 4 DB reads — all sequential**

### Cold mount — self-owned VPORT (acting-as mode)

| Step | Table | Cache | Read# |
|---|---|---|---|
| checkVportOwnershipController: getActorByIdDAL | vc.actors | NONE | 1 |
| resolveVportProfileId | vport.profiles | MISS | 2 |
| vport.rates | vport.rates | MISS | 3 |

**Total cold mount (acting-as): 3 DB reads**

### Warm mount (rates cache + profileId cache hot, ownership always uncached)

| Step | Cache | Read# |
|---|---|---|
| getActorByIdDAL (ownership) | NONE — always reads | 1 |
| readActorOwnerLinkByActorAndUserProfileDAL (ownership) | NONE — always reads | 2 |
| resolveVportProfileId | HIT — 0 reads | — |
| readVportRatesByActorDal | HIT — 0 reads | — |

**Total warm mount: 2 DB reads (ownership re-verification, unavoidable by design)**

---

## STALE-READ-AFTER-WRITE VERIFICATION — ✅ CONFIRMED CLOSED

**Before P1 fix:**
```
upsertVportRateDal() → success
invalidateRatesCache() ← NOT CALLED
refreshSeed bump → useVportRates effect re-runs
readVportRatesByActorDal cache check → HIT (60s TTL still warm)
→ stale rate data returned
→ optimistic UI compensated visually, but data layer stale
```

**After P1 fix:**
```
upsertVportRateDal() → success
invalidateRatesCache() ← NOW CALLED (line 28, upsertVportRate.controller.js)
refreshSeed bump → useVportRates effect re-runs
readVportRatesByActorDal cache check → MISS (just invalidated)
→ fresh vport.rates SELECT
→ persisted data matches DB state
```

**Verdict: Stale-read path is CONFIRMED CLOSED. No stale window remains after write.**

---

## WRITE PATH ANALYSIS

Full write (save new rate, no publish):

| Step | Operation | Table | Cache |
|---|---|---|---|
| assertActorOwnsVportActorController: getActorByIdDAL | READ | vc.actors | NONE |
| assertActorOwnsVportActorController: readActorOwnerLinkByActorAndUserProfileDAL | READ | vc.actor_owners | NONE |
| resolveVportProfileId (in upsertVportRateDal) | READ | vport.profiles | 30s TTL — likely WARM |
| upsertVportRateDal | WRITE | vport.rates | N/A |
| invalidateRatesCache() | INVALIDATE | (memory) | N/A |
| post-write re-read: resolveVportProfileId | READ | vport.profiles | 30s TTL — HIT |
| post-write re-read: vport.rates | READ | vport.rates | MISS (just invalidated) |

**Total write path: 2 uncached auth reads + 1 profile write-time read (warm) + 1 DB write + 1 fresh re-read = 5 DB operations**

---

## EXCHANGE PUBLISH PATH ANALYSIS

When `shareToFeed = true` after successful save (publish is optional and non-blocking):

| Step | Operation | Table | Cache | Sequential? |
|---|---|---|---|---|
| hasRecentExchangeRatePostDAL | READ | vc.posts | NONE | MUST be first (gate) |
| resolveVportExchangeNameDAL | READ | vport.profiles (name) | NONE | Independent of step 3 |
| supabase.auth.getUser() | READ | auth session | session cache | Independent of step 2 |
| insertPost() | WRITE | vc.posts | N/A | After steps 1-3 |

**3 reads + 1 write, all sequential in current implementation**

**Critical gap:** Steps 2 and 3 are independent. `resolveVportExchangeNameDAL` and `supabase.auth.getUser()` could run in parallel — they have no dependency on each other.

**Cache gap:** `resolveVportExchangeNameDAL` queries `vport.profiles.name` with **no cache**. `resolveVportProfileId` already queries `vport.profiles.id` with a 30s TTL cache. Same table, same row, different columns, different functions, different cache strategies. On the write path, `vport.profiles` is hit **twice in the same user action** — once for the profile_id (write DAL, 30s cache) and once for the name (publish controller, no cache).

---

## DUPLICATE HYDRATION ANALYSIS

### vport.profiles read frequency per save+publish action

| Call | Column | Function | Cache | Fires when |
|---|---|---|---|---|
| upsertVportRateDal → resolveVportProfileId | id | resolveVportProfileId.dal.js | 30s TTL | Always on save |
| publishExchangeRateUpdateAsPost → resolveVportExchangeNameDAL | name | vportExchangeRatePost.read.dal.js | NONE | Only if shareToFeed=true |

**Result: vport.profiles is read TWICE per save+publish action (same row, different columns, different functions)**

This is a **DUPLICATE TABLE HYDRATION** pattern. Both calls target the same `vport.profiles` row for the same actorId. The profile name should be resolvable from the already-cached profile lookup.

---

## QUERY AMPLIFICATION ANALYSIS

| Runtime Path | Primary Records | DB Operations | Amplification | Severity |
|---|---:|---:|---:|---|
| Cold screen mount (non-self) | 1 vport rate list | 4 | 4× | ELEVATED |
| Cold screen mount (acting-as) | 1 vport rate list | 3 | 3× | ELEVATED |
| Warm screen mount | 1 vport rate list | 2 | 2× | HEALTHY (ownership unavoidable) |
| Write path (no publish) | 1 rate row | 5 | 5× | ELEVATED |
| Write path + publish | 1 rate row + 1 post | 9 | 4.5× | ELEVATED |
| Window focus re-verify | 0 (UI refresh) | 1–2 | ∞ | WATCH |

**No SEVERE or CRITICAL amplification detected. ELEVATED ratings are structurally acceptable given ownership defense-in-depth requirement.**

---

## WATERFALL DETECTION

| Caller Chain | Serial Operations | Estimated Delay | Optimization Opportunity |
|---|---:|---:|---|
| Publish path: dedup → name → auth → insert | 4 sequential | ~40–160ms | Steps 2+3 can be parallelized |
| Write path: assertOwnership → upsert → invalidate → re-read | 5 sequential | ~50–200ms | Profile resolution cached (step 3 is fast after warm) |
| Mount ownership: getActor → getOwnerLink | 2 sequential | ~20–80ms | No cache — by design |

---

## CACHE EFFICIENCY REVIEW

| Cache Area | Status | Problem | Runtime Impact |
|---|---|---|---|
| readVportRatesByActorDal (60s TTL) | EFFECTIVE | Invalidation now correctly wired via invalidateRatesCache() | LOW — no stale reads after P1 fix |
| resolveVportProfileId (30s TTL) | EFFECTIVE | Works correctly, shared across read + write path | LOW |
| resolveVportExchangeNameDAL | INEFFECTIVE | No cache — queries vport.profiles.name on every publish | MEDIUM — 1 extra round-trip per publish |
| checkVportOwnershipController (useVportOwnership) | BYPASSED | No cache — fires on mount, window focus, visibilitychange | LOW-MEDIUM — repeated but intentional |
| getActorByIdDAL | BYPASSED | No cache — used in ownership chain on every verify | LOW — single-row SELECT, fast |

---

## PAYLOAD / HYDRATION REVIEW

| Runtime Area | Payload Risk | Hydration Risk | Cause |
|---|---|---|---|
| vport.rates list | NONE | NONE | Explicit select, no bloat |
| Ownership verification response | NONE | NONE | Small row, not surfaced to client |
| Exchange post text | NONE | NONE | Formatted string, no embedded objects |
| Rate domain objects | NONE | NONE | 9 fields, all primitive |

---

## CONTROLLER FAN-OUT REVIEW

| Controller | DAL Calls | Dependencies | Risk |
|---|---:|---:|---|
| getVportRatesController | 2 (resolveProfileId + ratesRead) | model layer only | HEALTHY |
| upsertVportRateController | 3 (assertOwns×2 + upsert + invalidate) | booking.adapter | HEALTHY |
| publishExchangeRateUpdateAsPostController | 4 (dedup + name + auth + insert) | posts.adapter | MODERATE (serial chain) |
| checkVportOwnershipController | 2 (getActor + getOwnerLink) | booking.adapter | HEALTHY |

---

## PERFORMANCE PATTERNS

```
Duplicate reads:       YES — vport.profiles read twice per save+publish (id + name, separate uncached queries)
N+1 suspicion:         NONE — no loops over DB records
Serial async chains:   YES — publish path steps 2+3 independent but sequential
Controller fan-out:    MODERATE — publishExchangeRateUpdateAsPostController (4 steps)
Cache miss patterns:   resolveVportExchangeNameDAL has no cache
Payload size risk:     NONE
Hydration cost signals: NONE
```

---

## KRAVEN PERFORMANCE FINDINGS

---

### KRAVEN PERFORMANCE FINDING — KPF-001

- **Finding ID:** KPF-001
- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/dal/exchange/vportExchangeRatePost.read.dal.js` — `resolveVportExchangeNameDAL`
- **Application Scope:** VCSM
- **Runtime Criticality:** Background-only
- **Evidence Type:** INFERRED
- **Observation Source:** Static source trace
- **Confidence:** HIGH
- **Current runtime behavior:** On every exchange rate feed publish, `resolveVportExchangeNameDAL` issues a fresh `SELECT name FROM vport.profiles WHERE actor_id = $1`. No cache. Same table row already cached by `resolveVportProfileId` (30s TTL) — but that function only retrieves `id`, not `name`.
- **Detected pattern:** Duplicate table hydration — same `vport.profiles` row accessed twice per save+publish action (once for `id` via cached helper, once for `name` via uncached helper)
- **Query Amplification:** +1 DB read per publish
- **Payload/Hydration Impact:** LOW
- **Controller Fan-Out:** Moderate (4 steps in publishExchangeRateUpdateAsPostController)
- **Cache Efficiency:** INEFFECTIVE for name lookup
- **Blast Radius:** Single feature — exchange publish path only
- **Estimated impact:** LOW — 1 extra round-trip per optional publish (~10–40ms)
- **Root cause hypothesis:** `resolveVportExchangeNameDAL` was written independently from `resolveVportProfileId`. Both query the same table but neither was designed to share the result.
- **Recommended optimization:** Extend `resolveVportProfileId` to accept an optional `columns` argument and cache both `id` and `name` together. Or create a `resolveVportProfileData(actorId)` helper that returns `{ id, name }` and caches the combined result. Both functions then become consumers of one cached lookup.
- **Optimization ROI:** MODERATE — eliminates 1 DB round-trip per publish, simplifies two separate lookup functions
- **Architectural/Security Risk:** LOW — pure read path, no ownership or trust boundary concerns
- **Expected improvement:** -1 DB read per optional publish; single cached vport profile resolver
- **Recommended handoff:** Wolverine (P3 cleanup)
- **Rationale:** The publish path is optional and non-blocking. The extra round-trip does not affect perceived performance significantly. But consolidating the two profile helpers is the correct long-term pattern.

---

### KRAVEN PERFORMANCE FINDING — KPF-002

- **Finding ID:** KPF-002
- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/exchange/publishExchangeRateUpdateAsPost.controller.js` lines 32–47
- **Application Scope:** VCSM
- **Runtime Criticality:** Background-only
- **Evidence Type:** INFERRED
- **Observation Source:** Static source trace
- **Confidence:** HIGH
- **Current runtime behavior:** `resolveVportExchangeNameDAL(actorId)` and `supabase.auth.getUser()` are called sequentially with `await`. They have no dependency on each other — the exchange name does not depend on the auth session, and the auth session does not depend on the name.
- **Detected pattern:** Serial async chain — two independent I/O operations executed sequentially
- **Query Amplification:** N/A (0 amplification — this is ordering, not duplication)
- **Cache Efficiency:** N/A
- **Blast Radius:** Single feature
- **Estimated impact:** LOW — ~10–40ms saved per publish by parallelizing two round-trips
- **Root cause hypothesis:** Controller was written with sequential awaits for simplicity. No shared dependency exists between the name lookup and auth session.
- **Recommended optimization:**
  ```js
  const [exchangeName, { data: { user } }] = await Promise.all([
    resolveVportExchangeNameDAL(actorId),
    supabase.auth.getUser(),
  ]);
  ```
- **Optimization ROI:** LOW — publish is optional and non-blocking (user doesn't wait on this path). Worth doing but not urgent.
- **Architectural/Security Risk:** NONE — both reads are independent, parallelization does not cross ownership or trust boundaries
- **Expected improvement:** -1 serial step in publish path (~10–40ms)
- **Recommended handoff:** Wolverine (P3, bundle with KPF-001 cleanup)

---

### KRAVEN PERFORMANCE FINDING — KPF-003 (INFORMATIONAL)

- **Finding ID:** KPF-003
- **Location:** `apps/VCSM/src/features/dashboard/vport/hooks/useVportOwnership.js` lines 44–57
- **Application Scope:** VCSM
- **Runtime Criticality:** Identity-critical
- **Evidence Type:** INFERRED
- **Observation Source:** Static source trace
- **Confidence:** HIGH
- **Current runtime behavior:** `useVportOwnership` registers `focus` and `visibilitychange` listeners. On every window focus or tab-return event, `checkVportOwnershipController` fires a background re-verification (1-2 DB reads: `vc.actors` + `vc.actor_owners`). These are intentional revocation detection reads.
- **Detected pattern:** Repeated uncached ownership reads on user attention events
- **Query Amplification:** Unbounded by window focus frequency — but each event = 1-2 reads
- **Cache Efficiency:** BYPASSED by design
- **Blast Radius:** All screens using `useVportOwnership`
- **Estimated impact:** LOW-MEDIUM — for users who frequently alt-tab or switch browser tabs during dashboard use, this produces repeated DB reads. Each re-verify is ~20-80ms, non-blocking (no loading state shown).
- **Root cause hypothesis:** Intentional defense-in-depth pattern. The hook comment explicitly states "Silent re-verify when user returns to the window." This is correct security posture.
- **Recommended optimization:** NOT recommended to cache or throttle the re-verify at this time. The revocation detection is a security control. If ownership re-verify frequency becomes a load concern at scale, add a short debounce (e.g. 5s minimum between re-verifies) to prevent rapid tab-switching from spamming the DB.
- **Optimization ROI:** LOW (and security trade-off involved)
- **Architectural/Security Risk:** MEDIUM — any throttling of ownership re-verification reduces revocation detection speed. Requires VENOM review before implementation.
- **Expected improvement:** Reduced DB load for active dashboard users who frequently change focus
- **Recommended handoff:** VENOM (consult before any throttle implementation)
- **Rationale:** Flagged for awareness only. This is intentional behavior. Do not optimize without VENOM sign-off.

---

## KRAVEN PRIORITY MATRIX

| Priority | Finding | Runtime Criticality | Estimated Impact | ROI | Severity |
|---|---|---|---|---|---|
| 1 | KPF-001 — vport.profiles duplicate read on publish | Background-only | LOW | MODERATE | LOW |
| 2 | KPF-002 — serial name+auth reads in publish controller | Background-only | LOW | LOW | LOW |
| 3 | KPF-003 — ownership re-verify on window focus (informational) | Identity-critical | LOW-MEDIUM | LOW (security trade-off) | LOW |

**No HIGH or CRITICAL findings. Module performance is healthy for its runtime criticality level.**

---

## OPTIMIZATION SAFETY REVIEW

| Optimization | Architectural Risk | Security Risk | Requires SENTRY/VENOM |
|---|---|---|---|
| KPF-001: Unify vport profile resolver | LOW — pure read refactor | NONE | SENTRY recommended (controller/DAL change) |
| KPF-002: Parallelize name+auth in publish | NONE — controller-local change | NONE | Not required |
| KPF-003: Debounce ownership re-verify | MEDIUM — reduces revocation detection window | MEDIUM | VENOM required before implementation |

---

## SUMMARY

| Question | Answer |
|---|---|
| DB reads on cold mount | **4** (non-self) / **3** (acting-as) |
| DB reads on warm mount | **2** (ownership always uncached, by design) |
| Stale-read-after-write | **CONFIRMED CLOSED** — invalidateRatesCache() wired correctly |
| Exchange publish path | **3 reads + 1 write, sequential** — 2 reads can be parallelized |
| Duplicate hydration | **YES** — vport.profiles read twice per save+publish (id cached, name not) |
| Critical bottlenecks | **NONE** |
| Release blockers | **NONE** |
