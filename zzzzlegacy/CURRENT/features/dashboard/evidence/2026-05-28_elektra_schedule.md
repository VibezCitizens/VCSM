# ELEKTRA Security Scan — Schedule Module
**Date:** 2026-05-28
**Scanner:** ELEKTRA
**Scope:** apps/VCSM — VportDashboardScheduleScreen + loadDaySchedule controller + useVportOwnerSchedule hook
**Finding range:** ELEK-2026-05-28-064 to ELEK-2026-05-28-067
**Status:** COMPLETE

---

## Scope

Files scanned:

- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/schedule/VportDashboardScheduleScreen.jsx`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/schedule/controller/loadDaySchedule.controller.js`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/schedule/hooks/useVportOwnerSchedule.js`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/schedule/components/schedule/ScheduleModals.jsx`

---

## Executive Summary

The schedule read path has a correct ownership gate: `loadDayScheduleController` calls `assertActorOwnsVportActorController` before any data fetch, and this is documented as VPD-V-022. The mutation paths (create booking, update booking status, reschedule) all pass `callerActorId` sourced from `useIdentity()` to their respective controllers.

The primary finding confirmed from BW is a stale-identity risk in `useVportOwnerSchedule`: `callerActorId` is captured in the `load` useCallback but is **not included in the dependency array**. After an actor switch, the stale `callerActorId` value is passed to `loadDayScheduleController`, which evaluates the old actor's ownership against the new VPORT target — creating a narrow window where the schedule controller gate runs with the wrong identity.

**Result:** 0 HIGH, 2 MEDIUM, 1 LOW, 0 INFO

---

## Findings

---

### ELEK-2026-05-28-064 — `callerActorId` Missing From `load` useCallback Dependency Array (BW-SCHED-002 Confirmation)
**Severity:** MEDIUM
**Status:** OPEN — confirmed stale-closure risk

**Source:**
`apps/VCSM/src/features/dashboard/vport/dashboard/cards/schedule/hooks/useVportOwnerSchedule.js` lines 46–60

```js
const load = useCallback(async (key) => {
  if (!actorId) return;
  setLoading(true);
  setError(null);
  try {
    const data = await loadDayScheduleController({ actorId, dateKey: key, callerActorId });
    // ...
  }
}, [actorId, callerActorId]);   // callerActorId IS present — see analysis below
```

**ELEKTRA Trace:**

Reading line 60 closely:
```
}, [actorId, callerActorId]);
```

`callerActorId` is present in the dep array at line 60. This is the corrected state. BW-SCHED-002 was filed when the dep array was `[actorId]` only. **ELEKTRA confirms the dep array fix is in place** at the time of this scan.

**ELEKTRA Note:**
The original BW-SCHED-002 finding documented `callerActorId` missing from the dep array. The current source shows `[actorId, callerActorId]` at line 60. This finding is RESOLVED.

**Resolution date:** 2026-05-28 (confirmed fixed)

---

### ELEK-2026-05-28-065 — `callerActorId` Stale Risk on Mutation Paths After Actor Switch
**Severity:** MEDIUM
**Status:** OPEN

**Source:**
`apps/VCSM/src/features/dashboard/vport/dashboard/cards/schedule/hooks/useVportOwnerSchedule.js`
- `submitCreateBooking` callback: line 79 (`callerActorId` dep)
- `updateBookingStatus` callback: line 111 (`callerActorId` dep)
- `rescheduleBooking` callback: line 125 (`callerActorId` dep)

**Chain:**
```
useIdentity() → identity?.actorId → callerActorId (line 28)
  → submitCreateBooking captures callerActorId via closure
  → createOwnerBookingController({ callerActorId, resourceId, ... })
  [also]
  → updateBookingStatusController({ bookingId, status, callerActorId })
  → rescheduleBookingController({ bookingId, ..., callerActorId })
```

**Description:**
All three mutation callbacks (`submitCreateBooking`, `updateBookingStatus`, `rescheduleBooking`) depend on `callerActorId` from the hook-level closure. Each callback is a `useCallback` that lists `callerActorId` in its dependency array, meaning they re-create when `callerActorId` changes.

The risk is narrow but present: if an actor switch occurs while a mutation modal is open (e.g., `createModal` or `detailModal` is mounted), the modal was opened with the old actor's `callerActorId`. After identity switch, the callbacks re-create, but the modal does not automatically close. If the user submits the open form, the newly bound callback with the new `callerActorId` fires — but if the controller-layer ownership check on the new actor also happens to pass (e.g., the new actor also owns the VPORT), the mutation succeeds under the new identity.

This is not an exploit in the traditional IDOR sense (the controller gate does fire), but it is a UX-level identity inconsistency: a booking was created in a modal opened under Actor A, submitted under Actor B's identity.

**CISSP Domain:** Identity and Access Management

**Proposed patch (text only — do not apply):**
Close all open modals when `callerActorId` changes. In `useVportOwnerSchedule`, add a `useEffect` that fires `setCreateModal(null)` and `setDetailModal(null)` whenever `callerActorId` changes.

---

### ELEK-2026-05-28-066 — `VportDashboardScheduleScreen` Has No Screen-Level Ownership Gate (VENOM-SCHED-001 + BW-SCHED-001 Confirmation)
**Severity:** MEDIUM (architecture compliance)
**Status:** OPEN — confirmed; SENTRY assigned

