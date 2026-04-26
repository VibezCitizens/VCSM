// ============================================================
// Booking Engine — Public API
// ============================================================
// All consumers import from @booking (the alias that resolves
// to engines/booking/index.js → this file).
// ============================================================

export { configureBookingEngine } from '../config.js'
export { BOOKING_EVENTS } from '../events.js'

// ── Controllers ─────────────────────────────────────────────
export { createBooking }              from '../controller/createBooking.controller.js'
export { confirmBooking }             from '../controller/confirmBooking.controller.js'
export { cancelBooking }              from '../controller/cancelBooking.controller.js'
export { completeBooking }            from '../controller/completeBooking.controller.js'
export { markNoShow }                 from '../controller/markNoShow.controller.js'
export { getResourceAvailability, invalidateBookingAvailability } from '../controller/getResourceAvailability.controller.js'
export { listBookingHistory }         from '../controller/listBookingHistory.controller.js'
export { listOwnerBookingResources }  from '../controller/listOwnerBookingResources.controller.js'
export { ensureOwnerBookingResource } from '../controller/ensureOwnerBookingResource.controller.js'
export { getBookingServiceProfiles }  from '../controller/getBookingServiceProfiles.controller.js'
export { setAvailabilityRule }        from '../controller/setAvailabilityRule.controller.js'
export { setAvailabilityException }   from '../controller/setAvailabilityException.controller.js'
export { setResourceSlotDuration }    from '../controller/setResourceSlotDuration.controller.js'
export { assertActorOwnsVportActor }  from '../controller/assertActorOwnsVportActor.controller.js'

// ── Models (pure, safe to re-export for consumers that need mappers) ──
export { mapBookingRow, mapBookingRows }                         from '../model/Booking.model.js'
export { mapBookingResourceRow, mapBookingResourceRows }         from '../model/BookingResource.model.js'
export { mapBookingServiceProfileRow, mapBookingServiceProfileRows } from '../model/BookingServiceProfile.model.js'
export { mapAvailabilityRuleRow, mapAvailabilityExceptionRow, mapResourceAvailabilityModel } from '../model/BookingAvailability.model.js'
