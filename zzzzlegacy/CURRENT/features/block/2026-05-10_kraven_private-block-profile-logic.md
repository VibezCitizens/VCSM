# KRAVEN PERFORMANCE AUDIT
## Private Profile & Block/Follow Enforcement Logic
**Date:** 2026-05-10
**Scope:** apps/VCSM/ — Feed pipeline, block system, follow system, privacy enforcement, profile gate
**Analyst:** KRAVEN
**Analysis only — no code was modified**

---

## FILES AUDITED

| File | Purpose |
|---|---|
| `apps/VCSM/src/features/feed/dal/feed.read.blockRows.dal.js` | Feed block rows read |
| `apps/VCSM/src/features/feed/dal/feed.read.followRows.dal.js` | Feed follow rows read |
| `apps/VCSM/src/features/feed/model/feedRowVisibility.model.js` | Per-row visibility decision |
| `apps/VCSM/src/features/feed/model/feedBlockVisibility.model.js` | Block set builder + lookup |
| `apps/VCSM/src/features/feed/model/feedFollowVisibility.model.js` | Follow set builder + lookup |
| `apps/VCSM/src/features/feed/model/feedPrivateVisibility.model.js` | Private gate decision |
| `apps/VCSM/src/features/feed/dal/feed.read.actorsBundle.dal.js` | Actor+profile+vport+privacy batch read |
| `apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js` | Full feed page pipeline |
| `apps/VCSM/src/features/block/controllers/blockActor.controller.js` | Block write controller |
| `apps/VCSM/src/features/block/dal/block.write.dal.js` | Block write DAL (RPC) |
| `apps/VCSM/src/features/block/dal/block.check.dal.js` | Block status check DAL |
| `apps/VCSM/src/features/social/friend/subscribe/controllers/follow.controller.js` | Follow write controller |
| `apps/VCSM/src/features/social/friend/subscribe/controllers/unsubscribe.controller.js` | Unfollow write controller |
| `apps/VCSM/src/features/social/friend/subscribe/controllers/getFollowRelationshipState.controller.js` | Pre-follow state read |
| `apps/VCSM/src/features/social/friend/subscribe/hooks/useFollowActorToggle.js` | Follow toggle hook |
| `apps/VCSM/src/features/social/friend/request/dal/actorFollows.dal.js` | Follow read/write DAL |
| `apps/VCSM/src/features/social/friend/request/dal/followRequests.dal.js` | Follow request DAL |
| `apps/VCSM/src/features/social/privacy/dal/actorPrivacy.dal.js` | Privacy settings read DAL |
| `apps/VCSM/src/features/social/privacy/controllers/getActorPrivacy.controller.js` | Privacy read controller |
| `apps/VCSM/src/features/profiles/hooks/useProfileGate.js` | Profile page private enforcement |
| `apps/VCSM/src/features/profiles/dal/readActorProfile.dal.js` | Profile page actor read |
| `apps/VCSM/src/features/social/friend/subscribe/dal/subscriberCount.dal.js` | Follower count DAL |

---

## PERFORMANCE FINDINGS

---

### FINDING 1

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

### FINDING 2

```
KRAVEN PERFORMANCE FINDING
- Location: apps/VCSM/src/features/social/friend/subscribe/controllers/follow.controller.js
            apps/VCSM/src/features/social/friend/subscribe/controllers/unsubscribe.controller.js
            apps/VCSM/src/features/feed/dal/feed.read.followRows.dal.js
- Application Scope: VCSM
- Current behavior:
    ctrlSubscribe and ctrlUnsubscribe both complete successfully and invalidate the follower
    COUNT cache (via invalidateFollowerCount). Neither calls invalidateFeedFollowCache().
    The feed follow rows cache has a 60-second TTL.
    After a user follows an actor, the feed still treats that actor as "not following" for
    up to 60 seconds — meaning private posts from newly followed actors stay hidden.
    After unfollow, the feed still treats the actor as "following" for up to 60 seconds —
    meaning private posts from just-unfollowed actors may remain visible.
    invalidateFeedFollowCache() is exported from feed.read.followRows.dal.js but has zero
    callers in the codebase.
- Detected pattern: Symmetric cache invalidation gap (matching Finding 1 for follow path).
- Estimated impact: HIGH
- Root cause hypothesis: Same structural gap as Finding 1. The follow write controllers live
    in features/social/, the feed follow cache lives in features/feed/. No bridge was wired.
    The privacy impact is asymmetric: the follow→cache miss scenario (private content stays
    hidden post-follow) is a functional bug. The unfollow→cache miss scenario (private content
    stays visible post-unfollow) is a privacy correctness bug.
- Recommended optimization:
    Wire invalidateFeedFollowCache(viewerActorId) after ctrlSubscribe and ctrlUnsubscribe
    complete. The feed follow cache is keyed by viewerActorId (follower), so only the
    follower's cache entry needs busting.
    For the unfollow case specifically, this is a privacy-correctness issue and should be
    treated as a bug fix, not just a performance optimization.
- Expected improvement: Follow/unfollow changes are immediately reflected in the feed
    privacy gate. Private account content access is correctly revoked within the same
    session after unfollow.
```

