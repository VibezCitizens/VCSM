import { useEffect, useState } from "react";
import { loadOwnerQuickStatsController } from "@/features/dashboard/vport/controller/vportOwnerStats.controller";
import { captureMonitoringError } from "@/services/monitoring/monitoring";

export function useOwnerQuickStats(actorId) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!actorId) return;
    let cancelled = false;
    setLoading(true);
    loadOwnerQuickStatsController({ actorId })
      .then((data) => { if (!cancelled) setStats(data); })
      .catch((err) => { captureMonitoringError(err, { context: "useOwnerQuickStats", actorId }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [actorId]);

  return { stats, loading };
}
