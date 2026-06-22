# WOLVERINE — VPORT Dashboard Security Fix Completion Report

**Date:** 2026-05-11
**Branch:** vport-booking-feed-security-updates
**Scope:** `apps/VCSM/src/features/dashboard/vport/` only
**Audit source:** `2026-05-10_venom-robin_vport-dashboard.md`
**Fixer:** Wolverine

---

## Findings Summary — VD-01 through VD-10

### VD-01 — `removeTeamMemberController` — Missing Ownership Verification

**Status: FIXED**

Two distinct controllers export this function name. Both were fixed:

- `vportTeam.controller.js` — fetches resource via `fetchResourceByIdDAL`, resolves VPORT actor via `resource.owner_actor_id ?? getVportActorIdByProfileIdDAL(resource.profile_id)`, then calls `assertActorOwnsVportActorController`. `callerActorId` required.
- `vportTeamAccess.controller.js` — removed `assertCallerOwns` string-equality helper, replaced with `assertActorOwnsVportActorController`. `callerActorId` required.

Call site updated in `useVportTeam.js` to pass `callerActorId` from `useIdentity()`.

---

### VD-02 — `sendTeamRequestController` — No Ownership Before Invite

**Status: FIXED**

`vportTeam.controller.js` now requires `callerActorId` as first parameter. Before creating the invite, it calls `assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId })` to confirm the caller legitimately owns the barbershop sending the invitation.

Call site updated in `useVportTeam.js`.

---

### VD-03 — `acceptTeamRequestController` / `declineTeamRequestController` — No Caller Verification

**Status: FIXED**

`vportTeamInvite.controller.js` updated:

- `acceptTeamRequestController(callerActorId, resourceId)` — loads resource, enforces `String(callerActorId) === String(resource.member_actor_id)`. Only the invited barber can accept their own invitation.
- `declineTeamRequestController(callerActorId, resourceId)` — loads resource, allows barber (identity check) **OR** barbershop owner (via `assertActorOwnsVportActorController`). Either party can rescind.

Both functions require non-null `callerActorId` as first guard.

Call site updated in `useBarberTeamRequests.js` — passes `barberVportActorId` as `callerActorId` to both.

---

### VD-04 — `updateBookingStatusController` — No Ownership, Optional `actorId`

**Status: FIXED**

`updateVportBooking.controller.js` fully rewritten:

1. `callerActorId` required — throws immediately if absent.
2. Loads booking via `getVportBookingByIdDAL` — throws if not found.
3. Resolves VPORT actor via `getVportActorIdByProfileIdDAL(booking.profile_id)`.
4. Customer-cancel path: if `callerActorId === booking.customer_actor_id`, allows `"cancelled"` only.
5. All other status changes: requires VPORT ownership via `assertActorOwnsVportActorController`.

Call sites updated in `useVportBookingActions.js` and `useVportOwnerSchedule.js`.

---

### VD-05 — `rescheduleBookingController` — No Ownership, No Double-Booking Check

**Status: FIXED**

`updateVportBooking.controller.js`:

1. `callerActorId` required.
2. Loads booking via `getVportBookingByIdDAL`.
3. Verifies VPORT ownership via `assertActorOwnsVportActorController`.
4. Validates `startsAt < endsAt`.
5. Double-booking check via `listVportBookingsInRangeDAL` — filters out the booking being rescheduled from conflicts. Throws if any other active booking overlaps the new slot on the same resource.

Call site updated in `useVportOwnerSchedule.js`.

---

### VD-06 — `createOwnerBookingController` — No Ownership Before Confirmed Insert

**Status: FIXED**

`createOwnerBooking.controller.js`:

1. `callerActorId` required.
2. Fetches resource via `getVportResourceByIdDAL`.
3. Resolves VPORT actor: `resource.owner_actor_id ?? getVportActorIdByProfileIdDAL(resource.profile_id)`.
4. Calls `assertActorOwnsVportActorController` before any insert.
5. `created_by_actor_id` stores `callerActorId`.

Call sites updated in `useVportOwnerSchedule.js` and `QuickBookingModal.jsx`. The modal was also updated to drop the `actorId` prop in favor of `callerActorId` sourced internally from `useIdentity()`.

**Residual note:** `createOwnerBookingController` still accepts client-supplied `serviceLabelSnapshot`. Since ownership is now verified, injection risk is low — only verified owners can reach the insert. Server-side resolution for the owner flow is a hardening follow-up (not a P0).

