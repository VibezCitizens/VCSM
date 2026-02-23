// src/features/profiles/kinds/vport/hooks/services/useDeleteVportServiceAddon.js

import { useCallback, useState } from "react";

import deleteVportServiceAddonController from "@/features/profiles/kinds/vport/controller/services/deleteVportServiceAddon.controller.js";

export default function useDeleteVportServiceAddon({ targetActorId, onSuccess }) {
  const [error, setError] = useState(null);
  const [isPending, setIsPending] = useState(false);

  const mutate = useCallback(
    async ({ addonId }) => {
      if (!targetActorId) throw new Error("useDeleteVportServiceAddon: targetActorId is required");
      if (!addonId) throw new Error("useDeleteVportServiceAddon: addonId is required");

      setIsPending(true);
      setError(null);

      try {
        const res = await deleteVportServiceAddonController({
          targetActorId,
          addonId,
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