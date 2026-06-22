# Block Feature — Performance

**Sources:** KRAVEN 2026-05-10, LOKI 2026-05-14

> Note: CURRENT_STATUS.md records KRAVEN as `NOT_STARTED`. This is incorrect. KRAVEN ran on 2026-05-10 and produced 9 findings (see `2026-05-10_kraven_private-block-profile-logic.md`). The correct status is COMPLETE. This file supersedes the CURRENT_STATUS.md KRAVEN entry.

---

## KRAVEN Performance Audit — 2026-05-10

**Scope:** Feed pipeline, block system, follow system, privacy enforcement, profile gate
**Analyst:** KRAVEN
**Source file:** `zNOTFORPRODUCTION/CURRENT/features/block/2026-05-10_kraven_private-block-profile-logic.md`

---

### Finding 1 — Feed block cache not invalidated on block write

```
KRAVEN PERFORMANCE FINDING
- Location: apps/VCSM/src/features/block/controllers/blockActor.controller.js
            apps/VCSM/src/features/block/dal/block.write.dal.js
            apps/VCSM/src/features/feed/dal/feed.read.blockRows.dal.js
- Application Scope: VCSM
- Current behavior:
    blockActorController calls checkBlockStatus (1 DB read to moderation.blocks), then
    blockActorDAL (1 RPC to moderation.block_actor), then deleteFriendRankRowsBetweenActors.
    After all three complete, the block write path returns. At no point does it call
    invalidateFeedBlockCache(). The feed block rows cache has a 60-second TTL.
    Result: after a user blocks someone, the feed continues to display that actor's posts
    for up to 60 seconds until the cache expires naturally.
- Detected pattern: Cache invalidation gap — write path does not bust the read cache.
    invalidateFeedBlockCache() is exported from feed.read.blockRows.dal.js but has zero
    callers anywhere in the codebase (confirmed by grep). The function exists but is never
    invoked.
- Estimated impact: HIGH
- Root cause hypothesis: The block write path (features/block/) and the feed read path
    (features/feed/dal/) are in different feature boundaries. The block controller correctly
    does not directly import from feed internals (arch rule: no cross-feature internals),
    but no adapter or orchestration layer was ever wired to bridge the write→cache-bust.
    The exported invalidation function was written anticipating this connection but was
    never hooked up.
- Recommended optimization:
    Option A (preferred): Wire invalidateFeedBlockCache(blockerActorId) through an adapter
    or the block hook layer after blockActorController completes. The feed block cache is
    keyed by viewerActorId so only the blocker's cache needs busting.
    Option B: Reduce block cache TTL from 60s to 10s as a cheap safety net, accepting
    slightly more DB reads in exchange for faster state propagation.
- Expected improvement: Blocked actors disappear from feed immediately after block action
    rather than persisting for up to 60 seconds. Eliminates a user-visible safety bug.
```

---

### Finding 7 — Bidirectional OR query dual-index requirement

```
KRAVEN PERFORMANCE FINDING
- Location: apps/VCSM/src/features/feed/dal/feed.read.blockRows.dal.js (lines 32–41)
            apps/VCSM/src/features/profiles/dal/friends/blockedActorSet.read.dal.js
- Application Scope: VCSM
- Current behavior:
    The feed block query uses a bidirectional OR clause:
      and(blocker_actor_id.eq.X,blocked_actor_id.in.(Y,Z,...))
      ,and(blocked_actor_id.eq.X,blocker_actor_id.in.(Y,Z,...))
    This is correct for enforcing mutual block visibility (blocked-me should also be hidden).
    The OR clause requires a UNION-equivalent scan across two index directions on the blocks
    table. If the moderation.blocks table has a composite index on (blocker_actor_id, status)
    and a separate index on (blocked_actor_id, status), Postgres can use index scans for
    both sides. Without both indexes, one side of the OR will trigger a sequential scan on
    large block tables.
    The same bidirectional OR pattern is used in block.check.dal.js (checkBlockStatus)
    without any caching — every call to checkBlockStatus (used before every block write
    for idempotency) hits the DB fresh.
    For a moderately active user with 50 blocks, this is 2 index lookups per feed page load.
    For a power user with 500 blocks, the .in() clause grows and DB cost increases linearly.
- Detected pattern: Bidirectional OR block query is inherently a two-index-path query;
    block check DAL (checkBlockStatus) has no caching, fires on every block/unblock action.
- Estimated impact: LOW (with proper DB indexes) / MEDIUM (without them)
- Root cause hypothesis: The bidirectional block check is functionally correct. The risk is
    index coverage on the moderation.blocks table. If only (blocker_actor_id) is indexed
    and not (blocked_actor_id), the reverse direction of the OR becomes a full table scan.
    checkBlockStatus also lacks caching — the idempotency pre-check before every block
    action adds one uncached round-trip per toggle.
- Recommended optimization:
    1. Confirm moderation.blocks has BOTH (blocker_actor_id, status) AND (blocked_actor_id, status)
       composite indexes. If not, add them — this is the highest-value DB-side fix.
    2. Add a short TTL cache (10–15 seconds) to checkBlockStatus — the idempotency check
       does not need to be perfectly fresh; the block RPC is idempotent anyway.
- Expected improvement: With both indexes confirmed, block query cost stays O(log n) at
    scale. Caching checkBlockStatus eliminates 1 uncached DB round-trip per block toggle.
```

