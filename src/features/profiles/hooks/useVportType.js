// src/features/profiles/hooks/useVportType.js

import { useEffect, useState } from "react";
import { getVportTypeController } from "@/features/profiles/controller/getVportType.controller";

export function useVportType(actorId) {
  const [loading, setLoading] = useState(true);
  const [vportType, setVportType] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!actorId) {
        if (alive) {
          setVportType(null);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const t = await getVportTypeController(actorId);
        if (alive) setVportType(t);
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

  return { loading, vportType, error };
}
