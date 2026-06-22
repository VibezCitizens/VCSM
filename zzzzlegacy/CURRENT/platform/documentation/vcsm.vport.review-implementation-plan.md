# Vport Review Pipeline — Implementation Plan

Updated: 2026-04-09
Based on: logan/vport-review-pipeline-audit.md
Supersedes: `vport-review-focused-plan.md` (merged into this doc)

---

## 1. Executive Summary

The vport review system is architecturally sound (DAL -> Model -> Controller -> Hook -> Screen), with good schema design and RLS enforcement. However, the audit identified 8 improvement areas ranging from critical (missing citizen-only controller guard) to optional (moderation workflow). This plan provides concrete file-by-file changes for each improvement, prioritized by risk and impact.

---

## 2. Current State

- 16 files in the review pipeline (app-local in `apps/VCSM`)
- 3 database tables (legacy): `vport_reviews`, `vport_review_ratings`, `vport_review_dimensions`
- 2 RPCs (legacy): `get_vport_review_form_config`, `get_vport_official_stats`
- Idempotent upsert pattern (one active review per author-target pair)
- Soft delete with RLS enforcement
- 12 vport-type-specific dimension sets
- Pipeline health: GOOD
- Schema health: GOOD
- Authorization health: ADEQUATE (gap in controller layer)

### Engine Extraction (2026-04-09)

A shared reviews engine has been built at `engines/reviews/` (29 files) backed by the new `reviews.*` schema. The engine provides:
- `configureReviewsEngine()` with DI for `supabaseClient`, `isActorOwner`, optional `resolveActorCard`
- Controllers: `submitReview`, `deleteReview`, `listReviews`, `getMyActiveReview`, `getTargetStats`, `getReviewFormConfig`
- Full DAL/Model/Service layers following identity/chat engine conventions
- DB-level snapshot hydration, cooldown enforcement, and weighted overall calculation via triggers
- RPC functions: `upsert_neutral_review`, `get_review_author_card`, `get_target_overall_stats`

**VCSM app has been migrated to the engine** — controller delegates to engine, no legacy fallbacks.

### Review Dimensions by Vport Type (Seeded in DB)

| Vport Type | Dimensions (by weight) |
|------------|----------------------|
| Barber | Service Quality (1.40), Professionalism (1.20), Cleanliness (1.00), Value (1.00) |
| Restaurant | Food Quality (1.50), Service (1.20), Cleanliness (1.00), Value (1.00) |
| Gas Station | Fuel Quality (1.20), Value (1.20), Service (1.00), Cleanliness (1.00) |
| Exchange | Rate Fairness (1.50), Trust (1.40), Speed (1.10), Service (1.00) |
| Locksmith | Problem Solved (1.50), Speed Response (1.40), Trust & Safety (1.40), Professionalism (1.20), Price Fairness (1.00) |

---

## 3. Critical Risks

| Risk | Severity | Status |
| --- | --- | --- |
| Non-citizen actor submits review | High | **FIXED** — citizen-only guard added in `ctrlSubmitReview` |
| Review list unbounded | Medium | **FIXED** — cursor-based pagination added |
| No edit UI | Low | **FIXED** — explicit edit flow with pre-fill + "Edit my review" button |
| No delete UI | Low | **FIXED** — soft delete with confirmation modal wired |
| Author shows "Anonymous" | Medium | **FIXED** — `identity.actor_directory` fallback for RLS-blocked actors |
| Overall score shows "-" | Medium | **FIXED** — property access corrected (`r.overallAverage` instead of `r.stats`) |
| `overall_rating` trigger undocumented | Medium | Open — DB trigger needs documentation |
| Dimension config drift | Low | Open — DB vs config file divergence risk |

---

## 4. Priority Fixes

### Phase 1 — Critical (DONE)

**A. Citizen-only guard in controller** — IMPLEMENTED
- Added `authorActor.kind !== "user"` check in `ctrlSubmitReview` using `dalReadReviewTargetActor`

### Phase 2 — UX improvements (DONE)

**B. Edit review UI** — IMPLEMENTED
- Added `myReview`, `isEditing`, `startEdit()`, `cancelEdit()` to hook
- Pre-fills body + ratings from existing review
- "Edit my review" button when review exists, "Update review" + "Cancel" in edit mode
- Edit button on own review card in ReviewsList

**C. Delete review UI** — IMPLEMENTED
- Wired `ctrlDeleteMyReview` with `deleteMyReview()` in hook
- Confirmation modal with "Delete review" / "Cancel"
- Reloads list + stats after delete

