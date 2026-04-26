import { useCallback, useEffect, useRef, useState } from "react";
import { listLocationsByOrganization } from "@booking";

export default function useOrganizationLocations({ organizationId, enabled = true } = {}) {
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState(null);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const load = useCallback(async () => {
    if (!enabled || !organizationId) {
      setLocations([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await listLocationsByOrganization({ organizationId });
      if (mountedRef.current) setLocations(Array.isArray(result) ? result : []);
    } catch (e) {
      if (mountedRef.current) setError(e);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [organizationId, enabled]);

  useEffect(() => { load(); }, [load]);

  return { locations, isLoading, error, reload: load };
}
