# VCSM Reviews — Database Read Map

Scope: VCSM + ENGINE (reviews)
Scan Date: 2026-05-24
ARCHITECT Version: 26.14

---

## READ PATH 1 — Authenticated Dashboard (VportDashboardReviewScreen)

Entry: /actor/:actorId/dashboard/reviews
Client: getSupabaseClient() [authenticated session, reviews engine]
       + vcClient [vc schema — app-level]
       + vportClient [vport schema — app-level]

---

### READ: Validate Target Actor

```
DAL: dalReadReviewTargetActor
File: apps/VCSM/src/features/profiles/kinds/vport/dal/review/reviewTarget.read.dal.js
Client: vcClient
Schema: vc
Table: vc.actors
Columns: id, kind, vport_id, is_void
Filter: id = targetActorId
Called By: ctrlAssertReviewTargetActor, ctrlGetReviewFormConfig, ctrlSubmitReview
Call Chain: useVportReviews → ctrlAssertReviewTargetActor → dalReadReviewTargetActor
Note: Called 2–3x in sequence (assert + form config + submit) — DUPLICATE
```

---

### READ: Vport Type Resolution

```
DAL: readVportTypeByActorId
File: apps/VCSM/src/features/profiles/kinds/vport/dal/services/readVportTypeByActorId.dal.js
Client: vportClient
Schema: vport
Table: vport.profiles
Columns: vport_type (at minimum)
Filter: actor_id = actorId
Called By: ctrlGetReviewFormConfig, ctrlSubmitReview (called twice on submit — DUPLICATE)
Call Chain: VportReviews.controller → readVportTypeByActorId
Note: Called twice per submit (once inside ctrlGetReviewFormConfig, once directly in ctrlSubmitReview)
```

---

### READ: Review Dimensions

```
DAL: dalListActiveDimensions
File: engines/reviews/src/dal/dimensions.read.dal.js
Client: getSupabaseClient() [reviews schema]
Schema: reviews
Table: reviews.review_dimensions
Columns: id, target_kind, target_subtype, key, label, weight, sort_order, is_active
Filter: target_kind=targetKind AND target_subtype=targetSubtype AND is_active=true
Order: sort_order ASC
Called By: getReviewFormConfig (engine controller)
Call Chain: useVportReviews → ctrlGetReviewFormConfig → engineGetReviewFormConfig → dalListActiveDimensions
Note: Also called AGAIN during ctrlSubmitReview to build dimensionKey→dimensionId map — DUPLICATE on submit
```

---

### READ: Aggregate Stats (RPC)

```
DAL: dalRpcGetTargetOverallStats
File: engines/reviews/src/dal/reviews.rpc.dal.js
Client: getSupabaseClient() [reviews schema]
Schema: reviews
RPC: reviews.get_target_overall_stats(p_target_actor_id)
Return Shape: { review_count, overall_avg, neutral_review_count, overall_p50, overall_p90 }
Called By: getTargetStats (engine controller)
Call Chain: useVportReviews → ctrlGetOfficialStats → getTargetStats → dalRpcGetTargetOverallStats
Cache: NONE on auth path (public path uses 60s TTL view)
```

---

### READ: Review List (paginated)

```
DAL: dalListReviewsByTarget
File: engines/reviews/src/dal/reviews.read.dal.js
Client: getSupabaseClient() [reviews schema]
Schema: reviews
Table: reviews.reviews
Columns: id, target_actor_id, author_actor_id, target_kind, target_subtype,
         review_mode, verification_status, transaction_ref, transaction_occurred_at,
         rating_scale, overall_rating, body, active_card,
         author_display_name_snapshot, author_username_snapshot, author_avatar_url_snapshot,
         target_display_name_snapshot, target_username_snapshot, target_avatar_url_snapshot,
         created_at, updated_at, review_activity_at, is_deleted, deleted_at
Filter: target_actor_id=X AND active_card=true AND is_deleted=false
Order: review_activity_at DESC
Limit: 25 (configurable)
Cursor: review_activity_at < cursor (for pagination)
Called By: listReviews (engine controller)
Call Chain: useVportReviewList → ctrlListReviews → engineListReviews → dalListReviewsByTarget
```

