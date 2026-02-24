// src/features/upload/dal/searchMentionSuggestions.js
import { supabase } from "@/services/supabase/supabaseClient";
import { toPrefixPattern } from "@/services/supabase/postgrestSafe";

/**
 * Search mention suggestions by prefix.
 * Returns a unified list for users + vports.
 *
 * Output:
 * [
 *   {
 *     actor_id,
 *     kind,           // 'user' | 'vport'
 *     handle,         // username or vport_slug
 *     display_name,   // display_name or vport_name
 *     photo_url       // photo_url or vport_avatar_url
 *   }
 * ]
 */
export async function searchMentionSuggestions(prefix, { limit = 8 } = {}) {
  const pattern = toPrefixPattern(prefix);
  if (!pattern) return [];

  // This assumes vc.actor_presentation exists (you already use it elsewhere)
  const { data, error } = await supabase
    .schema("vc")
    .from("actor_presentation")
    .select(
      `
      actor_id,
      kind,
      display_name,
      username,
      photo_url,
      vport_name,
      vport_slug,
      vport_avatar_url
    `
    )
    .or(`username.ilike.${pattern},vport_slug.ilike.${pattern}`)
    .limit(limit);

  if (error) throw error;

  return (data || [])
    .map((r) => {
      const isVport = r.kind === "vport";
      const handle = (isVport ? r.vport_slug : r.username) || "";
      if (!handle) return null;

      return {
        actor_id: r.actor_id,
        kind: r.kind,
        handle,
        display_name: isVport ? r.vport_name ?? null : r.display_name ?? null,
        photo_url: isVport ? r.vport_avatar_url ?? null : r.photo_url ?? null,
      };
    })
    .filter(Boolean);
}
