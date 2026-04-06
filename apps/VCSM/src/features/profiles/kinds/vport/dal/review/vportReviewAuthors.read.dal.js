// src/features/profiles/kinds/vport/dal/review/vportReviewAuthors.read.dal.js

import vc from "@/services/supabase/vcClient";
import { supabase } from "@/services/supabase/supabaseClient";

function uniq(arr) {
  return Array.from(new Set((arr ?? []).filter(Boolean).map((x) => String(x))));
}

/**
 * Returns rows shaped like:
 * { actorId, displayName, username, avatarUrl }
 *
 * Sources:
 *  - kind='user'  -> vc.actors.profile_id -> public.profiles(display_name, username, photo_url)
 *  - kind='vport' -> vc.actors.vport_id   -> vc.vports(name, slug, avatar_url)
 *
 * NOTE:
 *  - This does NOT use vc.void_profiles.
 */
export async function dalListActorCardsByActorIds(actorIds) {
  const ids = uniq(actorIds);
  if (!ids.length) return [];

  // 1) actors (vc schema via vcClient)
  const { data: actors, error: actorsErr } = await vc
    .from("actors")
    .select("id, kind, profile_id, vport_id")
    .in("id", ids);

  if (actorsErr) throw actorsErr;

  const actorRows = Array.isArray(actors) ? actors : [];

  const profileIds = uniq(actorRows.map((a) => a?.profile_id).filter(Boolean));
  const vportIds = uniq(actorRows.map((a) => a?.vport_id).filter(Boolean));

  // 2) profiles (public schema via main supabase client)
  let profileById = new Map();
  if (profileIds.length) {
    const { data: profiles, error: profErr } = await supabase
      .from("profiles") // public.profiles (default schema for this client)
      .select("id, display_name, username, photo_url")
      .in("id", profileIds);

    if (profErr) throw profErr;

    const profRows = Array.isArray(profiles) ? profiles : [];
    profileById = new Map(
      profRows.map((p) => [
        String(p.id),
        {
          displayName: p.display_name ?? "Anonymous",
          username: p.username ?? "",
          avatarUrl: p.photo_url ?? "",
        },
      ])
    );
  }

  // 3) vports (vc schema via vcClient)
  let vportById = new Map();
  if (vportIds.length) {
    const { data: vports, error: vportErr } = await vc
      .from("vports")
      .select("id, name, slug, avatar_url")
      .in("id", vportIds);

    if (vportErr) throw vportErr;

    const vportRows = Array.isArray(vports) ? vports : [];
    vportById = new Map(
      vportRows.map((v) => [
        String(v.id),
        {
          displayName: v.name ?? "Anonymous",
          username: v.slug ?? "",
          avatarUrl: v.avatar_url ?? "",
        },
      ])
    );
  }

  // 4) build cards
  const out = [];
  for (const a of actorRows) {
    const actorId = String(a.id);
    const kind = String(a.kind ?? "");
    const profileId = a?.profile_id ? String(a.profile_id) : null;
    const vportId = a?.vport_id ? String(a.vport_id) : null;

    if (kind === "user" && profileId) {
      const prof = profileById.get(profileId);
      out.push({
        actorId,
        displayName: prof?.displayName ?? "Anonymous",
        username: prof?.username ?? "",
        avatarUrl: prof?.avatarUrl ?? "",
      });
      continue;
    }

    if (kind === "vport" && vportId) {
      const vp = vportById.get(vportId);
      out.push({
        actorId,
        displayName: vp?.displayName ?? "Anonymous",
        username: vp?.username ?? "",
        avatarUrl: vp?.avatarUrl ?? "",
      });
      continue;
    }

    out.push({
      actorId,
      displayName: "Anonymous",
      username: "",
      avatarUrl: "",
    });
  }

  return out;
}