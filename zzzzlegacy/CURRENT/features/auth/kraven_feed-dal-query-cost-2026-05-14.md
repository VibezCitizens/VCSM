---
report: kraven_feed-dal-query-cost
date: 2026-05-14
scope: apps/VCSM/src/features/feed/ — pipeline and DAL query cost
triggered_by: CEREBRO verification pass on vcsm.dal.feed.md
authority: GOVERNANCE_WRITABLE
---

# KRAVEN — Feed DAL Query Cost Analysis
_Date:_ 2026-05-14  
_Scope:_ `apps/VCSM/src/features/feed/` — pipeline, queries, and all 17 DAL files  
_Triggered by:_ CEREBRO verification pass on `vcsm.dal.feed.md`

---

## Query Budget: Cold-Cache Single Pipeline Execution

| Step | Function | Queries | Parallel? | Notes |
|---|---|---|---|---|
| Pre-batch | `readFeedPostsPage` | 1 | — (sequential) | Must run first for post IDs |
| Batch slot 1 | `readPostMediaMap` | 1 | YES | TTL-cached 60s; uncached = 1 query |
| Batch slot 2 | `fetchPostMentionRows` | 0–2 | YES | Conditional: 0 if no `@`; 1 post_mentions + 1 hydration if `@` |
| Batch slot 3 | `readHiddenPostsForViewer` | 1 | YES | Always fires |
| Batch slot 4 | `readActorsBundle` | 1–4 | YES inner | actors (1) + profiles (1) + privacy (1) + vports (1) = 4 uncached |
| Batch slot 5 | `readFeedBlockRowsDAL` | 1 | YES | TTL-cached 60s |
| Batch slot 6 | `readFeedFollowRowsDAL` | 1 | YES | TTL-cached 60s; fetches ENTIRE follow graph |
| Batch slot 7 | `readCommentCountsBatch` | 1 | YES | No limit on rows returned |
| Batch slot 8 | `readViewerReactionsBatch` | 1 | YES | Always fires |
| Batch slot 9 | `readReactionCountsBatch` | 2 | YES inner | `post_reactions` + `post_rose_gifts` in inner parallel |
| **Totals** | | | | |
| **Cold cache, no @** | | **12** | | 1 seq + 8 outer + 3 inner (actors 3 + reactions 2 - 2 accounted) |
| **Cold cache, with @** | | **14** | | +2 sequential mention round-trips |
| **Warm cache** | | **4–6** | | Only posts, media, hidden posts, viewer reactions, reaction counts |

**Corrected count (cold cache, with @):**
- Sequential: 1 (posts)
- Outer parallel (9 slots): 9 (but slot 2 resolves to `Promise.resolve([])` if no @)
- Inner parallel inside slot 4 (actors bundle): 3 additional queries
- Inner parallel inside slot 9 (reaction counts): 2 queries but already counted in 9
- Sequential inside slot 2 (mentions): 2 queries sequential

Wait — clarifying:
- Outer `Promise.all` has 9 slots
- Slot 4 (`readActorsBundle`): 1 actors query + parallel([profiles, privacy, vports]) = 4 total
- Slot 9 (`readReactionCountsBatch`): parallel([reactions, roses]) = 2 queries
- Slot 2 (`fetchPostMentionRows`): post_mentions (1) + hydration (1) = 2 sequential queries

**True DB query count per cold-cache pipeline call (with mentions):**
= 1 (posts) + 7 outer (slots 1,3,5,6,7,8 = 6; slot 4 expanded=4; slot 9 expanded=2) + 2 (mentions sequential inside slot)
= 1 + 6 + 4 + 2 + 2 = 15 queries

**True DB query count per cold-cache pipeline call (no mentions):**
= 1 + 6 + 4 + 2 = 13 queries

---

## KR1 — Cold-Cache Initial Page Load: Up to 30 DB Queries (HIGH)

`fetchCentralFeedPage.js` implements a drain loop for initial load:

```js
const MAX_EMPTY_PAGES_PER_FETCH = 2
// Fires pipeline up to 2x on initial load if first page has 0 visible posts
while (hasMoreNow && pagesFetched < MAX_EMPTY_PAGES_PER_FETCH) {
```

In worst case (new user, many blocked/private accounts, @ mentions present):
- Pipeline execution 1: **15 queries** (cold cache)
- Pipeline execution 2: **8–10 queries** (actors/blocks/follows cached from page 1, posts/media/reactions still cold)
- **Total: 23–25 DB round-trips** on initial feed load

**Mitigation:**
- `MAX_EMPTY_PAGES_PER_FETCH = 2` hard cap
- 15-second global timeout
- Actor/block/follow caches (30s–60s TTL) mean page 2 reuses most cached data
- In typical use: first page has visible posts → pipeline only fires once

**Assessment:** Acceptable for current scale. Should be monitored if user base grows to high follow/block counts. Recommend adding a KRAVEN metric in the feed profiler for cold-cache query count.

---

## KR2 — `readCommentCountsBatch`: No Row Limit (MODERATE)

