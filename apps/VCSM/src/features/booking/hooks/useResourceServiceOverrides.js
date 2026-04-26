import { useCallback, useEffect, useRef, useState } from "react";
import { listResourceServiceOverrides, upsertResourceServiceOverride } from "@booking";

export default function useResourceServiceOverrides({ resourceId, enabled = true } = {}) {
  const [overrides, setOverrides] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError]         = useState(null);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const load = useCallback(async () => {
    if (!enabled || !resourceId) {
      setOverrides([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await listResourceServiceOverrides({ resourceId });
      if (mountedRef.current) setOverrides(Array.isArray(result) ? result : []);
    } catch (e) {
      if (mountedRef.current) setError(e);
    } finally {
      if (mountedRef.current) setIsLoading(false);
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
