# SCHEDULE_DEPENDENCY_MAP

**Ticket:** TICKET-0004 / SENTRY-SCHEDULE-001
**Phase:** 1 — P0 Schedule
**Produced:** 2026-06-02
**Status:** Planning only — no code changes

---

## 1. Current Dependency Graph

```
VportDashboardScheduleScreen.jsx
  └─ useVportOwnerSchedule (schedule/hooks)
       ├─ loadDayScheduleController            [schedule/controller] ← INTERNAL ✓
       ├─ createOwnerBookingController         [bookings/controller] ← VIOLATION ✗
       ├─ updateBookingStatusController        [bookings/controller] ← VIOLATION ✗
       └─ rescheduleBookingController          [bookings/controller] ← VIOLATION ✗

loadDaySchedule.controller.js
  ├─ assertActorOwnsVportActorController       [booking adapter]
  ├─ vportAvailabilityRules.read.dal           [dashboard/vport/dal] ← SHARED ✓
  └─ (bookings fetched via vport DAL layer)   ← not bookings card ✓

bookings/controller/createOwnerBooking.controller.js
  ├─ assertActorOwnsVportActorController
  └─ insertVportBookingDAL

bookings/controller/updateVportBooking.controller.js
  ├─ updateBookingStatusController
  │    ├─ fetchBooking (bookings DAL)
  │    ├─ validateTerminalStatus
  │    └─ publishNotifications
  └─ rescheduleBookingController
       ├─ fetchBooking
       ├─ checkConflicts
       └─ updateBooking DAL
```

**Index exports (bookings/index.js):**
The three controller functions are already exported from the bookings public index:
```javascript
export * from "./controller/createOwnerBooking.controller";
export * from "./controller/updateVportBooking.controller";
```
The violation is the **import path** used by the schedule hook, not missing exports.
`useVportOwnerSchedule` imports from `cards/bookings/controller/…` (internal filesystem path)
instead of `cards/bookings` (public boundary).

---

## 2. Schedule → Booking Call Chain

```
User clicks slot → ScheduleGrid.onSlotClick
  → VportDashboardScheduleScreen: openCreateModal(slot)
    → useVportOwnerSchedule.submitCreateBooking(formData)
      → createOwnerBookingController({              ← CROSSES CARD BOUNDARY
            callerActorId,
            resourceId,
            serviceId,
            startsAt,
            endsAt,
            timezone,
            serviceLabelSnapshot,
            durationMinutes,
            customerName,
            customerNote
          })
        → assertActorOwnsVportActorController
        → insertVportBookingDAL
      [on success]
      → setScheduleData (updates local slot state)
      → loadSchedule()                              ← SECOND cross-boundary call
        → loadDayScheduleController                 ← INTERNAL ✓

User changes booking status → BookingDetailModal.onStatusChange
  → useVportOwnerSchedule.updateBookingStatus(bookingId, status)
    → updateBookingStatusController({              ← CROSSES CARD BOUNDARY
            bookingId,
            status,
            callerActorId
          })
      → validates terminal immutability
      → updates booking DAL
      → publishes notifications

User reschedules → (drag or form)
  → useVportOwnerSchedule.rescheduleBooking(params)
    → rescheduleBookingController({               ← CROSSES CARD BOUNDARY
            bookingId,
            startsAt,
            endsAt,
            resourceId,
            durationMinutes,
            callerActorId
          })
```

**Callback chain depth for createBooking:**
```
submitCreateBooking
  → createOwnerBookingController     [card: bookings]
    → insertVportBookingDAL          [card: bookings]
  → setScheduleData                  [card: schedule, local state]
  → loadSchedule                     [card: schedule]
    → loadDayScheduleController      [card: schedule]
      → vportAvailabilityRules.read.dal [shared DAL]
```
4 hops, 2 card boundaries to trace a single user action.

---

## 3. Hidden Coupling Points

### CP-001 — Import Path Coupling (CRITICAL)
`useVportOwnerSchedule.js` lines 5–6 import from `cards/bookings/controller/` (internal path).
If the booking controllers are renamed, split, or moved to a shared adapter, the schedule card
breaks silently at compile time with no lint or type error to catch it.

### CP-002 — Callback Chain Ownership Ambiguity
`submitCreateBooking` in `useVportOwnerSchedule` owns the full creation + reload sequence.
When a booking is created from the schedule card, the success path writes to `scheduleData`
(schedule-owned state) and then calls `loadSchedule` (schedule-owned controller). The booking
card has no awareness this path exists — the schedule card is the implicit source of truth for
post-create refresh behavior.

### CP-003 — Modal State and Booking Lifecycle Coupling
`createModal` and `detailModal` in `useVportOwnerSchedule` manage separate lifecycle flows,
but both terminate into booking mutation controllers from the bookings card. Any change to the
booking mutation policy (e.g. TICKET-BOOKING-RPC-001: RLS-only hardening) requires checking
both modal flows inside the schedule hook, in addition to the booking card. Direct reschedule
field updates are intentionally not DB-granted by the live RLS hardening.

### CP-004 — Ownership Verification Duplication
`loadDayScheduleController` (schedule) calls `assertActorOwnsVportActorController` at line ~15.
`createOwnerBookingController` (bookings) calls the same assert internally.
The schedule card effectively owns an extra ownership verification call it doesn't need,
because the booking controller will verify again. If ownership is transferred to a coordinator,
this double-check disappears.

### CP-005 — `mobileBarberIdx` State Lives in Main Hook
The mobile barber selector state (`mobileBarberIdx`) is managed inside `useVportOwnerSchedule`
alongside booking mutations and schedule data loading. This is a pure UI concern with no
business logic dependency — it is entangled with the booking and data loading state trees
purely because they share one hook.

---