---

### FINDING 3

```
KRAVEN PERFORMANCE FINDING
- Location: apps/VCSM/src/features/social/friend/subscribe/controllers/follow.controller.js
            apps/VCSM/src/features/social/friend/subscribe/controllers/getFollowRelationshipState.controller.js
- Application Scope: VCSM
- Current behavior:
    ctrlSubscribe (the follow write path) calls ctrlGetFollowRelationshipState before
    deciding whether to insert a follow or send a request. This pre-flight check runs
    three parallel DB reads:
      1. ctrlGetActorPrivacy → vc.actor_privacy_settings (1 point read)
      2. ctrlGetFollowStatus → vc.actor_follows (1 point read)
      3. ctrlGetFollowRequestStatus → vc.social_follow_requests (1 point read)
    All three fire in Promise.all, so latency is max(3 reads) not sum. After this check,
    ctrlSubscribe makes a 4th DB call: dalInsertFollow (upsert to vc.actor_follows) plus
    a fire-and-forget publishVcsmNotification call.
    Total serial round trips on the follow happy path: 2 (pre-flight batch + upsert).
    Total serial round trips on the private account path: 3 (pre-flight batch + request
    upsert + notification).
- Detected pattern: Pre-flight relationship state read adds latency to every follow action.
    The privacy and request status reads could be served from cache but currently
    ctrlGetFollowStatus (dalGetFollowStatus) has NO TTL cache — every call hits the DB.
- Estimated impact: MEDIUM
- Root cause hypothesis: The relationship state controller was designed for correctness
    (checking current DB state before acting) but lacks caching on the point reads.
    dalGetFollowStatus reads vc.actor_follows with a single row lookup — cheap per query
    but adds one network round-trip per follow action. Privacy read IS cached at 30s TTL
    in dalGetActorPrivacy, so the privacy leg will usually be served from memory after
    the first profile page visit.
- Recommended optimization:
    Add a short TTL cache (5–10 seconds) to dalGetFollowStatus for point lookups.
    This is a pre-action idempotency check — the window of stale state is acceptable
    because dalInsertFollow is idempotent by PK upsert.
    Alternatively, the ctrlSubscribe pre-flight could be eliminated entirely and rely
    on the upsert + server-side constraint to be idempotent, routing to the request
    path only when the upsert fails with a privacy constraint error.
- Expected improvement: Follow action total latency reduced by ~30–50ms (one fewer
    uncached network round-trip eliminated from the pre-flight serial chain).
```

---

### FINDING 4

```
KRAVEN PERFORMANCE FINDING
- Location: apps/VCSM/src/features/social/friend/subscribe/controllers/unsubscribe.controller.js
- Application Scope: VCSM
- Current behavior:
    ctrlUnsubscribe runs two sequential awaited DB writes:
      1. dalDeactivateFollow → UPDATE vc.actor_follows SET is_active=false
      2. dalUpdateRequestStatus → UPDATE vc.social_follow_requests SET status='revoked'
    These two writes are independent (different tables, no foreign key dependency between
    them on the write side) but are executed serially — step 2 only starts after step 1
    returns. The total unsubscribe path latency is sum(write1) + sum(write2) instead of
    max(write1, write2).
- Detected pattern: Unnecessary serial DB writes — two independent mutations executed
    sequentially instead of in parallel.
- Estimated impact: MEDIUM
- Root cause hypothesis: The unsubscribe controller was written with a sequential flow for
    clarity. The request status revocation (step 2) was likely added later and appended
    at the bottom. There is no data dependency between the two writes.
- Recommended optimization:
    Wrap both writes in Promise.all:
    await Promise.all([
      dalDeactivateFollow({ followerActorId, followedActorId }),
      dalUpdateRequestStatus({ requesterActorId: followerActorId, targetActorId: followedActorId, status: 'revoked' }),
    ])
    This reduces unsubscribe DB round-trip time from ~sum to ~max of two independent writes.
- Expected improvement: Unfollow action latency reduced by ~20–40ms (one sequential DB
    round-trip eliminated). Higher improvement on high-latency DB connections.
```

---

### FINDING 5

