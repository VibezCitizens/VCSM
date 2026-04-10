import { supabase } from "@/services/supabase/supabaseClient";
import { createTTLCache } from "@/shared/lib/ttlCache";

const subCountCache = createTTLCache(60_000); // 60 seconds

export async function dalCountSubscribers(actorId) {
  if (!actorId) throw new Error("dalCountSubscribers: actorId required");

  const cached = subCountCache.get(actorId);
  if (cached != null) return cached;

  const { data, error } = await supabase
    .schema("vc")
    .rpc("count_subscribers", { p_actor_id: actorId });

  if (error) throw error;
  const count = data ?? 0;
  subCountCache.set(actorId, count);
  return count;
}

export function invalidateSubscriberCount(actorId) {
  subCountCache.invalidate(actorId);
}
