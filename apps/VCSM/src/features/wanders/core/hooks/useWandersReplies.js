// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\core\hooks\useWandersReplies.js
// ============================================================================
// WANDERS HOOK — REPLIES (CORE)
// Contract: UI timing + state only. Calls controllers. No Supabase. No DAL.
// Render-safe: does NOT throw when cardId is missing.
// Smooth loading: does NOT flip loading=true if replies already exist.
// FIXED: prevent infinite auto-refresh loop by NOT depending on `replies`.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  createReplyAsAnon,
  listRepliesForCard,
  softDeleteReply,
} from "@/features/wanders/core/controllers/replies.controller";

function safeTrim(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function asArray(v) {
  return Array.isArray(v) ? v : [];
}

export function useWandersReplies(input) {
  const cardId = useMemo(() => safeTrim(input?.cardId), [input?.cardId]);
  const auto = input?.auto ?? true;
  const limit = input?.limit ?? 200;

  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(Boolean(auto && cardId));
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  const repliesRef = useRef([]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    repliesRef.current = asArray(replies);
  }, [replies]);

  const refresh = useCallback(async () => {
    if (!cardId) {
      if (mountedRef.current) {
        setReplies([]);
        setLoading(false);
        setError(null);
      }
      return [];
    }

    // ✅ Only show loading if we have NO replies yet
    if (mountedRef.current) {
      const alreadyHaveReplies = asArray(repliesRef.current).length > 0;
      if (!alreadyHaveReplies) setLoading(true);
      setError(null);
    }

    try {
      const res = await listRepliesForCard({ cardId, limit });
      if (!mountedRef.current) return [];

      const next = asArray(res);
      setReplies(next);
      return next;
    } catch (e) {
      if (!mountedRef.current) return [];
      setError(e);
      return [];
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [cardId, limit]); // ✅ NO `replies` here

  useEffect(() => {
    if (!auto) return;

    if (!cardId) {
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
        if (mountedRef.current) setError(e);
        throw e;
      }

      if (mountedRef.current) setError(null);

      const created = await createReplyAsAnon({ cardId, ...(payload || {}) });

      if (mountedRef.current && created) {
        setReplies((prev) => {
          const arr = asArray(prev);
          const exists = arr.some((r) => r?.id === created.id);
          if (exists) return arr;
          return [created, ...arr];
        });
      }

      // silent background reconciliation
      refresh();

      return created;
    },
    [cardId, refresh]
  );

  const remove = useCallback(
    async (replyId, isDeleted = true) => {
      if (!replyId) return null;

      if (mountedRef.current) setError(null);

      const updated = await softDeleteReply({ replyId, isDeleted });

      if (mountedRef.current && updated?.id) {
        setReplies((prev) => asArray(prev).map((r) => (r?.id === updated.id ? updated : r)));
      }

      refresh();

      return updated;
    },
    [refresh]
  );

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