**File:** `dal/feed.read.commentCounts.dal.js`

```js
const { data: rows } = await supabase
  .schema("vc")
  .from("post_comments")
  .select("post_id")
  .in("post_id", postIds)
  .is("deleted_at", null);
// No .limit() call
```

**Concern:** For a page of 10 posts, if any post has thousands of comments, all comment rows are returned (just the `post_id` column) and then counted in JavaScript. The only data transferred per row is a UUID (16 bytes), so the payload is compact. However:

- 10 posts × average 50 comments = 500 rows → ~8KB → acceptable
- 1 viral post × 10,000 comments + 9 normal posts × 10 comments = 10,090 rows → ~161KB → noticeable payload on mobile

The count could instead be done via a PostgreSQL `count()` aggregate grouped by `post_id`, eliminating row transfer entirely:
```sql
SELECT post_id, count(*) FROM vc.post_comments 
WHERE post_id = ANY($1) AND deleted_at IS NULL 
GROUP BY post_id
```

**Assessment:** MODERATE risk. Current approach is correct for low-comment posts. Payload scales linearly with comment count. Recommend upgrading to aggregate query if any post exceeds 500 comments.

---

## KR3 — `readFeedFollowRowsDAL`: Full Follow Graph Fetch (MODERATE)

**File:** `dal/feed.read.followRows.dal.js`

```js
// Fetch the full follow graph for this viewer — not scoped to the current page's actorIds.
// Caching a page-scoped subset caused cache misses on every scroll page.
const { data } = await supabase
  .schema("vc")
  .from("actor_follows")
  .select("follower_actor_id,followed_actor_id,is_active")
  .eq("follower_actor_id", viewerActorId)
  .eq("is_active", true);
// No limit
```

**Concern:** This fetches ALL active follow relationships for the viewer regardless of page size. A VPORT actor (business account) following 10,000 accounts would transfer 10,000 follow rows on first feed load.

**Mitigations in place:**
- 60-second TTL cache → only fetches once per 60s, then filters from cache
- `select("follower_actor_id,followed_actor_id,is_active")` → 3 UUID-or-bool columns per row → ~49 bytes/row
- 10,000 follows → ~490KB → large for mobile on first load

**Assessment:** MODERATE — the cache justifies the design for normal users. For vport actors with large follow graphs, the cold-cache first-load payload could be substantial. No immediate action required but should be monitored.

---

## KR4 — `readActorsBundle`: 4 Internal Sub-Queries on Cold Cache (LOW)

**File:** `dal/feed.read.actorsBundle.dal.js`

Per cold-cache call, the bundle fires up to 4 sub-queries internally:
1. `vc.actors` — get actor records
2. `public.profiles` — get user profile display data
3. `vc.actor_privacy_settings` — get privacy flags
4. `vport.profiles` — get vport profile data

Sub-queries 2, 3, 4 run in `Promise.all([...])` after query 1 completes.

**Mitigation in place:**
- Per-actor 30-second TTL cache using `actor:{id}` key
- Cache is checked per-actor before querying — only uncached actors trigger DB round-trips
- Cache hit rate is high for repeat scrolling (same actors appear across pages)

**Assessment:** LOW — the caching design is correct and efficient. The 4-query pattern only fires for uncached actors, which is a first-load-only concern.

---

## KR5 — `readReactionCountsBatch`: Inner Parallel Works Correctly (PASS)

**File:** `dal/feed.read.reactionCounts.dal.js`

```js
const [reactionsResult, rosesResult] = await Promise.all([
  supabase.schema("vc").from("post_reactions").select("post_id, reaction").in("post_id", postIds),
  supabase.schema("vc").from("post_rose_gifts").select("post_id, qty").in("post_id", postIds),
]);
```

Two queries run in parallel inside the outer Promise.all batch. Correct pattern.

**Assessment:** PASS — inner parallel correctly reduces round-trip time.

---

## Performance Budget Summary

| Scenario | DB Queries | Est. Latency | Risk |
|---|---|---|---|
| Warm cache, no @ | 4–5 | ~50-80ms | LOW |
| Cold cache, no @ | 13 | ~150-300ms | MODERATE |
| Cold cache, with @ | 15 | ~250-450ms | MODERATE |
| Cold cache, empty first page (2x pipeline) | 23–25 | ~400-800ms | HIGH |
| High-follow vport, cold cache | 13+ large payload | ~300-600ms + data | MODERATE |

---

## KRAVEN Verdict: ACCEPTABLE WITH MONITORING REQUIRED

No blocking performance issues. The pipeline's `Promise.all` batching is correctly implemented and eliminates all N+1 patterns. Cache TTLs are correctly sized for session reuse. Three moderate concerns exist (KR1 cold-cache worst case, KR2 comment payload, KR3 follow graph) that require monitoring at scale. KR2 (comment count approach) is the highest-priority improvement — recommend upgrading to a PostgreSQL aggregate query before the platform reaches high-engagement post volumes.

**Required next:** Instrument feed profiler with cold-cache query count metric. Monitor `readFeedFollowRowsDAL` response size for vport actors.
