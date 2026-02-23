import { useEffect, useMemo, useState } from "react";

import getVportRatesController from "@/features/profiles/kinds/vport/controller/rates/getVportRates.controller";

/**
 * Hook: orchestration + UI state only.
 * - calls controller
 * - holds loading/error/data
 * - no DB, no mapping, no business rules
 */
export default function useVportRates({ targetActorId, rateType = "fx" } = {}) {
  const key = useMemo(() => {
    return `${targetActorId ?? "none"}:${rateType ?? "fx"}`;
  }, [targetActorId, rateType]);

  const [state, setState] = useState({
    isLoading: true,
    data: null,
    error: null,
  });

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!targetActorId) {
        if (!alive) return;
        setState({
          isLoading: false,
          data: { ok: true, rateType, lastUpdated: null, rates: [] },
          error: null,
        });
        return;
      }

      if (!alive) return;
      setState((s) => ({ ...s, isLoading: true, error: null }));

      try {
        const res = await getVportRatesController({
          targetActorId,
          rateType,
        });

        if (!alive) return;
        setState({ isLoading: false, data: res, error: null });
      } catch (err) {
        if (!alive) return;
        setState({ isLoading: false, data: null, error: err });
      }
    }

    run();

    return () => {
      alive = false;
    };
  }, [key, targetActorId, rateType]);

  return state;
}