### Phase 3 — Performance and maintainability (DONE)

**D. Pagination** — IMPLEMENTED
- DAL: cursor-based via `created_at`, fetches `limit+1`, returns `{ rows, hasMore }`
- Controller: returns `{ reviews, hasMore, nextCursor }`
- Hook: `hasMore`, `loadMore()`, `loadingMore` state
- UI: "Load more reviews" button in ReviewsList

**E. Query efficiency audit**
- Decision: keep multi-query (3 sequential reads). Supabase doesn't support cross-schema joins.
- See section 10

### Phase 4 — Optional product improvements

**F. Moderation/verification workflow**
- Add ability to flag/unverify reviews
- See section 9

**G. Config drift protection**
- Add DB-first config with validation against fallback
- See section 11

**H. `overall_rating` trigger documentation**
- Document the trigger logic and add app-level fallback
- See section 11

---

## 5. File-by-File Change Plan

| File | Phase | Change |
| --- | --- | --- |
| `controller/review/VportReviews.controller.js` | 1 | Add citizen-only guard in `ctrlSubmitReview` |
| `controller/review/VportReviews.controller.js` | 3 | Update `ctrlListReviews` signature for cursor pagination |
| `dal/review/vportReviews.read.dal.js` | 3 | Add cursor param to `dalListVportReviews` |
| `hooks/review/useVportReviews.js` | 2 | Add `isEditing`, `startEdit`, `cancelEdit`, `deleteMyReview`, `isDeleting` |
| `hooks/review/useVportReviews.js` | 3 | Add `cursor`, `hasMore`, `loadMore` for pagination |
| `screens/review/VportReviewsView.jsx` | 2 | Add edit/delete buttons, pre-fill form, confirmation prompt |
| `screens/review/VportReviewsView.jsx` | 3 | Add "Load more" button |
| `screens/review/components/ReviewsList.jsx` | 2 | Add edit/delete action buttons on own review card |
| `screens/review/components/ReviewsList.jsx` | 3 | Support "Load more" trigger |

---

## 6. Authorization Hardening Plan

### Current authorization layers

| Layer | Check | Status |
| --- | --- | --- |
| UI (hook) | `identity.kind === "user"` gates compose form | Working |
| RLS (DB) | INSERT requires author is user actor owned by uid | Working |
| Controller | No actor-kind check | **GAP** |

### Fix

In `ctrlSubmitReview` (line 210), after the self-review check:

```javascript
const authorActor = await dalReadReviewTargetActor(authorActorId);
if (!authorActor || authorActor.is_void) {
  throw new Error("[VportReviews] author actor not found or void");
}
if (authorActor.kind !== "user") {
  throw new Error("Only citizens can submit reviews.");
}
```

### Why `dalReadReviewTargetActor` is reusable

The function queries `vc.actors` for `id, kind, vport_id, is_void` — generic enough for both target and author validation. Already imported in the controller.

### After fix: 3 layers of defense

| Layer | Check |
| --- | --- |
| UI | `identity.kind === "user"` gates form |
| Controller | `authorActor.kind !== "user"` rejects |
| RLS | INSERT policy enforces at DB level |

---

## 7. Pagination Plan

### Current: LIMIT 25, no cursor

```
dalListVportReviews(targetActorId, limit=25)
  → SELECT ... LIMIT 25 ORDER BY created_at DESC
```

### Target: cursor-based pagination

```
dalListVportReviews(targetActorId, { limit=25, cursor=null })
  → SELECT ... WHERE created_at < cursor LIMIT limit+1 ORDER BY created_at DESC
  → return { rows, hasMore }
```

### Full change chain

1. **DAL**: Add `cursor` param, fetch `limit+1`, return `{ rows, hasMore }`
2. **Controller**: Accept `{ limit, cursor }`, return `{ reviews, hasMore, nextCursor }`
3. **Hook**: Add `cursor` state, `hasMore` flag, `loadMore()` function that appends
4. **UI**: Add "Load more reviews" button at bottom of `ReviewsList`

### Service-filtered reviews

`ctrlListReviewsForService` in `VportServiceReviews.controller.js` also needs pagination. Same pattern applies.

---

## 8. Edit/Delete UX Plan

### Edit flow

| Step | Component | Action |
| --- | --- | --- |
| 1 | ReviewsList card | Show "Edit" button on viewer's own review |
| 2 | Hook | `startEdit()` — pre-fills form from `myReview.body` + `myReview.ratings` |
| 3 | VportReviewsView | Form switches to edit mode with "Update" + "Cancel" buttons |
| 4 | Submit | Calls same `ctrlSubmitReview` (idempotent upsert — updates existing) |
| 5 | Hook | `cancelEdit()` — clears form, exits edit mode |

