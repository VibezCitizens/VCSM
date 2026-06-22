# Vport Review Pipeline — End-to-End Audit

Updated: 2026-04-18
Codebase: `/Users/vcsm/Desktop/VCSM/apps/VCSM`
Target: profile / vport / tabs / review

---

## 1. Review Pipeline Overview

The review system allows authenticated citizen (user-kind) actors to rate and review vport profiles. Reviews are dimension-based (e.g. service, quality, value) with vport-type-specific dimension sets. Each author gets one active review per target vport (idempotent upsert). Reviews are soft-deletable, verified by default, and displayed with author profile cards.

Architecture follows: **DAL -> Model -> Controller -> Hook -> Screen**

### Engine Status (2026-04-09)

A shared reviews engine has been extracted to `engines/reviews/` (29 files) backed by a new `reviews.*` schema. The engine mirrors the app-local architecture but is app-agnostic with DI. VCSM app has **not yet migrated** to consume the engine — it still uses the legacy app-local code over `vc.*` tables documented below.

---

## 2. Entry Points

| File | Role |
| --- | --- |
| `/apps/VCSM/src/features/profiles/config/profileTabs.config.js` | Registers `REVIEWS` tab in all vport tab layouts |
| `/apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx` | Routes `tab === "reviews"` to `<VportReviewsView>` (line ~370) |
| `/apps/VCSM/src/features/profiles/kinds/vport/screens/views/tabs/VportReviewsView.jsx` | Wrapper tab component, passes `profile` + `viewerActorId` |
| `/apps/VCSM/src/features/profiles/kinds/vport/screens/review/VportReviewsView.jsx` | Main review screen (form + list + owner analytics) |

The tab is included in all vport layouts: `VPORT_TABS`, `VPORT_SERVICE_TABS`, `VPORT_BARBER_TABS`, `VPORT_FOOD_TABS`, `VPORT_GAS_TABS`, `VPORT_RATES_TABS`.

---

## 3. Read Pipeline

### Official stats + form config (on mount)

```
VportReviewsView
  -> useVportReviews.loadCore()
    -> Promise.all([
         ctrlGetReviewFormConfig(targetActorId)
           -> dalGetVportReviewFormConfig(targetActorId)
             -> RPC: vc.get_vport_review_form_config(p_target_actor_id)
               -> JOIN vc.actors -> vc.vports (resolve vport_type)
               -> SELECT vc.vport_review_dimensions WHERE vport_type AND is_active=true
               -> ORDER BY sort_order ASC, dimension_key ASC
           -> modelReviewDimensionRow() per row
           -> fallback to reviewDimensions.config.js if DB returns empty,

         ctrlGetOfficialStats(targetActorId)
           -> dalGetVportOfficialStats(targetActorId)
             -> RPC: vc.get_vport_official_stats(p_target_actor_id)
               -> SELECT COUNT, AVG, PERCENTILE_CONT(0.50), PERCENTILE_CONT(0.90)
               -> FROM vc.vport_reviews WHERE target, not deleted, verified, overall_rating NOT NULL
           -> modelOfficialStatsRow()
       ])
```

### Review list (on mount + tab change)

```
VportReviewsView
  -> useVportReviews.loadActiveList()
    -> ctrlListReviews(targetActorId, limit=25)
      -> dalListVportReviews(targetActorId, 25)
        -> SELECT 14 columns FROM vc.vport_reviews
        -> WHERE target_actor_id = ?, is_deleted = false
        -> ORDER BY created_at DESC, LIMIT 25
      -> dalListVportReviewRatingsByReviewIds(reviewIds)
        -> SELECT 6 columns FROM vc.vport_review_ratings
        -> WHERE review_id IN (...)
      -> modelReviewsWithRatings(reviewRows, ratingRows)
        -> Joins reviews + ratings by review_id
      -> dalListActorCardsByActorIds(authorActorIds)
        -> SELECT vc.actors (id, kind, profile_id, vport_id)
        -> SELECT public.profiles (display_name, username, photo_url) for user actors
        -> SELECT vc.vports (name, slug, avatar_url) for vport actors
      -> Enrich reviews with author cards
    -> If dimension tab: filter to reviews with that dimension rated
    -> If service tab: ctrlListReviewsForService (filters by serviceId)
```

