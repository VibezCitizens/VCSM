# Module: Booking

**VPORT Kinds:** ALL  
**Public/Owner:** BOTH  
**Route:** `/booking` (engine-level)  
**Source:** `engines/booking/src/`  
**Engine deps:** `engines/booking`, `engines/notifications`  
**Governance status:** COMPLETE (THOR deferred — DEFER-001)  
**Last audit:** 2026-05-27

---

## What This Module Does

Manages the full booking lifecycle for VPORT service providers: create, confirm, cancel, and complete. Includes QR-linked confirmation flows, actor ownership gates, and notification dispatch on state transitions.

## Key Files

- `engines/booking/src/controller/createBooking.controller.js`
- `engines/booking/src/controller/confirmBooking.controller.js`
- `engines/booking/src/controller/cancelBooking.controller.js`
- `engines/booking/src/controller/completeBooking.controller.js`
- `engines/booking/src/controller/assertActorCanManageResource.controller.js`
- `engines/booking/src/controller/createQrLink.controller.js`

## Known Deferred Items

- **DEFER-001:** `bookings_insert_owner` migration — legacy `profiles.owner_user_id` RLS policy pending CARNAGE migration
- **DEFER-003:** `BookingQrLinksPanel` adapter not yet built

## References

- `../../../deferred-open-items.md`
- `logan/vports/vcsm.vport.business-pipeline.v2.md`
