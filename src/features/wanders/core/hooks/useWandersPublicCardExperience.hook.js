// src/features/wanders/core/hooks/useWandersPublicCardExperience.hook.js
// ============================================================================
// WANDERS HOOK — PUBLIC CARD EXPERIENCE
// Contract: Timing + UI lifecycle only.
// - calls domain hooks (useWandersCards)
// - owns loading/error/card state for public card route
// - no Supabase, no DAL, no business rules
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWandersCards } from "@/features/wanders/core/hooks/useWandersCards.hook";

export function useWandersPublicCardExperience({ publicId }) {
  const { readByPublicId, markOpened } = useWandersCards();

  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(Boolean(publicId));
  const [error, setError] = useState(null);

  const readByPublicIdStable = useCallback(
    (id) => Promise.resolve(readByPublicId?.(id)),
    [readByPublicId]
  );

  useEffect(() => {
    const id = String(publicId || "").trim();

    if (!id) {
      setLoading(false);
      setCard(null);
      setError(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await readByPublicIdStable(id);
        if (cancelled) return;
        setCard(result || null);
      } catch (e) {
        if (cancelled) return;
        setCard(null);
        setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [publicId, readByPublicIdStable]);

  const cardId = useMemo(() => card?.id || card?._id || card?.card_id || null, [card]);

  useEffect(() => {
    if (!cardId) return;

    let cancelled = false;

    (async () => {
      try {
        await Promise.resolve(markOpened?.(cardId));
      } catch {
        // UI-only: ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cardId, markOpened]);

  return {
    card,
    cardId,
    loading,
    error,
  };
}
