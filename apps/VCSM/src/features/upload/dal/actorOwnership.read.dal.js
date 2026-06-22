import { supabase } from "@/services/supabase/supabaseClient";

// DAL for the post-author ownership check (upload feature).
// Thin database read only — the controller decides allow/deny from the result.
//
// NOTE (follow-up): vc.actor_owners access is centralized in the authorization
// feature per the authorization adapter contract. This read is relocated here
// unchanged from createPost.controller to satisfy the layer contract;
// centralizing it behind the authorization adapter is tracked separately.

/**
 * Read the actor_owners link row for a given user (profile) id + actor id.
 * Returns the row when the link exists, otherwise null.
 *
 * @param {{ userId: string, actorId: string }} params
 * @returns {Promise<{ actor_id: string }|null>}
 */
export async function readActorOwnerLinkDAL({ userId, actorId } = {}) {
  if (!userId || !actorId) return null;

  const { data, error } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select("actor_id")
    .eq("user_id", userId)
    .eq("actor_id", actorId)
    .maybeSingle();

  if (error) return null;
  return data ?? null;
}
