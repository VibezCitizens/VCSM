# LOKI RUNTIME REPORT

**Date:** 2026-05-14
**Command:** LOKI
**Application Scope:** VCSM
**Observed flow:** Block status read path — profile screen load, chat load, feed pipeline, bulk block filter
**Entry point:** `useBlockStatus.js`, `fetchFeedPagePipeline`, `ctrlGetBlockedActorSet`
**Environment:** Static code analysis (no live runtime available — all evidence INFERRED from source)
**TypeScript output allowed:** NO
**Boundary Contract:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — ENFORCED

---

## LOKI TARGET

```text
LOKI TARGET
Observed flow:   Block status read path — all enforcement surfaces
Application Scope: VCSM
Entry points:
  - useBlockStatus(myActorId, targetActorId)    → profile/chat/feed rendering gate
  - fetchFeedPagePipeline(...)                   → feed block filter on each page load
  - ctrlGetBlockedActorSet(actorId, candidates) → bulk filter for friend ranking + post create
Reason for observation:
  CEREBRO mandated LOKI as missing governance evidence for block feature.
  THOR flagged LOKI as MISSING. No prior runtime telemetry exists for this feature.
  Two high-impact patterns were identified during static analysis:
  (1) Duplicate DB reads on profile screen load
  (2) Feed cache not invalidated when blocking via feed action adapter
TypeScript output allowed: NO
```

---

## TRACE IDENTITY

```text
TRACE IDENTITY
Trace ID:           LOKI-BLOCK-2026-05-14-001
Route:              /[actorSlug] (profile), /chat/[conversationId] (chat), /feed (central feed)
Screen:             VportProfileViewScreen, ActorProfileViewScreen, ConversationView, Central Feed
Session state class: authenticated Citizen
Timestamp:          2026-05-14
Evidence type:      INFERRED (static code analysis — no live runtime instrumentation)
```

---

## RUNTIME SUMMARY

```text
RUNTIME SUMMARY
Total duration:           UNKNOWN — no live trace
Primary records returned: UNKNOWN — no live trace
Total DB reads (profile screen, inferred):
  - checkBlockStatus × 2  (duplicate — see LF-01)
  - [useActorPrivacy, useFollowStatus, useProfileView, useActorStore reads not counted here]
Read Amplification Score: 2.0 (2 identical moderation.blocks reads per profile screen load)
Worst bottleneck:         Duplicate uncached checkBlockStatus reads on profile screens (LF-01)
Cache behavior summary:
  - readFeedBlockRowsDAL: CACHED (60s TTL) — PASS
  - checkBlockStatus (direct): NO CACHE — every call hits Supabase
  - filterBlockedActors (bulk): NO CACHE — every call hits Supabase
  - invalidateFeedBlockCache: SYNC invalidation — correct behavior; but missing from useBlockActorAction path (LF-02)
```

---

## EXECUTION FLOW MAP

### Flow A — Profile Screen Load (VportProfileViewScreen / ActorProfileViewScreen)

| Step | Operation | Caller | Mode | Cache |
|---|---|---|---|---|
| 1 | Component mounts | VportProfileViewScreen | — | — |
| 2 | `useProfileGate({ viewerActorId, targetActorId, version })` fires | VportProfileViewScreen:54 | parallel with step 3 | — |
| 3 | `useBlockStatus(viewerActorId, profileActorId)` fires (direct call) | VportProfileViewScreen:58 | parallel with step 2 | MISS — uncached |
| 4 | `useBlockStatus(viewerActorId, targetActorId)` fires (inside useProfileGate) | useProfileGate:19 | parallel with step 3 | MISS — uncached |
| 5 | `ctrlGetBlockStatus({ actorId, targetActorId })` ×2 | getBlockStatus.controller.js:3 | SERIAL per hook | — |
| 6 | `checkBlockStatus(actorA, actorB)` ×2 | block.check.dal.js:13 | SERIAL per hook | NO CACHE |
| 7 | `moderation.blocks` SELECT ×2 — **identical OR-query** | Supabase | SERIAL | MISS |

**Duplicate read confirmed:** Steps 6–7 execute twice for identical actor pair (same `viewerActorId` + `profileActorId`).

### Flow B — Feed Pipeline (fetchFeedPagePipeline)

