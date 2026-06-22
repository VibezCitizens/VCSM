# Dashboard Module Behavior Contract — vportOwnerStats

Status: APPROVED

Module: vportOwnerStats

Parent Feature: dashboard

Category Key: dashboard

Created By Ticket: TICKET-BEHAV-DASHBOARD-vportOwnerStats-WRITE-0002

Last Updated: 2026-06-04

Current Security Status:
- THOR: CLEAR
- Open Findings:
  - None
- Patched Findings:
  - VEN-DASH-001
  - ELEK-003
  - BLOCK-DASH-005
- Security Review Status:
  - VENOM: COMPLETE / PATCHED
  - ELEKTRA: COMPLETE / PATCHED
  - BLACKWIDOW: COMPLETE / PATCHED
  - SPIDER-MAN: COMPLETE

---

## 1. User Goal

A verified VPORT owner can see a compact operational summary for a barbershop VPORT: today's booking count, upcoming booking count, and active linked barber count.

---

## 2. Actors / Roles

| Actor | Allowed Actions | Restrictions |
|---|---|---|
| VPORT owner | May view owner quick stats for a VPORT they own. | Must be verified through canonical actor ownership before operational stats are read. |
| Non-owner viewer | Must not view or infer owner quick stats. | Must not receive booking counts or staff counts for a VPORT they do not own. |
| Dashboard/profile UI | May render the stats band after UI-level owner checks. | UI owner checks are display gates only and must not be treated as security boundaries. |
| Hook | May lifecycle-load quick stats when an `actorId` exists. | Must not perform business authorization or direct database access. |
| Controller | Must enforce ownership before reading operational data. | Current controller requires `callerActorId` and asserts ownership before reads. |

---

## 3. Module Architecture

### Routes

No standalone route is owned by this module.

The rendered owner band links to:
- `/actor/${actorId}/dashboard`

### Screens

Source consumer:
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport/screens/barbershop/VportBarberShopOwnerBand.jsx`

### Hooks

Dashboard hook:
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/dashboard/vport/hooks/useOwnerQuickStats.js`

Profile adapter hook:
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport/hooks/useVportOwnerQuickStats.js`

Adapter export:
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/dashboard/vport/adapters/vport.adapter.js`

### Controllers

