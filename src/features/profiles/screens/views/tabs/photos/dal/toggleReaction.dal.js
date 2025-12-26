import { supabase } from "@/services/supabase/supabaseClient";

/**
 * ============================================================
 * DAL: toggleReaction
 * ------------------------------------------------------------
 * Toggles a reaction row for a post + actor.
 *
 * Question answered:
 *   "What happens in the database when this reaction is toggled?"
 *
 * ⚠️ Business meaning (like/dislike rules) is NOT here.
 * ⚠️ Ownership / permissions are enforced by RLS.
 * ============================================================
 */

/**
 * @param {Object} params
 * @param {string} params.postId
 * @param {string} params.actorId
 * @param {string} params.reaction   ('like' | 'dislike')
 */
export async function toggleReaction({ postId, actorId, reaction }) {
  if (!postId || !actorId || !reaction) {
    throw new Error("toggleReaction DAL: missing parameters");
  }

  /**
   * We rely on a single RPC to ensure:
   * - atomic toggle
   * - reaction exclusivity (like vs dislike)
   * - RLS enforcement
   *
   * The database owns the truth.
   */
  const { error } = await supabase
    .schema("vc")
    .rpc("toggle_post_reaction", {
      p_post_id: postId,
      p_actor_id: actorId,
      p_reaction: reaction,
    });

  if (error) {
    throw error;
  }
}
