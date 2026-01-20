import React from "react";
import { motion } from "framer-motion";

import MediaCarousel from "../components/MediaCarousel";
import ReactionBar from "../components/ReactionBar";

import ActorLink from "@/shared/components/ActorLink";
import { useActorPresentation } from "@/state/actors/useActorPresentation";

// ✅ COMMENT COUNT (INDEPENDENT DOMAIN)
import { usePostCommentCount } from "@/features/post/commentcard/hooks/usePostCommentCount";

// ✅ add this
import { useIdentity } from "@/state/identity/identityContext";

export default function PostCardView({
  post,
  onReact,
  onOpenPost,
  onOpenMenu, // ✅ NEW (for •••)
}) {
  if (!post) return null;

  const { identity } = useIdentity(); // ✅ add
  const viewerActorId = identity?.actorId ?? null;

  /* ============================================================
     ACTOR PRESENTATION (ACTOR ID ONLY — CORRECT)
     ============================================================ */
  const actorUI = useActorPresentation(post.actorId);
  if (!actorUI) return null;

  // ✅ INDEPENDENT COMMENT COUNT (NOT FROM FEED)
  const commentCount = usePostCommentCount(post.id);

  const isVport = actorUI.kind === "vport";

  // ✅ add (owner check)
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
      "
    >
      {/* ======================================================
         HEADER
         ====================================================== */}
      <div
        onClick={onOpenPost}
        className="
          flex items-center justify-between
          px-4 py-3 cursor-pointer
          hover:bg-neutral-800/40
        "
      >
        <ActorLink
          actor={actorUI}
          showUsername={!isVport}
          showTimestamp={false}
          avatarSize="w-11 h-11"
          avatarShape="rounded-lg"
        />

        <button
          className="text-neutral-400 hover:text-white text-xl px-2"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            const rect = e.currentTarget.getBoundingClientRect();

            onOpenMenu?.({
              postId: post.id,
              postActorId: post.actorId,
              viewerActorId, // ✅ add
              isOwner,       // ✅ add
              anchorRect: rect,
            });
          }}
          aria-label="Post options"
          type="button"
        >
          •••
        </button>
      </div>

      {/* ======================================================
         TEXT
         ====================================================== */}
      {post.text && (
        <div
          onClick={onOpenPost}
          className="
            px-4 pb-3 text-sm text-neutral-200
            whitespace-pre-line cursor-pointer
          "
        >
          {post.text}
        </div>
      )}

      {/* ======================================================
         MEDIA
         ====================================================== */}
      {post.media?.length > 0 && (
        <div onClick={onOpenPost} className="px-0 mb-2">
          <MediaCarousel media={post.media} />
        </div>
      )}

      {/* ======================================================
         REACTIONS
         ====================================================== */}
      <div className="px-4 pb-3">
        <ReactionBar
          postId={post.id}
          commentCount={commentCount}
          onOpenComments={onOpenPost}
        />
      </div>
    </motion.div>
  );
}
