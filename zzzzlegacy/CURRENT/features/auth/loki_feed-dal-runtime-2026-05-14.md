---
report: loki_feed-dal-runtime
date: 2026-05-14
scope: apps/VCSM/src/features/feed/ — pipeline, DAL, query layer
triggered_by: CEREBRO verification pass on vcsm.dal.feed.md
authority: GOVERNANCE_WRITABLE
---

# LOKI — Feed DAL Runtime Trace
_Date:_ 2026-05-14  
_Scope:_ `apps/VCSM/src/features/feed/pipeline/`, `dal/`, `queries/`  
_Triggered by:_ CEREBRO verification pass on `vcsm.dal.feed.md`

---

## Execution Path Traced

```
CentralFeedScreen.jsx
  → useCentralFeed.js
    → fetchCentralFeedPage.js (queries/ layer, Service)
      → [while loop, max 2 iterations on initial load]
        → fetchFeedPagePipeline() [pipeline/]
          → readFeedPostsPage()  [SEQUENTIAL — must run first for post IDs]
          → Promise.all([
              readPostMediaMap(pagePostIds)
              fetchPostMentionRows(pagePostIds)    [← conditional on @ in text]
              readHiddenPostsForViewer({viewerActorId, postIds})
              readActorsBundle(actorIds)            [← up to 4 internal sub-queries]
              readFeedBlockRowsDAL({viewerActorId, actorIds})
              readFeedFollowRowsDAL({viewerActorId, actorIds})
              readCommentCountsBatch(pagePostIds)
              readViewerReactionsBatch({postIds, actorId})
              readReactionCountsBatch(pagePostIds)  [← 2 internal parallel queries]
            ])
          → buildBlockedActorSetModel, buildFollowedActorSetModel
          → buildMentionMaps
          → normalizeFeedRows → resolveFeedRowVisibilityModel → inferMediaType
          → returns: normalized, debugRows, hasMoreNow, nextCursorCreatedAt, ...
        → [if not enough visible posts and hasMore: loop again]
      → returns: { posts, nextCursor, hasMore, ... }
```

---

## LK1 — Ungated `console.log` in Pipeline (LOW — DORMANT)

**File:** `pipeline/fetchFeedPage.pipeline.js:125`

```js
if (debugPostId && pagePostIds.includes(debugPostId)) {
  console.log("[useFeed][mentions][DBG] debugPostId is on this page", {
    debugPostId,
    pagePostIds,
  });
}
```

**Status:** DORMANT. `debugPostId` is a destructured parameter of `fetchFeedPagePipeline`. The active caller (`fetchCentralFeedPage.js`) never passes `debugPostId` — it is always `undefined`. The condition `if (debugPostId && ...)` is always false in the current React Query path.

The log may have originated from the legacy `useFeed.js` path. If `useFeed.js` (accessed via `PostFeed.screen.jsx`) also does not pass `debugPostId`, the log is completely dead.

**Risk:** If any future caller passes `debugPostId`, the `console.log` fires in production without env guard. The parameter should either be removed or gated.

**Recommended fix:** Wrap in `if (import.meta.env.DEV && debugPostId && ...)` or remove the log entirely.

---

## LK2 — Ungated `console.warn` in Mentions DAL (LOW — FIRES ON ERROR)

**File:** `dal/feed.mentions.dal.js:20`

```js
if (eErr) {
  console.warn("[fetchPostMentionRows] post_mentions failed:", eErr);
  return [];
}
```

**Status:** FIRES IN PRODUCTION on `post_mentions` query failure. This is not a debug log — it is error reporting. However:
- It reveals the internal table name (`post_mentions`) to the browser console
- It soft-swallows the error (returns `[]` instead of rethrowing)

The soft-swallow is intentional: a missing mention row should not break the feed. The `console.warn` is the only signal that a query failed.

**Risk (LOW):** If mention queries fail silently, posts with `@` mentions will render without mention resolution (links broken, names missing) with no user-visible indication. The warn is in production console — visible to users with DevTools open.

**Recommended fix:** Gate with `import.meta.env.DEV` or replace with a structured telemetry event.

---

## LK3 — `feed.mentions.dal.js` Sequential Double Round-Trip (MODERATE)

**File:** `dal/feed.mentions.dal.js`

The `fetchPostMentionRows` function is placed in the pipeline's `Promise.all()` (parallel batch), but internally makes two sequential DB calls:

```
Promise.all([...]) starts
  fetchPostMentionRows() starts
    1. await supabase.from("post_mentions").select(...)  [Round-trip 1]
    2. await hydrateAndReturnSummaries({ actorIds })       [Round-trip 2 — sequential]
  fetchPostMentionRows() completes
...rest of Promise.all completes
```

