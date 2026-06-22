# VCSM Reviews Dashboard — Event Flow Map

Scope: VCSM + ENGINE (reviews)
Scan Date: 2026-05-24
ARCHITECT Version: 26.14 / 28.x

---

## Event Flow 1 — Page Mount (Load Reviews)

```
User navigates to /actor/:actorId/dashboard/reviews
 → VportDashboardReviewScreen (Final Screen)
   → useParams() → targetActorId
   → useIdentity() → viewerActorId
   → useVportOwnership(viewerActorId, targetActorId) → isOwner
   → renders VportReviewsView (mode="owner")

VportReviewsView mounts
 → useVportReviews(targetActorId) hook mounts

useVportReviews on mount (parallel):
 → useEffect[loadCore] fires:
   → ctrlAssertReviewTargetActor(targetActorId)
     → dalReadReviewTargetActor(targetActorId)
       → SELECT id,kind,vport_id,is_void FROM vc.actors WHERE id=targetActorId
       → validates: is active vport actor
   → ctrlGetReviewFormConfig(targetActorId)
     → dalReadReviewTargetActor(targetActorId)          [DUPLICATE READ — also called in assert above]
       → SELECT id,kind,vport_id,is_void FROM vc.actors
     → readVportTypeByActorId({actorId})
       → vport.profiles query → vport_type field
     → engineGetReviewFormConfig({targetKind:'vport', targetSubtype})
       → reviews.review_dimensions SELECT
     → returns mapped dimensions
   → ctrlGetOfficialStats(targetActorId)
     → getTargetStats({targetActorId}) [engine]
       → dalRpcGetTargetOverallStats({targetActorId})
         → reviews.get_target_overall_stats(p_target_actor_id) RPC
     → maps → { overallAverage, totalReviews, ... }

 → useEffect[loadActiveList] fires (useVportReviewList):
   → ctrlListReviews(targetActorId, { limit: 25 })
     → engineListReviews({targetActorId, cursor:null, limit:25}) [engine]
       → dalListReviewsByTarget({targetActorId, limit:25})
         → SELECT [REVIEW_COLUMNS] FROM reviews.reviews
           WHERE target_actor_id=X AND active_card=true AND is_deleted=false
           ORDER BY review_activity_at DESC LIMIT 25
       → [parallel]
         → dalListDimensionRatingsByReviewIds({reviewIds})
           → SELECT from reviews.review_dimension_ratings WHERE review_id IN (...)
         → dalGetAuthorCardsForReviews({reviewIds})
           → for each reviewId: RPC get_review_author_card(p_review_id)  ← N+1 (25x)
     → maps each row through mapReview()
   → setActiveList(reviews)

 → useEffect[loadServices] fires (useVportReviewList):
   → ctrlListReviewServices(targetActorId) [VportServiceReviews.controller]
     → readVportServicesByActor({actorId, includeDisabled:false})
       → resolveVportProfileId(actorId)
         → SELECT profile_id FROM vc.actors
       → SELECT [SERVICES_SELECT] FROM vport.services WHERE profile_id=X AND enabled=true
     → normalizes → [{id, name}]

 → useEffect[loadMyReview] fires (useVportReviewMine) [if viewer is citizen]:
   → ctrlGetMyActiveReview(targetActorId, authorActorId)
     → engineGetMyActiveReview({targetActorId, authorActorId}) [engine]
       → dalGetActiveReviewByAuthor({targetActorId, authorActorId})
         → SELECT from reviews.reviews WHERE author_actor_id=X AND target_actor_id=Y
           AND active_card=true AND is_deleted=false LIMIT 1
       → dalListDimensionRatingsForReview({reviewId})
         → SELECT from reviews.review_dimension_ratings WHERE review_id=X
     → mapReview(result.review)
   → setMyReview(mine) / setMyExists(true/false)
```

**DB Read count on mount (owner, 1 page of 25 reviews):**

| Read | Table/RPC | Count |
|---|---|---|
| Assert target actor | vc.actors | 1 |
| Form config — actor | vc.actors | 1 (DUPLICATE — same as assert) |
| Form config — vport type | vport.profiles | 1 |
| Form config — dimensions | reviews.review_dimensions | 1 |
| Overall stats | get_target_overall_stats RPC | 1 |
| Review list | reviews.reviews | 1 |
| Dimension ratings | reviews.review_dimension_ratings | 1 |
| Author cards | get_review_author_card RPC | **25 (N+1)** |
| Services — profile resolve | vc.actors | 1 |
| Services — list | vport.services | 1 |
| My review (auth path) | reviews.reviews | 1 (owner has no "mine") |

