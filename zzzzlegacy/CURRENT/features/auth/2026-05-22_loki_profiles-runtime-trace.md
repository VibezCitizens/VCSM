# LOKI RUNTIME REPORT

**Application Scope:** VCSM
**Observed flow:** Actor profile page load — slug resolution → profile render → post grid
**Entry point:** `/@:username` → `ActorProfileScreen.jsx`
**Environment:** Static code analysis (no live runtime capture available)
**TypeScript output allowed:** NO
**Date:** 2026-05-22
**Reviewer:** LOKI
**Status:** WATCH — 2 HIGH, 3 MEDIUM, 1 LOW findings

---

## TRACE IDENTITY

- **Trace ID:** LOKI-PROFILES-2026-05-22-001
- **Route:** `/@:username` (primary public profile entry)
- **Screen:** `ActorProfileScreen.jsx` → `ActorProfileViewScreen.jsx`
- **Session state class:** authenticated Citizen (worst case for gate evaluation)
- **Evidence type:** INFERRED from static code analysis
- **Timestamp:** 2026-05-22

---

## RUNTIME SUMMARY

- **Total duration:** UNKNOWN (no live capture; budget assessed from chain analysis)
- **Primary records returned:** ~20 posts (standard page)
- **Total DB reads (estimated for 20-post load):** 8–12 distinct queries
- **Read Amplification Score:** ~0.4–0.6 per post (HEALTHY for post reads alone; see LF-004 for author concern)
- **Worst bottleneck:** Sequential gate → post fetch waterfall (3-step serial chain before posts load)
- **Cache behavior summary:** @hydration engine caches actor data (5min TTL) ✓; profile post grid has NO confirmed cache; rates DAL has 60s TTL ✓

---

## EXECUTION FLOW MAP

| Step | Operation | Caller | Mode | Dependency |
|---|---|---|---|---|
| 1 | Slug resolution | `useResolveActorBySlug` → `resolveActorBySlugController` → `resolveActorSlug.dal.js` | SEQUENTIAL | Entry — nothing blocks it |
| 2 | Actor kind resolution | `useActorKind` → `getActorKindController` → `readActorKind.dal.js` | SEQUENTIAL | Waits for Step 1 actorId |
| 3 | Profile gate evaluation | `useProfileGate` → `useActorPrivacy + useFollowStatus + useBlockStatus` | SEQUENTIAL | Waits for Step 2 kind; fires parallel internal reads |
| 4 | Profile view load | `useProfileView` → `getProfileViewController` → `Promise.all([readActorProfileDAL, readFollowStateDAL])` | PARALLEL (internal) | Waits for Step 3 gate result |
| 5 | Profile header seed | `useMemo + useActorStore` | INSTANT (cache) | No wait — hydration store seed if actor was previously cached |
| 6 | Post grid fetch | `useActorPosts` → `getActorPostsController` → `fetchPostsForActor.dal.js` | SEQUENTIAL | Gated: `enabled: !!actorId && canViewContent !== false` — waits for Step 3 |
| 7 | Post author resolution | Inside `fetchPostsForActor.dal.js` | SEQUENTIAL (per post batch) | Waits for Step 6 post query |
| 8 | Post media hydration | Inside `fetchPostsForActor.dal.js` | PARALLEL (batched by postIds) | Waits for Step 6 post IDs |
| 9 | Mention resolution | Inside `fetchPostsForActor.dal.js` | SEQUENTIAL (fetch + resolve loop) | Waits for Step 6 post data |

**Overall profile load mode:** SERIAL-DOMINANT (Steps 1→2→3→6 must complete sequentially before posts render)

---

## DATABASE READ SUMMARY

| Table/View/RPC | Operation | Est. Count | Duplicate Risk | Notes |
|---|---|:---:|---|---|
| `vc.actors` | SELECT (slug→actorId) | 1 | LOW | Slug resolution |
| `vc.actors` | SELECT (kind) | 1 | MEDIUM | Possible duplicate if readActorKind reads same row as resolveActorSlug |
| `vc.actor_privacy` | SELECT | 1 | LOW | Privacy gate |
| `vc.actor_follows` | SELECT | 1 | LOW | Follow state gate |
| `vc.actor_blocks` | SELECT | 1 | LOW | Block state gate |
| `vc.actors` (actor profile) | SELECT | 1 | MEDIUM | getProfileViewController calls readActorProfileDAL — possible 3rd read of same actor row |
| `vc.posts` | SELECT (posts grid) | 1 | MEDIUM | Separate from any feed reads |
| `vc.post_media` | SELECT (media batch) | 1 | LOW | Batched by postIds ✓ |
| `vc.post_mentions` | SELECT (mentions batch) | 1 | LOW | Batched ✓ |
| `vc.actors` (author resolution) | SELECT | 1–N | HIGH | Author resolution inside fetchPostsForActor — all posts share same author on profile page |
| `public.profiles` or `vport.profiles` | SELECT (author display) | 1–N | HIGH | Author profile fetch inside fetchPostsForActor — redundant for profile-owned posts |

