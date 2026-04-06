// src/features/profiles/kinds/vport/hooks/services/useReorderVportServiceAddon.js

import { useCallback, useState } from "react";

import reorderVportServiceAddonController from "@/features/profiles/kinds/vport/controller/services/reorderVportServiceAddon.controller.js";

export default function useReorderVportServiceAddon({ targetActorId, onSuccess }) {
  const [error, setError] = useState(null);
  const [isPending, setIsPending] = useState(false);

  const mutate = useCallback(
    async ({ orderedIds }) => {
      if (!targetActorId) throw new Error("useReorderVportServiceAddon: targetActorId is required");

      const ids = Array.isArray(orderedIds) ? orderedIds.filter(Boolean) : [];

      setIsPending(true);
      setError(null);

      try {
        const res = await reorderVportServiceAddonController({
          targetActorId,
          orderedIds: ids,
        });

        if (typeof onSuccess === "function") await onSuccess(res);
        return res;
      } catch (e) {
        setError(e);
        throw e;
      } finally {
        setIsPending(false);
      }
    },
    [targetActorId, onSuccess]
  );

  return { mutate, isPending, error };
}