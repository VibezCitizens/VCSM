---
title: Pipeline Module — Tests
status: ACTIVE
feature: feed
module: pipeline
source: SPIDER-MAN module-level run 2026-06-05
last-updated: 2026-06-05
---

# feed / modules / pipeline — TESTS

SPIDER-MAN Run: 2026-06-05
Coverage Status: DEFINED (no tests implemented yet — zero test files exist)
THOR Gate: BLOCKED — P0 tests required before release

---

## §1 Test Coverage Matrix

| Area | Test Count | Status | THOR Gate |
|---|---|---|---|
| Realm guard | 3 | DEFINED | REQUIRED |
| Block cache invalidation | 4 | DEFINED | REQUIRED |
| Mention block filter | 3 | DEFINED | REQUIRED |
| Follow cache invalidation | 2 | DEFINED | REQUIRED |
| VPORT visibility | 2 | DEFINED | RECOMMENDED |
| UUID validation | 4 | DEFINED | RECOMMENDED |
| Visibility model unit | 6 | DEFINED | RECOMMENDED |
| Cursor pagination | 3 | DEFINED | RECOMMENDED |
| Drain cap + timeout | 3 | DEFINED | RECOMMENDED |
| Pipeline error handling | 4 | DEFINED | RECOMMENDED |
| **Total** | **34** | DEFINED | — |

---

## §2 Proposed Test File Locations

```
apps/VCSM/src/features/feed/
  __tests__/
    pipeline/
      fetchFeedPage.pipeline.test.js          — pipeline orchestration tests
    dal/
      feed.read.posts.dal.test.js             — realm guard tests
      feed.read.blockRows.dal.test.js         — block cache TTL + invalidation
      feed.read.followRows.dal.test.js        — follow cache TTL + invalidation
      feed.read.hiddenPosts.dal.test.js       — UUID validation + silent fail
      feed.read.viewerReactions.dal.test.js   — UUID validation
    model/
      feedRowVisibility.model.test.js         — visibility composite model
      feedBlockVisibility.model.test.js       — block set construction
      buildMentionMaps.model.test.js          — route generation + block filter
    hooks/
      useCentralFeedActions.test.js           — block/follow action cache wiring
```

---

## §3 Realm Guard Tests

**Regression anchor:** VEN-PIPE-002 / BW-PIPE-003 / ELEK-PIPE-002

### TEST-PIPE-REALM-001 — null realmId returns empty result

```
File: dal/feed.read.posts.dal.test.js
Type: Unit (mocked Supabase client)
Priority: P0 — THOR required

Given:
  readFeedPostsPage called with { realmId: null, cursorCreatedAt: null, pageSize: 10 }

When:
  Function executes

Then:
  - Returns { pageRows: [], hasMore: false, nextCursorCreatedAt: null }
  - Supabase query is NOT called (or: .eq("realm_id", ...) is NOT in the query chain)
  - No error thrown

Regression: ELEK-PIPE-002 applied — early return before query construction
```

### TEST-PIPE-REALM-002 — undefined realmId returns empty result

```
File: dal/feed.read.posts.dal.test.js
Type: Unit (mocked Supabase client)
Priority: P0 — THOR required

Given:
  readFeedPostsPage called with { realmId: undefined, cursorCreatedAt: null, pageSize: 10 }

Then:
  Same as TEST-PIPE-REALM-001 — early return, no DB query
```

### TEST-PIPE-REALM-003 — valid realmId scopes query correctly

```
File: dal/feed.read.posts.dal.test.js
Type: Unit (mocked Supabase client)
Priority: P0 — THOR required

Given:
  readFeedPostsPage called with { realmId: "uuid-public-realm", cursorCreatedAt: null, pageSize: 10 }

When:
  Function executes — DB returns 5 rows all with realm_id = "uuid-public-realm"

Then:
  - .eq("realm_id", "uuid-public-realm") IS applied to the query
  - Returns { pageRows: [5 rows], hasMore: false, nextCursorCreatedAt: last-row-created_at }
  - No rows from other realm_id values appear
```

---

## §4 Block Cache Invalidation Tests

**Regression anchor:** BW-PIPE-001 / VEN-PIPE-006 / ELEK-PIPE-001

### TEST-PIPE-BLOCK-001 — block cache is cleared after invalidateFeedBlockCache call