---

## DUPLICATE QUERY FINGERPRINTS

| Fingerprint | Count | Caller Chains | Impact |
|---|:---:|---|---|
| `table=vc.actors, op=select, filter=actor_id` | **2–3x** | resolveActorSlug.dal → readActorKind.dal → readActorProfile.dal | MEDIUM — same actor row read 2–3 times during single profile load |
| `table=vc.actors, op=select, filter=actor_id (author)` | **1x per batch** | fetchPostsForActor.dal (author resolution) | HIGH — for profile post grid, author is always same actor as profile. Author already resolved in Steps 1–4 but re-fetched in post DAL. |

---

## TIMING BUDGET STATUS

| Runtime Area | Observed | Budget | Status |
|---|---:|---:|---|
| Route/screen load | UNKNOWN | 1500ms | UNVERIFIABLE |
| Controller orchestration | UNKNOWN | 300ms | UNVERIFIABLE |
| DAL total | UNKNOWN | 500ms | UNVERIFIABLE |
| DB read max | UNKNOWN | 150ms | UNVERIFIABLE |
| Hydration/render | FAST (hydration store seed) | 500ms | LIKELY PASS for cached actors |
| Serial waterfall depth | 3 serial hops before posts | — | WATCH — 3 serial hops add latency |

---

## CACHE OBSERVATIONS

| Cache | Caller | Status | Evidence | Impact |
|---|---|---|---|---|
| @hydration actor store (5min TTL) | `useActorStore` via `ActorProfileViewScreen.jsx` | HIT (if previously visited) | `useMemo` pre-seeds profile from hydration store | Prevents loading flash for returning visitors ✓ |
| Rates TTL cache (60s) | `readVportRatesByActor.dal.js` | HIT/MISS | TTL cache + invalidateRatesCache() export confirmed | Low impact on profile page (rates are a sub-panel) |
| Post grid cache | `useActorPosts` → `fetchPostsForActor.dal.js` | **UNKNOWN** | No TTL cache found in DAL | MEDIUM — hot path, profile is "visited frequently", no post caching |
| Profile gate state | `useProfileGate` | UNKNOWN | No cache detected in gate hooks | MEDIUM — follow/block state re-fetched per navigation |

---

## RENDER / HOOK CHURN

| Component/Hook | Render Impact | Likely Trigger | Notes |
|---|---|---|---|
| `ActorProfileScreen.jsx` | Potential multi-render | Each hook resolving updates state (3+ async state changes) | Screen renders on: slug resolution, kind resolution, gate evaluation, post load |
| `ActorProfilePostsView.jsx` | Shows skeleton initially | `useActorPosts` loading | Skeleton in place ✓ |
| `useActorKind.js` | State update on resolution | Single controller call | Managed with `alive` flag ✓ |
| `useResolveActorBySlug.js` | State updates on resolution | Slug→actorId resolution | Stale result protection present ✓ |
| `ActorProfileViewScreen.jsx` | Partial pre-render | `useMemo` hydration store seed | Pre-seed from store reduces blank flash |

---

## LOKI RUNTIME FINDINGS

---

### LOKI RUNTIME FINDING — LF-001

- **Finding ID:** LF-001
- **Location:** `ActorProfileScreen.jsx` → hook chain
- **Application Scope:** VCSM
- **Runtime Risk Category:** Serial bottleneck
- **Evidence Type:** INFERRED
- **Observation Source:** Static code analysis of hook enabled-guards and dependency chain
- **Confidence:** HIGH
- **Current runtime behavior:** Profile page load follows a 3-step serial waterfall before the post grid can begin loading:
  1. `useResolveActorBySlug` resolves slug → actorId (waits for DB)
  2. `useActorKind` resolves kind (waits for actorId from Step 1)
  3. `useProfileGate` evaluates privacy/follow/block (waits for actorId + kind)
  4. `useActorPosts` fires ONLY after `canViewContent !== false` (waits for Step 3)
  Each step introduces a React query round-trip before the next can fire. Total waterfall depth: 3 serial async hops before posts begin loading.
