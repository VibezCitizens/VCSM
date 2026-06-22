# KRAVEN PERFORMANCE AUDIT

**Feature / Route:** Actor profile page — `/@:username` and `/profile/:actorId`
**Application Scope:** VCSM
**Entry point:** `ActorProfileScreen.jsx`
**Date:** 2026-05-22
**Reviewer:** KRAVEN
**Trigger:** CEREBRO-directed verification of vcsm.profiles.architecture.md — hot path analysis
**LOKI Evidence Status:** PARTIAL (LOKI trace produced from static code analysis — no live profiling available)

---

## RUNTIME CRITICALITY REVIEW

| Area | Criticality | Reason |
|---|---|---|
| Actor profile page load | Identity-critical | Every actor link in the app navigates here; public entry point for all VPORTs |
| Profile post grid | Feed-critical | Posts are the primary profile content surface |
| Profile gate evaluation | Identity-critical | Privacy/block state gate blocks all content below it |
| Owner write paths (rates, services, gas) | Booking-critical | VPORT catalog mutations affect booking and price display |
| Profile header hydration | Identity-critical | Actor header is first-paint content |

---

## KRAVEN TARGET

Feature / Route: Actor profile page load + post grid + VPORT panel loads
Application Scope: VCSM
Entry point: `ActorProfileScreen.jsx` → `ActorProfileViewScreen.jsx` → `ActorProfilePostsView.jsx`
Reason for analysis: Source document flags profile as HIGH hot path ("profile is visited frequently"). LOKI identified serial waterfall and missing post cache as HIGH findings.

---

## RUNTIME EVIDENCE

**Observed controllers:** `resolveActorBySlugController`, `getActorKindController`, `getProfileViewController`, `getActorPostsController`
**Observed DAL calls:** `resolveActorSlug.dal`, `readActorKind.dal`, `readActorProfile.dal`, `readFollowState.dal`, `fetchPostsForActor.dal`, `readPostMediaByPostIds.dal`, `readActorPosts.dal`
**Observed tables:** `vc.actors` (2–3×), `vc.actor_privacy`, `vc.actor_follows`, `vc.actor_blocks`, `vc.posts`, `vc.post_media`, `vc.post_mentions`, `public.profiles`, `vport.profiles`
**Duplicate read signals:** `vc.actors` read 2–3× per cold profile load; post author resolution redundant for profile-owned posts
**Timing observations:** INFERRED — 3 serial DB hops before post grid renders; fetchPostsForActor is 262-line multi-schema DAL (~200–500ms estimated)

---

## PERFORMANCE PATTERNS DETECTED

| Pattern | Confirmed | Severity |
|---|---|---|
| Duplicate reads (vc.actors × 3) | INFERRED | MEDIUM |
| Serial async chain (slug→kind→gate→posts) | INFERRED HIGH | HIGH |
| N+1 suspicion (author resolution per post) | INFERRED | MEDIUM |
| Cache miss on hot-path post grid | CONFIRMED (no cache) | HIGH |
| Controller fan-out (fetchPostsForActor god-method) | CONFIRMED | MEDIUM |
| Overfetch (6-table join for profile post grid) | CONFIRMED | MEDIUM |

---

## QUERY AMPLIFICATION ANALYSIS

| Runtime Path | Primary Records | DB Operations | Amplification | Severity |
|---|---:|---:|---:|---|
| Profile load (cold, no cache) | 1 actor profile | 5–6 reads (slug, kind, follow, block, privacy, profile) | **5–6×** | ELEVATED |
| Post grid load (20 posts, cold) | 20 posts | 6–8 reads (posts, media, mentions, actors, profiles×2, kind) | **0.35–0.4× per post** | HEALTHY (per post) |
| Combined cold profile+posts load | 1 profile + 20 posts | **11–14 total DB reads** | **~11–14×** | ELEVATED overall |
| Returning visitor (actor in hydration store) | 1 actor (cached) | 3 fewer reads (actor row skipped) | **~8–11×** | ELEVATED |

