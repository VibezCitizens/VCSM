# MODULE ARCHITECTURE REPORT

---

Module: VPORT Reviews Dashboard
Application Scope: VCSM
Module Type: Feature Module — Owner Dashboard Sub-feature
Primary Root: apps/VCSM/src/features/
Independence Status: MOSTLY INDEPENDENT (anchored to profiles/kinds/vport feature boundary)
Completeness Status: MOSTLY COMPLETE — legacy residue present, N+1 risk, security gap in isActorOwner, duplicate reads in submit path

Scan Date: 2026-05-24
ARCHITECT Version: 26.14

---

## PURPOSE

The Reviews Vport Dashboard gives vport (business) owners a full-screen view of all reviews
submitted against their actor. It surfaces:

- Aggregate star rating + official stats (from DB RPC)
- Tab-filtered review lists (overall, by dimension, by service)
- Owner-mode tab interface to drill into specific dimensions
- Authenticated review compose form for citizen visitors (public-mode only)
- Edit and delete controls for the reviewer's own review
- Optimistic UI for review submission

The same core view (`VportReviewsView`) is also embedded in the public-facing
vport profile tab under the `REVIEWS` tab — making the view dual-purpose:
it renders in `mode="owner"` (dashboard) and `mode="public"` (profile).

---

## OWNERSHIP

Feature Owner: Vport Dashboard feature (features/dashboard/vport)
Logic Owner: Profiles/kinds/vport feature (features/profiles/kinds/vport)
Engine Owner: engines/reviews
Cross-feature boundary: dashboard → profiles via adapter (COMPLIANT)

---

## ENTRY POINTS

Route (canonical):
  /actor/:actorId/dashboard/reviews
  → VportDashboardReviewScreen.jsx
  → app.routes.jsx:207

Route (legacy redirect):
  /vport/:actorId/dashboard/reviews
  → VportToActorDashboardReviewsRedirect (redirect component, not a live duplicate)
  → app.routes.jsx:241
  STATUS: CLEAN — properly redirects, not a dead duplicate

Profile Tab Entry:
  VportReviewsTab (features/profiles/kinds/vport/screens/views/tabs/VportReviewsView.jsx)
  → wraps VportReviewsView in profile tab context
  → mode="public"

---

## LAYER MAP

