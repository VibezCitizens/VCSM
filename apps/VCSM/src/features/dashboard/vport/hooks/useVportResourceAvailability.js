import { useCallback, useEffect, useState } from "react";
import { getVportResourceAvailabilityController } from "@/features/dashboard/vport/controller/vportPublicBooking.controller";
import { mapAvailabilityRule } from "@/features/dashboard/vport/model/vportAvailabilityRule.model";

export default function useVportResourceAvailability({ resourceId, rangeStart, rangeEnd, enabled = true } = {}) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  const load = useCallback(async () => {
    if (!enabled || !resourceId) return;
    setLoading(true);
    setError(null);
    try {
      const raw   = await getVportResourceAvailabilityController({ resourceId, rangeStart, rangeEnd });
      const rules = (raw.rules ?? []).map(mapAvailabilityRule);
      setData({ rules, exceptions: raw.exceptions ?? [], bookings: raw.bookings ?? [] });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [resourceId, rangeStart, rangeEnd, enabled]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refresh: load };
}
