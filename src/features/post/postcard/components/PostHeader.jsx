// src/features/post/postcard/components/PostHeader.jsx
import React from "react";
import ActorLink from "@/shared/components/ActorLink";
import { useActorPresentation } from "@/state/actors/useActorPresentation";
import { formatTimestamp } from "@/shared/lib/formatTimestamp";

export default function PostHeader({
  actor,
  createdAt,
  onOpenPost,
  onOpenMenu, // ✅ add
  postId,     // ✅ add (needed for reporting)
}) {
  const actorUI = useActorPresentation(actor);
  if (!actorUI) return null;

  let timestamp = null;
  try {
    timestamp = createdAt ? formatTimestamp(createdAt) : null;
  } catch (err) {
    console.error("[PostHeader] formatTimestamp failed:", err, { createdAt });
  }

  return (
    <div
      className="
        flex items-center justify-between
        px-4 py-3 cursor-pointer
        hover:bg-neutral-900/40 transition
      "
      onClick={onOpenPost}
    >
      <ActorLink
        actor={actorUI}
        showUsername
        showTimestamp={Boolean(timestamp)}
        timestamp={timestamp}
        avatarSize="w-11 h-11"
        avatarShape="rounded-lg"
      />

      <button
        className="
          text-neutral-400 hover:text-white
          text-xl px-2
        "
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          onOpenMenu?.({
            postId,
            postActorId: actor,
            anchorRect: rect,
          });
        }}
        aria-label="Post options"
      >
        •••
      </button>
    </div>
  );
}
