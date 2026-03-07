// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\post\screens\hooks\usePostDetailEditing.js

import { useCallback, useState } from "react";
import { softDeleteCommentController } from "@/features/post/commentcard/controller/deleteComment.controller";

export default function usePostDetailEditing({ actorId, threadComments, onReload }) {
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingInitialText, setEditingInitialText] = useState("");

  const cancelInlineEdit = useCallback(() => {
    setEditingCommentId(null);
    setEditingInitialText("");
  }, []);

  const startEditFromCommentId = useCallback(
    (commentId) => {
      if (!commentId) return;

      const target = threadComments?.find((c) => c?.id === commentId);
      const initial = target?.content ?? "";

      setEditingCommentId(commentId);
      setEditingInitialText(initial);
    },
    [threadComments]
  );

  const onEditedSaved = useCallback(async () => {
    await onReload?.();
    cancelInlineEdit();
  }, [onReload, cancelInlineEdit]);

  const deleteCommentById = useCallback(
    async (commentId) => {
      if (!actorId) return;
      if (!commentId) return;

      const okConfirm = window.confirm("Delete this comment?");
      if (!okConfirm) return;

      try {
        const result = await softDeleteCommentController({ actorId, commentId });
        if (!result?.ok) {
          throw result?.error || new Error("Failed to delete comment");
        }
        await onReload?.();
      } catch (err) {
        console.error("[PostDetail] delete comment failed:", err);
        window.alert("Failed to delete comment");
      }
    },
    [actorId, onReload]
  );

  return {
    editingCommentId,
    editingInitialText,
    cancelInlineEdit,
    startEditFromCommentId,
    onEditedSaved,
    deleteCommentById,
  };
}