- **Runtime impact:** Posts are invisible until slug + kind + gate have all resolved. On a cold cache, this means 3× serial DB round-trips add directly to Time-to-Posts. High-traffic profile pages are disproportionately affected.
- **Read Amplification:** N/A (serial latency concern, not a read count issue)
- **Timing impact:** +2–3 additional round-trip latency on cold profile loads; ~300–900ms additional delay depending on DB latency
- **Caller chain:** `ActorProfileScreen.jsx` → `useResolveActorBySlug` → `useActorKind` → `useProfileGate` → `useActorPosts`
- **Cache status:** @hydration store partially mitigates actor header rendering; post gate still requires fresh DB reads
- **Severity:** HIGH
- **Recommended handoff:** KRAVEN (performance optimization — consider consolidating Steps 1–3 into a single `resolveProfileContext` controller call)
- **Rationale:** Profile is described as "visited frequently" and is a hot path. Eliminating 2 serial hops by batching slug + kind + gate resolution into a single controller call would meaningfully reduce Time-to-Content.

---

### LOKI RUNTIME FINDING — LF-002

- **Finding ID:** LF-002
- **Location:** `apps/VCSM/src/features/profiles/dal/post/fetchPostsForActor.dal.js` — author resolution section (lines 12–64)
- **Application Scope:** VCSM
- **Runtime Risk Category:** Duplicate read
- **Evidence Type:** INFERRED
- **Observation Source:** DAL code analysis — author resolution fetches vc.actors + public.profiles/vport.profiles for author
- **Confidence:** HIGH
- **Current runtime behavior:** `fetchPostsForActor.dal.js` resolves the author actor for posts. On a profile post grid, ALL posts belong to the same actor (the profile being viewed). The author actorId is already known at the time the DAL is called (it IS the `actorId` parameter). Yet the DAL re-fetches actor kind from `vc.actors` and then fetches the profile record (`public.profiles` or `vport.profiles`) to populate the author display. These 2+ reads are redundant for a profile post grid since the actor data was already resolved in Steps 1–4 of the profile load chain.
- **Runtime impact:** For a 20-post profile page, the author resolution adds 2 extra DB reads (vc.actors kind + profile) that return data already available in the hydration store and profile context. For VPORTs that load `vport.profiles`, this is an additional cross-schema read.
- **Read Amplification:** +2 reads for every profile post grid load (regardless of post count) — data already available in context
- **Timing impact:** +1–2 round-trips for author resolution; impact proportional to DB latency (estimated +50–150ms)
- **Caller chain:** `useActorPosts` → `getActorPostsController` → `fetchPostsForActor.dal.js` → (author resolution) → `vc.actors` + `public.profiles|vport.profiles`
- **Cache status:** MISS — author resolution inside this DAL does not use the @hydration actor store
- **Severity:** MEDIUM
- **Recommended handoff:** KRAVEN (optimization: pass pre-resolved `authorActor` to DAL to skip author fetch; or post-hydrate author from store after DAL returns raw posts)
- **Rationale:** The hydration engine (@hydration store) already holds this actor's data. The DAL should accept pre-resolved actor context or return raw posts without embedded author, leaving hydration to the controller/hook layer.

---

### LOKI RUNTIME FINDING — LF-003

- **Finding ID:** LF-003
- **Location:** `vc.actors` — 3 potential reads during single profile load
- **Application Scope:** VCSM
- **Runtime Risk Category:** Duplicate read
- **Evidence Type:** HYPOTHESIS
- **Observation Source:** Inferred from DAL call chain: `resolveActorSlug.dal.js`, `readActorKind.dal.js`, `readActorProfile.dal.js`
- **Confidence:** MEDIUM
- **Current runtime behavior:** During a cold profile load, `vc.actors` may be read 2–3 times for the same actor:
  1. `resolveActorSlug.dal.js` — reads actors to resolve slug → actorId
  2. `readActorKind.dal.js` — reads actors for kind (may read same row again)
  3. `readActorProfile.dal.js` (inside `getProfileViewController`) — reads actor profile data
  All three may query `vc.actors` for the same `actor_id`, returning overlapping data.
- **Runtime impact:** 2–3 reads of the same DB row on every cold profile load
- **Read Amplification:** +2 redundant vc.actors reads per profile page load
- **Timing impact:** +50–150ms cumulative
- **Cache status:** MISS on cold load; @hydration partially mitigates after first visit
- **Severity:** MEDIUM
- **Recommended handoff:** KRAVEN (consolidate into single actor resolution call at profile load entry; cache result in React Query or @hydration store)
- **Rationale:** Profile context resolution (slug → actorId → kind → profile data) should be a single controller call returning a unified profile context object.

