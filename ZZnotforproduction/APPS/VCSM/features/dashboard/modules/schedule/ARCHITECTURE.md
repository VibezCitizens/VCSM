# ARCHITECTURE — Dashboard Module: schedule

**Last ARCHITECT Run:** 2026-06-05
**Architecture State:** SOURCE_VERIFIED
**Ticket:** TICKET-ARCHITECT-DASHBOARD-MODULE-WAVE-0001
**Scanner Version:** 1.1.0

---

## MODULE ARCHITECTURE REPORT

Module: schedule
Application Scope: VCSM
Module Type: dashboard card module
Primary Root: apps/VCSM/src/features/dashboard/vport/dashboard/cards/schedule/
Independence Status: MOSTLY INDEPENDENT
Completeness Status: MOSTLY COMPLETE

---

## PURPOSE

[SOURCE_VERIFIED] Renders the operational schedule grid for VPORT owners (particularly barbershop-type VPORTs with staff lanes). Provides a lane-based schedule grid showing bookings by staff member/resource for a selected day. Supports day-load, booking coordination (reschedule/confirm/cancel from grid), and modal interactions. The schedule coordinator controller orchestrates multiple DAL calls for a complete day view.

---

## OWNERSHIP

[SOURCE_VERIFIED] Owner: VCSM:dashboard
Write authority: scheduleBookingCoordinator.controller.js — booking state updates within schedule context
Ownership enforcement: delegated to booking adapter (assertActorOwnsVportActorController) via scheduleBookingCoordinator

---

## ENTRY POINTS

[SOURCE_VERIFIED]
- Route: `/actor/:actorId/dashboard/schedule` → VportDashboardScheduleScreen.jsx
- Exported via: `index.js`

---

## LAYER MAP

DAL: NONE in card — all DAL delegated to vport module [SOURCE_VERIFIED]
(vport/dal/read/listVportBookingsForProfileDay, vportAvailabilityRules, vportResource, vportProfile)

Model:
- `model/vportAvailabilityRule.model.js` [SOURCE_VERIFIED]

Controller:
- `controller/loadDaySchedule.controller.js` — loads bookings for a given day [SOURCE_VERIFIED]
- `controller/scheduleBookingCoordinator.controller.js` — coordinates booking mutations from schedule grid [SOURCE_VERIFIED]

Hook:
- `hooks/useVportOwnerSchedule.js` — schedule state, day selection, data loading [SOURCE_VERIFIED]

Component:
- `components/schedule/BarberLaneHeader.jsx` [SOURCE_VERIFIED]
- `components/schedule/ScheduleGrid.jsx` — main grid layout [SOURCE_VERIFIED]
- `components/schedule/ScheduleLaneElements.jsx` [SOURCE_VERIFIED]
- `components/schedule/ScheduleModals.jsx` [SOURCE_VERIFIED]
- `components/schedule/ScheduleOperationalView.jsx` [SOURCE_VERIFIED]
- `components/schedule/scheduleConstants.js` [SOURCE_VERIFIED]
- `components/schedule/scheduleTimeUtils.js` [SOURCE_VERIFIED]

