import { supabase } from "@/services/supabase/supabaseClient";
import vportSchema from "@/services/supabase/vportClient";

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

  // 2) vport handles => vport.profiles.slug → actor_id directly
  const { data: vportProfiles, error: vErr } = await vportSchema
    .from("profiles")
    .select("actor_id,slug")
    .in("slug", list);

  if (vErr) throw vErr;

  // 3) stitch to raw "resolved" rows
  const profileUsernameById = new Map();
  for (const p of profiles || []) {
    profileUsernameById.set(p.id, String(p.username || "").toLowerCase());
  }

  const out = [];

  for (const a of userActors) {
    const handle = profileUsernameById.get(a.profile_id);
    if (handle) out.push({ actor_id: a.id, handle, kind: a.kind });
  }

  for (const vp of vportProfiles || []) {
    if (vp.actor_id && vp.slug) {
      out.push({ actor_id: vp.actor_id, handle: String(vp.slug).toLowerCase(), kind: "vport" });
    }
  }

  return out;
}