---

### LOKI RUNTIME FINDING — LF-004

- **Finding ID:** LF-004
- **Location:** `apps/VCSM/src/features/profiles/screens/ActorProfileScreen.jsx` + all profile view hooks
- **Application Scope:** VCSM
- **Runtime Risk Category:** Duplicate read / observability gap
- **Evidence Type:** INFERRED
- **Observation Source:** Source document states "Error state: FAIL — not confirmed"; hook analysis shows individual error states per hook but no systematic error boundary
- **Confidence:** HIGH
- **Current runtime behavior:** Individual hooks (`useActorKind`, `useResolveActorBySlug`, `getProfileViewController`) each have their own error state management. However, no systematic React Error Boundary or error state aggregation is confirmed at the `ActorProfileScreen.jsx` level. If slug resolution succeeds but profile view loading fails, the screen may be in a mixed loading/error state with no coherent fallback UI.
- **Runtime impact:** Users may see a partially-loaded profile header with spinner on the posts area indefinitely, or a silent error with no user-visible feedback.
- **Timing impact:** Not a timing issue — a reliability/UX issue
- **Cache status:** N/A
- **Severity:** MEDIUM
- **Recommended handoff:** IRONMAN (assign ownership for error state design), KRAVEN (verify runtime behavior under error conditions)
- **Rationale:** Profile is a high-traffic module. Silent error states affect many users. Systematic error boundaries should be implemented.

---

### LOKI RUNTIME FINDING — LF-005

- **Finding ID:** LF-005
- **Location:** Profile post grid — `useActorPosts` → `fetchPostsForActor.dal.js`
- **Application Scope:** VCSM
- **Runtime Risk Category:** Cache bypass
- **Evidence Type:** INFERRED
- **Observation Source:** No TTL cache found in post DAL; rates DAL has TTL cache; profile post grid does not
- **Confidence:** MEDIUM
- **Current runtime behavior:** Profile post grid has no caching layer. Every profile visit triggers a full `fetchPostsForActor.dal.js` execution — 6-table multi-schema read including `vc.posts`, `vc.post_media`, `vc.post_mentions`, `vc.actors`, `public.profiles`, `vport.profiles`. On a high-traffic profile page (celebrities, popular VPORTs), this executes on every visitor load.
- **Runtime impact:** High DB read pressure on popular profiles. No cache hit path for returning visitors or re-navigation.
- **Timing impact:** Full 6-table multi-schema read on every profile post load (~200–500ms estimated DAL execution)
- **Cache status:** MISS — no TTL cache in post DAL
- **Severity:** HIGH (given "Profile is visited frequently" — source document)
- **Recommended handoff:** KRAVEN (add TTL post cache for profile post grids; short TTL with cache bust on post create/delete)
- **Rationale:** Profile is identified as a hot path. A short TTL cache (30–60s) on profile post grids would significantly reduce DB read pressure.

---

### LOKI RUNTIME FINDING — LF-006

- **Finding ID:** LF-006
- **Location:** `apps/VCSM/src/features/profiles/screens/ActorProfileScreen.jsx` — `ActorProfileProdDebugPanel`
- **Application Scope:** VCSM
- **Runtime Risk Category:** Duplicate read / observability gap
- **Evidence Type:** OBSERVED (import confirmed in ActorProfileScreen.jsx)
- **Observation Source:** Import statement: `import { ActorProfileProdDebugPanel } from "@/features/profiles/screens/components/ActorProfileProdDebugPanel"`
- **Confidence:** HIGH
- **Current runtime behavior:** A component named `ActorProfileProdDebugPanel` is imported in the production screen. The render guard is unconfirmed. If the panel renders in production, it exposes internal profile state to all visitors.
- **Runtime impact:** If rendered: internal actor IDs, route telemetry, hook state visible in production
- **Cache status:** N/A
- **Severity:** LOW (runtime perspective — see VENOM VF-005 for security classification)
- **Recommended handoff:** VENOM (security review of what the panel exposes), LOGAN (move to debuggers/ directory)
- **Rationale:** Production screen should not import debug panels, even with render guards.

---

## OBSERVABILITY GOVERNANCE STATUS