**Runtime impact:** When a page contains posts with `@` in their text, the mention path adds 2 sequential round-trips inside a slot that the rest of the pipeline expects to be a single async operation. The outer `Promise.all` must wait for BOTH rounds to complete before any normalization begins.

Worst-case latency addition (@ mentions present, cold cache):
- Round-trip 1: `~30-80ms` (post_mentions query)
- Round-trip 2: `~30-80ms` (hydration query for actor IDs)
- Sequential gap: `~60-160ms` added to the Promise.all completion time

**Note:** When `@` is NOT detected in post text, `fetchPostMentionRows` is skipped entirely: `hasPotentialMentions ? fetchPostMentionRows(pagePostIds) : Promise.resolve([])`. The performance impact is conditional on post content.

---

## LK4 — Initial Load May Execute Pipeline Twice (MODERATE)

**File:** `queries/fetchCentralFeedPage.js`

```js
const MAX_EMPTY_PAGES_PER_FETCH = 2
while (hasMoreNow && pagesFetched < MAX_EMPTY_PAGES_PER_FETCH) {
  pagesFetched++
  const res = await withTimeout(fetchFeedPagePipeline({...}))
  ...
  if (!hasMoreNow || !nextCursorCreatedAt || normalizedChunk.length >= targetVisibleCount) break
}
```

On initial load (`isInitial=true`, `targetVisibleCount=3`), if the first pipeline execution returns 0 visible posts (all filtered by privacy/blocks), the loop fires the full pipeline a second time.

**Runtime impact:** In a worst-case cold-cache scenario (new user with many blocked actors), the initial page load could fire all 14+ DB queries **twice** (28+ total queries) with a 15-second timeout umbrella.

**Mitigation in place:**
- `MAX_EMPTY_PAGES_PER_FETCH = 2` caps the loop
- 15-second timeout via `withTimeout`
- Cache TTLs (30s actors, 60s blocks/follows/media) ensure page 2 re-uses cached data

**Status:** ACCEPTABLE DESIGN — the drain is intentional to fill visible content. The cap and timeout are correct. Flagged for documentation only.

---

## LK5 — `recordStep` Comment Discrepancy: dalCount: 9 vs Document's 10 (LOW)

**File:** `pipeline/fetchFeedPage.pipeline.js:113`

```js
if (import.meta.env.DEV) recordStep("parallel_dal_complete", { dalCount: 9 });
```

The document states "10 DAL reads" and "All 10 reads execute in a single Promise.all()."

**Actual count:**
- Sequential pre-query: `readFeedPostsPage` (1 — runs before Promise.all)
- Promise.all entries: 9 (confirmed by code)
- **Total DAL function calls per pipeline execution: 10 (1 + 9)**

The `dalCount: 9` in `recordStep` is technically correct for the Promise.all batch. The document's "10 reads execute in a single Promise.all()" is incorrect — it should say "1 sequential + 9 parallel."

---

## LK6 — `readPostMediaMap` Silently Swallows Errors (MODERATE)

**File:** `dal/feed.read.media.dal.js:38`

```js
if (pmErr) {
  return mediaMap; // Returns empty map — no throw, no log
}
```

All other DAL files `throw error`. This is the only DAL that silently returns an empty result on error. When `post_media` queries fail, posts will render without media attachments with:
- No error thrown to the pipeline
- No `console.warn` or log
- No user-visible indication
- Posts appearing as text-only silently

**Risk:** A Supabase outage on the `vc.post_media` table would silently degrade the feed to text-only with no alerting. The pattern diverges from every other DAL in the feature.

**Recommended fix:** Add `console.warn` or telemetry on error, and consider re-throwing so the pipeline can handle gracefully.

---

## Runtime Execution Summary

| Check | ID | Severity | Status |
|---|---|---|---|
| Ungated production `console.log` | LK1 | LOW | DORMANT — `debugPostId` never passed in active path |
| Ungated production `console.warn` | LK2 | LOW | FIRES ON ERROR — intentional but ungated |
| Sequential double round-trip in mentions | LK3 | MODERATE | FIRES when `@` present — adds 60-160ms |
| Pipeline fires twice on initial empty feed | LK4 | MODERATE | CAPPED at 2 — by design |
| `dalCount: 9` vs doc's "10 in Promise.all" | LK5 | LOW | DOC INACCURACY |
| `readPostMediaMap` swallows errors silently | LK6 | MODERATE | NO THROW, NO LOG |

**LOKI Verdict: RUNTIME CONCERNS FOUND**  
No blocking runtime failures. Three moderate concerns (LK3, LK4, LK6) represent intentional but underdocumented trade-offs. LK1 is an orphaned debug path requiring cleanup. LK6 is a pattern divergence that could mask production media failures.