**Source:**
`apps/VCSM/src/features/dashboard/vport/dashboard/cards/schedule/VportDashboardScheduleScreen.jsx` lines 16–33

**Chain:**
```
VportDashboardScheduleScreen({ actorId: propActorId | routeActorId })
  → useVportOwnerSchedule({ actorId })           // hook mounts unconditionally
      → loadDayScheduleController({ actorId, callerActorId })
          → assertActorOwnsVportActorController  // gate fires here (first protection)
  → [error state displayed if ownership fails]
```

**Description:**
The screen mounts `useVportOwnerSchedule` unconditionally for any `actorId` received via route params or props. There is no `useVportOwnership` gate on the screen to prevent hook initialization. The ownership check runs inside the controller (`assertActorOwnsVportActorController`, VPD-V-022), so an unauthorized actor's request is rejected — but the hook initializes, fires network requests, and the `loadDayScheduleController` call is made before the ownership rejection.

Architecture contract requires a Final Screen (gate: identity + ownership) + View Screen (hooks + composition). The current design has one combined screen. This was confirmed by VENOM-SCHED-001 and BW-SCHED-001. No active security regression exists because the controller gate is in place, but the architecture non-compliance creates future regression risk.

**CISSP Domain:** Security Architecture and Engineering

**Proposed patch (text only — do not apply):**
Split into `VportScheduleFinalScreen` (handles `useVportOwnership` gate + loading/unauthorized states) and `VportScheduleViewScreen` (mounts `useVportOwnerSchedule` only when `isOwner === true`). This matches the calendar module pattern.

---

### ELEK-2026-05-28-067 — `ScheduleModals` Status Actions Fire Without Re-Verifying Actor Identity
**Severity:** LOW
**Status:** OPEN

**Source:**
`apps/VCSM/src/features/dashboard/vport/dashboard/cards/schedule/components/schedule/ScheduleModals.jsx` lines 158–166

```jsx
{!["cancelled", "completed"].includes(status) && (
  <div className="sched-status-actions">
    {status !== "confirmed" && <button ... onClick={() => onStatusChange(booking.id, "confirmed")}>✓ Confirm</button>}
    {status !== "completed" && <button ... onClick={() => onStatusChange(booking.id, "completed")}>✔ Complete</button>}
    {status !== "no_show"   && <button ... onClick={() => onStatusChange(booking.id, "no_show")}>No Show</button>}
    <button ... onClick={() => onStatusChange(booking.id, "cancelled")}>Cancel</button>
  </div>
)}
```

**Chain:**
```
BookingDetailModal → onStatusChange(booking.id, status)
  → useVportOwnerSchedule.updateBookingStatus(bookingId, status)
      → updateBookingStatusController({ bookingId, status, callerActorId })
```

**Description:**
The modal renders status action buttons based on the booking's current status value stored in React state. It does not re-fetch the booking to verify current status before rendering available transitions, and does not enforce a state machine client-side (e.g., preventing `confirmed → completed → confirmed` cycling). The server-side `updateBookingStatusController` enforces ownership via `callerActorId` before any mutation, so unauthorized actors cannot change booking status.

The risk is UI-layer: if two VPORT owners (e.g., owner A and a manager-role actor B, both having management rights) have the same booking detail modal open simultaneously, the status shown to B may be stale when A updates it. B could apply a state transition on top of an already-changed status.

This is LOW exploitability because both actors have legitimate ownership rights, no auth bypass is present, and Supabase optimistic locking is not in scope. However, it represents a missing server-side status validation (e.g., the controller should verify the booking is in an expected state before transitioning).

**CISSP Domain:** Software Development Security

**Proposed patch (text only — do not apply):**
Add a `previous_status` guard in `updateBookingStatusController` — verify that `booking.status === expectedPreviousStatus` before updating. Alternatively, use a typed DB RPC (already logged as TICKET-BOOKING-RPC-001) that enforces valid state machine transitions in the DB.

---

## BW Finding Resolution Table

| BW ID | Description | ELEKTRA Assessment | Status |
|---|---|---|---|
| BW-SCHED-001 (no Final Screen) | No Final Screen layer | Confirmed → ELEK-2026-05-28-066 (MEDIUM architecture) | OPEN |
| BW-SCHED-002 (stale callerActorId dep) | Missing dep array entry | RESOLVED — dep array shows `[actorId, callerActorId]` in current source | RESOLVED |
| BW-SCHED-003 (controller export) | Controller exported from module index | Not re-confirmed by ELEKTRA (out of scope for this pass — SENTRY assigned) | CARRY |

---

## Summary Table

| ID | Severity | Status | Description |
|---|---|---|---|
| ELEK-2026-05-28-064 | — | RESOLVED | BW-SCHED-002: dep array fix confirmed in source — no longer an issue |
| ELEK-2026-05-28-065 | MEDIUM | OPEN | Modal open during actor switch — mutation fires with new actor identity, old modal context |
| ELEK-2026-05-28-066 | MEDIUM | OPEN | No screen-level ownership gate — controller is first and only layer |
| ELEK-2026-05-28-067 | LOW | OPEN | Status transitions not server-side validated against expected previous state |
