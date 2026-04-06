// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\core\hooks\useWandersCards.hook.js
// ============================================================================
// WANDERS CORE HOOK — CARDS
// Contract: UI lifecycle only. Calls core controllers. No DAL directly.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react";

import {
  listCardsForInbox,
  markWandersCardOpened,
  readWandersCardById,
  readWandersCardByPublicId,
} from "@/features/wanders/core/controllers/cards.controller";

function useWandersCards(input = {}) {
  const { inboxId = null, autoList = false, limit = 50 } = input;

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(Boolean(autoList));
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const listForInbox = useCallback(
    async (override = {}) => {
      if (!inboxId && !override.inboxId) return [];
      const targetInboxId = override.inboxId ?? inboxId;

      setLoading(true);
      setError(null);

      try {
        const res = await listCardsForInbox({
          inboxId: targetInboxId,
          limit: override.limit ?? limit,
        });

        if (!mountedRef.current) return [];
        const next = res ?? [];
        setCards(next);
        return next;
      } catch (e) {
        if (!mountedRef.current) return [];
        setError(e);
        return [];
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [inboxId, limit]
  );

  useEffect(() => {
    if (!autoList) return;
    if (!inboxId) return;
    listForInbox();
  }, [autoList, inboxId, listForInbox]);

  const readById = useCallback(async (cardId) => {
    setError(null);
    return readWandersCardById({ cardId });
  }, []);

  const readByPublicId = useCallback(async (publicId) => {
    setError(null);
    return readWandersCardByPublicId({ publicId });
  }, []);

  const markOpened = useCallback(async (cardId) => {
    setError(null);

    let updated = null;
    try {
      updated = await markWandersCardOpened({ cardId });
    } catch (e) {
      setError(e);
      return null;
    }

    if (!updated?.id) return updated ?? null;

    setCards((prev) => (prev ?? []).map((c) => (c.id === updated.id ? updated : c)));
    return updated;
  }, []);

  return {
    cards,
    loading,
    error,
    listForInbox,
    readById,
    readByPublicId,
    markOpened,
  };
}

export default useWandersCards;
export { useWandersCards };