Screen:
- `VportDashboardScheduleScreen.jsx` [SOURCE_VERIFIED]
- `index.js` [SOURCE_VERIFIED]

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Lane-based schedule grid with booking coordination | — |
| Owner defined | PASS | VCSM:dashboard | — |
| Entry points mapped | PASS | /actor/:actorId/dashboard/schedule confirmed | — |
| Controllers present/delegated | PASS | loadDaySchedule + scheduleBookingCoordinator | — |
| DAL/repository present/delegated | PARTIAL | DAL delegated to vport module — delegation implicit | Boundary not documented |
| Models/transformers present | PARTIAL | vportAvailabilityRule.model.js present | Missing booking model for schedule |
| Hooks/view models present | PASS | useVportOwnerSchedule | — |
| Screens/components present | PASS | Screen + 7 schedule components | — |
| Services/adapters present | PARTIAL | booking adapter used in coordinator | No explicit schedule adapter |
| Database objects mapped | PARTIAL | Delegated to vport DAL | Not documented at card level |
| Authorization path mapped | PARTIAL | booking.adapter in coordinator; route guard at route | Direct schedule access path unverified |
| Cache/runtime behavior mapped | PARTIAL | Not documented | — |
| Error/loading/empty states mapped | PARTIAL | ScheduleModals handles interactions; empty states unclear | — |
| Documentation linked | FAIL | No BEHAVIOR.md | MISSING |
| Tests/validation noted | PARTIAL | 1 test: scheduleBookingCoordinator.controller.test.js | — |
| Native parity noted | FAIL | No notes | — |
| Engine dependencies mapped | PARTIAL | booking.adapter referenced; no explicit engine map | SCANNER_LEAD |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| vport/dal/read/listVportBookingsForProfileDay | feature-DAL | schedule → vport | RISK — direct cross-module DAL | Should be through controller or adapter |
| vport/dal/read/vportAvailabilityRules | feature-DAL | schedule → vport | RISK — direct cross-module DAL | Same as above |
| vport/dal/read/vportResource | feature-DAL | schedule → vport | RISK — direct cross-module DAL | Same as above |
| booking.adapter | engine | schedule → booking | YES — via adapter | assertActorOwnsVportActorController |
| OwnerOnlyDashboardGuard | route | route wrapper | YES | Route-level auth |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| bookings (day view) | read | vport/dal | loadDaySchedule.controller | Via vport DAL — cross-module |
| availability rules | read | vport/dal | loadDaySchedule.controller | Via vport DAL — cross-module |
| resources | read | vport/dal | loadDaySchedule.controller | Via vport DAL — cross-module |
| booking status | write | scheduleBookingCoordinator | scheduleBookingCoordinator | Delegates to booking adapter |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PASS | /actor/:actorId/dashboard/schedule | — |
| Loading state | PARTIAL | Hook manages loading state | Not verified in screen |
| Empty state | PARTIAL | ScheduleGrid likely shows empty day | Unverified |
| Error state | PARTIAL | Controller throws; hook catches | Screen error handling unverified |
| Auth/owner gates | PASS | Route guard + booking adapter ownership check | — |
| Cache behavior | UNKNOWN | Not documented | — |
| Runtime dependencies | PASS | booking.adapter dependency explicit | — |
| Hot paths | PARTIAL | loadDaySchedule is hot — loads all bookings/resources/rules for a day | Potential N+1 risk |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | — | MISSING |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | — | MISSING |
| Engine audit | — | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md | HIGH | Schedule coordination logic undocumented | LOGAN |
| Cross-module DAL imports | HIGH | loadDaySchedule imports vport DAL directly | SENTRY |
| N+1 risk in loadDaySchedule | MEDIUM | Three parallel DAL calls (bookings+rules+resources) — potential performance issue | KRAVEN |
| Cache/runtime docs | MEDIUM | Not documented | LOKI |
| Native parity | LOW | Not documented | Falcon |

---

## MODULE BOUNDARY WARNINGS

**MODULE BOUNDARY WARNING**
Location: apps/VCSM/src/features/dashboard/vport/dashboard/cards/schedule/controller/loadDaySchedule.controller.js
Module: schedule
Current dependency: Direct imports of vport/dal/read/{listVportBookingsForProfileDay, vportAvailabilityRules, vportResource}
Expected boundary: Access vport DAL through vport controller or adapter
Risk: MEDIUM — schedule card is tightly coupled to vport DAL internals
Suggested correction: Expose `loadDayScheduleContext` from vport module; schedule calls it

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Add BEHAVIOR.md | Coordination logic undocumented | LOGAN |
| P1 | Fix cross-module DAL imports | Architecture boundary violation | SENTRY |
| P2 | Review N+1 risk in loadDaySchedule | Three parallel DAL calls | KRAVEN |
| P2 | Document cache/runtime behavior | Hot path undocumented | LOKI |
| P3 | Native parity notes | Not documented | Falcon |

## RECOMMENDED HANDOFFS: LOGAN, SENTRY, KRAVEN, LOKI