**Total DB round trips on mount: ~35 (25 of which are the N+1 author cards)**

---

## Event Flow 2 — Submit Review (Citizen, public mode)

```
Citizen fills compose form → clicks Submit

VportReviewsView.handleSubmit() (⚠️ lives in view screen — boundary violation)
 → validates: reviewAuthorActorId present, normalizedRatings.length > 0
 → calls r.submitReview({ body, ratings: normalizedRatings })

useVportReviewMine.submitReview({ body, ratings })
 → validates: authorActorId present, ratings array non-empty
 → builds optimisticReview object (crypto.randomUUID for temp id)
 → setActiveList(prev => [optimisticReview, ...prev])  ← optimistic insert
 → ctrlSubmitReview({ targetActorId, authorActorId, body, ratings })

VportReviews.controller.ctrlSubmitReview(input)
 → assertActorId(targetActorId), assertActorId(authorActorId)
 → guards: targetActorId !== authorActorId (self-review)
 → dalReadReviewTargetActor(authorActorId) → validates author is kind='user', not void
 → ctrlGetReviewFormConfig(targetActorId)
   → dalReadReviewTargetActor(targetActorId)                [ANOTHER actor read]
   → readVportTypeByActorId({actorId: targetActorId})       [vport_type read]
   → getReviewFormConfig({targetKind, targetSubtype})       [dimensions read]
 → readVportTypeByActorId({actorId: targetActorId})         [DUPLICATE vport_type read]
 → getReviewFormConfig({targetKind, targetSubtype})         [DUPLICATE dimension read]
 → builds keyToId Map (dimensionKey → dimensionId)
 → normalizes ratings array (dimensionKey → dimensionId)
 → engineSubmitReview({ targetActorId, authorActorId, body, ratings })

engines/reviews.submitReview()
 → isActorOwner(authorActorId)
   → supabase.auth.getSession() — checks session exists
   → SELECT id FROM vc.actors WHERE id=authorActorId AND is_void=false  ← NOT ownership check
   → returns true if actor exists (⚠️ SECURITY GAP — see findings)
 → validates ratings (dimensionId, 1-5 range)
 → dalRpcUpsertNeutralReview({targetActorId, authorActorId, body})
   → reviews.upsert_neutral_review() RPC (SECURITY DEFINER)   ← DB enforces real ownership
 → dalUpsertDimensionRatings({reviewId, ratings})
   → reviews.review_dimension_ratings UPSERT
 → dalGetReviewById({reviewId})
   → SELECT from reviews.reviews WHERE id=reviewId
 → emit(EVENTS.REVIEW_CREATED, {...})
 → returns { review, ratings }

Back in ctrlSubmitReview:
 → mapReview(result.review)
 → publishVcsmNotification({ recipientActorId: targetActorId, kind:'review_created', ... })
   → notifications engine → push to vport owner
 → returns mapped review

Back in useVportReviewMine.submitReview:
 → setActiveList: replace optimistic item with real saved item
 → setMyReview(saved), setMyExists(true)
 → loadCore().catch(() => {})  ← reload stats in background
```

**Submit DB round trips:**

| Step | Table/RPC | Count |
|---|---|---|
| Validate author actor | vc.actors | 1 |
| Validate target actor (in form config) | vc.actors | 1 |
| Vport type (in form config) | vport.profiles | 1 |
| Review dimensions (in form config) | reviews.review_dimensions | 1 |
| Vport type AGAIN (duplicate) | vport.profiles | **1 DUPLICATE** |
| Review dimensions AGAIN (duplicate) | reviews.review_dimensions | **1 DUPLICATE** |
| isActorOwner check | vc.actors | 1 |
| upsert_neutral_review RPC | reviews.reviews | 1 |
| Upsert dimension ratings | reviews.review_dimension_ratings | 1 |
| Read review by ID | reviews.reviews | 1 |
| Publish notification | notifications engine | 1 (async) |

**Total on submit: ~10 reads (+2 duplicates) + 2 writes**

**Duplicate read in submit path:** `ctrlGetReviewFormConfig` calls `readVportTypeByActorId` and `getReviewFormConfig` internally — then `ctrlSubmitReview` calls them AGAIN immediately after to build the `keyToId` map. This is 2 extra reads on every submit.

---

