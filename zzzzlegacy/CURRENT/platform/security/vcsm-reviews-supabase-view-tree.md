# VCSM Reviews — Supabase View Dependency Tree

Scope: VCSM + ENGINE (reviews)
Scan Date: 2026-05-24
ARCHITECT Version: 26.14

---

## View Tree: reviews.public_vport_reviews_v

```
reviews.public_vport_reviews_v
 → readPublicVportReviewsDAL
   → getVportPublicReviewsController / getVportPublicReviewsPageController
     → useVportPublicReviews (hook)
       → VportPublicReviewsPanel (component)
         → VportPublicReviewsView (view)
           → VportPublicReviewsBySlugScreen (screen)
             → /profile/:slug/reviews (public route)
             → /profile/:slug/reviews/qr (public QR route — VportPublicReviewsQrView)
```

Consumers: 1 (public/vportMenu feature)
Access: anon/public (unauthenticated)
Data exposed: review_id, target_actor_id, author_actor_id, verification_status,
              overall_rating, body, author_*_snapshot fields, timestamps
Risk: LOW — intentionally public. author_actor_id exposed (UUID, not sensitive).
      Confirm: view filters is_deleted=true records.

---

## View Tree: reviews.public_vport_review_summary_v

```
reviews.public_vport_review_summary_v
 → readPublicVportReviewSummaryDAL (TTL 60s cache)
   → useVportPublicReviews (hook)
     → VportPublicReviewsView (via summary shape)
       → /profile/:slug/reviews
   → getVportPublicReviewsController
     → VportPublicReviewsPanel
```

Consumers: 1 (public/vportMenu feature)
Access: anon/public
Data exposed: target_actor_id, review_count, average_rating, first_review_at, last_review_activity_at
Risk: NONE — aggregate stats only, no PII

---

## Table Direct Read: reviews.reviews (authenticated path)

```
reviews.reviews (direct table read — no view)
 → dalListReviewsByTarget (engine)
   → listReviews.controller (engine)
     → ctrlListReviews (app controller)
       → useVportReviewList (hook)
         → VportReviewsView (view)
           → VportDashboardReviewScreen (dashboard)
             → /actor/:actorId/dashboard/reviews
           → VportReviewsView.adapter (cross-feature)
           → VportReviewsTab (profile tab wrapper)
             → VportProfileViewScreen (public profile)

 → dalGetActiveReviewByAuthor (engine)
   → getMyActiveReview.controller (engine)
     → ctrlGetMyActiveReview (app controller)
       → useVportReviewMine (hook)
         → useVportReviews (hook)
           → VportReviewsView

 → dalGetReviewById (engine) [on submit, post-upsert]
   → submitReview.controller (engine)
     → ctrlSubmitReview (app controller)
       → useVportReviewMine
```

Consumers: 1 main path (profiles/vport + engine)
Access: authenticated (session-required Supabase client)
Risk: MEDIUM — RLS must scope reads correctly; see RLS assumption map

---

## Table Direct Read: reviews.review_dimension_ratings (authenticated path)

```
reviews.review_dimension_ratings
 → dalListDimensionRatingsByReviewIds (engine) [batch]
   → listReviews.controller (engine)
     → same chain as reviews.reviews above

 → dalListDimensionRatingsForReview (engine) [single]
   → getMyActiveReview.controller (engine)
     → same chain as reviews.reviews above

 → dalUpsertDimensionRatings (engine) [write]
   → submitReview.controller (engine)
```

Access: authenticated
Risk: MEDIUM — write upsert; RLS must scope to author's own review_ids only

---

## Table Direct Read: reviews.review_dimensions

```
reviews.review_dimensions
 → dalListActiveDimensions (engine)
   → getReviewFormConfig.controller (engine)
     → ctrlGetReviewFormConfig (app controller)
       → useVportReviews (hook)
         → form config loaded on mount

 → reviews_dimensions also read by: readPublicVportReviewDimensionsDAL (public path — separate DAL)
```

Consumers: 2 (engine path + public/vportMenu path — separate read logic)
Access: authenticated (engine) + anon (public DAL)
Risk: LOW — dimension config is not sensitive

---

## RPCs

```
reviews.get_review_author_card(p_review_id UUID)  — SECURITY DEFINER
 → dalGetAuthorCardsForReviews (engine) — called N+1 per review
   → listReviews.controller
     → authenticated dashboard path

reviews.get_target_overall_stats(p_target_actor_id UUID)
 → dalRpcGetTargetOverallStats (engine)
   → getTargetStats.controller
     → ctrlGetOfficialStats
       → useVportReviews on mount (dashboard + profile tab)

reviews.upsert_neutral_review(p_target_actor_id, p_author_actor_id, p_body)  — SECURITY DEFINER
 → dalRpcUpsertNeutralReview (engine)
   → submitReview.controller
     → ctrlSubmitReview
       → useVportReviewMine.submitReview
         → VportReviewsView (public mode only)
```

---

## View Fan-Out Matrix

| View/Table/RPC | Auth Path | Public Path | Owner Dashboard | Profile Tab | QR Route |
|---|---|---|---|---|---|
| reviews.reviews | ✓ | — | ✓ | ✓ | — |
| reviews.review_dimension_ratings | ✓ | — | ✓ | ✓ | — |
| reviews.review_dimensions | ✓ | ✓ | ✓ | ✓ | — |
| reviews.public_vport_reviews_v | — | ✓ | — | — | ✓ |
| reviews.public_vport_review_summary_v | — | ✓ | — | — | ✓ |
| get_review_author_card RPC | ✓ (N+1) | — | ✓ | ✓ | — |
| get_target_overall_stats RPC | ✓ | — | ✓ | ✓ | — |
| upsert_neutral_review RPC | ✓ | — | write only | write only | — |

---

## Dead Views (not consumed by any active path)

None detected in the reviews schema from static analysis.
LOKI runtime trace needed to confirm no orphaned views.

---

## Architecture Finding: Two Parallel Read Paths

The authenticated path and public path for review data are **architecturally separate**:

```
Authenticated (engine-backed):
  reviews.reviews (direct table) + N+1 RPC for author cards

Public (view-based):
  reviews.public_vport_reviews_v (snapshot-enriched view, author card data embedded)
```

The public view is actually **more efficient** than the auth path:
- Embeds snapshot data in the view row → no separate author enrichment calls
- Pre-aggregated summary in a separate view → no RPC needed

The authenticated path should be refactored toward the same efficiency:
- Batch author card RPC (CARNAGE)
- Or consider whether the auth path can read the public view too (VENOM/SENTRY decision)
