# CARNAGE Migration Proposal — Book Tab Slot Collision Protection
**Date:** 2026-05-27
**Status:** PROPOSAL ONLY — No migration applied yet
**Trigger:** VENOM-BOOK-001 — race condition on concurrent booking inserts
**THOR Gate:** Book tab remains BLOCKED on this DB decision
**Approver Required:** Explicit approval before any migration is applied

---

## Risk Statement (VENOM-BOOK-001)

`createVportPublicBookingController` inserts a new booking row into `vport.bookings` without first locking or re-checking slot availability. Under concurrent load, two simultaneous POST requests for the same `(resource_id, starts_at)` slot will both:

1. Pass the past-time check
2. Pass the actor kind check
3. Call `insertVportBookingDAL` independently
4. Both succeed if the DB has no unique constraint on the slot

This produces double-booked slots. The VPORT owner's schedule would then show two confirmed bookings for the same time, requiring manual cancellation and potentially causing a missed/conflicting appointment.

**Current protection:** NONE at application or database level for this specific race.

---

## Decision Required

Before this proposal can be applied, the following product decision must be made:

**When a booking is cancelled, can that time slot be rebooked?**

| Decision | Constraint Shape |
|---|---|
| YES — cancelled slots free up (recommended) | Partial unique index filtering out cancelled/rejected rows |
| NO — once booked, the slot is permanently blocked | Simple unique index on all rows |

---

## Proposed Database Constraint

### Option A — Partial unique index (recommended)

Free up slots when a booking is cancelled or rejected. This matches real-world appointment cancellation behavior.

```sql
-- Proposal A: partial unique index — only active bookings block a slot
-- status values that block the slot: 'pending', 'confirmed'
-- status values that free the slot: 'cancelled', 'rejected', 'completed'
CREATE UNIQUE INDEX IF NOT EXISTS
  uq_vport_bookings_resource_starts_active
ON vport.bookings (resource_id, starts_at)
WHERE status NOT IN ('cancelled', 'rejected');
```

**Effect:**
- A pending or confirmed booking on `(resource_id, starts_at)` blocks that slot
- Cancelling a booking removes the block (status → 'cancelled')
- Race condition is resolved: the second concurrent insert will receive a unique constraint violation and the DB will reject it

---

### Option B — Simple unique index (no status filter)

Once a slot is booked, it is permanently blocked regardless of cancellation.

```sql
-- Proposal B: simple unique — all status values block the slot permanently
CREATE UNIQUE INDEX IF NOT EXISTS
  uq_vport_bookings_resource_starts
ON vport.bookings (resource_id, starts_at);
```

**Effect:**
- Simpler SQL, but cancelled bookings still occupy the slot
- VPORT owners cannot rebook a cancelled slot without deleting the row
- **Not recommended** — overly restrictive for normal cancellation workflows

---

## Application-Layer Handling

After the DB constraint is applied, `insertVportBookingDAL` will surface a unique constraint violation as a Supabase error when a slot collision occurs. The controller should catch and translate this:

```js
// Proposed controller patch (after DB decision confirmed):
try {
  const booking = await insertVportBookingDAL({ row: {...} });
} catch (err) {
  // Supabase unique violation code
  if (err?.code === '23505') {
    throw new Error("This time slot is no longer available. Please choose another time.");
  }
  throw err;
}
```

This gives the UI a clean user-facing error message instead of a raw DB error.

---

## Migration Checklist (Before Applying)

- [ ] Product decision made: cancelled slots free up (Option A) or permanently blocked (Option B)
- [ ] Confirm `status` enum values in `vport.bookings` schema match the filter list
- [ ] Test migration on staging with concurrent booking simulation
- [ ] Update `insertVportBookingDAL` error handling to catch `23505` after constraint is applied
- [ ] Add regression test: second concurrent insert on same slot returns clean user error
- [ ] THOR review and approval

---

## THOR Gate

**Book tab THOR status: BLOCKED on this decision.**

Once the DB decision is made and the constraint is applied:
- VENOM-BOOK-001 moves to RESOLVED
- BOOK-001 moves to APPLIED
- THOR can re-evaluate book tab for RELEASE APPROVED (still pending BOOK-002 test — now resolved)

**BOOK-002 is now RESOLVED** — kind-gate regression test written 2026-05-27.

After this DB constraint is applied, the only remaining THOR blocker for book tab will be removed.

---

## Files That Will Change

| File | Change |
|---|---|
| `vport.bookings` (DB) | Add partial unique index on `(resource_id, starts_at)` |
| `apps/VCSM/src/features/dashboard/vport/dal/write/insertVportBooking.write.dal.js` | Add 23505 error catch |
| `apps/VCSM/src/features/dashboard/vport/controller/vportPublicBooking.controller.js` | Optionally move error translation here instead |

**CARNAGE Status:** PROPOSAL — awaiting approval. No migration applied.
