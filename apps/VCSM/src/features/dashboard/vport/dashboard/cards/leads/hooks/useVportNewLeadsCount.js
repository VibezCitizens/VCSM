import { useCallback, useEffect, useRef, useState } from "react";
import { useIdentity } from "@/state/identity/identityContext";
import {
  countNewVportLeadsController,
  fastCountNewVportLeadsController,
} from "@/features/dashboard/vport/dashboard/cards/leads/controller/vportLeads.controller";

const POLL_MS = 60_000;

export function useVportNewLeadsCount(actorId) {
  const { identity } = useIdentity();
  const callerActorId = identity?.actorId ?? null;
  const [count, setCount] = useState(0);
  const profileIdRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!actorId || !callerActorId) {
      setCount(0);
      return;
    }
    try {
      const result = await countNewVportLeadsController(actorId, callerActorId);
      profileIdRef.current = result.resolvedProfileId;
      setCount(result.count ?? 0);
    } catch {
      // silent — background badge
    }
  }, [actorId, callerActorId]);

  const pollRefresh = useCallback(async () => {
    if (!actorId || !callerActorId) return;
    const profileId = profileIdRef.current;
    if (!profileId) { await refresh(); return; }
    try {
      const n = await fastCountNewVportLeadsController(profileId);
      setCount(n ?? 0);
    } catch {
      // silent — background badge
    }
  }, [actorId, callerActorId, refresh]);

  useEffect(() => {
    void refresh();
    const id = setInterval(pollRefresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh, pollRefresh]);

  return count;
}

export default useVportNewLeadsCount;
