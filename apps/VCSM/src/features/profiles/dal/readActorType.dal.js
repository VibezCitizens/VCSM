import { supabase } from "@/services/supabase/supabaseClient";
import vportSchema from "@/services/supabase/vportClient";
import { createTTLCache } from "@/shared/lib/ttlCache";

// Shared 10-min cache for vc.actors kind + vport category.
// Both readActorKindDAL and readVportTypeDAL delegate here so a single cold-cache
// visit to vc.actors serves both callers instead of two separate DB round trips.
const actorTypeCache = createTTLCache(600_000);

/**
 * Fetches actor kind and vport category from a single shared cache.
 * Returns { kind, vport_type } — vport_type is null for non-vport actors.
 *
 * For vport actors this makes two DB calls (vc.actors + vport.profile_categories).
 * For user actors this makes one (vc.actors only).
 * Both shapes are cached together under the same key.
 */
export async function readActorTypeDAL(actorId) {
  if (!actorId) return null;

  const cached = actorTypeCache.get(actorId);
  if (cached) return cached;

  const { data: actor, error } = await supabase
    .schema("vc")
    .from("actors")
    .select("kind, vport_id")
    .eq("id", actorId)
    .maybeSingle();

  if (error) throw error;
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
  actorTypeCache.set(actorId, result);
  return result;
}

export function invalidateActorTypeCache(actorId) {
  if (actorId) actorTypeCache.invalidate(actorId);
  else actorTypeCache.invalidateAll();
}