---

### Finding 8 — checkBlockStatus lacks cache

```
KRAVEN PERFORMANCE FINDING
- Location: apps/VCSM/src/features/feed/model/feedRowVisibility.model.js
            apps/VCSM/src/features/feed/model/feedBlockVisibility.model.js
            apps/VCSM/src/features/feed/model/feedFollowVisibility.model.js
            apps/VCSM/src/features/feed/model/feedPrivateVisibility.model.js
- Application Scope: VCSM
- Current behavior:
    resolveFeedRowVisibilityModel is called once per post row. It performs:
      1. isActorBlockedForViewerModel → Set.has() on blockedActorSet — O(1)
      2. actorMap lookup by rowActorId — O(1) object property access
      3. vportMap lookup (if actor.vport_id) — O(1)
      4. profileMap lookup by actor.profile_id — O(1)
      5. isActorFollowedByViewerModel → Set.has() on followedActorSet — O(1)
      6. canViewPrivateFeedActorModel → 3 boolean checks — O(1)
    All operations are O(1). For a 20-post page, total model cost is 20 × (6 O(1) ops) = 120
    constant-time operations. This is essentially free at any scale.
    The data structures consulted (Sets for block/follow, plain objects for actorMap/profileMap/
    vportMap) are all built once before normalization begins, not per-row.
- Detected pattern: Well-implemented visibility model — no performance concern at current scale.
- Estimated impact: LOW (no action needed)
- Root cause hypothesis: N/A — model is correctly using Set lookups and pre-built maps.
- Recommended optimization: None. The model is already optimal for its role.
- Expected improvement: N/A
```

> Note: Finding 8 in the KRAVEN audit documents the feedRowVisibility model as performing well (PASS). The finding ID maps to this entry in the KRAVEN priority list. See the KRAVEN source file for the full 9-finding audit including Findings 2–6 and 9 which are scoped to the follow and privacy subsystems.

---

### KRAVEN Priority Table (all findings)

| Priority | Finding | Impact | Category |
|---|---|---|---|
| 1 | Feed block cache not invalidated on block write | HIGH | Privacy/correctness bug |
| 2 | Feed follow cache not invalidated on follow/unfollow | HIGH | Privacy/correctness bug |
| 3 | Follow rows cache is page-scoped, not viewer-graph-scoped | MEDIUM | Cache hit rate |
| 4 | Dual privacy read race on cold profile page load | MEDIUM | DB read duplication |
| 5 | Unfollow makes 2 sequential DB writes — can be parallelized | MEDIUM | Latency |
| 6 | Follow pre-flight reads uncached follow status | MEDIUM | Latency per follow action |
| 7 | Block query bidirectional OR requires dual-index coverage | LOW–MEDIUM | DB cost at scale |
| 8 | checkBlockStatus (idempotency check) has no cache | LOW | Latency |
| 9 | Actor bundle vs block/follow cache TTL mismatch (30s vs 60s) | LOW | Consistency |
| 10 | feedRowVisibility model — no issues found | NONE | Already optimal |

---

## LOKI Runtime Audit — 2026-05-14

**Analyst:** LOKI
**Evidence type:** Inferred (static analysis)
**Source file:** `zNOTFORPRODUCTION/CURRENT/features/block/vcsm.dal.block.md`

---

### LF-01 — Duplicate `checkBlockStatus` reads on profile screens (HIGH)

**Evidence Type:** INFERRED · Confidence: HIGH

