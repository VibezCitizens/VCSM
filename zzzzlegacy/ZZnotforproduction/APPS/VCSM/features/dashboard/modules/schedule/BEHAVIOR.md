# Dashboard Module Behavior Contract — schedule

Status: ACTIVE

Module: schedule

Parent Feature: dashboard

Category Key: dashboard

Created By Ticket: TICKET-BEHAV-DASHBOARD-BATCH-REVERSE-ENGINEER-0001

Last Updated: 2026-06-04

Current Security Status:
- THOR: CAUTION
- Open Findings:
  - SPIDER-MAN schedule/bookings regression coverage
  - SCHEDULE-ROUTE-001
  - SCHEDULE-RESCHEDULE-UI-001
- Patched Findings:
  - TICKET-BOOKING-RPC-001
  - DEFER-DASH-001
  - SCHEDULE-RLS-001
- Security Review Status:
  - VENOM: COMPLETE at dashboard matrix level; module DR_STRANGE command row still NOT_RUN.
  - ELEKTRA: COMPLETE at dashboard matrix level; module DR_STRANGE command row still NOT_RUN.
  - BLACKWIDOW: COMPLETE at dashboard matrix level; module DR_STRANGE command row still NOT_RUN.

---

## 1. User Goal

The schedule module lets a VPORT owner operate a daily booking schedule. It shows staff/resource lanes for a selected day, overlays availability rules and bookings, and lets the owner create owner-side bookings, inspect booking details, update booking status, and navigate between days.

This module is the operational day-view. Weekly availability configuration belongs to the calendar module.

---

## 2. Actors / Roles

| Actor | Allowed Actions | Restrictions |
|---|---|---|
| VPORT actor owner | Load the day schedule for the owned VPORT, view staff/resource lanes, view bookings, create owner-side bookings, update booking status, reschedule through delegated booking controllers. | Must pass `assertActorOwnsVportActorController(callerActorId, actorId)` before schedule data loads. Booking mutations must also pass delegated bookings-module ownership gates. |
| Non-owner authenticated actor | None. | Must not read schedule data or mutate bookings for a VPORT they do not own. |
| Public/anonymous actor | None. | No public schedule route behavior is documented for this owner dashboard module. |

---

## 3. Module Architecture

### Routes

- `/actor/:actorId/dashboard/schedule`
- No current source route for standalone `/dashboard/schedule` was found in `apps/VCSM/src/app/routes/**`; only the actor-scoped route is source-verified.

### Screens

- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/schedule/VportDashboardScheduleScreen.jsx`

### Hooks

- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/schedule/hooks/useVportOwnerSchedule.js`

### Controllers

- `controller/loadDaySchedule.controller.js`
- `controller/scheduleBookingCoordinator.controller.js`

### DALs

Schedule reads through shared VPORT dashboard read DALs:

- `vportProfile.read.dal.js`
- `vportResource.read.dal.js`
- `vportAvailabilityRules.read.dal.js`
- `listVportBookingsForProfileDay.read.dal.js`
- `vportServices.read.dal.js`

Schedule booking writes are delegated to the bookings module public boundary through `scheduleBookingCoordinator.controller.js`.

### RPCs

- No schedule-local RPC was found.
- Booking DB mutation hardening for `TICKET-BOOKING-RPC-001` was applied as RLS policies and column-level grants. No SECURITY DEFINER functions or RPCs are used.

### Edge Functions

- No schedule-local edge function was found.

### Engine Dependencies

- Booking module controllers through `cards/bookings` public index:
  - `createOwnerBookingController`
  - `updateBookingStatusController`
  - `rescheduleBookingController`
- Booking adapter ownership gate:
  - `assertActorOwnsVportActorController`
- Hydration engine:
  - `hydrateActorsByIds`

### Ownership Gates

- Schedule read gate: `assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId })` inside `loadDayScheduleController`.
- Create booking gate: delegated to `createOwnerBookingController`.
- Status update gate: delegated to `updateBookingStatusController`.
- Reschedule gate: delegated to `rescheduleBookingController`.

---

## 4. Happy Paths

### HP-001

BEH-DASH-schedule-001

Preconditions:

VPORT owner is authenticated, `identity.actorId` exists, and the route or embedded caller provides a target `actorId`.

Flow:

