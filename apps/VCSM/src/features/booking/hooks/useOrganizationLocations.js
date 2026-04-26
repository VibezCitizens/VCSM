import { useCallback, useEffect, useState } from "react";
import { listLocationsByOrganization } from "@booking";

export default function useOrganizationLocations({ organizationId, enabled = true } = {}) {
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState(null);

  const load = useCallback(async () => {
    if (!enabled || !organizationId) {
      setLocations([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await listLocationsByOrganization({ organizationId });
      setLocations(Array.isArray(result) ? result : []);
    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, enabled]);

  useEffect(() => { load(); }, [load]);

  return { locations, isLoading, error, reload: load };
}