| Step | Operation | Caller | Mode | Cache |
|---|---|---|---|---|
| 1 | `fetchFeedPagePipeline(...)` called | useFeed hook | — | — |
| 2 | `readFeedPostsPage(...)` → `vc.posts` | pipeline:69 | parallel (Promise.all step 1) | NO CACHE |
| 3 | `readFeedBlockRowsDAL({ viewerActorId, actorIds })` | pipeline:100 | **PARALLEL** (Promise.all with 8 others) | 60s TTL |
| 4 | `moderation.blocks` SELECT (if cache miss) | feed.read.blockRows.dal.js:36 | PARALLEL | MISS/HIT |
| 5 | `normalizeFeedRows(...)` — uses blockedActorSet | pipeline:135 | sync | — |

**Feed pipeline is correctly structured:** 9 DAL calls in `Promise.all` — no serial waterfall. Block rows are TTL-cached. **PASS.**

### Flow C — Block Write Path (useBlockActions)

| Step | Operation | Caller | Mode | Notes |
|---|---|---|---|---|
| 1 | `block()` called by UI | useBlockActions:44 | user-triggered | — |
| 2 | `blockActorController(myActorId, targetActorId, sessionActorId)` | useBlockActions:51 | await | — |
| 3 | `checkBlockStatus(...)` pre-check guard | blockActor.controller.js:32 | await | 1 DB read |
| 4 | `blockActorDAL(...)` → `moderation.block_actor` RPC | blockActor.controller.js:35 | await | RPC (conditional on step 3) |
| 5 | `invalidateFeedBlockCache(myActorId)` | useBlockActions:52 | **sync** | In-memory Map.delete — cannot fail |

**invalidateFeedBlockCache is synchronous.** Original VENOM VF-02 concern about "fire-and-forget" is partially mitigated — the operation is a synchronous `Map.delete` and cannot throw asynchronously. The architectural placement fix (moved from controller to hook) was still correct.

### Flow D — Block Write via Feed Action Adapter (useBlockActorAction)

| Step | Operation | Caller | Mode | Notes |
|---|---|---|---|---|
| 1 | `useBlockActorAction()` callback invoked | useCentralFeedActions | await | — |
| 2 | `blockActorController(blockerActorId, blockedActorId, sessionActorId)` | useBlockActorAction:17 | await | — |
| 3 | Controller guard + RPC | blockActor.controller.js | await | — |
| 4 | **`invalidateFeedBlockCache` — NOT CALLED** | — | MISSING | Cache gap — see LF-02 |

**Cache invalidation gap confirmed.** After blocking from the feed, `readFeedBlockRowsDAL` cache retains the blocked actor for up to 60 seconds.

### Flow E — Bulk Block Filter (Friend Ranking / Post Create)

| Step | Operation | Caller | Mode | Cache |
|---|---|---|---|---|
| 1 | `ctrlGetBlockedActorSet(actorId, candidateActorIds)` called | getTopFriendActorIds.controller.js | await | — |
| 2 | `filterBlockedActors(actorId, candidateActorIds)` | block.read.dal.js:14 | await | NO CACHE |
| 3 | `moderation.blocks` SELECT (bulk OR-query) | Supabase | — | MISS |

**No cache wraps this path.** Called by: `getTopFriendActorIds.controller.js`, `getTopFriendCandidates.controller.js`, `getFriendLists.controller.js`, `createPost.controller.js`. Bulk query runs on every friend ranking computation and every post creation.

---

## DATABASE READ SUMMARY

| Table/View/RPC | Operation | Caller | Cache | Count per Profile Load | Notes |
|---|---|---|---|---|---|
| `moderation.blocks` | SELECT (bidirectional OR) | `checkBlockStatus` via `useBlockStatus` | NONE | **2× (duplicate)** | LF-01 — duplicate read |
| `moderation.blocks` | SELECT (bulk OR) | `readFeedBlockRowsDAL` | 60s TTL | 1 (on miss) | PASS |
| `moderation.blocks` | SELECT (bulk OR) | `filterBlockedActors` | NONE | 1 per call | LF-03 — no cache |
| `moderation.block_actor` | RPC | `blockActor.dal.js` | N/A | user-triggered | PASS |
| `moderation.unblock_actor` | RPC | `unblockActor.dal.js` | N/A | user-triggered | PASS |

---

## DUPLICATE QUERY FINGERPRINTS

