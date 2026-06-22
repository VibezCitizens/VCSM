---
# Schedule Card — Architecture

**Module:** schedule
**Path:** apps/VCSM/src/features/dashboard/vport/dashboard/cards/schedule/
**Maintained by:** ARCHITECT
**Last updated:** 2026-06-02

---

## Layer Map

```
VportDashboardScheduleScreen.jsx          [Screen — gate + composition]
  └─ useVportOwnerSchedule.js             [Hook — state + lifecycle]
       ├─ loadDayScheduleController       [schedule/controller — internal ✓]
       └─ scheduleBookingCoordinator      [schedule/controller — boundary adapter ✓]
            └─ bookings public index      [@/.../cards/bookings — public ✓]
                 ├─ createOwnerBookingController
                 ├─ updateBookingStatusController
                 └─ rescheduleBookingController
```

---

## Contract Compliance

| Rule | Status | Notes |
|---|---|---|
| No cross-card internal imports | RESOLVED | DEFER-013 — coordinator introduced 2026-06-02 |
| Hooks at card-level /hooks | COMPLIANT | hooks/ directory at card root |
| Screen owns gate + composition only | COMPLIANT | 168-line screen, no business logic |
| Controller owns business workflow | COMPLIANT | loadDaySchedule.controller.js + coordinator |
| DAL separation (read/write) | COMPLIANT | uses shared vport DAL layer |
| Final/View screen split | DEFERRED | Screen is 168 lines — below threshold; monitor |

---

## DEFER-013 — Cross-Card Import Violation (RESOLVED)

**Severity:** CRITICAL (pre-fix)
**Resolved:** 2026-06-02
**Reference:** sprint/TICKET-0004/SCHEDULE_DEPENDENCY_MAP.md

**Finding:**
`useVportOwnerSchedule.js` lines 5–6 imported booking controllers via internal paths:
```javascript
// VIOLATION (removed):
import { createOwnerBookingController } from
  "@/features/dashboard/vport/dashboard/cards/bookings/controller/createOwnerBooking.controller";
import { updateBookingStatusController, rescheduleBookingController } from
  "@/features/dashboard/vport/dashboard/cards/bookings/controller/updateVportBooking.controller";
```

**Resolution:**
Created `controller/scheduleBookingCoordinator.controller.js`. Imports from the bookings
public index. `useVportOwnerSchedule.js` now imports from the coordinator only.

---

## Open Debt

| Item | Description | Priority | Sprint |
|---|---|---|---|
| Hook split | `useVportOwnerSchedule` (150 lines, 4 concerns) → `useScheduleData` + `useScheduleModals` + `useScheduleBookingOps` | P1 | Follow-on after coordinator verified |
| TICKET-BOOKING-RPC-001 | RLS hardening is live-verified; direct reschedule field updates are intentionally not DB-granted, so only `scheduleBookingCoordinator.controller.js` and booking controllers should need follow-up if owner reschedule remains required | P1 | Add SPIDER-MAN coverage |
