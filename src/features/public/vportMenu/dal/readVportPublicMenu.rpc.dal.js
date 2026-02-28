import { supabase } from "@/services/supabase/supabaseClient";

/**
 * DAL: raw RPC adapter for public vport menu payload.
 * Returns raw JSONB envelope from DB.
 */
export async function readVportPublicMenuRpcDAL({ actorId } = {}) {
  if (!actorId) {
    throw new Error("readVportPublicMenuRpcDAL: actorId is required");
  }

  const { data, error } = await supabase
    .schema("vc")
    .rpc("get_vport_public_menu", { p_actor_id: actorId });

  if (error) throw error;
  return data ?? null;
}

export default readVportPublicMenuRpcDAL;