import { supabase } from '@/services/supabase/supabaseClient';

export async function resolveSenders(actorIds) {
  const ids = [...new Set(actorIds.filter(Boolean))];
  if (!ids.length) return {};

  const { data: actors } = await supabase
    .schema('vc')
    .from('actors')
    .select('id, profile_id, vport_id')
    .in('id', ids);

  const profileIds = actors.map(a => a.profile_id).filter(Boolean);
  const vportIds   = actors.map(a => a.vport_id).filter(Boolean);

  const [profiles, vports] = await Promise.all([
    profileIds.length
      ? supabase.from('profiles')
          .select('id, username, display_name, photo_url')
          .in('id', profileIds)
      : { data: [] },

    vportIds.length
      ? supabase.schema('vc')
          .from('vports')
          .select('id, name, slug, avatar_url')
          .in('id', vportIds)
      : { data: [] },
  ]);

  const profMap = Object.fromEntries((profiles.data ?? []).map(p => [p.id, p]));
  const vpMap   = Object.fromEntries((vports.data ?? []).map(v => [v.id, v]));

  const out = {};
  for (const a of actors) {
    if (a.vport_id && vpMap[a.vport_id]) {
      const v = vpMap[a.vport_id];
      out[a.id] = {
        type: 'vport',
        id: v.id,
        display_name: v.name,
        slug: v.slug,
        photo_url: v.avatar_url,
      };
    } else if (a.profile_id && profMap[a.profile_id]) {
      const p = profMap[a.profile_id];
      out[a.id] = {
        type: 'user',
        id: p.id,
        username: p.username,
        display_name: p.display_name,
        photo_url: p.photo_url,
      };
    }
  }
  return out;
}
