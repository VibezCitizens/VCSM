# Post Performance Risks

Last Updated: 2026-05-10

## Summary

The central feed pipeline (`fetchFeedPage.pipeline.js`) is generally well-designed with batch reads. The main risks are: overfetching rows for in-JS aggregation, serial queries in mutation paths, unbounded profile list queries, and a multi-page drain loop that can serialize up to 30 DB round-trips on first load.

---

## Risk 1: Comment Count Overfetch (Non-Count Query)

**File:** `apps/VCSM/src/features/feed/dal/feed.read.commentCounts.dal.js`

**Pattern:** `readCommentCountsBatch(postIds)` selects only `post_id` from `vc.post_comments` for all postIds, then counts rows per post in JavaScript.

```js
.select("post_id")
.in("post_id", postIds)
.is("deleted_at", null)
```

**Risk:** For posts with hundreds of comments, this returns hundreds of rows over the wire just to count them. A DB-side `count: 'exact'` grouped query or a materialized counter column would be far more efficient.

**Impact:** Multiplied by up to 10 posts per page, this query can return large row sets for popular posts.

---

## Risk 2: Reaction Count Overfetch (Non-Aggregate Query)

**File:** `apps/VCSM/src/features/feed/dal/feed.read.reactionCounts.dal.js`

**Pattern:** `readReactionCountsBatch(postIds)` fetches ALL `post_reactions` rows (reaction column) and ALL `post_rose_gifts` rows (qty column) for the page's posts, then aggregates in JS.

```js
.select("post_id, reaction")
.in("post_id", postIds)
// and separately:
.select("post_id, qty")
.in("post_id", postIds)
```

**Risk:** For popular posts with thousands of reactions, this returns thousands of rows per page load. No DB-side GROUP BY or SUM.

**Also:** This spawns 2 sequential queries inside the `Promise.all` slot — the outer pipeline counts it as one unit but it's actually a 2-query serial execution (reactions + roses run as `Promise.all([reactionsResult, rosesResult])` — these ARE parallel inside the function, so this is acceptable).

---

## Risk 3: Multi-Page Drain on First Load (Serialized DB Reads) — Partially Resolved (2026-05-10)

**File:** `apps/VCSM/src/features/feed/queries/fetchCentralFeedPage.js`

**Pattern:** On initial load (`isInitial = true`), the query function loops calling `fetchFeedPagePipeline` up to `MAX_EMPTY_PAGES_PER_FETCH` times to accumulate `INITIAL_VISIBLE_TARGET = 3` visible posts.

**Fix applied 2026-05-10:** `MAX_EMPTY_PAGES_PER_FETCH` reduced from 3 → 2. Worst-case pipeline drain on initial load drops from 33 → 22 serial DB operations.

**Remaining risk:** This is still a loop of serial pipeline calls. The full resolution would be to either reduce `PAGE_SIZE` for the initial load or use a DB-level privacy filter to reduce filtered-out post volume. The 2-cap is a safe short-term limit.

**Impact:** Cuts worst-case first-load queries by one full pipeline cycle (~11 queries) on sparse feeds.

---

## Risk 4: Actor Bundle Hydration — 4 Parallel Queries Per Bundle Call

**File:** `apps/VCSM/src/features/feed/dal/feed.read.actorsBundle.dal.js`

For uncached actors, `readActorsBundle` runs 4 parallel queries:
1. `vc.actors` — actor rows (filtered `is_deleted = false`)
2. `public.profiles` — display name, username, photo_url (filtered `is_deleted = false`)
3. `vc.actor_privacy_settings` — is_private flag
4. `vport.profiles` — vport status (is_active, is_deleted) + display fields

**Source change (2026-05-10):** Query 4 was previously `vport.public_traze_profiles_v` (TRAZE directory view). It now queries `vport.profiles` directly. The TRAZE view required `directory_visible = true AND directory_status = 'listed'` which incorrectly excluded non-directory-listed active VPORTs from the feed.

**Privacy cache fix (2026-05-10):** The `vc.actor_privacy_settings` query previously ran `.in("actor_id", uniqueActorIds)` — including actors that were already in the bundle cache. It now runs `.in("actor_id", uncachedIds)` — only querying actors whose bundle data was not cached. On subsequent feed pages where most actors are cached, this query may not fire at all.

These run in parallel — latency bounded by the slowest. Cross-schema queries (vc + public + vport) may route through different Supabase connection pools depending on schema config.

---

## Risk 5: Background Hydration Fire-and-Forget

**Files:** `useCentralFeed.js`, `useFeed.js`

After each page load, both hooks call `hydrateActorsByIds(staleOrMissing)` as a background fire-and-forget. This can trigger additional DB reads after the feed renders. For VPORTs with missing names, `hydrateActorsByIds(vportActorsWithNoName, { force: true })` is also dispatched.

These are intentionally background — they update the actor store asynchronously. The risk is that on large feeds, many background hydration calls may accumulate, creating unmetered background DB traffic.

---

## Risk 6: Profile Post List — Safety Cap Added (Partially Resolved 2026-05-10)

**File:** `apps/VCSM/src/features/feed/dal/listActorPostsByActor.dal.js`

A `limit = 60` default parameter and `.limit(limit)` call were added. The `listActorPosts` controller accepts an optional `limit` override.

**Remaining risk:** 60 is a safety cap, not a cursor. There is no pagination beyond the initial 60 rows. For actors with many posts this is still a single bounded query but does not expose the full history. Cursor pagination would be the proper long-term solution.

---

## Risk 7: Serial Queries in Reaction Toggle — Partially Resolved (2026-05-10)

