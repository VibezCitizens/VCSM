import { supabase } from "@/services/supabase/supabaseClient";

/**
 * DAL: Resolve handles -> actor ids
 * Handles:
 * - public.profiles.username (user actors via actors.profile_id)
 * - vc.vports.slug (vport actors via actors.vport_id)
 *
 * Returns raw rows:
 *   [{ actor_id, handle, kind }]
 */
export async function findActorsByHandles(handles) {
  const list = Array.isArray(handles)
    ? handles.map((h) => String(h || "").toLowerCase()).filter(Boolean)
    : [];
  if (list.length === 0) return [];

  // 1) user handles => profiles.id
  const { data: profiles, error: pErr } = await supabase
    .schema("public")
    .from("profiles")
    .select("id,username")
    .in("username", list);

  if (pErr) throw pErr;

  const profileIds = (profiles || []).map((p) => p.id).filter(Boolean);

  let userActors = [];
  if (profileIds.length > 0) {
    const { data: actors, error: aErr } = await supabase
      .schema("vc")
      .from("actors")
      .select("id,profile_id,kind")
      .in("profile_id", profileIds);

    if (aErr) throw aErr;
    userActors = actors || [];
  }

  // 2) vport handles => vports.id
  const { data: vports, error: vErr } = await supabase
    .schema("vc")
    .from("vports")
    .select("id,slug")
    .in("slug", list);

  if (vErr) throw vErr;

  const vportIds = (vports || []).map((v) => v.id).filter(Boolean);

  let vportActors = [];
  if (vportIds.length > 0) {
    const { data: actors, error: vaErr } = await supabase
      .schema("vc")
      .from("actors")
      .select("id,vport_id,kind")
      .in("vport_id", vportIds);

    if (vaErr) throw vaErr;
    vportActors = actors || [];
  }

  // 3) stitch to raw "resolved" rows
  const profileUsernameById = new Map();
  for (const p of profiles || []) {
    profileUsernameById.set(p.id, String(p.username || "").toLowerCase());
  }

  const vportSlugById = new Map();
  for (const v of vports || []) {
    vportSlugById.set(v.id, String(v.slug || "").toLowerCase());
  }

  const out = [];

  for (const a of userActors) {
    const handle = profileUsernameById.get(a.profile_id);
    if (handle) out.push({ actor_id: a.id, handle, kind: a.kind });
  }

  for (const a of vportActors) {
    const handle = vportSlugById.get(a.vport_id);
    if (handle) out.push({ actor_id: a.id, handle, kind: a.kind });
  }

  return out;
}
