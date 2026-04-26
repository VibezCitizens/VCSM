import { useCallback, useEffect, useState } from "react";
import { listBookingResourcesByLocation } from "@booking";

export default function useLocationResources({ locationId, enabled = true } = {}) {
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState(null);

  const load = useCallback(async () => {
    if (!enabled || !locationId) {
      setResources([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await listBookingResourcesByLocation({ locationId });
      setResources(Array.isArray(result) ? result : []);
    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [locationId, enabled]);

  useEffect(() => { load(); }, [load]);

  return { resources, isLoading, error, reload: load };
}
