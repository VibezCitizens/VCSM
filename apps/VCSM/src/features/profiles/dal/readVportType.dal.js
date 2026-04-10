import { supabase } from "@/services/supabase/supabaseClient";
import { createTTLCache } from "@/shared/lib/ttlCache";

// Vport type never changes — cache 10 minutes
const vportTypeCache = createTTLCache(600_000);

export async function readVportTypeDAL(actorId) {
  if (!actorId) return null;

  const cached = vportTypeCache.get(actorId);
  if (cached) return cached;

  const { data, error } = await supabase
    .schema("vc")
    .from("actors")
    .select("kind,vport:vports(vport_type)")
    .eq("id", actorId)
    .maybeSingle();

  if (error) {
    console.error("[readVportTypeDAL] failed", error);
    throw error;
  }

  const result = data ?? null;
  if (result) vportTypeCache.set(actorId, result);
  return result;
}
