# LOKI — Runtime Observability & Execution Trace
**Target Module:** reviews  
**Scope:** `apps/VCSM/src/features/reviews/` + `engines/reviews/`  
**Date:** 2026-05-23  
**Status:** REVIEW_PENDING  
**Triggered by:** CEREBRO run on `vcsm.reviews.architecture.md`

---

## Execution Trace

### Startup Path

```
main.jsx:22
  └── setupVcsmReviewsEngine()                    [setup.js:18]
        └── if (_configured) return               [idempotency guard — module-level flag]
        └── configureReviewsEngine({              [config.js:16]
              supabaseClient: supabase,
              isActorOwner: async fn
            })
            └── _config = { ..._config, ...config }  [merge — additive, not reset]
```

**Verdict:** Setup call order is CORRECT. `setupVcsmReviewsEngine()` fires at line 22 of `main.jsx`, before `createRoot().render()` at line 106. All engine dependencies are configured before any React component mounts.

---

### Request Path — submitReview

```
Consumer calls submitReview({ targetActorId, authorActorId, body, ratings })
  └── submitReview.controller.js:26
        [guard: targetActorId && authorActorId]
        [guard: targetActorId !== authorActorId]
        └── isActorOwner(authorActorId)           [config.js:35 → setup.js:30]
              └── supabase.auth.getSession()       [async — 1 network call]
              └── supabase.vc.actors.select('id') [async — 1 network call]
              ← returns true/false
        [BROKEN: does not check actor_owners — see Venom V-01]
        └── dalRpcUpsertNeutralReview(...)         [reviews.rpc.dal.js:19]
              └── supabase.schema('reviews').rpc('upsert_neutral_review', ...)  [1 RPC]
              ← returns reviewId
        └── [optional] dalUpsertDimensionRatings(...)  [1 batch upsert if ratings present]
        └── dalGetReviewById({ reviewId })         [reviews.read.dal.js:116]
              └── supabase.schema('reviews').from('reviews').select(COLS)  [1 read]
        └── [if no ratings passed] dalListDimensionRatingsForReview({ reviewId })  [1 read]
        └── emit(EVENTS.REVIEW_CREATED, ...)
        ← returns { review, ratings }
```

**Network calls on happy path (no ratings):** 4 sequential  
**Network calls on happy path (with ratings):** 5 sequential  

---

### Request Path — listReviews (N+1 identified)

```
Consumer calls listReviews({ targetActorId, cursor, limit=20 })
  └── listReviews.controller.js:22
        └── dalListReviewsByTarget({ targetActorId, cursor, limit })   [1 read]
              └── supabase.reviews.reviews.select(COLS)
              ← up to 20 rows

        [parallel fan-out]
        └── Promise.all([
              dalListDimensionRatingsByReviewIds({ reviewIds })         [1 read — batch]
              dalGetAuthorCardsForReviews({ reviewIds })                [N READS — N+1 BUG]
                └── for (const reviewId of reviewIds) {
                      supabase.reviews.rpc('get_review_author_card')   [1 RPC per reviewId]
                    }
                    // With limit=20: 20 sequential RPC calls
            ])
```

**N+1 Pattern confirmed:** `dalGetAuthorCardsForReviews` fires one RPC per reviewId in a sequential `for` loop. With a page of 20 reviews, this is 20 serial network roundtrips.

**Impact:** 
- Total network calls for `listReviews(limit=20)`: 1 (list) + 1 (ratings batch) + 20 (author cards) = **22 calls**
- Assuming 80ms/RPC average: ~1.6s serial latency for author card enrichment alone
- No parallelism within the for loop (`Promise.all` would reduce to concurrent execution — see Kraven)

---

### Idempotency Guard Analysis

```js
// setup.js:16-17
let _configured = false

export function setupVcsmReviewsEngine() {
  if (_configured) return
  _configured = true
  ...
}
```

**HMR Risk:** In Vite dev mode with Hot Module Replacement, module re-evaluation can reset `_configured` to `false`. Since `configureReviewsEngine` merges into `_config` (spread, not reset), re-running setup on HMR would re-merge the same config — functionally safe, not a double-registration bug.

**Conclusion:** Low risk in practice. The idempotency guard is correct for production (where setup.js is evaluated once).

---

### Error Surface Analysis

| Error Point | Type | Surfacing |
|---|---|---|
| `getSession()` fails | Network error | Returns `false` from `isActorOwner` — silently denies |
| `supabase.vc.actors` query fails | DB error | Returns `false` — silently denies |
| `getSupabaseClient()` not configured | Throw | Unhandled rejection from first engine call |
| `upsert_neutral_review` RPC fails | Throw | Surfaces to hook/consumer |
| `dalGetAuthorCardsForReviews` RPC fails per-item | Silent `continue` | Missing author card returned as `null` |

**Observation:** `dalGetAuthorCardsForReviews` swallows per-item RPC errors (line 37: `continue` on error). Author cards silently return null instead of surfacing the error. This is intentional tolerance but creates invisible failures.

---

## Runtime Findings

| ID | Finding | Severity |
|---|---|---|
| L-01 | Setup call order is correct — before render | PASS |
| L-02 | N+1 in `dalGetAuthorCardsForReviews` (20 sequential RPCs for limit=20) | HIGH — see Kraven |
| L-03 | `isActorOwner` makes 2 serial async calls on every write op | MEDIUM |
| L-04 | Author card errors silently swallowed — null returned per missing card | LOW |
| L-05 | No retry or offline queue on review write operations | LOW — iOS risk |

**Downstream:** Kraven for L-02 performance optimization recommendation.
