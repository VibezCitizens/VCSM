import { mapBookingRow, mapBookingRows } from "@/features/booking/model/booking.model";
import { mapBookingResourceRow } from "@/features/booking/model/bookingResource.model";
import { mapBookingServiceProfileRows } from "@/features/booking/model/bookingServiceProfile.model";

export function mapAvailabilityRuleRow(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,
    resourceId: row.resource_id ?? null,
    ruleType: row.rule_type ?? "weekly",
    weekday: Number.isFinite(Number(row.weekday)) ? Number(row.weekday) : null,
    startTime: row.start_time ?? null,
    endTime: row.end_time ?? null,
    validFrom: row.valid_from ?? null,
    validUntil: row.valid_until ?? null,
    isActive: row.is_active === true,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export function mapAvailabilityExceptionRow(row) {
  if (!row) return null;

  return {
    id: row.id ?? null,
    resourceId: row.resource_id ?? null,
    exceptionType: row.exception_type ?? null,
    startsAt: row.starts_at ?? null,
    endsAt: row.ends_at ?? null,
    note: row.note ?? null,
    createdByActorId: row.created_by_actor_id ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export function mapAvailabilityRuleRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapAvailabilityRuleRow).filter(Boolean);
}

export function mapAvailabilityExceptionRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapAvailabilityExceptionRow).filter(Boolean);
}

export function mapResourceAvailabilityModel({
  resource,
  rules,
  exceptions,
  bookings,
  serviceProfiles,
} = {}) {
  return {
    resource: mapBookingResourceRow(resource),
    rules: mapAvailabilityRuleRows(rules),
    exceptions: mapAvailabilityExceptionRows(exceptions),
    bookings: mapBookingRows(bookings),
    serviceProfiles: mapBookingServiceProfileRows(serviceProfiles),
  };
}

export const mapBookingForAvailability = mapBookingRow;
