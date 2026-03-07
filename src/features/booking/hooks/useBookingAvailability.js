import { useCallback, useEffect, useState } from "react";
import getResourceAvailabilityController from "@/features/booking/controller/getResourceAvailability.controller";

export default function useBookingAvailability({
  resourceId = null,
  rangeStart = null,
  rangeEnd = null,
  statuses = null,
  exceptionTypes = null,
  enabled = true,
} = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!enabled || !resourceId || !rangeStart || !rangeEnd) {
      setLoading(false);
      setError(null);
      setData(null);
      return { ok: false, data: null, error: null };
    }

    setLoading(true);
    setError(null);

    try {
      const next = await getResourceAvailabilityController({
        resourceId,
        rangeStart,
        rangeEnd,
        statuses,
        exceptionTypes,
      });

      setData(next);
      return { ok: true, data: next, error: null };
    } catch (e) {
      setError(e);
      return { ok: false, data: null, error: e };
    } finally {
      setLoading(false);
    }
  }, [enabled, resourceId, rangeStart, rangeEnd, statuses, exceptionTypes]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    loading,
    error,
    data,
    refresh,
  };
}
