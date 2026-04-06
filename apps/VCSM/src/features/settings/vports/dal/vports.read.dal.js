// src/features/settings/vports/dal/vports.read.dal.js
// ============================================================
// VPORTS — READ DAL
// - Lists VPORTs owned by the authenticated user
// - Actor-safe (via actor_owners)
// - UI-agnostic
// ============================================================

import { supabase } from "@/services/supabase/supabaseClient";

/**
 * List VPORTs owned by the current authenticated user
 *
 * Returns:
 * [
 *   {
 *     id,
 *     name,
 *     avatar_url,
 *     actor_id,
 *     created_at
 *   }
 * ]
 */
export async function readMyVports() {
  const {
    data: auth,
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;

  const userId = auth?.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select(`
      actor:actors (
        id,
        kind,
        vport:vports (
          id,
          name,
          avatar_url,
          created_at
        )
      )
    `)
    .eq("user_id", userId);

  if (error) throw error;

  // Normalize into flat vport rows
  return (
    data
      ?.map((row) => {
        const actor = row.actor;
        if (!actor || actor.kind !== "vport") return null;

        const v = actor.vport;
        if (!v) return null;

        return {
          id: v.id,
          name: v.name,
          avatar_url: v.avatar_url,
          actor_id: actor.id,
          created_at: v.created_at,
        };
      })
      .filter(Boolean) ?? []
  );
}
