import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { probeVportPortfolioController } from "@/features/dashboard/vport/dashboard/cards/portfolio/controller/probeVportPortfolio.controller";
import { portfolioTraceStore } from "@/features/portfolio/setup";

export function useVportPortfolioProbe({ actorId, identity } = {}) {
  const [probe, setProbe] = useState(null);
  const [probing, setProbing] = useState(false);
  const [traceEvents, setTraceEvents] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;
    const unsub = portfolioTraceStore.subscribe(setTraceEvents);
    setTraceEvents(portfolioTraceStore.events);
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
        email: user?.email ?? null,
      });
      setProbe(result);
    } catch (e) {
      setProbe({ probeError: e?.message ?? String(e) });
    }
    setProbing(false);
  }, [actorId, identity, user]);

  const clearTrace = useCallback(() => {
    portfolioTraceStore.clear();
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
