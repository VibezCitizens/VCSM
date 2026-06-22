---
title: Feed Pipeline Module — Behavior Contract
status: ACTIVE
feature: feed
module: pipeline
command: LOGAN
authored: 2026-06-05
source-verified: true
confidence: HIGH
supersedes: STUB (2026-06-05 seed)
---

# Feed Pipeline Module — BEHAVIOR

**Status:** ACTIVE
**Source-Verified:** YES (22 source files, ARCHITECT 2026-06-05)
**Security Links:** VEN-PIPE-001 through VEN-PIPE-010 (VENOM 2026-06-05)

---

## §1 Purpose

The feed pipeline module assembles one cursor-paginated page of feed posts for a given viewer. It orchestrates parallel data fetching, applies multi-layer visibility filtering, enriches with actor/mention/media data, and returns a normalized, fully hydrated row set. It is a pure read pipeline — it performs zero database writes.

---

## §2 Scope

**In scope:**
- `fetchFeedPagePipeline` — single-page pipeline orchestrator
- `fetchCentralFeedPage` — React Query queryFn with multi-page drain + timeout
- All 10 DAL files under `features/feed/dal/`
- All 8 model files under `features/feed/model/`
- `useFeed.js` — manual hook consumer
- `useCentralFeed.js` — React Query hook consumer
- Cache invalidation adapter (`feedCache.adapter.js`)

**Out of scope:**
- Post creation, editing, deletion (no writes in this module)
- Comment submission, reaction writes (separate feature paths)
- Feed screen rendering (CentralFeedScreen — owned by feed UI module)
- Debug privacy controller path (separate from pipeline)

---

## §3 Ownership

**Application Scope:** VCSM
**Code Root:** `apps/VCSM/src/features/feed/`
**Engine Dependencies:** `engines/hydration` (actor summaries for mentions + background hydration)
**State Dependencies:** `@/state/actors/actorStore` (Zustand — actor upsert after each page)
**Query Dependencies:** `@tanstack/react-query` (useCentralFeed infinite query)

---

## §4 Entry Points

| Entry Point | File | Caller | Purpose |
|---|---|---|---|
| `fetchFeedPagePipeline()` | `pipeline/fetchFeedPage.pipeline.js` | `useFeed.js`, `fetchCentralFeedPage.js` | Assembles one DB page of feed posts |
| `fetchCentralFeedPage()` | `queries/fetchCentralFeedPage.js` | `useCentralFeed.js` (React Query queryFn) | Drain loop producing one logical feed page |
| `useFeed()` | `hooks/useFeed.js` | `CentralFeedScreen`, `PostFeed.screen` | Manual hook; manages posts+cursor state |
| `useCentralFeed()` | `hooks/useCentralFeed.js` | `CentralFeedScreen` | React Query wrapper; same pipeline |

---

## §5 Data Flow

### §5.1 Feed Assembly Workflow

**Source:** `pipeline/fetchFeedPage.pipeline.js` (verified lines 64–176)