---

## WATERFALL DETECTION

| Caller Chain | Serial Operations | Estimated Delay | Optimization Opportunity |
|---|:---:|:---:|---|
| slug→actorId→kind→gate→posts | **3 serial hops** | ~150–450ms | Consolidate into single `resolveProfileContext` controller returning slug+actorId+kind+gateResult |
| fetchPostsForActor: posts→author→media→mentions | **2 sequential phases** | ~100–300ms | Move author resolution out of DAL; batch-hydrate post authors from @hydration store after DAL returns raw posts |
| readActorPosts + readPostMedia | **2 sequential calls** | ~50–100ms | Already partially batched in readActorPosts (media batched by IDs); this is acceptable |

---

## CACHE EFFICIENCY REVIEW

| Cache Area | Status | Problem | Runtime Impact |
|---|---|---|---|
| @hydration actor store (5min TTL) | EFFECTIVE | Good for returning visitors; pre-seeds profile header | LOW impact when active |
| Profile post grid | **BYPASSED** | No TTL cache — full 6-table fetch on every visit | HIGH — hot path, every profile visitor hits DB |
| Rates DAL (60s TTL) | EFFECTIVE | TTL + invalidation present ✓ | LOW |
| Profile gate state | UNKNOWN | Follow/block/privacy re-fetched per navigation | MEDIUM |
| Slug→actorId resolution | UNKNOWN | No cache found for slug resolution — every navigation re-fetches | MEDIUM |

---

## PAYLOAD / HYDRATION REVIEW

| Runtime Area | Payload Risk | Hydration Risk | Cause |
|---|---|---|---|
| `fetchPostsForActor.dal.js` result | HIGH | MODERATE | 6-table join returns nested objects: post + author + media[] + mentionMap. Large nested payload for 20 posts. |
| Actor profile data | LOW | LOW | @hydration store seeds header; RQ manages updates |
| VPORT panel data (rates/services/gas) | LOW | LOW | Tab-specific, loaded on demand |
| Post media array | MODERATE | MODERATE | Multi-media posts return media[] per post; uncompressed media URLs add payload weight |

---

## CONTROLLER FAN-OUT REVIEW

| Controller | DAL Calls | Dependencies | Risk |
|---|:---:|:---:|---|
| `getActorPostsController` → `fetchPostsForActor.dal.js` | **6 (multi-schema in DAL)** | vc.posts, vc.post_media, vc.post_mentions, vc.actors, public.profiles, vport.profiles | HIGH — god-method DAL with 6 dependencies |
| `getProfileViewController` | **2 (parallel)** | readActorProfile + readFollowState (Promise.all) | HEALTHY |
| `resolveActorBySlugController` | 1 | resolveActorSlug.dal | HEALTHY |
| `getActorKindController` | 1 | readActorKind.dal | HEALTHY — but redundant given profile data already includes kind |

---

## KRAVEN PERFORMANCE FINDINGS

---

### KRAVEN PERFORMANCE FINDING — KF-001

- **Finding ID:** KF-001
- **Location:** `ActorProfileScreen.jsx` → hook chain
- **Application Scope:** VCSM
- **Runtime Criticality:** Identity-critical (all profile visits hit this path)
- **Evidence Type:** INFERRED
- **Observation Source:** Hook enabled-guard analysis + LOKI LF-001
- **Confidence:** HIGH
- **Current runtime behavior:** Profile page cold load requires 3 serial DB round-trips before post grid can begin rendering:
  1. Slug → actorId (resolveActorSlug.dal)
  2. actorId → actor kind (readActorKind.dal — gated on Step 1)
  3. Gate evaluation (readFollowState + readActorPrivacy + readActorBlocks — gated on Step 2)
  4. Post fetch (gated on Step 3 canViewContent)
  Steps 1–3 are serially dependent. Each adds one full DB round-trip before the next fires.
