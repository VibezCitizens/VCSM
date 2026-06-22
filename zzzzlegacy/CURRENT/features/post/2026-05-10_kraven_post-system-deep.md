# KRAVEN Performance Audit — Post System Deep Review

**Date:** 2026-05-10  
**Application Scope:** VCSM  
**Reviewed by:** KRAVEN  

Documentation reviewed: `/zNOTFORPRODUCTION/_CANONICAL/logan/marvel/post-system/`  
Source paths inspected: `apps/VCSM/src/features/feed/`, `apps/VCSM/src/features/post/`, `apps/VCSM/src/features/explore/`

---

## KRAVEN TARGET

```
Feature / Route: Central feed, post reactions, rose gifts, comment thread, comment likes, explore search, profile posts
Application Scope: VCSM
Entry point: CentralFeedScreen.jsx → useCentralFeed → fetchCentralFeedPage → fetchFeedPagePipeline
Reason for analysis: Full post system performance audit post-refactor (2026-05-10 performance fixes applied)
```

---

## RUNTIME EVIDENCE

```
Observed controllers: togglePostReactionController, sendRoseController, toggleCommentLike
Observed DAL calls per feed page: readFeedPostsPage, readPostMediaMap, fetchPostMentionRows,
  readHiddenPostsForViewer, readActorsBundle (x4 internal), readFeedBlockRowsDAL,
  readFeedFollowRowsDAL, readCommentCountsBatch, readViewerReactionsBatch, readReactionCountsBatch (x2 internal)
Observed tables: vc.posts, vc.post_media, vc.post_mentions, vc.post_reactions, vc.post_rose_gifts,
  vc.post_comments, vc.actor_follows, moderation.blocks, moderation.actions,
  vc.actors, public.profiles, vc.actor_privacy_settings, vport.profiles
Duplicate read signals:
  - actor_privacy_settings queried for ALL uniqueActorIds including already-cached actors
  - comment counts: all non-deleted rows fetched and counted in JS (no DB COUNT)
  - reaction counts: all rows fetched and aggregated in JS (no DB SUM/GROUP BY)
  - sendRose fires fetchPostByIdDAL + fetchReactionSummaryDAL sequentially after insert
Timing observations: 
  - First load: up to 3 serial pipeline calls = up to 33 DB round-trips before first render
  - Each pipeline call: 10–11 DB queries in Promise.all (1 serial + 9 parallel)
  - Mutation paths: 2–4 serial DB round-trips per reaction/rose/comment-like
```

---

## PERFORMANCE PATTERNS

```
Duplicate reads:
  - actor_privacy_settings queried for cached actors on every pipeline call (cache bypass)
Overfetch:
  - readCommentCountsBatch: fetches all comment rows, counts in JS (no COUNT at DB)
  - readReactionCountsBatch: fetches all reaction rows, aggregates in JS (no GROUP BY at DB)
Serial async chains:
  - fetchCentralFeedPage drain loop: up to 3 pipeline calls × 11 queries = 33 serial DB round-trips
  - fetchFeedPagePipeline: first query (readFeedPostsPage) is serial, then Promise.all for 9 DALs
  - sendRose: checkExists → insert → fetchPost → fetchSummaryRPC (4 serial)
  - toggleCommentLike: isLiked → like/unlike → readCommentActorAndPostId → getCount (4 serial)
  - fetchPostMentionRows: DB read → hydrateAndReturnSummaries (2 serial internal steps)
Controller fan-out: sendRoseController — 4 DB calls per rose send
Cache miss patterns:
  - actor_privacy_settings: NOT cached per actor bundle, queried for full uniqueActorIds set every call
  - comment counts: no cache
  - reaction counts: no cache
  - comment thread: no cache — full load on every PostDetail mount
  - viewer reactions: no cache — re-fetched per feed page
Payload size risk:
  - readCommentCountsBatch: returns N comment rows for JS count — unbounded for viral posts
  - readReactionCountsBatch: returns N reaction rows + M rose rows — unbounded for viral posts
  - comment thread: no LIMIT on listPostComments — entire thread at once
  - readFeedPostsPage: includes deleted_by_actor_id (unused by UI, wastes bytes per row)
Hydration cost signals:
  - background hydrateActorsByIds fires after every page load — accumulates on multi-page feeds
  - double hydrateActorsByIds dispatch when VPORTs have no name (force: true second call)
```

---

