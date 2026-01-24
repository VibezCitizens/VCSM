// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\post\screens\hooks\usePostDetailEditing.js

import { useCallback, useState } from "react";
import { deleteComment } from "@/features/post/commentcard/dal/comments.dal";

export default function usePostDetailEditing({ threadComments, onReload }) {
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
      if (!commentId) return;

      const okConfirm = window.confirm("Delete this comment?");
      if (!okConfirm) return;

      try {
        await deleteComment(commentId);
        await onReload?.();
      } catch (err) {
        console.error("[PostDetail] delete comment failed:", err);
        window.alert("Failed to delete comment");
      }
    },
    [onReload]
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