User opens the schedule route -> `VportDashboardScheduleScreen` calls `useVportOwnerSchedule({ actorId })` -> hook calls `loadDayScheduleController({ actorId, dateKey, callerActorId })` -> controller verifies ownership -> controller resolves profile, resources, availability rules, bookings, and services -> UI renders lanes and bookings.

Expected Result:

Owner sees a day-view grid with staff/resource lanes, working-state data, booking counts, bookings, and service options for booking creation.

Data Changes:

None. This is a read workflow.

---

### HP-002

BEH-DASH-schedule-002

Preconditions:

Schedule data loaded with at least one resource lane.

Flow:

User selects previous day, next day, or today -> hook updates `dateKey` -> hook reloads via `loadDayScheduleController` -> UI replaces schedule data for the selected date.

Expected Result:

The schedule view updates to the requested date and preserves owner-only access.

Data Changes:

None.

---

### HP-003

BEH-DASH-schedule-003

Preconditions:

Owner has at least one resource lane. The user opens a create booking modal from a slot or add-booking action.

Flow:

User submits service/time/customer form -> `submitCreateBooking` computes `startsAt`, `endsAt`, timezone, duration, and label snapshot -> `createScheduleBooking` delegates to `createOwnerBookingController` -> booking controller performs its own ownership/business validation -> hook closes modal and refreshes schedule.

Expected Result:

A new owner-side booking is created and appears in the refreshed schedule if it falls within the current day.

Data Changes:

Insert/write to the booking system through the delegated bookings module.

---

### HP-004

BEH-DASH-schedule-004

Preconditions:

Owner opens an existing booking detail modal.

Flow:

User chooses confirm, complete, no-show, or cancel -> `updateBookingStatus` calls `updateScheduleBookingStatus` -> coordinator delegates to `updateBookingStatusController` -> hook closes modal and refreshes schedule.

Expected Result:

Booking status is updated according to booking controller rules. Cancelled and no-show bookings are excluded from the schedule read query.

Data Changes:

Update to booking status through the delegated bookings module.

---

### HP-005

BEH-DASH-schedule-005

Preconditions:

Code caller invokes the hook/controller reschedule path with booking id, start/end time, resource id, and duration.

Flow:

Hook calls `rescheduleScheduleBooking` -> coordinator delegates to `rescheduleBookingController` -> hook closes modal and refreshes schedule.

Expected Result:

Booking time/resource is updated by the bookings controller and the refreshed schedule reflects the change.

Data Changes:

Update to booking time/resource fields through the delegated bookings module.

Current UI Note:

Current `VportDashboardScheduleScreen` does not pass `rescheduleBooking` into `BookingDetailModal`, and `BookingDetailModal` renders only status actions. Reschedule is therefore source-present in the hook/coordinator and test-covered as delegation, but not reachable from the current schedule UI.

---

## 5. Failure Paths

### FP-001

BEH-DASH-schedule-101

Trigger:

`actorId` or `dateKey` is missing.

Expected System Behavior:

`loadDayScheduleController` throws `actorId and dateKey are required`.

Expected UI Behavior:

Hook captures the error and the screen renders a failed-load empty state with retry.

Expected Logging:

No module-local logging found.

---

### FP-002

BEH-DASH-schedule-102

Trigger:

`callerActorId` is missing.

Expected System Behavior:

`loadDayScheduleController` throws `loadDayScheduleController: callerActorId is required`.

Expected UI Behavior:

Hook captures the error and renders failed-load state.

Expected Logging:

No module-local logging found.

---

### FP-003

BEH-DASH-schedule-103

Trigger:

Caller does not own the target VPORT actor.

Expected System Behavior:

`assertActorOwnsVportActorController` rejects before profile/resource/availability/booking reads.

Expected UI Behavior:

Hook captures the thrown error and renders failed-load state. No schedule data should render.

Expected Logging:

No module-local logging found.

---

### FP-004

BEH-DASH-schedule-104

Trigger:

Target actor has no VPORT profile.

Expected System Behavior:

`loadDayScheduleController` throws `Vport profile not found.`

Expected UI Behavior:

Hook renders failed-load state.

Expected Logging:

No module-local logging found.

---

### FP-005

BEH-DASH-schedule-105

Trigger:

No staff/resource lanes are returned.

Expected System Behavior:

Controller returns an empty `lanes` array.

