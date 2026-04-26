import { useCallback, useEffect, useState } from "react";
import { listQrLinksByOrganization, listQrLinksByProfile, createQrLink } from "@booking";

export default function useQrLinks({ organizationId = null, profileId = null, enabled = true } = {}) {
  const [qrLinks, setQrLinks]   = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError]        = useState(null);

  const load = useCallback(async () => {
    if (!enabled || (!organizationId && !profileId)) {
      setQrLinks([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = organizationId
        ? await listQrLinksByOrganization({ organizationId })
        : await listQrLinksByProfile({ profileId });
      setQrLinks(Array.isArray(result) ? result : []);
    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, profileId, enabled]);

  useEffect(() => { load(); }, [load]);

  const addQrLink = useCallback(async (params) => {
    setIsPending(true);
    setError(null);
    try {
      const result = await createQrLink(params);
      await load();
      return { ok: true, data: result, error: null };
    } catch (e) {
      setError(e);
      return { ok: false, data: null, error: e };
    } finally {
      setIsPending(false);
    }
  }, [load]);

  return { qrLinks, isLoading, isPending, error, reload: load, addQrLink };
}
