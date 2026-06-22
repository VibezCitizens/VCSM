# Security Posture — reviews

Last Updated: 2026-06-04
Highest Open Severity: HIGH
THOR Release Blocker: YES — VEN-REVIEWS-001, VEN-REVIEWS-002, BW-REVIEWS-001, BW-REVIEWS-002

---

## VENOM STATUS
VENOM Last Run: 2026-06-04
VENOM Status: COMPLETE

5 findings total: 0 CRITICAL, 2 HIGH, 2 MEDIUM, 1 LOW

| Finding ID | Severity | THOR Blocker | Description |
|---|---|---|---|
| VEN-REVIEWS-001 | HIGH | YES | dalInsertReview bypasses upsert_neutral_review SECURITY DEFINER RPC — orphaned direct insert path violates one-active-card constraint and snapshot integrity |
| VEN-REVIEWS-002 | HIGH | YES | BEHAVIOR.md is PLACEHOLDER — no §5 Security Rules or §9 Must Never Happen declared; governance blocker |
| VEN-REVIEWS-003 | MEDIUM | NO | dalDeleteDimensionRatingsForReview has no author_actor_id ownership guard — any authenticated caller with a reviewId can wipe its ratings |
| VEN-REVIEWS-004 | MEDIUM | NO | getMyActiveReview controller missing isActorOwner check — caller-supplied authorActorId not verified against session |
| VEN-REVIEWS-005 | LOW | NO | configureReviewsEngine has no re-entry guard — DI singleton can be overwritten after initial configuration |

Output: ZZnotforproduction/APPS/VCSM/features/reviews/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_reviews-security-review.md

---

## ELEKTRA STATUS
ELEKTRA Last Run: NEVER
ELEKTRA Status: NOT RUN

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-04
BLACKWIDOW Status: COMPLETE

8 findings total: 0 CRITICAL, 2 HIGH, 3 MEDIUM, 2 LOW, 1 INFO

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-REVIEWS-001 | HIGH | dalUpsertDimensionRatings has no author_actor_id ownership guard — RLS on review_dimension_ratings is the only barrier (unverified) | PARTIAL | OPEN |
| BW-REVIEWS-002 | HIGH | BEHAVIOR.md is PLACEHOLDER — §9 invariants are UNANCHORED; all Must Never Happen rules untestable | UNRESOLVED | OPEN |
| BW-REVIEWS-003 | MEDIUM | Notification linkPath embeds raw targetActorId UUID in `/actor/${targetActorId}/dashboard/reviews`; violates no-raw-IDs-in-URLs platform rule | PARTIAL | OPEN |
| BW-REVIEWS-004 | MEDIUM | dalGetReviewById has no is_deleted filter — returns soft-deleted reviews; latent risk for future callers | PARTIAL | OPEN |
| BW-REVIEWS-005 | MEDIUM | ctrlGetMyActiveReview missing isActorOwner call — read-only path but authorActorId not session-verified at engine level | PARTIAL | OPEN |
| BW-REVIEWS-006 | LOW | configureReviewsEngine has no re-entry guard — DI singleton can be overwritten post-initialization | PARTIAL | OPEN |
| BW-REVIEWS-007 | LOW | dalInsertReview is orphaned dead code with no ownership guard; bypasses upsert_neutral_review RPC if ever called | UNRESOLVED | OPEN |
| BW-REVIEWS-008 | INFO | dalDeleteDimensionRatingsForReview is orphaned exported function with no auth guard and no current caller | UNRESOLVED | OPEN |

Output: ZZnotforproduction/APPS/VCSM/features/reviews/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_reviews-adversarial-review.md
