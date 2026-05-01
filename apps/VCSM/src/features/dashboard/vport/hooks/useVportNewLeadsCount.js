import { useCallback, useEffect, useState } from "react";
import { countNewVportLeadsController } from "@/features/dashboard/vport/controller/vportLeads.controller";

const POLL_MS = 60_000;

export function useVportNewLeadsCount(actorId) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!actorId) {
      setCount(0);
      return;
    }
    try {
      const n = await countNewVportLeadsController(actorId);
      setCount(n ?? 0);
    } catch {
      // silent — this is a background badge, errors must not surface to UI
    }
  }, [actorId]);

  useEffect(() => {
    void refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return count;
}

export default useVportNewLeadsCount;
