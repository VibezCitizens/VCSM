// src/features/profiles/hooks/useActorKind.js

import { useEffect, useState } from "react";
import { getActorKindController } from "@/features/profiles/controller/getActorKind.controller";

export function useActorKind(actorId) {
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      // ✅ if no actorId, we are "done" (no fetch)
      if (!actorId) {
        if (alive) {
          setKind(null);
          setError(null);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const k = await getActorKindController(actorId);
        if (alive) setKind(k);
      } catch (e) {
        if (alive) setError(e);
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [actorId]);

  return { loading, kind, error };
}
