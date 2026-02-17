// src/features/profiles/kinds/vport/hooks/menu/useVportActorMenuItemsMutations.js

import { useState, useCallback } from "react";

import saveVportActorMenuItemController from "@/features/profiles/kinds/vport/controller/menu/saveVportActorMenuItem.controller";
import deleteVportActorMenuItemController from "@/features/profiles/kinds/vport/controller/menu/deleteVportActorMenuItem.controller";

/**
 * Hook Contract:
 * - Owns timing + UI state
 * - Calls controllers only
 * - No DAL
 * - No business logic
 */
export function useVportActorMenuItemsMutations({ actorId, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const saveItem = useCallback(
    async (payload) => {
      if (!actorId) return;

      setSaving(true);
      setError(null);

      try {
        const result = await saveVportActorMenuItemController({
          actorId,
          ...payload,
        });

        if (onSuccess) {
          await onSuccess(result);
        }

        return result;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [actorId, onSuccess]
  );

  const deleteItem = useCallback(
    async ({ itemId }) => {
      if (!actorId) return;

      setDeleting(true);
      setError(null);

      try {
        const result = await deleteVportActorMenuItemController({
          actorId,
          itemId,
        });

        if (onSuccess) {
          await onSuccess(result);
        }

        return result;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setDeleting(false);
      }
    },
    [actorId, onSuccess]
  );

  return {
    saveItem,
    deleteItem,
    saving,
    deleting,
    error,
  };
}

export default useVportActorMenuItemsMutations;