```
Final Screen (Dashboard):
  apps/VCSM/src/features/dashboard/vport/screens/VportDashboardReviewScreen.jsx
  → useParams, useIdentity, useVportOwnership, useDesktopBreakpoint
  → Renders VportReviewsView.adapter (cross-feature via adapter — COMPLIANT)
  → Portal to document.body on desktop (iOS stacking context compliant)

Adapter (Cross-feature boundary):
  apps/VCSM/src/features/profiles/adapters/kinds/vport/screens/review/VportReviewsView.adapter.js
  → 2-line re-export of VportReviewsView — COMPLIANT

View Screen:
  apps/VCSM/src/features/profiles/kinds/vport/screens/review/VportReviewsView.jsx
  ⚠️ BOUNDARY VIOLATION — see findings below

Profile Tab Wrapper:
  apps/VCSM/src/features/profiles/kinds/vport/screens/views/tabs/VportReviewsView.jsx
  → thin wrapper, passes profile+viewerActorId

Hooks:
  useVportReviews.js          — orchestrator, calls sub-hooks + controllers
  useVportReviewList.js       — list pagination + tab filtering
  useVportReviewMine.js       — my review: load, submit, edit, delete
  useVportReviews.helpers.js  — pure functions (computeDimStats, pickRecentComments)

Controllers (ACTIVE):
  VportReviews.controller.js       — engine-backed, all read/write ops
  VportServiceReviews.controller.js — service tab support
  vportReviews.mappers.js          — engine→hook shape mappers

DAL (ACTIVE):
  dal/review/reviewTarget.read.dal.js  — validates target actor (vc.actors)

DAL (LEGACY / LIKELY DEAD — see findings):
  dal/review/vportReviewAuthors.read.dal.js  — ⚠️ NOT IMPORTED by active path
  dal/review/vportReviews.write.dal.js       — ⚠️ NOT IMPORTED by active path

Model (ACTIVE):
  vportReviews.mappers.js — engine shape → hook shape (lives in controller folder)

Model (LEGACY / LIKELY DEAD):
  model/review/VportReview.model.js  — ⚠️ NOT IMPORTED by active path

Config (LIKELY DEAD):
  config/reviewDimensions.config.js  — ⚠️ NOT IMPORTED by any active review controller
  (engine resolves dimensions from reviews.review_dimensions table via DB)

Components:
  screens/review/components/ReviewsList.jsx
  screens/review/components/VportReviewComposeForm.jsx
  screens/review/components/VportReviewDeleteModal.jsx
  screens/review/components/VportReviewStars.jsx
  screens/review/components/VportReviewsControls.jsx
  screens/review/components/ServicesPicker.jsx

Engine Consumed:
  engines/reviews/
  Entry: import { listReviews, submitReview, deleteReview, getMyActiveReview,
                   getReviewFormConfig, getTargetStats } from '@reviews'
```

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Owner + public review view, engine-backed | — |
| Owner defined | PASS | dashboard/vport owns screen, profiles/vport owns logic | Dual-feature boundary slightly fragmented |
| Entry points mapped | PASS | /actor/:actorId/dashboard/reviews registered | Legacy redirect route properly handled |
| Controllers present/delegated | PASS | VportReviews.controller.js, VportServiceReviews.controller.js | Legacy dead code alongside active path |
| DAL/repository present/delegated | PARTIAL | reviewTarget.read.dal.js active; 2 legacy DALs unremoved | vportReviewAuthors + vportReviews.write are dead weight |
| Models/transformers present | PARTIAL | vportReviews.mappers.js active; VportReview.model.js dead | Legacy model not removed |
| Hooks/view models present | PASS | useVportReviews, useVportReviewList, useVportReviewMine all present | — |
| Screens/components present | PASS | Full component tree exists | View screen has boundary violations |
| Services/adapters present | PASS | Adapter compliant; VportReviewsView.adapter.js | — |
| Database objects mapped | PASS | reviews.reviews, review_dimension_ratings, review_dimensions, RPCs mapped | — |
| Authorization path mapped | PASS | ctrlAssertReviewTargetActor, citizen-only guard, self-review guard | — |
| Cache/runtime behavior mapped | PARTIAL | Public summary DAL has 60s TTL cache; auth path has no caching | Authenticated list path reads DB fresh on every mount |
| Error/loading/empty states mapped | PASS | Loading skeletons in ReviewsList; empty state UI; error banner | — |
| Documentation linked | FAIL | No Logan doc exists for this module | MISSING |
| Tests/validation noted | FAIL | No tests present or documented | MISSING |
| Native parity noted | PARTIAL | Dashboard only; no native app parity doc | Review submit on native not mapped |
| Engine dependencies mapped | PASS | engines/reviews consumed via @reviews alias | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| engines/reviews | engine | dashboard/vport → engine | YES — via @reviews alias | Correct |
| features/profiles/kinds/vport/controller/review | feature | dashboard/vport → profiles/vport | YES — via adapter | Cross-feature access via adapter only |
| features/profiles/adapters | adapter | dashboard → adapter | YES | Correct cross-feature boundary |
| @/state/identity/identityContext | store | useVportReviews → identity | YES | Standard identity access |
| @/features/identity/adapters/identity.adapter | adapter | VportReviewsView → identity | WARNING | Duplicate identity import path vs hook |
| vc.actors | database | reviewTarget.read.dal → DB | YES | Validates target actor |
| reviews.reviews | database | engine → DB | YES | Via engine DAL |
| reviews.review_dimensions | database | engine → DB | YES | Via engine DAL |
| reviews.review_dimension_ratings | database | engine → DB | YES | Via engine DAL |
| reviews.public_vport_reviews_v | database | public/vportMenu path | YES | Separate public read path |
| reviews.public_vport_review_summary_v | database | public/vportMenu path | YES | Cached, 60s TTL |
| @debuggers/identity | debugger | VportReviewsView → debugger | WARNING | Dev debugger import in view screen |
| features/notifications/adapters | adapter | VportReviews.controller → notifications | YES | Notification on review submit |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| reviews.reviews | read/write | reviews engine | VportReviews.controller (engine-backed) | Engine owned — clean |
| reviews.review_dimension_ratings | read/write | reviews engine | VportReviews.controller (engine-backed) | Engine owned — clean |
| reviews.review_dimensions | read | reviews engine | getReviewFormConfig engine controller | Engine owned — clean |
| vc.actors | read | reviewTarget.read.dal | ctrlAssertReviewTargetActor | App-level only, compliant |
| reviews.public_vport_reviews_v | read | public/vportMenu DAL | getVportPublicReviewsController | Public view — clean |
| reviews.public_vport_review_summary_v | read | public/vportMenu DAL | TTL cached, 60s | Clean, cached properly |
| get_review_author_card RPC | read | reviews engine | dalGetAuthorCardsForReviews (engine) | N+1 RISK — called per review ID |
| upsert_neutral_review RPC | write | reviews engine | dalRpcUpsertNeutralReview | Clean |
| get_target_overall_stats RPC | read | reviews engine | dalRpcGetTargetOverallStats | Clean — single call |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route entry | READY | /actor/:actorId/dashboard/reviews registered | — |
| Loading state | READY | ReviewsList skeleton (3 animated cards) | — |
| Empty state | READY | Empty state UI with icon in ReviewsList | — |
| Error state | READY | Error banner in VportReviewsView | — |
| Auth/owner gate | READY | isOwner from useVportOwnership; mode prop controls UI | — |
| Citizen-only review guard | READY | ctrlAssertReviewTargetActor + kind=user check in controller | — |
| Self-review guard | READY | targetActorId === authorActorId check in controller | — |
| Optimistic UI | READY | Optimistic review card + rollback on error | — |
| Pagination (load more) | READY | cursor-based pagination via useVportReviewList | — |
| Desktop portal | READY | createPortal to document.body on isDesktop | — |
| N+1 author cards | AT RISK | 25 reviews = 25 RPC calls | LOKI/KRAVEN handoff recommended |
| Cache on auth path | MISSING | No cache on ctrlListReviews / ctrlGetOfficialStats | Fresh DB read on every mount |
| Tab state persistence | PARTIAL | Tab resets to "overall" on dimension change | Minor UX issue |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc (reviews dashboard module) | `modules/vcsm.vport-reviews-dashboard.architecture.md` | PRESENT (this file) |
| Logan doc (reviews QR system) | `modules/vcsm.vport-reviews-qr.architecture.md` | PRESENT (2026-05-26) |
| Logan doc (public reviews + engine) | `vcsm.reviews.architecture.md` | PRESENT |
| Ownership record | IRONMAN | MISSING |
| Security audit | VENOM | NOT RUN |
| Runtime audit | LOKI | NOT RUN |
| Performance audit | KRAVEN | NOT RUN — N+1 present |
| Migration audit | CARNAGE | NOT RUN |
| Native transfer audit | FALCON | MISSING |
| Engine audit | engines/reviews CLAUDE.md | PRESENT |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Batch RPC for author cards | HIGH | 25 reviews = 25 sequential RPCs on every list load | KRAVEN + CARNAGE |
| Cache on ctrlListReviews / ctrlGetOfficialStats | MEDIUM | Fresh DB hit on every mount of Reviews tab | KRAVEN |
| Remove legacy DAL: vportReviewAuthors.read.dal.js | HIGH | Dead code with complex multi-client logic; misleading | IRONMAN |
| Remove legacy DAL: vportReviews.write.dal.js | HIGH | Dead code bypassed by engine write path | IRONMAN |
| Remove legacy model: VportReview.model.js | MEDIUM | Orphaned, not consumed by any active path | IRONMAN |
| Remove/verify: reviewDimensions.config.js | MEDIUM | Not imported — may be fully dead or missed by engine | IRONMAN |
| Extract compose form state from VportReviewsView | MEDIUM | View screen owns 6 useState + handleSubmit — boundary violation | SENTRY |
| Remove dual submit() legacy in useVportReviewMine | LOW | submit() and submitReview() both exported; submitReview() is canonical | IRONMAN |
| Resolve dual identity import paths | LOW | useVportReviews uses identityContext; VportReviewsView uses identity.adapter | SENTRY |
| Logan documentation | MEDIUM | Module has no canonical doc | LOGAN |
| Security review on reviews.rpc | MEDIUM | upsert_neutral_review is SECURITY DEFINER — audit needed | VENOM |
| Native parity notes | LOW | Dashboard reviews not mapped for iOS | FALCON |