```
INPUT: { viewerActorId, realmId, cursorCreatedAt, pageSize }

PHASE 1 — POST FETCH (serial)
  readFeedPostsPage({ realmId, cursorCreatedAt, pageSize })
    ↳ vc.posts WHERE deleted_at IS NULL
    ↳ ORDER BY created_at DESC
    ↳ LIMIT pageSize+1  (fetch +1 to detect hasMore without extra query)
    ↳ if realmId → add WHERE realm_id = :realmId   [⚠ VEN-PIPE-002: null skips filter]
    ↳ if cursorCreatedAt → add WHERE created_at < :cursorCreatedAt
  Returns: pageRows[], hasMoreNow, nextCursorCreatedAt

  Derive pagePostIds: pageRows.map(r => r.id)
  Derive actorIds: [...new Set(pageRows.map(r => r.actor_id))]
  Detect hasPotentialMentions: any row.text includes "@"

PHASE 2 — PARALLEL ENRICHMENT (Promise.all — 9 concurrent DAL calls)
  ┌─ [0] readPostMediaMap(pagePostIds)
  │      → vc.post_media [60s TTL cache per-post]
  │      → Map<postId, [{url, media_type, sort_order}]>
  │
  ├─ [1] fetchRawPostMentionEdgesDAL(pagePostIds)  [conditional]
  │      → vc.post_mentions (only if hasPotentialMentions=true, else Promise.resolve([]))
  │      → [{post_id, mentioned_actor_id}]
  │
  ├─ [2] readHiddenPostsForViewer({ viewerActorId, postIds: pagePostIds })
  │      → moderation.actions WHERE actor_id=viewerActorId AND target_type='post'
  │      → latest hide/unhide per postId → Set<hiddenPostId>
  │
  ├─ [3] readActorsBundle(actorIds)
  │      → vc.actors [30s TTL cache per-actor]
  │      → vc.profiles (for user actors)
  │      → vc.actor_privacy_settings (is_private flag)
  │      → vport.profiles via vportClient [⚠ VEN-PIPE-003: owner-only RLS]
  │      → { actors, actorMap, profileMap, vportMap }
  │
  ├─ [4] readFeedBlockRowsDAL({ viewerActorId, actorIds })
  │      → moderation.blocks [60s TTL cache per-viewer]
  │      → bidirectional: viewer→blocked AND blocked→viewer
  │
  ├─ [5] readFeedFollowRowsDAL({ viewerActorId, actorIds })
  │      → vc.actor_follows [60s TTL cache per-viewer; FULL graph fetched]
  │      → [{follower_actor_id, followed_actor_id, is_active}]
  │
  ├─ [6] readCommentCountsBatch(pagePostIds)
  │      → vc.post_comments WHERE deleted_at IS NULL
  │      → Map<postId, count>
  │
  ├─ [7] readViewerReactionsBatch({ postIds: pagePostIds, actorId: viewerActorId })
  │      → vc.post_reactions WHERE actor_id=viewerActorId
  │      → Map<postId, reactionKind>
  │
  └─ [8] readReactionCountsBatch(pagePostIds)
         → vc.post_reactions (like/dislike) + vc.post_rose_gifts (rose qty) [2 parallel sub-queries]
         → Map<postId, { like, dislike, rose }>

PHASE 3 — VISIBILITY SET ASSEMBLY (synchronous, in-memory)
  buildBlockedActorSetModel({ viewerActorId, blockRows })
    → Set<actorId>: includes actors viewer blocked AND actors who blocked viewer
  buildFollowedActorSetModel({ followRows })
    → Set<actorId>: only rows where is_active=true

PHASE 4 — MENTION ENRICHMENT (serial, conditional)
  IF mentionEdges.length > 0:
    mentionedActorIds = [...new Set(mentionEdges.map(e => e.mentioned_actor_id))]
    IF mentionedActorIds.length > 0:
      hydrateAndReturnSummaries({ actorIds: mentionedActorIds })  ← engines/hydration
        [⚠ VEN-PIPE-008: blockedActorSet NOT applied here — blocked actors get hydrated]
      enrichMentionRows(mentionEdges, presentations)
  buildMentionMaps(enrichedMentionRows)
    → { [postId]: { [handleKey]: { id, kind, displayName, username, avatar, route } } }

PHASE 5 — NORMALIZATION (synchronous, in-memory)
  normalizeFeedRows({ pageRows, actorMap, profileMap, vportMap,
    blockedActorSet, followedActorSet, viewerActorId,
    hiddenByMeSet, mediaMap, mentionMapsByPostId,
    commentCountsMap, viewerReactionsMap, reactionCountsMap,
    includeDebug: true })

  Per row: resolveFeedRowVisibilityModel() → { visible, reason, ... }
  Filter: keep only visible=true rows
  Map: each visible row → normalized post object

OUTPUT: { normalized, debugRows, hasMoreNow, nextCursorCreatedAt,
          hiddenByMeSet, actors, profileMap, vportMap }
```

---

### §5.2 Ranking Workflow

**Source:** `dal/feed.read.posts.dal.js` (verified lines 3–53)

The feed pipeline uses **pure cursor-based chronological ordering**. There is no algorithmic ranking, no scoring, and no personalization of post order.

```
ORDER: created_at DESC (newest posts first)
CURSOR: created_at of the last post on the previous page
COMPARISON: WHERE created_at < :cursorCreatedAt (strict LT — no page overlaps)
FIRST PAGE: cursorCreatedAt = null (no WHERE clause added)
PAGE SIZE: default 10 rows
HASMORE DETECTION: fetch LIMIT pageSize+1; if length > pageSize then hasMoreNow=true; slice to pageSize
NEXT CURSOR: pageRows.at(-1)?.created_at
```

**Important:** The pipeline renders posts in strict reverse-chronological order. Feed ranking enhancements (boosting, interest signals, engagement scoring) would require a dedicated ranking layer between PHASE 1 and PHASE 5.

