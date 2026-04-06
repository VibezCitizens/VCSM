import { useCallback, useMemo, useState } from "react";

import { useIdentity } from "@/state/identity/identityContext";
import upsertVportRateController from "@/features/profiles/kinds/vport/controller/rates/upsertVportRate.controller.js";

/**
 * Hook: orchestration + UI state only.
 * - calls controller
 * - holds loading/error/data
 * - no DB, no mapping, no business rules
 */
export default function useUpsertVportRate({
  actorId = null,
  rateType = "fx",
} = {}) {
  const { identity } = useIdentity();

  const identityActorId = useMemo(() => {
    return identity?.actorId ?? null;
  }, [identity]);

  const [state, setState] = useState({
    isLoading: false,
    data: null,
    error: null,
  });

  const upsert = useCallback(
    async ({
      actorId: actorIdArg = null,
      rateType: rateTypeArg = null,
      baseCurrency,
      quoteCurrency,
      buyRate,
      sellRate,
      meta = null,
    } = {}) => {
      const finalActorId = actorIdArg ?? actorId ?? null;
      const finalRateType = rateTypeArg ?? rateType ?? "fx";

      if (!finalActorId) {
        const err = new Error("useUpsertVportRate: actorId is required");
        setState({ isLoading: false, data: null, error: err });
        throw err;
      }

      setState((s) => ({ ...s, isLoading: true, error: null }));

      try {
        const res = await upsertVportRateController({
          identityActorId,
          actorId: finalActorId,
          rateType: finalRateType,
          baseCurrency,
          quoteCurrency,
          buyRate,
          sellRate,
          meta,
        });

        setState({ isLoading: false, data: res, error: null });
        return res;
      } catch (err) {
        setState({ isLoading: false, data: null, error: err });
        throw err;
      }
    },
    [identityActorId, actorId, rateType]
  );

  return {
    ...state,
    upsert, // call this from your view/screen
  };
}