## FINDINGS

---

### FINDING-01 — Multi-Page Drain Loop: Up to 33 Serial DB Round-Trips on First Load

```
KRAVEN PERFORMANCE FINDING
- Location: apps/VCSM/src/features/feed/queries/fetchCentralFeedPage.js (lines 53–90)
- Application Scope: VCSM
- Current behavior: On initial load (pageParam === undefined), fetchCentralFeedPage enters a while
  loop calling fetchFeedPagePipeline up to MAX_EMPTY_PAGES_PER_FETCH = 3 times sequentially,
  awaiting each call before the next. Each pipeline call executes 10–11 DB queries. Worst case:
  3 pipeline calls × 11 queries = 33 DB round-trips before any posts render.
  This occurs whenever posts are filtered out by the visibility model (blocked actors, private
  accounts, inactive VPORTs) — which is normal for new accounts and sparse realms.
- Detected pattern: Serial async chain — pipeline calls cannot be parallelized (each uses the
  cursor from the previous call's result), but the design amplifies latency on sparse feeds.
- Estimated impact: CRITICAL
- Root cause hypothesis: App-layer visibility filtering (block/privacy/follow) runs after DB fetch,
  so the DB returns 10 rows that might all be filtered to 0 visible posts. The drain loop exists to
  compensate for this overfetch-and-filter pattern by retrying with the next cursor until 3 visible
  posts are accumulated or 3 tries exhausted.
- Recommended optimization:
  (a) Short-term: Reduce MAX_EMPTY_PAGES_PER_FETCH from 3 to 2 — halves worst-case latency with
      minimal impact on sparse feed completeness.
  (b) Medium-term: Add DB-side filtering for the most common filter operations (block list,
      is_private flag) so fewer rows are fetched and discarded in the first pass. A server-side
      visibility filter reduces the sparseness that drives the drain loop.
  (c) Long-term: Move block/follow/privacy checks to DB-side WHERE clauses using a
      server function or view. Even partial DB-side filtering reduces drain loop iterations.
- Expected improvement: Eliminating one drain iteration saves 11 DB round-trips on first load.
  Reducing from 3 to 2 max iterations cuts worst-case from 33 to 22 queries.
```

---

### FINDING-02 — Comment Count Overfetch: All Rows Fetched, Counted in JS

```
KRAVEN PERFORMANCE FINDING
- Location: apps/VCSM/src/features/feed/dal/feed.read.commentCounts.dal.js (lines 20–35)
- Application Scope: VCSM
- Current behavior: readCommentCountsBatch selects only the post_id column from vc.post_comments
  for all post IDs on the page (.in("post_id", postIds)), then counts matching rows per post in
  JavaScript. For a post with 500 comments, this returns 500 rows over the wire to count to "500."
  Called on every feed page load (no caching).
- Detected pattern: Overfetch — fetching all rows for in-JS aggregation instead of DB-side COUNT.
- Estimated impact: HIGH
- Root cause hypothesis: Initial implementation chose simplicity (one query, JS aggregation) over
  DB efficiency. No GROUP BY or count: 'exact' call was added when the DAL was written.
- Recommended optimization: Replace the current select with a Supabase aggregate or DB-side GROUP BY.
  Option A — PostgreSQL RPC: Create a small function `vc.get_comment_counts(post_ids uuid[])` that
  returns rows of (post_id, count). One RPC call, zero row overfetch.
  Option B — Supabase count per group: If supported, use `.select("post_id", { count: 'exact' })`.
  Option C — Materialized counter column: Add `comment_count int default 0` to `vc.posts`,
  increment/decrement via trigger. Feed reads the counter directly. Zero extra query.
  Option A is fastest to implement without a schema migration. Option C is the most read-efficient
  long-term (eliminates the query entirely from the pipeline).
- Expected improvement: For a page with 10 posts averaging 100 comments each, current approach
  returns 1,000 rows. An RPC returns 10 rows (one per post). 100× payload reduction per page load.
```

---

### FINDING-03 — Reaction Count Overfetch: All Rows Fetched, Aggregated in JS

