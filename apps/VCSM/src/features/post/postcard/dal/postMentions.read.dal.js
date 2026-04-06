import { supabase } from "@/services/supabase/supabaseClient";

export async function readPostMentionedActorIdsDAL({ postId }) {
  if (!postId) return [];

  const { data, error } = await supabase
    .schema("vc")
    .from("post_mentions")
    .select("mentioned_actor_id")
    .eq("post_id", postId);

  if (error) throw error;

  return [
    ...new Set(
      (Array.isArray(data) ? data : [])
        .map((row) => row?.mentioned_actor_id)
        .filter(Boolean)
    ),
  ];
}

export async function readMentionActorPresentationDAL({ actorIds }) {
  const ids = Array.isArray(actorIds) ? actorIds.filter(Boolean) : [];
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .schema("vc")
    .from("actor_presentation")
    .select(
      "actor_id, kind, username, display_name, photo_url, vport_id, vport_slug, vport_name, vport_avatar_url"
    )
    .in("actor_id", ids);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}