**DUPLICATE FINGERPRINT — DF-01 (LF-01)**

```text
Fingerprint:    moderation.blocks / SELECT / bidirectional OR / status=active / limit=2
Duplicate count: 2 per profile screen load
Caller A:       VportProfileViewScreen:58 → useBlockStatus → ctrlGetBlockStatus → checkBlockStatus
Caller B:       VportProfileViewScreen:54 → useProfileGate:19 → useBlockStatus → ctrlGetBlockStatus → checkBlockStatus
Identical for:  ActorProfileViewScreen (same pattern at lines 70, 78)
Impact:         2 Supabase roundtrips instead of 1 on every profile page load
Evidence type:  INFERRED (confirmed via source read)
```

---

## TIMING BUDGET STATUS

All values UNKNOWN due to static analysis only. Runtime timing must be captured via live instrumentation.

| Runtime Area | Observed | Budget | Status |
|---|---|---|---|
| Route/screen load | UNKNOWN | 1500ms | UNKNOWN |
| Controller orchestration (`blockActorController`) | UNKNOWN | 300ms | UNKNOWN |
| `checkBlockStatus` (single DB read) | UNKNOWN | 150ms | UNKNOWN — uncached, called ×2 on profile load |
| Feed pipeline (`readFeedBlockRowsDAL`) | UNKNOWN | 500ms | UNKNOWN — cached; likely PASS on second hit |
| Hydration/render | UNKNOWN | 500ms | UNKNOWN |

---

## CACHE OBSERVATIONS

| Cache | Caller | Status | Evidence | Impact |
|---|---|---|---|---|
| `blockCache` (60s TTL) | `readFeedBlockRowsDAL` | HIT after first feed load | Source: `feed.read.blockRows.dal.js:23-29` | PASS — feed pipeline efficient |
| `blockCache` invalidation | `useBlockActions` (block/unblock) | SYNC (Map.delete) | Source: `feedCache.adapter.js:8-10` | Correctly invalidated on block/unblock via useBlockActions |
| `blockCache` invalidation | `useBlockActorAction` | **MISSING** | Source: `useBlockActorAction.js:17` — no invalidation call | LF-02 — 60s stale window after feed-triggered block |
| `checkBlockStatus` | `useBlockStatus` (direct) | BYPASS — NO CACHE | No Zustand store, no TTL | LF-01 contributing factor |

---

## RENDER / HOOK CHURN

| Component/Hook | Render Count | Effect Count | Query Impact | Likely Trigger |
|---|---|---|---|---|
| `useBlockStatus` (per instance) | Re-fires when `myActorId` or `targetActorId` changes | 1 effect per instance | 1 DB read per effect fire | Actor navigation, identity switch |
| Profile screen with 2× `useBlockStatus` | — | 2 effects | 2 DB reads | Screen mount, actor navigation |

---

## LOKI RUNTIME FINDINGS

---

**LOKI RUNTIME FINDING LF-01**
- Finding ID: LF-01
- Location: `VportProfileViewScreen.jsx:54+58`, `ActorProfileViewScreen.jsx:70+78`
- Application Scope: VCSM
- Runtime Risk Category: Duplicate read
- Evidence Type: INFERRED
- Observation Source: Static source analysis — confirmed both screens call `useProfileGate` (which calls `useBlockStatus` internally) AND call `useBlockStatus` directly with the same actor arguments
- Confidence: HIGH — code structure is deterministic; both hook instances fire independent `useEffect` → `ctrlGetBlockStatus` → `checkBlockStatus` → Supabase reads
- Current runtime behavior: Every profile screen load fires 2 identical `moderation.blocks` SELECT queries for the same `(viewerActorId, profileActorId)` pair. Neither has a TTL or Zustand cache.
- Runtime impact: Doubles Supabase read cost on every profile page load. For a user with many profile views per session, this is consistent waste. At typical Supabase latency (20–80ms per query), this adds 20–80ms of unnecessary wait on every profile open.
- Read Amplification: 2.0 (2 reads for 1 actor pair)
- Timing impact: +20–80ms per profile screen load (estimated; uncacheable with current architecture)
- Caller chain A: `VportProfileViewScreen` → `useBlockStatus(viewerActorId, profileActorId)` → `ctrlGetBlockStatus` → `checkBlockStatus` → `moderation.blocks`
- Caller chain B: `VportProfileViewScreen` → `useProfileGate(viewerActorId, profileActorId)` → `useBlockStatus(viewerActorId, targetActorId)` → `ctrlGetBlockStatus` → `checkBlockStatus` → `moderation.blocks`
- Cache status: BYPASS — no cache for either call path
- Severity: HIGH
- Recommended correction: `VportProfileViewScreen` and `ActorProfileViewScreen` should remove the direct `useBlockStatus` call and derive `canViewProfile` + `blockLoading` from the `gate` object returned by `useProfileGate`. `useProfileGate` already computes `isBlocked` and `loading` — the direct `useBlockStatus` call is redundant.
- Recommended handoff: KRAVEN (performance impact quantification), SENTRY (architecture drift — screen calls DAL surface twice for same data)
- Rationale: `useProfileGate` is the canonical gate hook for profile visibility. Screens should consume its output, not duplicate its internal reads. This is a read-amplification violation discoverable without live instrumentation.

