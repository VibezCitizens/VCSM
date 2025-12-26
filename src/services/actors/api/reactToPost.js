// src/lib/actors/api/reactToPost.js
import { supabase } from '@/services/supabase/supabaseClient'; //transfer;
import vc from '@/services/supabase/vcClient'//transfer
import { getActiveVportId } from "@/lib/actors/actor";
import { resolveActorId } from import { getCurrentActorId } from '@/services/actors/dl/actors';
;

/**
 * React to a post as the current identity.
 * @param {string} postId
 * @param {'like'|'dislike'|'rose'} type
 * @param {number} qty default 1
 * @returns {Promise<object>} inserted row
 */
export async function reactToPost(postId, type, qty = 1) {
  if (!postId) throw new Error("reactToPost: postId required");
  if (!["like", "dislike", "rose"].includes(type))
    throw new Error("reactToPost: invalid type");

  const { data: u, error: uErr } = await supabase.auth.getUser();
  if (uErr) throw uErr;
  const userId = u?.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const activeVportId = getActiveVportId();
  const actorId = await resolveActorId({ userId, activeVportId });

  const payload = {
    post_id: postId,
    type,
    qty,
    actor_id: actorId, // identity (user or vport)
    user_id: userId,   // real owner
  };

  const { data, error } = await vc
    .from("post_reactions")
    .insert(payload)
    .select("id, post_id, type, qty, actor_id, user_id, created_at")
    .single();

  if (error) throw error;
  return data;
}

export default reactToPost;
