import { supabase } from '@/services/supabase/supabaseClient'

// DAL for the privacy target-actor ownership check (settings/privacy feature).
// Thin vc.actor_owners read — the controller decides allow/deny from the result.
//
// vc.actor_owners is the canonical ownership authority and is kind-agnostic (a
// session user owns user-kind AND vport-kind actors through it). Privacy toggling
// is kind-agnostic: the target is the active identity actor and may be a USER or a
// VPORT, so the binding must work for either kind (mirrors
// blockActorOwnership.read.dal / moderationActorOwnership.read.dal; V02-H1, V11-M1).
//
// This reads the link row for a (userId, actorId) pair; it MUST NOT derive the
// session (auth.getUser() is forbidden in DAL files — no-dal-auth-leak). The
// controller supplies userId from the approved auth adapter (readCurrentAuthUser),
// and the controller — not this DAL — makes the allow/deny decision.

/**
 * Read the actor_owners link row for a given auth user id + actor id.
 * Returns the row when an active (non-void) link exists, otherwise null.
 *
 * @param {{ actorId: string, userId: string }} params
 * @returns {Promise<{ actor_id: string, is_void: boolean }|null>}
 */
export async function readPrivacyActorOwnerLinkDAL({ actorId, userId } = {}) {
  if (!actorId || !userId) return null

  const { data, error } = await supabase
    .schema('vc')
    .from('actor_owners')
    .select('actor_id, is_void')
    .eq('user_id', userId)
    .eq('actor_id', actorId)
    .maybeSingle()

  if (error) return null
  if (!data || data.is_void === true) return null
  return data
}
