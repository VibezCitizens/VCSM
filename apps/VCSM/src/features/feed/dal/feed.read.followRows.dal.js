import { supabase } from "@/services/supabase/supabaseClient";
import { isUuid } from "@/services/supabase/postgrestSafe";
import { createTTLCache } from "@/shared/lib/ttlCache";

// 60s TTL — follow state rarely changes within a session.
const followCache = createTTLCache(60_000);

export function invalidateFeedFollowCache(viewerActorId) {
  if (viewerActorId) followCache.invalidate(viewerActorId);
  else followCache.invalidateAll();
}

export async function readFeedFollowRowsDAL({ viewerActorId, actorIds = [] }) {
  if (!viewerActorId || !isUuid(viewerActorId)) return [];

  const uniqueActorIds = Array.from(
    new Set((Array.isArray(actorIds) ? actorIds : []).filter((id) => isUuid(id)))
  );

  if (!uniqueActorIds.length) return [];

  // Check cache for this viewer's follows
  const cached = followCache.get(viewerActorId);
  if (cached) {
    const idSet = new Set(uniqueActorIds);
    return cached.filter((r) => idSet.has(r.followed_actor_id));
  }

  const { data, error } = await supabase
    .schema("vc")
    .from("actor_follows")
    .select("follower_actor_id,followed_actor_id,is_active")
    .eq("follower_actor_id", viewerActorId)
    .eq("is_active", true)
    .in("followed_actor_id", uniqueActorIds);

  if (error) throw error;

  const rows = data ?? [];
  followCache.set(viewerActorId, rows);
  return rows;
}
