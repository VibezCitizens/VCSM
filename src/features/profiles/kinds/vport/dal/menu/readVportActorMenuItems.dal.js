import { supabase } from "@/services/supabase/supabaseClient";

const ITEM_SELECT =
  "id,actor_id,category_id,key,name,description,is_active,sort_order,created_at,updated_at";

/**
 * DAL: read a single vport actor menu item by id (raw db row).
 * - Explicit projection (no *)
 * - Deterministic
 * - No business meaning
 */
export async function readVportActorMenuItemDAL({
  itemId,
} = {}) {
  if (!itemId)
    throw new Error("readVportActorMenuItemDAL: itemId is required");

  const { data, error } = await supabase
    .schema("vc")
    .from("vport_actor_menu_items")
    .select(ITEM_SELECT)
    .eq("id", itemId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export default readVportActorMenuItemDAL;