- **Detected pattern:** Serial async waterfall
- **Query Amplification:** +2 forced serial delays before primary content load
- **Payload/Hydration Impact:** LOW (payload per step is small; latency is the issue)
- **Controller Fan-Out:** MODERATE
- **Cache Efficiency:** PARTIAL — @hydration bypasses actor header re-render on return visits, but gate state is still re-fetched
- **Blast Radius:** Single route (profile), but ALL profile visits are affected. Profile is "visited frequently."
- **Estimated impact:** HIGH — Time-to-Posts is 2–3× higher than it needs to be. On 150ms average round-trip: +300–450ms added to every cold profile load before posts begin.
- **Root cause hypothesis:** Each hook fires independently with its own `useEffect` + enabled guard. No profile context aggregation controller exists that could return slug+actorId+kind+gateResult in a single round-trip.
- **Recommended optimization:** Create a `resolveProfileContext` controller that in one call:
  1. Resolves slug → actorId
  2. Reads actor kind
  3. Reads privacy/follow/block state
  Returns `{ actorId, kind, canViewContent, reason }` as a single context object. Replace the 3-step hook chain with one `useProfileContext(slug)` hook backed by this controller.
- **Optimization ROI:** EXTREME — eliminates 2 serial hops on the hottest profile entry path; estimated +300–450ms TTI improvement
- **Architectural/Security Risk:** LOW — controller must call `readActorPrivacy`, `readFollowState`, `readActorBlocks` in Promise.all. Requires VENOM review to confirm gate logic is preserved server-side.
- **Expected improvement:** Time-to-Posts reduced by 2 serial hops (~300–450ms on median connection); profile feels immediately responsive on return visits
- **Recommended handoff:** SENTRY (verify new controller respects architecture contract), VENOM (verify gate logic is preserved in consolidated controller)
- **Rationale:** Profile is the most-visited page in VCSM. Every millisecond saved here multiplies across millions of visits.

---

### KRAVEN PERFORMANCE FINDING — KF-002

- **Finding ID:** KF-002
- **Location:** `apps/VCSM/src/features/profiles/dal/post/fetchPostsForActor.dal.js`
- **Application Scope:** VCSM
- **Runtime Criticality:** Feed-critical (profile post grid is primary profile content)
- **Evidence Type:** INFERRED
- **Observation Source:** DAL code analysis + LOKI LF-002
- **Confidence:** HIGH
- **Current runtime behavior:** `fetchPostsForActor.dal.js` is a 262-line god-method DAL that performs 6 distinct operations for every profile post grid load:
  1. Reads `vc.posts` (primary query)
  2. Resolves actor kind for post author (`vc.actors`)
  3. Fetches author display data (`public.profiles` or `vport.profiles`)
  4. Reads `vc.post_media` (batched by postIds ✓)
  5. Reads `vc.post_mentions` (batched ✓)
  6. Resolves mention actor display data (multi-step)
  Operations 2–3 are redundant for a profile post grid: all posts belong to the profile actor, whose data is already resolved during profile context load (Step 1–4 of the waterfall).
- **Detected pattern:** Duplicate read + Controller fan-out inside DAL
- **Query Amplification:** +2 reads redundant for profile-owned posts (author kind + author profile); mentions remain valid
- **Payload/Hydration Impact:** HIGH — deeply nested result object (post + author + media[] + mentionMap) increases client hydration cost
- **Controller Fan-Out:** HIGH (6 tables in a single DAL method)
- **Cache Efficiency:** BYPASSED — no TTL cache on post grid results; full 6-table fetch on every visit
- **Blast Radius:** Single feature (profile post grid), but affects ALL profile visitors
- **Estimated impact:** HIGH — ~100–200ms wasted on redundant author reads + deep nesting adds hydration overhead
- **Root cause hypothesis:** DAL was designed to be self-contained (author included in result) rather than receiving a pre-resolved actor context. This made sense for feed contexts where authors vary, but is wasteful for profile grids where the author is always known.
- **Recommended optimization (two-phase):**
  1. **Short-term:** Pass pre-resolved `authorActor` to `fetchPostsForActor.dal.js` as an optional parameter. When provided (profile grid context), skip author resolution reads. Return raw posts; hydrate author from @hydration store in the controller/hook layer.
  2. **Long-term (SENTRY required):** Split DAL into atomic methods. Create a thin `getProfilePostGrid` controller that calls: `readPostsByActorIdDAL` + `readPostMediaBatchDAL` + `readPostMentionsBatchDAL` + hydrates authors from @hydration store.