---

### §5.3 Hydration Workflow

**Source:** `pipeline/fetchFeedPage.pipeline.js`, `hooks/useFeed.js`, `hooks/useCentralFeed.js`

#### Actor Bundle Hydration (PHASE 2 — in-pipeline)

```
readActorsBundle(actorIds):
  1. Check bundleCache for each actorId (30s TTL, per-actor key)
  2. Cache HIT: use cached {actor, profile, vport} bundle
  3. Cache MISS: fetch from DB (vc.actors, profiles, actor_privacy_settings, vport.profiles)
  4. Cache freshly fetched actors for 30s
  5. Merge cached + freshly fetched into {actors, actorMap, profileMap, vportMap}
```

#### Actor Store Upsert (hook layer — post-pipeline)

After each page, the hook layer immediately upserts actor data to the Zustand actorStore:

```
useFeed.js / useCentralFeed.js:
  upsertActors(actors.map(a => ({
    actor_id: a.id, kind: a.kind,
    display_name, username, photo_url, vport_name, vport_slug
  })))
```

#### Background Canonical Hydration (hook layer — async)

For actors that are stale or missing in the store:
```
staleOrMissing = getMissingOrStale(feedActorIds)
IF staleOrMissing.length > 0:
  hydrateActorsByIds(staleOrMissing).catch(() => {})  ← fire-and-forget
```

For VPORT actors where vportMap has no name entry (owner-only RLS fallback):
```
vportActorsWithNoName = actors.filter(a => a.kind==='vport' && !vportMap[a.id]?.name)
IF vportActorsWithNoName.length > 0:
  hydrateActorsByIds(vportActorsWithNoName, { force: true }).catch(() => {})
```
This calls `vc.get_actor_summaries` RPC (SECURITY DEFINER) — bypasses vport.profiles RLS.

#### Mention Hydration (PHASE 4 — conditional in-pipeline)

```
Trigger: hasPotentialMentions = pageRows.some(r => r.text?.includes('@'))
Fetch: fetchRawPostMentionEdgesDAL(pagePostIds) → [{post_id, mentioned_actor_id}]
Hydrate: hydrateAndReturnSummaries({ actorIds: mentionedActorIds }) → presentations[]
Enrich: enrichMentionRows(mentionEdges, presentations) → enrichedMentionRows[]
Map: buildMentionMaps(enrichedMentionRows) → { [postId]: { [handle]: payload } }
```

---

### §5.4 Visibility Filtering Workflow

**Source:** `model/feedRowVisibility.model.js`, `feedBlockVisibility.model.js`, `feedFollowVisibility.model.js`, `feedPrivateVisibility.model.js`

The visibility model chain runs per-row during PHASE 5 normalization:

```
resolveFeedRowVisibilityModel(row, actorMap, profileMap, vportMap, blockedActorSet, followedActorSet, viewerActorId):

STEP 1 — BLOCK CHECK (highest priority):
  IF blockedActorSet.has(row.actor_id):
    → visible:false, reason:'blocked_actor'
    STOP (no further checks)

  Block is BIDIRECTIONAL:
  buildBlockedActorSetModel includes actors the viewer blocked AND actors who blocked the viewer.

STEP 2 — ACTOR EXISTENCE:
  actor = actorMap[row.actor_id]
  IF actor is null/undefined:
    → visible:false, reason:'missing_actor'
    STOP

STEP 3 — VPORT ACTOR PATH (if actor.vport_id is truthy):
  vportEntry = vportMap[row.actor_id]  (keyed by actor.id, NOT actor.vport_id)
  IF vportEntry is null:
    → visible:false, reason:'missing_vport_profile'  [⚠ VEN-PIPE-003]
    STOP
  IF vportEntry.is_active === false OR vportEntry.is_deleted === true:
    → visible:false, reason:'inactive_vport'
    STOP
  → visible:true, reason:'visible_vport'

STEP 4 — USER ACTOR PATH (if actor.vport_id is falsy):
  profile = profileMap[actor.profile_id]
  IF profile is null:
    → visible:false, reason:'missing_profile'
    STOP
  isFollowing = followedActorSet.has(actor.id) AND row.is_active=true
  isOwner = actor.id === viewerActorId
  isPrivate = Boolean(profile.private)

  canViewPrivateFeedActorModel({ isPrivate, isOwner, isFollowing }):
    IF !isPrivate → canView=true
    IF isOwner   → canView=true
    IF isFollowing → canView=true
    ELSE → canView=false

  → visible:canView, reason:'visible_user' OR 'private_not_following'
```

