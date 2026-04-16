import { supabase } from "@/services/supabase/supabaseClient";
import { hydrateAndReturnSummaries } from "@hydration";

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

  const { rows, error } = await hydrateAndReturnSummaries({ actorIds: ids });
  if (error) throw error;
  return rows ?? [];
}
