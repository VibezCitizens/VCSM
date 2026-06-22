# KRAVEN — Performance Governance & Bottleneck Analysis
**Target Module:** reviews  
**Scope:** `engines/reviews/src/`  
**Date:** 2026-05-23  
**Status:** REVIEW_PENDING  
**Upstream:** LOKI `loki_reviews_module_2026-05-23.md`

---

## Bottleneck Summary

One confirmed N+1 and one serial call chain requiring optimization.

---

## FINDING K-01 — N+1 in `dalGetAuthorCardsForReviews`  
**Severity:** HIGH  
**File:** `engines/reviews/src/dal/authors.read.dal.js:29-42`

### Current Pattern

```js
for (const reviewId of reviewIds) {
  const { data, error } = await supabase
    .schema('reviews')
    .rpc('get_review_author_card', { p_review_id: reviewId })
  // ...
}
```

- Sequential `for...await` loop — each RPC waits for the previous to complete.
- With `limit=20` (default page size in `listReviews`): **20 serial RPC roundtrips**.
- Estimated latency: 80–120ms per RPC × 20 = **1.6s–2.4s** for author card enrichment alone.
- This blocks review list rendering even when all other data is ready.

### Root Cause

`get_review_author_card` is a single-item RPC. There is no batch variant.

### Recommended Fix (in order of preference)

**Option A — Parallel execution (lowest effort):**
```js
// Replace for loop with Promise.all
const results = await Promise.all(
  reviewIds.map(async (reviewId) => {
    const { data, error } = await supabase
      .schema('reviews')
      .rpc('get_review_author_card', { p_review_id: reviewId })
    if (error || !data?.[0]) return null
    return { reviewId, ...data[0] }
  })
)
return results.filter(Boolean)
```
- Reduces wall time from 20 × serial to 1 × concurrent round.
- Still 20 DB operations; connection pool pressure remains.
- **Safe to ship with no DB migration.**

**Option B — Batch RPC (optimal, requires DB migration):**
- Create `reviews.get_review_author_cards(p_review_ids uuid[])` returning `SETOF`
- Single RPC call for entire batch
- Requires Carnage migration

**Recommendation:** Ship Option A immediately as a hotfix. Schedule Option B for next DB migration window.

---

## FINDING K-02 — isActorOwner Adds 2 Serial Async Calls Per Write  
**Severity:** MEDIUM  
**File:** `apps/VCSM/src/features/reviews/setup.js:30-44`

Every `submitReview` and `deleteReview` call fires:
1. `supabase.auth.getSession()` — network call
2. `supabase.vc.actors.select('id')` — DB query

These run sequentially before the main operation. For the fixed `isActorOwner` (querying `actor_owners`), this pattern persists — though `getSession()` may be cached by the Supabase client.

**Impact:** Adds ~80–160ms to every write operation latency.

**Recommendation (after V-01 fix):** Check if session is already available from auth context (avoid redundant `getSession()` call). Consider caching actor ownership in memory for the session duration.

---

## FINDING K-03 — `submitReview` Happy Path: 4–5 Sequential Network Calls  
**Severity:** LOW  
**File:** `engines/reviews/src/controller/submitReview.controller.js`

Post-upsert flow:
1. `dalRpcUpsertNeutralReview` — gets reviewId
2. `dalUpsertDimensionRatings` (conditional)
3. `dalGetReviewById` — fetches full row to build domain model
4. `dalListDimensionRatingsForReview` (conditional, when no ratings passed)

Step 3 could be eliminated if `upsert_neutral_review` returned the full row instead of just the ID. This would reduce write path from 4 calls to 2–3. Requires DB migration to change RPC return type.

**Impact:** Minor — write path is not high-frequency. Accept as-is unless submission latency becomes a user complaint.

---

## Performance Findings Table

| ID | Finding | Impact | Fix Effort |
|---|---|---|---|
| K-01 | N+1 in author card batch — 20 serial RPCs | HIGH — 1.6–2.4s latency | LOW (parallel) / MED (batch RPC) |
| K-02 | 2 serial async calls in isActorOwner | MEDIUM — ~160ms per write | LOW (cache session) |
| K-03 | 4–5 sequential calls in submitReview | LOW — write is infrequent | MED (DB change needed) |

**Priority Fix:** K-01 Option A (parallelism) is a pure code change with no DB dependency. Ship immediately.
