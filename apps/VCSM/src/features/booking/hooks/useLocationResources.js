import { useCallback, useEffect, useRef, useState } from "react";
import { listBookingResourcesByLocation } from "@booking";

export default function useLocationResources({ locationId, enabled = true } = {}) {
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState(null);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const load = useCallback(async () => {
    if (!enabled || !locationId) {
      setResources([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await listBookingResourcesByLocation({ locationId });
      if (mountedRef.current) setResources(Array.isArray(result) ? result : []);
    } catch (e) {
      if (mountedRef.current) setError(e);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [locationId, enabled]);

  useEffect(() => { load(); }, [load]);

  return { resources, isLoading, error, reload: load };
}
