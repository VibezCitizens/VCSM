import { supabase } from "@/services/supabase/supabaseClient";

const PUBLIC_MENU_SELECT = [
  "actor_id",
  "menu_category_id",
  "menu_category_key",
  "menu_category_name",
  "menu_category_description",
  "menu_category_sort_order",
  "menu_item_id",
  "menu_item_category_id",
  "menu_item_key",
  "menu_item_name",
  "menu_item_description",
  "price_cents",
  "currency_code",
  "image_url",
  "menu_item_sort_order",
].join(",");

/**
 * DAL: fetch vport public menu from vport.public_menu_read_model_v.
 * Single query: categories and items joined by the view.
 * Returns rows envelope consumed by mapVportPublicMenuRpcResult.
 */
export async function readVportPublicMenuRpcDAL({ actorId } = {}) {
  if (!actorId) {
    throw new Error("readVportPublicMenuRpcDAL: actorId is required");
  }

  const { data, error } = await supabase
    .schema("vport")
    .from("public_menu_read_model_v")
    .select(PUBLIC_MENU_SELECT)
    .eq("actor_id", actorId);

  if (error) throw error;

  if (!data?.length) {
    return { ok: false, actor_id: actorId, error: "not_found", rows: [] };
  }

  return { ok: true, actor_id: actorId, error: null, rows: data };
}

export default readVportPublicMenuRpcDAL;
