# Dashboard Module Behavior Contract — booking

Status: ACTIVE

Module: booking

Parent Feature: dashboard

Category Key: dashboard

Created By Ticket: TICKET-BEHAV-DASHBOARD-BATCH-REVERSE-ENGINEER-0001

Last Updated: 2026-06-04

Current Security Status:
- THOR: CAUTION
- Open Findings:
  - SPIDER-MAN owner/customer regression coverage
  - BOOKING-ROUTE-001
  - BOOKING-RESCHEDULE-DB-001
- Patched Findings:
  - BOOKING-RPC-001
  - BLOCK-DASH-001
  - ELEK-2026-06-04-004
- Security Review Status:
  - VENOM: COMPLETE
  - ELEKTRA: COMPLETE
  - BLACKWIDOW: COMPLETE

Reason:
`bookings` has source-verified controller ownership gates, customer cancellation limits, terminal-state guards, public booking actor-kind gates, and `profile_id` defense-in-depth scope on booking updates. Live DB now has RLS policy hardening applied for booking INSERT/UPDATE: broad UPDATE grants are removed, authenticated UPDATE is column-limited, and mutation policies are narrowed. It remains THOR CAUTION for missing broader SPIDER-MAN coverage and because direct reschedule field mutation is intentionally not DB-granted by the RLS-only migration.

---

## 1. User Goal

The `booking` dashboard module, sourced from the `bookings` card folder, lets a VPORT owner manage appointment bookings for a VPORT service resource. It supports viewing current, upcoming, historical, and cancelled bookings; creating owner-confirmed bookings; changing booking status; and exposing public booking creation and availability workflows through module hooks/controllers.

---

## 2. Actors / Roles

| Actor | Allowed Actions | Restrictions |
|---|---|---|
| VPORT owner actor | Open the owner booking dashboard, view booking history, create owner bookings, confirm, cancel, complete, mark no-show, and reschedule bookings through controller surfaces. | Must pass `assertActorOwnsVportActorController` for the target VPORT actor before owner mutations. |
| Citizen customer actor | Create public pending bookings and cancel their own booking when `callerActorId === booking.customer_actor_id`. | Cannot use VPORT actor identity for public booking. Cannot perform owner-only statuses. |
| Guest / walk-in requester | Create a public booking with `customer_actor_id: null` when no `requestActorId` is supplied. | Actor-kind validation is skipped only because there is no actor. Guest bookings do not trigger notification fanout in current source. |
| Non-owner actor | No owner dashboard access and no owner booking mutation. | Owner screen renders "Owner access only." and controllers reject owner mutation without ownership. |
| Notification recipient actors | Receive booking notifications for accepted public booking flows and confirmed/cancelled state transitions. | Notification failures are non-fatal in the status update controller. |

---

## 3. Module Architecture

### Routes

- `/actor/:actorId/dashboard/booking-history`
- Dashboard booking history route resolves to `VportDashboardBookingHistoryScreen`.
- The screen reads `actorId` from route params and applies an owner gate before rendering the view.
- No current source route for standalone `/booking` was found in `apps/VCSM/src/app/routes/**`; public booking behavior is rendered through profile booking tabs/flows, not this owner dashboard route.

### Screens

- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/VportDashboardBookingHistoryScreen.jsx`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/VportDashboardBookingHistoryView.jsx`

### Hooks

- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/hooks/useQuickBookingModal.js`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/hooks/useVportBookingActions.js`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/hooks/useVportBookingOps.js`

### Controllers

- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/controller/createOwnerBooking.controller.js`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/controller/updateVportBooking.controller.js`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/controller/vportPublicBooking.controller.js`

### DALs

- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/dal/insertVportBooking.write.dal.js`
- `apps/VCSM/src/features/dashboard/vport/dal/write/updateVportBooking.write.dal.js`
- `apps/VCSM/src/features/dashboard/vport/dal/read/vportBookingById.read.dal.js`
- `apps/VCSM/src/features/dashboard/vport/dal/read/vportBookingsInRange.read.dal.js`
- `apps/VCSM/src/features/dashboard/vport/dal/read/vportResource.read.dal`
- `apps/VCSM/src/features/dashboard/vport/dal/read/vportProfile.read.dal`
- `apps/VCSM/src/features/dashboard/vport/dal/read/actorVport.read.dal`
- `apps/VCSM/src/features/dashboard/vport/dal/read/vportAvailabilityRules.read.dal`
- `apps/VCSM/src/features/dashboard/vport/dal/read/vportServices.read.dal`

### RPCs

- No booking RPC is used by the current dashboard card source.
- `BOOKING-RPC-001` / `BLOCK-DASH-001` was resolved as an RLS-only hardening migration, not an RPC migration. No SECURITY DEFINER functions or RPCs are required by the applied fix.

### Edge Functions

- No dashboard booking edge function was found in the module source path.

### Engine Dependencies

- Booking adapter workflows are consumed by the dashboard view for owner resources and booking history.
- Notification adapter is used for booking status and public booking notifications.
- Hydration engine is used to hydrate customer actor display data in booking history.
- Owner quick booking currently imports profile service controller internals to list services for the quick booking modal.

### Ownership Gates

- Owner dashboard screen uses `useVportOwnership`.
- Owner create flow resolves the resource profile and VPORT actor, then calls `assertActorOwnsVportActorController`.
- Owner update/reschedule flow resolves the booking profile and VPORT actor, then calls `assertActorOwnsVportActorController`.
- Customer cancellation path is allowed only when `callerActorId === booking.customer_actor_id`.
- Public booking path requires `requestActorId` to resolve to an actor with `kind: "user"` when a requester actor exists.

---

## 4. Happy Paths

### HP-001

BEH-DASH-bookings-001

Preconditions:

- Viewer is the owner of the dashboard VPORT actor.
- Booking resources and booking history are available for the target VPORT.

Flow:

User opens the booking dashboard.
`VportDashboardBookingHistoryScreen` reads route `actorId`.
`useVportOwnership` verifies owner access.
`VportDashboardBookingHistoryView` loads owner booking resources and booking history through booking adapter hooks.
Customer actors are hydrated through `hydrateActorsByIds`.

Expected Result:

The owner sees booking counts, resource-aware booking lists, mode filters, and booking cards.

Data Changes:

None.

---

### HP-002

BEH-DASH-bookings-002

Preconditions:

- Owner dashboard view has loaded booking history.

Flow:

Owner switches between `today`, `upcoming`, and `history`.
When in history mode, owner switches between `past`, `cancelled`, and `all`.
`filterBookings` and `groupByDate` derive visible booking groups.

Expected Result:

The UI shows the selected booking subset and date groups.

Data Changes:

None.

---

### HP-003

BEH-DASH-bookings-003

Preconditions:

- Viewer is a VPORT owner.
- A resource exists for the VPORT.
- Start/end times are valid and start precedes end.

Flow:

Owner opens quick booking modal.
`useQuickBookingModal` loads services for the owner actor.
Owner submits a booking.
`createOwnerBookingController` validates required inputs and time order.
Controller reads the resource and resolves the VPORT actor.
Controller calls `assertActorOwnsVportActorController`.
Controller calls `insertVportBookingDAL`.
View reloads booking history on success.

Expected Result:

A confirmed owner-source booking is inserted for the resource and appears in booking history after reload.

Data Changes:

- Insert into `vport.bookings`.

---

### HP-004

BEH-DASH-bookings-004

Preconditions:

- Viewer is a VPORT owner.
- Booking exists and is not already terminal.
- Requested status is one of `confirmed`, `cancelled`, `completed`, or `no_show`.

Flow:

Owner chooses a booking action.
`useVportBookingActions` calls `updateBookingStatusController`.
Controller reads booking by id.
Controller rejects terminal bookings.
Controller resolves VPORT actor from booking profile.
Controller calls `assertActorOwnsVportActorController`.
Controller calls `updateVportBookingDAL`.
Controller publishes a notification for confirmed/cancelled transitions when applicable.
View reloads booking history on success.

Expected Result:

Booking status changes and visible booking state refreshes.

Data Changes:

- Update `vport.bookings.status`.
- Set `cancelled_at` when cancelling.
- Set `completed_at` when completing.

---

### HP-005

BEH-DASH-bookings-005

Preconditions:

- Booking exists and is not terminal.
- Viewer owns the booking VPORT actor.
- New time range is valid.
- Target resource has no conflicting booking in the requested time range.
- Caller is executing source/controller behavior, not relying on live DB grants for authenticated direct reschedule column updates.

Flow:

Caller invokes `rescheduleBookingController`.
Controller validates inputs and reads booking.
Controller resolves VPORT actor from booking profile and verifies ownership.
Controller checks range conflicts with `listVportBookingsInRangeDAL`.
Controller calls `updateVportBookingDAL` with new time/resource fields.

Expected Result:

Source controller attempts to reschedule the booking to the requested resource/time range.

Data Changes:

- Update `vport.bookings.starts_at`.
- Update `vport.bookings.ends_at`.
- Update `vport.bookings.resource_id` when changed.
- Update `vport.bookings.duration_minutes` when supplied.

Current DB Note:

The current source still allows reschedule fields through `updateVportBookingDAL`, and focused tests cover that the controller passes `profileId`. However, the live RLS-only hardening documented in this module intentionally does not grant authenticated UPDATE on direct reschedule fields. This keeps reschedule at CAUTION until product/source/DB policy alignment is decided.

---

### HP-006

BEH-DASH-bookings-006

Preconditions:

- Public booking resource is active.
- Requested time starts in the future.
- Requester is either a citizen actor or a guest request with no actor id.

Flow:

Public workflow calls `useVportBookingOps`.
Hook calls `createVportPublicBookingController`.
Controller validates required fields.
Controller reads the resource and rejects inactive resources.
When `requestActorId` exists, controller reads the actor link and requires `kind: "user"`.
Controller resolves service label server-side when a service id exists.
Controller calls `insertVportBookingDAL`.
Controller sends notification fanout to VPORT/member recipients when requester and recipients exist.

Expected Result:

A pending public-source booking is inserted.

Data Changes:

- Insert into `vport.bookings`.

---

### HP-007

BEH-DASH-bookings-007

Preconditions:

- Booking exists.
- Caller is the booking customer actor.
- Booking is not terminal.

Flow:

Customer calls `updateBookingStatusController` with `status: "cancelled"`.
Controller reads booking and recognizes `callerActorId === booking.customer_actor_id`.
Controller allows only cancellation.
Controller calls `updateVportBookingDAL`.

Expected Result:

Customer-owned booking is cancelled.

Data Changes:

- Update `vport.bookings.status` to `cancelled`.
- Set `vport.bookings.cancelled_at`.

---

## 5. Failure Paths

### FP-001

BEH-DASH-bookings-101

Trigger:

Owner dashboard is opened by a non-owner actor.

Expected System Behavior:

`useVportOwnership` returns non-owner state.

Expected UI Behavior:

Screen renders `Owner access only.`

Expected Logging:

No required logging found in source.

---

### FP-002

BEH-DASH-bookings-102

Trigger:

Create owner booking request omits `callerActorId`, `resourceId`, `startsAt`, or `endsAt`.

Expected System Behavior:

`createOwnerBookingController` throws a required-field error before DAL insert.

Expected UI Behavior:

Quick booking modal stores the error message in hook state.

Expected Logging:

No required logging found in source.

---

### FP-003

BEH-DASH-bookings-103

Trigger:

Booking start time is not before end time.

Expected System Behavior:

Owner create or reschedule controller throws `startsAt must be before endsAt.`

Expected UI Behavior:

Caller displays or stores the thrown message.

Expected Logging:

No required logging found in source.

---

### FP-004

BEH-DASH-bookings-104

Trigger:

Resource is missing, inactive, or cannot resolve to a VPORT actor.

Expected System Behavior:

Owner create rejects missing/invalid resource. Public create rejects unavailable resource.

Expected UI Behavior:

Caller displays or stores the thrown message.

Expected Logging:

No required logging found in source.

---

### FP-005

BEH-DASH-bookings-105

Trigger:

Public booking requester exists but resolves to no actor or to a VPORT actor.

Expected System Behavior:

`createVportPublicBookingController` rejects before insert. Unknown actors receive `Only citizens can book appointments.` VPORT actors receive `Switch to your citizen profile to book.`

Expected UI Behavior:

Public caller receives the validation error.

Expected Logging:

No required logging found in source.

---

### FP-006

BEH-DASH-bookings-106

Trigger:

Public booking start time is in the past.

Expected System Behavior:

Controller rejects the booking as no longer available.

Expected UI Behavior:

Public caller receives the validation error.

Expected Logging:

No required logging found in source.

---

### FP-007

BEH-DASH-bookings-107

Trigger:

Insert hits PostgreSQL unique violation `23505` for a slot collision.

Expected System Behavior:

`insertVportBookingDAL` translates the database error to `This time slot is no longer available. Please choose another time.`

Expected UI Behavior:

Caller receives the user-safe slot collision message.

Expected Logging:

No required logging found in source.

---

### FP-008

BEH-DASH-bookings-108

Trigger:

Status update targets a terminal booking.

Expected System Behavior:

`updateBookingStatusController` rejects before ownership mutation path.

Expected UI Behavior:

Caller receives `Booking is already ${booking.status} and cannot be modified.`

Expected Logging:

No required logging found in source.

---

### FP-009A

BEH-DASH-bookings-113

Trigger:

Reschedule targets a terminal booking.

Expected System Behavior:

`rescheduleBookingController` rejects before conflict check or update.

Expected UI Behavior:

Caller receives `Booking is already ${booking.status} and cannot be rescheduled.`

Expected Logging:

No required logging found in source.

Finding Links:

BOOKING-RESCHEDULE-DB-001.

---

### FP-009

BEH-DASH-bookings-109

Trigger:

Customer actor attempts an owner-only status or non-customer actor attempts mutation without ownership.

Expected System Behavior:

Customer path allows only `cancelled`. Owner path requires ownership. All other actor/status combinations throw.

Expected UI Behavior:

Caller receives the thrown permission/status error.

Expected Logging:

No required logging found in source.

---

### FP-010

BEH-DASH-bookings-110

Trigger:

Reschedule target range conflicts with another booking on the same resource.

Expected System Behavior:

`rescheduleBookingController` rejects before update with `This time slot conflicts with an existing booking.`

Expected UI Behavior:

Caller receives the slot conflict message.

Expected Logging:

No required logging found in source.

---

### FP-012

BEH-DASH-bookings-112

Trigger:

Source/controller reschedule reaches `updateVportBookingDAL` under the live RLS-only hardening where authenticated UPDATE is column-limited and does not include direct reschedule fields.

Expected System Behavior:

Database policy/grants can reject the update even though the source controller permits the reschedule attempt.

Expected UI Behavior:

Caller receives the DB/controller error. In the current owner booking history UI, no visible reschedule control was found; schedule has a hook-level reschedule path but no visible schedule modal action.

Expected Logging:

No module-local logging found.

Finding Links:

BOOKING-RESCHEDULE-DB-001.

---

### FP-011

BEH-DASH-bookings-111

Trigger:

Notification publish fails after a status update.

Expected System Behavior:

Controller catches notification failure and does not roll back the booking update.

Expected UI Behavior:

Booking action still succeeds.

Expected Logging:

Development console logs notification failure.

---

## 6. Security Rules

### SEC-001

BEH-DASH-bookings-201

Rule:

Only a VPORT owner may open the owner booking dashboard.

Enforcement Layer:

Screen: `VportDashboardBookingHistoryScreen.jsx`

Current Status:

SOURCE VERIFIED.

Finding Links:

None.

---

### SEC-002

BEH-DASH-bookings-202

Rule:

Owner-created bookings must be scoped to a resource whose VPORT actor is owned by `callerActorId`.

Enforcement Layer:

Controller: `createOwnerBookingController`

Current Status:

SOURCE VERIFIED.

Finding Links:

None.

---

### SEC-003

BEH-DASH-bookings-203

Rule:

Owner status and reschedule mutations must verify ownership before writing.

Enforcement Layer:

Controller: `updateBookingStatusController`, `rescheduleBookingController`

Current Status:

SOURCE VERIFIED.

Finding Links:

ELEK-2026-06-04-004 is PATCHED / SOURCE VERIFIED. `updateVportBookingDAL` now requires `profileId` and scopes booking updates by both `id` and `profile_id`.

---

### SEC-004

BEH-DASH-bookings-204

Rule:

Customer actors may cancel only their own booking and may not set owner-only statuses.

Enforcement Layer:

Controller: `updateBookingStatusController`

Current Status:

SOURCE VERIFIED.

Finding Links:

None.

---

### SEC-005

BEH-DASH-bookings-205

Rule:

Terminal bookings may not be mutated by owner or customer flows.

Enforcement Layer:

Controller: `updateBookingStatusController`, `rescheduleBookingController`

Current Status:

SOURCE VERIFIED.

Finding Links:

None.

---

### SEC-006

BEH-DASH-bookings-206

Rule:

Public booking with an actor id must be performed by a citizen actor (`kind: "user"`), not by a VPORT actor.

Enforcement Layer:

Controller: `createVportPublicBookingController`

Current Status:

SOURCE VERIFIED and SPIDER-MAN covered.

Finding Links:

BOOK-002 test coverage.

---

### SEC-007

BEH-DASH-bookings-207

Rule:

Public booking service labels must be resolved server-side and not trusted from caller-supplied display snapshots.

Enforcement Layer:

Controller: `createVportPublicBookingController`

Current Status:

SOURCE VERIFIED.

Finding Links:

None.

---

### SEC-008

BEH-DASH-bookings-208

Rule:

Booking writes must not rely on broad direct table mutation privileges. Authenticated booking UPDATE must be column-limited and guarded by narrow RLS policies.

Enforcement Layer:

Database RLS policies and column-level grants.

Current Status:

APPLIED / LIVE VERIFIED — `bookings_insert_public_pending`, `bookings_insert_actor_owner`, `bookings_update_customer_cancel`, and `bookings_update_actor_owner_status` are live; table-level authenticated UPDATE is absent; authenticated UPDATE is limited to `status`, `cancelled_at`, `completed_at`, `customer_note`, `internal_note`, and `updated_at`.

Finding Links:

BOOKING-RPC-001, BLOCK-DASH-001.

---

## 7. Must Never Happen

### MNH-001

BEH-DASH-bookings-301

Invariant:

A non-owner must never view or manage another VPORT actor's owner booking dashboard.

Current Status:

SOURCE VERIFIED.

Related Findings:

None.

Required Tests:

TESTREQ-DASH-bookings-001.

---

### MNH-002

BEH-DASH-bookings-302

Invariant:

An owner booking insert must never use a caller-supplied VPORT/profile without resolving the resource and verifying actor ownership.

Current Status:

SOURCE VERIFIED.

Related Findings:

None.

Required Tests:

TESTREQ-DASH-bookings-002.

---

### MNH-003

BEH-DASH-bookings-303

Invariant:

A booking update must never mutate a cross-owner booking.

Current Status:

SOURCE VERIFIED and FOCUSED TEST COVERED. Controller ownership gates are verified; `updateVportBookingDAL` requires `profileId` and scopes updates by both `id` and `profile_id`.

Related Findings:

ELEK-2026-06-04-004.

Required Tests:

TESTREQ-DASH-bookings-003.

---

### MNH-004

BEH-DASH-bookings-304

Invariant:

A customer must never set owner-only statuses such as `confirmed`, `completed`, or `no_show`.

Current Status:

SOURCE VERIFIED.

Related Findings:

None.

Required Tests:

TESTREQ-DASH-bookings-004.

---

### MNH-005

BEH-DASH-bookings-305

Invariant:

A VPORT actor must never create a public booking as a customer actor.

Current Status:

SOURCE VERIFIED and SPIDER-MAN covered.

Related Findings:

BOOK-002.

Required Tests:

Existing public controller regression tests cover this rule.

---

### MNH-006

BEH-DASH-bookings-306

Invariant:

Booking INSERT/UPDATE must not remain on broad direct table mutation privileges for THOR approval.

Current Status:

APPLIED / LIVE VERIFIED for broad INSERT/UPDATE hardening. CAUTION remains for source-vs-DB reschedule alignment because direct reschedule field mutation is source-present but not included in the authenticated column-level UPDATE grant set.

Related Findings:

BOOKING-RPC-001, BLOCK-DASH-001.

Required Tests:

TESTREQ-DASH-bookings-005.

---

## 8. Data Changes

| Surface | Read | Insert | Update | Delete |
|---|---|---|---|---|
| `vport.bookings` | Yes: booking by id, history/range lists, availability conflicts. | Yes: owner confirmed bookings and public pending bookings. | Yes in source: status, cancellation/completion timestamps, reschedule fields, customer/service details through whitelisted DAL fields. Live authenticated DB grants are currently narrower and do not include direct reschedule fields. | No source-verified delete surface found. |
| `vport.resources` | Yes: resource lookup/list. | No. | No. | No. |
| `vport.availability_rules` | Yes: public availability lookup. | No. | No. | No. |
| `vport.services` | Yes: service label/load for booking flows. | No. | No. | No. |
| Actor/VPORT link reads | Yes: actor-kind and profile-to-actor resolution. | No. | No. | No. |

---

## 9. Side Effects

Notifications:

- Status update controller publishes notifications for confirmed/cancelled events.
- Public booking controller publishes notification fanout to VPORT/member recipients when a requester actor exists.

Analytics:

- No analytics side effect found in source.

Media:

- No media side effect found in source.

Exports:

- No export side effect found in source.

Jobs:

- No background job enqueue found in source.

Cache:

- Booking dashboard view reloads booking data after successful create/status mutations.
- No shared cache invalidation function was found in the module source path.

Other:

- Public booking notification link path is intentionally `null` to avoid writing raw VPORT UUIDs to notification rows.

---

## 10. UI Outputs

Loading States:

- Owner screen returns no content while ownership is loading.
- Booking action hook tracks `working` operation state.
- Quick booking modal hook tracks service loading and save state.

Success States:

- Booking history refreshes after successful create/status action.
- Booking cards reflect the updated status after reload.

Error States:

- Non-owner dashboard access displays `Owner access only.`
- Booking action and quick booking hooks store thrown error messages.
- Public controller throws user-safe validation and slot collision messages.

Empty States:

- Availability controller returns empty rules/exceptions/bookings when no resource id is provided.
- View handles empty filtered booking groups through rendered dashboard state.

Owner States:

- Owner route renders the full booking history view only after ownership verification.

Public States:

- Public hooks expose resource listing, availability lookup, and public booking creation.

---

## 11. Acceptance Criteria

### AC-DASH-bookings-001

Requirement:

Owner booking dashboard requires VPORT ownership before rendering booking management UI.

Evidence:

`VportDashboardBookingHistoryScreen.jsx`

Status:

SOURCE VERIFIED.

---

### AC-DASH-bookings-002

Requirement:

Owner booking creation verifies resource ownership and inserts only after validation.

Evidence:

`createOwnerBooking.controller.js`

Status:

SOURCE VERIFIED.

---

### AC-DASH-bookings-003

Requirement:

Booking status updates enforce terminal-state, owner, customer, and status rules.

Evidence:

`updateVportBooking.controller.js`

Status:

SOURCE VERIFIED.

---

### AC-DASH-bookings-004

Requirement:

Public booking creation rejects VPORT actors and unknown actor ids before insert.

Evidence:

`vportPublicBooking.controller.js`, `vportPublicBooking.controller.test.js`

Status:

SOURCE VERIFIED and TEST COVERED.

---

### AC-DASH-bookings-005

Requirement:

Slot collisions produce a safe user-facing error message.

Evidence:

`insertVportBooking.write.dal.js`, `insertVportBooking.write.dal.test.js`, `vportPublicBooking.controller.test.js`

Status:

SOURCE VERIFIED and TEST COVERED.

---

### AC-DASH-bookings-006

Requirement:

Booking writes use narrowed RLS policies and column-level UPDATE grants before THOR approval.

Evidence:

`BOOKING-RPC-001`, `BLOCK-DASH-001`, live SQL verification on 2026-06-04.

Status:

APPLIED / LIVE VERIFIED.

---

### AC-DASH-bookings-007

Requirement:

Booking dashboard route documentation matches the current app route table.

Evidence:

`protected/app.routes.jsx`, `lazyApp.jsx`

Status:

OPEN DOCUMENTATION CORRECTION. Owner dashboard route is `/actor/:actorId/dashboard/booking-history`; standalone `/booking` was not found in app routes.

---

### AC-DASH-bookings-008

Requirement:

Reschedule behavior is explicitly aligned across source, UI, tests, and live DB grants.

Evidence:

`updateVportBooking.controller.js`, `updateVportBooking.write.dal.js`, `updateVportBooking.controller.test.js`, live booking grants.

Status:

OPEN. Source and focused tests permit reschedule through `updateVportBookingDAL`, but live authenticated DB UPDATE grants intentionally exclude direct reschedule fields.

---

## 12. Test Requirements

### TESTREQ-DASH-bookings-001

Validates:

Non-owner actors cannot render the owner booking dashboard.

Type:

Component/hook integration.

Status:

MISSING.

---

### TESTREQ-DASH-bookings-002

Validates:

`createOwnerBookingController` rejects non-owner callers and inserts confirmed owner bookings only after ownership verification.

Type:

Controller unit test.

Status:

MISSING.

---

### TESTREQ-DASH-bookings-003

Validates:

`updateBookingStatusController` and `rescheduleBookingController` cannot mutate cross-owner bookings, and update DAL calls include the required owner/profile scope.

Type:

Controller/DAL unit test.

Status:

COVERED - focused controller tests verify owner-gated status and reschedule updates pass `profileId` into `updateVportBookingDAL`.

---

### TESTREQ-DASH-bookings-004

Validates:

Customer actor can cancel own booking but cannot confirm, complete, no-show, or reschedule.

Type:

Controller unit test.

Status:

MISSING.

---

### TESTREQ-DASH-bookings-005

Validates:

Booking create/update flows are covered by narrowed RLS policies and column-level UPDATE grants, with no broad table-level authenticated UPDATE.

Type:

DB policy/grant verification plus controller/DAL integration tests.

Status:

PARTIAL — DB policy/grant verification complete; broader SPIDER-MAN controller tests still required.

---

### TESTREQ-DASH-bookings-006

Validates:

Public booking kind-gate rejects VPORT actors and unknown actors before insert/notification.

Type:

Controller unit test.

Status:

COMPLETE.

---

### TESTREQ-DASH-bookings-007

Validates:

Slot collision `23505` is translated and propagated without raw DB error exposure.

Type:

DAL/controller unit test.

Status:

COMPLETE.

---

### TESTREQ-DASH-bookings-008

Validates:

Owner booking dashboard route references are actor-scoped and no stale standalone `/booking` dashboard route is assumed.

Type:

Route/source assertion.

Status:

MISSING / TRACKED BY BOOKING-ROUTE-001.

---

### TESTREQ-DASH-bookings-009

Validates:

Reschedule behavior either has DB grants/policies that match the source controller path, or the source/UI clearly treats reschedule as unavailable under current RLS hardening.

Type:

DB grant verification plus controller/UI integration.

Status:

MISSING / TRACKED BY BOOKING-RESCHEDULE-DB-001.

---

## 13. Security Findings Linked

| Finding ID | Severity | Status | Related Behavior IDs |
|---|---|---|---|
| BOOKING-RPC-001 | P0 | APPLIED / RLS POLICY HARDENED | BEH-DASH-bookings-306, BEH-DASH-bookings-208, AC-DASH-bookings-006, TESTREQ-DASH-bookings-005 |
| BLOCK-DASH-001 | P0 | APPLIED / LIVE VERIFIED | BEH-DASH-bookings-306, BEH-DASH-bookings-208, AC-DASH-bookings-006, TESTREQ-DASH-bookings-005 |
| ELEK-2026-06-04-004 | LOW | PATCHED / SOURCE VERIFIED | BEH-DASH-bookings-203, BEH-DASH-bookings-303, TESTREQ-DASH-bookings-003 |
| BOOK-001 | Regression coverage | COVERED | BEH-DASH-bookings-107, AC-DASH-bookings-005, TESTREQ-DASH-bookings-007 |
| BOOK-002 | Regression coverage | COVERED | BEH-DASH-bookings-205, AC-DASH-bookings-004, TESTREQ-DASH-bookings-006 |
| BOOKING-ROUTE-001 | LOW / documentation drift | OPEN | AC-DASH-bookings-007, TESTREQ-DASH-bookings-008 |
| BOOKING-RESCHEDULE-DB-001 | MEDIUM / source-DB alignment | OPEN | BEH-DASH-bookings-005, BEH-DASH-bookings-112, BEH-DASH-bookings-113, AC-DASH-bookings-008, TESTREQ-DASH-bookings-009 |

---

## 14. THOR Release Gates

| Gate | Status | Blocking? |
|---|---|---|
| Owner dashboard route requires ownership before render. | SOURCE VERIFIED | No |
| Owner create/status/reschedule controllers enforce ownership. | SOURCE VERIFIED | No |
| Public booking rejects VPORT actors and unknown actors. | TEST COVERED | No |
| Slot collision errors are translated to user-safe messages. | TEST COVERED | No |
| Broad booking INSERT/UPDATE replaced by narrowed RLS policies and column-level grants. | APPLIED / LIVE VERIFIED | No |
| `updateVportBookingDAL` receives owner/profile defense-in-depth scope. | COMPLETE | No |
| Booking route and reschedule source/DB behavior are accurately documented. | OPEN | Yes for behavior approval |
| Owner status/reschedule and customer-cancel tests added. | MISSING | Yes for SPIDER-MAN complete |

---

## 15. Native / Alternate UI Parity

| Behavior | Native Equivalent | Status |
|---|---|---|
| Owner booking history view | Not source-verified in this pass. | OPEN QUESTION |
| Owner quick booking creation | Not source-verified in this pass. | OPEN QUESTION |
| Owner status actions | Not source-verified in this pass. | OPEN QUESTION |
| Public booking flow | Not source-verified in this pass. | OPEN QUESTION |

---

## 16. Engine Dependencies

| Engine | Purpose | Status |
|---|---|---|
| Booking engine / booking adapters | Owner resource and booking history workflows; booking lifecycle governance dependency. | ACTIVE |
| Notifications engine / adapter | Booking status and public booking notification fanout. | ACTIVE |
| Hydration engine | Hydrates customer actor display records for booking cards. | ACTIVE |
| Profiles service controller import | Loads enabled persisted services for quick booking modal. | ACTIVE, architecture review recommended because it imports profile internals. |

---

## 17. Open Questions

| ID | Question | Status |
|---|---|---|
| OQ-DASH-bookings-001 | What is the exact target RPC/state-machine API for `BOOKING-RPC-001`? | CLOSED — user rejected SECURITY DEFINER/RPC approach; fix applied as RLS policy hardening. |
| OQ-DASH-bookings-002 | Should `updateVportBookingDAL` accept `profileId` or `ownerActorId` scope after the ELEKTRA defense-in-depth patch? | RESOLVED FOR SOURCE PATCH — current DAL accepts `profileId`; DB hardening now limits authenticated UPDATE columns. |
| OQ-DASH-bookings-003 | Should quick booking service loading move behind a dashboard/profile adapter instead of importing profile controller internals? | OPEN |
| OQ-DASH-bookings-004 | Which native or alternate UI must match dashboard booking behavior? | OPEN |
| OQ-DASH-bookings-005 | Should guest public bookings trigger owner notifications without a requester actor? | OPEN |
| OQ-DASH-bookings-006 | Should reschedule remain a source/controller capability if live authenticated DB grants intentionally exclude direct reschedule fields? | OPEN / BLOCKS THOR CLEAR DECISION |
| OQ-DASH-bookings-007 | Should the behavior module keep the singular `booking` title while behavior/test IDs remain `bookings` to match the source folder and table name? | OPEN DOCUMENTATION NAMING DECISION |

---

## 18. Confidence Review

| Section | Confidence | Source Verified |
|---|---|---|
| User Goal | HIGH | Yes |
| Actors / Roles | HIGH | Yes |
| Module Architecture | HIGH | Yes |
| Happy Paths | HIGH | Yes |
| Failure Paths | HIGH | Yes |
| Security Rules | HIGH | Yes |
| Must Never Happen | HIGH | Yes |
| Data Changes | HIGH | Yes |
| Side Effects | MEDIUM | Yes for notifications/reload; no full app-wide telemetry audit in this pass |
| UI Outputs | MEDIUM | Yes for route/view/hook states; detailed visual rendering not tested in this pass |
| Acceptance Criteria | HIGH | Yes |
| Test Requirements | HIGH | Yes |
| Security Findings Linked | HIGH | Yes |
| THOR Release Gates | HIGH | Yes |
| Native / Alternate UI Parity | LOW | Missing source |
| Engine Dependencies | MEDIUM | Source and module README verified; engine internals not audited in this pass |
| Open Questions | HIGH | Yes |
| Command Sign-Off | MEDIUM | Derived from current dashboard security/status docs and source review |

---

## 19. Command Sign-Off

ARCHITECT: DRAFTED - module architecture mapped from dashboard source and module docs.

VENOM: COMPLETE WITH CAUTION - write surfaces and trust boundaries reviewed; booking RLS policy hardening is applied/live-verified; broader regression coverage remains open.

ELEKTRA: COMPLETE - `updateVportBookingDAL` now requires `profileId` and scopes updates by `id` and `profile_id`.

BLACKWIDOW: COMPLETE WITH CAUTION - ownership gates are source-verified; broad direct UPDATE surface is removed; reschedule DB policy limitation and broader tests remain THOR caution.

SPIDER-MAN: PARTIAL - public booking kind-gate, slot collision, and booking update profile-scope tests exist; broader owner create/customer cancellation tests are missing.

PROFESSOR X: DRAFT READY FOR REVIEW.

THOR: CAUTION - BOOKING-RPC-001/BLOCK-DASH-001 RLS hardening is applied, but CLEAR still requires SPIDER-MAN owner/customer regression coverage and release review of the reschedule limitation.

ARCHITECT NOTE: Current owner route is `/actor/:actorId/dashboard/booking-history`; no standalone dashboard `/booking` route was found in the source route table.

---

## 13. Known Gaps (ARCHITECT Wave 2026-06-05)

| Gap | Severity | Finding ID | Handoff |
|---|---|---|---|
| Cross-module DAL imports: bookings directly imports vport/dal/write/updateVportBooking and vport/dal/read/* | HIGH | ARCHITECT_VERIFIED | SENTRY |
| customer_actor_id injection risk on insertVportBookingDAL | MEDIUM | VEN-DASHBOARD-003 | VENOM |
| BookingCard / QuickBookingModal live in vport/components, not bookings/components — ownership ambiguity | MEDIUM | ARCHITECT_VERIFIED | IRONMAN |
| Cache/runtime behavior undocumented | MEDIUM | ARCHITECT_VERIFIED | LOKI |
| BOOKING-ROUTE-001 open | MEDIUM | Security review | VENOM |
| BOOKING-RESCHEDULE-DB-001 open | MEDIUM | Security review | VENOM |
| No native parity notes | LOW | ARCHITECT_VERIFIED | Falcon |

Regression coverage: 3 test files present — SPIDER-MAN coverage gap noted (owner/customer regression per CAUTION status).

---

## 14. Validation Sources

- ARCHITECTURE.md: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/bookings/ARCHITECTURE.md (2026-06-05)
- Feature BEHAVIOR.md: ZZnotforproduction/APPS/VCSM/features/dashboard/BEHAVIOR.md §6 FLOW-001/002, §8, §9, §13
- Feature SECURITY.md: ZZnotforproduction/APPS/VCSM/features/dashboard/SECURITY.md (VEN-DASHBOARD-003, VEN-CARD-002)
- ARCHITECT wave report: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/ARCHITECT_WAVE_REPORT_2026_06_05.md
- Ticket: TICKET-LOGAN-DASHBOARD-MODULE-BEHAVIOR-WAVE-0001

---

Final Verdict:

BEHAVIOR_ACTIVE — ARCHITECT_VERIFIED evidence incorporated. Terminal-state guard (VPD-V-021) and ownership chain confirmed. Cross-module DAL boundary gap routes to SENTRY.
