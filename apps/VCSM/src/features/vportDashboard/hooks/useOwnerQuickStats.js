import { useEffect, useState } from "react";
import { loadOwnerQuickStatsController } from "@/features/vportDashboard/controller/vportOwnerStats.controller";
import { captureVcsmError } from "@/services/monitoring/vcsmMonitoring";

export function useOwnerQuickStats(actorId, callerActorId) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!actorId || !callerActorId) return;
    let cancelled = false;
    setLoading(true);
    loadOwnerQuickStatsController({ actorId, callerActorId })
      .then((data) => { if (!cancelled) setStats(data); })
      .catch((err) => {
        captureVcsmError({
          feature: 'vportDashboard',
          module: 'useOwnerQuickStats',
          severity: 'error',
          message: `loadOwnerQuickStatsController failed — ${err?.message ?? 'unknown'}`,
          error_name: err?.name,
          operation: 'loadOwnerQuickStatsController',
          is_handled: true,
        });
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [actorId, callerActorId]);

  return { stats, loading };
}
