import { useCallback, useEffect, useState } from "react";
import { getResourceAvailability } from "@booking";

export default function useBookingAvailability({
  resourceId = null,
  rangeStart = null,
  rangeEnd = null,
  statuses = null,
  exceptionTypes = null,
  publicMode = false,
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
      const next = await getResourceAvailability({
        resourceId, rangeStart, rangeEnd,
        statuses, exceptionTypes, publicMode,
      });
      setData(next);
      return { ok: true, data: next, error: null };
    } catch (e) {
      setError(e);
      return { ok: false, data: null, error: e };
    } finally {
      setLoading(false);
    }
  }, [enabled, resourceId, rangeStart, rangeEnd, statuses, exceptionTypes, publicMode]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { loading, error, data, refresh };
}