```
KRAVEN PERFORMANCE FINDING
- Location: apps/VCSM/src/features/feed/dal/feed.read.reactionCounts.dal.js (lines 23–59)
- Application Scope: VCSM
- Current behavior: readReactionCountsBatch runs two parallel queries:
  (1) All post_reactions rows (post_id, reaction) for the page's post IDs
  (2) All post_rose_gifts rows (post_id, qty) for the page's post IDs
  Both fetch full rows for JS aggregation. For popular posts with thousands of reactions,
  this returns thousands of rows per page load. No GROUP BY, no SUM, no COUNT at the DB layer.
  Called on every feed page load (no caching). The two sub-queries run in parallel inside the
  function, so this is acceptable for latency, but the payload is unbounded.
- Detected pattern: Overfetch — full row scan for JS aggregation instead of DB-side GROUP BY / SUM.
- Estimated impact: HIGH
- Root cause hypothesis: Same pattern as comment counts — simplicity of implementation over
  DB efficiency. The 2026-05-10 reaction delta fix (applyReactionDelta) reduced post-mutation
  RPC calls but did not address the feed-page batch overfetch.
- Recommended optimization:
  Option A — RPC: Create `vc.get_reaction_counts(post_ids uuid[])` returning
  (post_id, like_count, dislike_count, rose_total). Parallel with Option A for comment counts.
  Option B — Materialized counters: Add like_count, dislike_count, rose_count to vc.posts,
  maintained by triggers. Feed reads counters directly — zero extra query for counts.
  Option B eliminates two queries from the 9-slot pipeline entirely, replacing them with
  columns already fetched in readFeedPostsPage.
- Expected improvement: For a page with 10 posts averaging 200 reactions each, current approach
  returns 2,000 rows (reactions) + N rose rows. An RPC returns 10 rows. 200× payload reduction.
  If materialized counters are used, the count queries are eliminated entirely.
```

---

### FINDING-04 — actor_privacy_settings: Cache Bypass — Full uniqueActorIds Set Queried Every Call

```
KRAVEN PERFORMANCE FINDING
- Location: apps/VCSM/src/features/feed/dal/feed.read.actorsBundle.dal.js (lines 72–77)
- Application Scope: VCSM
- Current behavior: The actorsBundle DAL correctly splits actors into cached vs uncached sets
  (lines 29–36) and only queries vc.actors and vport.profiles for uncachedIds. However, the
  actor_privacy_settings query on line 72 uses uniqueActorIds — the FULL deduplicated set
  including already-cached actors. If 8 of 10 actors on a page are cached, the privacy query
  still fetches 10 rows instead of 2.
  The privacy data (is_private) is embedded in each actor's cached bundle, so re-fetching it
  for cached actors is wasted work on every pipeline call.
- Detected pattern: Cache miss — privacy query does not respect the cached/uncached split.
- Estimated impact: MEDIUM
- Root cause hypothesis: The privacy query was not updated when the per-actor TTL cache was added.
  The cache correctly segregates actor rows but privacy settings were left on the full-set query.
- Recommended optimization: Change line 72 from `.in("actor_id", uniqueActorIds)` to
  `.in("actor_id", uncachedIds)`. Privacy settings for cached actors are already embedded in
  their cached bundle (actor.profile → private flag). Only uncached actors need a fresh privacy read.
  This is a one-line fix with no schema or architectural changes.
- Expected improvement: On subsequent feed pages (where most actors are cached), eliminates the
  privacy settings DB round-trip entirely. On first page, no change. Across a multi-page scroll
  session, this removes one unnecessary DB query per page after page 1.
```

---

### FINDING-05 — sendRose Controller: 4 Serial DB Round-Trips Per Rose Send

```
KRAVEN PERFORMANCE FINDING
- Location: apps/VCSM/src/features/post/postcard/controller/sendRose.controller.js (lines 47–84)
- Application Scope: VCSM
- Current behavior: sendRoseController runs:
  1. checkPostExistsDAL(postId) — guard
  2. insertRoseGiftDAL({ postId, actorId, qty }) — write
  3. fetchPostByIdDAL(postId) — notification routing (sequential after insert)
  4. fetchReactionSummaryDAL(postId) — RPC for updated counts (sequential after insert)
  Steps 3 and 4 are both post-insert reads that do not depend on each other — they run
  sequentially but could run in parallel.
- Detected pattern: Serial async chain — steps 3 and 4 are independent but not parallelized.
- Estimated impact: MEDIUM
- Root cause hypothesis: Each step was added sequentially without evaluating parallelism opportunities.
  Step 3 (fetchPost) and step 4 (fetchReactionSummary) both depend on step 2 completing but
  not on each other.
- Recommended optimization: Parallelize steps 3 and 4 after the insert completes:
  const [postResult, summaryResult] = await Promise.all([
    fetchPostByIdDAL(postId),
    fetchReactionSummaryDAL(postId),
  ]);
  This cuts the post-insert wait from 2 sequential DB calls to 1 parallel round-trip.
  Round-trips: 3 serial → 2 serial (guard + insert + parallel reads).
- Expected improvement: Reduces rose send latency by one DB round-trip (~10–50ms depending on
  DB region proximity). Multiplied by rose send frequency, this is felt by active senders.
```

