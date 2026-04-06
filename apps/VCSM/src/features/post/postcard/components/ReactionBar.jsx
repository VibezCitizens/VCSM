import React from "react";
import { usePostReactions } from "../hooks/usePostReactions";
import BinaryReactionButton from "./BinaryReactionButton";
import RoseReactionButton from "./RoseReactionButton";
import CommentButton from "./CommentButton";
import ShareReactionButton from "./ShareReactionButton";

export default function ReactionBar({
  postId,
  commentCount = 0,
  onOpenComments,
  onShare,
}) {
  const { toggleReaction, myReaction, counts, sendRose, loading } = usePostReactions(postId);

  return (
    <div className="flex items-center gap-4 px-1 py-1.5 mt-2 select-none">
      <BinaryReactionButton
        type="like"
        emoji={"\uD83D\uDC4D"}
        active={myReaction === "like"}
        count={counts?.like ?? 0}
        disabled={loading}
        onClick={() => toggleReaction("like")}
      />

      <BinaryReactionButton
        type="dislike"
        emoji={"\uD83D\uDC4E"}
        active={myReaction === "dislike"}
        count={counts?.dislike ?? 0}
        disabled={loading}
        onClick={() => toggleReaction("dislike")}
      />

      <RoseReactionButton count={counts?.rose ?? 0} disabled={loading} onSend={sendRose} />

      <CommentButton
        count={commentCount}
        onClick={(e) => {
          e?.stopPropagation?.();
          onOpenComments?.();
        }}
      />

      <ShareReactionButton
        onClick={(e) => {
          e?.stopPropagation?.();
          onShare?.(postId);
        }}
        disabled={loading}
      />
    </div>
  );
}
