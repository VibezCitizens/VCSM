import { supabase } from "@/services/supabase/supabaseClient";
import { useActorStore } from "@/state/actors/actorStore";

export async function hydrateActorsFromRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return;

  const actorIds = [...new Set(
    rows.map(r => 
      r.author_actor_id ?? r.authorActorId ?? 
      r.actor_id ?? r.actorId ?? 
      r.actor?.id ?? null
    ).filter(Boolean)
  )];

  if (!actorIds.length) return;

  const { data: actors, error: actorsError } = await supabase
    .schema("vc")
    .from("actors")
    .select("id, kind, profile_id, vport_id")
    .in("id", actorIds);

  if (actorsError || !actors) return;

  const profileIds = actors.filter(a => a.kind === 'user' && a.profile_id).map(a => a.profile_id);
  const vportIds = actors.filter(a => a.kind === 'vport' && a.vport_id).map(a => a.vport_id);

  const [pRes, vRes] = await Promise.all([
    profileIds.length ? supabase.from("profiles").select("*").in("id", profileIds) : { data: [] },
    vportIds.length ? supabase.schema("vc").from("vports").select("*").in("id", vportIds) : { data: [] }
  ]);

  const profileMap = Object.fromEntries(pRes.data?.map(p => [p.id, p]) || []);
  const vportMap = Object.fromEntries(vRes.data?.map(v => [v.id, v]) || []);

  const hydrated = actors.map(a => {
    const isUser = a.kind === 'user';
    const meta = isUser ? profileMap[a.profile_id] : vportMap[a.vport_id];
    
    if (!meta) return null;

    // Normalizing the object so the UI doesn't have to guess keys
    return {
      id: a.id,           // Original UUID
      actor_id: a.id,     // Key for the store map
      kind: a.kind,
      displayName: isUser ? meta.display_name : meta.name,
      username: isUser ? meta.username : meta.slug,
      photoUrl: isUser ? meta.photo_url : meta.avatar_url,
      bannerUrl: meta.banner_url ?? null,
      bio: meta.bio ?? null
    };
  }).filter(Boolean);

  if (hydrated.length) {
    useActorStore.getState().upsertActors(hydrated);
  }
}