## Event Flow 3 — Delete My Review

```
Citizen clicks Delete → VportReviewDeleteModal confirms

VportReviewsView: onDelete={() => setShowDeleteConfirm(true)}
Modal: onDelete → r.deleteMyReview()

useVportReviewMine.deleteMyReview()
 → validates: myReview.id present, authorActorId present
 → setIsDeleting(true)
 → ctrlDeleteMyReview(myReview.id, authorActorId)

VportReviews.controller.ctrlDeleteMyReview(arg1, arg2)
 → normalizes args (supports both call styles)
 → assertActorId(reviewId), assertActorId(authorActorId)
 → engineDeleteReview({ reviewId, authorActorId })

engines/reviews.deleteReview()
 → dalGetReviewById({reviewId})
   → SELECT from reviews.reviews WHERE id=reviewId
 → validates: existing.author_actor_id === authorActorId
 → isActorOwner(authorActorId)  ← same weak check as submit
 → dalSoftDeleteReview({reviewId})
   → UPDATE reviews.reviews SET is_deleted=true, deleted_at=now() WHERE id=reviewId
 → emit(EVENTS.REVIEW_DELETED, {...})
 → returns ReviewModel(row)

Back in useVportReviewMine.deleteMyReview:
 → setMyReview(null), setMyExists(false), setIsEditing(false)
 → await Promise.all([loadActiveList(), loadCore()])  ← reload list + stats
```

---

## Event Flow 4 — Tab Switch (Owner Mode)

```
Owner clicks dimension tab (e.g., "service_quality")

VportReviewsView: TabButton onClick → r.setTab(key)

useVportReviews.tab state updates → React re-render
useVportReviewList receives new tab value → loadActiveList() triggered

useVportReviewList.loadActiveList()
 → ctrlListReviews(targetActorId, { limit: 25 })  ← full page reload on tab change
 → if tab !== 'overall' && tab !== 'services':
     list = list.filter(r => r.ratings.some(rt => rt.dimensionKey === tab))
     ← CLIENT-SIDE FILTERING — not a DB-filtered query
```

**Note:** Tab filtering is done client-side on the already-fetched list. This means:
- Only reviews already in the 25-review window are visible per dimension tab
- If reviews with a specific dimension rating exist past the cursor, they are invisible in the tab
- This is an architectural gap: dimension tab filtering should be server-side

---

## Event Flow 5 — Load More (Pagination)

```
User scrolls to bottom, clicks "Load more reviews"

ReviewsList: onLoadMore → r.loadMore()

useVportReviewList.loadMore()
 → validates: hasMore, nextCursor, !loadingMore
 → ctrlListReviews(targetActorId, { limit: 25, cursor: nextCursor })
   → engineListReviews({targetActorId, cursor, limit:25})
     → SELECT from reviews.reviews WHERE review_activity_at < cursor LIMIT 25
     → + dimension ratings batch read
     → + author cards N+1 (up to 25 more RPCs)
 → applies same client-side tab filter
 → setActiveList(prev => [...prev, ...moreList])
```

---

## Engine Events Emitted (not consumed by any app listener)

| Event | Emitted by | Payload |
|---|---|---|
| reviews.review_created | submitReview.controller | { reviewId, targetActorId, authorActorId, overallRating } |
| reviews.review_updated | (not currently emitted) | — |
| reviews.review_deleted | deleteReview.controller | { reviewId, targetActorId, authorActorId } |
| reviews.ratings_upserted | submitReview.controller | { reviewId, ratingCount } |
| reviews.stats_requested | getReviewStats.controller | { targetActorId } |

**Status:** No app code subscribes to any reviews engine event via `on()`. Events are emitted
but fire into empty listener maps. They are available for future wiring (e.g., cache invalidation,
realtime updates, analytics). Currently dead signal paths — not a bug, just unused capability.

---

## Duplicate Reads in Flow — Summary

| Duplicate | Where | Reads | Fix |
|---|---|---|---|
| vc.actors (target) | ctrlAssertReviewTargetActor + ctrlGetReviewFormConfig | 2× per mount | Merge — pass actor result from assert into form config |
| vport.profiles (vport_type) | ctrlGetReviewFormConfig + ctrlSubmitReview | 2× per submit | Pass vport_type from form config to submit |
| reviews.review_dimensions | ctrlGetReviewFormConfig + ctrlSubmitReview keyToId | 2× per submit | Reuse dims from form config result |

All three are **KRAVEN handoff** candidates.
