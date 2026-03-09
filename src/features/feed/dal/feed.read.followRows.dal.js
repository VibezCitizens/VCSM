import { supabase } from "@/services/supabase/supabaseClient";
import { isUuid } from "@/services/supabase/postgrestSafe";

export async function readFeedFollowRowsDAL({ viewerActorId, actorIds = [] }) {
  if (!viewerActorId || !isUuid(viewerActorId)) return [];

  const uniqueActorIds = Array.from(
    new Set((Array.isArray(actorIds) ? actorIds : []).filter((id) => isUuid(id)))
  );

  if (!uniqueActorIds.length) return [];

  const { data, error } = await supabase
    .schema("vc")
    .from("actor_follows")
    .select("follower_actor_id,followed_actor_id,is_active")
    .eq("follower_actor_id", viewerActorId)
    .eq("is_active", true)
    .in("followed_actor_id", uniqueActorIds);

  if (error) throw error;
  return data ?? [];
}

