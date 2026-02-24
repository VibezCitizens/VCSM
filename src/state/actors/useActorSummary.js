import { useMemo } from "react";
import { useActorStore } from "@/state/actors/actorStore";

function pickFirst(...values) {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
      continue;
    }
    if (value != null) return value;
  }
  return null;
}

function toActorId(actorRef) {
  if (typeof actorRef === "string") return actorRef;
  if (!actorRef || typeof actorRef !== "object") return null;
  return actorRef.actorId ?? actorRef.actor_id ?? actorRef.id ?? null;
}

export function useActorSummary(actorRef) {
  const actorId = toActorId(actorRef);
  const actor = useActorStore((s) => (actorId ? s.actors[actorId] : null));

  return useMemo(() => {
    const displayName =
      pickFirst(
        actor?.displayName,
        actor?.display_name,
        actor?.vportName,
        actor?.vport_name,
        actor?.name,
        actor?.username,
        actorRef?.displayName,
        actorRef?.display_name,
        actorRef?.vportName,
        actorRef?.vport_name,
        actorRef?.name,
        actorRef?.username
      ) ?? "User";

    const username = pickFirst(
      actor?.username,
      actor?.vportSlug,
      actor?.vport_slug,
      actorRef?.username,
      actorRef?.slug,
      actorRef?.vportSlug,
      actorRef?.vport_slug
    );

    const avatar =
      pickFirst(
        actor?.photoUrl,
        actor?.photo_url,
        actor?.vportAvatarUrl,
        actor?.vport_avatar_url,
        actorRef?.photoUrl,
        actorRef?.photo_url,
        actorRef?.avatar
      ) ?? "/avatar.jpg";

    const route = actorId ? `/profile/${encodeURIComponent(actorId)}` : "#";

    return {
      actorId,
      displayName,
      username,
      avatar,
      route,
    };
  }, [actorId, actor, actorRef]);
}