---

## MODULE BOUNDARY WARNINGS

### WARNING 1

```
MODULE BOUNDARY WARNING
Location: apps/VCSM/src/features/profiles/kinds/vport/screens/review/VportReviewsView.jsx
Module: profiles/kinds/vport/screens/review (View Screen layer)
Current dependency: Contains 6 useState hooks, handleSubmit async callback
Expected boundary: View Screens compose components + call hooks. No business state or callbacks.
Risk: MEDIUM — compose form state (body, ratingsMap, activeDimKey, submitting, submitErr,
                showDeleteConfirm, handleSubmit) belongs in useVportReviewMine or a dedicated
                useReviewComposeForm hook.
Suggested correction: Extract compose form local state into a new hook useVportReviewCompose.js
                      that lives alongside useVportReviewMine.js. View screen becomes pure composition.
```

### WARNING 2

```
MODULE BOUNDARY WARNING
Location: apps/VCSM/src/features/profiles/kinds/vport/screens/review/VportReviewsView.jsx:6
Module: profiles/kinds/vport/screens/review (View Screen layer)
Current dependency: import { useActorConsistencyCheck } from "@debuggers/identity/..."
Expected boundary: Debugger imports should be behind a dev-only conditional or not in view screens
Risk: LOW — debugger-stub is a no-op in prod, but the import pattern could be confused for
             production logic by future contributors.
Suggested correction: Wrap in DEV guard or remove if debugger stub is always safe.
```

