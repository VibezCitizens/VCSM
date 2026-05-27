import { useCallback, useEffect, useState } from "react";
import { useIdentity } from "@/state/identity/identityContext";
import { countNewVportLeadsController } from "@/features/dashboard/vport/controller/vportLeads.controller";

const POLL_MS = 60_000;

export function useVportNewLeadsCount(actorId) {
  const { identity } = useIdentity();
  const callerActorId = identity?.actorId ?? null;
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!actorId || !callerActorId) {
      setCount(0);
      return;
    }
    try {
      // VPD-V-016 fix: callerActorId is now required by countNewVportLeadsController
      // (upgraded from naive string-compare to canonical ownership gate).
      const n = await countNewVportLeadsController(actorId, callerActorId);
      setCount(n ?? 0);
    } catch {
      // silent — this is a background badge, errors must not surface to UI
    }
  }, [actorId, callerActorId]);

  useEffect(() => {
    void refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return count;
}

export default useVportNewLeadsCount;
