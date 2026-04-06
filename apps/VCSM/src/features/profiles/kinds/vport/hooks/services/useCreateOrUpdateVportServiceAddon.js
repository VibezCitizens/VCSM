// src/features/profiles/kinds/vport/hooks/services/useCreateOrUpdateVportServiceAddon.js

import { useCallback, useState } from "react";

import createOrUpdateVportServiceAddonController from "@/features/profiles/kinds/vport/controller/services/createOrUpdateVportServiceAddon.controller.js";

export default function useCreateOrUpdateVportServiceAddon({ targetActorId, onSuccess }) {
  const [error, setError] = useState(null);
  const [isPending, setIsPending] = useState(false);

  const mutate = useCallback(
    async ({ addon }) => {
      if (!targetActorId) throw new Error("useCreateOrUpdateVportServiceAddon: targetActorId is required");

      setIsPending(true);
      setError(null);

      try {
        const res = await createOrUpdateVportServiceAddonController({
          targetActorId,
          addon,
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