| Area | Coverage | Missing Visibility | Risk |
|---|---|---|---|
| Slug resolution trace | LOW | No timing or failure signal on slug→actorId | MEDIUM — dead-end profile loads invisible |
| Profile gate evaluation | LOW | No trace on why content was gated (blocked/private/error) | MEDIUM — invisible to operational support |
| Post load failure | LOW | No systematic error recovery trace | HIGH — silent failures on hot-path |
| Actor kind resolution failure | MEDIUM | useActorKind has error state; not aggregated | LOW |
| Profile view controller | MEDIUM | Promise.all fallback present; no structured logging | LOW |
| Cache hit/miss on profile posts | NONE | No cache instrumentation | MEDIUM |

---

## OBSERVABILITY GAP REVIEW

| Flow | Current Visibility | Missing Signals | Severity | Recommended Instrumentation |
|---|---|---|---|---|
| Profile load end-to-end | None confirmed | Total TTI (Time to Interactive), per-step timing | HIGH | Add `useProfileRouteTelemetry` breadcrumb per step (controller entry/exit) |
| Profile gate failure | None | Why content was gated (blocked? private? error?) | MEDIUM | Log gate result + reason in useProfileGate (dev-only) |
| Post fetch failure | None | Whether fetchPostsForActor failed or returned empty | HIGH | Add onError handler in useActorPosts with structured error logging |
| Author resolution | None | How long author resolution takes within fetchPostsForActor | MEDIUM | Add timing breadcrumb at DAL entry/exit (dev-only) |

---

## AUDIT TRAIL WARNINGS

**AUDIT TRAIL WARNING**
Flow: Profile owner write paths (rates, services, gas prices)
Missing audit evidence: No structured event log for owner-gated VPORT writes (rate upsert, service upsert, fuel price update)
Operational risk: If a service catalog is incorrectly overwritten, there is no audit trail to reconstruct what changed and when
Recommended audit event: Emit structured event on owner write success: `{ actorId, operation, timestamp, changedFields }` — dev-only initially, production audit log long-term

---

## INSTRUMENTATION RECOMMENDATIONS

**INSTRUMENTATION RECOMMENDATION #1**
Location: `apps/VCSM/src/features/profiles/screens/hooks/useProfileRouteTelemetry.js`
Purpose: Extend existing telemetry hook to capture per-step timing (slug resolution, kind, gate, posts)
Suggested signal: `{ step, duration_ms, actorId (redacted), timestamp }`
Log level: DEBUG
Production-safe: NO — dev-only
Dev-only: YES
Recommended owner: App

**INSTRUMENTATION RECOMMENDATION #2**
Location: `apps/VCSM/src/features/profiles/screens/views/tabs/post/hooks/useActorPosts.js`
Purpose: Add onError handler that logs structured error (no sensitive data)
Suggested signal: `{ hook: 'useActorPosts', error: error.message, actorId (count only) }`
Log level: ERROR
Production-safe: YES (only on error path, no sensitive data)
Dev-only: NO
Recommended owner: App

---

## CORRELATION ID REVIEW

| Flow | Correlation Present | Risk | Recommendation |
|---|---|---|---|
| Profile load end-to-end | NO | MEDIUM — cannot correlate slug resolution failure with post load failure | Add traceId at `ActorProfileScreen.jsx` entry; pass to hooks via ref |
| Owner write (rates, services, gas) | NO | MEDIUM — no correlation between owner action and DB write | Add operation correlationId on controller entry |

---

## HANDOFF MATRIX

| Finding | Recommended Handoff | Reason |
|---|---|---|
| LF-001 (serial waterfall) | KRAVEN | Performance optimization — consolidate profile context resolution |
| LF-002 (redundant author resolution) | KRAVEN | Unnecessary DB reads on profile post grid |
| LF-003 (vc.actors triple read) | KRAVEN | Duplicate actor row reads per profile load |
| LF-004 (no systematic error state) | IRONMAN | Ownership assignment for error state design |
| LF-005 (post cache missing) | KRAVEN | TTL cache recommendation for hot-path post grid |
| LF-006 (ProdDebugPanel in screen) | VENOM + LOGAN | Security review + move to debuggers/ |

---

## OBSERVABILITY MATURITY: BASIC

**Reason:** Individual hooks have error and loading states. A telemetry hook exists (`useProfileRouteTelemetry`). However: no end-to-end trace correlation, no structured logging on post load failure, no cache hit/miss instrumentation, no operational audit trail for owner writes. The module has basic observability primitives but no functional tracing capability.

---

## FINAL LOKI STATUS: WATCH

**Reason:** 2 HIGH findings (serial waterfall + missing post cache on hot path) and 3 MEDIUM findings. No CRITICAL runtime failures detected. The serial waterfall is the most impactful issue for user-perceived performance on the platform's most-visited module.
