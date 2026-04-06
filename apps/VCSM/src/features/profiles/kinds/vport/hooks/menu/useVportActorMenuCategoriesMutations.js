// src/features/profiles/kinds/vport/hooks/menu/useVportActorMenuCategoriesMutations.js

import { useState, useCallback } from "react";

import saveVportActorMenuCategoryController from "@/features/profiles/kinds/vport/controller/menu/saveVportActorMenuCategory.controller";
import deleteVportActorMenuCategoryController from "@/features/profiles/kinds/vport/controller/menu/deleteVportActorMenuCategory.controller";

/**
 * Hook Contract:
 * - Owns timing + UI state
 * - Calls controllers only
 * - No DAL
 * - No business logic
 */
export function useVportActorMenuCategoriesMutations({ actorId, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const saveCategory = useCallback(
    async (payload) => {
      if (!actorId) return;

      setSaving(true);
      setError(null);

      try {
        const result = await saveVportActorMenuCategoryController({
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

  const deleteCategory = useCallback(
    async ({ categoryId }) => {
      if (!actorId) return;

      setDeleting(true);
      setError(null);

      try {
        const result = await deleteVportActorMenuCategoryController({
          actorId,
          categoryId,
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
    saveCategory,
    deleteCategory,
    saving,
    deleting,
    error,
  };
}

export default useVportActorMenuCategoriesMutations;
