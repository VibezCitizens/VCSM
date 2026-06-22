---
title: Reviews Module — Security
status: STUB
feature: reviews
module: reviews
source: venom+bw-derived
created: 2026-06-05
---

# reviews / modules / reviews — SECURITY

## THOR Status

**THOR RELEASE BLOCKER** — engine-layer findings (VEN-REVIEWS-001). Feature-layer clean.

## Feature-Layer Findings

None — setup.js only.

## Engine-Layer Findings (cross-reference — engines/reviews)

| Finding | Severity | Description |
|---|---|---|
| VEN-REVIEWS-001 | HIGH THOR | dalInsertReview orphaned direct INSERT — bypasses upsert_neutral_review RPC, violates one-active-card constraint |
| VEN-REVIEWS-003 | MEDIUM | dalDeleteDimensionRatingsForReview no author_actor_id guard |
| VEN-REVIEWS-004 | MEDIUM | getMyActiveReview authorActorId caller-supplied, not session-verified |
| VEN-REVIEWS-005 | LOW | configureReviewsEngine no re-entry guard |

## ELEKTRA Status

ELEKTRA has NOT been run on this feature.
