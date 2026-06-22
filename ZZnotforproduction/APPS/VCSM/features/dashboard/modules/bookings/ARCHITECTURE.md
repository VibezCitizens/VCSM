# ARCHITECTURE — Dashboard Module: bookings

**Last ARCHITECT Run:** 2026-06-05
**Architecture State:** SOURCE_VERIFIED
**Ticket:** TICKET-ARCHITECT-DASHBOARD-MODULE-WAVE-0001
**Scanner Version:** 1.1.0

---

## MODULE ARCHITECTURE REPORT

Module: bookings
Application Scope: VCSM
Module Type: dashboard card module
Primary Root: apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/
Independence Status: MOSTLY INDEPENDENT
Completeness Status: MOSTLY COMPLETE

---

## PURPOSE

[SOURCE_VERIFIED] Manages VPORT booking lifecycle from the owner dashboard perspective. Provides the owner with the ability to view booking history, create owner-initiated bookings, update booking status (confirm / cancel / complete / no-show), and view operational booking cards. The public booking creation path (citizen books a VPORT service) also lives here. Booking mutations enforce a state-machine guard that rejects writes against terminal bookings (TERMINAL_STATUSES: completed, cancelled, no_show — see VPD-V-021 in updateVportBooking.controller.js).

---

## OWNERSHIP

[SOURCE_VERIFIED] Owner: VCSM:dashboard
Write authority: controller layer only
Ownership enforcement: `assertActorOwnsVportActorController` imported via `@/features/booking/adapters/booking.adapter` — present in updateVportBooking.controller.js

---

## ENTRY POINTS

[SOURCE_VERIFIED]
- Route: `/actor/:actorId/dashboard/booking-history` → VportDashboardBookingHistoryScreen.jsx
- Exported via: `index.js`
- Public booking path: `vportPublicBooking.controller.js` (no dashboard route — called from booking feature)

---

## LAYER MAP

DAL:
- `dal/insertVportBooking.write.dal.js` — INSERT bookings [SOURCE_VERIFIED]
- `@/features/dashboard/vport/dal/write/updateVportBooking.write.dal.js` — UPDATE bookings (shared vport DAL, called via controller) [SOURCE_VERIFIED]
- `@/features/dashboard/vport/dal/read/vportBookingById.read.dal.js` — READ single booking [SOURCE_VERIFIED]
- `@/features/dashboard/vport/dal/read/vportBookingsInRange.read.dal.js` — READ range [SOURCE_VERIFIED]

Model:
- `model/vportBooking.model.js` [SOURCE_VERIFIED]
- `model/vportBookingHistoryView.model.js` [SOURCE_VERIFIED]

Controller:
- `controller/createOwnerBooking.controller.js` — owner-initiated booking [SOURCE_VERIFIED]
- `controller/updateVportBooking.controller.js` — status update, terminal guard, ownership check [SOURCE_VERIFIED]
- `controller/vportPublicBooking.controller.js` — public citizen booking, resource availability check [SOURCE_VERIFIED]

Hook:
- `hooks/useQuickBookingModal.js` [SOURCE_VERIFIED]
- `hooks/useVportBookingActions.js` [SOURCE_VERIFIED]
- `hooks/useVportBookingOps.js` [SOURCE_VERIFIED]

Component: (none in module — components live in `vport/components/bookingHistory/`) [SCANNER_LEAD]

