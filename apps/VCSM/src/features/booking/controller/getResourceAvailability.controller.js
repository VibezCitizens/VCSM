import getBookingResourceByIdDAL from "@/features/booking/dal/getBookingResourceById.dal";
import listAvailabilityRulesByResourceIdDAL from "@/features/booking/dal/listAvailabilityRulesByResourceId.dal";
import listAvailabilityExceptionsInRangeDAL from "@/features/booking/dal/listAvailabilityExceptionsInRange.dal";
import listBookingsInRangeDAL from "@/features/booking/dal/listBookingsInRange.dal";
import listBookingResourceServicesByResourceIdDAL from "@/features/booking/dal/listBookingResourceServicesByResourceId.dal";
import listBookingServiceProfilesByServiceIdsDAL from "@/features/booking/dal/listBookingServiceProfilesByServiceIds.dal";
import { mapResourceAvailabilityModel } from "@/features/booking/model/bookingAvailability.model";

export async function getResourceAvailabilityController({
  resourceId,
  rangeStart,
  rangeEnd,
  statuses = null,
  exceptionTypes = null,
} = {}) {
  if (!resourceId) {
    throw new Error("getResourceAvailabilityController: resourceId is required");
  }
  if (!rangeStart) {
    throw new Error("getResourceAvailabilityController: rangeStart is required");
  }
  if (!rangeEnd) {
    throw new Error("getResourceAvailabilityController: rangeEnd is required");
  }

  const resource = await getBookingResourceByIdDAL({ resourceId });
  if (!resource) {
    throw new Error("Booking resource not found.");
  }

  const [rules, exceptions, bookings] = await Promise.all([
    listAvailabilityRulesByResourceIdDAL({ resourceId }),
    listAvailabilityExceptionsInRangeDAL({
      resourceId,
      rangeStart,
      rangeEnd,
      exceptionTypes,
    }),
    listBookingsInRangeDAL({
      resourceId,
      rangeStart,
      rangeEnd,
      statuses,
    }),
  ]);

  let serviceProfiles = [];
  try {
    const resourceServices = await listBookingResourceServicesByResourceIdDAL({
      resourceId,
      includeInactive: false,
    });
    const serviceIds = [...new Set(
      (Array.isArray(resourceServices) ? resourceServices : [])
        .map((row) => row?.service_id)
        .filter(Boolean)
        .map(String)
    )];

    serviceProfiles = serviceIds.length
      ? await listBookingServiceProfilesByServiceIdsDAL({
        serviceIds,
        includeNonBookable: false,
      })
      : [];
  } catch {
    serviceProfiles = [];
  }

  return mapResourceAvailabilityModel({
    resource,
    rules,
    exceptions,
    bookings,
    serviceProfiles,
  });
}

export default getResourceAvailabilityController;
