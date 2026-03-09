import { supabase } from "@/services/supabase/supabaseClient";

/**
 * DAL: public menu adapter backed by vc_public views.
 * Returns an envelope compatible with existing controller/model boundaries.
 */
export async function readVportPublicMenuRpcDAL({ actorId } = {}) {
  if (!actorId) {
    throw new Error("readVportPublicMenuRpcDAL: actorId is required");
  }

  const { data, error } = await supabase
    .schema("vc_public")
    .from("vport_menu_public")
    .select(
      [
        "actor_id",
        "category_id",
        "category_key",
        "category_name",
        "category_description",
        "category_sort_order",
        "item_id",
        "item_key",
        "item_name",
        "item_description",
        "price_cents",
        "currency_code",
        "image_url",
        "primary_media_url",
        "item_sort_order",
      ].join(",")
    )
    .eq("actor_id", actorId);

  if (error) throw error;

  const rows = Array.isArray(data) ? data : [];
  if (!rows.length) {
    return {
      ok: false,
      actor_id: actorId,
      error: "not_found",
      rows: [],
    };
  }

  return {
    ok: true,
    actor_id: actorId,
    error: null,
    rows,
  };
}

export default readVportPublicMenuRpcDAL;
