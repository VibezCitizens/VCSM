// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\post\screens\hooks\usePostDetailReplying.js

import { useCallback, useState } from "react";

export default function usePostDetailReplying({ addReply, posting }) {
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);

  const startReply = useCallback((commentId) => {
    if (!commentId) return;
    setReplyingToCommentId(commentId);
  }, []);

  const cancelReply = useCallback(() => {
    setReplyingToCommentId(null);
  }, []);

  const submitReply = useCallback(
    async (text) => {
      if (!replyingToCommentId) return;
      if (posting) return;

      await addReply?.(replyingToCommentId, text);
      setReplyingToCommentId(null);
    },
    [replyingToCommentId, addReply, posting]
  );

  return {
    replyingToCommentId,
    startReply,
    cancelReply,
    submitReply,
  };
}