### Delete flow

| Step | Component | Action |
| --- | --- | --- |
| 1 | ReviewsList card | Show "Delete" button on viewer's own review |
| 2 | VportReviewsView | Show confirmation modal ("Are you sure?") |
| 3 | Hook | `deleteMyReview()` — calls `ctrlDeleteMyReview(reviewId, viewerActorId)` |
| 4 | Controller | Validates author ownership, soft-deletes |
| 5 | Hook | Clears `myReview`, reloads list + stats |

### Identifying "own" review in ReviewsList

Compare `item.authorActorId` against `viewerActorId` (passed as prop). If match, show edit/delete actions.

---

## 9. Moderation Plan

### Current state

- `is_verified` column exists on `vport_reviews`, defaults to `true`
- Official stats RPC filters on `is_verified=true`
- No admin UI to flag/unverify reviews
- No moderation queue

### Recommended approach (no schema change needed)

1. **Admin/owner action**: Add `ctrlFlagReview(reviewId, ownerActorId)` that sets `is_verified=false`
2. **DAL**: Add `dalUpdateVerificationStatus(reviewId, isVerified)`
3. **UI**: In owner mode, add "Flag" button on review cards
4. **Effect**: Flagged reviews excluded from official stats (already handled by RPC filter)
5. **No schema change** — `is_verified` already exists and is indexed

### Future: full moderation

If needed later, integrate with the existing `moderation.*` schema (reports, actions, blocks). But for now, the simple flag approach is sufficient.

---

## 10. Performance Improvements

### Author enrichment: multi-query vs join

**Current:** 3 sequential queries per review list load:
1. `dalListVportReviews` → review rows
2. `dalListVportReviewRatingsByReviewIds` → rating rows
3. `dalListActorCardsByActorIds` → author cards (actors + profiles + vports)

**Recommendation: keep multi-query.**

Why:
- Supabase client doesn't support cross-schema joins (`vc.actors` → `public.profiles`)
- The author card query already batches by `actorIds IN (...)`
- With LIMIT 25, the total is 3 queries for 25 reviews — acceptable
- A view/RPC could merge queries 1+2, but adds schema coupling

**Optional improvement:** Merge queries 1+2 into a single RPC that returns reviews with ratings joined. This saves one round-trip. But it's not critical at LIMIT 25.

### Client-side aggregation

`computeDimStatsFromReviews(reviews)` recomputes on every render. For small review sets (25), this is fine. If pagination grows the local list, memoize the computation with `useMemo` keyed on `activeList`.

---

## 11. Schema / Trigger Notes

### `overall_rating` trigger

- The `overall_rating` column on `vport_reviews` is computed by a database trigger (not visible in app code)
- The trigger presumably fires on `vport_review_ratings` INSERT/UPDATE and writes a weighted average back to `vport_reviews.overall_rating`
- App code reads `overall_rating` as a precomputed value — never writes it
- **Risk**: If the trigger is removed/broken, `overall_rating` becomes stale
- **Recommendation**: Document the trigger in a schema README. Optionally add an app-level fallback that computes overall from ratings if `overall_rating` is null

### Dimension config drift

- DB source: `vc.vport_review_dimensions` table (queried via RPC)
- Fallback source: `reviewDimensions.config.js` (hardcoded per vport type)
- **Current behavior**: DB config is primary; fallback only used when DB returns empty
- **Risk**: If DB has different dimensions than config file, the form shows DB dimensions but fallback logic uses config file dimensions
- **Recommendation**: Log a dev-only warning when DB config differs from config file. Consider removing the fallback entirely once all vport types are seeded in DB

---

## 12. Final Recommended Order of Work

| # | Task | Phase | Status |
| --- | --- | --- | --- |
| 1 | Citizen-only guard in `ctrlSubmitReview` | 1 | **DONE** |
| 2 | Edit review UI (pre-fill + button) | 2 | **DONE** |
| 3 | Delete review UI (soft delete + confirm) | 2 | **DONE** |
| 4 | Pagination (cursor-based) | 3 | **DONE** |
| 5 | Author "Anonymous" fix (actor_directory fallback) | — | **DONE** |
| 6 | Overall score "-" fix (property access) | — | **DONE** |
| 7 | Owner flag/unverify action | 4 | Open |
| 8 | Config drift warning | 4 | Open |
| 9 | Trigger documentation | 4 | Open |
| 10 | Author enrichment optimization | 4 | Open (optional) |
