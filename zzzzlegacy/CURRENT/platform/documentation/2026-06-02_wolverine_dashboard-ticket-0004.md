---
# HISTORY — WOLVERINE Run Artifact
# ticket: TICKET-0004
# command: WOLVERINE
# feature: dashboard
# date: 2026-06-02
# run-by: session
# updates-current: yes
# current-file: zNOTFORPRODUCTION/CURRENT/features/dashboard/ARCHITECTURE.md, CURRENT_STATUS.md, DEFERRED.md
# supersedes: none
# status: COMPLETE

---

## TICKET-0004 — Dashboard Architecture Contract + Schedule P0 Remediation

**Scope:** VCSM / Dashboard / Schedule
**Type:** Architecture Contract + P0 Boundary Fix
**Date:** 2026-06-02

---

## Phase 1 — Dashboard Architecture Contract

**Created:**
zNOTFORPRODUCTION/_CANONICAL/logan/marvel/architect/VPORT/DASHBOARD/DASHBOARD_ARCHITECTURE_CONTRACT.md

15 rules defined. Core rule that drove TICKET-0004:

> Dashboard cards cannot import another card's internal controllers or DALs.
> Cross-card interaction must go through a public adapter/index boundary.

---

## Phase 2 — Schedule P0 Fix

### Problem

useVportOwnerSchedule.js contained 2 direct imports from bookings internal controller paths:

```
import { createOwnerBookingController } from "…/bookings/controller/createOwnerBooking.controller"
import { updateBookingStatusController, … } from "…/bookings/controller/updateVportBooking.controller"
```

This violated the architecture contract and created a hard dependency on bookings internals.

### Resolution

Created scheduleBookingCoordinator.controller.js as the single boundary layer between schedule and bookings.

Coordinator public API:
- createScheduleBooking(...) — delegates to createOwnerBookingController
- updateScheduleBookingStatus(...) — delegates to updateBookingStatusController
- rescheduleScheduleBooking(...) — delegates to rescheduleBookingController

Coordinator imports from bookings public index only:
`@/features/dashboard/vport/dashboard/cards/bookings`

useVportOwnerSchedule.js updated to import from coordinator only.

---

## Verification

| Check | Result |
|---|---|
| grep cards/bookings/controller in schedule card | 0 matches — violation eliminated |
| createScheduleBooking delegates correctly | PASS |
| updateScheduleBookingStatus delegates correctly | PASS |
| rescheduleScheduleBooking delegates correctly | PASS |

---

## Files

| Action | File |
|---|---|
| CREATED | DASHBOARD_ARCHITECTURE_CONTRACT.md |
| CREATED | scheduleBookingCoordinator.controller.js |
| EDITED | useVportOwnerSchedule.js — 2 violation imports removed |
| CREATED | scheduleBookingCoordinator.controller.test.js — 3 passing |
| EDITED | deferred-open-items.md — DEFER-013 appended as RESOLVED |
| CREATED | modules/schedule/architecture.md |

---

## CURRENT Files Updated

| CURRENT File | Update |
|---|---|
| CURRENT/features/dashboard/ARCHITECTURE.md | Created — contract rules, coordinator pattern, card inventory |
| CURRENT/features/dashboard/CURRENT_STATUS.md | Created — ticket state, release gates, remaining debt |
| CURRENT/features/dashboard/DEFERRED.md | Created — DEFER-013 resolved, DEFER-DASH-001/002/003 open |

---

## Deferred

- DEFER-013: RESOLVED
- Hook split (useScheduleData / useScheduleModals / useScheduleBookingOps): DEFERRED to P1

## Recommended Next Ticket

SETTINGS-ARCH-001 + SETTINGS-RISK-001

---

*This file is immutable. Do not edit after 2026-06-30.*
