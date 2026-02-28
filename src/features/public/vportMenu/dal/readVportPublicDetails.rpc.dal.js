import { supabase } from "@/services/supabase/supabaseClient";

/**
 * DAL: raw RPC adapter for public vport details payload.
 * Returns raw JSONB envelope from DB.
 */
export async function readVportPublicDetailsRpcDAL({ actorId } = {}) {
  if (!actorId) {
    throw new Error("readVportPublicDetailsRpcDAL: actorId is required");
  }

  const { data, error } = await supabase
    .schema("vc")
    .rpc("get_vport_public_details", { p_actor_id: actorId });

  if (error) throw error;
  return data ?? null;
}

export default readVportPublicDetailsRpcDAL;