### WARNING 3

```
MODULE BOUNDARY WARNING
Location: apps/VCSM/src/features/profiles/kinds/vport/dal/review/vportReviewAuthors.read.dal.js
Module: profiles/kinds/vport/dal/review
Current dependency: Imports from THREE Supabase clients (vcClient, supabaseClient, vportClient)
                    within a single DAL file. Queries vc.actors, public.profiles, vport.profiles,
                    identity.actor_directory.
Expected boundary: DAL should have a single client/schema responsibility. Multi-schema joining
                   belongs either in RPC or in a service layer.
Risk: HIGH — File also appears to be dead code (no consumers found). Multi-client pattern is
             architecturally risky if re-enabled.
Suggested correction: DELETE CANDIDATE — engine author cards path already handles this via
                       get_review_author_card SECURITY DEFINER RPC.
```

### WARNING 4

```
MODULE BOUNDARY WARNING
Location: apps/VCSM/src/features/profiles/kinds/vport/controller/review/VportServiceReviews.controller.js:52
Module: VportServiceReviews.controller
Current dependency: ctrlListServiceReviews calls ctrlListReviews(targetActorId, limit)
                    with positional args (limit as second arg), but ctrlListReviews
                    signature is ctrlListReviews(targetActorId, { limit, cursor })
Expected boundary: Controller calls should use named args as defined in the function signature.
Risk: LOW — ctrlListReviews accepts both shapes (destructure with default), but the positional
             call passes `limit` (number) as the options object, which evaluates to truthy but
             won't destructure correctly. result will be all reviews with default pagination.
Suggested correction: Fix call to ctrlListReviews(targetActorId, { limit: 50 })
```

