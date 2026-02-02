// src/lib/actors/api/addComment.js
import { supabase } from '@/services/supabase/supabaseClient'; //transfer;
import vc from '@/services/supabase/vcClient'//transfer
import { getActiveVportId } from "@/lib/actors/actor";
import { resolveActorId } from  '@/services/actors/dl/actors';
;

/**
 * Insert a Spark as the current identity (Citizen or Vport).
 * @param {string} vibeId
 * @param {string} content
 * @returns {Promise<object>} inserted row
 */
export async function addComment(vibeId, content) {
  if (!vibeId) throw new Error("addComment: vibeId required");
  const text = String(content ?? "").trim();
  if (!text) throw new Error("addComment: content required");

  const { data: u, error: uErr } = await supabase.auth.getUser();
  if (uErr) throw uErr;
  const userId = u?.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const activeVportId = getActiveVportId(); // null => Citizen mode
  const actorId = await resolveActorId({ userId, activeVportId });

  const payload = {
    post_id: vibeId,
    content: text,
    actor_id: actorId, // who is speaking (Citizen or Vport)
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
