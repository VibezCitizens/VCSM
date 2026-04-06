import { supabase } from "@/services/supabase/supabaseClient";

/**
 * DAL: Resolve vport_type for a given actor_id.
 *
 * Uses vc.actors.vport_id -> vc.vports.vport_type.
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

  // Join via FK relationship actors.vport_id -> vports.id
  // Explicit projection only.
  const { data, error } = await supabase
    .schema("vc")
    .from("actors")
    .select("id,vport_id,vports!actors_vport_id_fkey(vport_type)")
    .eq("id", actorId)
    .maybeSingle();

  if (error) throw error;

  if (!data) return null;

  // Keep raw-ish DB naming in output (snake_case).
  return {
    actor_id: data.id,
    vport_id: data.vport_id ?? null,
    vport_type: data?.vports?.vport_type ?? null,
  };
}

export default readVportTypeByActorId;