---

### FINDING-06 — toggleCommentLike: 4 Serial DB Round-Trips Per Like

```
KRAVEN PERFORMANCE FINDING
- Location: apps/VCSM/src/features/post/commentcard/controller/commentReactions.controller.js
- Application Scope: VCSM
- Current behavior: toggleCommentLike runs:
  1. isCommentLiked({ commentId, actorId }) — read existing state
  2. likeComment / unlikeComment — write
  3. readCommentActorAndPostIdDAL(commentId) — notification routing (like path only)
  4. getCommentLikeCount(commentId) — read updated count
  Steps 3 and 4 are both post-write reads. On the LIKE path, they run sequentially.
  On the UNLIKE path, step 3 is skipped but step 4 still runs alone after the write.
- Detected pattern: Serial async chain — steps 3 and 4 are independent post-write reads.
- Estimated impact: MEDIUM
- Root cause hypothesis: Same pattern as sendRose — notification routing and count read added
  sequentially without parallelism analysis.
- Recommended optimization (like path): After likeComment completes, parallelize:
  const [comment, likeCount] = await Promise.all([
    readCommentActorAndPostIdDAL(commentId),
    getCommentLikeCount(commentId),
  ]);
  Unlike path: getCommentLikeCount runs alone (no notification) — no change needed there.
  Also: optimistic delta for comment like count is feasible (toggle: +1/-1) — would eliminate
  getCommentLikeCount entirely for the common case, matching the togglePostReaction optimization.
- Expected improvement: Saves one serial DB round-trip per comment like. For high-interaction
  comment threads, this is felt on rapid like interactions.
```

---

### FINDING-07 — Comment Thread: No Pagination — Full Load on Every PostDetail Mount

```
KRAVEN PERFORMANCE FINDING
- Location: apps/VCSM/src/features/post/commentcard/dal/postComments.read.dal.js (lines 3–24)
- Application Scope: VCSM
- Current behavior: listPostComments(postId) fetches all non-deleted comments for a post with
  no LIMIT and no cursor. Ordered ascending by created_at. For a viral post with thousands of
  comments, this returns the entire comment thread as a single unbounded query result.
  No caching — this executes on every PostDetail mount.
- Detected pattern: Overfetch + no pagination. Full row scan per PostDetail open.
- Estimated impact: HIGH
- Root cause hypothesis: Comment thread pagination was deferred. Current implementation is
  correct for low-comment posts but becomes a payload and latency problem at scale.
- Recommended optimization:
  (a) Add an initial LIMIT (e.g., 50 or 100) to listPostComments as an immediate safety cap.
  (b) Implement cursor-based pagination: load first N comments, expose "load more" to fetch
      the next batch using cursor on created_at.
  (c) Cache the first page of comments per postId (e.g., 30s TTL) — PostDetail is frequently
      opened and closed for the same post.
  Option (a) is a one-line DAL fix that immediately caps the worst case.
- Expected improvement: For a post with 5,000 comments, current: 5,000 rows returned. With
  LIMIT 50: 50 rows. 100× payload reduction. Eliminates full-thread DOM render on open.
```

---

### FINDING-08 — fetchPostMentionRows: Hidden 2-Step Serial Chain Inside Promise.all Slot