**Hidden post suppression** is applied AFTER visibility filtering in normalizeFeedRows:
```
is_hidden_for_viewer: hiddenByMeSet.has(r.id)
```
Note: hidden posts are NOT filtered out — they are flagged with `is_hidden_for_viewer: true`. Rendering the hidden state is the responsibility of the UI layer (PostCard).

---

### §5.5 Cache Refresh Workflow

**Source:** All 4 cache-aware DALs (verified), `useCentralFeed.js` React Query config

#### TTL Cache Summary

| Cache | TTL | Location | Key | Invalidation Function |
|---|---|---|---|---|
| bundleCache | 30s | feed.read.actorsBundle.dal.js | `actor:{actorId}` (per-actor) | `invalidateActorBundleEntry(actorId)` or `invalidateActorsBundleCache()` |
| blockCache | 60s | feed.read.blockRows.dal.js | `{viewerActorId}` (per-viewer) | `invalidateFeedBlockCache(viewerActorId)` |
| followCache | 60s | feed.read.followRows.dal.js | `{viewerActorId}` (per-viewer) | `invalidateFeedFollowCache(viewerActorId)` |
| mediaCache | 60s | feed.read.media.dal.js | `{postId}` (per-post) | `invalidatePostMediaCache(postId)` |

All four invalidation functions are re-exported from `feedCache.adapter.js`.

#### React Query Feed Cache

```
staleTime: 30_000 (30s)   — navigator-away-and-back within 30s serves from cache
gcTime:    600_000 (10min) — unused data removed after 10 minutes
refetchOnWindowFocus: false

queryKey: queryKeys.centralFeed(viewerActorId, realmId)
  → changes when viewerActorId OR realmId changes → new query started

Fresh fetch (pull-to-refresh, actor switch):
  queryClient.resetQueries({ queryKey }) — clears pages back to page 1, awaits refetch

Pagination:
  fetchNextPage() — appends next page to pages[]

Optimistic patch (block/hide/react):
  queryClient.setQueryData(queryKey, updater) — via useCentralFeed.setPosts()
```

#### Cache Invalidation Order (on moderation action)

When viewer blocks an actor:
```
1. invalidateFeedBlockCache(viewerActorId)        ← DAL cache
2. queryClient.resetQueries({ queryKey })          ← React Query cache
   [⚠ VEN-PIPE-006: this wiring is NOT confirmed in current controllers]
```

When viewer unfollows a private actor:
```
1. invalidateFeedFollowCache(viewerActorId)        ← DAL cache
2. queryClient.resetQueries({ queryKey })          ← React Query cache
   [⚠ VEN-PIPE-006: this wiring is NOT confirmed in current controllers]
```

---

### §5.6 Failure Handling Workflow

**Source:** `queries/fetchCentralFeedPage.js`, `hooks/useFeed.js`

#### Timeout Wrapper (fetchCentralFeedPage)

```js
const FEED_FETCH_TIMEOUT_MS = 15_000  // 15 seconds

withTimeout(promise, ms = FEED_FETCH_TIMEOUT_MS):
  Races promise against setTimeout(reject, ms)
  On timeout: throws Error('Feed fetch timeout')
  clearTimeout called in .finally() to prevent memory leaks
```

#### Multi-Page Drain Cap

Both hooks implement a drain cap to prevent infinite loops when many pages are filtered:

```
// fetchCentralFeedPage.js
MAX_EMPTY_PAGES_PER_FETCH = 2
INITIAL_VISIBLE_TARGET = 3    (first page: fill 3 visible posts)
target = 1 for pagination pages

// useFeed.js (legacy)
MAX_EMPTY_PAGES_PER_FETCH = 3
INITIAL_VISIBLE_TARGET = 3

LOOP:
  WHILE hasMoreNow AND pagesFetched < MAX_EMPTY_PAGES_PER_FETCH:
    fetchFeedPagePipeline(...)
    pagesFetched++
    break IF !hasMoreNow OR !nextCursorCreatedAt OR normalizedChunk.length >= targetVisibleCount

DRAIN FAILSAFE:
  IF normalizedChunk.length === 0 AND hasMoreNow AND pagesFetched >= MAX_EMPTY_PAGES_PER_FETCH:
    hasMoreNow = false  ← force stop pagination
```

