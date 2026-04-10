import { supabase } from "@/services/supabase/supabaseClient";
import { createTTLCache } from "@/shared/lib/ttlCache";

// Actor kind never changes — cache for 10 minutes
const kindCache = createTTLCache(600_000);

export async function readActorKindDAL(actorId) {
  if (!actorId) return null;

  const cached = kindCache.get(actorId);
  if (cached) return cached;

  const { data, error } = await supabase
    .schema("vc")
    .from("actors")
    .select("kind")
    .eq("id", actorId)
    .maybeSingle();

  if (error) throw error;
  if (data) kindCache.set(actorId, data);
  return data;
}
