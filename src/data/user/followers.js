import { supabase } from '@/lib/supabaseClient';

/** --- helpers ------------------------------------------------------------ */

async function getActorRow(actorId) {
  if (!actorId) return null;
  const { data, error } = await supabase
    .schema('vc')
    .from('actors')
    .select('id, kind, profile_id, vport_id')
    .eq('id', actorId)
    .limit(1);
  if (error) throw error;
  return Array.isArray(data) && data[0] ? data[0] : null;
}

/** Resolve auth user id that OWNS a given actor (works for user/vport actors). */
async function getOwnerUserIdForActor(actorId) {
  if (!actorId) return null;
  const { data, error } = await supabase
    .schema('vc')
    .from('actor_owners')
    .select('user_id')
    .eq('actor_id', actorId)
    .limit(1);
  if (error) throw error;
  return Array.isArray(data) && data[0]?.user_id ? data[0].user_id : null;
}

/** Resolve auth user id for a given actor only when kind='user' (legacy helper). */
async function getUserIdForActor(actorId) {
  const a = await getActorRow(actorId);
  return a?.kind === 'user' ? a?.profile_id ?? null : null;
}

/** --- actor_follows API (aligned) --------------------------------------- */

/** Is viewer (actor) following target (actor)? */
export async function isFollowing(viewerActorId, targetActorId) {
  if (!viewerActorId || !targetActorId || viewerActorId === targetActorId) return false;

  const { count, error } = await supabase
    .schema('vc')
    .from('actor_follows')
    .select('follower_actor_id', { head: true, count: 'exact' })
    .eq('follower_actor_id', viewerActorId)
    .eq('followed_actor_id', targetActorId)
    .eq('is_active', true);

  if (error) throw error;
  return (count ?? 0) > 0;
}

/** Follow: create or re-activate the follow edge. */
export async function follow(viewerActorId, targetActorId) {
  if (!viewerActorId || !targetActorId || viewerActorId === targetActorId) return false;

  const payload = {
    follower_actor_id: viewerActorId,
    followed_actor_id: targetActorId,
    is_active: true,
  };

  const { error } = await supabase
    .schema('vc')
    .from('actor_follows')
    .upsert(payload, { onConflict: 'follower_actor_id,followed_actor_id' });

  if (error) throw error;
  return true;
}

/** Unfollow (delete edge). */
export async function unfollow(viewerActorId, targetActorId) {
  if (!viewerActorId || !targetActorId || viewerActorId === targetActorId) return false;

  const { error } = await supabase
    .schema('vc')
    .from('actor_follows')
    .delete()
    .match({ follower_actor_id: viewerActorId, followed_actor_id: targetActorId });

  if (error) throw error;
  return true;
}

/** Count active followers for a target actor */
export async function countFollowers(targetActorId) {
  if (!targetActorId) return 0;

  const { count, error } = await supabase
    .schema('vc')
    .from('actor_follows')
    .select('followed_actor_id', { count: 'exact', head: true })
    .eq('followed_actor_id', targetActorId)
    .eq('is_active', true);

  if (error) throw error;
  return count ?? 0;
}

/** --- social_follow_requests API (needs user columns populated) --------- */

/** Check if there's a pending follow request (for private profiles) */
export async function hasPendingFollowRequest(viewerActorId, targetActorId) {
  if (!viewerActorId || !targetActorId || viewerActorId === targetActorId) return false;

  const { data, error } = await supabase
    .schema('vc')
    .from('social_follow_requests')
    .select('requester_actor_id')
    .eq('requester_actor_id', viewerActorId)
    .eq('target_actor_id', targetActorId)
    .eq('status', 'pending')
    .limit(1);

  if (error) throw error;
  return Array.isArray(data) && !!data[0];
}

/**
 * Create a follow request (for private targets).
 * Your table requires NOT NULL requester_id/target_id (auth.users FKs).
 * We resolve owners via vc.actor_owners for both actors.
 */
export async function createFollowRequest(viewerActorId, targetActorId) {
  if (!viewerActorId || !targetActorId || viewerActorId === targetActorId) return false;

  const [requesterUserId, targetUserId] = await Promise.all([
    getOwnerUserIdForActor(viewerActorId) ?? getUserIdForActor(viewerActorId),
    getOwnerUserIdForActor(targetActorId) ?? getUserIdForActor(targetActorId),
  ]);

  if (!requesterUserId || !targetUserId) {
    throw new Error(
      'social_follow_requests requires requester_id/target_id (auth.users). Could not resolve owners for actors.'
    );
  }

  const { error } = await supabase
    .schema('vc')
    .from('social_follow_requests')
    .upsert(
      {
        requester_id: requesterUserId,
        target_id: targetUserId,
        requester_actor_id: viewerActorId,
        target_actor_id: targetActorId,
        status: 'pending',
      },
      { onConflict: 'requester_id,target_id' }
    );

  if (error) throw error;
  return true;
}

/** Cancel a pending follow request */
export async function cancelFollowRequest(viewerActorId, targetActorId) {
  if (!viewerActorId || !targetActorId || viewerActorId === targetActorId) return false;

  const [requesterUserId, targetUserId] = await Promise.all([
    getOwnerUserIdForActor(viewerActorId) ?? getUserIdForActor(viewerActorId),
    getOwnerUserIdForActor(targetActorId) ?? getUserIdForActor(targetActorId),
  ]);
  if (!requesterUserId || !targetUserId) return true;

  const { error } = await supabase
    .schema('vc')
    .from('social_follow_requests')
    .update({ status: 'cancelled' })
    .match({
      requester_id: requesterUserId,
      target_id: targetUserId,
      status: 'pending',
    });

  if (error) throw error;
  return true;
}
