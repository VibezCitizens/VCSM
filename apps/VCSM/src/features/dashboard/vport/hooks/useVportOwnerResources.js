import { useCallback, useEffect, useState } from "react";
import { listVportBookingResourcesController } from "@/features/dashboard/vport/controller/vportPublicBooking.controller";

export default function useVportOwnerResources({ ownerActorId, includeInactive = false, enabled = true } = {}) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  const load = useCallback(async () => {
    if (!enabled || !ownerActorId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listVportBookingResourcesController({ actorId: ownerActorId, includeInactive });
      setResources(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [ownerActorId, includeInactive, enabled]);

  useEffect(() => { load(); }, [load]);

  return { loading, error, resources, primary: resources[0] ?? null, refresh: load };
}
