import { useCallback, useEffect, useMemo, useState } from "react";
import { getBookingServiceProfiles } from "@booking";

function normalizeIds(ids) {
  return [...new Set((Array.isArray(ids) ? ids : []).map(String).filter(Boolean))];
}

export default function useBookingServiceProfiles({
  serviceIds = [],
  enabled = true,
  includeNonBookable = false,
} = {}) {
  const normalizedIds = useMemo(() => normalizeIds(serviceIds), [serviceIds]);
  const idsKey = normalizedIds.join("|");

  const [isLoading, setIsLoading] = useState(Boolean(enabled && normalizedIds.length));
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);

  const refetch = useCallback(async () => {
    if (!enabled || !normalizedIds.length) {
      setData([]);
      setError(null);
      setIsLoading(false);
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getBookingServiceProfiles({ serviceIds: normalizedIds, includeNonBookable });
      setData(Array.isArray(result) ? result : []);
      return result;
    } catch (e) {
      setData([]);
      setError(e);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [enabled, normalizedIds, includeNonBookable]);

  useEffect(() => {
    let alive = true;
    refetch().then(() => { if (!alive) return; });
    return () => { alive = false; };
  }, [refetch, idsKey]);

  return { isLoading, error, data, refetch };
}
