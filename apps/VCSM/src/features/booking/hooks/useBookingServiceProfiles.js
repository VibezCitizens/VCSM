import { useCallback, useEffect, useMemo, useState } from "react";

import getBookingServiceProfilesController from "@/features/booking/controller/getBookingServiceProfiles.controller";

function normalizeServiceIds(serviceIds) {
  return [...new Set((Array.isArray(serviceIds) ? serviceIds : []).map(String).filter(Boolean))];
}

export default function useBookingServiceProfiles({
  serviceIds = [],
  enabled = true,
  includeNonBookable = false,
} = {}) {
  const normalizedServiceIds = useMemo(() => normalizeServiceIds(serviceIds), [serviceIds]);
  const serviceIdsKey = normalizedServiceIds.join("|");

  const [isLoading, setIsLoading] = useState(Boolean(enabled && normalizedServiceIds.length));
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);

  const refetch = useCallback(async () => {
    if (!enabled || !normalizedServiceIds.length) {
      setData([]);
      setError(null);
      setIsLoading(false);
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getBookingServiceProfilesController({
        serviceIds: normalizedServiceIds,
        includeNonBookable,
      });

      setData(Array.isArray(result) ? result : []);
      return result;
    } catch (nextError) {
      setData([]);
      setError(nextError);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [enabled, normalizedServiceIds, includeNonBookable]);

  useEffect(() => {
    let alive = true;

    (async () => {
      const result = await refetch();
      if (!alive) return;
      return result;
    })();

    return () => {
      alive = false;
    };
  }, [refetch, serviceIdsKey]);

  return {
    isLoading,
    error,
    data,
    refetch,
  };
}
