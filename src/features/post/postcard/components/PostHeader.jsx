import React from "react";
import ActorLink from "@/shared/components/ActorLink";
import { useActorSummary } from "@/state/actors/useActorSummary";
import { formatTimestamp } from "@/shared/lib/formatTimestamp";

export default function PostHeader({
  actor,
  createdAt,
  locationText,
  onOpenPost,
  onOpenMenu,
  postId,
}) {
  const actorSummary = useActorSummary(actor);
  if (!actorSummary?.actorId) return null;

  const timestamp = createdAt ? formatTimestamp(createdAt) : null;
  const loc = String(locationText ?? "").trim();
  const displayName = String(actorSummary.displayName ?? "User").trim() || "User";
  const rawHandle = String(actorSummary.username ?? "").trim();
  const handle = rawHandle ? `@${rawHandle}` : "";

  return (
    <div
      className="
        flex items-start justify-between
        px-4 py-3 cursor-pointer
        border-b border-violet-300/10
        hover:bg-white/[0.02] transition
      "
      onClick={onOpenPost}
    >
      <div className="flex gap-3 min-w-0">
        <ActorLink
          actor={{
            id: actorSummary.actorId,
            displayName: actorSummary.displayName,
            username: actorSummary.username,
            avatar: actorSummary.avatar,
            route: actorSummary.route,
          }}
          showText={false}
          avatarSize="w-11 h-11"
          avatarShape="rounded-lg"
        />

        <div className="flex flex-col min-w-0 gap-[2px]">
          <div className="text-sm font-semibold text-slate-100 truncate leading-snug">
            {displayName}
          </div>

          {(handle || timestamp) ? (
            <div className="flex items-center gap-2 min-w-0 text-xs text-slate-400 leading-snug">
              {handle ? <span className="truncate">{handle}</span> : null}
              {timestamp ? (
                <span className="shrink-0 text-slate-500">
                  {handle ? "- " : ""}
                  {timestamp}
                </span>
              ) : null}
            </div>
          ) : null}

          {loc ? (
            <div className="text-xs text-slate-400 leading-snug mt-[2px] truncate">
              {loc}
            </div>
          ) : null}
        </div>
      </div>

      <button
        className="text-slate-400 hover:text-slate-100 text-xl px-2"
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          onOpenMenu?.({
            postId,
            postActorId: actorSummary.actorId,
            anchorRect: rect,
          });
        }}
        aria-label="Post options"
      >
        ...
      </button>
    </div>
  );
}