```
KRAVEN PERFORMANCE FINDING
- Location: apps/VCSM/src/features/feed/dal/feed.mentions.dal.js (lines 8–62)
- Application Scope: VCSM
- Current behavior: fetchPostMentionRows is called as one slot in the pipeline's Promise.all.
  Internally it runs TWO sequential steps:
  (1) DB query to vc.post_mentions — fetch edges (post_id, mentioned_actor_id)
  (2) hydrateAndReturnSummaries(mentionedActorIds) — hydration engine call which may itself
      hit the DB for unknown actor IDs
  The outer Promise.all only sees one slot — but this slot takes 2+ sequential round-trips.
  Additionally, the short-circuit check (hasPotentialMentions) uses a text scan for "@" in post
  text. Mentions stored without "@" in the text (typeahead-resolved) are silently skipped —
  so the second query may not even fire when it should, while it DOES fire (with extra cost)
  when any "@" appears in text even if no actual mentions exist.
- Detected pattern: Hidden serial chain inside a parallel slot. Also a short-circuit accuracy gap.
- Estimated impact: MEDIUM (latency from hidden serial steps; correctness gap from @ scan)
- Root cause hypothesis: The mentions DAL was built as a two-step pipeline internally, but
  from the outside it looks like a single async call. The hydration engine is a network dependency
  that adds a second round-trip per page that contains any "@" in post text.
- Recommended optimization:
  (a) The @ short-circuit is fragile. Since mention rows already exist in vc.post_mentions,
      consider always fetching mention edges (which returns empty for no mentions) and removing
      the text scan. The edges query is lightweight when no mentions exist.
  (b) If hydrateAndReturnSummaries hits the DB, its results should be deduplicated against
      already-fetched actors in readActorsBundle to avoid double-fetching the same actor identity.
  (c) The actor identity fetched for mentions (username/slug) overlaps with what readActorsBundle
      fetches. Long-term: pass the actorBundle result into buildMentionMaps so mention identity
      can be resolved from the already-fetched actor data rather than a separate hydration call.
- Expected improvement: Eliminating the hydrateAndReturnSummaries call by reusing the actorsBundle
  result would remove one DB round-trip from the mention path entirely.
```

---

### FINDING-09 — Explore Search: ILIKE Full-Table Scan on vc.posts

```
KRAVEN PERFORMANCE FINDING
- Location: apps/VCSM/src/features/explore/dal/search.dal.js (lines 80–83)
- Application Scope: VCSM
- Current behavior: searchPosts runs two parallel queries on the full vc.posts table:
  (1) .ilike('text', '%${q}%') — a leading-wildcard ILIKE on the text column
  (2) .contains('tags', [normalizedTag]) — a GIN-indexable array contains query
  Query (1) is an O(n) full-table scan. A leading wildcard ('% ... %') prevents B-tree index
  usage. Without a pg_trgm GIN index on the text column, every search triggers a sequential scan
  of the entire vc.posts table.
  The tags query (2) is potentially indexable with a GIN index on the tags column, but no
  index guarantee is visible from the DAL.
  No pagination beyond an initial limit of 25 results.
- Detected pattern: Unindexed full-table scan for text search.
- Estimated impact: HIGH (grows with post volume — O(n) on the largest table in the system)
- Root cause hypothesis: Text search was implemented with ILIKE as a quick implementation.
  Full-text search with pg_trgm or PostgreSQL tsvector was not added.
- Recommended optimization:
  (a) Add a pg_trgm GIN index on vc.posts.text: `CREATE INDEX posts_text_trgm_idx ON vc.posts
      USING gin (text gin_trgm_ops)`. Enables ILIKE with % wildcards to use GIN.
  (b) Long-term: Replace ILIKE with PostgreSQL full-text search (tsvector + tsquery). Better
      relevance ranking, language-aware tokenization, index support.
  (c) Add GIN index on vc.posts.tags if not present.
  (d) Add cursor-based pagination — current 25-row hard limit returns stale results on repeated
      queries and provides no "load more."
  This is a DB migration recommendation — delegate to Carnage.
- Expected improvement: GIN index converts ILIKE from O(n) sequential scan to O(log n) index
  lookup. For a table with 100k+ posts, this is the difference between 1000ms and 10ms.
```

---

### FINDING-10 — readFeedPostsPage: Unnecessary deleted_by_actor_id Field in Select

```
KRAVEN PERFORMANCE FINDING
- Location: apps/VCSM/src/features/feed/dal/feed.read.posts.dal.js (lines 22–23)
- Application Scope: VCSM
- Current behavior: readFeedPostsPage includes deleted_by_actor_id in its SELECT column list.
  This field is internal deletion metadata — it is passed through normalizeFeedRows.model.js
  into the normalized post shape (line 76: deleted_by_actor_id: r.deleted_by_actor_id ?? null).
  The UI does not render this field. It travels over the wire for every post on every feed page.
  This is also flagged in the VENOM security audit as sensitive data exposure.
- Detected pattern: Payload bloat — unnecessary field in every feed post row.
- Estimated impact: LOW (bytes per row are small, but multiplied by all posts across all users)
- Root cause hypothesis: Field was likely included during debugging or a moderation feature
  that was not implemented. Not cleaned up after.
- Recommended optimization: Remove deleted_by_actor_id from the .select() column list in
  readFeedPostsPage and from the normalizeFeedRows output shape. One-line fix in each file.
- Expected improvement: Minor payload reduction per feed page. Also removes a security surface.
```

