// src/features/post/postcard/components/PostFooter.jsx

import React from "react";
import ReactionBar from "./ReactionBar";
import { CommentInput } from "@/features/post/commentcard/adapters/commentcard.adapter";

export default function PostFooter({ postId }) {
  if (!postId) return null;

  return (
    <div className="w-full mt-3">

      {/* Reaction Bar */}
      <ReactionBar postId={postId} />

      {/* Comment Input */}
      <div className="mt-3 px-1">
        <CommentInput postId={postId} />
      </div>

    </div>
  );
}
