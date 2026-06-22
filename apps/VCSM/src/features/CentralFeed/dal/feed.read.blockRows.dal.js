import { supabase } from "@/services/supabase/supabaseClient";
import { isUuid } from "@/services/supabase/postgrestSafe";
import { createTTLCache } from "@/shared/lib/ttlCache";

// 60s TTL — block state rarely changes within a session.
const blockCache = createTTLCache(60_000);

export function invalidateFeedBlockCache(viewerActorId) {
  if (viewerActorId) blockCache.invalidate(viewerActorId);
  else blockCache.invalidateAll();
}

export async function readFeedBlockRowsDAL({ viewerActorId, actorIds = [] }) {
  if (!viewerActorId || !isUuid(viewerActorId)) return [];

  const uniqueActorIds = Array.from(
    new Set((Array.isArray(actorIds) ? actorIds : []).filter((id) => isUuid(id)))
  );

  if (!uniqueActorIds.length) return [];

  // Check cache for this viewer's blocks
  const cached = blockCache.get(viewerActorId);
  if (cached) {
    const idSet = new Set(uniqueActorIds);
    idSet.add(viewerActorId);
    return cached.filter(
      (r) => idSet.has(r.blocker_actor_id) || idSet.has(r.blocked_actor_id)
    );
  }

  const orClause =
    `and(blocker_actor_id.eq.${viewerActorId},blocked_actor_id.in.(${uniqueActorIds.join(",")}))` +
    `,and(blocked_actor_id.eq.${viewerActorId},blocker_actor_id.in.(${uniqueActorIds.join(",")}))`;

  const { data, error } = await supabase
    .schema("moderation")
    .from("blocks")
    .select("blocker_actor_id,blocked_actor_id")
    .eq("status", "active")
    .or(orClause);

  if (error) throw error;

  const rows = data ?? [];
  blockCache.set(viewerActorId, rows);
  return rows;
}