```
KRAVEN PERFORMANCE FINDING
- Location: apps/VCSM/src/features/feed/dal/feed.read.followRows.dal.js (lines 29–35)
- Application Scope: VCSM
- Current behavior:
    readFeedFollowRowsDAL scopes the follow query with:
      .eq("follower_actor_id", viewerActorId)
      .in("followed_actor_id", uniqueActorIds)
    This means it only fetches follow edges for actors visible on the current page.
    On cache MISS, this is correct and efficient — it only fetches what the page needs.
    On cache HIT, the cached follow rows are filtered by the page's actorIds:
      cached.filter((r) => idSet.has(r.followed_actor_id))
    The cache stores only the page-scoped rows, not the viewer's full follow graph.
    Problem: each new feed page (pagination) that contains different actor IDs will
    trigger a cache MISS because the cached rows from page 1 won't contain actors from
    page 2. The 60-second TTL only helps if the same actor appears on multiple pages.
    A user following 500 actors and viewing a 20-actor-per-page feed will get a DB read
    on virtually every page scroll.
- Detected pattern: Page-scoped caching — cache entries are bounded by actorIds parameter,
    not by viewer's full follow graph. Cache hit rate degrades as feed diversity increases.
- Estimated impact: MEDIUM
- Root cause hypothesis: The DAL was designed to serve page-level data efficiently (only
    fetch what is needed) but the cache key is viewerActorId without considering that the
    value stored is a subset of that viewer's follows, not the full set. This creates an
    effective cache miss on every page of a diverse feed.
- Recommended optimization:
    Pre-load and cache the viewer's full follow graph at session start (or first feed load),
    keyed by viewerActorId. Filter client-side per page. Viewers following hundreds of
    actors produce rows of only ~3 columns (follower_actor_id, followed_actor_id, is_active)
    — 500 follows is roughly 30–50KB in-memory which is entirely acceptable.
    Alternatively, expand the cache to store the full graph and use client-side filtering,
    ensuring the 60s TTL applies to the complete follow set rather than per-page subsets.
- Expected improvement: Follow rows DB reads reduced from O(pages) to O(1) per 60-second
    window. On a 5-page feed scroll session, eliminates 4 of 5 follow-rows DB reads.
```

---

### FINDING 6

```
KRAVEN PERFORMANCE FINDING
- Location: apps/VCSM/src/features/profiles/hooks/useProfileGate.js
            apps/VCSM/src/features/social/privacy/hooks/useActorPrivacy.js
            apps/VCSM/src/features/social/friend/subscribe/hooks/useFollowStatus.js
            apps/VCSM/src/features/feed/dal/feed.read.actorsBundle.dal.js (privacy read)
- Application Scope: VCSM
- Current behavior:
    The feed pipeline reads vc.actor_privacy_settings for all uncached actor IDs as part
    of readActorsBundle (batched, in a parallel Promise.all — efficient).
    The profile page uses useProfileGate which independently calls:
      - useActorPrivacy → ctrlGetActorPrivacy → dalGetActorPrivacy → vc.actor_privacy_settings (1 point read)
      - useFollowStatus → ctrlGetFollowStatus → dalGetFollowStatus → vc.actor_follows (1 point read)
    These are two separate point reads fired when the profile page mounts.
    dalGetActorPrivacy has a 30-second TTL cache keyed by actorId. If the feed was loaded
    before the profile page, the privacy value may be in cache. However, if the user
    navigates directly to a profile page (no prior feed load), both reads are cold.
    Additionally, readActorProfileDAL (used by getProfileView.controller) also calls
    dalGetActorPrivacy in its own parallel fetch — meaning on a cold profile page load,
    dalGetActorPrivacy may be called twice nearly simultaneously (from readActorProfileDAL
    and from useActorPrivacy in useProfileGate), potentially racing before the first call
    populates the cache.
- Detected pattern: Dual privacy reads on cold profile page — readActorProfileDAL and
    useProfileGate both independently trigger dalGetActorPrivacy without coordination.
    Cache may not prevent the race on first load because both calls start before either
    returns.
- Estimated impact: MEDIUM
- Root cause hypothesis: readActorProfileDAL (DAL layer) and useActorPrivacy (hook layer)
    are uncoordinated — there is no shared promise or deduplication between them.
    createTTLCache does not deduplicate concurrent in-flight requests for the same key,
    so two simultaneous calls for the same actorId will both hit the DB and both write
    to the cache.
- Recommended optimization:
    Add in-flight request deduplication to the privacy DAL (store a pending Promise per
    actorId in a Map; if a call for the same actorId arrives while one is in-flight, return
    the existing promise rather than issuing a second DB query).
    Alternatively, have readActorProfileDAL return the privacy result in its response
    object so useProfileGate can consume it directly rather than re-fetching.
- Expected improvement: On cold profile page load, vc.actor_privacy_settings reads reduced
    from 2 to 1. On warm load (prior feed load cached the value), no change — already fast.
```

---

### FINDING 7

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

### FINDING 8

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

---