Expected UI Behavior:

Desktop renders `No team members yet` and links the owner to the team dashboard. Mobile renders operational empty state behavior from `ScheduleOperationalView`.

Expected Logging:

No module-local logging found.

---

### FP-006

BEH-DASH-schedule-106

Trigger:

Create, status update, or hook-level reschedule delegation fails.

Expected System Behavior:

Delegated bookings controller rejects.

Expected UI Behavior:

Hook stores `saveError`; modal remains available with error banner.

Expected Logging:

No schedule-local logging found.

---

### FP-007

BEH-DASH-schedule-107

Trigger:

User expects to reschedule from the booking detail modal.

Expected System Behavior:

No current schedule UI control calls `rescheduleBooking`; the hook exposes it, but the screen does not pass it into `BookingDetailModal`.

Expected UI Behavior:

Booking detail modal shows status actions only: confirm, complete, no-show, cancel, and close.

Expected Logging:

No module-local logging found.

Finding Links:

- SCHEDULE-RESCHEDULE-UI-001

---

## 6. Security Rules

### SEC-001

BEH-DASH-schedule-201

Rule:

Only an actor owner of the target VPORT may load schedule data because it includes booking customer names and notes.

Enforcement Layer:

`loadDayScheduleController` before any DAL reads.

Current Status:

IMPLEMENTED at application controller layer. DB RLS for read tables remains unverified.

Finding Links:

- SCHEDULE-RLS-001

---

### SEC-002

BEH-DASH-schedule-202

Rule:

Schedule booking mutations must not bypass bookings-module authorization.

Enforcement Layer:

`scheduleBookingCoordinator.controller.js` delegates only through the bookings public index.

Current Status:

IMPLEMENTED. Cross-card internal import violation DEFER-013 is resolved.

Finding Links:

- DEFER-013
- TICKET-BOOKING-RPC-001

---

### SEC-003

BEH-DASH-schedule-203

Rule:

Booking status changes and reschedules must be constrained by bookings-module state-machine rules.

Enforcement Layer:

Bookings controllers and live DB RLS policy hardening tracked by `TICKET-BOOKING-RPC-001`.

Current Status:

PARTIAL / CAUTION. Booking RLS policy hardening is live-verified, but schedule remains downstream of bookings controller behavior and broader SPIDER-MAN tests.

Finding Links:

- TICKET-BOOKING-RPC-001

---

### SEC-004

BEH-DASH-schedule-204

Rule:

Schedule route documentation must match current routed source so reviewers do not approve an unguarded or nonexistent alternate route by assumption.

Enforcement Layer:

Route table: `apps/VCSM/src/app/routes/protected/app.routes.jsx`, `apps/VCSM/src/app/routes/lazyApp.jsx`.

Current Status:

OPEN DOCUMENTATION CORRECTION. Only `/actor/:actorId/dashboard/schedule` is source-verified; no standalone `/dashboard/schedule` route was found.

Finding Links:

- SCHEDULE-ROUTE-001

---

## 7. Must Never Happen

### MNH-001

BEH-DASH-schedule-301

Invariant:

A non-owner must never read another VPORT's schedule, customer names, or customer notes.

Current Status:

Application-layer controller gate present. DB RLS unverified.

Related Findings:

- SCHEDULE-RLS-001

Required Tests:

- TESTREQ-DASH-schedule-001

---

### MNH-002

BEH-DASH-schedule-302

Invariant:

Schedule must never write bookings through a private bookings controller import or direct DAL path.

Current Status:

Resolved through `scheduleBookingCoordinator.controller.js`.

Related Findings:

- DEFER-013

Required Tests:

- TESTREQ-DASH-schedule-002

---

### MNH-003

BEH-DASH-schedule-303

Invariant:

Schedule must never permit status transitions or reschedules that the bookings module would reject.

Current Status:

Delegated to bookings controllers. Booking RLS policy hardening is applied/live-verified; direct reschedule field mutation is not DB-granted by the RLS-only migration.

Related Findings:

- TICKET-BOOKING-RPC-001

Required Tests:

- TESTREQ-DASH-schedule-003

---

### MNH-004

BEH-DASH-schedule-304

Invariant:

Schedule behavior approval must never claim owner-facing reschedule UI is available when the current screen does not render a reschedule control.

