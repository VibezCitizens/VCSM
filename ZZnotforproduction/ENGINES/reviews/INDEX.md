# INDEX — ENGINES / reviews

Status: ARCHITECT COMPLETE (2026-06-05)
Ticket: TICKET-ARCHITECT-MISSING-0001

## Source Root

`/Users/vcsm/Desktop/VCSM/engines/reviews/`

## Governance Files

| File | Status |
|------|--------|
| ARCHITECTURE.md | PRESENT |
| CURRENT_STATUS.md | PRESENT |
| CLAUDE.md (engine root) | PRESENT |
| BEHAVIOR.md | MISSING |
| SECURITY.md | MISSING |

## Source Inventory (as of 2026-06-05)

```
engines/reviews/
├── CLAUDE.md                                   — scope rules (reviews schema only; no React)
├── index.js                                    — entry point → src/adapters/index.js
└── src/
    ├── adapters/index.js                       — 14 exported symbols
    ├── config.js                               — DI (supabaseClient, isActorOwner, resolveActorCard, debugReporter)
    ├── events.js                               — 5 domain events
    ├── types/index.js                          — JSDoc typedefs
    ├── controller/
    │   ├── submitReview.controller.js          — upsert via SECURITY DEFINER RPC
    │   ├── deleteReview.controller.js          — soft-delete (author + owner double guard)
    │   ├── listReviews.controller.js           — paginated; snapshot author cards (no N+1)
    │   ├── getMyActiveReview.controller.js
    │   ├── getReviewFormConfig.controller.js
    │   └── getReviewStats.controller.js
    ├── dal/
    │   ├── reviews.read.dal.js
    │   ├── reviews.write.dal.js                — ANOM-REV-001: dalInsertReview may be dead code
    │   ├── reviews.rpc.dal.js                  — 2 RPCs (upsert_neutral_review SECURITY DEFINER, get_target_overall_stats)
    │   ├── dimensions.read.dal.js
    │   ├── dimensionRatings.read.dal.js
    │   └── dimensionRatings.write.dal.js
    ├── model/
    │   ├── Review.model.js
    │   ├── ReviewRevision.model.js             — ANOM-REV-002: no read DAL; not exported
    │   ├── Dimension.model.js
    │   ├── DimensionRating.model.js
    │   ├── AuthorCard.model.js
    │   └── TargetStats.model.js
    └── services/
        ├── dimensionService.js
        ├── reviewService.js
        └── statsService.js
```

Total: 27 files (zero tests)

## ARCHITECT Output

`outputs/2026/06/05/ARCHITECT/engine.reviews.architecture.md`