---

### VD-07 — `VportDashboardScreen.jsx` — String Equality `isOwner`

**Status: FIXED**

Removed:
```js
const isOwner = Boolean(actorId) && Boolean(identity?.actorId) && String(identity.actorId) === String(actorId);
```

Replaced with:
```js
const { isOwner, ownershipLoading } = useVportOwnership(identity?.actorId ?? null, actorId);
```

New files created for this path:
- `hooks/useVportOwnership.js` — async hook, fails closed on error, cancels on unmount
- `controller/checkVportOwnership.controller.js` — thin boolean wrapper around `assertActorOwnsVportActorController`

The loading gate also updated: renders skeleton while `ownershipLoading` is true.

---

### VD-08 — `vportTeamAccess.controller.js` — `assertCallerOwns` String Equality

**Status: FIXED**

`assertCallerOwns` helper function removed entirely. All five exported functions (`getTeamAccessController`, `addTeamMemberController`, `updateTeamMemberRoleController`, `setTeamMemberStatusController`, `removeTeamMemberController`) now:

1. Guard `if (!callerActorId) throw new Error(...)`.
2. Call `await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId })`.

---

### VD-09 — `vportPublicBooking.controller.js` — Client-Supplied `serviceLabelSnapshot`

**Status: FIXED**

`createVportPublicBookingController` updated:

- `serviceLabelSnapshot` removed from accepted parameters entirely.
- Service label resolved server-side:
  - If `serviceId` provided: fetches from `vport.services` via `getVportServiceByIdDAL`, uses `service.label || service.key || "Appointment"`.
  - If no `serviceId`: defaults to `"Appointment"`.
- Comment added at resolution point: `// Resolve service label server-side from the catalog — never trust client-supplied snapshot`.

Callers that still pass `serviceLabelSnapshot` to this controller have it silently ignored.

---

### VD-10 — Cache Hardening — Ownership State Not Invalidated

**Status: FOLLOW-UP**

Not implemented in this pass. The `useVportOwnership` hook re-verifies on every mount and whenever `callerActorId` or `targetActorId` changes, which mitigates stale ownership within a session. A dedicated cache invalidation strategy on ownership state changes (e.g., on `actor_owners` write) requires design work outside the scope of this fix sprint.

Follow-up: assign to a dedicated cache audit session.

---

## Post-Fix Grep Verification

### Cleared patterns (zero results in scope)

| Pattern | Result |
|---|---|
| `String(identity.actorId) === String(actorId)` | CLEAN |
| `assertCallerOwns` in `vportTeamAccess.controller.js` | CLEAN (removed) |
| `acceptTeamRequestController(resourceId)` (no callerActorId) | CLEAN |
| `declineTeamRequestController(resourceId)` (no callerActorId) | CLEAN |
| `updateBookingStatusController` without `callerActorId` | CLEAN |
| `rescheduleBookingController` without `callerActorId` | CLEAN |
| `createOwnerBookingController` with `actorId` instead of `callerActorId` | CLEAN |
| `sendTeamRequestController` without `callerActorId` | CLEAN |

### Intentional equality checks retained (not anti-patterns)

| Location | Pattern | Reason |
|---|---|---|
| `updateVportBooking.controller.js:31` | `String(callerActorId) === String(customerActorId)` | Identity match for customer self-cancel permission — correct use |
| `vportTeamInvite.controller.js:41` | `String(callerActorId) === String(resource.member_actor_id)` | Barber-only accept enforcement — correct use |

---

## Out-of-Scope Issues Surfaced (Follow-up Required)

These were discovered during verification but are outside the VD-01 through VD-10 scope:

### 1. `vportLeads.controller.js` — `assertCallerOwns` Still Present

- File: `apps/VCSM/src/features/dashboard/vport/controller/vportLeads.controller.js`
- Issue: Local `assertCallerOwns` function uses `String(callerActorId) === String(ownerActorId)`. Fails for user-actor → VPORT cross-ownership.
- Used by: `listVportLeadsController`, `markVportLeadContactedController`, `countNewVportLeadsController`, `deleteVportLeadController`
- Fix: Same pattern as VD-08 — replace with `assertActorOwnsVportActorController`.
- Priority: HIGH

### 2. Dashboard Screens — String Equality `isOwner` Still Present

