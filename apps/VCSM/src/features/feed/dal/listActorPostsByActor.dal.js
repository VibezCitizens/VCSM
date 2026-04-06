import { supabase } from "@/services/supabase/supabaseClient";

export async function listActorPostsByActorDAL({ actorId }) {
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
      realm_id,

      actor:actor_presentation (
        actor_id,
        kind,
        display_name,
        username,
        photo_url,
        vport_name,
        vport_slug,
        vport_avatar_url,
        vport_banner_url
      )
    `)
    .eq("actor_id", actorId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
