import { supabase } from "@/services/supabase/supabaseClient";

// DAL for the moderation acting-actor (suppressor) ownership check (moderation feature).
// Thin vc.actor_owners read — the controller decides allow/deny from the result.
//
// vc.actor_owners is the canonical ownership authority and is kind-agnostic (a
// session user owns user-kind AND vport-kind actors through it). Personal
// suppression (hide/unhide a post or comment from one's own feed) is
// kind-agnostic: the acting actor is the active identity actor and may be a user
// OR a vport, so the binding must work for either kind. This mirrors the block
// feature's readBlockActorOwnerLinkDAL (V11-M1) — moderation keeps its own local
// reader; it MUST NOT import the block DAL (cross-feature internal import is
// banned by the adapter boundary).
//
// This reads the link row for a (userId, actorId) pair; it MUST NOT derive the
// session (auth.getUser() is forbidden in DAL files — no-dal-auth-leak). The
// controller supplies userId from the approved auth adapter (readCurrentAuthUser).

/**
 * Read the actor_owners link row for a given auth user id + actor id.
 * Returns the row when an active (non-void) link exists, otherwise null.
 *
 * @param {{ actorId: string, userId: string }} params
 * @returns {Promise<{ actor_id: string, is_void: boolean }|null>}
 */
export async function readModerationActorOwnerLinkDAL({ actorId, userId } = {}) {
  if (!actorId || !userId) return null;

  const { data, error } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select("actor_id, is_void")
    .eq("user_id", userId)
    .eq("actor_id", actorId)
    .maybeSingle();

  if (error) return null;
  if (!data || data.is_void === true) return null;
  return data;
}
