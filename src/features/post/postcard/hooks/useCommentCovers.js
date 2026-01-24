// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\post\postcard\hooks\useCommentCovers.js

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  expandHiddenRootsToDescendants,
  getHiddenCommentIdsForActor,
} from "@/features/moderation/controllers/commentVisibility.controller";

/* ============================================================
   HOOK: useCommentCovers
   - UI timing/orchestration for "comment hidden for me"
   - No Supabase
   - Calls controllers only
   ============================================================ */

/**
 * tree: domain tree [{id, replies:[...]}]
 *
 * Returns:
 * - coveredIds: Set<string>
 * - refresh: () => Promise<void>
 * - coverNow: (commentId: string) => void  (optimistic local)
 * - clearLocal: () => void
 */
export default function useCommentCovers({
  actorId,
  commentTree,
  propagateRootToReplies = true,
}) {
  const [coveredIdsServer, setCoveredIdsServer] = useState(() => new Set());
  const [coveredIdsLocal, setCoveredIdsLocal] = useState(() => new Set());
  const [loading, setLoading] = useState(false);

  // flatten ids from current tree (stable + deterministic)
  const allIds = useMemo(() => {
    const out = [];
    const walk = (nodes) => {
      for (const n of nodes || []) {
        if (n?.id) out.push(n.id);
        if (n?.replies?.length) walk(n.replies);
      }
    };
    walk(commentTree || []);
    return out;
  }, [commentTree]);

  const refresh = useCallback(async () => {
    if (!actorId) {
      setCoveredIdsServer(new Set());
      return;
    }
    if (!allIds.length) {
      setCoveredIdsServer(new Set());
      return;
    }

    setLoading(true);
    try {
      const serverSet = await getHiddenCommentIdsForActor({
        actorId,
        commentIds: allIds,
      });
      setCoveredIdsServer(serverSet);
    } finally {
      setLoading(false);
    }
  }, [actorId, allIds]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const coverNow = useCallback((commentId) => {
    if (!commentId) return;
    setCoveredIdsLocal((prev) => {
      const next = new Set(prev);
      next.add(commentId);
      return next;
    });
  }, []);

  const clearLocal = useCallback(() => {
    setCoveredIdsLocal(new Set());
  }, []);

  const base = useMemo(() => {
    return new Set([
      ...Array.from(coveredIdsServer),
      ...Array.from(coveredIdsLocal),
    ]);
  }, [coveredIdsServer, coveredIdsLocal]);

  const coveredIds = useMemo(() => {
    if (!propagateRootToReplies) return base;
    return expandHiddenRootsToDescendants(commentTree || [], base);
  }, [propagateRootToReplies, commentTree, base]);

  return {
    coveredIds,
    coveredIdsServer,
    coveredIdsLocal,
    loading,
    refresh,
    coverNow,
    clearLocal,
  };
}
