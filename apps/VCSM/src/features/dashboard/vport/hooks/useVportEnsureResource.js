import { useCallback, useState } from "react";
import { ensureVportOwnerResourceController } from "@/features/dashboard/vport/controller/ensureVportOwnerResource.controller";

export default function useVportEnsureResource() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError]         = useState(null);

  const ensure = useCallback(async ({ requestActorId, ownerActorId, timezone }) => {
    setIsPending(true);
    setError(null);
    try {
      const result = await ensureVportOwnerResourceController({ actorId: requestActorId, ownerActorId, timezone });
      return { ok: true, ...result };
    } catch (err) {
      setError(err);
      return { ok: false, error: err };
    } finally {
      setIsPending(false);
    }
  }, []);

  return { isPending, error, ensure };
}
