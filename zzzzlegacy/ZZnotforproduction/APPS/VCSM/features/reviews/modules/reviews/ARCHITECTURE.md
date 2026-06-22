---
title: Reviews Module — Architecture
status: STUB
feature: reviews
module: reviews
source: venom+bw-derived
created: 2026-06-05
---

# reviews / modules / reviews — ARCHITECTURE

## Boot

```
app boot → setup.js → configureReviewsEngine()
  └── engines/reviews — registers handlers
        NOTE: no re-entry guard on configureReviewsEngine ← VEN-REVIEWS-005
```

## Engine-Layer (all logic in engines/reviews)

- Correct path: upsert_neutral_review SECURITY DEFINER RPC
- Orphaned path: dalInsertReview (direct INSERT — bypasses RPC) ← VEN-REVIEWS-001 THOR BLOCKER
- dalDeleteDimensionRatingsForReview: no author_actor_id ownership guard ← VEN-REVIEWS-003
- getMyActiveReview: authorActorId caller-supplied ← VEN-REVIEWS-004

## TODO

- [ ] Audit engines/reviews module split — engine governance not yet built
