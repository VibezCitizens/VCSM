// src/features/post/commentcard/components/cc/CommentHeader.jsx

import ActorLink from "@/shared/components/ActorLink";
import { useActorPresentation } from "@/state/actors/useActorPresentation";
import { formatTimestamp } from "@/shared/lib/formatTimestamp";

export default function CommentHeader({
  actor,       // 🔒 actorId (uuid)
  createdAt,
  canDelete,
  onDelete,
}) {
  const actorUI = useActorPresentation(actor);
  if (!actorUI) return null;

  const timestamp = createdAt ? formatTimestamp(createdAt) : null;

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

      {canDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          className="text-neutral-500 hover:text-white text-lg px-2"
        >
          •••
        </button>
      )}
    </div>
  );
}
