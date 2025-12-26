// src/lib/actors/api/addComment.js
import { supabase } from '@/services/supabase/supabaseClient'; //transfer;
import vc from '@/services/supabase/vcClient'//transfer
import { getActiveVportId } from "@/lib/actors/actor";
import { resolveActorId } from  '@/services/actors/dl/actors';
;

/**
 * Insert a comment as the current identity (user or vport).
 * @param {string} postId
 * @param {string} content
 * @returns {Promise<object>} inserted row
 */
export async function addComment(postId, content) {
  if (!postId) throw new Error("addComment: postId required");
  const text = String(content ?? "").trim();
  if (!text) throw new Error("addComment: content required");

  const { data: u, error: uErr } = await supabase.auth.getUser();
  if (uErr) throw uErr;
  const userId = u?.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const activeVportId = getActiveVportId(); // null => user mode
  const actorId = await resolveActorId({ userId, activeVportId });

  const payload = {
    post_id: postId,
    content: text,
    actor_id: actorId, // who is speaking (user or vport)
    user_id: userId,   // owner (profiles.id)
  };

  const { data, error } = await vc
    .from("post_comments")
    .insert(payload)
    .select("id, post_id, content, actor_id, user_id, created_at")
    .single();

  if (error) throw error;
  return data;
}

export default addComment;
