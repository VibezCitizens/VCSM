// src/features/profiles/kinds/vport/hooks/services/useUpsertVportServices.js

import { useCallback, useMemo, useState } from "react";

import { useIdentity } from "@/features/identity/adapters/identity.adapter";
import upsertVportServicesController from "@/features/profiles/kinds/vport/controller/services/upsertVportServices.controller.js";

/**
 * Hook Contract:
 * - Owns timing + UI state
 * - Resolves identity and passes identityActorId to controller
 * - Calls controller only
 * - Must NOT import Supabase or DAL
 */
export default function useUpsertVportServices({
  targetActorId,
  vportType,
  onSuccess,
} = {}) {
  const { identity } = useIdentity();

  const identityActorId = useMemo(() => {
    return identity?.actorId ?? null;
  }, [identity]);

  const [error, setError] = useState(null);
  const [isPending, setIsPending] = useState(false);

  const mutate = useCallback(
    async ({ items, targetActorId: runtimeTargetActorId, vportType: runtimeVportType } = {}) => {
      const targetActorIdSafe = runtimeTargetActorId ?? targetActorId;
      const vportTypeSafe = runtimeVportType ?? vportType;

      if (!targetActorIdSafe) {
        throw new Error("useUpsertVportServices: targetActorId is required");
      }

      if (!vportTypeSafe) {
        throw new Error("useUpsertVportServices: vportType is required");
      }

      setIsPending(true);
      setError(null);

      try {
        const res = await upsertVportServicesController({
          identityActorId,
          targetActorId: targetActorIdSafe,
          vportType: vportTypeSafe,
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
    [identityActorId, targetActorId, vportType, onSuccess]
  );

  return { mutate, isPending, error };
}