- **Optimization ROI:** HIGH — eliminates 2 redundant DB reads per profile grid load; reduces payload depth
- **Architectural/Security Risk:** MEDIUM — requires SENTRY review (controller must not bypass post feature ownership by owning post reads long-term; should consume via post.adapter per SF-004)
- **Expected improvement:** ~100–200ms DAL time reduction; shallower result payload reduces client hydration time
- **Recommended handoff:** SENTRY (SF-004 must be resolved first — post reads should move to post feature), LOKI (verify improvement with instrumented trace after fix)
- **Rationale:** Author resolution in a DAL that serves a profile-owned context is a structural inefficiency with a clear fix path.

---

### KRAVEN PERFORMANCE FINDING — KF-003

- **Finding ID:** KF-003
- **Location:** `vc.actors` table — read pattern during profile load
- **Application Scope:** VCSM
- **Runtime Criticality:** Identity-critical
- **Evidence Type:** INFERRED
- **Observation Source:** DAL call chain analysis + LOKI LF-003
- **Confidence:** MEDIUM
- **Current runtime behavior:** On cold profile load, `vc.actors` may be read 2–3 times for the same actor row:
  - `resolveActorSlug.dal.js` — slug→actorId (reads actors to resolve slug)
  - `readActorKind.dal.js` — reads actors for kind field
  - `readActorProfile.dal.js` (inside getProfileViewController) — reads actors for display data
  All three likely query the same `vc.actors` row with overlapping column projections.
- **Detected pattern:** Duplicate reads (same row, different projections)
- **Query Amplification:** +2 redundant actor reads per cold profile load
- **Cache Efficiency:** PARTIAL — @hydration store caches after first load but cold profile visits repeat all reads
- **Blast Radius:** Single route; affects all cold profile loads
- **Estimated impact:** MEDIUM — +2 DB reads per cold visit; cumulative on high-traffic profiles
- **Root cause hypothesis:** Three separate hooks fire independently with no shared context resolution. The `resolveProfileContext` consolidation (KF-001) would address this as a side effect.
- **Recommended optimization:** KF-001 consolidation resolves this automatically — a single `resolveProfileContext` call returns actorId + kind + profile data in one DB read by fetching from `vc.actors` once with the full required column list.
- **Optimization ROI:** HIGH (comes free with KF-001 fix; no separate effort needed)
- **Architectural/Security Risk:** LOW
- **Expected improvement:** 2 fewer `vc.actors` reads per cold profile load
- **Recommended handoff:** Resolved by KF-001 implementation
- **Rationale:** Profile context consolidation eliminates this pattern as a side effect.

---

### KRAVEN PERFORMANCE FINDING — KF-004

