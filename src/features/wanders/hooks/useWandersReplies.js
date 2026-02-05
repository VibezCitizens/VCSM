// src/features/wanders/hooks/useWandersReplies.hook.js
// ============================================================================
// WANDERS HOOK — REPLIES
// Render-safe: does NOT throw when cardId is missing.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createReplyAsAnon,
  listRepliesForCard,
  softDeleteReply,
} from "@/features/wanders/controllers/wandersRepliescontroller";

function safeTrim(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

export function useWandersReplies(input) {
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
    // ✅ render-safe: no cardId => no-op
    if (!cardId) {
      if (mountedRef.current) {
        setReplies([]);
        setLoading(false);
        setError(null);
      }
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const res = await listRepliesForCard({ cardId, limit });
      if (!mountedRef.current) return [];
      setReplies(res || []);
      return res || [];
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
    if (!cardId) {
      // If the selected card changes to "none", reset state cleanly
      setReplies([]);
      setLoading(false);
      setError(null);
      return;
    }
    refresh();
  }, [auto, cardId, refresh]);

  const create = useCallback(
    async (payload) => {
      if (!cardId) {
        const e = new Error("useWandersReplies.create requires { cardId }");
        setError(e);
        throw e;
      }

      setError(null);
      const created = await createReplyAsAnon({ cardId, ...(payload || {}) });
      setReplies((prev) => [...(prev ?? []), created]);
      return created;
    },
    [cardId]
  );

  const remove = useCallback(async (replyId, isDeleted = true) => {
    if (!replyId) return null;

    setError(null);
    const updated = await softDeleteReply({ replyId, isDeleted });
    setReplies((prev) => (prev ?? []).map((r) => (r.id === updated.id ? updated : r)));
    return updated;
  }, []);

  return {
    cardId,
    replies,
    loading,
    error,
    refresh,
    create,
    remove,
    hasCard: !!cardId,
  };
}
