// src/features/post/postcard/ui/PostCard.view.jsx
import React from "react";

import MediaCarousel from "../components/MediaCarousel";
import ReactionBar from "../components/ReactionBar";

import { usePostCommentCount } from "@/features/post/commentcard/hooks/usePostCommentCount";
import { useIdentity } from "@/state/identity/identityContext";

import LinkifiedMentions from "@/features/upload/ui/LinkifiedMentions";
import PostHeader from "../components/PostHeader";
import "@/features/post/styles/post-modern.css";

export default function PostCardView({
  post,
  onOpenPost,
  onOpenMenu,
  onShare,

  covered = false,
  cover = null,
}) {
  const safePost = post ?? {};

  const { identity } = useIdentity();
  const viewerActorId = identity?.actorId ?? null;

  const commentCount = usePostCommentCount(safePost.id);

  const locationText = String(safePost.location_text ?? safePost.locationText ?? "").trim();

  const createdAt = safePost.created_at ?? safePost.createdAt ?? null;

  const isOwner = !!viewerActorId && safePost.actorId === viewerActorId;

  if (!post) return null;

  return (
    <div
      className="
        post-modern post-card
        w-full
        bg-gradient-to-b from-[#141024] to-[#0c0b16]
        border border-violet-300/20
        rounded-2xl shadow-sm
        overflow-hidden
        relative
        transition-transform duration-200
        hover:-translate-y-[1px]
        hover:shadow-[0_16px_34px_rgba(0,0,0,0.35)]
      "
    >
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

      <PostHeader
        actor={safePost.actorId}
        createdAt={createdAt}
        locationText={locationText}
        postId={safePost.id}
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

      {safePost.text ? (
        <div
          onClick={covered ? undefined : onOpenPost}
          className="
            px-4 pb-3 text-sm text-slate-100/95
            whitespace-pre-line cursor-pointer
          "
        >
          <LinkifiedMentions text={safePost.text} mentionMap={safePost.mentionMap || {}} />
        </div>
      ) : null}

      {safePost.media?.length > 0 ? (
        <div
          className="px-0 mb-2"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <MediaCarousel media={safePost.media} />
        </div>
      ) : null}

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
            postId={safePost.id}
            commentCount={commentCount}
            onOpenComments={covered ? undefined : onOpenPost}
            onShare={covered ? undefined : onShare}
          />
        </div>
      </div>
    </div>
  );
}
