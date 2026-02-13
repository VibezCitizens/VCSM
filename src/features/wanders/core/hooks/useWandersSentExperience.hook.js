// src/features/wanders/core/hooks/useWandersSentExperience.hook.js
// ============================================================================
// WANDERS HOOK — SENT EXPERIENCE
// Owns timing + UI state for Sent view.
// Calls controllers/hooks only (no supabase, no DAL).
// ============================================================================

import { useEffect, useState } from "react";
import { useWandersCards } from "@/features/wanders/core/hooks/useWandersCards.hook";

export default function useWandersSentExperience({ cardPublicId }) {
  const { readByPublicId } = useWandersCards();

  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!cardPublicId) {
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
        const result = await Promise.resolve(readByPublicId?.(cardPublicId));
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
  }, [cardPublicId, readByPublicId]);

  return { card, loading, error };
}