---

**LOKI RUNTIME FINDING LF-02**
- Finding ID: LF-02
- Location: `apps/VCSM/src/features/block/hooks/useBlockActorAction.js:17`
- Application Scope: VCSM
- Runtime Risk Category: Cache bypass
- Evidence Type: INFERRED
- Observation Source: Static analysis — `useBlockActorAction.js` calls `blockActorController` only; no `invalidateFeedBlockCache` present. `useBlockActions.js` (sibling hook) correctly calls `invalidateFeedBlockCache` at lines 52 and 73.
- Confidence: HIGH — the absence of `invalidateFeedBlockCache` in `useBlockActorAction.js` is confirmed by source read
- Current runtime behavior: When a user blocks an actor via the feed action (which uses `useBlockActorAction` through `useCentralFeedActions`), the `readFeedBlockRowsDAL` TTL cache is NOT invalidated. The blocked actor continues to appear in the user's feed for up to 60 seconds until the TTL expires.
- Runtime impact: Blocked actor remains visible in feed for up to 60 seconds after a block action triggered via the feed surface. Safety regression — "block and they disappear" contract is violated for up to 60s.
- Read Amplification: N/A — cache bypass, not amplification
- Timing impact: Up to 60s of stale feed visibility after block action via feed
- Caller chain: `useCentralFeedActions` → `useBlockActorAction` adapter → `useBlockActorAction.js` → `blockActorController` (no cache invalidation)
- Cache status: STALE — `blockCache` retains blocked actor rows for up to 60s TTL
- Severity: HIGH
- Recommended correction: Add `invalidateFeedBlockCache(blockerActorId)` call to `useBlockActorAction.js` after `blockActorController` resolves. Pattern is already established in `useBlockActions.js`. Alternatively, move the invalidation to the controller and re-evaluate the SENTRY SF-01 decision — but the current hook-layer pattern is architecturally correct per SF-01.
- Recommended handoff: SENTRY (architectural decision — should invalidation live in hook or be a post-block side effect in the caller?), VENOM (safety: blocked actor transiently visible in feed)
- Rationale: Two parallel block hooks exist (`useBlockActions` and `useBlockActorAction`). One correctly invalidates the feed cache; the other does not. This is a parity gap between two hooks serving the same write path.

---

**LOKI RUNTIME FINDING LF-03**
- Finding ID: LF-03
- Location: `apps/VCSM/src/features/block/dal/block.read.dal.js:14` — `filterBlockedActors`; `apps/VCSM/src/features/upload/controllers/createPost.controller.js:16`
- Application Scope: VCSM
- Runtime Risk Category: Cache bypass
- Evidence Type: INFERRED
- Observation Source: Static analysis — `filterBlockedActors` has no TTL or Zustand cache. Called by 4 distinct consumers including `createPost.controller.js`.
- Confidence: MEDIUM — no live data on call frequency; impact depends on post creation rate and blocked actor list size
- Current runtime behavior: Every `createPost` action triggers a `moderation.blocks` bulk OR-query via `ctrlGetBlockedActorSet`. This query is uncached. For frequent creators or users with large blocked sets, this is a repeated uncached read on a mutation path.
- Runtime impact: Each post creation adds one uncached Supabase read for blocked actor filtering. Low severity at current scale; escalates as blocked set grows.
- Read Amplification: 1.0 per post create (not amplified, but avoidable)
- Timing impact: +20–80ms per post create operation (estimated)
- Caller chain: `createPost.controller.js` → `ctrlGetBlockedActorSet` → `filterBlockedActors` → `moderation.blocks`
- Cache status: BYPASS — no cache
- Severity: MEDIUM
- Recommended correction: Consider a short-lived (5–30s) TTL cache on `filterBlockedActors` results keyed by `actorId`. Block state changes rarely and any stale window is acceptable for post-creation audience filtering.
- Recommended handoff: KRAVEN (perf analysis), SENTRY (cache placement decision)
- Rationale: Blocked actor set is not expected to change between consecutive post creations. A brief TTL cache would eliminate the uncached read without meaningful accuracy loss.

