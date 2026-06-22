# ARCHITECT Evidence Bundle — booking
Generated: 2026-06-07T08:45:00
Scope: VCSM:booking
Command: ARCHITECT V2
Scanner Version: 1.1.0

---

## Source Files Read

| File | Layer | Lines |
|---|---|---|
| apps/VCSM/src/features/booking/controllers/createBooking.controller.js | controller | 1-186 |
| apps/VCSM/src/features/booking/controllers/assertActorOwnsVportActor.controller.js | controller | 1-81 |

---

## Layer Counts (from callgraph)

| Layer | Count |
|---|---|
| controller | 20 |
| dal | 34 |
| hook | 17 |
| model | 41 |
| barrel | 29 |
| module | 1 |
| **Total** | **142** |

---

## Call Chains

### CHAIN-booking-001: Public Booking Flow
```
useBookAppointment → createBookingController → {
  getBookingResourceByIdDAL (verify resource active)
  getActorByIdDAL (verify kind=user, not void)
  customerActorId := requestActorId [SESSION-BOUND]
  insertBookingDAL
  publishVcsmNotification (linkPath=null)
}
```
User-controlled params: resourceId, serviceId, startsAt, endsAt, timezone, durationMinutes
Ownership checked: YES (kind gate + session binding)
Confidence: HIGH [SOURCE_VERIFIED]

### CHAIN-booking-002: Management Booking Flow (owner/admin/sync)
```
{management source} → createBookingController → {
  assertActorOwnsVportActorController → {
    getActorByIdDAL (kind=user required, unconditional)
    [self-shortcut: only after kind=user confirmed]
    readActorOwnerLinkByActorAndUserProfileDAL (actor_owners)
    getActorByIdDAL (target)
  }
  insertBookingDAL
}
```
Ownership checked: YES (actor_owners DB query)
Confidence: HIGH [SOURCE_VERIFIED]

---

## Security-Sensitive Surfaces

| Surface | File | Risk | Priority |
|---|---|---|---|
| insertBookingDAL | dal/insertBooking.dal.js | customer_actor_id injection | HIGH |
| updateBookingStatus | dal/updateBookingStatus.dal.js | Status change without caller check | MEDIUM |
| upsertAvailabilityRule | dal/upsertAvailabilityRule.dal.js | Calendar ownership | MEDIUM |
| assertActorOwnsVportActor | controllers/assertActorOwnsVportActor.controller.js | Ownership gate | CRITICAL |

---

## Database Writes

| DAL | Operation | Table | Ownership Check |
|---|---|---|---|
| insertBooking.dal.js | INSERT | bookings | PRESENT (createBooking enforces via assertActorOwnsVportActor or session-bind) |
| insertBookingResource.dal.js | INSERT | resources | PRESENT (ensureOwnerBookingResource.controller) |
| saveBookingServiceProfileDurations.dal.js | UPDATE | service_booking_profiles | PRESENT (ensureOwner) |
| updateBookingStatus.dal.js | UPDATE | bookings | PARTIAL (confirm/cancel controllers) |
| upsertAvailabilityException.dal.js | UPSERT | availability_exceptions | PRESENT (setAvailabilityException) |
| upsertAvailabilityRule.dal.js | UPSERT | availability_rules | PRESENT (setAvailabilityRule) |
| upsertBookingResourceServices.dal.js | UPSERT | resource_services | PRESENT (ensureOwner) |

---

## Engine Dependencies

| Engine | Used By | Method |
|---|---|---|
| @notifications / publishEvent | notifications/publish.js (via adapter) | publishVcsmNotification |
| @booking (engine) | booking/* | booking domain functions |
| @identity (engine) | booking/* | actor lookup |

---

## Behavior IDs Referenced
- behavior.booking.create_booking
- behavior.booking.ownership_gate

---

## Provenance
- Source maps consumed: callgraph, write-surface-map, dependency-map, engine-candidates
- Source files validated: 2
- Confidence: HIGH
