import listBookingServiceProfilesByServiceIdsDAL from "@/features/booking/dal/listBookingServiceProfilesByServiceIds.dal";
import { mapBookingServiceProfileRows } from "@/features/booking/model/bookingServiceProfile.model";

function normalizeServiceIds(serviceIds) {
  return [...new Set((Array.isArray(serviceIds) ? serviceIds : []).map(String).filter(Boolean))];
}

export async function getBookingServiceProfilesController({
  serviceIds,
  includeNonBookable = false,
} = {}) {
  const ids = normalizeServiceIds(serviceIds);
  if (!ids.length) return [];

  const rows = await listBookingServiceProfilesByServiceIdsDAL({
    serviceIds: ids,
    includeNonBookable,
  });

  return mapBookingServiceProfileRows(rows);
}

export default getBookingServiceProfilesController;
