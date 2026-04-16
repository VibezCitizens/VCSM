import { supabase } from "@/services/supabase/supabaseClient";
import vportSchema from "@/services/supabase/vportClient";
import { createTTLCache } from "@/shared/lib/ttlCache";

// Vport type rarely changes — cache 10 minutes
const vportTypeCache = createTTLCache(600_000);

export async function readVportTypeDAL(actorId) {
  if (!actorId) return null;

  const cached = vportTypeCache.get(actorId);
  if (cached) return cached;

  const { data: actor, error } = await supabase
    .schema("vc")
    .from("actors")
    .select("kind,vport_id")
    .eq("id", actorId)
    .maybeSingle();

  if (error) {
    console.error("[readVportTypeDAL] failed", error);
    throw error;
  }

  if (!actor) return null;

  let vportType = null;

  if (actor.kind === "vport" && actor.vport_id) {
    const { data: cat } = await vportSchema
      .from("profile_categories")
      .select("category_key")
      .eq("profile_id", actor.vport_id)
      .eq("is_primary", true)
      .maybeSingle();
    vportType = cat?.category_key ?? null;
  }

  const result = { kind: actor.kind, vport_type: vportType };
  vportTypeCache.set(actorId, result);
  return result;
}
