// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\feed\model\buildMentionMaps.js

function makeActorRoute({ kind, username, actorId, vportId }) {
  if (kind === "user" && username) return `/u/${username}`;
  if (kind === "vport" && vportId) return `/vport/${vportId}`;
  if (actorId) return `/profile/${actorId}`;
  return "/feed";
}

export function buildMentionMaps(mentionRows) {
  const rows = Array.isArray(mentionRows) ? mentionRows : [];
  if (rows.length === 0) return {};

  // actor_id -> presentation (handle key + payload)
  const presentationByActorId = new Map();

  for (const row of rows) {
    const actorId = row?.mentioned_actor_id;
    if (!actorId) continue;
    if (presentationByActorId.has(actorId)) continue;

    const kind = row?.kind === "vport" ? "vport" : "user";
    const username = kind === "vport" ? row?.slug ?? null : row?.username ?? null;
    const displayName =
      kind === "vport"
        ? row?.vport_name ?? row?.slug ?? null
        : row?.display_name ?? row?.username ?? null;
    const avatar =
      kind === "vport"
        ? row?.avatar_url ?? "/avatar.jpg"
        : row?.photo_url ?? "/avatar.jpg";
    const vportId = row?.vport_id ?? null;

    if (!username) continue;

    const handleKey = String(username).toLowerCase();

    presentationByActorId.set(actorId, {
      handleKey,
      payload: {
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
      },
    });
  }

  // build per-post maps keyed by handleKey
  const mentionMapsByPostId = {};

  for (const r of rows) {
    const postId = r?.post_id;
    const mentionedId = r?.mentioned_actor_id;
    if (!postId || !mentionedId) continue;

    const pres = presentationByActorId.get(mentionedId);
    if (!pres?.handleKey || !pres?.payload) continue;

    if (!mentionMapsByPostId[postId]) mentionMapsByPostId[postId] = {};
    mentionMapsByPostId[postId][pres.handleKey] = pres.payload;
  }

  return mentionMapsByPostId;
}