---

**LOKI RUNTIME FINDING LF-04 (PASS)**
- Finding ID: LF-04
- Location: `apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js`
- Application Scope: VCSM
- Runtime Risk Category: N/A — PASS
- Evidence Type: INFERRED
- Current runtime behavior: `readFeedBlockRowsDAL` is called inside `Promise.all` with 8 other DAL calls. First call incurs one Supabase read; subsequent calls within 60s are served from TTL cache. Cache is correctly invalidated by `useBlockActions` after block/unblock.
- Read Amplification: ~0 (cache hit) after first page load
- Cache status: HIT (60s TTL)
- Severity: NONE — this path is correctly implemented
- Notes: Feed pipeline already has DEV-mode `wrapDAL` profiler instrumentation (`feedProfiler`) wrapping block rows DAL. This is correct observability practice for the feed path.

---

## OBSERVABILITY GOVERNANCE STATUS

| Area | Coverage | Missing Visibility | Risk |
|---|---|---|---|
| Feed block filter | STRONG — wrapDAL + TTL cache + recordStep | — | LOW |
| Profile block status read | MINIMAL — no instrumentation; no cache; duplicate calls | Timing per call; cache miss count; duplicate call detection | HIGH |
| Block write (useBlockActions) | BASIC — console.error on failure | Cache invalidation confirmation; RPC timing; success/failure audit trail | MEDIUM |
| Block write (useBlockActorAction) | MINIMAL — no logging, no cache invalidation | Completion signal; cache invalidation; failure path | HIGH |
| Bulk block filter (filterBlockedActors) | MINIMAL — no cache, no timing | Query timing; call frequency; blocked set size | MEDIUM |
| Block status in chat | MINIMAL — error catch only in hook | Conversation block check timing; fail-closed signal | MEDIUM |

---

## OBSERVABILITY GAP REVIEW

| Flow | Current Visibility | Missing Signals | Severity | Recommended Instrumentation |
|---|---|---|---|---|
| Profile block status read (duplicate calls) | None | Duplicate call count, timing per read, cache miss rate | HIGH | Add DEV-only timing wrapper around `checkBlockStatus` — log caller, timing, actorId pair fingerprint |
| `useBlockActorAction` write path | None | Block success/failure, missing cache invalidation signal | HIGH | Add completion log (actorId, duration, success/failure); add `invalidateFeedBlockCache` call |
| `filterBlockedActors` bulk query | None | Query timing, blocked set size, call frequency | MEDIUM | Add DEV-only timing log inside `filterBlockedActors` |
| Feed block cache invalidation | None (invalidation is silent) | Confirmation that cache was invalidated after block action | MEDIUM | Add DEV-only log in `invalidateFeedBlockCache` — log viewerActorId and timestamp |

---

## AUDIT TRAIL WARNINGS

**AUDIT TRAIL WARNING — ATW-01**
Flow: Block write path (`blockActorController` / `unblockActorController`)
Missing audit evidence: No client-side audit event is logged on block/unblock success. The Supabase `block_events` table is written by the RPC server-side (correct), but the app layer does not confirm receipt or log the block action for client-side debugging.
Operational risk: If a block action fails silently (RPC returns no error but block row is not created), there is no client-side evidence trail.
Recommended audit event: DEV-only `console.log('[blockActor] success:', { blockerActorId, blockedActorId, timestamp })` inside `blockActorController` on successful RPC return.

**AUDIT TRAIL WARNING — ATW-02**
Flow: `useBlockActorAction` — feed surface block
Missing audit evidence: `useBlockActorAction` has no logging on success or failure. If a feed-triggered block fails, there is no observable signal beyond an uncaught throw at the caller.
Operational risk: Silent failures on feed block actions are undetectable in production without runtime instrumentation.
Recommended audit event: Add `try/catch` with `console.error('[useBlockActorAction] failed:', err)` wrapping the controller call.

