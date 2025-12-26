// ============================================================
//  FRIENDS SYSTEM — ACTOR STORE HYDRATION
// ------------------------------------------------------------
//  @File: hydrateActorsIntoStore.js
//  @System: FriendsModule
//  @RefactorBatch: 2025-12
//  @Status: FINAL
// ============================================================

import { supabase } from "@/services/supabase/supabaseClient";
import { useActorStore } from "@/state/actors/actorStore";

/**
 * Hydrate actor presentation rows into the actor store
 *
 * @param {string[]} actorIds
 */
export async function hydrateActorsIntoStore(actorIds = []) {
  if (!Array.isArray(actorIds) || actorIds.length === 0) return;

  // ------------------------------------------------------------
  // Deduplicate + guard
  // ------------------------------------------------------------
  const uniqueIds = [...new Set(actorIds)];
  if (!uniqueIds.length) return;

  // ------------------------------------------------------------
  // Fetch presentation rows (SSOT)
  // ------------------------------------------------------------
  const { data, error } = await supabase
    .schema("vc")
    .from("actor_presentation")
    .select(`
      actor_id,
      kind,
      profile_id,
      display_name,
      username,
      photo_url,
      vport_id,
      vport_name,
      vport_slug,
      vport_avatar_url,
      vport_banner_url
    `)
    .in("actor_id", uniqueIds);

  if (error) {
    console.error("[hydrateActorsIntoStore] fetch failed", error);
    throw error;
  }

  if (!data || data.length === 0) return;

  // ------------------------------------------------------------
  // 🔑 NORMALIZE AVATARS (CRITICAL FIX)
  // ------------------------------------------------------------
  const normalized = data.map((actor) => {
    if (actor.kind === "vport") {
      return {
        ...actor,
        photo_url:
          actor.vport_avatar_url ||
          actor.photo_url ||
          "/avatar.jpg",
      };
    }

    return {
      ...actor,
      photo_url: actor.photo_url || "/avatar.jpg",
    };
  });

  // ------------------------------------------------------------
  // Upsert into actor store (normalized)
  // ------------------------------------------------------------
  useActorStore.getState().upsertActors(normalized);
}
