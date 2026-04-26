import { useCallback, useEffect, useState } from "react";
import {
  listOrganizationsByOwnerActor,
  createOrganizationLocationWorkspace,
} from "@booking";

export default function useOrganizationWorkspace({ ownerActorId, enabled = true } = {}) {
  const [organizations, setOrganizations]   = useState([]);
  const [isLoading, setIsLoading]           = useState(false);
  const [isPending, setIsPending]           = useState(false);
  const [error, setError]                   = useState(null);

  const load = useCallback(async () => {
    if (!enabled || !ownerActorId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await listOrganizationsByOwnerActor({ ownerActorId });
      setOrganizations(Array.isArray(result) ? result : []);
    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
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
