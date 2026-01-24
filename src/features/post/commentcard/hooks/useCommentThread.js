// src/features/post/commentcard/hooks/useCommentThread.js

import { useCallback, useEffect, useState } from "react";
import { useIdentity } from "@/state/identity/identityContext";
import { hydrateActorsFromRows } from "@/features/actors/controllers/hydrateActors.controller";
import {
  loadCommentThread,
  createRootComment,
  createReplyComment, // ✅ ADD
  buildTree, // ✅ REQUIRED — fixes “no default export” crash
} from "@/features/post/commentcard/controller/postComments.controller";
import { hydrateCommentReactions } from
  "@/features/post/commentcard/controller/commentReactions.hydrator.controller";

/* ============================================================
   HELPERS
   ============================================================ */
function flattenComments(tree) {
  const out = [];
  const walk = (nodes) => {
    for (const n of nodes) {
      out.push(n);
      if (n.replies?.length) walk(n.replies);
    }
  };
  walk(tree);
  return out;
}

/* ============================================================
   HOOK
   ============================================================ */
export default function useCommentThread(postId) {
  const { identity } = useIdentity();
  const actorId = identity?.actorId ?? null;

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);

  /* ------------------------------------------------------------
     LOAD THREAD
     ------------------------------------------------------------ */
  const load = useCallback(async () => {
    if (!postId) return;

    setLoading(true);
    try {
      // 1️⃣ load raw comment tree
      const thread = await loadCommentThread(postId);

      // 2️⃣ flatten for hydration
      const flat = flattenComments(thread);

      // 3️⃣ hydrate actors (global store)
      hydrateActorsFromRows(flat);

      // 4️⃣ hydrate reactions (viewer-specific)
      const reacted = await hydrateCommentReactions({
        comments: flat,
        actorId,
      });

      // 5️⃣ rebuild tree with reactions applied
      setComments(buildTree(reacted));
    } catch (err) {
      console.error("[useCommentThread] load failed:", err);
    } finally {
      setLoading(false);
    }
  }, [postId, actorId]);

  useEffect(() => {
    load();
  }, [load]);

  /* ------------------------------------------------------------
     ADD ROOT COMMENT
     ------------------------------------------------------------ */
  const addComment = async (content) => {
    if (!actorId || !content?.trim()) return;

    setPosting(true);
    try {
      const comment = await createRootComment({
        postId,
        actorId,
        content: content.trim(),
      });

      // hydrate actor for new comment
      hydrateActorsFromRows([comment]);

      // hydrate reactions (will be unliked / 0 count)
      const reacted = await hydrateCommentReactions({
        comments: [comment],
        actorId,
      });

      setComments((prev) => [...prev, reacted[0]]);
    } catch (err) {
      console.error("[useCommentThread] addComment failed:", err);
    } finally {
      setPosting(false);
    }
  };

  /* ------------------------------------------------------------
     ADD REPLY (TOP SPARK REPLY)
     ------------------------------------------------------------ */
  const addReply = async (parentCommentId, content) => {
    if (!actorId || !postId) return;
    if (!parentCommentId || !content?.trim()) return;

    setPosting(true);
    try {
      const reply = await createReplyComment({
        postId,
        actorId,
        parentCommentId,
        content: content.trim(),
      });

      if (!reply) return;

      // hydrate actor for new reply
      hydrateActorsFromRows([reply]);

      // hydrate reactions (will be unliked / 0 count)
      const reacted = await hydrateCommentReactions({
        comments: [reply],
        actorId,
      });

      // merge into existing tree deterministically
      setComments((prevTree) => {
        const prevFlat = flattenComments(prevTree);
        const nextFlat = [...prevFlat, reacted[0]];
        return buildTree(nextFlat);
      });
    } catch (err) {
      console.error("[useCommentThread] addReply failed:", err);
    } finally {
      setPosting(false);
    }
  };

  /* ------------------------------------------------------------
     API
     ------------------------------------------------------------ */
  return {
    actorId,
    comments,
    loading,
    posting,
    reload: load,
    addComment,
    addReply, // ✅ ADD
  };
}