**Finding:** Both `VportProfileViewScreen.jsx` (line 58) and `ActorProfileViewScreen.jsx` (line 78) call `useBlockStatus(viewerActorId, profileActorId)` directly. Both screens also call `useProfileGate(viewerActorId, targetActorId)` (lines 54 and 70 respectively), which internally calls `useBlockStatus` with the same arguments at `useProfileGate.js:19`. `checkBlockStatus` has NO TTL cache — every call hits `moderation.blocks` via Supabase.

**Runtime impact:** Every profile screen load fires 2x uncached `moderation.blocks` queries for identical actor pairs.

**Read Amplification Score:** 2.0 (2 reads / 1 primary check)

**Caller chain:**
```
VportProfileViewScreen → useProfileGate → useBlockStatus → checkBlockStatus → moderation.blocks
VportProfileViewScreen → useBlockStatus (direct) → checkBlockStatus → moderation.blocks
ActorProfileViewScreen → useProfileGate → useBlockStatus → checkBlockStatus → moderation.blocks
ActorProfileViewScreen → useBlockStatus (direct) → checkBlockStatus → moderation.blocks
```

**Fix:** Remove the direct `useBlockStatus` call from both profile screens. Derive `canViewProfile`, `blockLoading`, `isBlocked`, and `blockedMe` from the `gate` object already returned by `useProfileGate`. No new DAL or controller work required.

**Recommended handoff:** KRAVEN (duplicate read pattern) + Wolverine (code fix)

**Status:** OPEN

---

### LF-02 — `useBlockActorAction.js` missing feed cache invalidation (HIGH)

**Evidence Type:** INFERRED · Confidence: HIGH

**Finding:** `apps/VCSM/src/features/block/hooks/useBlockActorAction.js` (19 lines) calls `blockActorController` but does NOT import or call `invalidateFeedBlockCache`. By contrast, `useBlockActions.js` (90 lines) correctly calls `invalidateFeedBlockCache(myActorId)` at lines 52 and 73 after controller resolution.

The `blockCache` in `feed.read.blockRows.dal.js` has a 60s TTL. Any block action triggered through `useBlockActorAction` leaves the blocked actor visible in the feed for up to 60 seconds.

**Runtime impact:** Feed-triggered block creates a 60s stale window — blocked actor content remains visible until TTL expires.

**Caller chain:**
```
[some UI surface] → useBlockActorAction → blockActorController → moderation.block_actor RPC
                                        ↳ [missing] invalidateFeedBlockCache
```

**Fix:** Add `import { invalidateFeedBlockCache } from "@/features/feed/adapters/feedCache.adapter"` to `useBlockActorAction.js` and call `invalidateFeedBlockCache(blockerActorId)` after `blockActorController` resolves successfully.

**Recommended handoff:** VENOM (safety-adjacent gap) + Wolverine (code fix)

**Status:** OPEN

---

### LF-03 — `filterBlockedActors` uncached (MEDIUM — accepted)

**Evidence Type:** INFERRED · Confidence: MEDIUM

**Finding:** `block.read.dal.js` exports `filterBlockedActors` with no TTL cache. Bulk OR-query against `moderation.blocks` per content list. Caller volume and query shape on large social graphs are unquantified.

**Recommended handoff:** KRAVEN (performance quantification)

**Status:** ACCEPTED — KRAVEN pending

---

### LOKI Findings Summary

| Finding | Severity | Status | Recommended Handoff |
|---|---|---|---|
| LF-01 — Duplicate `checkBlockStatus` reads on profile screens | HIGH | OPEN — fix is straightforward; no DAL changes needed | KRAVEN + Wolverine |
| LF-02 — `useBlockActorAction.js` missing feed cache invalidation | HIGH | OPEN — one import + one call needed | VENOM + Wolverine |
| LF-03 — `filterBlockedActors` uncached, bulk query unquantified | MEDIUM | ACCEPTED — KRAVEN pending | KRAVEN |

---

## Cache State Summary (as of LOKI audit 2026-05-14)

| DAL / Path | Cache | TTL | Status |
|---|---|---|---|
| `readFeedBlockRowsDAL` | YES — `createTTLCache` | 60s | PASS |
| `checkBlockStatus` (direct) | NO | — | OPEN — LF-01 |
| `filterBlockedActors` (bulk) | NO | — | ACCEPTED — LF-03 |
| `invalidateFeedBlockCache` in `useBlockActions.js` | SYNC invalidation | — | PASS |
| `invalidateFeedBlockCache` in `useBlockActorAction.js` | MISSING | — | OPEN — LF-02 |
