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

  // Fetch the full follow graph for this viewer — not scoped to the current page's actorIds.
  // Caching a page-scoped subset caused cache misses on every scroll page.
  const { data, error } = await supabase
    .schema("vc")
    .from("actor_follows")
    .select("follower_actor_id,followed_actor_id,is_active")
    .eq("follower_actor_id", viewerActorId)
    .eq("is_active", true);

  if (error) throw error;

  const allRows = data ?? [];
  followCache.set(viewerActorId, allRows);

  const idSet = new Set(uniqueActorIds);
  return allRows.filter((r) => idSet.has(r.followed_actor_id));
}