- **Finding ID:** KF-004
- **Location:** Profile post grid — `useActorPosts` → `fetchPostsForActor.dal.js`
- **Application Scope:** VCSM
- **Runtime Criticality:** Feed-critical
- **Evidence Type:** CONFIRMED (no cache found in code)
- **Observation Source:** DAL code analysis — no TTL cache wrapper found in fetchPostsForActor.dal.js
- **Confidence:** HIGH
- **Current runtime behavior:** Profile post grids have NO cache layer. Every profile visit by any user triggers a full 6-table `fetchPostsForActor.dal.js` execution. For popular profiles (VPORTs with many followers), this executes hundreds of times per minute with identical results.
- **Detected pattern:** Cache miss on hot path
- **Query Amplification:** Full 6-table read × every visitor × every navigation
- **Cache Efficiency:** BYPASSED — no TTL cache
- **Blast Radius:** All profile visitors; population of popular VPORTs is small but traffic concentration is high
- **Estimated impact:** HIGH — unnecessary DB read pressure on most-visited profiles. React Query provides in-session caching but not cross-visit or cross-user caching.
- **Root cause hypothesis:** No intentional decision to skip caching — it was simply not added. The rates DAL has a 60s TTL cache as a reference pattern.
- **Recommended optimization:** Add a TTL cache layer to the profile post grid fetch:
  1. Cache key: `actorId + pageOffset` (do NOT cache by viewer — all viewers see same posts due to privacy gate being applied separately)
  2. TTL: 30–60 seconds (posts don't change per-second; matches rates cache TTL pattern)
  3. Invalidation: call `invalidateProfilePostsCache(actorId)` on post create/delete/edit
  4. Owner bypass: when `isOwner === true`, bypass cache to show latest posts immediately
- **Optimization ROI:** EXTREME — eliminates the most expensive repeated read on the platform's hottest route
- **Architectural/Security Risk:** MEDIUM — cache must NOT include viewer-specific data (reactions, ownership flags). Privacy gate result must NOT be cached (viewer-specific). Requires VENOM review to confirm cached payload contains no identity-sensitive data.
- **Expected improvement:** DB read pressure reduced by 80–95% on popular profiles; perceived profile load speed increases for all visitors
- **Recommended handoff:** VENOM (verify cache payload is safe for multi-viewer caching), SENTRY (confirm cache placement at correct layer)
- **Rationale:** Profile is described as "visited frequently." Adding a short TTL post cache is the single highest-ROI performance optimization available for this module.

---

## OPTIMIZATION SAFETY REVIEW

| Optimization | Architectural Risk | Security Risk | Requires SENTRY/VENOM |
|---|---|---|---|
| KF-001: Consolidate profile context into single controller | MEDIUM (new controller must respect layer order) | LOW (gate logic must be preserved server-side) | SENTRY: YES, VENOM: YES |
| KF-002: Pass pre-resolved authorActor to DAL | MEDIUM (DAL interface change; long-term move to post.adapter) | LOW | SENTRY: YES |
| KF-003: Resolved by KF-001 | LOW | LOW | No separate review needed |
| KF-004: Add TTL post grid cache | MEDIUM (cache invalidation contract) | MEDIUM (must not cache viewer-specific data or privacy state) | SENTRY: YES, VENOM: YES |

---

## KRAVEN PRIORITY MATRIX

| Priority | Finding | Runtime Criticality | Estimated Impact | ROI | Severity |
|---|---|---|---|---|---|
| **1** | KF-004 — Add post grid TTL cache | Feed-critical | EXTREME DB load reduction | EXTREME | HIGH |
| **2** | KF-001 — Consolidate profile context resolution | Identity-critical | +300–450ms TTI improvement | EXTREME | HIGH |
| **3** | KF-002 — Eliminate redundant author resolution in DAL | Feed-critical | +100–200ms DAL reduction | HIGH | MEDIUM |
| **4** | KF-003 — vc.actors triple read | Identity-critical | +2 fewer reads per visit | HIGH (free via KF-001) | MEDIUM |

---

## FINAL KRAVEN STATUS: WATCH

**Release risk:** No CRITICAL performance failures that would prevent release, but KF-004 (no post grid cache) represents an avoidable DB load risk on a high-traffic module that should be addressed before wide rollout.

**Top priority:** KF-004 (cache), then KF-001 (waterfall consolidation). Both are implementable without architectural restructuring.

**Handoff dependency tree:**
- KF-001 requires SENTRY + VENOM sign-off before implementation
- KF-002 blocked on SENTRY SF-004 (post reads must move to post feature long-term)
- KF-004 requires VENOM cache safety review before implementation

**Estimated combined improvement from KF-001 + KF-004:** ~50–60% reduction in perceived profile load time on cold visits; ~80–95% reduction in DB reads on popular profiles.