---

## N+1 QUERY FINDINGS

### N+1: Author Cards on List Load

```
N+1 RISK
Location: engines/reviews/src/dal/authors.read.dal.js:dalGetAuthorCardsForReviews
Pattern: for (const reviewId of reviewIds) { supabase.rpc('get_review_author_card', ...) }
Risk: CRITICAL at scale — loading 25 reviews triggers 25 sequential RPC calls
Call Chain: ctrlListReviews → dalGetAuthorCardsForReviews → 25x get_review_author_card
Impact: Latency multiplied by review page size. At p25 = ~25 round trips before list renders.
Suggested fix: Create a batch RPC get_review_author_cards(p_review_ids UUID[]) that returns
               all author cards in a single call. CARNAGE owns the migration.
```

---

## DEAD CODE FINDINGS

### DEAD CODE 1 — App-Level Author Cards DAL

```
DEAD CODE FINDING
Location: apps/VCSM/src/features/profiles/kinds/vport/dal/review/vportReviewAuthors.read.dal.js
Code Type: DAL file (read)
Classification: CONFIRMED DEAD
Evidence: No import found from any active controller, hook, or adapter path.
          Engine's author card path (engines/reviews/src/dal/authors.read.dal.js) handles
          author enrichment via get_review_author_card RPC.
Risk: MEDIUM — file contains complex multi-client logic (3 Supabase clients); confusing for
               future contributors who may attempt to re-wire it.
Recommended action: DELETE CANDIDATE — verify no dynamic import before deletion
Recommended handoff: IRONMAN (ownership), LOKI (runtime verification)
```

### DEAD CODE 2 — App-Level Write DAL

```
DEAD CODE FINDING
Location: apps/VCSM/src/features/profiles/kinds/vport/dal/review/vportReviews.write.dal.js
Code Type: DAL file (write)
Classification: CONFIRMED DEAD
Evidence: No import found from any active controller path.
          VportReviews.controller.js uses engineSubmitReview from @reviews engine which
          flows through engines/reviews/src/dal/reviews.rpc.dal.js (upsert_neutral_review RPC).
Risk: HIGH — dead write DAL bypasses engine's upsert_neutral_review RPC; if accidentally
              re-wired it would create a second conflicting write path that skips engine guards.
Recommended action: DELETE CANDIDATE — highest priority dead code to remove
Recommended handoff: IRONMAN (ownership confirmation)
```

### DEAD CODE 3 — App-Level Review Model

```
DEAD CODE FINDING
Location: apps/VCSM/src/features/profiles/kinds/vport/model/review/VportReview.model.js
Code Type: Model file
Classification: CONFIRMED DEAD
Evidence: No import found from any active controller, hook, or adapter path.
          Engine models (Review.model.js, DimensionRating.model.js) handle row transforms.
          App controller uses vportReviews.mappers.js for shape mapping.
Risk: LOW — stale model creates confusion about which model is canonical.
Recommended action: DELETE CANDIDATE
Recommended handoff: IRONMAN
```

### DEAD CODE 4 — App-Level Dimension Config

```
DEAD CODE FINDING
Location: apps/VCSM/src/features/profiles/kinds/vport/config/reviewDimensions.config.js
Code Type: Config file
Classification: LIKELY DEAD
Evidence: getReviewDimensionsForVportType not imported by any active review controller or hook.
          Engine resolves dimensions from reviews.review_dimensions table.
          File contains hardcoded dimension sets that should match DB — divergence risk.
Risk: MEDIUM — if diverged from DB, any future accidental wiring would return wrong dimensions.
Recommended action: VERIFY USAGE — then DELETE CANDIDATE if confirmed orphaned
Recommended handoff: IRONMAN, CARNAGE (verify DB dimensions match)
```