```
File: dal/feed.read.blockRows.dal.test.js
Type: Unit (TTL cache + mocked Supabase)
Priority: P0 — THOR required

Given:
  1. readFeedBlockRowsDAL called with viewerActorId=A → DB returns [] → cached
  2. New block created (A blocks B) in DB

When:
  invalidateFeedBlockCache(A) called
  readFeedBlockRowsDAL called again with viewerActorId=A

Then:
  - Cache is empty for A after invalidation
  - DB is re-queried (Supabase mock called second time)
  - New block row for (A, B) is returned
  - blockCache.get(A) after second call: contains (A, B) row
```

### TEST-PIPE-BLOCK-002 — handleBlockActor calls invalidateFeedBlockCache before fetchPosts

```
File: hooks/useCentralFeedActions.test.js
Type: Unit (mocked blockActor, invalidateFeedBlockCache, fetchPosts)
Priority: P0 — THOR required

Given:
  handleBlockActor triggered with actorId=A, postMenu.postActorId=B

When:
  blockActor succeeds

Then:
  Call order of mocks must be:
    1. blockActor called
    2. invalidateFeedBlockCache(A) called  ← verifies ELEK-PIPE-001 applied
    3. fetchPosts(true) called
  
  invalidateFeedBlockCache MUST be called BEFORE fetchPosts.
  If invalidateFeedBlockCache is called AFTER fetchPosts — test FAILS.
```

### TEST-PIPE-BLOCK-003 — stale block cache causes blocked content to appear (pre-fix regression snapshot)

```
File: hooks/useCentralFeedActions.test.js
Type: Regression snapshot (documents the broken state for historical reference)
Priority: P1

Note: This test documents the BEFORE state — it should FAIL after ELEK-PIPE-001 is applied.
  Mark as @skip after the fix is applied. Keep the file for regression history.

Given:
  invalidateFeedBlockCache NOT called between blockActor and fetchPosts
  blockCache: populated with empty rows (no blocks) for viewerActorId=A

When:
  handleBlockActor fires: blockActor(A→B) succeeds, fetchPosts(true) fires
  readFeedBlockRowsDAL returns cached rows (no B block)

Then:
  B's posts appear in normalized[] after fetchPosts resolves
  (This is the bug — this test should fail after fix is applied)
```

### TEST-PIPE-BLOCK-004 — block visibility: bidirectional block filter removes posts from both directions

```
File: model/feedBlockVisibility.model.test.js
Type: Unit
Priority: P1

Given:
  blockRows = [
    { blocker_actor_id: 'A', blocked_actor_id: 'B' },   // A blocked B
    { blocker_actor_id: 'C', blocked_actor_id: 'viewer' } // C blocked viewer
  ]
  viewerActorId = 'viewer'

When:
  buildBlockedActorSetModel({ blockRows, viewerActorId })

Then:
  blockedActorSet contains: 'B' (viewer→B) AND 'C' (C→viewer)
  Both directions correctly identified
  blockedActorSet.size === 2
```

---

## §5 Mention Block Filter Tests

**Regression anchor:** BW-PIPE-002 / VEN-PIPE-008 / ELEK-PIPE-003

### TEST-PIPE-MENTION-001 — blocked actor is excluded from mention hydration

```
File: pipeline/fetchFeedPage.pipeline.test.js
Type: Integration (mocked DALs + hydration engine)
Priority: P1 — THOR required

Given:
  viewerActorId = 'A'
  blockRows: A has blocked B → blockedActorSet = Set(['B'])
  mentionEdges: [{ post_id: 'post1', mentioned_actor_id: 'B' }]
  
When:
  fetchFeedPagePipeline runs Phase 4 (mention hydration)

Then:
  hydrateAndReturnSummaries is called with actorIds that does NOT include 'B'
  OR hydrateAndReturnSummaries is called with actorIds = [] (empty after filter)
  mentionMapsByPostId['post1'] does NOT contain B's presentation
  B's display_name and avatar do NOT appear in post1's mention data
```

### TEST-PIPE-MENTION-002 — non-blocked mention actor IS hydrated normally

```
File: pipeline/fetchFeedPage.pipeline.test.js
Type: Integration (mocked DALs)
Priority: P1

Given:
  viewerActorId = 'A'
  blockRows: A has blocked B → blockedActorSet = Set(['B'])
  mentionEdges: [
    { post_id: 'post1', mentioned_actor_id: 'B' },
    { post_id: 'post2', mentioned_actor_id: 'C' },  // C is not blocked
  ]

When:
  fetchFeedPagePipeline runs Phase 4

Then:
  hydrateAndReturnSummaries is called with actorIds = ['C'] (B filtered out)
  mentionMapsByPostId['post2'] contains C's presentation
  mentionMapsByPostId['post1'] does NOT contain B's presentation
```