#### Error State Propagation

```
useFeed.js:
  try/catch around fetchPosts
  ON ERROR:
    setHasMore(false)    — stop pagination
    setFirstBatchReady(true) IF fresh  — unblock skeleton loader
    console.warn("[useFeed] error", e)

useCentralFeed.js:
  React Query handles error state
  status = 'error' → setFirstBatchReady(true) in useEffect

mediaCache (feed.read.media.dal.js):
  ON pmErr: return partial mediaMap (silent fail — does NOT throw)
  Affected posts will have no media but remain visible

fetchRawPostMentionEdgesDAL:
  ON eErr: returns [] (silent fail — logged in DEV only)
  Posts with mentions will have empty mentionMaps

readReactionCountsBatch:
  ON error: throws (not silently handled — pipeline will throw)

readCommentCountsBatch:
  ON error: throws (not silently handled — pipeline will throw)
```

#### Request Version Guard (useFeed only)

```
requestVersionRef increments on viewerActorId/realmId change.
Before each setState call: IF requestVersionRef.current !== requestVersion → RETURN (discard stale result)
Prevents race condition: old feed page arriving after actor switch.
```

---

## §6 Source of Truth

| Data | Primary Source | Cache |
|---|---|---|
| Feed post order | `vc.posts.created_at DESC` | React Query (30s staleTime) |
| Actor presentation | `vc.actors + profiles + vport.profiles` | bundleCache (30s TTL) + actorStore (Zustand) |
| Block state | `moderation.blocks` | blockCache (60s TTL) |
| Follow state | `vc.actor_follows` | followCache (60s TTL, full graph) |
| Hidden posts | `moderation.actions` | NOT cached |
| Post media | `vc.post_media` | mediaCache (60s TTL per-post) |
| Comment counts | `vc.post_comments` | NOT cached |
| Reaction counts | `vc.post_reactions + post_rose_gifts` | NOT cached |
| Viewer reactions | `vc.post_reactions` | NOT cached |
| Mention edges | `vc.post_mentions` | NOT cached |
| Realm assignment | Caller context (`useIdentity`) | NOT in pipeline |

---

## §7 UI States

These states are managed at the HOOK layer, not the pipeline:

| State | useFeed | useCentralFeed | Notes |
|---|---|---|---|
| Loading (initial) | `loading=true` + `firstBatchReady=false` | `status='pending'` | Skeleton shown until firstBatchReady=true |
| Loading (paginate) | `loading=true` | `isFetchingNextPage=true` | Scroll observer blocked |
| Success | `posts[]`, `firstBatchReady=true` | `status='success'`, `posts[]` | Feed rendered |
| Empty | `posts=[]`, `firstBatchReady=true`, `hasMore=false` | Same | Empty state rendered by screen |
| Error | `hasMore=false`, `firstBatchReady=true` | `status='error'` | Screen shows error state |
| End of feed | `hasMore=false` | `hasNextPage=false` | IntersectionObserver stops firing |

---

## §8 Dependencies

| Dependency | Type | Used By | Purpose |
|---|---|---|---|
| `engines/hydration` | Engine | pipeline (mentions), hooks (background) | Actor summaries, mention enrichment |
| `@/state/actors/actorStore` | Store | hooks | Actor upsert after each page |
| `@tanstack/react-query` | External | useCentralFeed | Infinite query lifecycle |
| `@/services/supabase/supabaseClient` | Service | All DALs | Supabase Postgres client |
| `@/services/supabase/vportClient` | Service | actorsBundle DAL | Separate vport schema client |
| `@/shared/lib/ttlCache` | Shared | 4 cache-aware DALs | TTL cache utility |
| `@/services/supabase/postgrestSafe` | Service | blockRows + followRows DALs | isUuid() validation |
| `@debuggers/feed` | Dev-only | pipeline (conditional) | DAL profiling instrumentation |

---

## §9 Rules / Invariants

### §9.1 Must Always Be True

