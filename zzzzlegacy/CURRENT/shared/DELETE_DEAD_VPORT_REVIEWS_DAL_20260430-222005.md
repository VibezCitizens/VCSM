---
type: deletion-manifest
date: 2026-04-30T22:20:05
author: Claude Code
status: completed
---

# Deletion: Dead Raw-Review Read DAL

## File Deleted

```
apps/VCSM/src/features/profiles/kinds/vport/dal/review/vportReviews.read.dal.js
```

## Backup

```
zNOTFORPRODUCTION/zcontract/doc/backups/delete-dead-vport-reviews-dal-20260430-222005/vportReviews.read.dal.js
```

## Reason

File was dead code. The controller (`VportReviews.controller.js`) was already fully
migrated to the `@reviews` engine. All six exports had zero callers anywhere in the
codebase at time of deletion.

## Caller Check — All Exports

| Export | Callers outside file |
|---|---|
| `dalGetVportReviewFormConfig` | 0 |
| `dalGetVportOfficialStats` | 0 |
| `dalListVportReviews` | 0 |
| `dalListVportReviewRatingsByReviewIds` | 0 |
| `dalGetActiveReviewByAuthor` | 0 |
| `dalReadVportReviewById` | 0 |

## Raw Tables Removed from Public Read Path

| Table | Was read by | Now |
|---|---|---|
| `reviews.reviews` | `dalListVportReviews`, `dalGetActiveReviewByAuthor`, `dalReadVportReviewById` | Not read on any public path |
| `reviews.review_dimension_ratings` | `dalListVportReviewRatingsByReviewIds` | Not read on any public path |

## Remaining Raw Reads in reviews schema (expected)

All remaining hits are in `vportReviews.write.dal.js` (INSERT/UPDATE — write path only,
not a public read path). No action required.

## Replacement (already in place before this deletion)

| Old DAL function | Replacement |
|---|---|
| `dalListVportReviews` | `@reviews` engine `listReviews()` via `VportReviews.controller.js` |
| `dalGetVportOfficialStats` | `@reviews` engine `getTargetStats()` |
| `dalGetVportReviewFormConfig` | `@reviews` engine `getReviewFormConfig()` |
| `dalGetActiveReviewByAuthor` | `@reviews` engine `getMyActiveReview()` |
| `dalListVportReviewRatingsByReviewIds` | Handled by engine internally |
| `dalReadVportReviewById` | Handled by engine internally |

Public screens additionally read via:
- `reviews.public_vport_reviews_v` → `readPublicVportReviews.dal.js`
- `reviews.public_vport_review_dimensions_v` → `readPublicVportReviewDimensions.dal.js`

## Build Result

```
✓ built in 4.93s
PWA v1.2.0 — 254 entries precached
No errors. No warnings related to this deletion.
```

## Files Changed

- DELETED: `apps/VCSM/src/features/profiles/kinds/vport/dal/review/vportReviews.read.dal.js`
- No other files modified.
- No DB changes.
- No UI changes.