---

### READ: Dimension Ratings (batch for list)

```
DAL: dalListDimensionRatingsByReviewIds
File: engines/reviews/src/dal/dimensionRatings.read.dal.js
Client: getSupabaseClient() [reviews schema]
Schema: reviews
Table: reviews.review_dimension_ratings
Columns: review_id, dimension_id, rating, label_snapshot, weight_snapshot, created_at, updated_at
         + reviews.review_dimensions(key) [joined]
Filter: review_id IN (reviewIds[])
Called By: listReviews (engine controller) — batched, single query for all reviews
Call Chain: listReviews.controller → dalListDimensionRatingsByReviewIds
Note: GOOD — single batch query, not N+1
```

---

### READ: Author Cards (N+1 — CRITICAL)

```
DAL: dalGetAuthorCardsForReviews
File: engines/reviews/src/dal/authors.read.dal.js
Client: getSupabaseClient() [reviews schema]
Schema: reviews
RPC: reviews.get_review_author_card(p_review_id) — SECURITY DEFINER
Called: once per review_id (loop) = N+1
For 25 reviews: 25 separate RPC calls
Called By: listReviews (engine controller)
Call Chain: listReviews.controller → dalGetAuthorCardsForReviews → for(reviewId) → RPC
Return Shape per call: { actor_id, display_name, username, avatar_url }
N+1 RISK: CRITICAL — fix requires batch RPC get_review_author_cards(UUID[])
```

---

### READ: My Active Review

```
DAL: dalGetActiveReviewByAuthor
File: engines/reviews/src/dal/reviews.read.dal.js
Client: getSupabaseClient() [reviews schema]
Schema: reviews
Table: reviews.reviews
Filter: target_actor_id=X AND author_actor_id=Y AND review_mode='neutral'
        AND active_card=true AND is_deleted=false
Limit: 1
Called By: getMyActiveReview (engine controller)
Call Chain: useVportReviewMine → ctrlGetMyActiveReview → engineGetMyActiveReview → dalGetActiveReviewByAuthor
Note: Only fires when viewer is a citizen actor (canReview=true)
```

---

### READ: My Review Dimension Ratings

```
DAL: dalListDimensionRatingsForReview (delegates to dalListDimensionRatingsByReviewIds)
File: engines/reviews/src/dal/dimensionRatings.read.dal.js
Client: getSupabaseClient() [reviews schema]
Schema: reviews
Table: reviews.review_dimension_ratings
Filter: review_id = myReviewId
Called By: getMyActiveReview (engine controller)
Call Chain: getMyActiveReview.controller → dalListDimensionRatingsForReview
```

---

### READ: Services List (for service tab)

```
DAL: readVportServicesByActor
File: apps/VCSM/src/features/profiles/kinds/vport/dal/services/readVportServicesByActor.dal.js
Client: vportClient
Schema: vport
Table: vport.services
Columns: id, profile_id, key, label, description, service_group, sort_order, enabled, meta, created_at, updated_at
Filter: profile_id=X AND enabled=true (when includeDisabled=false)
Order: sort_order ASC, key ASC
Prerequisite: resolveVportProfileId(actorId) → SELECT profile_id FROM vc.actors
Called By: ctrlListReviewServices
Call Chain: useVportReviews → loadServices → ctrlListReviewServices → readVportServicesByActor
```

---

## READ PATH 2 — Public Route (VportPublicReviewsBySlugScreen)

Entry: /profile/:slug/reviews (unauthenticated)
Client: supabase (main client — may be anon key)
Schema: reviews (via public views)

---

### READ: Resolve Slug → actorId

```
DAL: resolveVportSlug (via useResolveVportSlug hook)
File: apps/VCSM/src/features/public/vportMenu/dal/resolveVportSlug.dal.js
Table: vport.profiles (slug → actor_id lookup)
Called By: VportPublicReviewsBySlugScreen
```