| ID | Invariant |
|---|---|
| INV-PIPE-001 | `fetchFeedPagePipeline` is pure read — it must never write to any database table |
| INV-PIPE-002 | Block filter runs before normalization — blocked actor posts must never appear in `normalized[]` |
| INV-PIPE-003 | Visibility model chain order: block → actor exists → vport/user branch → private check; no step may be skipped |
| INV-PIPE-004 | `hiddenByMeSet` is always a Set — normalizeFeedRows calls `.has()` directly |
| INV-PIPE-005 | `pageRows` are fetched before the 9 parallel enrichment calls — actorIds and pagePostIds are derived from pageRows |
| INV-PIPE-006 | Actor bundle cache keys are per-actor (`actor:{actorId}`) — never per-page or per-viewer |
| INV-PIPE-007 | Block cache keys are per-viewer — entire block graph invalidated on block action |
| INV-PIPE-008 | Follow cache fetches the FULL follow graph for the viewer, then filters in-memory |
| INV-PIPE-009 | Pipeline does not produce routes or navigation targets for posts — that is the rendering layer's responsibility |
| INV-PIPE-010 | `viewerActorId` must be truthy before calling `fetchFeedPagePipeline` (hooks enforce this) |

### §9.2 Must Never Happen

| ID | Invariant | Consequence | Security Link |
|---|---|---|---|
| MNH-PIPE-001 | `readFeedPostsPage` must never be called with `realmId = null` when Void Realm is active | Cross-realm post exposure, 18+ content leak | VEN-PIPE-002 |
| MNH-PIPE-002 | A post from a bidirectionally-blocked actor must never appear in `normalized[]` | Block bypass | VEN-PIPE-006 |
| MNH-PIPE-003 | `debugPostId` must never be passed to `fetchFeedPagePipeline` from production callers | Console log fires, post IDs exposed | VEN-PIPE-009 |
| MNH-PIPE-004 | `normalized[]` must never contain raw UUIDs as actor navigation routes | Identity UUID exposure | VEN-PIPE-004 |
| MNH-PIPE-005 | Pipeline must never call `hydrateAndReturnSummaries` with actorIds from blocked actors (mention path) | Blocked actor presentation leak | VEN-PIPE-008 |
| MNH-PIPE-006 | `vportMap` entries must not be used for navigation using `actor.vport_id` — use `actor.id` as the map key | Wrong map key → silent miss | ARCHITECTURE confirmed |
| MNH-PIPE-007 | `feedCache.adapter.js` exports must be the only public cache invalidation surface — never call DAL invalidation functions directly from outside the feed feature | Adapter boundary violation | ARCHITECTURE contract |

---

## §10 Failure Risks

| Risk | Area | Severity | Notes |
|---|---|---|---|
| vport.profiles RLS null bundle | actorsBundle DAL | HIGH | VEN-PIPE-003: all VPORT posts invisible to non-owners |
| null realmId bypass | readFeedPostsPage | HIGH | VEN-PIPE-002: all-realm exposure during onboarding gap |
| Stale block/follow cache | blockRows + followRows DALs | MEDIUM | VEN-PIPE-006: up to 90s window after moderation action |
| Blocked actor mention hydration | pipeline Phase 4 | MEDIUM | VEN-PIPE-008: hydration ignores blocked set |
| Raw UUID in mention route fallback | buildMentionMaps | MEDIUM | VEN-PIPE-004: /profile/${actorId} for vport mentions |
| Silent media fail | readPostMediaMap | LOW | Returns partial mediaMap on DB error — posts appear without media |
| Full follow graph memory | followRows DAL | LOW | Unbounded at scale for high-follow-count viewers |
| Drain cap not wired to feed empty state | hooks | LOW | If all N pages filtered, UI may show empty feed without indicator |
| @debuggers/feed in production bundle | pipeline import | LOW | VEN-PIPE-010: tree-shaking unconfirmed |

---

## §11 Security Rules

Security rules derived from VENOM review 2026-06-05. All rules are OPEN unless marked RESOLVED.

| Rule | Requirement | Finding | Status |
|---|---|---|---|
| SEC-PIPE-001 | `readFeedPostsPage` must document its RLS owner — no app-layer auth exists | VEN-PIPE-001 | OPEN |
| SEC-PIPE-002 | `realmId` must not be null when passed to `readFeedPostsPage` | VEN-PIPE-002 | OPEN |
| SEC-PIPE-003 | `vport.profiles` RLS must allow non-owner reads of feed presentation fields | VEN-PIPE-003 | OPEN |
| SEC-PIPE-004 | Mention routes must use slug/username — never raw actorId or vportId UUID | VEN-PIPE-004 | OPEN |
| SEC-PIPE-005 | `readHiddenPostsForViewer` and `readViewerReactionsBatch` must validate viewerActorId via `isUuid()` | VEN-PIPE-005 | OPEN |
| SEC-PIPE-006 | Block/follow cache invalidation must be wired to corresponding action controllers | VEN-PIPE-006 | OPEN |
| SEC-PIPE-007 | `mentionedActorIds` must be filtered against `blockedActorSet` before `hydrateAndReturnSummaries` | VEN-PIPE-008 | OPEN |

