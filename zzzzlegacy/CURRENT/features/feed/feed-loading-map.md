# Feed Loading Map

Last Updated: 2026-05-10

## Feed Types Found

| Feed | Entry Screen | Hook | Notes |
|---|---|---|---|
| Central Feed (primary) | `CentralFeedScreen.jsx` | `useCentralFeed.js` | React Query `useInfiniteQuery`, realm-scoped |
| Post Feed (legacy) | `PostFeed.screen.jsx` | `useFeed.js` | useState-based, `window.scroll` listener |
| Post Detail | `PostDetail.view.jsx` | `usePostDetailPost.js` | Single post fetch, not a feed |
| Profile Posts | `listActorPosts.controller.js` | NOT FOUND — controller referenced but no dedicated hook here | Used by profile feature |
| Explore | `ExploreScreen.jsx` | `useSearchScreenController.js` | Search DAL, not a feed pipeline |

**No VPORT-specific feed found.** VPORTs post to the same `vc.posts` table with their `actor_id`. The central feed's visibility model renders VPORT posts unless the vport profile is explicitly inactive or deleted. No separate VPORT feed pipeline exists.

---

## Central Feed Pipeline (Primary Path)

### Entry

```
CentralFeedScreen.jsx
  → useCentralFeed(actorId, realmId)
    → useInfiniteQuery(fetchCentralFeedPage)
      → fetchCentralFeedPage({ actorId, realmId, pageParam })
        → fetchFeedPagePipeline(...)  [called up to 3× per page]
```

### File: `fetchCentralFeedPage.js`

```
apps/VCSM/src/features/feed/queries/fetchCentralFeedPage.js
```

Constants:
- `PAGE_SIZE = 10`
- `MAX_EMPTY_PAGES_PER_FETCH = 2` *(was 3 — reduced 2026-05-10)*
- `INITIAL_VISIBLE_TARGET = 3` (first page targets 3 visible posts; subsequent pages target 1)
- `FEED_FETCH_TIMEOUT_MS = 15_000`

On initial load: loops calling `fetchFeedPagePipeline` up to 2 times to accumulate 3 visible posts. Sparse feeds (many filtered-out rows) can trigger up to 2 serial DB page reads before returning. Worst-case first-load query count reduced from ~33 to ~22.

### File: `fetchFeedPage.pipeline.js`

```
apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js
```

Runs 9 parallel DAL calls per page via `Promise.all`:

| # | DAL | Table(s) | Purpose |
|---|---|---|---|
| 1 | `readFeedPostsPage` | `vc.posts` | Paginated post rows (cursor-based) |
| 2 | `readPostMediaMap` | `vc.post_media` | Multi-media per post |
| 3 | `fetchPostMentionRows` | `vc.post_mentions` + hydration engine | Mention maps (only if `@` found in text) |
| 4 | `readHiddenPostsForViewer` | `moderation.actions` | Posts hidden by this viewer |
| 5 | `readActorsBundle` | `vc.actors` + `public.profiles` + `vc.actor_privacy_settings` + `vport.profiles` | Actor identity + privacy + vport data |
| 6 | `readFeedBlockRowsDAL` | `moderation.blocks` | Block rows (bidirectional) |
| 7 | `readFeedFollowRowsDAL` | `vc.actor_follows` | Follow state for visibility |
| 8 | `readCommentCountsBatch` | `vc.post_comments` | Comment counts per post |
| 9 | `readViewerReactionsBatch` | `vc.post_reactions` | Viewer's reactions per post |
| 9b | `readReactionCountsBatch` | `vc.post_reactions` + `vc.post_rose_gifts` | Like/dislike/rose totals (2 queries inside) |

**Total queries per pipeline call: 10–11 (9 items in Promise.all, but #9b runs 2 queries internally)**

After DAL batch:
- `buildBlockedActorSetModel` — builds blocked actor Set from blockRows
- `buildFollowedActorSetModel` — builds followed actor Set from followRows
- `buildMentionMaps` — pure transform from mention rows
- `normalizeFeedRows` — visibility-filters and shapes posts for UI

---

## Pagination

Mechanism: **cursor-based** on `created_at` (descending). The last row's `created_at` becomes `nextCursorCreatedAt`. React Query `getNextPageParam` returns `lastPage.nextCursor` (undefined when exhausted).

The `useCentralFeed` hook stores all pages in React Query state and merges them into a flat `posts` array via a `Map` to prevent duplicates.

---

## Caching

| Cache | File | TTL | Scope |
|---|---|---|---|
| Actor bundle | `feed.read.actorsBundle.dal.js` | 30s | Per `actor:${id}` |
| Post media | `feed.read.media.dal.js` | 60s | Per `post_id` |
| Block rows | `feed.read.blockRows.dal.js` | 60s | Per `viewerActorId` |
| Follow rows | `feed.read.followRows.dal.js` | 60s | Per `viewerActorId` |
| React Query | `useCentralFeed.js` | `staleTime: 30s`, `gcTime: 10min` | Per `(actorId, realmId)` |

All caches use `shared/lib/ttlCache.js` (`createTTLCache`).

---

## Profile Feed

```
apps/VCSM/src/features/feed/controllers/listActorPosts.controller.js
apps/VCSM/src/features/feed/dal/listActorPostsByActor.dal.js
```

Tables: `vc.posts` filtered by `actor_id`

Columns selected: `id, actor_id, text, title, media_url, media_type, post_type, tags, created_at, realm_id`

No media join, no reaction counts, no comment counts, no actor hydration in this DAL. The profile feature is expected to enrich separately.

Default `limit = 60` — `listActorPostsByActorDAL` defaults to 60 posts with `.limit(limit)`. The controller accepts an optional `limit` override. Not yet cursor-paginated; 60 is a safety cap, not a cursor.

---

## Explore Feed

```
apps/VCSM/src/features/explore/dal/search.dal.js  (searchPosts, searchPostsByTag)
```

Columns: `id, actor_id, text, title, tags, created_at`

- `searchPosts`: two parallel queries (text ILIKE + tags array contains) with a limit of 25 each, merged with dedup Map
- `searchPostsByTag`: single `contains(tags, [tag])` query, limit 25
- No actor hydration, no reactions, no media in results
- No pagination beyond the initial 25-row limit

The explore `PostCard.jsx` renders only text preview and tags — no actor identity shown.

---

## N+1 Risks

See `post-performance-risks.md` for the full N+1 analysis.

Key finding: the central feed pipeline is well-batched (9 parallel DALs eliminate per-post fetches). However:

- `readCommentCountsBatch` fetches ALL non-deleted comment rows for the page's post IDs and counts them in JS. For posts with large comment volumes this is an overfetch — it returns every row and counts in memory instead of using `count: 'exact'` at the DB level.
- `readReactionCountsBatch` fetches ALL `post_reactions` rows (not counts) for the page's post IDs and counts in JS — same pattern.
- `readReactionCountsBatch` runs TWO queries inside a single call (reactions + rose_gifts) — the outer `Promise.all` in the pipeline counts this as one slot but it executes two sequential sub-queries.

---

## Realtime

The feed has **no realtime subscription**. New posts only appear on pull-to-refresh (`fetchPosts(true)`) or infinite scroll page load. The notification badge subscriptions file (`badgeSubscriptions.js`) is a noop for both chat and notification badges. React Query `refetchOnWindowFocus: false` prevents silent background refreshes.
