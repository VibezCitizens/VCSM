export { default as useBookingAvailability }       from "@/features/booking/hooks/useBookingAvailability";
export { default as useCreateBooking }             from "@/features/booking/hooks/useCreateBooking";
export { default as useManageAvailability }        from "@/features/booking/hooks/useManageAvailability";
export { default as useOwnerBookingResources }     from "@/features/booking/hooks/useOwnerBookingResources";
export { default as useEnsureOwnerBookingResource } from "@/features/booking/hooks/useEnsureOwnerBookingResource";
export { default as useBookingServiceProfiles }    from "@/features/booking/hooks/useBookingServiceProfiles";
export { default as useOrganizationWorkspace }     from "@/features/booking/hooks/useOrganizationWorkspace";
export { default as useOrganizationLocations }     from "@/features/booking/hooks/useOrganizationLocations";
export { default as useLocationResources }         from "@/features/booking/hooks/useLocationResources";
export { default as useResourceServiceOverrides }  from "@/features/booking/hooks/useResourceServiceOverrides";
export { default as useBookingContextResolver }    from "@/features/booking/hooks/useBookingContextResolver";
export { default as useQrLinks }                   from "@/features/booking/hooks/useQrLinks";

export { useBookingOps }     from "@/features/booking/hooks/useBookingOps";
export { useBookingServices } from "@/features/booking/hooks/useBookingServices";
export { default as useBookingHistory } from "@/features/booking/hooks/useBookingHistory";
// Approved §5.3 exception: shared cross-feature ownership assertion primitive (9 call sites across dashboard controllers).
export { default as assertActorOwnsVportActorController } from "@/features/booking/controllers/assertActorOwnsVportActor.controller";
// Approved §5.3 exception: session-derived ownership assertion for self-read operations (Identity Contract §1.3 compliance).
export { default as assertSessionOwnsVportActorController } from "@/features/booking/controllers/assertSessionOwnsVportActor.controller";
// Approved §5.3 exception: actor kind/void check for self-ownership shortcut in checkVportOwnership (1 call site, dashboard controller only).
export { default as getActorByIdDAL } from "@/features/booking/dal/getActorById.dal";

// §5.3 exception: booking calendar model utilities — pure date/slot computation, no data access.
// Re-exported here so profiles/booking UI never imports booking internals directly.
export { addDays, endOfMonth, formatDateLabel, formatMonthLabel, fromDateKey, getNearestDurationOption, groupSlotsBySegment, isSlotExpired, normalizeDurationMinutes, shiftMonth, startOfMonth, startOfWeek, toDateKey, VISITOR_SLOT_DURATION_MINUTES } from "@/features/booking/model/bookingCalendarDate.model";
export { buildBookingsByDate, buildCustomerActorRows, buildMonthCells, buildMonthStats, buildOccupiedIntervalsByDate, buildSlotsByDate, buildUpcomingAppointments, buildWeeklyAvailabilityDays } from "@/features/booking/model/bookingCalendarAvailability.model";
export { buildBookingPayload } from "@/features/booking/model/buildBookingPayload.model";
export { DURATION_OPTIONS, STATUS_LABELS } from "@/features/booking/model/bookingCalendar.model";
