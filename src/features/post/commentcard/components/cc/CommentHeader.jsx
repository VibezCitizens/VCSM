import ActorLink from "@/shared/components/ActorLink";
import { useActorPresentation } from "@/state/actors/useActorPresentation";
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
  const actorUI = useActorPresentation(actor);
  if (!actorUI) return null;

  const timestamp = createdAt ? formatTimestamp(createdAt) : null;

  const showMenu = !!canDelete || !!canReport;

  return (
    <div className="flex items-center justify-between">
      <ActorLink
        actor={actorUI}
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
          className="text-neutral-500 hover:text-white text-lg px-2"
          type="button"
        >
          •••
        </button>
      )}
    </div>
  );
}
