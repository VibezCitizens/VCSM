import { useEffect, useState } from "react";
import { loadOwnerQuickStatsController } from "@/features/dashboard/vport/controller/vportOwnerStats.controller";

export function useOwnerQuickStats(actorId) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!actorId) return;
    let cancelled = false;
    setLoading(true);
    loadOwnerQuickStatsController({ actorId })
      .then((data) => { if (!cancelled) setStats(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [actorId]);

  return { stats, loading };
}
