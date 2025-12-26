import { supabase } from "@/services/supabase/supabaseClient";

export async function fetchPostsForActorDAL({
  actorId,
  limit,
  offset,
}) {
  return supabase
    .schema("vc")
    .from("posts")
    .select(`
      id,
      actor_id,
      text,
      title,
      media_url,
      media_type,
      created_at
    `)
    .eq("actor_id", actorId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
}