---

### READ: Public Review Summary (cached 60s TTL)

```
DAL: readPublicVportReviewSummaryDAL
File: apps/VCSM/src/features/public/vportMenu/dal/readPublicVportReviewSummary.dal.js
Client: supabase (main client)
Schema: reviews
View: reviews.public_vport_review_summary_v
Columns: target_actor_id, review_count, average_rating, first_review_at, last_review_activity_at
Filter: target_actor_id = actorId
Cache: createTTLCache(60_000) — key=actorId
Called By: useVportPublicReviews hook
```

---

### READ: Public Reviews List (paginated, unauthenticated)

```
DAL: readPublicVportReviewsDAL
File: apps/VCSM/src/features/public/vportMenu/dal/readPublicVportReviews.dal.js
Client: supabase (main client)
Schema: reviews
View: reviews.public_vport_reviews_v
Columns: review_id, target_actor_id, author_actor_id, verification_status, overall_rating,
         body, author_display_name_snapshot, author_username_snapshot,
         author_avatar_url_snapshot, review_activity_at, created_at
Filter: target_actor_id = actorId (+ cursor if paginating)
Order: review_activity_at DESC
Limit: 20 per page
Note: Uses snapshot columns — no separate author enrichment query needed (NO N+1)
      Public views pre-join snapshot data — architecturally cleaner than auth path
```

---

### READ: Public Review Dimensions

```
DAL: readPublicVportReviewDimensionsDAL
File: apps/VCSM/src/features/public/vportMenu/dal/readPublicVportReviewDimensions.dal.js
Client: supabase (main client)
Schema: reviews
Called By: getVportPublicReviewsController
```

---

## READ PATH 3 — VportPreviewModel (non-dashboard, low impact)

```
File: apps/VCSM/src/features/vport/public/vportPreviewModel.js
Usage: reads officialOverallAvg + verifiedReviewCount from a reviews object passed in
       (not a direct DB query — derived from already-loaded data)
Tables: none directly
Risk: NONE — pure transform
```

---

## DUPLICATE READ SUMMARY

| Read | Appears | Context | Risk |
|---|---|---|---|
| vc.actors (target actor) | 2–3x per mount | assert + form config + submit | MEDIUM — should memoize |
| vport.profiles (vport_type) | 2x per submit | form config + submit direct | MEDIUM — 2 extra reads |
| reviews.review_dimensions | 2x per submit | form config + keyToId build | MEDIUM — 2 extra reads |

**Fix:** Pass dims from `ctrlGetReviewFormConfig` result directly to `ctrlSubmitReview` to eliminate the second round of reads. Single-arg change to both functions.

---

## DB TABLE → DAL OWNERSHIP MAP

| Table/View/RPC | Schema | DAL Owner | Layer | Notes |
|---|---|---|---|---|
| vc.actors | vc | reviewTarget.read.dal | app-local | Target + author validation |
| vport.profiles | vport | readVportTypeByActorId.dal | app-local | Vport type resolution |
| vport.services | vport | readVportServicesByActor.dal | app-local | Service tab |
| reviews.reviews | reviews | reviews.read.dal (engine) | engine | All review reads |
| reviews.review_dimensions | reviews | dimensions.read.dal (engine) | engine | Form config |
| reviews.review_dimension_ratings | reviews | dimensionRatings.read.dal (engine) | engine | Ratings per review |
| reviews.public_vport_reviews_v | reviews | readPublicVportReviewsDAL | app — public feature | Public read path |
| reviews.public_vport_review_summary_v | reviews | readPublicVportReviewSummaryDAL | app — public feature | Cached 60s |
| reviews.get_review_author_card RPC | reviews | authors.read.dal (engine) | engine | N+1 per review |
| reviews.get_target_overall_stats RPC | reviews | reviews.rpc.dal (engine) | engine | Single call — clean |
| reviews.upsert_neutral_review RPC | reviews | reviews.rpc.dal (engine) | engine | SECURITY DEFINER write |