Current Status:

SOURCE VERIFIED GAP. Reschedule is available only as a hook/coordinator path today; `BookingDetailModal` exposes status actions only.

Related Findings:

- SCHEDULE-RESCHEDULE-UI-001

Required Tests:

- TESTREQ-DASH-schedule-006

---

## 8. Data Changes

| Surface | Read | Insert | Update | Delete |
|---|---|---|---|---|
| `vport.profiles` | Resolve profile id by actor id. | No | No | No |
| `vport.resources` | Load profile-scoped and owner-actor-scoped active resources. | No | No | No |
| `vport.availability_rules` | Load active rules for returned resources. | No | No | No |
| `vport.bookings` | Load non-cancelled/non-no-show bookings in selected day range. | Via bookings module for create. | Via bookings module for status update and reschedule. | No schedule-local delete. |
| `vport.services` | Load enabled services for booking form options. | No | No | No |

---

## 9. Side Effects

Notifications:

No schedule-local notification side effects found.

Analytics:

No schedule-local analytics side effects found.

Media:

None found.

Exports:

None found.

Jobs:

None found.

Cache:

No schedule-local cache was found. The hook refreshes by re-running the controller after booking mutations.

Other:

`hydrateActorsByIds` is called for lane `member_actor_id` values after a successful schedule load.

---

## 10. UI Outputs

Loading States:

`ScheduleSkeleton` while schedule data loads.

Success States:

Desktop schedule grid, mobile operational view, mobile timeline view, date navigation, service-backed create booking modal, booking detail modal.

Error States:

Failed-load state with retry button; modal-level save error banner for create/status/reschedule failures.

Empty States:

Desktop `No team members yet` state with navigation to `/actor/${actorId}/dashboard/team`.

Owner States:

Owner can see lanes, bookings, notes, booking status actions, and create booking controls.

Public States:

No public schedule state is documented.

---

## 11. Acceptance Criteria

### AC-DASH-schedule-001

Requirement:

Only VPORT owners can load schedule data.

Evidence:

`loadDayScheduleController` calls `assertActorOwnsVportActorController` before DAL reads.

Status:

PARTIAL until RLS verification is complete.

---

### AC-DASH-schedule-002

Requirement:

Schedule booking writes route through the bookings module boundary.

Evidence:

`scheduleBookingCoordinator.controller.js` imports from `cards/bookings` public index and delegation tests cover create/status/reschedule.

Status:

PASS.

---

### AC-DASH-schedule-003

Requirement:

Operational day view can load resources, availability rules, bookings, and services for the selected day.

Evidence:

`loadDayScheduleController` composes shared VPORT read DALs and returns `lanes`, `services`, `dateKey`, `weekdayInt`, and timezone.

Status:

PASS at source review level; runtime verification not run in this ticket.

---

### AC-DASH-schedule-004

Requirement:

Schedule route documentation matches current app route tables.

Evidence:

`protected/app.routes.jsx`, `lazyApp.jsx`

Status:

OPEN DOCUMENTATION CORRECTION. Actor-scoped route is source-verified; standalone `/dashboard/schedule` was not found.

---

### AC-DASH-schedule-005

Requirement:

Current reschedule behavior is accurately represented as hook/coordinator-only unless a visible schedule UI invokes it.

Evidence:

`useVportOwnerSchedule.js`, `VportDashboardScheduleScreen.jsx`, `ScheduleModals.jsx`, `scheduleBookingCoordinator.controller.test.js`

Status:

OPEN DOCUMENTATION CORRECTION.

---

## 12. Test Requirements

### TESTREQ-DASH-schedule-001

Validates:

Non-owner schedule load rejects before resource, availability, booking, or service reads.

Type:

Controller unit/security test.

Status:

MISSING.

---

### TESTREQ-DASH-schedule-002

Validates:

`createScheduleBooking`, `updateScheduleBookingStatus`, and `rescheduleScheduleBooking` delegate to bookings public index controllers with unchanged params.

Type:

Controller unit test.

Status:

PRESENT: `scheduleBookingCoordinator.controller.test.js`.

---

### TESTREQ-DASH-schedule-003

Validates:

Schedule UI surfaces booking mutation failures as modal error banners and refreshes after successful mutations.

Type:

Hook/component integration test.

Status:

MISSING.

---

