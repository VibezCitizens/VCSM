// src/features/profiles/kinds/vport/hooks/menu/useVportActorMenuCategoriesMutations.js

import { useState, useCallback, useMemo } from "react";

import saveVportActorMenuCategoryController from "@/features/profiles/kinds/vport/controller/menu/saveVportActorMenuCategory.controller";
import deleteVportActorMenuCategoryController from "@/features/profiles/kinds/vport/controller/menu/deleteVportActorMenuCategory.controller";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";

export function useVportActorMenuCategoriesMutations({ actorId, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const { identity, availableActors } = useIdentity();
  const identityActorId = useMemo(() => {
    if (identity?.kind === "user") return identity.actorId ?? null;
    return availableActors?.find((a) => a.kind === "user")?.actorId ?? null;
  }, [identity, availableActors]);

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
          callerActorId: identityActorId,
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
    [actorId, identityActorId, onSuccess]
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