### FINDING 9

```
KRAVEN PERFORMANCE FINDING
- Location: apps/VCSM/src/features/feed/dal/feed.read.actorsBundle.dal.js
- Application Scope: VCSM
- Current behavior:
    readActorsBundle fetches privacy settings (vc.actor_privacy_settings) for all uncached
    actor IDs as part of its parallel Promise.all block (alongside profiles and vports).
    The privacy data is merged into the profileMap at cache-time and cached per actor at
    30-second TTL. This is efficient and batched.
    However, the actor bundle cache TTL (30 seconds) is shorter than the block and follow
    caches (60 seconds each). This creates a mismatch: block/follow state can be 60 seconds
    stale while actor privacy state is only 30 seconds stale. After a privacy setting change
    (user goes private), the bundle cache could serve fresh privacy data while the follow
    cache still holds the old follow graph, causing the visibility model to make decisions
    from two different points in time.
- Detected pattern: TTL mismatch between related caches — actor bundle (30s) vs block/follow
    rows (60s). Visibility decisions are computed from data that may be up to 30 seconds
    apart in staleness.
- Estimated impact: LOW
- Root cause hypothesis: Cache TTLs were set independently per DAL without a cross-cache
    consistency policy. The actor bundle was given a shorter TTL because actors change more
    frequently; block/follow was given longer TTL because social graph changes less frequently.
    This is a reasonable heuristic but creates a window where visibility decisions are
    computed from temporally inconsistent snapshots.
- Recommended optimization:
    Align all feed visibility caches to the same TTL (recommend 60 seconds across the board)
    or document the intentional mismatch explicitly. The 30s vs 60s window is unlikely to
    cause user-visible issues in practice, but it should be a documented decision rather
    than an accidental divergence.
- Expected improvement: Consistency — visibility decisions are made from data of similar
    age. No DB query reduction; this is a correctness/reliability improvement.
```

---

## PRIORITY LIST — RANKED BY IMPACT

| Priority | Finding | Impact | Category | File(s) |
|---|---|---|---|---|
| **1** | Feed block cache not invalidated on block write | HIGH | Privacy/correctness bug | `block/controllers/blockActor.controller.js`, `feed/dal/feed.read.blockRows.dal.js` |
| **2** | Feed follow cache not invalidated on follow/unfollow | HIGH | Privacy/correctness bug (especially unfollow) | `social/.../follow.controller.js`, `social/.../unsubscribe.controller.js`, `feed/dal/feed.read.followRows.dal.js` |
| **3** | Follow rows cache is page-scoped, not viewer-graph-scoped | MEDIUM | Throughput — cache hit rate degrades with diverse feeds | `feed/dal/feed.read.followRows.dal.js` |
| **4** | Dual privacy read race on cold profile page load | MEDIUM | DB read duplication | `profiles/dal/readActorProfile.dal.js`, `profiles/hooks/useProfileGate.js` |
| **5** | Unfollow makes 2 sequential DB writes — can be parallelized | MEDIUM | Latency | `social/.../unsubscribe.controller.js` |
| **6** | Follow pre-flight reads uncached follow status | MEDIUM | Latency per follow action | `social/.../getFollowRelationshipState.controller.js`, `actorFollows.dal.js` |
| **7** | Block query bidirectional OR requires dual-index coverage (DB-side) | LOW–MEDIUM | DB cost at scale | `feed/dal/feed.read.blockRows.dal.js`, `moderation.blocks` table |
| **8** | checkBlockStatus (idempotency check) has no cache | LOW | Latency | `block/dal/block.check.dal.js` |
| **9** | Actor bundle vs block/follow cache TTL mismatch (30s vs 60s) | LOW | Consistency | `feed/dal/feed.read.actorsBundle.dal.js` |
| **10** | feedRowVisibility model — no issues found | NONE | Already optimal | `feed/model/feedRowVisibility.model.js` |

---

## CRITICAL CALL-OUTS (ACTION REQUIRED BEFORE NEXT RELEASE)

**Finding 1 and Finding 2 are not just performance issues — they are safety and privacy correctness bugs.**

- **Finding 1:** After a user blocks someone, that actor's content continues to appear in the feed for up to 60 seconds. The block cache invalidation function (`invalidateFeedBlockCache`) was written and exported but never wired to any caller. The block is enforced in the database immediately, but the feed client does not know.

- **Finding 2 (unfollow path):** After a user unfollows a private account, the feed continues to treat that actor as "followed" for up to 60 seconds, meaning private content from the just-unfollowed account remains visible. This is a privacy correctness failure. The follow cache invalidation function (`invalidateFeedFollowCache`) was written and exported but has zero callers.

Both functions exist and are correct. They simply need to be called from the write paths.

---

*End of KRAVEN audit — 2026-05-10*