---

## INSTRUMENTATION RECOMMENDATIONS

**INSTRUMENTATION RECOMMENDATION — IR-01**
Location: `apps/VCSM/src/features/block/dal/block.check.dal.js:13` — `checkBlockStatus`
Purpose: Detect duplicate calls per actor pair; measure per-call latency
Suggested signal: `[checkBlockStatus] actorA=…, actorB=…, duration=…ms`
Log level: DEV-only (`import.meta.env.DEV`)
Production-safe: YES (DEV-gated)
Dev-only: YES
Recommended owner: LOKI / block feature

**INSTRUMENTATION RECOMMENDATION — IR-02**
Location: `apps/VCSM/src/features/block/hooks/useBlockActorAction.js:9`
Purpose: Track feed-triggered block success/failure; trigger cache invalidation
Suggested signal: Add `invalidateFeedBlockCache(blockerActorId)` after controller call; add `console.log('[useBlockActorAction] blocked actorId=…')` DEV-only
Log level: DEV-only
Production-safe: YES (DEV-gated)
Dev-only: YES
Recommended owner: block feature

**INSTRUMENTATION RECOMMENDATION — IR-03**
Location: `apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx:58`
Purpose: Remove duplicate `useBlockStatus` call — use `gate` result instead
Suggested signal: N/A — architectural change, not just instrumentation
Log level: N/A
Production-safe: YES
Dev-only: NO — this is a fix, not an instrument
Recommended owner: profiles feature / SENTRY + KRAVEN

---

## CORRELATION ID REVIEW

| Flow | Correlation Present | Risk | Recommendation |
|---|---|---|---|
| Block write (blockActorController) | NO | MEDIUM — no trace linkage between app call and RPC event | Add DEV-only traceId to block write log and RPC call |
| Profile screen block status check | NO | LOW | Add DEV-only call fingerprint (actorA+actorB hash) to detect duplicate calls |
| Feed block cache invalidation | NO | LOW | Add DEV-only log with viewerActorId + timestamp on invalidate |

---

## OBSERVABILITY MATURITY CLASSIFICATION

**Block feature overall: BASIC**

Rationale:
- Feed pipeline has strong observability (wrapDAL, recordStep) — FUNCTIONAL
- DAL error paths have `console.error` — BASIC
- Block status read path has no instrumentation, no cache, and fires duplicates — MINIMAL
- Block write path via `useBlockActorAction` has no logging, no cache invalidation — MINIMAL
- No runtime reconstruction possible for block feature without adding instrumentation

---

## HANDOFF MATRIX

| Finding | Recommended Handoff | Reason |
|---|---|---|
| LF-01 — duplicate checkBlockStatus reads on profile screens | KRAVEN (perf quantification), SENTRY (architecture drift) | Duplicate reads are a boundary drift concern (screen duplicating gate hook internals) and a performance concern |
| LF-02 — useBlockActorAction missing feed cache invalidation | SENTRY (architectural parity between the two block hooks), VENOM (safety: blocked actor transiently visible) | Safety + architecture concern |
| LF-03 — filterBlockedActors uncached on post create | KRAVEN | Performance concern; low urgency |
| LF-04 (PASS) — feed block rows correctly cached | — | No action needed |
| ATW-01 — no client-side block write audit | VENOM | Security Operations domain |
| ATW-02 — useBlockActorAction silent failure | DEADPOOL (if silent failure is observed) | Debugging gap |

---

## FINAL LOKI STATUS: WATCH

Two HIGH findings (LF-01, LF-02) identified from static analysis:
- LF-01 is a correctness/efficiency concern: 2× uncached DB reads per profile load
- LF-02 is a safety concern: blocked actor transiently visible in feed for up to 60s after feed-triggered block

Neither is CRITICAL (no runaway loops, no query storms). Both are addressed with targeted fixes:
- LF-01: Remove direct `useBlockStatus` call from profile screens; use `gate` object from `useProfileGate`
- LF-02: Add `invalidateFeedBlockCache(blockerActorId)` to `useBlockActorAction.js`

**LOKI COMPLETE — 2026-05-14**