### My active review (on mount)

```
VportReviewsView
  -> useVportReviews.loadMyReview()
    -> ctrlGetMyActiveReview(targetActorId, viewerActorId)
      -> dalGetActiveReviewByAuthor(targetActorId, authorActorId)
        -> SELECT FROM vc.vport_reviews
        -> WHERE target_actor_id, author_actor_id, is_deleted=false
        -> LIMIT 1
      -> dalListVportReviewRatingsByReviewIds([reviewId])
      -> modelReviewsWithRatings()
```

---

## 4. Write Pipeline

### Submit review

The screen (`VportReviewsView.jsx`) owns the multi-dimension compose form and calls `ctrlSubmitReview` directly. It does NOT use `useVportReviews.submit()` (the hook's submit is a simpler single-dimension path retained for other callers).

```
VportReviewsView (handleSubmit — multi-dimension form)
  -> Build optimisticReview { id: "optimistic-{uuid}", isOptimistic: true, ... }
  -> r.setActiveList(prev => [optimisticReview, ...prev])   // immediate display
  -> ctrlSubmitReview({
       targetActorId, authorActorId, body, ratings: [{dimensionKey, rating}]
     })
    -> Validation:
       - targetActorId !== authorActorId (no self-review)
       - ctrlAssertReviewTargetActor(targetActorId)
         -> dalReadReviewTargetActor(targetActorId)
           -> SELECT vc.actors WHERE id, kind='vport', is_void=false
       - Resolve vport_type from target actor
       - ctrlGetReviewFormConfig(targetActorId) -> dimension config
       - Validate: at least 1 rating, each 1-5, dimension keys match config
    -> Idempotent upsert:
       - dalGetActiveReviewByAuthor(target, author)
       - IF no existing review:
         -> dalInsertVportReviewRow({ targetActorId, authorActorId, vportType, body })
           -> INSERT INTO vc.vport_reviews RETURNING *
       - IF existing review:
         -> dalUpdateVportReviewBody(reviewId, body, vportType)
           -> UPDATE vc.vport_reviews SET body, updated_at, vport_type
    -> dalUpsertVportReviewRatings(reviewId, ratings, vportType)
      -> UPSERT INTO vc.vport_review_ratings
      -> ON CONFLICT (review_id, dimension_key) DO UPDATE SET rating, updated_at
    -> Read back fresh:
      -> dalReadVportReviewById(reviewId)
      -> dalListVportReviewRatingsByReviewIds([reviewId])
      -> modelReviewsWithRatings()
      -> dalListActorCardsByActorIds([authorActorId])
    -> Return enriched review (saved)
  -> On success:
     - r.setActiveList: replace optimisticId with saved (reconciliation)
     - r.setMyReview(saved)       // hook state updated directly (no reload)
     - r.setMyExists(true)        // switches form to "Edit my review" banner
     - r.reloadStats()            // reload stats only (non-blocking, no list reload)
     - Reset form (body, ratingsMap)
  -> On error:
     - r.setActiveList: filter out optimisticId (rollback)
     - Show submitErr in form
```

**Critical invariant:** After submit, `r.reload()` (which maps to `loadActiveList`) is NOT called. Calling it would set `loadingActiveList = true`, causing `ReviewsList` to show skeletons and hide the newly visible optimistic/real card. Stats are refreshed separately via `r.reloadStats()` which only calls `loadCore` (no list state change).

**Hook additions (2026-04-18):**
- `setMyReview` — exposed from hook so screen can update myReview without a DB round-trip
- `setMyExists` — exposed from hook so form switches to "Edit my review" state immediately
- `reloadStats` — maps to `loadCore` (fetches stats only, no list state change)

### Delete review (soft)

```
ctrlDeleteMyReview(reviewId, requesterActorId)
  -> dalReadVportReviewById(reviewId)
  -> Validate: review.author_actor_id === requesterActorId
  -> dalSoftDeleteVportReview(reviewId)
    -> UPDATE vc.vport_reviews SET is_deleted=true, deleted_at=now()
```

---

## 5. Tables Involved

| Table | Schema | Read/Write | Purpose | Key Columns |
| --- | --- | --- | --- | --- |
| `vport_reviews` | vc | R/W | Core review records | id, target_actor_id, author_actor_id, vport_type, overall_rating, body, is_verified, is_deleted |
| `vport_review_ratings` | vc | R/W | Per-dimension ratings | review_id, dimension_key, rating, vport_type |
| `vport_review_dimensions` | vc | R | Dimension config per vport type | vport_type, dimension_key, label, weight, sort_order, is_active |
| `actors` | vc | R | Target validation + author enrichment | id, kind, profile_id, vport_id, is_void |
| `vports` | vc | R | Resolve vport_type + author avatar | id, name, slug, avatar_url, vport_type |
| `profiles` | public | R | Author display info | id, display_name, username, photo_url |

### Relationships

```
vport_reviews.target_actor_id -> actors.id
vport_reviews.author_actor_id -> actors.id
vport_review_ratings.review_id -> vport_reviews.id
vport_review_ratings.(vport_type, dimension_key) -> vport_review_dimensions.(vport_type, dimension_key)
actors.profile_id -> profiles.id
actors.vport_id -> vports.id
```

---

## 6. Query Map

### Read Queries

| Query | Table | Filters | Order |
| --- | --- | --- | --- |
| `dalListVportReviews` | `vc.vport_reviews` | target_actor_id, is_deleted=false | created_at DESC |
| `dalListVportReviewRatingsByReviewIds` | `vc.vport_review_ratings` | review_id IN (...) | none |
| `dalGetActiveReviewByAuthor` | `vc.vport_reviews` | target_actor_id, author_actor_id, is_deleted=false | LIMIT 1 |
| `dalReadVportReviewById` | `vc.vport_reviews` | id | maybeSingle |
| `dalReadReviewTargetActor` | `vc.actors` | id | maybeSingle |
| `dalListActorCardsByActorIds` | `vc.actors` + `public.profiles` + `vc.vports` | id IN (...) | none |

### RPC Queries

| RPC | Purpose | Tables Hit |
| --- | --- | --- |
| `vc.get_vport_review_form_config` | Active dimensions for vport type | actors, vports, vport_review_dimensions |
| `vc.get_vport_official_stats` | Verified review count + avg + percentiles | vport_reviews |

### Write Queries

| Query | Table | Operation |
| --- | --- | --- |
| `dalInsertVportReviewRow` | `vc.vport_reviews` | INSERT |
| `dalUpdateVportReviewBody` | `vc.vport_reviews` | UPDATE (body, updated_at, vport_type) |
| `dalUpsertVportReviewRatings` | `vc.vport_review_ratings` | UPSERT (ON CONFLICT review_id, dimension_key) |
| `dalSoftDeleteVportReview` | `vc.vport_reviews` | UPDATE (is_deleted=true, deleted_at) |

---

## 7. Identity and Authorization

### Who can submit reviews?

- Must be authenticated
- `identity.kind === "user"` check in hook (line in useVportReviews: only composes if viewer is user actor)
- Cannot review self (`targetActorId !== authorActorId`)
- Target must be active vport (not void)
- RLS enforces: author_actor_id must be user actor owned by auth.uid()

### Who can view reviews?

- All authenticated users (RLS: SELECT WHERE is_deleted=false for authenticated role)
- No anonymous access

### Who can delete?

- Only the review author (RLS + controller check: `review.authorActorId === requesterActorId`)
- Soft delete only

### Identity fields used

| Field | Source | Used For |
| --- | --- | --- |
| `identity.actorId` | useIdentity() | viewerActorId — used as authorActorId on submit |
| `identity.kind` | useIdentity() | Gate review composition (only `"user"` can compose) |

### RLS Policy Summary

| Table | INSERT | SELECT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| vport_reviews | author != target, author is user owned by uid, target is active vport | is_deleted=false | author owned by uid | author owned by uid, not void |
| vport_review_ratings | author owns review, both not void, not deleted | review not deleted | same as insert | same as insert |
| vport_review_dimensions | N/A (read only) | is_active=true | N/A | N/A |

---

## 8. UI Behavior

### Viewer mode (citizen visiting a vport profile)

- **Overall rating display**: star visualization + numeric average + review count
- **Review composition form** (only if `identity.kind === "user"`):
  - Dimension selector dropdown (populated from config)
  - 5-star input buttons per dimension
  - Progress indicator ("3 of 5 rated")
  - Optional text body (textarea, max 24 rows)
  - Submit button with loading state
- **Review list**: cards with author avatar, name, @username, verified badge, star chip, timestamp, body text
- **Empty state**: "No reviews yet."
- **Loading state**: skeleton-style loading

### Owner mode (vport owner viewing their own reviews tab)

- Tab switcher: Overall / Services / Individual Dimensions
- Overall tab: aggregated stats computed client-side from all reviews
- Services tab: service picker dropdown, reviews filtered by service
- Dimension tab: reviews filtered to those with that dimension rated
- No review composition form (owners view analytics, not submit)

### Review card anatomy

```
[Avatar] [Display Name] [@username]  [Verified badge]
[Star chip: 4.5]  [Timestamp: Mon Jan 15 2025, 3:45 PM]
[Body text or "No written details provided."]
```

---

## 9. Business Logic

### Dimension system

- Each vport type has 5 rated dimensions with labels and weights
- Weights sum to ~1.0 per type (used for weighted average)
- 12 vport type groups with unique dimension sets
- Fallback: if DB returns no dimensions, uses hardcoded config per vport type
- Dimensions stored in `vc.vport_review_dimensions` table

### Overall score computation

- `overall_rating` column on `vc.vport_reviews` — computed by database trigger (not in app code)
- Official stats via RPC: `AVG(overall_rating)` across verified, non-deleted reviews
- Also computes P50 and P90 percentiles

### Client-side dimension aggregation

- `computeDimStatsFromReviews(reviews)` aggregates avg + count per dimension across all reviews
- Used in owner analytics tabs

### Idempotency

- One active review per (target_actor_id, author_actor_id) enforced by UNIQUE constraint WHERE is_deleted=false
- Resubmitting updates existing review body + ratings (upsert pattern)

### Duplicate prevention

- DB constraint: `UNIQUE(target_actor_id, author_actor_id) WHERE is_deleted=false`
- Controller checks for existing active review before insert

### Edit support

- Implicit via idempotent submit — resubmitting updates the existing review
- No explicit "edit" UI button; form pre-fills from `myReview` if it exists

### Delete support

- Soft delete only (`is_deleted=true, deleted_at=now()`)
- Only author can delete
- After soft delete, author can create a new review (unique constraint only applies to non-deleted)

### Verification

- All reviews created with `is_verified=true` by default
- Official stats filter on `is_verified=true`
- No manual verification workflow exists yet — field suggests future moderation

---

## 10. File Map

| # | Path | Layer | Role |
| --- | --- | --- | --- |
| 1 | `features/profiles/kinds/vport/screens/review/VportReviewsView.jsx` | Screen | Main review tab screen (form + list + owner analytics) |
| 2 | `features/profiles/kinds/vport/screens/review/components/ReviewsList.jsx` | Component | Review card list display |
| 3 | `features/profiles/kinds/vport/screens/review/components/VportReviewsControls.jsx` | Component | Star rating buttons + tab buttons |
| 4 | `features/profiles/kinds/vport/screens/review/components/ServicesPicker.jsx` | Component | Service selector dropdown |
| 5 | `features/profiles/kinds/vport/screens/views/tabs/VportReviewsView.jsx` | Component | Tab wrapper (passes props) |
| 6 | `features/profiles/kinds/vport/hooks/review/useVportReviews.js` | Hook | Main review hook (state + actions) |
| 7 | `features/profiles/kinds/vport/hooks/review/useVportReviews.helpers.js` | Utility | Normalization + client-side aggregation |
| 8 | `features/profiles/kinds/vport/controller/review/VportReviews.controller.js` | Controller | Review CRUD + validation + enrichment |
| 9 | `features/profiles/kinds/vport/controller/review/VportServiceReviews.controller.js` | Controller | Service-filtered review queries |
| 10 | `features/profiles/kinds/vport/dal/review/vportReviews.read.dal.js` | DAL | Read queries (reviews + ratings + RPCs) |
| 11 | `features/profiles/kinds/vport/dal/review/vportReviews.write.dal.js` | DAL | Write queries (insert + update + upsert + soft delete) |
| 12 | `features/profiles/kinds/vport/dal/review/reviewTarget.read.dal.js` | DAL | Target actor validation |
| 13 | `features/profiles/kinds/vport/dal/review/vportReviewAuthors.read.dal.js` | DAL | Author card enrichment |
| 14 | `features/profiles/kinds/vport/model/review/VportReview.model.js` | Model | Row -> domain object mapping |
| 15 | `features/profiles/kinds/vport/config/reviewDimensions.config.js` | Config | Hardcoded dimension definitions per vport type |
| 16 | `features/profiles/config/profileTabs.config.js` | Config | Tab registration |

---

## 11. Risks and Gaps

### Authorization gaps

- **No vport-kind block in controller**: The `identity.kind === "user"` check exists only in the hook UI layer. The controller does not explicitly reject vport actors from submitting. RLS enforces it at DB level, but the controller should have an explicit guard for defense in depth.
- **No rate limiting**: No protection against rapid repeated submissions (though idempotent upsert limits damage).

### Data consistency

- **overall_rating trigger dependency**: The `overall_rating` column is computed by a DB trigger. If the trigger fails or is removed, the column becomes stale. The trigger logic is not visible in app code.
- **Dimension config drift**: Hardcoded dimension config in `reviewDimensions.config.js` can drift from `vc.vport_review_dimensions` table. Fallback to config file only fires when DB returns empty.

### Missing features

- **Edit UI**: Present — "Edit my review" button appears after a review is submitted. Pre-fills form from `myReview.ratings`. Resubmit updates existing review (idempotent upsert).
- **Delete UI**: Present — "Delete" button on user's own review card triggers a confirm modal. Soft-deletes via `ctrlDeleteMyReview`.
- **No moderation workflow**: `is_verified` is always true. No admin/moderation flow to flag or unverify reviews.
- **Pagination**: `loadMore()` is implemented with cursor-based pagination (`nextCursor`). `hasMore` flag drives "Load more" button in `ReviewsList`.

### Performance

- **N+1-style author enrichment**: Reviews are fetched, then author IDs are collected, then a separate query fetches author cards. This is 3 sequential queries (reviews, ratings, authors) instead of a join.
- **Client-side dimension aggregation**: `computeDimStatsFromReviews` recomputes averages on every render. For large review sets, this could be slow.

### Naming inconsistency

- Config file uses `overall_experience` as a dimension key; DB may use different keys depending on vport type.
- `vportType` is stored redundantly on both `vport_reviews` and `vport_review_ratings`.

### Dead code risk

- `ServicesPicker.jsx` appears minimal and may not be fully wired into the service filtering flow.

---

## 12. Final Verdict

### Current architecture summary

The review pipeline follows the correct VCSM architecture pattern (DAL -> Model -> Controller -> Hook -> Screen). Code is well-organized with clear separation of concerns. The idempotent upsert pattern is solid. Dimension system is flexible and extensible per vport type.

### Pipeline health: GOOD

- Clean data flow from UI through all layers
- Proper validation in controller
- RLS enforcement at database level
- Soft delete pattern with proper filtering

### Schema health: GOOD

- Proper constraints (UNIQUE, CHECK, FK)
- Correct indexes for common query patterns
- RLS policies are thorough

### Authorization health: ADEQUATE

- RLS enforces citizen-only at DB level
- Hook gates UI for user-kind actors
- **Gap**: Controller lacks explicit actor-kind validation (relies on RLS)

### Maintainability health: GOOD

- Files are small and focused
- Config-driven dimension system
- Model layer cleanly separates DB shape from domain shape

### Top 10 review-related files

1. `hooks/review/useVportReviews.js` — orchestrates everything
2. `controller/review/VportReviews.controller.js` — business logic core
3. `screens/review/VportReviewsView.jsx` — main UI
4. `dal/review/vportReviews.read.dal.js` — all read queries
5. `dal/review/vportReviews.write.dal.js` — all write queries
6. `model/review/VportReview.model.js` — data transformations
7. `config/reviewDimensions.config.js` — dimension definitions
8. `screens/review/components/ReviewsList.jsx` — review card display
9. `dal/review/vportReviewAuthors.read.dal.js` — author enrichment
10. `hooks/review/useVportReviews.helpers.js` — aggregation utilities

### Recommended next fixes

1. Add explicit `identity.kind === "user"` guard in `ctrlSubmitReview` (defense in depth)
2. Add cursor-based pagination to `dalListVportReviews`
3. Add "Edit my review" and "Delete my review" buttons to the UI
4. Add a moderation workflow for `is_verified` flag

---

## 2026-04-19 — Public Menu Reviews Surface + Notification Routing Fix

### Public Reviews Panel (Anon-Safe Read Layer)

A second, fully anonymous reviews surface was built under `features/public/vportMenu/` — separate from the authenticated owner/citizen review screens. This surface uses three new SQL views in the `reviews` schema, backed by permissive anon SELECT policies.

**New SQL Views:**
- `reviews.public_vport_reviews_v` — active non-deleted reviews with author card snapshot and ratings array, ordered by `review_activity_at DESC`
- `reviews.public_vport_review_summary_v` — aggregate per `target_actor_id`: `review_count`, `overall_avg`, `overall_p50`, `overall_p90`, `first_review_at`, `last_review_activity_at`
- `reviews.public_vport_review_dimensions_v` — active dimensions for a vport type ordered by `sort_order`

All three views grant SELECT to `anon` and `authenticated`. Backing tables (`reviews.reviews`, `reviews.review_ratings`, `reviews.review_dimensions`) each have permissive anon SELECT RLS policies added.

**New Files (all under `features/public/vportMenu/`):**

| File | Role |
|---|---|
| `dal/readPublicVportReviewSummary.dal.js` | Queries summary view; 60s TTL cache; returns null when 0 reviews |
| `dal/readPublicVportReviews.dal.js` | Paginated by `review_activity_at` cursor; no cache |
| `dal/readPublicVportReviewDimensions.dal.js` | Ordered by `sort_order`; 60s TTL cache |
| `model/vportPublicReviews.model.js` | `normalizePublicReviewSummary`, `normalizePublicReviewCards`, `normalizePublicReviewDimensions` |
| `controller/getVportPublicReviews.controller.js` | Parallel mount load; separate page controller for pagination |
| `hooks/useVportPublicReviews.js` | Exposes `{ summary, reviews, dimensions, hasMore, loading, loadingMore, error, loadMore }` |
| `components/VportPublicReviewSummary.jsx` | Large avg rating + star display + count label |
| `components/VportPublicReviewDimensions.jsx` | Progress bar per dimension; hidden when empty |
| `components/VportPublicReviewCard.jsx` | Author avatar / name / stars / body / verified badge / time-ago |
| `components/VportPublicReviewEmptyState.jsx` | "Be the first to review" + write CTA |
| `components/VportPublicReviewsPanel.jsx` | Composes all; auth-gates write CTA via `supabase.auth.getSession()` |

**Integration in Public Menu View:**
- `VportPublicMenuView` now has a Menu / Reviews tab bar
- `useVportPublicReviews({ actorId })` runs at view level — single hook instance shared by both the tab panel and the compact header summary
- Compact header summary: rating number + amber stars + count in parens, visible on both tabs. Shows "No reviews yet" when `reviewCount === 0`

### Notification Routing Fix

`VportReviews.controller.js` — `publishVcsmNotification` was sending `linkPath: /profile/${targetActorId}?tab=reviews`, which routed users to the public profile page. Changed to `/actor/${targetActorId}/dashboard/reviews` so clicking a review notification takes the VPORT owner directly to their dashboard reviews screen.
5. Document the `overall_rating` trigger logic in the codebase
