import { useCallback, useEffect, useRef, useState } from "react";
import {
  listOrganizationsByOwnerActor,
  createOrganizationLocationWorkspace,
} from "@booking";

export default function useOrganizationWorkspace({ ownerActorId, enabled = true } = {}) {
  const [organizations, setOrganizations]   = useState([]);
  const [isLoading, setIsLoading]           = useState(false);
  const [isPending, setIsPending]           = useState(false);
  const [error, setError]                   = useState(null);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const load = useCallback(async () => {
    if (!enabled || !ownerActorId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await listOrganizationsByOwnerActor({ ownerActorId });
      if (mountedRef.current) setOrganizations(Array.isArray(result) ? result : []);
    } catch (e) {
      if (mountedRef.current) setError(e);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [ownerActorId, enabled]);

  useEffect(() => { load(); }, [load]);

  const createWorkspace = useCallback(async (params) => {
    setIsPending(true);
    setError(null);
    try {
      const result = await createOrganizationLocationWorkspace(params);
      await load();
      return { ok: true, data: result, error: null };
    } catch (e) {
      setError(e);
      return { ok: false, data: null, error: e };
    } finally {
      setIsPending(false);
    }
  }, [load]);

  return { organizations, isLoading, isPending, error, reload: load, createWorkspace };
}
