// src/features/profiles/kinds/vport/hooks/services/useUpsertVportServices.js

import { useCallback, useState } from "react";

import upsertVportServicesController from "@/features/profiles/kinds/vport/controller/services/upsertVportServices.controller.js";

/**
 * Hook Contract:
 * - Owns timing + UI state
 * - Calls controller only
 * - Must NOT import Supabase or DAL
 */
export default function useUpsertVportServices({
  targetActorId,
  vportType,
  onSuccess,
} = {}) {
  const [error, setError] = useState(null);
  const [isPending, setIsPending] = useState(false);

  const mutate = useCallback(
    async ({ items } = {}) => {
      if (!targetActorId) {
        throw new Error("useUpsertVportServices: targetActorId is required");
      }

      if (!vportType) {
        throw new Error("useUpsertVportServices: vportType is required");
      }

      setIsPending(true);
      setError(null);

      try {
        const res = await upsertVportServicesController({
          targetActorId,
          vportType,
          items,
        });

        if (typeof onSuccess === "function") {
          await onSuccess(res);
        }

        return res;
      } catch (e) {
        setError(e);
        throw e;
      } finally {
        setIsPending(false);
      }
    },
    [targetActorId, vportType, onSuccess]
  );

  return { mutate, isPending, error };
}