### DEAD CODE 5 — Legacy submit() in useVportReviewMine

```
DEAD CODE FINDING
Location: apps/VCSM/src/features/profiles/kinds/vport/hooks/review/useVportReviewMine.js:84
Code Type: Hook function (export)
Classification: LIKELY DEAD
Evidence: VportReviewsView.jsx exclusively calls r.submitReview(...) — the newer multi-dimension
          submit path. The legacy submit() uses tab-aware single-dimension ratings which is
          incompatible with the compose form's normalizedRatings contract.
Risk: LOW — exported but unused by canonical view. Confusing API surface on hook.
Recommended action: VERIFY USAGE across all consumers, then remove if only legacy
Recommended handoff: IRONMAN
```

---

## SPAGHETTI SCORE

```
SPAGHETTI SCORE
Module: vcsm.vport-reviews-dashboard
Score: WATCH
Reasons:
  - View screen contains business state and async callbacks (boundary violation, medium)
  - Two identity import paths in same module (identityContext vs identity.adapter)
  - Dead code layer sitting alongside active engine-backed layer (DAL, model, config)
  - Dual submit functions on hook exposing both legacy and canonical paths
  - VportServiceReviews.controller incorrectly calls ctrlListReviews with positional args
Release risk: LOW-MEDIUM — core path is solid (engine-backed, RPC-driven). Risks are
              in dead code confusion and view screen boundary violation.
```

---

## CODE HEALTH METRICS

| Module | Files | Active Layers | Dead Code Files | N+1 Risks | Cross-Feature Imports | Spaghetti Score |
|---|---:|---:|---:|---:|---:|---|
| Reviews Dashboard (Entry) | 1 | 1 (screen) | 0 | 0 | 1 (via adapter — clean) | CLEAN |
| Reviews Core (profiles/vport) | 18 | 6 | 4 | 1 (engine N+1) | 2 (notifications, identity) | WATCH |
| Reviews Engine | 14 | 4 | 0 | 1 (author cards loop) | 0 | WATCH |

---

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P0 | Fix N+1 author card RPC (batch RPC) | 25 serial RPCs on every list load | CARNAGE + KRAVEN |
| P0 | Fix VportServiceReviews positional arg bug | ctrlListReviews called wrong; service reviews may silently return all reviews | SENTRY |
| P1 | Delete vportReviews.write.dal.js | Dead write DAL alongside active engine write path — dangerous if re-wired | IRONMAN |
| P1 | Delete vportReviewAuthors.read.dal.js | Dead multi-client DAL; misleading and confusing | IRONMAN |
| P1 | Delete VportReview.model.js | Dead legacy model | IRONMAN |
| P2 | Extract compose form state from VportReviewsView | View screen boundary violation — 6 useState + business callback | SENTRY |
| P2 | Remove legacy submit() from useVportReviewMine | Dual submit API; legacy path | IRONMAN |
| P2 | Add cache to ctrlListReviews / ctrlGetOfficialStats | Fresh DB on every mount | KRAVEN |
| P2 | Audit reviewDimensions.config.js (verify dead, then delete) | Hardcoded dimensions potentially diverged from DB | IRONMAN + CARNAGE |
| P3 | Align identity import paths in module | identityContext vs identity.adapter | SENTRY |
| P3 | Write Logan doc for reviews module | No canonical doc exists | LOGAN |
| P3 | Run VENOM review on upsert_neutral_review RPC scope | SECURITY DEFINER function — needs audit | VENOM |

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

Active data path is engine-backed, RPC-driven, and architecturally sound. The module has a
confirmed N+1 performance risk on every review list load, dead code legacy residue from
pre-engine migration, and a view screen boundary violation. None of these block basic
operation but all should be resolved before high-traffic exposure.

---

## ADDITIONAL FINDINGS (deep scan continuation)

