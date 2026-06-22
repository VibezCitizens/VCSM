# Dashboard Module Behavior Contract — locksmith

Status: PARTIAL

Module: locksmith

Parent Feature: dashboard

Category Key: dashboard

Created By Ticket: TICKET-BEHAV-DASHBOARD-BATCH-REVERSE-ENGINEER-0001

Last Updated: 2026-06-04

Current Security Status:
- THOR: CAUTION
- Open Findings:
  - LOCKSMITH-SPIDER-001
  - LOCKSMITH-RLS-001
  - LOCKSMITH-OWNER-001
  - LOCKSMITH-LIFECYCLE-001
  - LOCKSMITH-TRIPOINT-001
  - LOCKSMITH-FINALVIEW-001
  - LOCKSMITH-PROFILE-ERROR-001
- Security Review Status:
  - VENOM: COMPLETE at dashboard matrix level; delegated profile adapter write surfaces remain caution-gated.
  - ELEKTRA: COMPLETE at dashboard matrix level; source-to-sink path is delegated through locksmith profile controllers/DALs.
  - BLACKWIDOW: COMPLETE at dashboard matrix level; current source has controller ownership checks for service area writes and feed publish.

---

## 1. User Goal

The `locksmith` dashboard module lets a locksmith VPORT owner manage service coverage areas, review locksmith-specific service metadata, identify enabled services that still need locksmith detail configuration, and optionally publish service area updates to the feed.

The module solves the operational problem of keeping public locksmith coverage, ETA, emergency availability, and service metadata accurate for customers and external consumers linked to the locksmith VPORT.

---

## 2. Actors / Roles

| Actor | Allowed Actions | Restrictions |
|---|---|---|
| VPORT owner actor | Open the locksmith dashboard card, view service areas/details/gap services, add service areas, update service areas, delete service areas, optionally publish service area updates to feed. | Must pass `useVportOwnership(viewerActorId, targetActorId)` at dashboard screen and delegated controller ownership checks before writes. |
| Non-owner authenticated actor | No dashboard locksmith management actions. | Screen returns `Owner access only.` when `isOwner` is false. |
| Public visitor | No dashboard card access. | Public locksmith profile behavior is outside this dashboard screen, but uses related profile data surfaces. |
| External business site / TriPoint integration | May consume VPORT-linked locksmith data through external integration surfaces. | Must not rely on dashboard-only UI ownership gates; requires separate integration and exposure review. |

---

## 3. Module Architecture

### Routes

- `/actor/:actorId/dashboard/locksmith`
- No active `/dashboard/locksmith` route was found in the protected route table.
- No active `/vport/:actorId/dashboard/locksmith` legacy redirect was found in the protected route table.
- Module README lists `/vport/locksmith` as the locksmith profile route; this is linked profile behavior, not the dashboard owner card route.

### Screens

- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/locksmith/VportDashboardLocksmithScreen.jsx`
- Current dashboard screen combines route param handling, identity/ownership gating, hook orchestration, add/edit/delete handlers, feed-share orchestration, desktop portal rendering, and UI composition in one file.

### Hooks

- `useIdentity`
- `useDesktopBreakpoint`
- `useVportOwnership`
- `useLocksmithProfile`
- `useLocksmithOwner`
- `usePublishLocksmithPost`

### Controllers

No dashboard-local locksmith controller exists. The dashboard delegates behavior through profile adapters to:

- `getLocksmithProfileController`
- `ctrlAddServiceArea`
- `ctrlUpdateServiceArea`
- `ctrlDeleteServiceArea`
- `ctrlSaveServiceDetail`
- `ctrlSavePortfolioDetail`
- `publishLocksmithServiceAreaUpdateAsPostController`
- Related publish controllers for locksmith hours and portfolio are exposed by the same publish hook but are not invoked by this dashboard screen.

### DALs

No dashboard-local locksmith DAL exists. Delegated DAL surfaces include:

- `dalListLocksmithServiceAreas`
- `dalInsertLocksmithServiceArea`
- `dalUpdateLocksmithServiceArea`
- `dalDeleteLocksmithServiceArea`
- `dalListLocksmithServiceDetails`
- `dalUpsertLocksmithServiceDetail`
- `dalDeleteLocksmithServiceDetail`
- `dalUpsertLocksmithPortfolioDetail`
- `readVportServicesByActor`
- `resolveVportLocksmithNameDAL`
- `hasRecentLocksmithServiceAreaPostDAL`

### RPCs

No RPC was found in the dashboard locksmith screen or delegated locksmith service area path.

### Edge Functions

No edge function was found in the dashboard locksmith screen or delegated locksmith service area path.

### Engine Dependencies

No direct engine import was found in the dashboard locksmith card. The module depends on dashboard shell/shared hooks and profile adapters.

### Ownership Gates

- Dashboard UI gate: `useVportOwnership(viewerActorId, targetActorId)`.
- Service area write gate: `assertActorOwnsVportActorController({ requestActorId: identityActorId, targetActorId: actorId })`.
- Feed publish gate: `assertActorOwnsVportActorController({ requestActorId: identityActorId, targetActorId: actorId })`.
- Acting-as-VPORT caveat: `useLocksmithOwner` resolves a user requester with `availableActors?.find((a) => a.kind === "user")`, while current identity metadata elsewhere uses `actorKind`. `usePublishLocksmithPost` uses `actorKind`, so owner CRUD and feed publish do not resolve acting-as-VPORT identity the same way.
- DAL update/delete scoping: `locksmith_service_areas` update/delete filters by both `id` and `actor_id`.

---

## 4. Happy Paths

### HP-001

BEH-DASH-locksmith-001

Preconditions:

- `targetActorId` exists in route params.
- Viewer identity has an actor ID.
- `useVportOwnership(viewerActorId, targetActorId)` returns owner access.

Flow:

User opens the locksmith dashboard route.
↓
`VportDashboardLocksmithScreen` resolves target and viewer actor IDs.
↓
`useVportOwnership` checks dashboard owner state.
↓
`useLocksmithProfile(targetActorId, "locksmith")` calls `getLocksmithProfileController`.
↓
Controller reads service areas, service details, and enabled services.
↓
Screen renders service area cards, service detail rows, gap services, and quick summary counts.

Expected Result:

The owner sees current locksmith service areas, configured service details, services that still need details, and summary counts.

Data Changes:

None.

---

### HP-002

BEH-DASH-locksmith-002

Preconditions:

- Owner has passed dashboard owner gate.
- Add service area form is open.
- Required actor IDs are available to `useLocksmithOwner`.

Flow:

Owner selects `Add service area`.
↓
`AreaForm` collects label, city/state/ZIP/radius, ETA, travel fee, emergency flag, and optional share-to-feed consent.
↓
`handleAddArea` calls `owner.addArea(area)`.
↓
`useLocksmithOwner` calls `ctrlAddServiceArea(identityActorId, actorId, area)`.
↓
Controller asserts actor ownership.
↓
`dalInsertLocksmithServiceArea` inserts into `locksmith_service_areas`.
↓
Hook invalidates locksmith profile cache and calls `reload`.
↓
Screen closes add form and renders refreshed data.

Expected Result:

The new service area appears in the dashboard after successful insert and reload.

Data Changes:

- Insert into `vport.locksmith_service_areas`.

Current Caveat:

If the active identity is VPORT-kind, current owner CRUD may fail before the controller write because `useLocksmithOwner` looks for `availableActors[].kind === "user"` instead of the `actorKind` field used by the identity context.

---

### HP-003

BEH-DASH-locksmith-003

Preconditions:

- Owner has passed dashboard owner gate.
- Existing service area is selected for edit.

Flow:

Owner selects edit on an existing service area.
↓
`AreaForm` opens with existing values.
↓
Owner submits updates.
↓
`handleUpdateArea` calls `owner.updateArea(editingArea.id, area)`.
↓
`ctrlUpdateServiceArea` validates `identityActorId`, `actorId`, and `areaId`.
↓
Controller asserts actor ownership.
↓
`dalUpdateLocksmithServiceArea(areaId, actorId, row)` updates a row scoped by `id` and `actor_id`.
↓
Hook invalidates cache and calls `reload`.
↓
Screen clears edit state.

Expected Result:

The updated service area appears in the refreshed service area list.

Data Changes:

- Update to `vport.locksmith_service_areas`.

---

### HP-004

BEH-DASH-locksmith-004

Preconditions:

- Owner has passed dashboard owner gate.
- Existing service area is visible.

Flow:

Owner selects delete on an existing service area.
↓
`handleDeleteArea` sets `deletingAreaId`.
↓
`owner.deleteArea(areaId)` calls `ctrlDeleteServiceArea`.
↓
Controller validates actor IDs and area ID.
↓
Controller asserts actor ownership.
↓
`dalDeleteLocksmithServiceArea(areaId, actorId)` deletes a row scoped by `id` and `actor_id`.
↓
Hook invalidates cache and calls `reload`.
↓
Screen clears deleting state.

Expected Result:

The deleted service area is removed from the refreshed list.

Data Changes:

- Delete from `vport.locksmith_service_areas`.

---

### HP-005

BEH-DASH-locksmith-005

Preconditions:

- Owner has passed dashboard owner gate.
- Add or update service area succeeds.
- Owner checked the share-to-feed consent option.

Flow:

Successful add/update flow completes.
↓
`handleAddArea` or `handleUpdateArea` calls `publishServiceAreaPost(area)`.
↓
`usePublishLocksmithPost` resolves `identityActorId`.
↓
`publishLocksmithServiceAreaUpdateAsPostController` validates actor IDs.
↓
Controller asserts actor ownership.
↓
Controller checks public realm and recent post deduplication.
↓
Controller sanitizes area text and calls `createSystemPost`.

Expected Result:

When realm and dedup checks allow it, a `locksmith_service_area_update` post is created. When dedup throttles the request, the publish result is skipped without undoing the service area write.

Data Changes:

- Optional insert into `vc.posts` through `createSystemPost`.

Current Caveat:

The dashboard ignores the publish result and catches publish errors silently after the area write succeeds; there is no visible shared/skipped/failed state.

---

## 5. Failure Paths

### FP-001

BEH-DASH-locksmith-101

Trigger:

Route params do not include `actorId`.

Expected System Behavior:

`VportDashboardLocksmithScreen` returns `null`.

Expected UI Behavior:

No locksmith dashboard content renders.

Expected Logging:

No logging found in source.

---

### FP-002

BEH-DASH-locksmith-102

Trigger:

`useVportOwnership` returns `isOwner` false.

Expected System Behavior:

The screen does not render owner management controls.

Expected UI Behavior:

Screen displays `Owner access only.`

Expected Logging:

No logging found in source.

---

### FP-003

BEH-DASH-locksmith-103

Trigger:

Profile data is loading.

Expected System Behavior:

`useLocksmithProfile` returns `loading`.

Expected UI Behavior:

Service area skeleton rows render while profile data loads.

Expected Logging:

No logging found in source.

---

### FP-003A

BEH-DASH-locksmith-103A

Trigger:

`useLocksmithProfile` catches a profile read error while loading service areas/details/gap services.

Expected System Behavior:

The hook stores `error`, leaves the current arrays as-is or empty, and stops loading.

Expected UI Behavior:

Current dashboard source does not render `useLocksmithProfile.error`; the user sees empty/stale sections rather than a read-error panel.

Expected Logging:

No logging found in source.

---

### FP-004

BEH-DASH-locksmith-104

Trigger:

`identityActorId`, `actorId`, or `areaId` is missing during service area mutation.

Expected System Behavior:

Delegated controller throws an error such as `[Locksmith] identityActorId required`, `[Locksmith] actorId required`, or `[Locksmith] areaId required`.

Expected UI Behavior:

`useLocksmithOwner` stores the thrown error and the screen renders an error panel using the error message/details/hint. The screen handler catches and swallows the thrown error after the hook stores it.

Expected Logging:

No logging found in source.

---

### FP-005

BEH-DASH-locksmith-105

Trigger:

Controller ownership assertion fails during service area write or feed publish.

Expected System Behavior:

`assertActorOwnsVportActorController` rejects before DAL write or post creation.

Expected UI Behavior:

Service area writes surface through `owner.error`. Feed publish errors are swallowed after successful service area writes.

Expected Logging:

No logging found in source for swallowed publish errors.

---

### FP-006

BEH-DASH-locksmith-106

Trigger:

DAL insert/update/delete returns a Supabase error.

Expected System Behavior:

DAL throws the Supabase error.

Expected UI Behavior:

`owner.error` is rendered in the red error panel.

Expected Logging:

No logging found in source.

---

### FP-007

BEH-DASH-locksmith-107

Trigger:

Owner checks share-to-feed but public realm is unavailable or a recent locksmith service area post already exists.

Expected System Behavior:

Publish controller returns `{ published: false, status: "skipped", reason: "missing_public_realm" }` or `{ published: false, status: "skipped", reason: "throttled" }`.

Expected UI Behavior:

No explicit feed-publish success or skipped state is displayed by this dashboard screen.

Expected Logging:

No logging found in source.

---

### FP-008

BEH-DASH-locksmith-108

Trigger:

Owner is acting as a VPORT identity and attempts service area add/update/delete.

Expected System Behavior:

`useLocksmithOwner` may fail to resolve a user-kind requester because it searches `availableActors` by `kind`; if no `identityActorId` is found, delegated controllers throw `[Locksmith] identityActorId required`.

Expected UI Behavior:

The owner error panel renders the saved hook error, but no route-level identity correction happens.

Expected Logging:

No logging found in source.

---

## 6. Security Rules

### SEC-001

BEH-DASH-locksmith-201

Rule:

Only actor owners may access the locksmith dashboard management controls.

Enforcement Layer:

Dashboard screen via `useVportOwnership`.

Current Status:

SOURCE VERIFIED. Ownership loading behavior is not explicitly handled by this screen.

Finding Links:

- LOCKSMITH-FINALVIEW-001

---

### SEC-002

BEH-DASH-locksmith-202

Rule:

Service area insert/update/delete must require a caller identity actor and must verify that caller owns the target VPORT actor before any write.

Enforcement Layer:

Profile controller via `assertActorOwnsVportActorController`.

Current Status:

SOURCE VERIFIED in current `locksmithOwner.controller.js`.

Finding Links:

- Historical BW-LOCK-001 appears patched in current source for service area update/delete.

---

### SEC-003

BEH-DASH-locksmith-203

Rule:

Service area update/delete DAL calls must be scoped to both the target row ID and target actor ID.

Enforcement Layer:

DAL filters on `id`/`areaId` and `actor_id`.

Current Status:

SOURCE VERIFIED for `dalUpdateLocksmithServiceArea` and `dalDeleteLocksmithServiceArea`.

Finding Links:

- LOCKSMITH-RLS-001 remains open for database policy verification.

---

### SEC-004

BEH-DASH-locksmith-204

Rule:

Feed publish actions must require actor ownership and must not create duplicate service area update posts inside the dedup window.

Enforcement Layer:

`publishLocksmithServiceAreaUpdateAsPostController`, `hasRecentLocksmithServiceAreaPostDAL`, and `createSystemPost`.

Current Status:

SOURCE VERIFIED. Profile-layer tests cover service-area publish ownership and portfolio dedup behavior; service-area dedup itself is not directly asserted.

Finding Links:

- LOCKSMITH-SPIDER-001

---

### SEC-005

BEH-DASH-locksmith-205

Rule:

Public or external locksmith reads must not expose deleted/inactive VPORT data or private owner-only fields through direct controller calls.

Enforcement Layer:

Profile shell lifecycle gate is documented, but `getLocksmithProfileController` directly reads locksmith tables by `actorId`.

Current Status:

OPEN. Historical BlackWidow finding `BW-LOCK-002` flagged deleted VPORT lifecycle bypass in direct locksmith reads; current direct controller still has no visible lifecycle gate in this pass.

Finding Links:

- LOCKSMITH-LIFECYCLE-001
- BW-LOCK-002
- LOCKSMITH-TRIPOINT-001

---

### SEC-006

BEH-DASH-locksmith-206

Rule:

The hook identity actor resolution must consistently find a user actor when the active identity is a VPORT actor.

Enforcement Layer:

`useLocksmithOwner` and `usePublishLocksmithPost`.

Current Status:

OPEN. Current identity metadata uses `actorKind`; `useLocksmithOwner` searches `availableActors` by `a.kind === "user"`, while `usePublishLocksmithPost` searches by `a.actorKind === "user"`.

Finding Links:

- LOCKSMITH-OWNER-001

---

### SEC-007

BEH-DASH-locksmith-207

Rule:

Profile read failures must not be invisible in the owner dashboard.

Enforcement Layer:

`useLocksmithProfile` and `VportDashboardLocksmithScreen`.

Current Status:

OPEN. The hook stores read errors, but the dashboard screen does not read or render that error.

Finding Links:

- LOCKSMITH-PROFILE-ERROR-001

---

## 7. Must Never Happen

### MNH-001

BEH-DASH-locksmith-301

Invariant:

A non-owner must never add, update, or delete another actor's locksmith service areas.

Current Status:

SOURCE VERIFIED at controller and DAL levels for current service area writes; database RLS verification remains open.

Related Findings:

- LOCKSMITH-RLS-001

Required Tests:

- TESTREQ-DASH-locksmith-002
- TESTREQ-DASH-locksmith-003

---

### MNH-002

BEH-DASH-locksmith-302

Invariant:

A non-owner must never publish a locksmith service area feed post for another actor.

Current Status:

SOURCE VERIFIED in controller and profile-layer publish tests.

Related Findings:

- LOCKSMITH-SPIDER-001

Required Tests:

- TESTREQ-DASH-locksmith-004

---

### MNH-003

BEH-DASH-locksmith-303

Invariant:

Deleting or updating a service area must never target a row outside the current `actorId`.

Current Status:

SOURCE VERIFIED. DAL update/delete include actor ID filters.

Related Findings:

- LOCKSMITH-RLS-001

Required Tests:

- TESTREQ-DASH-locksmith-003

---

### MNH-004

BEH-DASH-locksmith-304

Invariant:

A deleted or inactive locksmith VPORT must never have service areas, pricing, verification requirements, or ETA metadata exposed through a direct profile-data read.

Current Status:

OPEN. Historical BlackWidow notes identify a lifecycle gate gap in direct locksmith profile reads.

Related Findings:

- BW-LOCK-002
- LOCKSMITH-LIFECYCLE-001
- LOCKSMITH-TRIPOINT-001

Required Tests:

- TESTREQ-DASH-locksmith-006

---

### MNH-005

BEH-DASH-locksmith-305

Invariant:

Service area mutation success must never depend only on the dashboard UI gate; delegated controllers and database policies must remain independently protective.

Current Status:

PARTIAL. Controller ownership checks are source verified; RLS policy verification is open.

Related Findings:

- LOCKSMITH-RLS-001

Required Tests:

- TESTREQ-DASH-locksmith-007

---

### MNH-006

BEH-DASH-locksmith-306

Invariant:

A locksmith owner acting through a VPORT identity must not be blocked by inconsistent identity metadata lookup between owner CRUD and feed publish hooks.

Current Status:

OPEN. `useLocksmithOwner` and `usePublishLocksmithPost` use different keys for `availableActors`.

Related Findings:

- LOCKSMITH-OWNER-001

Required Tests:

- TESTREQ-DASH-locksmith-008

---

### MNH-007

BEH-DASH-locksmith-307

Invariant:

Locksmith profile read errors must not silently degrade to empty owner dashboard state.

Current Status:

OPEN. Hook error is not rendered by the dashboard screen.

Related Findings:

- LOCKSMITH-PROFILE-ERROR-001

Required Tests:

- TESTREQ-DASH-locksmith-009

---

## 8. Data Changes

| Surface | Read | Insert | Update | Delete |
|---|---|---|---|---|
| `vport.locksmith_service_areas` | Yes via `dalListLocksmithServiceAreas`. | Yes via `dalInsertLocksmithServiceArea`. | Yes via `dalUpdateLocksmithServiceArea`. | Yes via `dalDeleteLocksmithServiceArea`. |
| `vport.locksmith_service_details` | Yes via `dalListLocksmithServiceDetails`. | Hook exposes save path via `dalUpsertLocksmithServiceDetail`; dashboard screen does not call it. | Hook exposes save path via `dalUpsertLocksmithServiceDetail`; dashboard screen does not call it. | Hook exposes delete path via `dalDeleteLocksmithServiceDetail`; dashboard screen does not call it. |
| `vport.locksmith_portfolio_details` | Not read by this dashboard screen. | Hook exposes save path via `dalUpsertLocksmithPortfolioDetail`; dashboard screen does not call it. | Hook exposes save path via `dalUpsertLocksmithPortfolioDetail`; dashboard screen does not call it. | No dashboard delete path found. |
| `vport.services` / enabled services | Yes via `readVportServicesByActor({ actorId, includeDisabled: false })`. | No. | No. | No. |
| `vport.profiles` | Yes via `resolveVportLocksmithNameDAL` for feed text. | No. | No. | No. |
| `vc.posts` | Yes via recent-post dedup query. | Optional insert through `createSystemPost`. | No. | No. |

---

## 9. Side Effects

Notifications:

- No notification side effect found in the dashboard locksmith source.

Analytics:

- No analytics side effect found in the dashboard locksmith source.

Media:

- No media side effect found in the service area dashboard screen.

Exports:

- No export side effect found.

Jobs:

- No job dispatch found.

Cache:

- `fetchLocksmithProfileCached` uses a 2-minute actor-keyed in-memory cache.
- `useLocksmithOwner` invalidates locksmith profile cache after successful owner mutations.

Other:

- Optional feed post creation for service area updates through `createSystemPost`.
- `AreaForm` sanitizes by typed parsing for numeric fields but does not itself enforce business validation beyond form submission shape.

---

## 10. UI Outputs

Loading States:

- Service area skeleton rows render while `useLocksmithProfile` is loading.

Success States:

- Add/update/delete success is reflected by closing edit/add state and rendering refreshed service area data.
- Quick Summary counts update from current arrays.

Error States:

- `owner.error` renders a red error panel using message/details/hint/JSON fallback.
- `useLocksmithProfile.error` is not rendered by the dashboard screen.
- Feed publish errors are swallowed and do not render a UI error.

Empty States:

- `No service areas configured yet.`
- `No service details configured yet. Select services first, then configure response time, pricing, and requirements here.`

Owner States:

- Owner sees service area management controls, service details, gap services, add/edit/delete actions, share-to-feed consent, and quick summary.

Public States:

- Dashboard public state is denied by owner gate. Public locksmith profile behavior is separate linked profile behavior.

---

## 11. Acceptance Criteria

### AC-DASH-locksmith-001

Requirement:

Owner can open the locksmith dashboard card and see service areas, service details, gap services, and summary counts for the target VPORT actor.

Evidence:

`VportDashboardLocksmithScreen.jsx` composes `useLocksmithProfile` outputs into service area cards, detail rows, gap rows, and quick summary.

Status:

DRAFT

---

### AC-DASH-locksmith-002

Requirement:

Owner can add a service area only after controller ownership assertion succeeds.

Evidence:

`handleAddArea` calls `owner.addArea`; `ctrlAddServiceArea` calls `assertActorOwnsVportActorController` before `dalInsertLocksmithServiceArea`.

Status:

DRAFT

---

### AC-DASH-locksmith-003

Requirement:

Owner can update a service area only inside the target actor scope.

Evidence:

`ctrlUpdateServiceArea` asserts ownership; `dalUpdateLocksmithServiceArea` filters by `id` and `actor_id`.

Status:

DRAFT

---

### AC-DASH-locksmith-004

Requirement:

Owner can delete a service area only inside the target actor scope.

Evidence:

`ctrlDeleteServiceArea` asserts ownership; `dalDeleteLocksmithServiceArea` filters by `id` and `actor_id`.

Status:

DRAFT

---

### AC-DASH-locksmith-005

Requirement:

Optional feed sharing creates at most one recent service-area update post per dedup window and requires ownership.

Evidence:

`publishLocksmithServiceAreaUpdateAsPostController` asserts ownership, checks `hasRecentLocksmithServiceAreaPostDAL`, sanitizes text, and calls `createSystemPost`.

Status:

DRAFT

---

### AC-DASH-locksmith-006

Requirement:

Non-owners cannot access dashboard locksmith management controls.

Evidence:

Screen returns `Owner access only.` when `isOwner` is false.

Status:

DRAFT; ownership loading state requires follow-up verification.

---

## 12. Test Requirements

### TESTREQ-DASH-locksmith-001

Validates:

Dashboard owner sees service areas, service details, gap services, and empty/loading states.

Type:

SPIDER-MAN dashboard component/hook integration test.

Status:

MISSING

---

### TESTREQ-DASH-locksmith-002

Validates:

Non-owner cannot add/update/delete service areas from the dashboard card.

Type:

SPIDER-MAN dashboard security workflow test.

Status:

MISSING

---

### TESTREQ-DASH-locksmith-003

Validates:

Service area update/delete DAL paths are scoped by both row ID and actor ID.

Type:

Controller/DAL unit test with cross-actor attempts.

Status:

MISSING

---

### TESTREQ-DASH-locksmith-004

Validates:

Feed publish requires ownership and respects recent-post deduplication.

Type:

Controller unit test.

Status:

PARTIAL. Profile-layer publish controller tests cover service-area ownership and portfolio dedup; service-area dedup and dashboard feed-share UI behavior remain untested.

---

### TESTREQ-DASH-locksmith-005

Validates:

Owner mutations invalidate the locksmith profile cache and reload fresh data.

Type:

Hook/cache unit test.

Status:

PARTIAL. `useLocksmithProfile.cache.test.js` validates cache behavior and invalidation helper.

---

### TESTREQ-DASH-locksmith-006

Validates:

Deleted or inactive VPORT profile lifecycle cannot be bypassed by direct locksmith profile controller reads.

Type:

BLACKWIDOW security regression test.

Status:

MISSING

---

### TESTREQ-DASH-locksmith-007

Validates:

Database RLS policies for locksmith service areas/details/portfolio details enforce actor ownership independently of application controllers.

Type:

DB/RLS security test.

Status:

MISSING

---

### TESTREQ-DASH-locksmith-008

Validates:

`useLocksmithOwner` resolves the correct user actor from `availableActors` when active identity is a VPORT actor.

Type:

Hook unit test.

Status:

MISSING

---

### TESTREQ-DASH-locksmith-009

Validates:

Profile read errors from `useLocksmithProfile` render a user-visible dashboard error state.

Type:

Dashboard component/hook integration test.

Status:

MISSING

---

## 13. Security Findings Linked

| Finding ID | Severity | Status | Related Behavior IDs |
|---|---|---|---|
| LOCKSMITH-SPIDER-001 | MEDIUM | OPEN | BEH-DASH-locksmith-001 through BEH-DASH-locksmith-005 |
| LOCKSMITH-RLS-001 | HIGH | OPEN | BEH-DASH-locksmith-202, BEH-DASH-locksmith-203, BEH-DASH-locksmith-305 |
| LOCKSMITH-OWNER-001 | MEDIUM | OPEN | BEH-DASH-locksmith-206 |
| LOCKSMITH-LIFECYCLE-001 | MEDIUM | OPEN | BEH-DASH-locksmith-205, BEH-DASH-locksmith-304 |
| LOCKSMITH-TRIPOINT-001 | MEDIUM | OPEN | BEH-DASH-locksmith-205, BEH-DASH-locksmith-304 |
| LOCKSMITH-FINALVIEW-001 | LOW | OPEN | BEH-DASH-locksmith-201 |
| LOCKSMITH-PROFILE-ERROR-001 | MEDIUM | OPEN | BEH-DASH-locksmith-207, BEH-DASH-locksmith-307 |
| BW-LOCK-001 | MEDIUM | PATCHED IN CURRENT SOURCE FOR SERVICE AREA UPDATE/DELETE | BEH-DASH-locksmith-202, BEH-DASH-locksmith-301 |
| BW-LOCK-002 | LOW/MEDIUM | OPEN BY SOURCE EVIDENCE | BEH-DASH-locksmith-205, BEH-DASH-locksmith-304 |
| BW-LOCK-003 | MEDIUM | OPEN / NEEDS RATE-LIMIT REVIEW | BEH-DASH-locksmith-205, BEH-DASH-locksmith-304 |

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
| RLS verification for locksmith tables | MISSING | Yes for CLEAR |
| Lifecycle gate for direct locksmith profile reads | OPEN | Yes for CLEAR |
| Acting-as-VPORT owner CRUD behavior | OPEN | Yes for CLEAR |
| Profile read error UI | OPEN | Yes for CLEAR |
| TriPoint/external exposure review | OPEN | Yes for CLEAR |

---

## 15. Native / Alternate UI Parity

| Behavior | Native Equivalent | Status |
|---|---|---|
| View locksmith service areas/details/gaps | Not found in source. | MISSING SOURCE |
| Add/update/delete service area | Not found in source. | MISSING SOURCE |
| Optional feed publish after service area update | Not found in source. | MISSING SOURCE |

---

## 16. Engine Dependencies

| Engine | Purpose | Status |
|---|---|---|
| None directly imported by dashboard locksmith card | Not applicable. | SOURCE VERIFIED |
| Profile adapters | Delegate locksmith profile read, owner writes, and publish workflows. | SOURCE VERIFIED |
| Booking adapter ownership controller | Asserts actor ownership for locksmith writes/publish. | SOURCE VERIFIED |
| Posts adapter | Creates optional system feed post. | SOURCE VERIFIED |

---

## 17. Open Questions

| ID | Question | Status |
|---|---|---|
| OQ-DASH-locksmith-001 | Should `VportDashboardLocksmithScreen` explicitly handle ownership loading before rendering `Owner access only.`? | OPEN |
| OQ-DASH-locksmith-002 | Is `availableActors` shaped with `kind` or `actorKind` in all identity states? `useLocksmithOwner` and `usePublishLocksmithPost` currently use different keys. | OPEN |
| OQ-DASH-locksmith-003 | Should service area publish failures surface a user-visible warning instead of being swallowed? | OPEN |
| OQ-DASH-locksmith-004 | Should `getLocksmithProfileController` enforce active/not-deleted VPORT lifecycle directly before returning service area/detail data? | OPEN |
| OQ-DASH-locksmith-005 | What TriPoint fields are allowed to consume from locksmith profile data, and are deleted/inactive VPORTs excluded at that integration boundary? | OPEN |
| OQ-DASH-locksmith-006 | Should service detail editing move into this dashboard card, or remain outside this screen despite `useLocksmithOwner` exposing save/delete service detail functions? | OPEN |
| OQ-DASH-locksmith-007 | Should `useLocksmithOwner` use `actorKind` like `usePublishLocksmithPost`, or should identity expose one normalized available actor shape? | OPEN |
| OQ-DASH-locksmith-008 | Should `useLocksmithProfile.error` render in the dashboard alongside `owner.error`? | OPEN |

---

## 18. Confidence Review

| Section | Confidence | Source Verified |
|---|---|---|
| User Goal | HIGH | Yes: dashboard screen, module status, locksmith profile spec. |
| Actors / Roles | HIGH | Yes: `useVportOwnership`, controllers, module docs. |
| Module Architecture | HIGH | Yes: source files and runtime inventory. |
| Happy Paths | HIGH | Yes: screen, hooks, controllers, DALs. |
| Failure Paths | MEDIUM | Mostly source verified; profile read error and publish results are not surfaced. |
| Security Rules | HIGH | Yes for app-layer gates; RLS and external exposure remain open. |
| Data Changes | HIGH | Yes: DAL/controller source. |
| Side Effects | HIGH | Yes: cache invalidation and optional feed publish source. |
| UI Outputs | HIGH | Yes: screen/components source. |
| Acceptance Criteria | HIGH | Yes: source mapped. |
| Test Requirements | HIGH | Yes: test search found profile-layer tests and no dashboard-local locksmith tests. |
| Native / Alternate UI Parity | LOW | No native/alternate UI source found in this pass. |
| Engine Dependencies | HIGH | Yes: import source. |
| Open Questions | HIGH | Yes: derived from source gaps and governance docs. |

---

## 19. Command Sign-Off

ARCHITECT: PARTIAL — module architecture and delegated adapter path mapped.

VENOM: COMPLETE — dashboard matrix says complete; delegated write surfaces remain caution-gated.

ELEKTRA: COMPLETE — dashboard matrix says complete; source-to-sink path verified from screen to controllers/DALs.

BLACKWIDOW: COMPLETE — dashboard matrix says complete; current service area owner checks verified, lifecycle/RLS/external exposure remain open.

SPIDER-MAN: PARTIAL — profile-layer publish/cache tests exist; dashboard-local behavior/security tests are missing.

PROFESSOR X: DRAFT — behavior contract reverse-engineered from source.

THOR: CAUTION — not clear until SPIDER-MAN, RLS, lifecycle, acting-as-VPORT owner CRUD, profile read error UI, and TriPoint exposure follow-ups close.

---

## 13. Known Gaps (ARCHITECT Wave 2026-06-05)

| Gap | Severity | Finding | Handoff |
|---|---|---|---|
| Locksmith screen data source is UNKNOWN | CRITICAL | ARCHITECT_VERIFIED | IRONMAN |
| VPORT-kind access gate (locksmith-only visibility) undocumented at module level | HIGH | ARCHITECT_VERIFIED | IRONMAN |
| No controller, DAL, or hook — card is a thin shell | HIGH | ARCHITECT_VERIFIED | IRONMAN |
| No tests | MEDIUM | ARCHITECT_VERIFIED | SPIDER-MAN |
| No native parity notes | LOW | ARCHITECT_VERIFIED | Falcon |

Regression coverage: MISSING — SPIDER-MAN required. Zero test files in locksmith card module.

Ownership enforcement: UNKNOWN — no write surfaces confirmed. VPORT-kind gating via dashboardViewByVportType.model.js (locksmith-type visibility) is client-side only — not an authoritative security boundary.

---

## 14. Validation Sources

- ARCHITECTURE.md: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/locksmith/ARCHITECTURE.md (2026-06-05)
- Feature BEHAVIOR.md: ZZnotforproduction/APPS/VCSM/features/dashboard/BEHAVIOR.md §5 (route: /actor/:actorId/dashboard/locksmith)
- Feature SECURITY.md: ZZnotforproduction/APPS/VCSM/features/dashboard/SECURITY.md
- ARCHITECT wave report: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/ARCHITECT_WAVE_REPORT_2026_06_05.md
- Ticket: TICKET-LOGAN-DASHBOARD-MODULE-BEHAVIOR-WAVE-0001

---

Final Verdict:

BEHAVIOR_PARTIAL — Locksmith card data source is UNKNOWN. IRONMAN identification required. VPORT-kind visibility gate undocumented at security level.