---

## §12 State Transitions

### §12.1 useFeed Request Versioning

```
State: requestVersionRef (number), didInitialFetchRef (bool), loadingRef (bool)

INITIAL MOUNT:
  requestVersionRef = 0
  didInitialFetchRef = false
  loadingRef = false

ON viewerActorId OR realmId CHANGE (useEffect):
  requestVersionRef += 1          ← stale-result guard
  didInitialFetchRef = false
  cursorRef.current = null
  loadingRef = false
  setPosts([])
  setHasMore(true)
  setFirstBatchReady(false)

ON FETCH START:
  IF loadingRef.current = true → SKIP (concurrent fetch guard)
  loadingRef = true
  setLoading(true)

ON FETCH COMPLETE:
  IF requestVersionRef !== capturedVersion → DISCARD result (stale response)
  lastFetchAtRef = Date.now()
  loadingRef = false
  setLoading(false)
```

### §12.2 useCentralFeed React Query Lifecycle

```
States: status ('pending' | 'success' | 'error'), pageCount (0..N)

INITIAL LOAD (enabled = Boolean(viewerActorId)):
  status: pending
  queryFn called with pageParam = undefined
  fetchCentralFeedPage({ actorId, realmId, pageParam: undefined })

FIRST PAGE RESOLVED:
  status: success
  data.pages = [{ posts, nextCursor, hasMore, hiddenIds, debugRows, actors, profileMap, vportMap }]
  pageCount = 1
  Actor upsert effect fires (pageCount changed from 0 → 1)
  Image preload effect fires (firstPage populated)

PAGINATION (scroll trigger):
  fetchNextPage()
  pageParam = lastPage.nextCursor
  status: success (isFetchingNextPage: true during fetch)
  New page appended to data.pages[]

FRESH FETCH (pull-to-refresh, actor switch):
  queryClient.resetQueries({ queryKey })
  Clears all pages, re-fetches page 1
  didPreloadRef = false (re-triggers preload)

END OF FEED:
  lastPage.nextCursor = undefined
  getNextPageParam → undefined
  hasNextPage: false

ERROR:
  status: error
  setFirstBatchReady(true) — unblocks skeleton

queryKey changes on viewerActorId OR realmId:
  New query, prior query GC'd after gcTime (10min)
```

### §12.3 firstBatchReady Lifecycle

```
Purpose: Signals to the screen that the first content batch (or error) is ready — unblocks skeleton loader.

RESET: on viewerActorId or realmId change
SET TRUE: when status === 'success' OR status === 'error' (useCentralFeed)
          when setFirstBatchReady(true) after first page processed (useFeed)

Never resets to false during pagination — only on actor/realm switch.
```

---

## §13 Debug Notes

Safe debugging methods:

1. **DEV profiler:** `@debuggers/feed/feedProfiler` — wrapDAL() wraps DAL calls with timing. Activated automatically in DEV builds via conditional wrapDAL assignment.
2. **Feed debug panel:** `DebugFeedFilterPanel` screen — shows `filterDebugRows` from pipeline (visibility decisions per post).
3. **Privacy debug panel:** `DebugPrivacyPanel` screen — shows raw actor privacy state (separate from pipeline).
4. **recordStep():** Called at key pipeline milestones in DEV: `parallel_dal_complete`, `normalize_start`, `normalize_complete`, `actor_upsert_complete`, `hydration_start_background`.

**DO NOT** pass `debugPostId` to `fetchFeedPagePipeline` in production code — this is a dead parameter with an unguarded console.log.

---

## §14 Files Map

