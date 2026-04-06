import {
  listActorIdentityRowsByIdsDAL,
  listActorPresentationRowsByIdsDAL,
  listActorSummaryRowsByIdsDAL,
  listProfileRowsByIdsDAL,
  listVportRowsByIdsDAL,
} from "@/features/notifications/inbox/dal/senders.read.dal";

function mapSummaryRowToSender(row) {
  const actorId = row?.actor_id ?? row?.actorId ?? row?.id ?? null;
  if (!actorId) return null;

  const kind = String(row?.kind ?? "").toLowerCase();
  if (kind === "vport") {
    return {
      actorId,
      sender: {
        type: "vport",
        id: actorId,
        display_name:
          row?.vport_name ??
          row?.vportName ??
          row?.display_name ??
          row?.displayName ??
          null,
        slug: row?.vport_slug ?? row?.vportSlug ?? row?.slug ?? null,
        photo_url:
          row?.vport_avatar_url ??
          row?.vportAvatarUrl ??
          row?.photo_url ??
          row?.photoUrl ??
          null,
      },
    };
  }

  return {
    actorId,
    sender: {
      type: "user",
      id: actorId,
      username: row?.username ?? null,
      display_name: row?.display_name ?? row?.displayName ?? null,
      photo_url: row?.photo_url ?? row?.photoUrl ?? null,
    },
  };
}

export async function resolveSenders(actorIds) {
  const ids = [...new Set((actorIds ?? []).filter(Boolean))];
  if (!ids.length) return {};

  const out = {};

  const summaryRows = await listActorSummaryRowsByIdsDAL({ actorIds: ids }).catch(
    () => []
  );

  for (const row of summaryRows) {
    const mapped = mapSummaryRowToSender(row);
    if (!mapped?.actorId || !mapped?.sender) continue;
    out[mapped.actorId] = mapped.sender;
  }

  const unresolvedAfterSummary = ids.filter((id) => !out[id]);
  if (!unresolvedAfterSummary.length) {
    return out;
  }

  const presentationRows = await listActorPresentationRowsByIdsDAL({
    actorIds: unresolvedAfterSummary,
  }).catch(() => []);

  for (const row of presentationRows) {
    const actorId = row?.actor_id ?? null;
    if (!actorId) continue;

    if (row?.kind === "vport") {
      out[actorId] = {
        type: "vport",
        id: actorId,
        display_name: row?.vport_name ?? row?.display_name ?? null,
        slug: row?.vport_slug ?? null,
        photo_url: row?.vport_avatar_url ?? row?.photo_url ?? null,
      };
      continue;
    }

    out[actorId] = {
      type: "user",
      id: actorId,
      username: row?.username ?? null,
      display_name: row?.display_name ?? null,
      photo_url: row?.photo_url ?? null,
    };
  }

  const unresolvedActorIds = unresolvedAfterSummary.filter((id) => !out[id]);
  if (!unresolvedActorIds.length) {
    return out;
  }

  const actors = await listActorIdentityRowsByIdsDAL({
    actorIds: unresolvedActorIds,
  });

  const profileIds = (actors ?? []).map((row) => row.profile_id).filter(Boolean);
  const vportIds = (actors ?? []).map((row) => row.vport_id).filter(Boolean);

  const [profiles, vports] = await Promise.all([
    listProfileRowsByIdsDAL({ profileIds }),
    listVportRowsByIdsDAL({ vportIds }),
  ]);

  const profileById = Object.fromEntries((profiles ?? []).map((row) => [row.id, row]));
  const vportById = Object.fromEntries((vports ?? []).map((row) => [row.id, row]));

  for (const actor of actors ?? []) {
    if (actor.vport_id && vportById[actor.vport_id]) {
      const vport = vportById[actor.vport_id];
      out[actor.id] = {
        type: "vport",
        id: actor.id,
        display_name: vport.name,
        slug: vport.slug,
        photo_url: vport.avatar_url,
      };
    } else if (actor.profile_id && profileById[actor.profile_id]) {
      const profile = profileById[actor.profile_id];
      out[actor.id] = {
        type: "user",
        id: actor.id,
        username: profile.username,
        display_name: profile.display_name,
        photo_url: profile.photo_url,
      };
    }
  }

  return out;
}