### TEST-PIPE-MENTION-003 — VPORT mention route uses slug, not actorId

```
File: model/buildMentionMaps.model.test.js
Type: Unit
Priority: P2

Given:
  mentionRow: {
    mentioned_actor_id: 'uuid-xxxx',
    kind: 'vport',
    slug: 'my-vport-slug',
    vport_id: null,   // null as set by enrichMentionRows
    username: 'my-vport-slug',
  }

When:
  buildMentionMaps([mentionRow])

Then:
  route = '/vport/my-vport-slug'   ← slug used (ELEK-PIPE-007A fix applied)
  route does NOT contain 'uuid-xxxx'
  route does NOT equal '/profile/uuid-xxxx'
```

---

## §6 Follow Cache Invalidation Tests

**Regression anchor:** BW-PIPE-006 / VEN-PIPE-006 / ELEK-PIPE-004

### TEST-PIPE-FOLLOW-001 — handleFollowActor calls invalidateFeedFollowCache on unfollow

```
File: hooks/useCentralFeedActions.test.js
Type: Unit (mocked toggleFollow, invalidateFeedFollowCache, fetchPosts)
Priority: P1

Given:
  handleFollowActor triggered with actorId=A, postMenu.postActorId=B
  isMenuActorFollowing = true (currently following — this will be an unfollow)

When:
  toggleFollow returns { mode: 'unfollow' }

Then:
  invalidateFeedFollowCache(A) called  ← verifies ELEK-PIPE-004 applied
  fetchPosts(true) called after invalidation
  
  If mode is 'follow' (new follow):
    invalidateFeedFollowCache NOT required (no privacy concern on new follow)
```

### TEST-PIPE-FOLLOW-002 — follow cache TTL prevents unbounded DB calls

```
File: dal/feed.read.followRows.dal.test.js
Type: Unit (TTL cache + mocked Supabase)
Priority: P1

Given:
  readFeedFollowRowsDAL called 5 times with same viewerActorId within 60s

Then:
  Supabase is called exactly ONCE (first call populates cache)
  Subsequent 4 calls return from cache
  Cache hit is verifiable via Supabase mock call count
```

---

## §7 VPORT Visibility Tests

**Regression anchor:** VEN-PIPE-003 / BW-PIPE-004 / DEFERRED-D001

### TEST-PIPE-VPORT-001 — missing vportEntry causes visible:false for vport post

```
File: model/feedRowVisibility.model.test.js
Type: Unit
Priority: P1

Given:
  row = { actor_id: 'vport-actor', post_type: 'vibe', ... }
  actorEntry = { actor_id: 'vport-actor', vport_id: 'vport-uuid', kind: 'vport', ... }
  vportEntry = undefined   ← RLS returns empty for non-owner
  viewerActorId = 'some-non-owner'

When:
  computeFeedRowVisibility({ row, actorEntry, vportEntry, profileEntry, ... })

Then:
  result.visible === false
  result.reason === 'missing_vport_profile'
```

### TEST-PIPE-VPORT-002 — vport post IS visible to owner

```
File: model/feedRowVisibility.model.test.js
Type: Unit
Priority: P1

Given:
  actorEntry.vport_id = 'vport-uuid'
  vportEntry = { actor_id: 'vport-actor', is_public: true }
  viewerActorId = 'vport-owner-actor-id'  ← same as vport owner

Then:
  result.visible === true
  result.is_owner === true
```

---

## §8 UUID Validation Tests

**Regression anchor:** VEN-PIPE-005 / BW-PIPE-007 / ELEK-PIPE-005 / ELEK-PIPE-006

### TEST-PIPE-UUID-001 — readHiddenPostsForViewer returns empty Set for non-UUID viewerActorId

```
File: dal/feed.read.hiddenPosts.dal.test.js
Type: Unit (mocked Supabase)
Priority: P1

Given:
  readHiddenPostsForViewer({ viewerActorId: "not-a-uuid", postIds: ["uuid-post1"] })

When:
  Function executes

Then:
  Returns empty Set
  Supabase is NOT called
  No error thrown (not: throw on invalid input — fail safe)
```

### TEST-PIPE-UUID-002 — readHiddenPostsForViewer returns empty Set for empty string viewerActorId

```
File: dal/feed.read.hiddenPosts.dal.test.js
Type: Unit
Priority: P1

Given: viewerActorId = "" (empty string)

Then:
  Returns empty Set — falsy check catches this (line 6 existing guard)
```

