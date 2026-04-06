import { useEffect, useState } from "react";
import { getVportActorIdByVportIdController } from "@/features/profiles/kinds/vport/controller/getVportActorIdByVportId.controller";

export function useVportActorIdByVportId(vportId) {
  const [actorId, setActorId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        if (!vportId) {
          if (alive) setActorId(null);
          return;
        }

        const resolvedActorId = await getVportActorIdByVportIdController(vportId);
        if (alive) setActorId(resolvedActorId);
      } catch (error) {
        console.error("[useVportActorIdByVportId] failed", error);
        if (alive) setActorId(null);
      } finally {
        if (alive) setLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [vportId]);

  return { actorId, loading };
}

