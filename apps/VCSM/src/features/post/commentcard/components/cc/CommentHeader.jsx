import ActorLink from "@/shared/components/ActorLink";
import { useActorSummary } from "@/state/actors/useActorSummary";
import { formatTimestamp } from "@/shared/lib/formatTimestamp";

export default function CommentHeader({
  actor,
  createdAt,
  canDelete,
  canReport = false,
  onOpenMenu,
  commentId,
  commentActorId,
}) {
  const actorSummary = useActorSummary(actor);
  if (!actorSummary?.actorId) return null;

  const timestamp = createdAt ? formatTimestamp(createdAt) : null;
  const showMenu = !!canDelete || !!canReport;

  return (
    <div className="flex items-center justify-between">
      <ActorLink
        actor={{
          id: actorSummary.actorId,
          displayName: actorSummary.displayName,
          username: actorSummary.username,
          avatar: actorSummary.avatar,
          route: actorSummary.route,
        }}
        showUsername
        showTimestamp={Boolean(timestamp)}
        timestamp={timestamp}
        avatarSize="w-9 h-9"
        avatarShape="rounded-lg"
      />

      {showMenu && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            onOpenMenu?.({
              commentId,
              commentActorId,
              anchorRect: rect,
            });
          }}
          className="text-slate-500 hover:text-slate-100 text-lg px-2"
          type="button"
          aria-label="Comment options"
        >
          ...
        </button>
      )}
    </div>
  );
}
