---
# Module Architecture Report — ARCHITECT §26.11
# Feature: reviews
# App: VCSM
# Ticket: ARCHITECT-REVIEWS-0001
# Generated: 2026-06-02
# Status: IMMUTABLE DATED REPORT — do not modify; update ARCHITECTURE.md instead

---

# reviews — Module Architecture Report

## Feature Overview

The reviews feature handles the full lifecycle of actor-to-actor (citizen-to-vport) reviews on the VCSM platform. All write and read orchestration is delegated to the shared `engines/reviews/` engine, which owns the DB schema (`reviews.*`), controllers, DALs, and models. The feature layer at `apps/VCSM/src/features/reviews/` contains only a single setup file that bootstraps the engine at app startup via dependency injection. The real review surfaces are distributed across: the vport profile feature (authenticated review submission, list, stats), the public vportMenu feature (unauthenticated public review read), and the vport dashboard (owner review management). A secondary app-level controller tier sits in `apps/VCSM/src/features/profiles/kinds/vport/controller/review/` and bridges engine shapes to hook contracts.

**Source Path:** `apps/VCSM/src/features/reviews/`
**Engine Path:** `engines/reviews/src/`
**Profile Integration Path:** `apps/VCSM/src/features/profiles/kinds/vport/controller/review/`
**Public Integration Path:** `apps/VCSM/src/features/public/vportMenu/`
**Dashboard Integration Path:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/reviews/`
**Security Tier:** LOW
**Feature Status:** PLANNED (engine fully built; app UI integration in progress)

---

## Layer Presence

| Layer | Present | Path |
|---|---|---|
| Controllers (feature) | MINIMAL | apps/VCSM/src/features/reviews/setup.js (engine bootstrap only) |
| Controllers (profile integration) | YES | apps/VCSM/src/features/profiles/kinds/vport/controller/review/ |
| Controllers (public read) | YES | apps/VCSM/src/features/public/vportMenu/controller/ |
| DALs (feature) | NO | None at features/reviews/ |
| DALs (profile integration) | YES | apps/VCSM/src/features/profiles/kinds/vport/dal/review/ |
| DALs (public read) | YES | apps/VCSM/src/features/public/vportMenu/dal/ |
| Models | NO | None at features/reviews/ |
| Hooks | YES | apps/VCSM/src/features/profiles/kinds/vport/hooks/review/ |
| Screens | YES | apps/VCSM/src/features/profiles/kinds/vport/screens/review/, apps/VCSM/src/features/public/vportMenu/screen/ |
| Components | YES | apps/VCSM/src/features/profiles/kinds/vport/screens/review/components/, apps/VCSM/src/features/public/vportMenu/components/ |
| Adapters | YES | apps/VCSM/src/features/profiles/adapters/kinds/vport/screens/review/VportReviewsView.adapter.js |
| Engine controllers | YES | engines/reviews/src/controller/ |
| Engine DALs | YES | engines/reviews/src/dal/ |

---

## Active Controllers

### Engine Layer — 6 controllers (engines/reviews/src/controller/)

| Controller | Purpose | Auth Gate |
|---|---|---|
| submitReview.controller.js | Upsert neutral review + optional dimension ratings | isActorOwner(authorActorId) via DI; self-review guard (targetActorId === authorActorId) |
| deleteReview.controller.js | Soft-delete a review; idempotent on already-deleted | isActorOwner(authorActorId) + author_actor_id row match |
| listReviews.controller.js | Paginated list of active reviews for a target actor | None — public read path |
| getMyActiveReview.controller.js | Fetch current author's active neutral review for a target | None — caller must supply valid authorActorId |
| getReviewStats.controller.js | Aggregate stats for a target via DB RPC | None — public read path |
| getReviewFormConfig.controller.js | Load active review dimensions for a target kind/subtype | None — public read path |

### App Profile Integration Layer — 3 controllers (apps/.../profiles/kinds/vport/controller/review/)

| Controller | Purpose | Auth Gate |
|---|---|---|
| VportReviews.controller.js | Bridges engine controllers to hook contract; adds actor/kind validation, rating key mapping, notification dispatch | dalReadReviewTargetActor + kind='user' author guard; target must be active vport |
| VportServiceReviews.controller.js | Adds service-tab support; lists vport services for reviews UI; filters reviews by serviceId | Delegates to VportReviews.controller.js |
| vportReviews.mappers.js | Pure mapping functions — engine domain shape to legacy hook shape | N/A |

### App Public Read Layer — 2 controllers (apps/.../features/public/vportMenu/controller/)

| Controller | Purpose | Auth Gate |
|---|---|---|
| getVportPublicReviews.controller.js | Initial load: summary + first page + dimensions | None — public unauthenticated |
| getVportPublicReviewsPage (in same file) | Pagination continuation | None — public unauthenticated |

---

## Active DALs

### Engine Layer — 6 DAL files (engines/reviews/src/dal/)

| DAL | Tables | Notes |
|---|---|---|
| reviews.read.dal.js | reviews.reviews | Cursor-based pagination; explicit column list; no select(*) |
| reviews.write.dal.js | reviews.reviews | dalInsertReview, dalUpdateReviewBody, dalSoftDeleteReview; all filter by author_actor_id |
| reviews.rpc.dal.js | reviews.reviews (via RPC) | dalRpcUpsertNeutralReview → reviews.upsert_neutral_review(); dalRpcGetTargetOverallStats → reviews.get_target_overall_stats() |
| dimensions.read.dal.js | reviews.review_dimensions | Filtered by target_kind, target_subtype, is_active |
| dimensionRatings.read.dal.js | reviews.review_dimension_ratings | Batch fetch by reviewIds list (eliminates N+1) |
| dimensionRatings.write.dal.js | reviews.review_dimension_ratings | Upsert on conflict (review_id, dimension_id); dalDeleteDimensionRatingsForReview |

### App Profile Integration Layer — 1 DAL (apps/.../profiles/kinds/vport/dal/review/)

| DAL | Tables | Notes |
|---|---|---|
| reviewTarget.read.dal.js | vc.actors | Validates target/author actor existence, kind, vport_id, is_void |

### App Public Read Layer — 3 DAL files (apps/.../features/public/vportMenu/dal/)

| DAL | Tables | Notes |
|---|---|---|
| readPublicVportReviews.dal.js | reviews.public_vport_reviews_v | Public DB view; paginated with cursor; no auth required |
| readPublicVportReviewSummary.dal.js | reviews.* (summary view or RPC) | Aggregate stats for public display |
| readPublicVportReviewDimensions.dal.js | reviews.review_dimensions | Dimensions for public display |

---

## Active Hooks

| Hook | What it calls | Purpose |
|---|---|---|
| useVportReviews.js | ctrlAssertReviewTargetActor, ctrlGetReviewFormConfig, ctrlGetOfficialStats, useVportReviewList, useVportReviewMine | Root orchestrator hook; manages tab, dimensions, stats, services, compose/delete |
| useVportReviewList.js | ctrlListReviews | Paginated review list state; cursor pagination; loadMore |
| useVportReviewMine.js | ctrlGetMyActiveReview, ctrlSubmitReview, ctrlDeleteMyReview | Current user's review; submit/delete/edit lifecycle |
| useVportReviewCompose.js | submitReview callback from useVportReviews | Compose form state; dimension ratings map; body; submit handler |
| useVportPublicReviews.js | getVportPublicReviewsController, getVportPublicReviewsPageController | Public unauthenticated review panel; pagination |

---

## Engine Dependencies

| Engine | Import Path | Purpose |
|---|---|---|
| reviews engine | @reviews (engines/reviews/index.js → adapters/index.js) | All review read/write logic, models, config, events |

---

## Cross-Feature Dependencies

| Feature | What is imported | Direction |
|---|---|---|
| notifications | publishVcsmNotification via notifications.adapter | reviews → notifications (review_created notification dispatch) |
| profiles/kinds/vport/dal/services | readVportServicesByActor.dal | VportServiceReviews.controller → vport DAL (service list for service tab) |
| supabase client singleton | supabaseClient | features/reviews/setup.js → services (engine DI bootstrap) |

---

## Authorization Pattern

**Engine layer:** Dependency-injected `isActorOwner(authorActorId)` — configured in setup.js. Queries `vc.actor_owners` with `is_void=false`. Session RLS enforces at DB layer. This is defense-in-depth; real enforcement is the `reviews.upsert_neutral_review()` SECURITY DEFINER function.

**App profile layer:** ctrlSubmitReview applies:
1. Author actor must exist and not be void
2. Author kind must be `'user'` (citizens only — vports cannot submit reviews)
3. Target must be an active vport with resolved subtype
4. Self-review prevention (targetActorId === authorActorId throws)
5. Engine isActorOwner delegated check

**Delete path:** author_actor_id row-match AND isActorOwner both required.

**Public read path:** No auth — reads from `reviews.public_vport_reviews_v` DB view.

---

## Module Independence Classification

**DEPENDENT**

The feature source path is a thin DI bootstrap. All substantive logic is in the engine and distributed across vport profile and public vportMenu integration sites. The module cannot be understood independently.

---

## Architecture State

**EVOLVING**

Engine is production-grade. App integration is substantially built. Feature is PLANNED in governance. Dual VportReviewsView.jsx screen path risk exists. DB schema live but UI integration not fully shipped.

---

## Known Structural Risks

1. **Dual VportReviewsView.jsx** — Two screen files at different paths in profiles/screens/. One may be legacy. Needs deduplication before THOR.

2. **VportServiceReviews service binding fallback** — Falls back to all reviews when no service FK in rows. Explicit comment in source. May silently show unfiltered results.

3. **Feature source path near-empty** — Only setup.js at canonical path. Future engineers may not find review logic and duplicate work.

4. **ctrlDeleteMyReview dual call-style** — Accepts both `(reviewId, authorActorId)` and `({ reviewId, requesterActorId })`. Interface was adapted; callers may be inconsistent.

5. **dalInsertReview may be superseded** — The write DAL contains a direct `INSERT` that may be bypassed in favor of the RPC upsert path. Unclear if dalInsertReview is still called anywhere in production flow.

---

## Module Completeness Matrix

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | DR_STRANGE.md, setup.js header, engine CLAUDE.md | None |
| Owner defined | FAIL | OWNERSHIP.md missing | Run IRONMAN |
| Entry points mapped | PARTIAL | Engine adapter, VportReviews.controller.js, VportReviewsView.adapter.js | No central feature adapter at reviews/ level |
| Controllers present | PASS | 11 total across 3 tiers | None |
| DAL/repository present | PASS | 10 total across 3 tiers | dalInsertReview may be superseded |
| Models/transformers | PASS | 6 engine models + 1 public model + mappers | None |
| Hooks/view models | PASS | 5 hooks covering all surfaces | None |
| Screens/components | PARTIAL | Screens present; dual path risk | Dual VportReviewsView.jsx deduplication needed |
| Authorization path mapped | PASS | isActorOwner DI, kind='user' guard, SECURITY DEFINER RPC | See dual call-style risk |
| Engine dependencies mapped | PASS | engines/reviews/ via @reviews alias | None |
| Tests/validation noted | FAIL | TESTS.md missing; SPIDER-MAN not run | No test coverage |

---

## Recommended Handoffs

- **IRONMAN** — Establish ownership; feature spans four locations with no declared owner.
- **VENOM** — Security posture UNKNOWN; submit/delete paths and isActorOwner DI pattern need formal trust boundary analysis.
- **SPIDER-MAN** — No test coverage. Engine controllers are high-value regression targets.
- **DB** — Audit reviews.upsert_neutral_review() SECURITY DEFINER; confirm RLS on public_vport_reviews_v; confirm review_dimension_ratings upsert conflict resolution.
- **HAWKEYE** — Map all public review routes; verify endpoint contracts for profile review tab and public menu screens.

---

## Final Module Status

**MOSTLY COMPLETE**

The engine is production-grade and well-structured. App integration is substantially built across all layers. PLANNED classification reflects incomplete UI verification and THOR_BLOCKED status. Two structural risks (dual screen file, service binding fallback) require resolution before release.

---

## ARCHITECT Run Record
- Date: 2026-06-02
- Ticket: ARCHITECT-REVIEWS-0001
- Architecture State: EVOLVING
- Files Written:
  - CURRENT/features/reviews/ARCHITECTURE.md
  - CURRENT/FEATURE_INDEX_RUNTIME/reviews.md
  - CURRENT/outputs/2026/06/02/ARCHITECT/modules/vcsm.reviews.architecture.md