Controller:
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/dashboard/vport/controller/vportOwnerStats.controller.js`

Controller entrypoint:
- `loadOwnerQuickStatsController({ actorId, callerActorId })`

Current source:
- Controller requires target `actorId` and authenticated `callerActorId`.
- Controller calls `assertActorOwnsVportActorController`.
- Controller verifies ownership before profile, resources, staff, and bookings are read.

### DALs

Read DALs used:
- `readVportProfileByActorIdDAL({ actorId })`
- `listVportResourcesByProfileIdDAL({ profileId })`
- `listVportBookingsForProfileDayDAL({ resourceIds, rangeStart, rangeEnd })`

Staff/resource reads:
- `listVportStaffResourcesByProfileIdDAL({ profileId })`
- Staff read failures throw from the DAL and are surfaced through the controller/hook monitoring path.

### RPCs

None found.

### Edge Functions

None found.

### Engine Dependencies

No direct engine dependency found.

### Ownership Gates

Required:
- Caller actor must be verified as owner of the target VPORT actor before profile/resource/booking reads.

Current source:
- Controller-level ownership gate is present.
- UI-level owner-band rendering is display-only and is backed by controller authorization.

---

## 4. Happy Paths

### HP-001

BEH-DASH-vportOwnerStats-001

Preconditions:
- Viewer is the verified owner of a barbershop VPORT.
- VPORT owner band renders with a target VPORT `actorId`.
- Required controller ownership patch has been applied.

Flow:
- User opens the barbershop VPORT profile.
- Profile UI determines the viewer is the owner and renders `VportBarberShopOwnerBand`.
- `VportBarberShopOwnerBand` calls `useVportOwnerQuickStats(actorId, callerActorId)`.
- `useVportOwnerQuickStats(actorId, callerActorId)` delegates to `useOwnerQuickStats(actorId, callerActorId)` through the dashboard adapter.
- `useOwnerQuickStats` calls `loadOwnerQuickStatsController({ actorId, callerActorId })` in current source.
- Controller asserts actor ownership before resolving the VPORT profile.
- Controller reads resources and booking rows.
- Controller returns `todayCount`, `upcomingCount`, and `activeBarbers`.
- UI renders Today, Upcoming, and Barbers counts.

Expected Result:
- Verified owner sees operational quick stats for their VPORT.

Data Changes:
- None.

### HP-002

BEH-DASH-vportOwnerStats-002

Preconditions:
- VPORT profile resolves.
- No resource IDs exist.

Flow:
- Controller reads the VPORT profile.
- Controller reads resource rows.
- Controller finds no resource IDs.
- Booking DAL calls are skipped.
- Controller returns zero booking counts.

Expected Result:
- UI displays zero Today and Upcoming counts without issuing booking reads.

Data Changes:
- None.

### HP-003

BEH-DASH-vportOwnerStats-003

Preconditions:
- Owner band is rendered.
- `hideBookingButton` is false.
- Parent screen supplies `onNewBooking`.

Flow:
- Owner clicks `New Booking`.
- Owner band invokes the caller-provided `onNewBooking` callback.

Expected Result:
- Parent profile workflow changes to the booking/calendar surface.
- vportOwnerStats performs no data mutation.

Data Changes:
- None.

---

## 5. Failure Paths

### FP-001

BEH-DASH-vportOwnerStats-101

Trigger:
- Hook receives no `actorId`.

Expected System Behavior:
- Hook returns without calling the controller.

Expected UI Behavior:
- Stats remain unset; rendered values fall back to zero or loading-safe display depending on caller state.

Expected Logging:
- None observed.

### FP-002

BEH-DASH-vportOwnerStats-102

Trigger:
- Controller receives no `actorId`.

Expected System Behavior:
- Controller throws `actorId is required`.

Expected UI Behavior:
- Hook catches the error, captures monitoring, and clears loading state.

Expected Logging:
- `captureMonitoringError(err, { context: "useOwnerQuickStats", actorId })`

### FP-003

BEH-DASH-vportOwnerStats-103

Trigger:
- VPORT profile cannot resolve from `actorId`.

Expected System Behavior:
- Controller throws `Could not resolve vport profile.`

Expected UI Behavior:
- Hook captures the error and clears loading state.

Expected Logging:
- Monitoring capture in `useOwnerQuickStats`.

### FP-004

BEH-DASH-vportOwnerStats-104

Trigger:
- Resource DAL or booking DAL errors.

Expected System Behavior:
- Error throws through the controller path.

Expected UI Behavior:
- Hook captures the error and clears loading state.

Expected Logging:
- Monitoring capture in `useOwnerQuickStats`.

### FP-005

BEH-DASH-vportOwnerStats-105

Trigger:
- Staff resource DAL query fails.

Expected System Behavior:
- Staff resource DAL throws the read error.
- Hook captures the propagated error through monitoring and clears loading state.

Expected UI Behavior:
- Active barber count is not silently treated as zero.
- Existing UI has no dedicated error state; loading clears after monitoring capture.

Expected Logging:
- `captureMonitoringError(err, { context: "useOwnerQuickStats", actorId, callerActorId })`

### FP-006

BEH-DASH-vportOwnerStats-106

Trigger:
- Component unmounts while stats request is in flight.

Expected System Behavior:
- Hook cancellation flag prevents React state updates after unmount.

Expected UI Behavior:
- No post-unmount UI update.

Expected Logging:
- None observed.

### FP-007

BEH-DASH-vportOwnerStats-107

Trigger:
- Non-owner reaches or directly invokes the stats controller with a target VPORT `actorId`.

Expected System Behavior:
- Controller rejects before profile/resource/booking reads.

Expected UI Behavior:
- No stats are rendered or returned through the controller.

Expected Logging:
- Hook captures propagated controller errors through monitoring when invoked from UI lifecycle.

---

## 6. Security Rules

### SEC-001

BEH-DASH-vportOwnerStats-201

Rule:
- Owner quick stats are owner-only operational data.

Enforcement Layer:
- Controller ownership gate plus database RLS as defense-in-depth.

Current Status:
- CLEAR. Controller-level ownership gate is present and source/test verified.

Finding Links:
- VEN-DASH-001
- ELEK-003
- BLOCK-DASH-005

### SEC-002

BEH-DASH-vportOwnerStats-202

Rule:
- UI owner checks are not security boundaries.

Enforcement Layer:
- Controller.

Current Status:
- CLEAR. Controller requires `callerActorId` and verifies ownership of the target `actorId`.

Finding Links:
- VEN-DASH-001
- ELEK-003

### SEC-003

BEH-DASH-vportOwnerStats-203

Rule:
- The controller must accept caller identity and verify ownership against the target VPORT actor before any profile, resource, staff, or booking read.

Enforcement Layer:
- Controller.

Current Status:
- COMPLETE. Controller accepts caller identity and verifies ownership before profile/resource/booking reads.

Finding Links:
- VEN-DASH-001
- ELEK-003
- BLOCK-DASH-005

### SEC-004

BEH-DASH-vportOwnerStats-204

Rule:
- RLS is defense-in-depth and must not be treated as the primary app-layer authorization model.

Enforcement Layer:
- Controller plus database policy.

Current Status:
- CLEAR. App-layer controller authorization is primary; RLS remains defense-in-depth.

Finding Links:
- VEN-DASH-001

### SEC-005

BEH-DASH-vportOwnerStats-205

Rule:
- Staff/resource query errors must be surfaced or monitored rather than silently counted as zero.

Enforcement Layer:
- Controller or DAL.

Current Status:
- COMPLETE. Staff/resource query is in `listVportStaffResourcesByProfileIdDAL`, which throws Supabase errors.

Finding Links:
- VPORTOWNERSTATS-SPIDER-009 — CLOSED

---

## 7. Must Never Happen

### MNH-001

BEH-DASH-vportOwnerStats-301

Invariant:
- The controller must never read profile, resources, or bookings before verifying actor ownership.

Current Status:
- CLEAR. Covered by focused controller regression tests.

Related Findings:
- VEN-DASH-001
- ELEK-003
- BLOCK-DASH-005

Required Tests:
- TESTREQ-DASH-vportOwnerStats-003

### MNH-002

BEH-DASH-vportOwnerStats-302

Invariant:
- A non-owner must never receive or infer booking counts.

Current Status:
- CLEAR. Non-owner rejection occurs before booking reads.

Related Findings:
- VEN-DASH-001
- ELEK-003

Required Tests:
- TESTREQ-DASH-vportOwnerStats-003

### MNH-003

BEH-DASH-vportOwnerStats-303

Invariant:
- A non-owner must never receive or infer active staff or barber count.

Current Status:
- CLEAR. Non-owner rejection occurs before staff/resource reads.

Related Findings:
- VEN-DASH-001
- ELEK-003

Required Tests:
- TESTREQ-DASH-vportOwnerStats-003

### MNH-004

BEH-DASH-vportOwnerStats-304

Invariant:
- Missing or invalid `actorId` must never issue database reads.

Current Status:
- CLEAR for missing `actorId`; invalid but syntactically present `actorId` proceeds to profile lookup.

Related Findings:
- VEN-DASH-001

Required Tests:
- TESTREQ-DASH-vportOwnerStats-001
- TESTREQ-DASH-vportOwnerStats-002

### MNH-005

BEH-DASH-vportOwnerStats-305

Invariant:
- Supabase failures must never leave loading state stuck.

Current Status:
- CLEAR for hook loading cleanup.

Related Findings:
- None.

Required Tests:
- TESTREQ-DASH-vportOwnerStats-008

### MNH-006

BEH-DASH-vportOwnerStats-306

Invariant:
- An unmounted hook must never update React state.

Current Status:
- CLEAR.

Related Findings:
- None.

Required Tests:
- TESTREQ-DASH-vportOwnerStats-008

### MNH-007

BEH-DASH-vportOwnerStats-307

Invariant:
- Cancelled and no-show bookings must never be counted.

Current Status:
- SOURCE_VERIFIED through booking DAL usage documented in the existing module draft; dedicated test still required.

Related Findings:
- None.

Required Tests:
- TESTREQ-DASH-vportOwnerStats-007

### MNH-008

BEH-DASH-vportOwnerStats-308

Invariant:
- This module must never mutate profiles, resources, or bookings.

Current Status:
- CLEAR.

Related Findings:
- None.

Required Tests:
- TESTREQ-DASH-vportOwnerStats-010

### MNH-009

BEH-DASH-vportOwnerStats-309

Invariant:
- Staff/resource read failures must not silently degrade to zero without monitoring.

Current Status:
- CLEAR. Staff DAL failures throw and are covered by focused regression tests.

Related Findings:
- VPORTOWNERSTATS-SPIDER-009 — CLOSED

Required Tests:
- TESTREQ-DASH-vportOwnerStats-009

### MNH-010

BEH-DASH-vportOwnerStats-310

Invariant:
- Public or RLS-accessible reads must never be treated as sufficient owner authorization.

Current Status:
- CLEAR. Controller ownership gate is source/test verified.

Related Findings:
- VEN-DASH-001
- ELEK-003

Required Tests:
- TESTREQ-DASH-vportOwnerStats-003

---

## 8. Data Changes

| Surface | Read | Insert | Update | Delete |
|---|---|---|---|---|
| `vport.profiles` | Yes: resolves profile by `actor_id` | No | No | No |
| `vport.resources` | Yes: reads resources and staff resources by `profile_id` through read DALs | No | No | No |
| `vport.bookings` | Yes: reads booking rows by resource IDs and date range through booking DAL | No | No | No |
| Monitoring | Yes: captures hook/controller failures | No | No | No |

---

## 9. Side Effects

Notifications:
- None.

Analytics:
- None observed.

Media:
- None.

Exports:
- None.

Jobs:
- None.

Cache:
- None observed.

Other:
- Hook captures operational errors through monitoring.
- Owner band can invoke a caller-provided `onNewBooking` callback; mutation, if any, belongs to the parent booking workflow, not this module.
- Owner band navigates to `/actor/${actorId}/dashboard` for Full Dashboard.

---

## 10. UI Outputs

Loading States:
- Stat values render an em dash while loading.

Success States:
- Today count.
- Upcoming count.
- Barbers count.
- Full Dashboard button.
- Optional New Booking button.

Error States:
- No explicit UI error state observed; failures are captured by monitoring and loading clears.

Empty States:
- Counts fall back to `0` when stats are null or no rows are found.

Owner States:
- Owner band displays `Your Business`, quick stats, dashboard navigation, and optional New Booking action.

Public States:
- Public/non-owner users must not receive owner stats. Current controller enforces this with `callerActorId` ownership verification before reads.

---

## 11. Acceptance Criteria

### AC-DASH-vportOwnerStats-001

Requirement:
- Verified owner sees accurate Today, Upcoming, and Barbers quick stats for their VPORT.

Evidence:
- `VportBarberShopOwnerBand.jsx`
- `useOwnerQuickStats.js`
- `vportOwnerStats.controller.js`

Status:
- APPROVED.

### AC-DASH-vportOwnerStats-002

Requirement:
- Non-owner caller cannot call the stats controller successfully.

Evidence:
- `VEN-DASH-001`
- `ELEK-003`
- `vportOwnerStats.controller.test.js`

Status:
- APPROVED.

### AC-DASH-vportOwnerStats-003

Requirement:
- Controller performs ownership verification before profile, resource, booking, or staff reads.

Evidence:
- `vportOwnerStats.controller.js`
- `SECURITY.md` VEN-DASH-001
- `BLOCKERS.md` BLOCK-DASH-005
- `vportOwnerStats.controller.test.js`

Status:
- APPROVED.

### AC-DASH-vportOwnerStats-004

Requirement:
- Empty resource sets return zero booking counts without booking DAL calls.

Evidence:
- `vportOwnerStats.controller.js`

Status:
- APPROVED.

### AC-DASH-vportOwnerStats-005

Requirement:
- Hook loading state clears on success, failure, and unmount-safe cancellation.

Evidence:
- `useOwnerQuickStats.js`

Status:
- APPROVED.

### AC-DASH-vportOwnerStats-006

Requirement:
- No write, RPC, or edge-function surface is introduced.

Evidence:
- Source scan and current controller/hook/DAL path.

Status:
- APPROVED.

### AC-DASH-vportOwnerStats-007

Requirement:
- Staff DAL query failures are surfaced or monitored.

Evidence:
- `vportOwnerStats.controller.js`
- `vportOwnerStats.controller.test.js`

Status:
- APPROVED.

---

## 12. Test Requirements

### TESTREQ-DASH-vportOwnerStats-001

Validates:
- Missing hook `actorId` does not call controller.

Type:
- Hook unit test.

Status:
- COMPLETE.

### TESTREQ-DASH-vportOwnerStats-002

Validates:
- Missing controller `actorId` rejects before database reads.

Type:
- Controller unit test.

Status:
- COMPLETE.

### TESTREQ-DASH-vportOwnerStats-003

Validates:
- Non-owner caller is rejected before profile, resource, staff, or booking reads.

Type:
- Security/controller test.

Status:
- COMPLETE.

### TESTREQ-DASH-vportOwnerStats-004

Validates:
- Verified owner receives correct today, upcoming, and active barber counts.

Type:
- Controller integration test.

Status:
- COMPLETE.

### TESTREQ-DASH-vportOwnerStats-005

Validates:
- No resources returns zero booking counts without booking DAL calls.

Type:
- Controller unit test.

Status:
- COMPLETE.

### TESTREQ-DASH-vportOwnerStats-006

Validates:
- Active barbers count only rows where `is_active !== false` and `meta.status === "linked"`.

Type:
- Controller unit test.

Status:
- COMPLETE.

### TESTREQ-DASH-vportOwnerStats-007

Validates:
- Cancelled and no-show bookings are excluded from counts.

Type:
- DAL/controller integration test.

Status:
- COMPLETE.

### TESTREQ-DASH-vportOwnerStats-008

Validates:
- DAL failures are captured and loading resets without post-unmount state updates.

Type:
- Hook/controller test.

Status:
- COMPLETE.

### TESTREQ-DASH-vportOwnerStats-009

Validates:
- Staff query failures are surfaced or monitored, not silently counted as zero.

Type:
- Controller test.

Status:
- COMPLETE.

### TESTREQ-DASH-vportOwnerStats-010

Validates:
- Scanner/test coverage confirms no write, RPC, or edge-function surface.

Type:
- Static/scanner traceability test.

Status:
- COMPLETE.

---

## 13. Security Findings Linked

| Finding ID | Severity | Status | Related Behavior IDs |
|---|---|---|---|
| VEN-DASH-001 | HIGH | PATCHED / SOURCE VERIFIED | BEH-DASH-vportOwnerStats-201, 202, 203, 301, 302, 303, 310 |
| ELEK-003 | HIGH | PATCHED / SOURCE VERIFIED | BEH-DASH-vportOwnerStats-201, 202, 203, 301, 302, 303, 310 |
| BLOCK-DASH-005 | P0 | PATCHED / SOURCE VERIFIED | BEH-DASH-vportOwnerStats-203, 301 |
| VPORTOWNERSTATS-SPIDER-009 | MEDIUM | CLOSED — SPIDER-MAN PASS | BEH-DASH-vportOwnerStats-205, 309 |

---

## 14. THOR Release Gates

| Gate | Status | Blocking? |
|---|---|---|
| Module classification | COMPLETE | No |
| Architecture coverage | COMPLETE | No |
| VENOM coverage | COMPLETE / PATCHED | No |
| ELEKTRA coverage | COMPLETE / PATCHED | No |
| BLACKWIDOW coverage | COMPLETE / PATCHED | No |
| Controller ownership gate | COMPLETE | No |
| Caller identity threaded into hook/controller | COMPLETE | No |
| Staff DAL error handling | COMPLETE | No |
| Write surface review | CLEAR | No |
| SPIDER-MAN tests | COMPLETE — 8 focused controller/static tests passing | No |
| BEHAVIOR.md contract | APPROVED | No |

---

## 15. Native / Alternate UI Parity

| Behavior | Native Equivalent | Status |
|---|---|---|
| Today quick stat | No native equivalent found in source. | NOT_APPLICABLE |
| Upcoming quick stat | No native equivalent found in source. | NOT_APPLICABLE |
| Active barbers quick stat | No native equivalent found in source. | NOT_APPLICABLE |
| Owner-only access to quick stats | No native equivalent found in source; required for any future alternate UI. | NOT_APPLICABLE |

---

## 16. Engine Dependencies

| Engine | Purpose | Status |
|---|---|---|
| None | No direct engine dependency found in current source. | CLEAR |
| Dashboard VPORT adapter | Cross-feature access from profile VPORT owner band into dashboard quick-stats hook. | SOURCE_VERIFIED |

---

## 17. Open Questions

| ID | Question | Status |
|---|---|---|
| OQ-DASH-vportOwnerStats-001 | Should date ranges use the VPORT/business timezone instead of local browser time? | DEFERRED / NON-BLOCKING PRODUCT IMPROVEMENT |
| OQ-DASH-vportOwnerStats-002 | Should booking DAL select fewer customer fields when the controller only needs counts? | DEFERRED / NON-BLOCKING PERFORMANCE HARDENING |
| OQ-DASH-vportOwnerStats-003 | Should stats use a short TTL cache with invalidation on booking/resource changes? | DEFERRED / NON-BLOCKING PERFORMANCE IMPROVEMENT |
| OQ-DASH-vportOwnerStats-004 | Should staff resource reads move into a DAL and handle Supabase errors explicitly? | RESOLVED — `listVportStaffResourcesByProfileIdDAL` |
| OQ-DASH-vportOwnerStats-005 | Should this module receive its own canonical dashboard module category key instead of generic `dashboard`? | CLOSED — current dashboard category key accepted for this module approval. |

---

## 18. Confidence Review

| Section | Confidence | Source Verified |
|---|---|---|
| User Goal | MEDIUM-HIGH | Yes |
| Actors / Roles | HIGH | Yes |
| Module Architecture | HIGH | Yes |
| Happy Paths | HIGH | Yes |
| Failure Paths | MEDIUM-HIGH | Yes |
| Security Rules | HIGH | Yes |
| Must Never Happen | HIGH | Yes |
| Data Changes | HIGH | Yes |
| Side Effects | HIGH | Yes |
| UI Outputs | HIGH | Yes |
| Acceptance Criteria | MEDIUM-HIGH | Yes |
| Test Requirements | HIGH | Yes: focused controller/static tests now pass. |
| Security Findings Linked | HIGH | Yes |
| THOR Release Gates | HIGH | Yes |
| Native / Alternate UI Parity | MEDIUM | Yes: no native equivalent found; marked NOT_APPLICABLE for this release. |
| Engine Dependencies | HIGH | Yes |
| Open Questions | HIGH | Yes |

---

## 19. Command Sign-Off

ARCHITECT: COMPLETE — module path, hook, controller, DAL reads, adapter boundary, and read-only surface verified.

VENOM: COMPLETE / PATCHED — VEN-DASH-001 is patched; operational quick stats require callerActorId and controller-level ownership verification before reads.

ELEKTRA: COMPLETE / PATCHED — ELEK-003 is patched; source-to-sink path now binds target `actorId` to authenticated `callerActorId`.

BLACKWIDOW: COMPLETE / PATCHED — non-owner adversarial path is rejected at the controller layer before any stats DAL read.

SPIDER-MAN: COMPLETE — `vportOwnerStats.controller.test.js` passes 8 focused tests covering required IDs, non-owner rejection before reads, verified-owner counts, no-resource short circuit, active barber filtering, staff DAL error surfacing, and no-write/RPC/edge static guards.

PROFESSOR X: APPROVED — behavior contract source-verified and test-backed for module release.

THOR: CLEAR — ownership gate, caller identity threading, staff DAL handling, read-only status, BEHAVIOR approval, and focused SPIDER-MAN coverage are complete.

---

## 14. ARCHITECT Wave Reference (2026-06-05)

ARCHITECTURE.md created: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/vportOwnerStats/ARCHITECTURE.md

Key findings from ARCHITECT wave:
- Controller-only sub-module at vport/controller/vportOwnerStats.controller.js (not a dashboard card)
- Read-only: no write surfaces identified
- Stats aggregation scope (bookings, revenue, occupancy) confirmed via callgraph
- 8 callgraph nodes (controller layer only — no dedicated DAL)

Ticket: TICKET-LOGAN-DASHBOARD-MODULE-BEHAVIOR-WAVE-0001

---

Final Verdict:

BEHAVIOR_DASHBOARD_vportOwnerStats_APPROVED
