# Runtime Feature Index: reviews

## Metadata
| Field | Value |
|---|---|
| Feature | reviews |
| CURRENT Folder | CURRENT/features/reviews |
| Source Folder | apps/VCSM/src/features/reviews |
| Generated | 2026-06-02 |
| Scope | VCSM |
| Evidence Mode | Source scan + CURRENT evidence |
| Security Tier | LOW |
| Feature Status | PLANNED |
| Engine | engines/reviews/ |

---

## Source Inventory

| Layer | Count | Key Files |
|---|---:|---|
| Controllers (feature) | 1 | setup.js (engine DI bootstrap only) |
| Controllers (profile integration) | 3 | VportReviews.controller.js, VportServiceReviews.controller.js, vportReviews.mappers.js |
| Controllers (public read) | 2 | getVportPublicReviews.controller.js (initial load + pagination) |
| Engine Controllers | 6 | submitReview.controller.js, deleteReview.controller.js, listReviews.controller.js, getMyActiveReview.controller.js, getReviewStats.controller.js, getReviewFormConfig.controller.js |
| DALs (feature) | 0 | None at features/reviews/ |
| DALs (profile integration) | 1 | reviewTarget.read.dal.js |
| DALs (public read) | 3 | readPublicVportReviews.dal.js, readPublicVportReviewSummary.dal.js, readPublicVportReviewDimensions.dal.js |
| Engine DALs | 6 | reviews.read.dal.js, reviews.write.dal.js, reviews.rpc.dal.js, dimensions.read.dal.js, dimensionRatings.read.dal.js, dimensionRatings.write.dal.js |
| Hooks | 5 | useVportReviews.js, useVportReviewList.js, useVportReviewMine.js, useVportReviewCompose.js, useVportPublicReviews.js |
| Models (engine) | 6 | Review.model.js, AuthorCard.model.js, Dimension.model.js, DimensionRating.model.js, TargetStats.model.js, ReviewRevision.model.js |
| Models (app) | 1 | vportPublicReviews.model.js |
| Screens | 4 | VportReviewsView.jsx (x2, dual path — risk), VportPublicReviewsBySlugScreen.jsx, VportPublicReviewsQrBySlugScreen.jsx |
| Components | 9 | ReviewsList.jsx, VportReviewComposeForm.jsx, VportReviewDeleteModal.jsx, VportReviewStars.jsx, VportReviewsControls.jsx, VportPublicReviewCard.jsx, VportPublicReviewDimensions.jsx, VportPublicReviewEmptyState.jsx, VportPublicReviewSummary.jsx, VportPublicReviewsPanel.jsx |
| Adapters | 1 | VportReviewsView.adapter.js |
| Routes | 2 | Public review routes (vportMenu); profile review tab |
| Tests | 0 | No test files found |

---

## Route / Screen Map

| Route / Screen | Source Path | Public/Auth/Owner | Notes |
|---|---|---|---|
| Profile review tab | apps/VCSM/src/features/profiles/kinds/vport/screens/review/VportReviewsView.jsx | Auth (citizen) + Public read | Dual-path risk: second copy at .../screens/views/tabs/ |
| Profile review tab (views/tabs) | apps/VCSM/src/features/profiles/kinds/vport/screens/views/tabs/VportReviewsView.jsx | Auth (citizen) + Public read | Possible legacy or active — needs deduplication |
| Dashboard reviews card | apps/VCSM/src/features/dashboard/vport/dashboard/cards/reviews/VportDashboardReviewScreen.jsx | Owner | Dashboard vport card |
| Public reviews by slug | apps/VCSM/src/features/public/vportMenu/screen/VportPublicReviewsBySlugScreen.jsx | Public (no auth) | QR and direct link |
| Public reviews QR by slug | apps/VCSM/src/features/public/vportMenu/screen/VportPublicReviewsQrBySlugScreen.jsx | Public (no auth) | QR entry point |

---

## Mutation Surface Map

| Surface | Source Path | Write Type | Ownership Gate Known | Risk |
|---|---|---|---|---|
| submitReview (engine) | engines/reviews/src/controller/submitReview.controller.js | INSERT/UPSERT via RPC | YES — isActorOwner DI + kind='user' + SECURITY DEFINER | HIGH — primary write surface; DB-enforced |
| deleteReview (engine) | engines/reviews/src/controller/deleteReview.controller.js | Soft DELETE (UPDATE is_deleted) | YES — isActorOwner + author_actor_id row match | MEDIUM — soft delete; idempotent |
| dalInsertReview | engines/reviews/src/dal/reviews.write.dal.js | Direct INSERT | PARTIAL — no explicit auth check in DAL; relies on controller layer | MEDIUM — direct insert bypasses RPC; should only be called by controller |
| dalUpdateReviewBody | engines/reviews/src/dal/reviews.write.dal.js | UPDATE (body, review_activity_at) | PARTIAL — authorActorId filter in .eq(); no isActorOwner check in DAL | LOW — DB RLS relies on author_actor_id filter |
| dalSoftDeleteReview | engines/reviews/src/dal/reviews.write.dal.js | UPDATE (is_deleted, deleted_at) | PARTIAL — authorActorId filter in .eq(); no isActorOwner check in DAL | MEDIUM — DB RLS enforces author scope |
| dalUpsertDimensionRatings | engines/reviews/src/dal/dimensionRatings.write.dal.js | UPSERT on conflict | PARTIAL — called after submitReview controller passes isActorOwner; no gate in DAL itself | LOW |
| dalDeleteDimensionRatingsForReview | engines/reviews/src/dal/dimensionRatings.write.dal.js | DELETE all for reviewId | NONE in DAL — reviewId only | MEDIUM — callers must verify ownership |

---

## Security-Sensitive Surface Map

| Surface | Source Path | Sensitivity | Evidence |
|---|---|---|---|
| isActorOwner DI function | apps/VCSM/src/features/reviews/setup.js | HIGH | Checks vc.actor_owners (corrected from vc.actors per REV-V-001); session-based pre-guard; DB SECURITY DEFINER is real gate |
| ctrlSubmitReview citizen-only guard | apps/.../vport/controller/review/VportReviews.controller.js | HIGH | kind='user' check prevents vport actors from submitting reviews; must not be bypassed |
| reviews.upsert_neutral_review() RPC | engines/reviews/src/dal/reviews.rpc.dal.js | HIGH | SECURITY DEFINER function; authoritative server-side enforcement |
| Public review view | apps/.../vportMenu/dal/readPublicVportReviews.dal.js | LOW | Reads reviews.public_vport_reviews_v — DB view controls visibility; no auth required |
| Author snapshot columns | engines/reviews/src/dal/reviews.read.dal.js | LOW | author_display_name_snapshot, author_username_snapshot, author_avatar_url_snapshot written at review creation by RPC; not updatable by client |
