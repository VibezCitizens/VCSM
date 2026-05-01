import { useCallback, useEffect, useMemo, useState } from "react";

import getVportServiceCatalogController from "@/features/vport/controller/getVportServiceCatalog.controller.js";
import { useProfilesOps } from "@/features/profiles/adapters/profiles.adapter";

export default function useVportServiceCatalog({ vportType } = {}) {
  const [data, setData] = useState({ vportType: null, services: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { getFallbackServiceCatalogRows } = useProfilesOps();

  const safeVportType = useMemo(
    () => (vportType ?? "").toString().trim().toLowerCase(),
    [vportType]
  );

  const fetchCatalog = useCallback(async () => {
    if (!safeVportType) {
      setData({ vportType: null, services: [] });
      setError(null);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await getVportServiceCatalogController({ vportType: safeVportType, getFallbackServiceCatalogRows });
      setData(res ?? { vportType: safeVportType, services: [] });
      return res;
    } catch (e) {
      setError(e);
      setData({ vportType: safeVportType, services: [] });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [safeVportType]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchCatalog,
  };
}