Screen:
- `VportDashboardBookingHistoryScreen.jsx` [SOURCE_VERIFIED]
- `VportDashboardBookingHistoryView.jsx` [SOURCE_VERIFIED]

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | updateVportBooking.controller.js — clear booking lifecycle | — |
| Owner defined | PASS | `assertActorOwnsVportActorController` in controller | — |
| Entry points mapped | PASS | VportDashboardBookingHistoryScreen route in app.routes.jsx | — |
| Controllers present/delegated | PASS | 3 controllers (create/update/public) | — |
| DAL/repository present/delegated | PASS | insert + update + read DALs | — |
| Models/transformers present | PASS | vportBooking.model.js + historyView | — |
| Hooks/view models present | PASS | 3 hooks | — |
| Screens/components present | PARTIAL | Screen+View present; components in vport/ not bookings/ | Cross-module component ownership risk |
| Services/adapters present | PASS | booking.adapter used for ownership | — |
| Database objects mapped | PASS | table: bookings (write-surface-map confirmed) | — |
| Authorization path mapped | PASS | assertActorOwnsVportActorController + TERMINAL_STATUSES guard | — |
| Cache/runtime behavior mapped | PARTIAL | No explicit cache; hooks manage state | Cache layer undocumented |
| Error/loading/empty states mapped | PARTIAL | Error throws in controller; UI states not verified | — |
| Documentation linked | FAIL | No BEHAVIOR.md present | MISSING |
| Tests/validation noted | PASS | 3 test files: insertVportBooking, updateVportBooking, vportPublicBooking | — |
| Native parity noted | FAIL | No native parity notes | — |
| Engine dependencies mapped | PASS | booking engine (assertActorOwnsVportActorController), notifications engine | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| booking.adapter | engine | bookings → booking engine | YES — via adapter | assertActorOwnsVportActorController |
| notifications.adapter | engine | bookings → notifications | YES — via adapter | publishVcsmNotification, publishVcsmNotificationBatch |
| vport/dal/write/updateVportBooking | feature-DAL | bookings → vport | RISK — direct cross-module DAL import | Should be accessed via vport controller or adapter |
| vport/dal/read/* | feature-DAL | bookings → vport | RISK — direct cross-module DAL read imports | vportBookingById, vportBookingsInRange, vportProfile |
| vport/dashboard/cards/bookings/dal | self | internal | YES | insertVportBooking.write.dal |
| vport/components/bookingHistory/ | feature-component | bookings cards → vport/components | PARTIAL — shared component ownership unclear | BookingCard, OperationalBookingCard, QuickBookingModal |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| bookings table | read/write | VCSM:dashboard/bookings | bookings controllers | INSERT + UPDATE confirmed in write-surface-map |
| booking status | write | updateVportBooking.controller | hook → controller | Terminal status guard present |
| profile_id | read | vport/dal/read/vportProfile | vportPublicBooking.controller | Resolved server-side from actorId |
| customer_actor_id | read | bookings table | updateVportBooking.controller | Nullable — null for owner-initiated |
| resources table | read | vport/dal/read/vportResource | vportPublicBooking.controller | Availability check |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PASS | /actor/:actorId/dashboard/booking-history | — |
| Loading state | PARTIAL | Hook-managed; not verified in screen | — |
| Empty state | PARTIAL | VportDashboardBookingHistoryView.jsx likely handles | Unverified |
| Error state | PASS | Controller throws on invalid state/auth | — |
| Auth/owner gates | PASS | OwnerOnlyDashboardGuard at route + assertActorOwnsVportActorController in controller | — |
| Cache behavior | UNKNOWN | No cache layer observed | Low risk |
| Runtime dependencies | PASS | booking.adapter, notifications.adapter | — |
| Hot paths | PARTIAL | updateBookingStatusController is hot; terminal guard is first check | — |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/bookings/ | MISSING |
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
| BEHAVIOR.md | HIGH | No behavioral contract documented; VPD-V-021 exists only as code comment | LOGAN |
| Cross-module DAL boundary | HIGH | bookings imports vport DAL directly — bypasses module boundary | SENTRY |
| Component ownership clarification | MEDIUM | BookingCard/QuickBookingModal live in vport/components not bookings/components | IRONMAN |
| Cache/runtime behavior docs | MEDIUM | No cache layer; hot path undocumented | LOKI |
| Native parity notes | LOW | No iOS parity documented | Falcon |

---

## MODULE BOUNDARY WARNINGS

**MODULE BOUNDARY WARNING**
Location: apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/controller/updateVportBooking.controller.js
Module: bookings
Current dependency: Direct import of `@/features/dashboard/vport/dal/write/updateVportBooking.write.dal`
Expected boundary: Access vport DAL through a vport adapter or delegated controller
Risk: MEDIUM — couples bookings card to vport DAL internals; vport DAL changes break bookings
Suggested correction: Expose `updateVportBookingController` from vport module; bookings card calls it

**MODULE BOUNDARY WARNING**
Location: apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/controller/vportPublicBooking.controller.js
Module: bookings
Current dependency: Multiple direct imports of `@/features/dashboard/vport/dal/read/*`
Expected boundary: vport reads should be delegated through vport controller/adapter
Risk: MEDIUM — same as above; fragile if vport DAL paths change
Suggested correction: Expose a `getVportBookingContext` function from vport module

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Resolve cross-module DAL imports | Architecture boundary violation | SENTRY |
| P1 | Add BEHAVIOR.md | VPD-V-021 and state machine undocumented | LOGAN |
| P2 | Document cache/runtime behavior | Hot path undocumented | LOKI |
| P3 | Clarify component ownership | BookingCard/QuickBookingModal location | IRONMAN |

## RECOMMENDED HANDOFFS: SENTRY, LOGAN, LOKI, IRONMAN
