// src/features/post/postcard/components/PostHeader.jsx
// ============================================================
// POST HEADER
// ------------------------------------------------------------
// - Pure UI
// - Actor-based
// - Presentation resolved via hook
// - 🔒 actor = actorId (uuid string)
// ============================================================

import React from "react";
import ActorLink from "@/shared/components/ActorLink";
import { useActorPresentation } from "@/state/actors/useActorPresentation";
import { formatTimestamp } from "@/shared/lib/formatTimestamp";

/*
  PROPS:

  actor     = actorId (uuid string)
  createdAt = timestamp
  onOpenPost = function (optional)
*/

export default function PostHeader({
  actor,
  createdAt,
  onOpenPost,
}) {
  // ============================================================
  // DEBUG — INPUT VALIDATION
  // ============================================================
  console.log("[PostHeader] actor prop:", actor);
  console.log("[PostHeader] createdAt prop:", createdAt);
  console.log("[PostHeader] onOpenPost:", typeof onOpenPost);

  // ============================================================
  // 🔒 Resolve presentation from ACTOR ID
  // ============================================================
  const actorUI = useActorPresentation(actor);

  // ============================================================
  // DEBUG — ACTOR RESOLUTION
  // ============================================================
  console.log("[PostHeader] actorUI resolved:", actorUI);

  if (!actorUI) {
    console.warn(
      "[PostHeader] actorUI is null — actor not hydrated or missing in actorStore",
      { actor }
    );
    return null;
  }

  // ============================================================
  // TIMESTAMP FORMAT
  // ============================================================
  let timestamp = null;
  try {
    timestamp = createdAt ? formatTimestamp(createdAt) : null;
  } catch (err) {
    console.error("[PostHeader] formatTimestamp failed:", err, {
      createdAt,
    });
  }

  console.log("[PostHeader] formatted timestamp:", timestamp);

  return (
    <div
      className="
        flex items-center justify-between
        px-4 py-3 cursor-pointer
        hover:bg-neutral-900/40 transition
      "
      onClick={onOpenPost}
    >
      {/* ======================================================
          LEFT — Avatar + Identity
         ====================================================== */}
      <ActorLink
        actor={actorUI}
        showUsername
        showTimestamp={Boolean(timestamp)}
        timestamp={timestamp}
        avatarSize="w-11 h-11"
        avatarShape="rounded-lg"
      />

      {/* ======================================================
          DEBUG — ACTOR PAYLOAD (DEV ONLY)
         ====================================================== */}
      {process.env.NODE_ENV === "development" && (
        <pre
          className="
            ml-3 text-[10px] leading-tight
            max-w-[220px] overflow-hidden
            text-neutral-500
          "
        >
          {JSON.stringify(actorUI, null, 2)}
        </pre>
      )}

      {/* ======================================================
          RIGHT — Context Menu (future actions)
         ====================================================== */}
      <button
        className="
          text-neutral-400 hover:text-white
          text-xl px-2
        "
        onClick={(e) => {
          e.stopPropagation();
          console.log("[PostHeader] context menu clicked for actor:", actor);
          // future: delete, report, block
        }}
      >
        •••
      </button>
    </div>
  );
}
