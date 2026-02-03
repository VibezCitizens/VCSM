// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\post\postcard\components\PostHeader.jsx
import React from "react";
import ActorLink from "@/shared/components/ActorLink";
import { useActorPresentation } from "@/state/actors/useActorPresentation";
import { formatTimestamp } from "@/shared/lib/formatTimestamp";

export default function PostHeader({
  actor,
  createdAt,
  locationText,
  onOpenPost,
  onOpenMenu,
  postId,
}) {
  const actorUI = useActorPresentation(actor);
  if (!actorUI) return null;

  const timestamp = createdAt ? formatTimestamp(createdAt) : null;
  const loc = String(locationText ?? "").trim();

  const kind = actorUI.kind ?? "";
  const displayName = String(
    actorUI.displayName ?? actorUI.name ?? actorUI.title ?? ""
  ).trim();

  // ✅ for vport: prefer slug, else username
  // ✅ for normal: prefer username, else slug
  const rawHandle =
    kind === "vport"
      ? String(actorUI.slug ?? actorUI.username ?? "").trim()
      : String(actorUI.username ?? actorUI.slug ?? "").trim();

  const handle = rawHandle ? `@${rawHandle}` : "";

  return (
    <div
      className="
        flex items-start justify-between
        px-4 py-3 cursor-pointer
        hover:bg-neutral-900/40 transition
      "
      onClick={onOpenPost}
    >
      {/* LEFT */}
      <div className="flex gap-3 min-w-0">
        {/* Avatar only (prevents double name/username) */}
        <ActorLink
          actor={actorUI}
          showText={false}
          avatarSize="w-11 h-11"
          avatarShape="rounded-lg"
        />

        {/* Meta column */}
        <div className="flex flex-col min-w-0 gap-[2px]">
          {/* Display name */}
          {displayName ? (
            <div className="text-sm font-medium text-white truncate leading-snug">
              {displayName}
            </div>
          ) : null}

          {/* Username/slug + timestamp */}
          {(handle || timestamp) ? (
            <div className="flex items-center gap-2 min-w-0 text-xs text-white/50 leading-snug">
              {handle ? <span className="truncate">{handle}</span> : null}

              {timestamp ? (
                <span className="shrink-0 text-white/40">
                  {handle ? "· " : ""}
                  {timestamp}
                </span>
              ) : null}
            </div>
          ) : null}

          {/* Location */}
          {loc ? (
            <div className="flex items-center gap-1 text-xs text-white/50 leading-snug mt-[2px]">
              <span aria-hidden className="translate-y-[1px]">
                
              </span>
              <span className="truncate">{loc}</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* RIGHT */}
      <button
        className="text-neutral-400 hover:text-white text-xl px-2"
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
