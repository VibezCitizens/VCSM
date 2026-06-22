# Feed Feature — Performance

**Last KRAVEN audit:** 2026-05-14
**Report:** `_ACTIVE/audits/performance/kraven_feed-dal-query-cost-2026-05-14.md`
**Scope:** `apps/VCSM/src/features/feed/` — pipeline, queries, and all 17 DAL files
**Triggered by:** CEREBRO verification pass on `vcsm.dal.feed.md`
**KRAVEN Verdict:** ACCEPTABLE WITH MONITORING REQUIRED

---

## Query Budget Per Pipeline Execution

| Scenario | DB Queries | Est. Latency | Risk |
|---|---|---|---|
| Warm cache, no @ | 4-5 | ~50-80ms | LOW |
| Cold cache, no @ | 13 | ~150-300ms | MODERATE |
| Cold cache, with @ | 15 | ~250-450ms | MODERATE |
| Cold cache, empty first page (2x pipeline) | 23-25 | ~400-800ms | HIGH |
| High-follow vport, cold cache | 13+ large payload | ~300-600ms + data | MODERATE |

---

## Pipeline Execution Shape

| Step | Function | Queries | Parallel? | Cache |
|---|---|---|---|---|
| Pre-batch | `readFeedPostsPage` | 1 | Sequential — must run first | None |
| Slot 1 | `readPostMediaMap` | 1 | YES | TTL-cached 60s |
| Slot 2 | `fetchPostMentionRows` | 0-2 | YES (outer) / sequential (inner) | None — conditional on @ |
| Slot 3 | `readHiddenPostsForViewer` | 1 | YES | None |
| Slot 4 | `readActorsBundle` | 1-4 | YES (inner parallel after actors) | Per-actor 30s TTL |
| Slot 5 | `readFeedBlockRowsDAL` | 1 | YES | TTL-cached 60s |
| Slot 6 | `readFeedFollowRowsDAL` | 1 | YES | TTL-cached 60s |
| Slot 7 | `readCommentCountsBatch` | 1 | YES | None |
| Slot 8 | `readViewerReactionsBatch` | 1 | YES | None |
| Slot 9 | `readReactionCountsBatch` | 2 | YES (inner parallel) | None |

---

## KR1 — Cold-Cache Initial Page Load: Up to 30 DB Queries

**Severity:** HIGH
**Status:** OPEN — monitoring required

`fetchCentralFeedPage.js` may fire the full pipeline up to 2 times on initial load if the first page returns 0 visible posts (`MAX_EMPTY_PAGES_PER_FETCH = 2`). Worst case (new user, many blocked accounts, @ mentions):

- Pipeline 1: 15 queries (cold cache)
- Pipeline 2: 8-10 queries (actors/blocks/follows cached)
- Total: 23-25 DB round-trips

Mitigations: hard cap at 2 iterations, 15-second global timeout, cache TTLs reduce page 2 cost.

**Recommendation:** Add a KRAVEN metric in the feed profiler for cold-cache query count.

---

## KR2 — `readCommentCountsBatch`: No Row Limit

**Severity:** MODERATE
**File:** `apps/VCSM/src/features/feed/dal/feed.read.commentCounts.dal.js`
**Status:** OPEN

Comment rows are fetched as raw rows and counted in JavaScript rather than via a PostgreSQL `count()` aggregate. For low-comment posts this is acceptable. For a viral post with 10,000 comments, this transfers ~161KB of UUID data per feed page load.

**Recommendation:** Upgrade to aggregate query (`SELECT post_id, count(*) GROUP BY post_id`) before any post exceeds 500 comments. This is the highest-priority performance improvement per KRAVEN.

---

## KR3 — `readFeedFollowRowsDAL`: Full Follow Graph Fetch

**Severity:** MODERATE
**File:** `apps/VCSM/src/features/feed/dal/feed.read.followRows.dal.js`
**Status:** OPEN — monitoring required

Fetches ALL active follow relationships for the viewer regardless of page size. For a VPORT actor following 10,000 accounts, first load transfers ~490KB of follow rows.

Mitigation: 60-second TTL cache limits this to once per 60s. Normal users with small follow graphs are unaffected.

**Recommendation:** Monitor response size for vport actors with large follow graphs.

---

## KR4 — `readActorsBundle`: 4 Internal Sub-Queries on Cold Cache

**Severity:** LOW
**Status:** PASS (with caching)

Per cold-cache call: `vc.actors` (1) + parallel([`public.profiles`, `vc.actor_privacy_settings`, `vport.profiles`]) (3) = 4 sub-queries. Per-actor 30-second TTL cache means this only fires for uncached actors — repeat scrolling reuses cache.

---

## KR5 — `readReactionCountsBatch`: Inner Parallel

**Status:** PASS

`post_reactions` and `post_rose_gifts` queries run in `Promise.all()` in parallel inside the outer batch. Correct pattern.

---

## Runtime Performance Concerns (from LOKI)

| ID | Severity | Description |
|---|---|---|
| LK3 | MODERATE | `feed.mentions.dal.js` sequential double round-trip inside Promise.all slot — adds 60-160ms when @ present (linked to SA2 architecture violation) |
| LK4 | MODERATE | Initial load fires pipeline twice in worst case — capped at 2, by design |
| LK6 | MODERATE | `readPostMediaMap` swallows errors silently — media failures masked, no performance signal |
