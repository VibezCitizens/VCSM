# Dashboard Module Behavior Contract — reviews

Status: PARTIAL

Module: reviews

Parent Feature: dashboard

Category Key: dashboard

Created By Ticket: TICKET-BEHAV-DASHBOARD-BATCH-REVERSE-ENGINEER-0001

Last Updated: 2026-06-04

Current Security Status:
- THOR: CAUTION
- Open Findings:
  - REVIEWS-SPIDER-001
  - REVIEWS-RLS-001
  - REVIEWS-RPC-001
  - REVIEWS-SERVICE-FK-001
  - REVIEWS-ADAPTER-AUTH-001
  - REVIEWS-DASHBOARD-PUBLIC-MODE-001
  - REVIEWS-SERVICE-TAB-001
- Security Review Status:
  - VENOM: COMPLETE at dashboard matrix level; historical V-01/V-03 appear patched in current source, while V-02/V-04 provenance gaps remain open.
  - ELEKTRA: COMPLETE at dashboard matrix level; dashboard has no local mutation path, delegated source-to-sink path runs through profile review controllers and `@reviews`.
  - BLACKWIDOW: COMPLETE at dashboard matrix level; dashboard owner/public mode split verified, adapter/engine authorization remains the authoritative gate.

---

## 1. User Goal

The `reviews` dashboard module lets a VPORT owner inspect review quality signals, overall stats, service/dimension filters, and customer feedback from the owner dashboard. The same adapter view also supports public customer review compose/edit/delete behavior when rendered in public mode.

For the dashboard route, the primary owner goal is review management and analysis, not authoring reviews. Customers remain the authors of review content.

---

## 2. Actors / Roles

| Actor | Allowed Actions | Restrictions |
|---|---|---|
| VPORT owner actor | Open dashboard reviews, view aggregate stats, inspect review list, filter by overall/services/dimensions. | Must not compose or delete customer reviews from owner mode. Dashboard only passes `mode="owner"` after `useVportOwnership`. |
| Authenticated citizen user actor | In public mode, submit/update their own neutral review, rate dimensions, edit their active review, and delete their own review. | Must be `identity.kind === "user"`, must not review self, and must pass engine `isActorOwner(authorActorId)`. |
| Non-owner authenticated actor | On the dashboard reviews URL, current source renders the adapter in public mode and can compose only as their own user actor when eligible. | Must not receive owner-mode dashboard controls. This is current behavior, not a hard dashboard denial. |
| Anonymous visitor | Can view public review content if read policies allow it. | Cannot compose because there is no `reviewAuthorActorId`. |

---

## 3. Module Architecture

### Routes

- `/actor/:actorId/dashboard/reviews`
- `/vport/:actorId/dashboard/reviews` is a legacy redirect to `/actor/:actorId/dashboard/reviews`.
- No active standalone `/dashboard/reviews` route was found in the protected route table.
- Module README lists `/vport/reviews` and QR review link behavior for public review collection.

### Screens

- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/reviews/VportDashboardReviewScreen.jsx`
- Delegated adapter target: `apps/VCSM/src/features/profiles/kinds/vport/screens/review/VportReviewsView.jsx`
- Current dashboard screen combines route param handling, ownership mode selection, shell layout, desktop portal rendering, and adapter composition in one file.

### Hooks

- Dashboard shell: `useIdentity`, `useDesktopBreakpoint`, `useVportOwnership`
- Review adapter: `useVportReviews`, `useVportReviewCompose`, `useVportReviewList`, `useVportReviewMine`

### Controllers

- No dashboard-local reviews controller exists.
- Delegated app controllers:
  - `ctrlAssertReviewTargetActor`
  - `ctrlGetReviewFormConfig`
  - `ctrlGetOfficialStats`
  - `ctrlListReviews`
  - `ctrlSubmitReview`
  - `ctrlGetMyActiveReview`
  - `ctrlDeleteMyReview`
  - `ctrlListReviewServices`
  - `ctrlListServiceReviews`
- Engine controllers:
  - `getReviewFormConfig`
  - `getTargetStats`
  - `listReviews`
  - `submitReview`
  - `getMyActiveReview`
  - `deleteReview`

### DALs

- `dalReadReviewTargetActor`
- `readVportTypeByActorId`
- `readVportServicesByActor`
- `dalRpcUpsertNeutralReview`
- `dalRpcGetTargetOverallStats`
- `dalListReviewsByTarget`
- `dalGetActiveReviewByAuthor`
- `dalGetReviewById`
- `dalSoftDeleteReview`
- `dalUpsertDimensionRatings`
- `dalListDimensionRatingsByReviewIds`
- `dalListDimensionRatingsForReview`
- `dalListActiveDimensions`

### RPCs

- `reviews.upsert_neutral_review`
- `reviews.get_target_overall_stats`
- Historical Venom notes also reference `reviews.get_review_author_card`; current list path uses snapshot columns instead of per-review author RPC calls.

### Edge Functions

No edge function was found in the dashboard reviews source or delegated adapter path.

### Engine Dependencies

- Direct dependency on `@reviews` engine through `apps/VCSM/src/features/reviews/setup.js` and profile review controllers.
- Notification adapter dependency for owner notification after customer review creation.

### Ownership Gates

- Dashboard mode gate: `useVportOwnership(viewerActorId, targetActorId)` determines `mode="owner"` versus `mode="public"`.
- Current dashboard behavior does not deny non-owners after ownership resolves; it passes `mode="public"` to `VportReviewsView`.
- Customer author gate: `VportReviewsView` only allows compose when `identity.kind === "user"` and `reviewAuthorActorId !== targetActorId`.
- Engine author gate: `submitReview` and `deleteReview` call injected `isActorOwner(authorActorId)`.
- Current app setup implements `isActorOwner` by querying `vc.actor_owners` under session RLS.
- Delete gate also checks existing `author_actor_id === authorActorId`.
- DAL soft-delete and body update include `.eq("author_actor_id", authorActorId)`.

---

## 4. Happy Paths

### HP-001

BEH-DASH-reviews-001

Preconditions:

- Route includes `targetActorId`.
- Ownership check has completed.

Flow:

Owner opens dashboard reviews.
↓
`VportDashboardReviewScreen` resolves `targetActorId` and `viewerActorId`.
↓
`useVportOwnership` returns `isOwner`.
↓
Screen renders `VportReviewsView` with `mode="owner"`.
↓
`useVportReviews` asserts target actor, loads dimensions, official stats, services, active review list, and current user review state.
↓
Owner sees summary, tabs, filters, review list, and load-more behavior.

Expected Result:

Owner can inspect review quality and feedback without seeing customer compose controls.

Data Changes:

None.

---

### HP-001A

BEH-DASH-reviews-001A

Preconditions:

- Route includes `targetActorId`.
- Ownership check has completed.
- Viewer is not an owner.

Flow:

Non-owner opens dashboard reviews route.
↓
`VportDashboardReviewScreen` resolves `isOwner=false`.
↓
Screen renders `VportReviewsView` with `mode="public"`.
↓
If the active identity is a user actor and not the target actor, the adapter can render public compose/edit/delete affordances for that user's own review.

Expected Result:

Current source treats non-owner dashboard access as public review mode, not as a dashboard denial.

Data Changes:

Possible review submit/edit/delete writes if the public compose path is used.

---

### HP-002

BEH-DASH-reviews-002

Preconditions:

- Non-owner or public profile context renders review adapter with `mode="public"`.
- Authenticated identity is a user actor.
- User actor is not the target VPORT actor.

Flow:

Citizen opens reviews in public mode.
↓
`VportReviewsView` computes `canCompose`.
↓
`useVportReviewCompose` manages body, dimension ratings, active dimension, and submit state.
↓
Citizen submits ratings/body.
↓
`useVportReviewMine.submitReview` creates an optimistic review.
↓
`ctrlSubmitReview` validates author/target actors, citizen-only author, target VPORT, subtype, and rating dimensions.
↓
`@reviews.submitReview` checks `isActorOwner(authorActorId)`.
↓
Engine calls `reviews.upsert_neutral_review` and upserts dimension ratings.
↓
Controller maps result and publishes a `review_created` notification to the VPORT owner.

Expected Result:

The review is saved or updated, dimension ratings are stored, owner stats refresh, and the visible optimistic row is replaced with the saved review.

Data Changes:

- Upsert through `reviews.upsert_neutral_review`.
- Upsert into `reviews.review_dimension_ratings`.
- Notification side effect via notifications adapter.

---

### HP-003

BEH-DASH-reviews-003

Preconditions:

- Citizen has an active review for the target.
- Adapter is in public mode.

Flow:

Citizen selects edit.
↓
`useVportReviewMine.startEdit` sets editing mode.
↓
`useVportReviewCompose` prefills body and ratings from `myReview`.
↓
Citizen submits.
↓
Same submit path updates the active neutral review through the review RPC and ratings upsert.

Expected Result:

Citizen's active review is updated, not duplicated.

Data Changes:

- Upsert through `reviews.upsert_neutral_review`.
- Upsert into `reviews.review_dimension_ratings`.

---

### HP-004

BEH-DASH-reviews-004

Preconditions:

- Citizen has an active review.
- Delete confirmation modal is open.

Flow:

Citizen confirms deletion.
↓
`useVportReviewMine.deleteMyReview` calls `ctrlDeleteMyReview`.
↓
Engine `deleteReview` fetches the review, verifies stored author matches `authorActorId`, checks `isActorOwner(authorActorId)`, then soft-deletes.
↓
`dalSoftDeleteReview` updates `is_deleted` and `deleted_at` scoped by `id` and `author_actor_id`.
↓
Hook reloads review list and stats.

Expected Result:

Citizen's own review is soft-deleted and removed from the active list.

Data Changes:

- Update to `reviews.reviews`.

---

### HP-005

BEH-DASH-reviews-005

Preconditions:

- Reviews list has more than one page.

Flow:

User selects load more.
↓
`useVportReviewList.loadMore` calls `ctrlListReviews` with `nextCursor`.
↓
Engine lists reviews by target actor and cursor.
↓
Hook appends mapped rows.

Expected Result:

Additional active reviews append to the list.

Data Changes:

None.

---

### HP-006

BEH-DASH-reviews-006

Preconditions:

- Owner mode has at least one enabled service option.
- User selects the Services tab and a service ID.

Flow:

`useVportReviewList.loadActiveList` calls `ctrlListServiceReviews({ targetActorId, serviceId, limit: 50 })`.
↓
`ctrlListServiceReviews` calls `ctrlListReviews(targetActorId, { limit })`.
↓
Current source treats the returned `{ reviews, hasMore, nextCursor }` object as an array, so `list` becomes `[]`.

Expected Result:

Current service-specific tab can show an empty list even when overall reviews exist. This is stricter than the documented fallback intent.

Data Changes:

None.

---

## 5. Failure Paths

### FP-001

BEH-DASH-reviews-101

Trigger:

Route and props do not provide `targetActorId`.

Expected System Behavior:

Dashboard review screen returns `null`.

Expected UI Behavior:

No review content renders.

Expected Logging:

No logging found in source.

---

### FP-002

BEH-DASH-reviews-102

Trigger:

Dashboard ownership check is loading.

Expected System Behavior:

Screen waits before deciding owner/public mode.

Expected UI Behavior:

`SkeletonCardList` renders.

Expected Logging:

No logging found in source.

---

### FP-002A

BEH-DASH-reviews-102A

Trigger:

Dashboard ownership resolves non-owner.

Expected System Behavior:

Current dashboard source renders public review mode instead of denying access.

Expected UI Behavior:

Non-owner sees the public review adapter, including compose affordances when signed in as a user actor and eligible.

Expected Logging:

No logging found in source.

---

### FP-003

BEH-DASH-reviews-103

Trigger:

Target actor does not exist, is void, or is not a VPORT actor.

Expected System Behavior:

`ctrlAssertReviewTargetActor` or submit validation throws.

Expected UI Behavior:

`VportReviewsView` renders an error panel using `String(r.error?.message ?? r.error)`.

Expected Logging:

No logging found in source.

---

### FP-004

BEH-DASH-reviews-104

Trigger:

Public viewer is not signed in or active identity is not a user actor.

Expected System Behavior:

`canCompose` is false; compose submission path refuses without `reviewAuthorActorId`.

Expected UI Behavior:

Compose form receives `canCompose=false` and cannot submit a review.

Expected Logging:

No logging found in source.

---

### FP-005

BEH-DASH-reviews-105

Trigger:

Citizen attempts to review self.

Expected System Behavior:

Adapter prevents compose when `reviewAuthorActorId === targetActorId`; controllers also reject self-review.

Expected UI Behavior:

No valid compose path should complete.

Expected Logging:

No logging found in source.

---

### FP-006

BEH-DASH-reviews-106

Trigger:

Submit has no valid ratings or contains unknown/invalid dimension ratings.

Expected System Behavior:

Compose hook rejects empty rating submission; controller rejects unknown dimension keys and ratings outside 1-5.

Expected UI Behavior:

Submit error is stored in `submitErr`.

Expected Logging:

No logging found in source.

---

### FP-007

BEH-DASH-reviews-107

Trigger:

Engine `isActorOwner(authorActorId)` returns false.

Expected System Behavior:

Submit/delete controller rejects before review write/delete.

Expected UI Behavior:

Submit removes optimistic review and surfaces error through compose submit state. Delete stores error through review hook.

Expected Logging:

No logging found in source.

---

### FP-007A

BEH-DASH-reviews-107A

Trigger:

Owner selects Services tab and service-specific list code receives the current `{ reviews, hasMore, nextCursor }` controller result shape.

Expected System Behavior:

`ctrlListServiceReviews` returns an empty array because it uses `Array.isArray(rows)` on the controller result object.

Expected UI Behavior:

Services tab can display no reviews for the selected service.

Expected Logging:

No logging found in source.

---

### FP-008

BEH-DASH-reviews-108

Trigger:

Review RPC, direct DAL write, list, dimensions, or stats query fails.

Expected System Behavior:

DAL throws Supabase/RPC error.

Expected UI Behavior:

Core/list errors render in review error panel; load-more failures are swallowed and keep current list.

Expected Logging:

Engine DALs support optional trace reporting, but no dashboard trace reporter is configured in observed source.

---

## 6. Security Rules

### SEC-001

BEH-DASH-reviews-201

Rule:

Dashboard owner mode must be derived from actor ownership and must not be granted by route params alone.

Enforcement Layer:

`VportDashboardReviewScreen` with `useVportOwnership`.

Current Status:

SOURCE VERIFIED.

Finding Links:

- REVIEWS-ADAPTER-AUTH-001

---

### SEC-001A

BEH-DASH-reviews-201A

Rule:

Dashboard reviews route access must explicitly define whether non-owners are allowed to enter public review mode from the dashboard URL.

Enforcement Layer:

`VportDashboardReviewScreen`.

Current Status:

OPEN. Current source allows non-owner public mode from `/actor/:actorId/dashboard/reviews`; governance must confirm whether this is intended.

Finding Links:

- REVIEWS-DASHBOARD-PUBLIC-MODE-001

---

### SEC-002

BEH-DASH-reviews-202

Rule:

Owners must not author or delete customer reviews through owner dashboard mode.

Enforcement Layer:

`VportReviewsView` hides compose form when `mode === "owner"`.

Current Status:

SOURCE VERIFIED.

Finding Links:

- REVIEWS-SPIDER-001

---

### SEC-003

BEH-DASH-reviews-203

Rule:

Only user actors can submit reviews, and a user actor cannot review itself.

Enforcement Layer:

`VportReviewsView`, `ctrlSubmitReview`, and engine `submitReview`.

Current Status:

SOURCE VERIFIED.

Finding Links:

- REVIEWS-SPIDER-001

---

### SEC-004

BEH-DASH-reviews-204

Rule:

Review submit/delete must verify that the authenticated session owns the acting author actor.

Enforcement Layer:

Injected `isActorOwner` in `apps/VCSM/src/features/reviews/setup.js`; engine `submitReview` and `deleteReview`.

Current Status:

SOURCE VERIFIED as patched from historical V-01. Current setup queries `vc.actor_owners` under session RLS.

Finding Links:

- Historical V-01 — patched in current source.
- REVIEWS-ADAPTER-AUTH-001

---

### SEC-005

BEH-DASH-reviews-205

Rule:

Review delete must only affect the review row authored by the caller actor.

Enforcement Layer:

Engine `deleteReview` checks stored `author_actor_id`; `dalSoftDeleteReview` filters by `id` and `author_actor_id`.

Current Status:

SOURCE VERIFIED as patched from historical V-03.

Finding Links:

- Historical V-03 — patched in current source.

---

### SEC-006

BEH-DASH-reviews-206

Rule:

Database grants, RLS, and SECURITY DEFINER RPC bodies for reviews writes/stats must be tracked and auditable.

Enforcement Layer:

Database migrations/RLS/RPC provenance.

Current Status:

OPEN. Historical Venom V-02 and V-04 identify missing tracked migration evidence for write grants/RLS/RPC bodies.

Finding Links:

- REVIEWS-RLS-001
- REVIEWS-RPC-001
- Historical V-02
- Historical V-04

---

### SEC-007

BEH-DASH-reviews-207

Rule:

Service-specific review filtering must not claim strict service binding until `service_id` FK support exists.

Enforcement Layer:

`ctrlListServiceReviews` fallback behavior and pending CARNAGE migration.

Current Status:

OPEN. README names `DEFER-002` for `service_id` FK in `@reviews` engine schema. Current `ctrlListServiceReviews` also has a source bug: it expects an array but receives `{ reviews, hasMore, nextCursor }` from `ctrlListReviews`, so selected service lists can become empty.

Finding Links:

- REVIEWS-SERVICE-FK-001
- REVIEWS-SERVICE-TAB-001
- DEFER-002

---

## 7. Must Never Happen

### MNH-001

BEH-DASH-reviews-301

Invariant:

A VPORT owner must never be able to write, edit, or delete customer-authored reviews from dashboard owner mode.

Current Status:

SOURCE VERIFIED at UI mode layer; dashboard-local tests missing.

Related Findings:

- REVIEWS-SPIDER-001

Required Tests:

- TESTREQ-DASH-reviews-002

---

### MNH-002

BEH-DASH-reviews-302

Invariant:

An authenticated user must never submit a review as an actor they do not own.

Current Status:

SOURCE VERIFIED at current engine setup and submit controller; RLS/RPC provenance remains open.

Related Findings:

- REVIEWS-ADAPTER-AUTH-001
- REVIEWS-RLS-001
- REVIEWS-RPC-001

Required Tests:

- TESTREQ-DASH-reviews-003
- TESTREQ-DASH-reviews-007

---

### MNH-003

BEH-DASH-reviews-303

Invariant:

An authenticated user must never delete another actor's review.

Current Status:

SOURCE VERIFIED at engine controller and DAL layer; RLS/RPC provenance remains open.

Related Findings:

- REVIEWS-RLS-001

Required Tests:

- TESTREQ-DASH-reviews-004

---

### MNH-004

BEH-DASH-reviews-304

Invariant:

Review writes must never depend solely on dashboard owner/public mode or client-side checks.

Current Status:

PARTIAL. App-layer engine precheck exists; DB/RLS/RPC provenance remains open.

Related Findings:

- REVIEWS-RLS-001
- REVIEWS-RPC-001

Required Tests:

- TESTREQ-DASH-reviews-007

---

### MNH-005

BEH-DASH-reviews-305

Invariant:

Service-specific review dashboards must never hide or misclassify review data as service-bound when the schema does not provide strict service binding.

Current Status:

OPEN. Intended controller behavior says fallback to all reviews when no service binding exists, but current source can return an empty list because it mishandles `ctrlListReviews` result shape.

Related Findings:

- REVIEWS-SERVICE-FK-001
- REVIEWS-SERVICE-TAB-001
- DEFER-002

Required Tests:

- TESTREQ-DASH-reviews-006

---

### MNH-006

BEH-DASH-reviews-306

Invariant:

Non-owner public compose behavior must never be accidentally exposed from an owner-only route without an explicit product/security decision.

Current Status:

OPEN. Current source exposes public review mode from the dashboard reviews route for non-owners.

Related Findings:

- REVIEWS-DASHBOARD-PUBLIC-MODE-001

Required Tests:

- TESTREQ-DASH-reviews-008

---

## 8. Data Changes

| Surface | Read | Insert | Update | Delete |
|---|---|---|---|---|
| `vc.actors` | Yes via `dalReadReviewTargetActor`. | No. | No. | No. |
| `vc.actor_owners` | Yes via injected `isActorOwner`. | No. | No. | No. |
| VPORT type/services tables | Yes via `readVportTypeByActorId` and `readVportServicesByActor`. | No. | No. | No. |
| `reviews.review_dimensions` | Yes through engine form config. | No. | No. | No. |
| `reviews.reviews` | Yes list/get active/get by id. | Via `reviews.upsert_neutral_review` RPC. | Via `reviews.upsert_neutral_review` RPC and `dalSoftDeleteReview`. | Soft delete only via `is_deleted`/`deleted_at`. |
| `reviews.review_dimension_ratings` | Yes by review IDs. | Upsert via `dalUpsertDimensionRatings`. | Upsert via `dalUpsertDimensionRatings`. | Delete helper exists; no dashboard path observed. |
| Notifications | No read path observed. | `publishVcsmNotification` after review creation/update path. | No. | No. |

---

## 9. Side Effects

Notifications:

- `ctrlSubmitReview` calls `publishVcsmNotification` with kind `review_created` when a review is saved. Current source does this on submit/update path, not only first-time creation.

Analytics:

- No analytics side effect found.

Media:

- No media side effect found.

Exports:

- No export side effect found.

Jobs:

- No job dispatch found.

Cache:

- No dashboard reviews cache was found. Hooks reload active lists and stats after submit/delete.

Other:

- `useVportReviewMine.submitReview` inserts an optimistic review row into local UI state and removes it if submit fails.
- Engine emits review events such as `REVIEW_CREATED`, `REVIEW_DELETED`, and `RATINGS_UPSERTED`.

---

## 10. UI Outputs

Loading States:

- Dashboard ownership loading renders `SkeletonCardList`.
- Review list loading state is passed to `ReviewsList`.
- Service filter loading renders `Loading services...`.
- Compose and delete states use `submitting` and `isDeleting`.

Success States:

- Owner sees aggregate average, stars, review count, filters/tabs, and review list.
- Public citizen sees compose/edit/delete outcomes in the active review list.

Error States:

- Core/list errors render in a red review error panel.
- Compose errors are stored as `submitErr`.
- Delete errors are stored through `setError`.

Empty States:

- Review list and compose component own empty rendering; exact empty copy was not fully expanded in this pass.

Owner States:

- Owner mode shows Overall, Services when available, and dimension tabs.
- Owner mode hides compose form.

Public States:

- Public mode can show compose form for signed-in user actors and review list for all viewers allowed by data policy.
- Current dashboard route can enter this public state for non-owners after ownership resolves.

---

## 11. Acceptance Criteria

### AC-DASH-reviews-001

Requirement:

Dashboard reviews route resolves target actor and waits for ownership loading before rendering owner/public mode.

Evidence:

`VportDashboardReviewScreen.jsx` uses route params, `useVportOwnership`, and `SkeletonCardList`.

Status:

DRAFT

---

### AC-DASH-reviews-002

Requirement:

Owner mode renders review stats, tabs, service/dimension filters, and review list without compose controls.

Evidence:

`VportReviewsView.jsx` uses `isOwnerMode` to show owner tabs and hide `VportReviewComposeForm`.

Status:

DRAFT

---

### AC-DASH-reviews-003

Requirement:

Public user actors can submit a review only for a VPORT target they do not own as themselves.

Evidence:

`VportReviewsView`, `ctrlSubmitReview`, and engine `submitReview` enforce user-kind author, target VPORT, no self-review, and `isActorOwner`.

Status:

DRAFT

---

### AC-DASH-reviews-004

Requirement:

Review deletion only soft-deletes the caller actor's own review.

Evidence:

Engine `deleteReview` checks stored `author_actor_id`; `dalSoftDeleteReview` filters by review ID and author actor ID.

Status:

DRAFT

---

### AC-DASH-reviews-005

Requirement:

Review schema write/RPC/RLS provenance must be verified before THOR CLEAR.

Evidence:

Historical Venom findings V-02 and V-04 remain open by documentation evidence.

Status:

DRAFT / OPEN

---

### AC-DASH-reviews-006

Requirement:

Services tab must either truthfully show service-bound reviews or clearly avoid hiding all reviews while service FK support is deferred.

Evidence:

Current `ctrlListServiceReviews` calls `ctrlListReviews` but mishandles the returned object shape.

Status:

DRAFT / OPEN

---

### AC-DASH-reviews-007

Requirement:

Non-owner behavior on dashboard reviews route must be approved as public review mode or changed to dashboard denial.

Evidence:

`VportDashboardReviewScreen.jsx` passes `mode={isOwner ? "owner" : "public"}`.

Status:

DRAFT / OPEN

---

## 12. Test Requirements

### TESTREQ-DASH-reviews-001

Validates:

Dashboard route shows skeleton while ownership is loading and passes correct owner/public mode after resolution.

Type:

SPIDER-MAN dashboard integration test.

Status:

MISSING

---

### TESTREQ-DASH-reviews-002

Validates:

Owner mode hides compose/delete authoring controls and only exposes owner review management/analysis UI.

Type:

SPIDER-MAN dashboard component test.

Status:

MISSING

---

### TESTREQ-DASH-reviews-003

Validates:

Submit rejects non-user actors, self-review, invalid dimensions, invalid ratings, and unowned author actors.

Type:

Controller/engine security unit test.

Status:

MISSING

---

### TESTREQ-DASH-reviews-004

Validates:

Delete rejects attempts to delete a review not authored by the caller actor.

Type:

Controller/DAL security unit test.

Status:

MISSING

---

### TESTREQ-DASH-reviews-005

Validates:

Submit success upserts review, upserts dimension ratings, replaces optimistic UI row, reloads stats, and publishes owner notification.

Type:

Integration test.

Status:

MISSING

---

### TESTREQ-DASH-reviews-006

Validates:

Service tab behavior is explicit while `service_id` FK is deferred and does not falsely hide all reviews.

Type:

Controller/UI regression test.

Status:

MISSING

---

### TESTREQ-DASH-reviews-007

Validates:

`reviews.reviews`, review dimension ratings, and reviews RPCs are protected by tracked RLS/grants/RPC definitions.

Type:

DB/RLS/RPC provenance test.

Status:

MISSING

---

### TESTREQ-DASH-reviews-008

Validates:

Non-owner access to `/actor/:actorId/dashboard/reviews` either intentionally renders public review mode or is denied according to the approved product/security decision.

Type:

Dashboard route security/product behavior test.

Status:

MISSING

---

## 13. Security Findings Linked

| Finding ID | Severity | Status | Related Behavior IDs |
|---|---|---|---|
| REVIEWS-SPIDER-001 | MEDIUM | OPEN | BEH-DASH-reviews-001 through BEH-DASH-reviews-006 |
| REVIEWS-RLS-001 | HIGH | OPEN | BEH-DASH-reviews-206, BEH-DASH-reviews-302, BEH-DASH-reviews-304 |
| REVIEWS-RPC-001 | HIGH | OPEN | BEH-DASH-reviews-206, BEH-DASH-reviews-304 |
| REVIEWS-SERVICE-FK-001 | MEDIUM | OPEN | BEH-DASH-reviews-207, BEH-DASH-reviews-305 |
| REVIEWS-ADAPTER-AUTH-001 | MEDIUM | OPEN UNTIL TESTED | BEH-DASH-reviews-201, BEH-DASH-reviews-204 |
| REVIEWS-DASHBOARD-PUBLIC-MODE-001 | MEDIUM | OPEN | BEH-DASH-reviews-201A, BEH-DASH-reviews-306 |
| REVIEWS-SERVICE-TAB-001 | MEDIUM | OPEN | BEH-DASH-reviews-006, BEH-DASH-reviews-207, BEH-DASH-reviews-305 |
| V-01 | HIGH | PATCHED IN CURRENT SOURCE | BEH-DASH-reviews-204 |
| V-02 | HIGH | OPEN | BEH-DASH-reviews-206 |
| V-03 | MEDIUM | PATCHED IN CURRENT SOURCE | BEH-DASH-reviews-205 |
| V-04 | LOW/MEDIUM | OPEN | BEH-DASH-reviews-206 |
| DEFER-002 | MEDIUM | DEFERRED | BEH-DASH-reviews-207, BEH-DASH-reviews-305 |

---

## 14. THOR Release Gates

| Gate | Status | Blocking? |
|---|---|---|
| Dashboard module inventory classification | COMPLETE | No |
| VENOM coverage | COMPLETE | No |
| ELEKTRA coverage | COMPLETE | No |
| BLACKWIDOW coverage | COMPLETE | No |
| BEHAVIOR.md contract | DRAFT | No |
| Dashboard-local SPIDER-MAN tests | MISSING | Yes for CLEAR |
| Engine controller/security tests | MISSING | Yes for CLEAR |
| Reviews RLS/grants/RPC provenance | OPEN | Yes for CLEAR |
| `service_id` FK migration for strict service reviews | DEFERRED | Yes for exact service-filter claims |
| Services tab result-shape bug | OPEN | Yes for service-tab approval |
| Non-owner dashboard public-mode decision | OPEN | Yes for route behavior approval |

---

## 15. Native / Alternate UI Parity

| Behavior | Native Equivalent | Status |
|---|---|---|
| Owner review stats and filters | Not found in source. | MISSING SOURCE |
| Public review compose/edit/delete | Not found in source. | MISSING SOURCE |
| QR review link flow | Mentioned by README, not source-verified in this pass. | PARTIAL |

---

## 16. Engine Dependencies

| Engine | Purpose | Status |
|---|---|---|
| `@reviews` | Review dimensions, stats, list, submit, active review, delete. | SOURCE VERIFIED |
| Reviews engine config | Injects Supabase client and actor-owner resolver. | SOURCE VERIFIED |
| Notifications adapter | Publishes `review_created` notification to VPORT actor. | SOURCE VERIFIED |
| VPORT services DAL | Provides service filter options. | SOURCE VERIFIED |

---

## 17. Open Questions

| ID | Question | Status |
|---|---|---|
| OQ-DASH-reviews-001 | Are `reviews.upsert_neutral_review` and `reviews.get_target_overall_stats` SQL bodies tracked and reviewed outside the current migration set? | OPEN |
| OQ-DASH-reviews-002 | Are current live RLS policies/grants for `reviews.reviews` and `reviews.review_dimension_ratings` equivalent to the intended security contract? | OPEN |
| OQ-DASH-reviews-003 | Should owner dashboard mode include moderation controls, or is it intentionally read-only analytics/list management? | OPEN |
| OQ-DASH-reviews-004 | Should service-tab UI copy disclose that strict service binding is deferred until `DEFER-002` lands? | OPEN |
| OQ-DASH-reviews-005 | Should load-more failures surface a visible error instead of silently keeping the current list? | OPEN |
| OQ-DASH-reviews-006 | Should `/actor/:actorId/dashboard/reviews` deny non-owners, or is public review compose intentionally allowed from this dashboard route? | OPEN |
| OQ-DASH-reviews-007 | Should `ctrlListServiceReviews` unwrap `ctrlListReviews(...).reviews` before applying service-binding fallback? | OPEN |

---

## 18. Confidence Review

| Section | Confidence | Source Verified |
|---|---|---|
| User Goal | HIGH | Yes: dashboard screen, review adapter, module README/status. |
| Actors / Roles | HIGH | Yes: owner/public mode and author guards. |
| Module Architecture | HIGH | Yes: source paths and engine imports. |
| Happy Paths | HIGH | Yes: hooks/controllers/DALs. |
| Failure Paths | MEDIUM | Yes for controller/hook errors; component-level exact copy not fully expanded. |
| Security Rules | HIGH | Yes for app source; DB/RPC provenance and route public-mode decision remain open. |
| Data Changes | HIGH | Yes: engine DALs and RPC DALs. |
| Side Effects | HIGH | Yes: notification, optimistic UI, engine events. |
| UI Outputs | MEDIUM | Primary outputs verified; nested component copy not fully expanded. |
| Acceptance Criteria | HIGH | Yes: source mapped. |
| Test Requirements | HIGH | Yes: test search found no matching test/spec files. |
| Native / Alternate UI Parity | LOW | No native source found; QR flow not traced in this pass. |
| Engine Dependencies | HIGH | Yes: `@reviews` setup and controllers. |
| Open Questions | HIGH | Yes: derived from source and governance gaps. |

---

## 19. Command Sign-Off

ARCHITECT: PARTIAL — dashboard shell, adapter boundary, and engine path mapped.

VENOM: COMPLETE — dashboard matrix says complete; historical V-01/V-03 patched in current source, V-02/V-04 remain provenance gates.

ELEKTRA: COMPLETE — no local dashboard mutation path; delegated engine write path mapped.

BLACKWIDOW: COMPLETE — owner/public mode and author ownership gates verified at source level; DB/RPC verification still required.

SPIDER-MAN: NOT_RUN — no review dashboard/engine tests found by source search.

PROFESSOR X: DRAFT — behavior contract reverse-engineered from source.

THOR: CAUTION — not clear until tests, DB/RPC provenance, service-tab behavior, and non-owner dashboard route behavior close.

---

## 13. Known Gaps (ARCHITECT Wave 2026-06-05)

| Gap | Severity | Finding | Handoff |
|---|---|---|---|
| Reviews screen data source is UNKNOWN — reviews engine delegation not confirmed | CRITICAL | ARCHITECT_VERIFIED | IRONMAN |
| No controller, DAL, hook, or model in reviews card — pure shell | HIGH | ARCHITECT_VERIFIED | IRONMAN |
| Reviews engine dependency not documented at module level | MEDIUM | ARCHITECT_VERIFIED | IRONMAN |
| No tests | MEDIUM | ARCHITECT_VERIFIED | SPIDER-MAN |
| No native parity notes | LOW | ARCHITECT_VERIFIED | Falcon |

Regression coverage: MISSING — SPIDER-MAN required. Zero test files in reviews card module.

Ownership enforcement: No write surfaces in reviews card. Read path ownership: UNKNOWN — delegated to reviews engine (unconfirmed).

---

## 14. Validation Sources

- ARCHITECTURE.md: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/reviews/ARCHITECTURE.md (2026-06-05)
- Feature BEHAVIOR.md: ZZnotforproduction/APPS/VCSM/features/dashboard/BEHAVIOR.md §5 (route: /actor/:actorId/dashboard/reviews), §7 (card reads: reviewer summaries via engines/review adapter)
- Feature SECURITY.md: ZZnotforproduction/APPS/VCSM/features/dashboard/SECURITY.md
- ARCHITECT wave report: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/ARCHITECT_WAVE_REPORT_2026_06_05.md
- Ticket: TICKET-LOGAN-DASHBOARD-MODULE-BEHAVIOR-WAVE-0001

---

Final Verdict:

BEHAVIOR_PARTIAL — Reviews card is a delegation shell. Feature BEHAVIOR.md states reviews engine adapter is the data source, but this is not confirmed at card module level. IRONMAN verification required.
