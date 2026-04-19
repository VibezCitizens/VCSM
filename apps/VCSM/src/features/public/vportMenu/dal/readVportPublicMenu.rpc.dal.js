import { supabase } from "@/services/supabase/supabaseClient";

/**
 * DAL: fetch vport public menu from vport.public_menu_read_model_v.
 * Single query — profile, categories, and items joined by the view.
 * Returns rows envelope consumed by mapVportPublicMenuRpcResult.
 */
export async function readVportPublicMenuRpcDAL({ actorId } = {}) {
  if (!actorId) {
    throw new Error("readVportPublicMenuRpcDAL: actorId is required");
  }

  const { data, error } = await supabase
    .schema("vport")
    .from("public_menu_read_model_v")
    .select("*")
    .eq("actor_id", actorId);

  if (error) throw error;

  if (!data?.length) {
    return { ok: false, actor_id: actorId, error: "not_found", rows: [] };
  }

  return { ok: true, actor_id: actorId, error: null, rows: data };
}

export default readVportPublicMenuRpcDAL;
