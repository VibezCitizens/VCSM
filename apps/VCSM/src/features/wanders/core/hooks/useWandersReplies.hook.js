// src/features/wanders/core/hooks/useWandersReplies.hook.js
// ============================================================================
// WANDERS CORE HOOK — REPLIES
// Contract: UI lifecycle only. Calls core controller. No DAL directly.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { listRepliesForCard } from "@/features/wanders/core/controllers/replies.controller";

function safeTrim(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

export default function useWandersReplies(input = {}) {
  const cardId = safeTrim(input?.cardId);
  const auto = input?.auto ?? true;
  const limit = input?.limit ?? 200;

  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(Boolean(auto && cardId));
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!cardId) {
      setReplies([]);
      setLoading(false);
      return [];
    }

    setLoading(true);
    setError(null);
    try {
      const rows = await listRepliesForCard({ cardId, limit });
      if (!mountedRef.current) return [];
      const next = rows ?? [];
      setReplies(next);
      return next;
    } catch (e) {
      if (!mountedRef.current) return [];
      setError(e);
      return [];
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [cardId, limit]);

  useEffect(() => {
    if (!auto) return;
    refresh();
  }, [auto, refresh]);

  return { replies, loading, error, refresh };
}

export { useWandersReplies };
