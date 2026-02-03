// src/features/post/postcard/ui/PostCard.view.jsx (or wherever PostCardView lives)
import React from "react";
import { motion } from "framer-motion";

import MediaCarousel from "../components/MediaCarousel";
import ReactionBar from "../components/ReactionBar";

import { usePostCommentCount } from "@/features/post/commentcard/hooks/usePostCommentCount";
import { useIdentity } from "@/state/identity/identityContext";

// ✅ clickable mentions
import LinkifiedMentions from "@/features/upload/ui/LinkifiedMentions";

// ✅ NEW header
import PostHeader from "../components/PostHeader";

export default function PostCardView({
  post,
  onReact,
  onOpenPost,
  onOpenMenu,
  onShare,

  covered = false,
  cover = null,
}) {
  if (!post) return null;

  const { identity } = useIdentity();
  const viewerActorId = identity?.actorId ?? null;

  const commentCount = usePostCommentCount(post.id);

  const locationText = String(post.location_text ?? post.locationText ?? "").trim();

  const createdAt = post.created_at ?? post.createdAt ?? null;

  // keep ownership logic as-is
  const isOwner = !!viewerActorId && post.actorId === viewerActorId;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="
        w-full
        bg-neutral-900 border border-neutral-800
        rounded-2xl shadow-sm
        overflow-hidden
        relative
      "
    >
      {/* ✅ COVER LAYER */}
      {covered ? (
        <div
          className="absolute inset-0 z-20"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {cover}
        </div>
      ) : null}

      {/* ✅ HEADER (username + timestamp + location) */}
      <PostHeader
        actor={post.actorId}
        createdAt={createdAt}
        locationText={locationText}
        postId={post.id}
        onOpenPost={covered ? undefined : onOpenPost}
        onOpenMenu={({ postId, postActorId, anchorRect }) => {
          if (covered) return;

          onOpenMenu?.({
            postId,
            postActorId,
            viewerActorId,
            isOwner,
            anchorRect,
          });
        }}
      />

      {/* ✅ BODY TEXT */}
      {post.text ? (
        <div
          onClick={covered ? undefined : onOpenPost}
          className="
            px-4 pb-3 text-sm text-neutral-200
            whitespace-pre-line cursor-pointer
          "
        >
          <LinkifiedMentions text={post.text} mentionMap={post.mentionMap || {}} />
        </div>
      ) : null}

      {/* ✅ MEDIA */}
      {post.media?.length > 0 ? (
        <div
          className="px-0 mb-2"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <MediaCarousel media={post.media} />
        </div>
      ) : null}

      {/* ✅ REACTIONS */}
      <div className="px-4 pb-3">
        <div
          onClickCapture={(e) => {
            if (!covered) return;
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseDownCapture={(e) => {
            if (!covered) return;
            e.preventDefault();
            e.stopPropagation();
          }}
          onTouchStartCapture={(e) => {
            if (!covered) return;
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <ReactionBar
            postId={post.id}
            commentCount={commentCount}
            onOpenComments={covered ? undefined : onOpenPost}
            onShare={covered ? undefined : onShare}
          />
        </div>
      </div>
    </motion.div>
  );
}