**File:** `apps/VCSM/src/features/post/postcard/controller/togglePostReaction.controller.js`

**Before fix:** Toggle path ran 3–4 serial DB round-trips: `checkPostExistsDAL` → `fetchActorReactionDAL` → mutation → `fetchPostByIdDAL` (notification) → `fetchReactionSummaryDAL` (RPC).

**After fix:** The controller accepts an optional `currentCounts` parameter. When provided, `applyReactionDelta` computes the new counts locally from the known `prevReaction` + `nextReaction` — no `fetchReactionSummaryDAL` RPC needed.

| Path | Round-trips |
|---|---|
| Feed toggle (currentCounts from batch preload) | 2 + optional notification fetch |
| Post detail toggle (no preloaded counts) | 3 + optional notification fetch (fallback to RPC) |

**Still serial:** `checkPostExistsDAL` → `fetchActorReactionDAL` → mutation is still sequential by design (each step depends on the previous). The `fetchPostByIdDAL` for notification routing is also sequential after mutation.

**`sendRoseController` (2026-05-10 — RESOLVED):** Post-insert reads (`fetchPostByIdDAL` for notification routing + `fetchReactionSummaryDAL` for counts) now run in `Promise.all`. Saves one round-trip per rose send.

**`toggleCommentLike` like path (2026-05-10 — RESOLVED):** After `likeComment()`, `readCommentActorAndPostIdDAL` (notification routing) + `getCommentLikeCount` now run in `Promise.all`. The unlike path still runs counts sequentially (unlike has no notification to route).

| Path | Before | After |
|---|---|---|
| sendRose (post-insert) | 2 serial reads | 1 parallel `Promise.all` |
| toggleCommentLike like path | 2 serial reads | 1 parallel `Promise.all` |

---

## Risk 7b: Photo Reactions Enrichment — Resolved (2026-05-10)

**Files:**
- `apps/VCSM/src/features/profiles/controller/photos/photoReactions.controller.js`
- `apps/VCSM/src/features/profiles/model/photos/enrichPhotoPosts.model.js`

**Issue 1 — Sequential DAL calls (resolved):** The three photo enrichment DALs (`listPostReactions`, `listPostCommentsCount`, `listPostRoseCount`) ran sequentially. Changed to `Promise.all([...])` — all three now execute in parallel.

**Issue 2 — O(N×M) reaction loop (resolved):** `enrichPhotoPostsModel` used `.filter()` inside `.map()` — scanning the entire reactions array 3× per post. Replaced with a single O(N) pre-pass building `Map<postId, {like, dislike, viewer}>`. Per-post lookup is now O(1).

---

## Risk 8: Legacy PostFeed.screen.jsx — window.scroll Listener

**File:** `apps/VCSM/src/features/post/screens/PostFeed.screen.jsx`

Uses a `window.addEventListener('scroll', onScroll)` for infinite scroll. This fires on every scroll event globally — there is no debounce or throttle implemented. `CentralFeedScreen.jsx` correctly uses `IntersectionObserver` via `useFeedInfiniteScroll.js`.

---

## Risk 9: Comment Thread Loads Entire Thread Without Pagination — Partially Resolved (2026-05-10)

**File:** `apps/VCSM/src/features/post/commentcard/dal/postComments.read.dal.js`

**Fix applied 2026-05-10:** Added `.limit(50)` to `listPostComments`. Posts with fewer than 50 comments are unaffected. Posts with many comments now return only the first 50 by `created_at ASC`.

**Remaining risk:** 50 is a safety cap, not a cursor. There is no pagination beyond the initial 50 rows for high-volume comment threads. Cursor pagination is the proper long-term solution.

---

## Risk 10: Mention Row Fetch Without Short-Circuit Check Alignment

**File:** `apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js`

```js
const hasPotentialMentions = pageRows.some(
  (row) => typeof row?.text === "string" && row.text.includes("@")
)
// ...
hasPotentialMentions ? fetchPostMentionRows(pagePostIds) : Promise.resolve([])
```

The short-circuit is a text scan for `@` — a reasonable optimization. However, if a mention was tagged via the typeahead (which does NOT require `@` in the final caption — it stores resolved actorIds), posts can have mentions in `vc.post_mentions` but no `@` in their text. These mentions would not be fetched and would not render as linkified mentions in the feed.

This is a correctness gap, not just a performance risk.

---

## Risk 11: Explore Search Double Query (Text + Tag)

**File:** `apps/VCSM/src/features/explore/dal/search.dal.js`

`searchPosts()` runs two parallel queries:
- `posts WHERE text ILIKE '%query%'`
- `posts WHERE tags @> [normalizedTag]`

Both queries apply to the full `vc.posts` table with no indexed column guarantee visible from the DAL. The `ilike` on `text` without a full-text index is an O(n) scan on the posts table. Results are merged client-side by deduplication Map.

---

## Caching Summary and Gaps

| Data | Cached? | TTL | Gap |
|---|---|---|---|
| Actor bundles | Yes (TTL) | 30s | Stale after privacy/follow changes |
| Post media | Yes (TTL) | 60s | Stale after post edit adds media |
| Block rows | Yes (TTL) | 60s | Stale after new block action |
| Follow rows | Yes (TTL) | 60s | Stale after new follow action |
| Reaction counts | No | None | Re-fetched every feed page |
| Comment counts | No | None | Re-fetched every feed page |
| Viewer reactions | No | None | Re-fetched every feed page |
| Hidden posts | No | None | Re-fetched every feed page |
| Comment thread | No | None | Full load every PostDetail mount |
