---
name: vcsm.reviews.index
description: VCSM reviews feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / reviews

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-04
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 0 | All controllers delegated to engines/reviews/src/controller/ (6 files) |
| DAL files | 0 | All DAL delegated to engines/reviews/src/dal/ (6 files) |
| Hooks | 0 | No hooks — app consumers build their own |
| Models | 0 | All models delegated to engines/reviews/src/model/ (6 files) |
| Screens | 0 | No screens — review UI is embedded in profiles, public, dashboard |
| Components | 0 | No components |
| Adapters | 0 | Engine public surface is engines/reviews/src/adapters/index.js |
| Barrels | 0 | No barrel files in feature |
| Tests | 0 | No test coverage |
| Routes | 0 | No routes — feature is a bootstrap shim, not a navigable surface |
| Total source files | 1 | apps/VCSM/src/features/reviews/setup.js |

## Write Surface Map

No write surfaces detected by scanner for this feature. All review writes are executed inside `engines/reviews` via RPC and direct DAL calls. The engine writes to:

| Operation | Schema | Table | Function |
|---|---|---|---|
| rpc | reviews | — (reviews.upsert_neutral_review) | dalRpcUpsertNeutralReview |
| upsert | reviews | review_dimension_ratings | dalUpsertDimensionRatings |
| read | reviews | reviews | dalGetReviewById, dalListReviews |
| read | reviews | review_dimensions | dalListDimensions |
| read | reviews | review_dimension_ratings | dalListDimensionRatingsForReview |
| read | reviews | review_revisions | (revision history reads) |

## Security-Sensitive Surfaces

The feature's single file (`setup.js`) injects an `isActorOwner` function into the review engine as a defense-in-depth pre-check. This function queries `vc.actor_owners` with RLS enforcement (`actor_owners_read_own` policy: `user_id = auth.uid()`).

The DB enforces real ownership inside `reviews.upsert_neutral_review()` as a `SECURITY DEFINER` RPC — the app-side check is a pre-guard, not the sole gate.

REV-V-001 fix: the ownership check was corrected to query `vc.actor_owners` (not `vc.actors`) to prevent non-owner actors from passing the check.

No high-sensitivity financial or payment surfaces in this feature.

## Engine Dependencies

- `engines/reviews` — sole engine dependency; configured via `configureReviewsEngine()` DI call

## Routes

No routes in route-map for this feature. `setupVcsmReviewsEngine()` is called at app startup, not via navigation.

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT — PLACEHOLDER (no formal contract written) |
| ARCHITECTURE.md | PRESENT (this run — 2026-06-04) |
| CURRENT_STATUS.md | PRESENT (this run — 2026-06-04) |
