// src/features/profiles/kinds/vport/hooks/menu/useVportActorMenu.js

import { useState, useEffect, useCallback } from "react";
import getVportActorMenuController from "@/features/profiles/kinds/vport/controller/menu/getVportActorMenu.controller";

/**
 * Hook Contract:
 * - Owns timing + UI state
 * - Calls controller only
 * - No DAL
 * - No business logic
 *
 * Expects controller to return:
 * {
 *   actorId,
 *   categories: [
 *     {
 *       id, actorId, key, name, description, sortOrder, isActive, createdAt, updatedAt,
 *       items: [
 *         {
 *           id, actorId, categoryId, key, name, description, sortOrder, isActive, createdAt, updatedAt,
 *           price, priceCents, imageUrl
 *         }
 *       ]
 *     }
 *   ],
 *   itemsOrphaned?: [...]
 * }
 */
export function useVportActorMenu({ actorId, includeInactive = false }) {
  const [menu, setMenu] = useState({ actorId: null, categories: [], itemsOrphaned: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!actorId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getVportActorMenuController({
        actorId,
        includeInactive,
      });

      setMenu(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [actorId, includeInactive]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    menu,
    categories: menu.categories ?? [],
    loading,
    error,
    refresh: load,
  };
}

export default useVportActorMenu;