---

### FINDING-11 — Profile Posts: No Cursor Pagination — 60-Row Hard Cap

```
KRAVEN PERFORMANCE FINDING
- Location: apps/VCSM/src/features/feed/dal/listActorPostsByActor.dal.js
- Application Scope: VCSM
- Current behavior: listActorPostsByActorDAL fetches actor posts with a default LIMIT of 60.
  There is no cursor — the first 60 posts (by created_at desc) are returned and there is no
  way to load the next 60. Actors with more than 60 posts have their older posts permanently
  inaccessible through the profile feed.
  The controller accepts a limit override, but no UI path currently passes one to expose pagination.
- Detected pattern: Missing pagination — bounded fetch with no continuation mechanism.
- Estimated impact: MEDIUM (correctness gap for active actors; performance concern for actors
  with many posts where 60 rows is still a meaningful payload)
- Root cause hypothesis: Cursor pagination was deferred when the 60-row safety cap was added.
  The limit prevents unbounded queries but does not provide complete data access.
- Recommended optimization: Add cursor-based pagination — accept an optional cursorCreatedAt param,
  apply .lt('created_at', cursorCreatedAt) when provided, and return the last row's created_at
  as the next cursor. Mirror the pattern in readFeedPostsPage. This also enables the controller
  and hook to expose "load more" on the profile posts screen.
- Expected improvement: Correct data completeness for active actors. Minor payload improvement
  if page size is reduced from 60 to a smaller initial batch (e.g., 20).
```

---

### FINDING-12 — Background Hydration Accumulation: Unbounded Fire-and-Forget on Multi-Page Feeds

```
KRAVEN PERFORMANCE FINDING
- Location: apps/VCSM/src/features/feed/hooks/useCentralFeed.js (lines 153–165)
- Application Scope: VCSM
- Current behavior: After each page load, the hook dispatches up to two fire-and-forget
  hydrateActorsByIds calls:
  (1) For stale/missing actors from the page
  (2) For VPORT actors with no name (force: true)
  These are intentionally background and do not block render. However, on a multi-page scroll
  session (user scrolls through 5+ pages), up to 10 background hydration calls may be in
  flight simultaneously. Each hydration call may trigger additional DB reads through the
  hydration engine. These calls are unmetered — there is no deduplication across concurrent calls.
- Detected pattern: Unmetered background DB traffic — accumulates with scroll depth.
- Estimated impact: LOW-MEDIUM (invisible to user, but creates background DB load proportional
  to feed scroll depth)
- Root cause hypothesis: Background hydration is correct by design — it avoids blocking render.
  The issue is that no deduplication mechanism exists to coalesce multiple concurrent hydration
  calls for the same actor IDs.
- Recommended optimization:
  (a) Deduplicate in-flight hydration calls per actor ID — if a hydrateActorsByIds call is
      already pending for an actor, skip the duplicate dispatch.
  (b) Batch hydration calls across page transitions — collect stale actor IDs from multiple
      pages and fire one batched hydration call per scroll idle.
  (c) The VPORT "force: true" path (line 163) fires for VPORTs with no name. If the VPORT
      has no name after the bundle fetch, it likely won't have one in the hydration store either.
      Consider whether this force-hydrate path is producing value.
- Expected improvement: Reduces background DB read count on long scroll sessions. Does not
  affect visible latency but reduces total DB query count and connection pressure.
```

---

## PRIORITY LIST