- `VportDashboardCalendarScreen.jsx:26`
- `VportSettingsScreen.jsx:74`
- `VportDashboardTeamScreen.jsx:22`
- All use: `Boolean(actorId) && Boolean(viewerActorId) && String(viewerActorId) === String(actorId)`
- Fix: Same as VD-07 — wrap `useVportOwnership` hook.
- Priority: HIGH (same vulnerability as VD-07 — gates fall back to string equality)

### 3. `vportTeam.controller.js` — Fan-Out Limit Exceeded

- Current: 7 unique module imports
- Contract §4.3 limit: 5
- Root cause: Added `fetchResourceByIdDAL` (team invite DAL) and `assertActorOwnsVportActorController` (booking feature) for security fixes
- Fix: Extract a shared `vportOwnershipGate.controller.js` adapter to consolidate the cross-feature import; or move `fetchResourceByIdDAL` to a shared team read DAL.
- Priority: LOW (tech debt, no security impact)

### 4. `QuickBookingModal.jsx` — Component Calls DAL Directly

- `listVportServicesByProfileIdDAL` called inside component
- Contract violation: components must not call DALs
- Fix: Route through a controller (e.g., `listVportServicesController`)
- Priority: LOW (existing violation, out of this security scope)

---

## DB Follow-Up Checklist

These RLS and policy items must be verified by DB or Carnage:

| Table | Required Policy | Risk if Missing |
|---|---|---|
| `vport.resources` | INSERT/UPDATE/DELETE require ownership via `actor_owners` | Attacker could bypass app-layer ownership check via direct API |
| `vport.bookings` | INSERT: `source='public'` only for anon/citizen; `source='owner'` only for VPORT owner | Booking status or source injection |
| `vport.bookings` | UPDATE: Only VPORT owner or customer (status=cancelled only) | Unauthorized status mutation |
| `vc.actor_owners` | SELECT: must be readable by RPC used inside `assertActorOwnsVportActorController` | Ownership RPC fails, all gates fail open |
| `vport.bookings.service_label_snapshot` | Confirm column is text-only, rendered escaped in all UI | Pre-fix data could contain injected values |
| `vport.team_resources` | DELETE/UPDATE require barbershop ownership | Team removal bypass via direct Supabase call |

**Follow-up command:** `/DB` to verify policies on `vport.resources`, `vport.bookings`, `vport.team_resources`.

---

## Files Changed in This Fix Sprint

### New Files

| File | Purpose |
|---|---|
| `dal/read/vportBookingById.read.dal.js` | Load single booking before mutation (ownership + customer check) |
| `controller/checkVportOwnership.controller.js` | Boolean ownership wrapper for use in hooks |
| `hooks/useVportOwnership.js` | Async ownership hook, fails closed, cancels on unmount |

### Modified Files

| File | Change |
|---|---|
| `dal/read/vportServices.read.dal.js` | Added `getVportServiceByIdDAL` for server-side label resolution |
| `controller/vportTeam.controller.js` | `sendTeamRequestController` + `removeTeamMemberController` ownership gates |
| `controller/vportTeamInvite.controller.js` | `acceptTeamRequestController` (barber-only) + `declineTeamRequestController` (barber or owner) |
| `controller/updateVportBooking.controller.js` | Full rewrite — ownership, customer-cancel path, double-booking check |
| `controller/createOwnerBooking.controller.js` | Ownership gate before confirmed insert |
| `controller/vportTeamAccess.controller.js` | Removed `assertCallerOwns`; all 5 functions use `assertActorOwnsVportActorController` |
| `controller/vportPublicBooking.controller.js` | Server-side service label resolution; removed client-trusted `serviceLabelSnapshot` |
| `screens/VportDashboardScreen.jsx` | Replaced string equality `isOwner` with `useVportOwnership` hook |
| `hooks/useVportTeam.js` | Sources `callerActorId` from `useIdentity()`; passes to `sendRequest` and `removeMember` |
| `hooks/useVportBookingActions.js` | Sources `callerActorId` internally; removed `actorId` param |
| `hooks/useVportOwnerSchedule.js` | Sources `callerActorId` from `useIdentity()`; passes to all write controllers |
| `hooks/useBarberTeamRequests.js` | Passes `barberVportActorId` as `callerActorId` to accept/decline |
| `components/bookingHistory/QuickBookingModal.jsx` | Sources `callerActorId` from `useIdentity()`; drops `actorId` prop; drops `serviceLabelSnapshot` |
