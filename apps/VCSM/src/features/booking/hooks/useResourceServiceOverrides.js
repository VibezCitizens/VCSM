import { useCallback, useEffect, useState } from "react";
import { listResourceServiceOverrides, upsertResourceServiceOverride } from "@booking";

export default function useResourceServiceOverrides({ resourceId, enabled = true } = {}) {
  const [overrides, setOverrides] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError]         = useState(null);

  const load = useCallback(async () => {
    if (!enabled || !resourceId) {
      setOverrides([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await listResourceServiceOverrides({ resourceId });
      setOverrides(Array.isArray(result) ? result : []);
    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [resourceId, enabled]);

  useEffect(() => { load(); }, [load]);

  const saveOverride = useCallback(async (params) => {
    setIsPending(true);
    setError(null);
    try {
      const result = await upsertResourceServiceOverride(params);
      await load();
      return { ok: true, data: result, error: null };
    } catch (e) {
      setError(e);
      return { ok: false, data: null, error: e };
    } finally {
      setIsPending(false);
    }
  }, [load]);

  return { overrides, isLoading, isPending, error, reload: load, saveOverride };
}
