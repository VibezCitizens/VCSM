import { useState, useCallback, useEffect } from "react";
import { useIdentity } from "@/features/identity/adapters/identity.adapter";
import { Comment } from "../models/Comment.model";
import { toggleCommentLike } from "../controllers/commentReactions.controller";

export default function useCommentCard(rawComment) {
  const { identity } = useIdentity();
  const actorId = identity?.actorId ?? null;

  // ------------------------------------------------------------
  // INITIAL DOMAIN INGEST (ONLY PLACE new Comment() IS CALLED)
  // ------------------------------------------------------------
  const [comment, setComment] = useState(() => new Comment(rawComment));

  const [expanded, setExpanded] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  // ------------------------------------------------------------
  // 🔒 RESYNC ONLY WHEN RAW COMMENT CHANGES (FROM PARENT THREAD)
  // ------------------------------------------------------------
  useEffect(() => {
    setComment(new Comment(rawComment));
  }, [rawComment]);

  // ------------------------------------------------------------
  // ❤️ TOGGLE LIKE (NO MODEL REBUILD — CRITICAL FIX)
  // ------------------------------------------------------------
  const toggleLike = useCallback(async () => {
    if (!actorId || isLiking || comment.isDeleted) return;

    setIsLiking(true);

    try {
      const result = await toggleCommentLike({
        commentId: comment.id,
        actorId,
      });

      if (!result) return;

      // ✅ ONLY UPDATE MUTABLE FIELDS
      // ❌ DO NOT REBUILD Comment()
      // ❌ DO NOT TOUCH actor / actorId
      setComment(prev => ({
        ...prev,
        isLiked: result.isLiked,
        likeCount: result.likeCount,
      }));
    } catch (err) {
      console.error("[useCommentCard] toggleLike failed:", err);
    } finally {
      setIsLiking(false);
    }
  }, [actorId, isLiking, comment]);

  return {
    comment,

    expanded,
    isLiking,

    toggleLike,
    toggleExpanded: () => setExpanded(v => !v),

    // permissions
    canLike: !!actorId && !comment.isDeleted,
    canReply: !!actorId && !comment.isDeleted,
    canDelete: comment.actorId === actorId,
  };
}
