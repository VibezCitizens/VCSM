import { supabase } from "@/services/supabase/supabaseClient";
import vportSchema from "@/services/supabase/vportClient";

/**
 * DAL: Resolve vport_type (primary category_key) for a given actor_id.
 *
 * actor.vport_id now points to vport.profiles.id (FK dropped, repurposed).
 * Primary category is resolved from vport.profile_categories.
 * Returns a single row shape:
 *   { actor_id, vport_id, vport_type }
 *
 * @param {object} params
 * @param {string} params.actorId
 * @returns {Promise<{actor_id: string, vport_id: string|null, vport_type: string|null} | null>}
 */
export async function readVportTypeByActorId({ actorId } = {}) {
  if (!actorId) {
    throw new Error("readVportTypeByActorId: actorId is required");
  }

  const { data: actor, error } = await supabase
    .schema("vc")
    .from("actors")
    .select("id,vport_id")
    .eq("id", actorId)
    .maybeSingle();

  if (error) throw error;
  if (!actor) return null;

  let vportType = null;

  if (actor.vport_id) {
    const { data: cat } = await vportSchema
      .from("profile_categories")
      .select("category_key")
      .eq("profile_id", actor.vport_id)
      .eq("is_primary", true)
      .maybeSingle();
    vportType = cat?.category_key ?? null;
  }

  return {
    actor_id: actor.id,
    vport_id: actor.vport_id ?? null,
    vport_type: vportType,
  };
}

export default readVportTypeByActorId;