// ============================================================
// Booking Engine — Public API
// ============================================================
// All consumers import from @booking (the alias that resolves
// to engines/booking/index.js → this file).
// ============================================================

export { configureBookingEngine } from '../config.js'
export { BOOKING_EVENTS } from '../events.js'

// ── Booking controllers ──────────────────────────────────────
export { createBooking }              from '../controller/createBooking.controller.js'
export { confirmBooking }             from '../controller/confirmBooking.controller.js'
export { cancelBooking }              from '../controller/cancelBooking.controller.js'
export { completeBooking }            from '../controller/completeBooking.controller.js'
export { markNoShow }                 from '../controller/markNoShow.controller.js'
export { dismissBooking }             from '../controller/dismissBooking.controller.js'
export { getResourceAvailability, invalidateBookingAvailability } from '../controller/getResourceAvailability.controller.js'
export { getLocationAvailability }    from '../controller/getLocationAvailability.controller.js'
export { listBookingHistory }         from '../controller/listBookingHistory.controller.js'
export { listOwnerBookingResources }  from '../controller/listOwnerBookingResources.controller.js'
export { ensureOwnerBookingResource } from '../controller/ensureOwnerBookingResource.controller.js'
export { getBookingServiceProfiles }  from '../controller/getBookingServiceProfiles.controller.js'
export { setAvailabilityRule }        from '../controller/setAvailabilityRule.controller.js'
export { setAvailabilityException }   from '../controller/setAvailabilityException.controller.js'
export { setResourceSlotDuration }    from '../controller/setResourceSlotDuration.controller.js'

// ── Permission controllers ────────────────────────────────────
export { assertActorOwnsVportActor }             from '../controller/assertActorOwnsVportActor.controller.js'
export { assertActorCanManageOrganization }      from '../controller/assertActorCanManageOrganization.controller.js'
export { assertActorCanManageLocation }          from '../controller/assertActorCanManageLocation.controller.js'
export { assertActorCanManageResource }          from '../controller/assertActorCanManageResource.controller.js'

// ── Organization controllers ──────────────────────────────────
export { listOrganizationsByOwnerActor }         from '../controller/listOrganizationsByOwnerActor.controller.js'
export { createOrganizationLocationWorkspace }   from '../controller/createOrganizationLocationWorkspace.controller.js'

// ── Location controllers ──────────────────────────────────────
export { listLocationsByOrganization }           from '../controller/listLocationsByOrganization.controller.js'

// ── Resource controllers ──────────────────────────────────────
export { createLocationResource }                from '../controller/createLocationResource.controller.js'
export { listBookingResourcesByLocation }        from '../controller/listBookingResourcesByLocation.controller.js'
export { listResourceServiceOverrides }          from '../controller/listResourceServiceOverrides.controller.js'
export { upsertResourceServiceOverride }         from '../controller/upsertResourceServiceOverride.controller.js'

// ── Booking context resolver ──────────────────────────────────
export { resolveBookingContext }                 from '../controller/resolveBookingContext.controller.js'

// ── QR controllers ────────────────────────────────────────────
export { listQrLinksByOrganization, listQrLinksByLocation, listQrLinksByProfile } from '../controller/listQrLinks.controller.js'
export { createQrLink }                          from '../controller/createQrLink.controller.js'
export { resolveQrScan }                         from '../controller/resolveQrScan.controller.js'

// ── Models (pure, safe to re-export for consumers that need mappers) ──
export { mapBookingRow, mapBookingRows }                         from '../model/Booking.model.js'
export { mapBookingResourceRow, mapBookingResourceRows }         from '../model/BookingResource.model.js'
export { mapBookingServiceProfileRow, mapBookingServiceProfileRows } from '../model/BookingServiceProfile.model.js'
export { mapAvailabilityRuleRow, mapAvailabilityExceptionRow, mapResourceAvailabilityModel } from '../model/BookingAvailability.model.js'
export { mapOrganizationRow, mapOrganizationRows, mapOrganizationMemberRow, mapOrganizationMemberRows, mapOrganizationProfileRow } from '../model/Organization.model.js'
export { mapLocationRow, mapLocationRows, mapLocationMemberRow, mapLocationMemberRows } from '../model/Location.model.js'
export { mapResourceServiceOverrideRow, mapResourceServiceOverrideRows, resolveServicePricing } from '../model/ResourceServiceOverride.model.js'
export { mapQrLinkRow, mapQrLinkRows, buildQrDestinationPath } from '../model/QrLink.model.js'
export { mapVportResourceRow, mapVportResourceRows }             from '../model/VportResource.model.js'