## 4. Public vs Private Boundaries

### Current State

| Layer | File | Boundary Status |
|---|---|---|
| Schedule hook | `hooks/useVportOwnerSchedule.js` | Imports from bookings **internal** path — VIOLATION |
| Schedule index | `index.js` | Exports hook correctly; does NOT export controllers — correct |
| Bookings index | `bookings/index.js` | Exports all controllers — public boundary defined |
| Bookings internal | `bookings/controller/*.js` | Accessible via both public index AND direct path — no enforcement |

### Target State

The bookings card's `index.js` IS the public boundary.
Schedule must import from `cards/bookings` (the public index), never `cards/bookings/controller/`.

The three controller functions already exported by `bookings/index.js`:
- `createOwnerBookingController` ← available at public boundary
- `updateBookingStatusController` ← available at public boundary
- `rescheduleBookingController` ← available at public boundary

No new exports are required in the bookings card. Only the import path in the schedule card
must change.

---

## 5. Candidate Booking Adapter Interface

The schedule card's three booking operations map cleanly to a coordinator contract:

```javascript
// cards/schedule/controller/scheduleBookingCoordinator.controller.js

/**
 * Creates a new booking initiated from the schedule view.
 * Imports from cards/bookings public boundary only.
 */
async function createScheduleBooking({
  callerActorId,
  resourceId,
  serviceId,
  startsAt,
  endsAt,
  timezone,
  serviceLabelSnapshot,
  durationMinutes,
  customerName,
  customerNote
}) { ... }

/**
 * Updates a booking's status from the schedule view.
 */
async function updateScheduleBookingStatus({
  bookingId,
  status,
  callerActorId
}) { ... }

/**
 * Reschedules a booking from the schedule view.
 */
async function rescheduleScheduleBooking({
  bookingId,
  startsAt,
  endsAt,
  resourceId,
  durationMinutes,
  callerActorId
}) { ... }
```

The coordinator imports:
```javascript
import {
  createOwnerBookingController,
  updateBookingStatusController,
  rescheduleBookingController,
} from "@/features/dashboard/vport/dashboard/cards/bookings";
//                                                          ^^^
//                                              public index — not internal path
```

---

## 6. Refactor Plan

### Step 1 — Create `scheduleBookingCoordinator.controller.js`

New file: `cards/schedule/controller/scheduleBookingCoordinator.controller.js`

Responsibilities:
- Thin delegation layer — no business logic
- Imports three booking operations from `cards/bookings` public index
- Exports `createScheduleBooking`, `updateScheduleBookingStatus`, `rescheduleScheduleBooking`
- Schedule hook imports from this coordinator instead of booking internals

### Step 2 — Split `useVportOwnerSchedule` into Three Hooks

**`useScheduleData.js`** (new, ~60 lines)
- `dateKey`, `scheduleData`, `loading`, `error`
- `loadSchedule()` — calls `loadDayScheduleController`
- `prevDay`, `nextDay`, `goToToday` — date navigation
- No booking mutations

**`useScheduleModals.js`** (new, ~40 lines)
- `createModal` state + open/close handlers
- `detailModal` state + open/close handlers
- `mobileBarberIdx` + `setMobileBarberIdx`
- No booking mutations, no data loading

**`useScheduleBookingOps.js`** (new, ~40 lines)
- `submitCreateBooking(formData)` — calls `scheduleBookingCoordinator.createScheduleBooking`
- `updateBookingStatus(bookingId, status)` — calls coordinator
- `rescheduleBooking(params)` — calls coordinator
- On success: calls `loadSchedule` callback from `useScheduleData`
- `saving`, `saveError` state

### Step 3 — Update `index.js`

Export all three new hooks from `cards/schedule/index.js`. Remove `useVportOwnerSchedule`
export if it is dissolved, or keep as a facade hook that composes the three.

### Step 4 — Update `VportDashboardScheduleScreen.jsx`

Screen currently destructures everything from `useVportOwnerSchedule`.
After refactor: destructure from three focused hooks.
Screen complexity does not increase — it was already consuming all these properties.

### Step 5 — Verify TICKET-BOOKING-RPC-001 Compatibility

TICKET-BOOKING-RPC-001 is resolved as RLS-only hardening: broad authenticated booking
UPDATE was removed and direct UPDATE is column-limited. The coordinator pattern keeps
follow-up localized: if owner reschedule remains required under the RLS-only design,
only `scheduleBookingCoordinator.controller.js` and booking controllers should need source
changes — not the schedule hook or screen.

---

## Design Target Confirmation

```
BEFORE:
useVportOwnerSchedule
  → createOwnerBookingController    [bookings/controller/...]  ← internal path
  → updateBookingStatusController   [bookings/controller/...]  ← internal path
  → rescheduleBookingController     [bookings/controller/...]  ← internal path

AFTER:
useScheduleBookingOps
  → scheduleBookingCoordinator      [schedule/controller/...]  ← internal ✓
       └─ createOwnerBookingController    [bookings]           ← public index ✓
       └─ updateBookingStatusController   [bookings]           ← public index ✓
       └─ rescheduleBookingController     [bookings]           ← public index ✓
```

The cross-card coupling is not eliminated — bookings are a booking-domain concern.
The violation eliminated is the direct internal-path import.
The coordinator is the single point where the schedule card touches the booking domain.

---

## Estimated Effort

| Step | Effort |
|---|---|
| scheduleBookingCoordinator.controller.js | 30 min |
| useScheduleData.js | 45 min |
| useScheduleModals.js | 30 min |
| useScheduleBookingOps.js | 30 min |
| Screen update | 30 min |
| index.js update | 15 min |
| **Total** | **~3 hours** |

Coordinate with TICKET-BOOKING-RPC-001 before implementing Step 3–4.
