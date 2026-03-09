import { supabase } from '@/services/supabase/supabaseClient';
import { getActorSummariesByIdsDAL } from '@/features/actors/dal/getActorSummariesByIds.dal';

function mapSummaryRowToSender(row) {
  const actorId = row?.actor_id ?? row?.actorId ?? row?.id ?? null;
  if (!actorId) return null;

  const kind = String(row?.kind ?? '').toLowerCase();
  if (kind === 'vport') {
    return {
      actorId,
      sender: {
        type: 'vport',
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
      type: 'user',
      id: actorId,
      username: row?.username ?? null,
      display_name: row?.display_name ?? row?.displayName ?? null,
      photo_url: row?.photo_url ?? row?.photoUrl ?? null,
    },
  };
}

export async function resolveSenders(actorIds) {
  const ids = [...new Set(actorIds.filter(Boolean))];
  if (!ids.length) return {};

  const out = {};

  // 1) Preferred source: RPC summaries used elsewhere in the app.
  const { rows: summaryRows, error: summaryError } =
    await getActorSummariesByIdsDAL({ actorIds: ids });

  if (!summaryError) {
    for (const row of summaryRows ?? []) {
      const mapped = mapSummaryRowToSender(row);
      if (!mapped?.actorId || !mapped?.sender) continue;
      out[mapped.actorId] = mapped.sender;
    }
  }

  const unresolvedAfterSummary = ids.filter((id) => !out[id]);
  if (!unresolvedAfterSummary.length) {
    return out;
  }

  // 2) actor_presentation fallback.
  const { data: presentationRows } = await supabase
    .schema('vc')
    .from('actor_presentation')
    .select(
      'actor_id, kind, username, display_name, photo_url, vport_name, vport_slug, vport_avatar_url'
    )
    .in('actor_id', unresolvedAfterSummary);

  for (const row of presentationRows ?? []) {
    const actorId = row?.actor_id ?? null;
    if (!actorId) continue;

    if (row?.kind === 'vport') {
      out[actorId] = {
        type: 'vport',
        id: actorId,
        display_name: row?.vport_name ?? row?.display_name ?? null,
        slug: row?.vport_slug ?? null,
        photo_url: row?.vport_avatar_url ?? row?.photo_url ?? null,
      };
      continue;
    }

    out[actorId] = {
      type: 'user',
      id: actorId,
      username: row?.username ?? null,
      display_name: row?.display_name ?? null,
      photo_url: row?.photo_url ?? null,
    };
  }

  // Fallback for actors not returned by actor_presentation.
  const unresolvedActorIds = unresolvedAfterSummary.filter((id) => !out[id]);
  if (!unresolvedActorIds.length) {
    return out;
  }

  const { data: actors } = await supabase
    .schema('vc')
    .from('actors')
    .select('id, profile_id, vport_id')
    .in('id', unresolvedActorIds);

  const profileIds = (actors ?? []).map((a) => a.profile_id).filter(Boolean);
  const vportIds = (actors ?? []).map((a) => a.vport_id).filter(Boolean);

  const [profiles, vports] = await Promise.all([
    profileIds.length
      ? supabase
          .from('profiles')
          .select('id, username, display_name, photo_url')
          .in('id', profileIds)
      : { data: [] },
    vportIds.length
      ? supabase
          .schema('vc')
          .from('vports')
          .select('id, name, slug, avatar_url')
          .in('id', vportIds)
      : { data: [] },
  ]);

  const profMap = Object.fromEntries((profiles.data ?? []).map((p) => [p.id, p]));
  const vpMap = Object.fromEntries((vports.data ?? []).map((v) => [v.id, v]));

  for (const a of actors ?? []) {
    if (a.vport_id && vpMap[a.vport_id]) {
      const v = vpMap[a.vport_id];
      out[a.id] = {
        type: 'vport',
        id: a.id,
        display_name: v.name,
        slug: v.slug,
        photo_url: v.avatar_url,
      };
    } else if (a.profile_id && profMap[a.profile_id]) {
      const p = profMap[a.profile_id];
      out[a.id] = {
        type: 'user',
        id: a.id,
        username: p.username,
        display_name: p.display_name,
        photo_url: p.photo_url,
      };
    }
  }
  return out;
}