| File | Layer | Purpose |
|---|---|---|
| `pipeline/fetchFeedPage.pipeline.js` | Pipeline | Main orchestrator — 9 parallel DALs + normalization |
| `queries/fetchCentralFeedPage.js` | Query | React Query queryFn — drain loop + timeout |
| `hooks/useFeed.js` | Hook | Manual hook — posts+cursor state management |
| `hooks/useCentralFeed.js` | Hook | React Query wrapper — infinite query |
| `hooks/useCentralFeedActions.js` | Hook | Optimistic action handlers (block, hide, react) |
| `hooks/useFeedInfiniteScroll.js` | Hook | IntersectionObserver pagination trigger |
| `hooks/useFeed.utils.js` | Hook util | withTimeout, preloadInitialMedia |
| `dal/feed.read.posts.dal.js` | DAL | vc.posts — cursor paginated post fetch |
| `dal/feed.read.actorsBundle.dal.js` | DAL | Actor + profile + vport bundle [30s cache] |
| `dal/feed.read.blockRows.dal.js` | DAL | moderation.blocks [60s cache] |
| `dal/feed.read.followRows.dal.js` | DAL | vc.actor_follows [60s cache, full graph] |
| `dal/feed.read.hiddenPosts.dal.js` | DAL | moderation.actions — hidden post set |
| `dal/feed.read.media.dal.js` | DAL | vc.post_media [60s cache per-post] |
| `dal/feed.mentions.dal.js` | DAL | vc.post_mentions — mention edges |
| `dal/feed.read.commentCounts.dal.js` | DAL | vc.post_comments — batched counts |
| `dal/feed.read.reactionCounts.dal.js` | DAL | vc.post_reactions + post_rose_gifts — batched counts |
| `dal/feed.read.viewerReactions.dal.js` | DAL | vc.post_reactions — viewer's own reactions |
| `model/normalizeFeedRows.model.js` | Model | Per-row visibility + shape normalization |
| `model/feedRowVisibility.model.js` | Model | Composite visibility resolver |
| `model/feedBlockVisibility.model.js` | Model | Blocked actor set builder + check |
| `model/feedFollowVisibility.model.js` | Model | Followed actor set builder + check |
| `model/feedPrivateVisibility.model.js` | Model | Private account view rule |
| `model/enrichMentionRows.model.js` | Model | Mention edge + presentation join |
| `model/buildMentionMaps.model.js` | Model | Per-post mention map builder |
| `model/inferMediaType.model.js` | Model | URL-based media type inference |
| `adapters/feedCache.adapter.js` | Adapter | Public cache invalidation surface |
| `adapters/hooks/useFeed.adapter.js` | Adapter | Legacy useFeed re-export |

---

## Audit References

- ARCHITECT 2026-06-05: `outputs/2026/06/05/ARCHITECT/vcsm.feed.pipeline.architecture.md`
- VENOM 2026-06-05: `outputs/2026/06/05/VENOM/2026-06-05_venom_feed-pipeline-security-review.md`
- Prior VENOM 2026-06-04 (feature level): `features/feed/outputs/2026/06/04/Venom/`
- Prior BlackWidow 2026-06-04 (feature level): `features/feed/outputs/2026/06/04/BlackWidow/`

---

## §15 Change Log

### 2026-06-05

Task: Initial ACTIVE BEHAVIOR.md authored for feed pipeline module — LOGAN module-level run
Application Scope: VCSM:feed/pipeline
Prompt Registry Entry: PIPELINE-MODULE-BUNDLE-RUN-2026-06-05
Code Status Before: STUB BEHAVIOR.md (unverified, architect-seeded)
Code Status After: ACTIVE — source-verified against 22 files
Files Changed:
  - `modules/pipeline/BEHAVIOR.md` (this file — created from STUB)
  - `outputs/2026/06/05/LOGAN/` (LOGAN review audit trail)
Command Evidence:
  - ARCHITECT 2026-06-05 (22 files verified, HIGH confidence)
  - VENOM 2026-06-05 (10 findings, 3 HIGH)
Architecture Contracts Checked:
  - Boundary isolation: no cross-feature DAL imports confirmed ✓
  - Adapter boundary: cache invalidation only via feedCache.adapter.js ✓
  - Engine boundary: hydration engine called via public API ✓
Security / Runtime / DB Notes:
  - 3 OPEN HIGH findings (VEN-PIPE-001, -002, -003) — THOR blockers
  - realmId null guard not implemented — documented in §9.2 MNH-PIPE-001
  - vport.profiles RLS not verified — documented in §9.2 MNH-PIPE-002
  - Cache invalidation wiring to action controllers not confirmed
Validation:
  - All 22 source files read and line-verified
  - Execution flow confirmed against fetchFeedPage.pipeline.js (lines 64–176)
  - Cache TTLs confirmed in source (30s/60s)
  - Drain caps confirmed (2 in fetchCentralFeedPage, 3 in useFeed)
Documentation Truth Status: ACTIVE / SOURCE_VERIFIED
