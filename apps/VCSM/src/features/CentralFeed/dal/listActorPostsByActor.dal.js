import { supabase } from "@/services/supabase/supabaseClient";

export async function listActorPostsByActorDAL({ actorId, limit = 60 }) {
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
      post_type,
      tags,
      created_at,
      realm_id
    `)
    .eq("actor_id", actorId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}
