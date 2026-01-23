import { supabase } from "@/services/supabase/supabaseClient";

export async function readActorPostsDAL(actorId) {
  const { data, error } = await supabase
    .schema("vc")
    .from("posts")
    .select(`
      id,
      actor_id,
      text,
      title,
      media_url,
      media_type,
      created_at,
      edited_at,
      deleted_at,
      deleted_by_actor_id
    `)
    .eq("actor_id", actorId)
    // ✅ exclude soft-deleted posts (same as CentralFeed)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}
