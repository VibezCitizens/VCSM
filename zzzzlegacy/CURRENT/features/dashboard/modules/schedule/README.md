# Module: Schedule

**VPORT Kinds:** ALL — primary use: any VPORT with staff and bookings (BARBER, BARBERSHOP, LOCKSMITH)
**Public/Owner:** OWNER only
**Route:** `/actor/:actorId/dashboard/schedule`
**Source:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/schedule/`
**Governance status:** SECURITY_REVIEW_PENDING
**Last updated:** 2026-05-27

---

## What This Module Does

Provides the VPORT owner's **day-view operational booking grid**. Displays bookings and availability blocks per staff member ("lane") for a selected date. The owner can:

- Navigate by date (previous/next day, jump to today)
- View each staff member's availability rules and actual bookings for the day
- Create new owner-side bookings directly from the schedule grid
- Update booking status (confirm, complete, cancel)
- Reschedule existing bookings

This is the **operational view** of daily activity. It is distinct from the Calendar card, which manages the underlying weekly availability rule configuration.

---

## Source Inventory

### Screens
- `VportDashboardScheduleScreen.jsx` — Accepts `actorId` as prop or reads from route params. Calls `useVportOwnerSchedule` directly. No separate Final Screen — ownership gate is inside the controller.

### Controller
- `controller/loadDaySchedule.controller.js` — `loadDayScheduleController` — ownership gate + staff resource merge + availability rule load + day booking load + services load

### DAL (shared — no local `dal/` folder)

All DAL calls go through shared read DALs at `apps/VCSM/src/features/dashboard/vport/dal/read/`:

| DAL | Table | Purpose |
|---|---|---|
| `vportProfile.read.dal` | `vport.profiles` | Resolve `profileId` from `actorId` |
| `vportResource.read.dal` | `vport.resources` | Profile-based staff (legacy) and actor-based resources |
| `vportAvailabilityRules.read.dal` | `vport.availability_rules` | Weekly availability rules per resource |
| `listVportBookingsForProfileDay.read.dal` | `vport.bookings` (or equivalent) | Day range bookings — contains customer names + notes |
| `vportServices.read.dal` | `vport.services` | Services list for booking creation |

### Hook
- `hooks/useVportOwnerSchedule.js` — Date navigation state, load orchestration, create/detail modal state, booking action dispatchers, actor hydration trigger

### Model
- `model/vportAvailabilityRule.model.js` — `mapAvailabilityRule` — pure row mapper (id, resourceId, ruleType, weekday, startTime, endTime, isActive)

### Components
- `components/schedule/ScheduleGrid.jsx` — Desktop and mobile grid views (`ScheduleGrid`, `MobileScheduleGrid`, `MobileBarberSelector`, `ScheduleSkeleton`)
- `components/schedule/ScheduleLaneElements.jsx` — Per-lane slot rendering
- `components/schedule/ScheduleModals.jsx` — `CreateBookingModal`, `BookingDetailModal`
- `components/schedule/ScheduleOperationalView.jsx` — Operational state and empty state wrapper
- `components/schedule/BarberLaneHeader.jsx` — Lane header with actor display (uses hydration)
- `components/schedule/scheduleConstants.js` — Grid time constants (slot height, day start/end)
- `components/schedule/scheduleTimeUtils.js` — Date formatting utilities

---

## Cross-Feature Dependencies

Booking mutations are delegated to the bookings card controllers — the schedule card does not bypass the bookings module's trust boundary:

| Controller | Source | Purpose |
|---|---|---|
| `createOwnerBookingController` | `cards/bookings/controller/createOwnerBooking.controller.js` | Create owner-side booking from schedule grid |
| `updateBookingStatusController` | `cards/bookings/controller/updateVportBooking.controller.js` | Confirm, complete, or cancel a booking |
| `rescheduleBookingController` | `cards/bookings/controller/updateVportBooking.controller.js` | Reschedule a booking to a new time |

---

## Architecture Notes

### Dual Resource Source Merge

`loadDayScheduleController` merges staff resources from two sources:
1. `listVportResourcesByProfileIdDAL` — profile-scoped (legacy model)
2. `listVportResourcesByOwnerActorIdDAL` — actor-scoped (engine calendar resource)

Results are deduplicated by `id` before processing. Whether both sources are still needed — or whether the profile-scoped path returns stale/orphaned resources — has not been verified. See SCHEDULE-FIND-001.

### No Final Screen

`VportDashboardScheduleScreen` does not implement a separate Final Screen for ownership gating. The controller-level `assertActorOwnsVportActorController` is the ownership enforcement point. See SCHEDULE-FIND-003.

---

## References

- Architecture doc: **PENDING** — `vcsm.vport-dashboard-schedule-card.architecture.md` (not yet created)
- Related: `modules/calendar/` — weekly availability rule configuration (complement to this card)
- Related: `modules/booking/` — booking engine (controllers called from this card)
- Related: `modules/availability/` — availability engine
