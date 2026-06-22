import { supabase } from "@/services/supabase/supabaseClient";

// DAL for resolving a VPORT actor's owning user actor (notifications inbox).
// Thin database reads only — no domain logic, no ownership decisions.
//
// NOTE (follow-up): vc.actor_owners access is centralized in the authorization
// feature per the authorization adapter contract (planned export
// resolveActorOwnerActorController). These reads are relocated here unchanged
// from the controller to satisfy the layer contract; centralizing them behind
// the authorization adapter is tracked separately.

/**
 * Read the owner user_id (profile id) for a given VPORT actor.
 * @returns {Promise<string|null>}
 */
export async function readActorOwnerUserIdDAL(vportActorId) {
  if (!vportActorId) return null;

  const { data, error } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select("user_id")
    .eq("actor_id", vportActorId)
    .maybeSingle();

  if (error || !data?.user_id) return null;
  return data.user_id;
}

/**
 * Read the user-kind actor id for a given owner profile id.
 * @returns {Promise<string|null>}
 */
export async function readUserActorIdByProfileIdDAL(profileId) {
  if (!profileId) return null;

  const { data, error } = await supabase
    .schema("vc")
    .from("actors")
    .select("id")
    .eq("profile_id", profileId)
    .eq("kind", "user")
    .maybeSingle();

  if (error) return null;
  return data?.id ?? null;
}
