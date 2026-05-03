// src/features/profiles/kinds/vport/dal/review/vportReviewAuthors.read.dal.js

import vc from "@/services/supabase/vcClient";
import { supabase } from "@/services/supabase/supabaseClient";
import vportSchema from "@/services/supabase/vportClient";

/**
 * Fetch author cards for a batch of review IDs using the SECURITY DEFINER RPC.
 * Bypasses RLS so private actor profiles are always visible on their review cards.
 *
 * @param {string[]} reviewIds
 * @returns {Promise<Map<string, { actorId, displayName, username, avatarUrl }>>}
 */
export async function dalGetReviewAuthorCards(reviewIds) {
  const ids = Array.from(new Set((reviewIds ?? []).filter(Boolean).map(String)));
  if (!ids.length) return new Map();

  const results = await Promise.all(
    ids.map(async (reviewId) => {
      const { data, error } = await vc
        .rpc("get_review_author_card", { p_review_id: reviewId });

      if (error || !data?.length) return null;
      const row = data[0];
      return {
        reviewId,
        actorId: row.actor_id ? String(row.actor_id) : null,
        displayName: row.display_name || "Anonymous",
        username: row.username ?? "",
        avatarUrl: row.avatar_url || null,
      };
    })
  );

  const byReviewId = new Map();
  for (const r of results) {
    if (r?.reviewId && r?.actorId) byReviewId.set(r.reviewId, r);
  }
  return byReviewId;
}

function uniq(arr) {
  return Array.from(new Set((arr ?? []).filter(Boolean).map((x) => String(x))));
}

/**
 * Returns rows shaped like:
 * { actorId, displayName, username, avatarUrl }
 *
 * Sources:
 *  - kind='user'  -> vc.actors.profile_id -> public.profiles(display_name, username, photo_url)
 *  - kind='vport' -> vc.actors.vport_id   -> vport.profiles(name, slug, avatar_url)
 *
 * NOTE:
 *  - This does NOT use vc.void_profiles.
 */
export async function dalListActorCardsByActorIds(actorIds) {
  const ids = uniq(actorIds);
  if (!ids.length) return [];

  // 1) actors (vc schema via vcClient)
  //    NOTE: RLS on vc.actors can block private user actors from non-owners/non-followers.
  //    For review author enrichment, we fall back to identity.actor_directory if vc.actors returns empty.
  const { data: actors, error: actorsErr } = await vc
    .from("actors")
    .select("id, kind, profile_id, vport_id")
    .in("id", ids);

  if (actorsErr) throw actorsErr;

  let actorRows = Array.isArray(actors) ? actors : [];

  // Fallback: if some actor IDs were blocked by RLS, try identity.actor_directory
  const foundIds = new Set(actorRows.map((a) => String(a.id)));
  const missingIds = ids.filter((id) => !foundIds.has(id));
  if (missingIds.length) {
    const { data: dirRows } = await supabase
      .schema("identity")
      .from("actor_directory")
      .select("actor_id, actor_kind, display_name, username, avatar_url")
      .in("actor_id", missingIds);

    if (dirRows?.length) {
      for (const d of dirRows) {
        // Synthesize an actor-like row so the rest of the function works
        // For directory hits, we skip profile/vport lookup and build the card directly
        actorRows.push({
          id: d.actor_id,
          kind: d.actor_kind ?? "user",
          profile_id: null,
          vport_id: null,
          _directoryCard: {
            displayName: d.display_name || d.username || "Citizen",
            username: d.username ?? "",
            avatarUrl: d.avatar_url || null,
          },
        });
      }
    }
  }

  const profileIds = uniq(actorRows.map((a) => a?.profile_id).filter(Boolean));
  const allActorIds = uniq(actorRows.map((a) => a?.id).filter(Boolean));

  // 2) profiles (public schema via main supabase client)
  let profileById = new Map();
  if (profileIds.length) {
    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("id, display_name, username, photo_url")
      .in("id", profileIds);

    if (profErr) throw profErr;

    const profRows = Array.isArray(profiles) ? profiles : [];
    profileById = new Map(
      profRows.map((p) => [
        String(p.id),
        {
          displayName: p.display_name || p.username || "Anonymous",
          username: p.username ?? "",
          avatarUrl: p.photo_url || null,
        },
      ])
    );
  }

  // 3) vports (vport schema via vportClient, keyed by actor_id)
  let vportByActorId = new Map();
  if (allActorIds.length) {
    const { data: vports, error: vportErr } = await vportSchema
      .from("profiles")
      .select("actor_id, name, slug, avatar_url")
      .in("actor_id", allActorIds);

    if (vportErr) throw vportErr;

    const vportRows = Array.isArray(vports) ? vports : [];
    vportByActorId = new Map(
      vportRows.map((v) => [
        String(v.actor_id),
        {
          displayName: v.name || v.slug || "Anonymous",
          username: v.slug ?? "",
          avatarUrl: v.avatar_url || null,
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

    // Use directory card if available (fallback for RLS-blocked actors)
    if (a._directoryCard) {
      out.push({ actorId, ...a._directoryCard });
      continue;
    }

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

    if (kind === "vport") {
      const vp = vportByActorId.get(actorId);
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