### Security: isActorOwner Does Not Verify Session → Actor Ownership

```
Location: apps/VCSM/src/features/reviews/setup.js
Finding: The isActorOwner(actorId) function injected into the engine checks:
  1. Session exists ✓
  2. vc.actors has a row for actorId AND is_void=false ✓
  But it does NOT verify session.user.id → actor_owners → actorId.
  Any authenticated user passes this check for any existing actor.
  Real enforcement: upsert_neutral_review SECURITY DEFINER RPC at DB level.
Risk: HIGH if DB RPC does not enforce auth.uid() ownership — needs VENOM audit.
Recommended fix: Add actor_owners lookup to isActorOwner function.
Handoff: VENOM (P0)
```

### Duplicate Reads in Submit Path

```
ctrlSubmitReview calls:
  - ctrlGetReviewFormConfig(targetActorId)
      → dalReadReviewTargetActor (vc.actors read #1)
      → readVportTypeByActorId (vport.profiles read #1)
      → getReviewFormConfig engine (review_dimensions read #1)
  - Then IMMEDIATELY AGAIN:
      → readVportTypeByActorId (vport.profiles read #2 — DUPLICATE)
      → getReviewFormConfig engine (review_dimensions read #2 — DUPLICATE)
  Purpose: build keyToId map for dimensionKey → dimensionId
  Fix: Accept the dims result from ctrlGetReviewFormConfig (already has engine dims)
       and build keyToId from that, eliminating the second round of reads.
Handoff: KRAVEN
```

### Tab Filtering is Client-Side (Architectural Gap)

```
useVportReviewList filters the fetched 25-review page client-side for dimension tabs:
  list.filter(r => r.ratings.some(rt => rt.dimensionKey === tab))
This means dimension tabs only show reviews already in the current page window.
Reviews beyond cursor position that have ratings for a given dimension are invisible.
For vports with many reviews, dimension tabs silently show incomplete data.
Fix: Either pass tab/dimensionKey filter to ctrlListReviews for server-side filtering,
     or load all reviews (paginated) before tab filtering — but that is expensive.
Recommended: Server-side dimension filter via DB query param.
Handoff: CARNAGE (schema), SENTRY (controller boundary)
```

### Engine Events Are Emitted But Never Consumed

```
Reviews engine emits 5 events (REVIEW_CREATED, REVIEW_DELETED, RATINGS_UPSERTED, etc.)
Zero app code subscribes to any of these events.
Opportunity: Wire reviews.review_created → cache invalidation on vport profile
             Wire reviews.review_deleted → stats cache bust
             Wire to analytics/telemetry if VISION is active
Current state: Dead signal paths — capability exists but unused.
Handoff: IRONMAN (ownership decision), VISION (analytics potential)
```

---

## RECOMMENDED HANDOFFS

- **VENOM** — isActorOwner security gap (P0), upsert_neutral_review RPC audit, get_review_author_card SECURITY DEFINER audit, full RLS map review
- **KRAVEN** — N+1 author card RPC (25 RPCs per list page), duplicate reads in submit path, missing cache on auth path
- **CARNAGE** — Batch author card RPC migration (get_review_author_cards batch), client-side tab filter → server-side DB filter, dimension DB parity audit
- **IRONMAN** — Dead code ownership + deletion clearance (3 confirmed + 1 likely dead), engine event wiring decision
- **SENTRY** — View screen boundary violation (6 useState in view), service reviews positional arg bug, identity import alignment, client-side tab filtering fix
- **LOKI** — Runtime trace to confirm dead DAL files have zero prod invocations before deletion
- **LOGAN** — Module architecture docs now exist (dashboard module + QR system). Write a stable top-level Logan doc linking all sub-module docs once the module is fully hardened.
- **FALCON** — Native parity notes for review submit, edit, delete flows
- **THOR** — Reviews module should not be marked release-ready until VENOM audit and N+1 resolved