### TESTREQ-DASH-schedule-004

Validates:

Cancelled and no-show bookings do not appear in the day schedule read path.

Type:

DAL/controller integration test.

Status:

MISSING.

---

### TESTREQ-DASH-schedule-005

Validates:

DB RLS prevents direct non-owner reads of `vport.resources`, `vport.availability_rules`, `vport.bookings`, and `vport.services` rows used by this module.

Type:

DB/RLS security test.

Status:

MISSING / NEEDS_VERIFICATION.

---

### TESTREQ-DASH-schedule-006

Validates:

Schedule UI either exposes a reschedule control wired to `rescheduleBooking` or behavior docs/tests assert that reschedule is hook/coordinator-only and not visible in `BookingDetailModal`.

Type:

Component/hook integration or source-bound architecture assertion.

Status:

MISSING / TRACKED BY SCHEDULE-RESCHEDULE-UI-001.

---

## 13. Security Findings Linked

| Finding ID | Severity | Status | Related Behavior IDs |
|---|---|---|---|
| TICKET-BOOKING-RPC-001 | HIGH | APPLIED / RLS POLICY HARDENED | BEH-DASH-schedule-003, BEH-DASH-schedule-004, BEH-DASH-schedule-005, BEH-DASH-schedule-203, BEH-DASH-schedule-303 |
| DEFER-DASH-001 | MEDIUM | OPEN | BEH-DASH-schedule-002 |
| DEFER-013 | CRITICAL pre-fix | RESOLVED 2026-06-02 | BEH-DASH-schedule-202, BEH-DASH-schedule-302 |
| SCHEDULE-RLS-001 | HIGH | NEEDS_VERIFICATION | BEH-DASH-schedule-001, BEH-DASH-schedule-201, BEH-DASH-schedule-301 |
| SCHEDULE-ROUTE-001 | LOW / documentation drift | OPEN | BEH-DASH-schedule-204, AC-DASH-schedule-004 |
| SCHEDULE-RESCHEDULE-UI-001 | MEDIUM / behavior drift | OPEN | BEH-DASH-schedule-005, BEH-DASH-schedule-107, BEH-DASH-schedule-304, AC-DASH-schedule-005, TESTREQ-DASH-schedule-006 |

---

## 14. THOR Release Gates

| Gate | Status | Blocking? |
|---|---|---|
| Dashboard matrix THOR classification | CAUTION | No, but requires tracked caution. |
| Module DR_STRANGE command coverage | BLOCKED | Yes for module-level release sign-off; only DR. STRANGE PARTIAL evidence exists. |
| Booking RLS policy hardening | APPLIED / LIVE VERIFIED | No, but schedule remains downstream for regression coverage. |
| Schedule RLS verification | NEEDS_VERIFICATION | Yes for security approval. |
| Coordinator boundary tests | PASS | No. |
| Schedule route and reschedule UI behavior docs match current source. | OPEN | Yes for behavior approval. |

---

## 15. Native / Alternate UI Parity

| Behavior | Native Equivalent | Status |
|---|---|---|
| Day schedule grid | Unknown | MISSING SOURCE |
| Create owner-side booking | Unknown | MISSING SOURCE |
| Booking detail/status actions | Unknown | MISSING SOURCE |
| Mobile operational/timeline schedule views | Unknown | MISSING SOURCE |

---

## 16. Engine Dependencies

| Engine | Purpose | Status |
|---|---|---|
| Booking module / booking engine boundary | Create owner-side bookings, update status, reschedule bookings. | ACTIVE; booking RLS hardening applied; reschedule limitation requires review. |
| Booking adapter | Actor-owner assertion for schedule read access. | ACTIVE at application layer. |
| Hydration engine | Hydrates lane member actors after schedule load. | ACTIVE. |

---

## 17. Open Questions

| ID | Question | Status |
|---|---|---|
| OQ-DASH-schedule-001 | Are profile-scoped resources and owner-actor-scoped resources both still required, or can one source be retired? | OPEN |
| OQ-DASH-schedule-002 | Are DB RLS policies verified for the exact read tables used by schedule? | OPEN |
| OQ-DASH-schedule-003 | Should `useVportOwnerSchedule` be split into read, modal, and booking-action hooks as documented in open debt? | OPEN |
| OQ-DASH-schedule-004 | What native or alternate UI parity contract applies to this schedule module? | OPEN |
| OQ-DASH-schedule-005 | Should schedule expose owner-side reschedule UI, or should the hook-level reschedule path be removed/private until the UI exists? | OPEN |

