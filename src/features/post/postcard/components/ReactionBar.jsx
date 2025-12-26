// src/features/post/postcard/components/ReactionBar.jsx

import React from "react";
import { usePostReactions } from "../hooks/usePostReactions";
import BinaryReactionButton from "./BinaryReactionButton";
import RoseReactionButton from "./RoseReactionButton";
import CommentButton from "./CommentButton";

export default function ReactionBar({
  postId,
  commentCount = 0,
  onOpenComments,
}) {
  const {
    toggleReaction,
    myReaction,
    counts,
    sendRose,
    loading,
  } = usePostReactions(postId);

  return (
    <div className="flex items-center gap-6 px-4 mt-3 select-none">
      {/* 👍 LIKE */}
      <BinaryReactionButton
        type="like"
        emoji="👍"
        active={myReaction === "like"}
        count={counts?.like ?? 0}
        disabled={loading}
        onClick={() => toggleReaction("like")}
      />

      {/* 👎 DISLIKE */}
      <BinaryReactionButton
        type="dislike"
        emoji="👎"
        active={myReaction === "dislike"}
        count={counts?.dislike ?? 0}
        disabled={loading}
        onClick={() => toggleReaction("dislike")}
      />

      {/* 🌹 ROSE */}
      <RoseReactionButton
        count={counts?.rose ?? 0}
        disabled={loading}
        onSend={sendRose}
      />

      {/* 💬 COMMENTS → navigation intent */}
      <CommentButton
        count={commentCount}
        onClick={(e) => {
          e?.stopPropagation?.();
          onOpenComments?.();
        }}
      />
    </div>
  );
}