### TEST-PIPE-UUID-003 — readViewerReactionsBatch returns empty Map for non-UUID actorId

```
File: dal/feed.read.viewerReactions.dal.test.js
Type: Unit (mocked Supabase)
Priority: P1

Given:
  readViewerReactionsBatch({ postIds: ["uuid-post1"], actorId: "not-a-uuid" })

When:
  Function executes

Then:
  Returns empty Map
  Supabase is NOT called
  No error thrown (after ELEK-PIPE-006 — previously would throw on DB error)
```

### TEST-PIPE-UUID-004 — valid UUID actorIds pass validation and reach DB

```
File: dal/feed.read.hiddenPosts.dal.test.js
Type: Unit (mocked Supabase)
Priority: P1

Given:
  viewerActorId = "550e8400-e29b-41d4-a716-446655440000"   ← valid UUID
  postIds = ["550e8400-e29b-41d4-a716-446655440001"]

When:
  readHiddenPostsForViewer called

Then:
  Supabase IS called with correct params
  .eq("actor_id", "550e8400-...") is in the query
```

---

## §9 Visibility Model Unit Tests

**Regression anchor:** BEHAVIOR.md §5.4

### TEST-PIPE-VIS-001 — blocked actor's posts are not visible

```
File: model/feedRowVisibility.model.test.js
Type: Unit
Priority: P1

Given:
  blockedActorSet = new Set(['blocked-actor-uuid'])
  row.actor_id = 'blocked-actor-uuid'

Then:
  computeFeedRowVisibility.visible === false
  reason === 'blocked'
  Evaluation stops after block check — does not continue to actor existence check
```

### TEST-PIPE-VIS-002 — private post is visible to owner

```
Type: Unit
Given: row.actor_id = viewerActorId, actorEntry.is_private = true, isOwner = true
Then: result.visible === true
```

### TEST-PIPE-VIS-003 — private post is visible to active follower

```
Type: Unit
Given: actorEntry.is_private = true, followedActorSet contains row.actor_id
Then: result.visible === true, result.is_following === true
```

### TEST-PIPE-VIS-004 — private post is NOT visible to non-follower

```
Type: Unit
Given:
  actorEntry.is_private = true
  followedActorSet does NOT contain row.actor_id
  viewerActorId !== row.actor_id

Then:
  result.visible === false
  reason === 'private_not_following'
```

### TEST-PIPE-VIS-005 — missing actor entry makes post not visible

```
Type: Unit
Given: actorEntry = null or undefined
Then: result.visible === false, reason === 'missing_actor'
```

### TEST-PIPE-VIS-006 — is_hidden_for_viewer flag set but post NOT filtered

```
File: model/normalizeFeedRows.model.test.js
Type: Unit
Priority: P2

Given:
  hiddenByMeSet contains post.id

Then:
  normalizeFeedRows includes the post in normalized[]
  post.is_hidden_for_viewer === true  ← flag set
  post IS in the returned array — filtering is the UI's responsibility, not pipeline
```

---

## §10 Cursor Pagination Tests

**Regression anchor:** BEHAVIOR.md §5.2

### TEST-PIPE-PAGE-001 — pageSize+1 trick correctly determines hasMore

```
File: dal/feed.read.posts.dal.test.js
Type: Unit (mocked Supabase)
Priority: P1

Given:
  pageSize = 10
  DB returns 11 rows (= pageSize + 1)

Then:
  hasMoreNow = true
  pageRows.length = 10  (11th row sliced off)
  nextCursorCreatedAt = pageRows[9].created_at
```

### TEST-PIPE-PAGE-002 — last page returns hasMore=false

```
Type: Unit (mocked Supabase)
Given: pageSize = 10, DB returns 7 rows

Then:
  hasMoreNow = false
  pageRows.length = 7
```

### TEST-PIPE-PAGE-003 — cursor continuity across pages

```
Type: Integration
Given:
  Page 1: cursorCreatedAt = null → returns rows sorted DESC, last row at created_at='T1'
  Page 2: cursorCreatedAt = 'T1' → query has .lt("created_at", "T1")

Then:
  No duplicate rows across pages
  Page 2 rows all have created_at < 'T1'
```

---

## §11 Drain Cap + Timeout Tests

**Regression anchor:** BEHAVIOR.md §5.6

### TEST-PIPE-DRAIN-001 — drain loop stops after MAX_EMPTY_PAGES_PER_FETCH

