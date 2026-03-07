import {
  readMentionActorPresentationDAL,
  readPostMentionedActorIdsDAL,
} from "@/features/post/postcard/dal/postMentions.read.dal";

function makeActorRoute({ kind, username, actorId, vportId }) {
  if (kind === "user" && username) return `/u/${username}`;
  if (kind === "vport" && vportId) return `/vport/${vportId}`;
  if (actorId) return `/profile/${actorId}`;
  return "/feed";
}

export async function getPostMentionMap({ postId }) {
  if (!postId) return {};

  try {
    const actorIds = await readPostMentionedActorIdsDAL({ postId });
    if (actorIds.length === 0) return {};

    const rows = await readMentionActorPresentationDAL({ actorIds });
    const mentionMap = {};

    for (const row of rows) {
      const actorId = row?.actor_id ?? null;
      if (!actorId) continue;

      const kind = row?.kind === "vport" ? "vport" : "user";
      const username =
        kind === "vport"
          ? row?.vport_slug ?? row?.username ?? null
          : row?.username ?? null;
      if (!username) continue;

      const displayName =
        kind === "vport"
          ? row?.vport_name ?? username
          : row?.display_name ?? username;
      const avatar =
        kind === "vport"
          ? row?.vport_avatar_url ?? "/avatar.jpg"
          : row?.photo_url ?? "/avatar.jpg";
      const vportId = row?.vport_id ?? null;
      const handleKey = String(username).toLowerCase();

      mentionMap[handleKey] = {
        id: actorId,
        kind,
        displayName,
        username,
        avatar,
        route: makeActorRoute({
          kind,
          username,
          actorId,
          vportId,
        }),
      };
    }

    return mentionMap;
  } catch (error) {
    console.warn("[getPostMentionMap] failed:", error);
    return {};
  }
}
