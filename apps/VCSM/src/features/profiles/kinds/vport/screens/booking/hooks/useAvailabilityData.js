import { useMemo } from "react";

export function useAvailabilityData(availability) {
  const bookings = useMemo(
    () => (Array.isArray(availability.data?.bookings) ? availability.data.bookings : []),
    [availability.data?.bookings]
  );
  const rules = useMemo(
    () => (Array.isArray(availability.data?.rules) ? availability.data.rules : []),
    [availability.data?.rules]
  );
  const exceptions = useMemo(
    () => (Array.isArray(availability.data?.exceptions) ? availability.data.exceptions : []),
    [availability.data?.exceptions]
  );
  const serviceProfiles = useMemo(
    () => (Array.isArray(availability.data?.serviceProfiles) ? availability.data.serviceProfiles : []),
    [availability.data?.serviceProfiles]
  );
  return { bookings, rules, exceptions, serviceProfiles };
}