```
File: queries/fetchCentralFeedPage.test.js
Type: Unit (mocked pipeline)
Priority: P2

Given:
  INITIAL_VISIBLE_TARGET = 3
  MAX_EMPTY_PAGES_PER_FETCH = 2
  Pipeline returns 0 visible posts on every call (all filtered by visibility)

When:
  fetchCentralFeedPage called

Then:
  Pipeline is called at most MAX_EMPTY_PAGES_PER_FETCH + 1 times total
  Function returns [] without infinite loop
  emptyPageCount resets correctly between attempts
```

### TEST-PIPE-DRAIN-002 — drain loop stops when visible target reached

```
Type: Unit
Given:
  INITIAL_VISIBLE_TARGET = 3
  Pipeline returns 2 visible posts on page 1, 2 more on page 2

Then:
  Pipeline called exactly 2 times (total = 4 visible posts >= 3 target)
  Returns 4 visible posts
```

### TEST-PIPE-DRAIN-003 — timeout wrapper aborts slow pipeline call

```
File: hooks/useFeed.utils.test.js
Type: Unit
Priority: P2

Given:
  FEED_FETCH_TIMEOUT_MS = 15000
  withFeedTimeout wraps a promise that resolves after 20000ms

Then:
  withFeedTimeout rejects with timeout error after ~15000ms
  The wrapped promise is abandoned (not awaited to completion)
```

---

## §12 Pipeline Error Handling Tests

**Regression anchor:** BEHAVIOR.md §5.6

### TEST-PIPE-ERR-001 — single DAL failure in parallel fan-out propagates correctly

```
File: pipeline/fetchFeedPage.pipeline.test.js
Type: Unit (mocked DALs)
Priority: P2

Given:
  9 parallel DAL calls — readFeedReactionCountsDAL throws an error

When:
  fetchFeedPagePipeline executes Phase 2 Promise.all

Then:
  Promise.all rejects
  fetchFeedPagePipeline throws (does not swallow error)
  Caller receives the rejection
```

### TEST-PIPE-ERR-002 — mention hydration error throws (does not silently fail)

```
Type: Unit
Given: hydrateAndReturnSummaries returns { rows: null, error: new Error('hydration failed') }

Then:
  fetchFeedPagePipeline throws the hydration error (line 131: if (presErr) throw presErr)
  enrichedMentionRows remains []
```

### TEST-PIPE-ERR-003 — media DAL silent fail returns partial mediaMap

```
File: dal/feed.read.media.dal.test.js
Type: Unit
Priority: P2

Given: readPostMediaMapDAL throws an error (or Supabase returns error)

Then:
  Function returns {} (empty map) — does NOT throw
  Caller receives empty map — posts render without media (safe degradation)
```

### TEST-PIPE-ERR-004 — request versioning in useFeed prevents stale response from rendering

```
File: hooks/useFeed.test.js (if exists) or hooks/useCentralFeed.test.js
Type: Unit (mocked pipeline)
Priority: P2

Given:
  requestVersionRef.current = 1
  Fetch starts (version=1)
  Actor changes → requestVersionRef.current = 2 (new fetch starts)
  Old fetch (version=1) resolves AFTER new fetch already started

When:
  Old response returns with version check: requestVersionRef.current !== 1

Then:
  Old response is discarded — setPosts NOT called for stale response
  Only new-version response updates post state
```

---

## §13 Implementation Notes

### Test Infrastructure Requirements

These tests require:
- Vitest or Jest configured for the VCSM app (check `apps/VCSM/vite.config.js` or `vitest.config.js`)
- Supabase mock: `vi.mock('@/services/supabase/supabaseClient')` or equivalent
- TTL cache can be tested with `vi.useFakeTimers()` to advance time past TTL
- React hook tests: `@testing-library/react` renderHook wrapper

### P0 Test Priority for THOR Gate

These tests must pass before THOR can clear this module:
1. TEST-PIPE-REALM-001 — null realmId guard
2. TEST-PIPE-REALM-002 — undefined realmId guard
3. TEST-PIPE-REALM-003 — valid realmId scopes query
4. TEST-PIPE-BLOCK-001 — block cache invalidation
5. TEST-PIPE-BLOCK-002 — handleBlockActor call order

### Zero Existing Test Files

Confirmed by SPIDER-MAN: no test files exist for any feed pipeline source files.
All 34 tests in this document are proposed/defined only.
Implementation is required before THOR gate can be cleared.

---

## §14 Change Log

| Date | Command | Change |
|---|---|---|
| 2026-06-05 | SPIDER-MAN | Initial TESTS.md created — 34 tests defined across 10 areas |
