import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { probeVportPortfolioController } from "@/features/vportDashboard/dashboard/cards/portfolio/controller/probeVportPortfolio.controller";
import {
  clearPortfolioTraceEvents,
  getPortfolioTraceEvents,
  subscribeToPortfolioTrace,
} from "@/features/portfolio/adapters/portfolioTrace.adapter";

export function useVportPortfolioProbe({ actorId, identity } = {}) {
  const [probe, setProbe] = useState(null);
  const [probing, setProbing] = useState(false);
  const [traceEvents, setTraceEvents] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;
    const unsub = subscribeToPortfolioTrace(setTraceEvents);
    setTraceEvents(getPortfolioTraceEvents());
    return unsub;
  }, []);

  const runProbe = useCallback(async () => {
    if (!actorId) return;
    setProbing(true);
    setProbe(null);
    try {
      const result = await probeVportPortfolioController({
        actorId,
        identity,
        userId: user?.id ?? null,
      });
      setProbe(result);
    } catch (e) {
      setProbe({ probeError: e?.message ?? String(e) });
    }
    setProbing(false);
  }, [actorId, identity, user]);

  const clearTrace = useCallback(() => {
    clearPortfolioTraceEvents();
    setTraceEvents([]);
  }, []);

  return {
    probe,
    probing,
    traceEvents,
    runProbe,
    clearTrace,
  };
}

export default useVportPortfolioProbe;