```
KRAVEN PRIORITY LIST

1. FINDING-01: Multi-page drain loop — up to 33 serial DB round-trips on first load
   Impact: CRITICAL
   File: fetchCentralFeedPage.js
   Fix: Reduce MAX_EMPTY_PAGES_PER_FETCH; add DB-side visibility pre-filtering

2. FINDING-07: Comment thread — no pagination, full load on PostDetail mount
   Impact: HIGH
   File: postComments.read.dal.js
   Fix: Add LIMIT cap immediately; add cursor pagination

3. FINDING-02: Comment counts — all rows fetched, counted in JS
   Impact: HIGH
   File: feed.read.commentCounts.dal.js
   Fix: DB-side COUNT via RPC or materialized counter

4. FINDING-03: Reaction counts — all rows fetched, aggregated in JS
   Impact: HIGH
   File: feed.read.reactionCounts.dal.js
   Fix: DB-side GROUP BY/SUM via RPC or materialized counters

5. FINDING-09: Explore search — ILIKE full-table scan on vc.posts
   Impact: HIGH (grows O(n) with post volume)
   File: search.dal.js + DB migration
   Fix: pg_trgm GIN index or full-text search (Carnage scope)

6. FINDING-04: actor_privacy_settings — cache bypass, all actors queried every call
   Impact: MEDIUM
   File: feed.read.actorsBundle.dal.js
   Fix: One-line change: uniqueActorIds → uncachedIds on privacy query

7. FINDING-05: sendRose — 4 serial DB round-trips; steps 3+4 parallelizable
   Impact: MEDIUM
   File: sendRose.controller.js
   Fix: Promise.all fetchPostByIdDAL + fetchReactionSummaryDAL after insert

8. FINDING-06: toggleCommentLike — 4 serial DB round-trips; steps 3+4 parallelizable
   Impact: MEDIUM
   File: commentReactions.controller.js
   Fix: Promise.all notification routing + count read after write

9. FINDING-08: fetchPostMentionRows — hidden 2-step serial chain + @ short-circuit gap
   Impact: MEDIUM
   File: feed.mentions.dal.js
   Fix: Reuse actorsBundle result for mention identity; fix @ short-circuit

10. FINDING-11: Profile posts — 60-row cap with no cursor pagination
    Impact: MEDIUM
    File: listActorPostsByActor.dal.js
    Fix: Add cursor pagination mirroring readFeedPostsPage pattern

11. FINDING-12: Background hydration — unbounded accumulation on multi-page feeds
    Impact: LOW-MEDIUM
    File: useCentralFeed.js
    Fix: Deduplicate in-flight hydration calls per actor ID

12. FINDING-10: readFeedPostsPage — deleted_by_actor_id in select (payload bloat)
    Impact: LOW
    File: feed.read.posts.dal.js
    Fix: Remove field from select list and normalizeFeedRows output
```

---

## CACHING GAPS SUMMARY

| Data | Cached? | TTL | Gap |
|---|---|---|---|
| Actor bundles | Yes (per-actor TTL) | 30s | Privacy query not scoped to uncachedIds (FINDING-04) |
| Post media | Yes (TTL) | 60s | Stale after post edit adds media |
| Block rows | Yes (TTL) | 60s | Stale after new block — up to 60s lag |
| Follow rows | Yes (TTL) | 60s | Stale after new follow — up to 60s lag |
| Reaction counts | No | None | Re-fetched every feed page (FINDING-03) |
| Comment counts | No | None | Re-fetched every feed page (FINDING-02) |
| Viewer reactions | No | None | Re-fetched every feed page |
| Hidden posts | No | None | Re-fetched every feed page |
| Comment thread | No | None | Full load every PostDetail mount (FINDING-07) |
| React Query feed | Yes | staleTime: 30s | Navigator-away refetches only after 30s |

---

## QUICK WINS (No Schema Changes Required)

These can be implemented immediately with code-only changes:

| # | Finding | Effort | Impact |
|---|---|---|---|
| 1 | FINDING-04 privacy query: uniqueActorIds → uncachedIds | 1 line | Eliminates redundant privacy reads on cached pages |
| 2 | FINDING-10 remove deleted_by_actor_id from select | 2 lines | Payload + security |
| 3 | FINDING-07 add LIMIT cap to listPostComments | 1 line | Caps worst-case comment thread payload |
| 4 | FINDING-05 parallelize sendRose post-insert reads | 3 lines | -1 serial round-trip per rose send |
| 5 | FINDING-06 parallelize toggleCommentLike post-write reads | 3 lines | -1 serial round-trip per comment like |
| 6 | FINDING-01 reduce MAX_EMPTY_PAGES_PER_FETCH from 3 to 2 | 1 line | -11 worst-case DB queries on first load |

---

_KRAVEN audit complete — analysis only. No files were modified during this audit._