---

## 18. Confidence Review

| Section | Confidence | Source Verified |
|---|---|---|
| User Goal | HIGH | YES — module README and screen behavior. |
| Actors / Roles | HIGH | YES — ownership docs and controller gate. |
| Module Architecture | HIGH | YES — source files and architecture docs. |
| Happy Paths | HIGH | YES — hook, controller, modal, and tests. |
| Failure Paths | MEDIUM | YES for controller/hook errors; runtime UI copy beyond source not tested. |
| Security Rules | HIGH | YES for app-layer gates; DB RLS remains unverified. |
| Must Never Happen | HIGH | YES — derived from ownership docs and blockers. |
| Data Changes | HIGH | YES — DAL/controller source. |
| Side Effects | MEDIUM | YES for hydration; no runtime tracing run. |
| UI Outputs | HIGH | YES — screen and modal source. |
| Acceptance Criteria | MEDIUM | YES — source review only, no test execution in this ticket. |
| Test Requirements | HIGH | YES — existing test file and missing coverage from source review. |
| Security Findings Linked | HIGH | YES — dashboard governance docs. |
| THOR Release Gates | MEDIUM | YES — dashboard matrix and module DR_STRANGE conflict preserved. |
| Native / Alternate UI Parity | LOW | NO — no native parity source found. |
| Engine Dependencies | HIGH | YES — imports and docs. |
| Open Questions | HIGH | YES — from docs and source gaps. |

---

## 19. Command Sign-Off

ARCHITECT: DRAFTED_FROM_SOURCE

VENOM: DRAFTED_FROM_EXISTING_DASHBOARD_MATRIX

ELEKTRA: DRAFTED_FROM_EXISTING_DASHBOARD_MATRIX

BLACKWIDOW: DRAFTED_FROM_EXISTING_DASHBOARD_MATRIX

SPIDER-MAN: PARTIAL — coordinator delegation test present; ownership/RLS/UI mutation tests missing.

PROFESSOR X: DRAFT_READY_FOR_REVIEW

THOR: CAUTION at dashboard matrix; booking RLS hardening applied, but module-level command evidence, route/reschedule behavior corrections, and broader regression coverage remain incomplete.

---

## 13. Known Gaps (ARCHITECT Wave 2026-06-05)

| Gap | Severity | Finding ID | Handoff |
|---|---|---|---|
| schedule module imports vport DAL directly instead of using adapter | HIGH | ARCHITECT_VERIFIED | SENTRY |
| N+1 risk in loadDaySchedule when iterating bookings for calendar render | MEDIUM | ARCHITECT_VERIFIED | KRAVEN |
| Cache invalidation after schedule mutations undocumented at module level | MEDIUM | ARCHITECT_VERIFIED | LOKI |
| No native parity documentation for schedule card | LOW | ARCHITECT_VERIFIED | Falcon |

Regression coverage: MISSING — SPIDER-MAN required.

Ownership enforcement: [ARCHITECT_VERIFIED] scheduleOwnerId-scoped queries confirmed via assertActorOwnsVportActorController pattern in vport module. Cross-module DAL import bypasses adapter boundary — routes to SENTRY.

---

## 14. Validation Sources

- ARCHITECTURE.md: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/schedule/ARCHITECTURE.md (2026-06-05)
- Feature BEHAVIOR.md: ZZnotforproduction/APPS/VCSM/features/dashboard/BEHAVIOR.md §8 (schedule: view/manage slots), §11 (side effects: invalidateVportAvailabilityRules)
- Feature SECURITY.md: ZZnotforproduction/APPS/VCSM/features/dashboard/SECURITY.md (VEN-DASHBOARD-001 guard chain)
- ARCHITECT wave report: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/ARCHITECT_WAVE_REPORT_2026_06_05.md
- Ticket: TICKET-LOGAN-DASHBOARD-MODULE-BEHAVIOR-WAVE-0001

---

Final Verdict:

BEHAVIOR_ACTIVE — Schedule slot management documented. N+1 and cross-module DAL boundary violations route to KRAVEN and SENTRY. Regression coverage missing.
