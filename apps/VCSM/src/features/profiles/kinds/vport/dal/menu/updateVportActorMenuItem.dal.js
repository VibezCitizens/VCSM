// src/features/profiles/kinds/vport/dal/menu/updateVportActorMenuItem.dal.js

import { supabase } from "@/services/supabase/supabaseClient";

const ITEM_SELECT =
  "id,actor_id,category_id,key,name,description,is_active,sort_order,created_at,updated_at,price_cents,currency_code,image_url";

/**
 * DAL: update a vport actor menu item (raw db row).
 * - Explicit projection (no *)
 * - Deterministic
 * - No business meaning
 */
export async function updateVportActorMenuItemDAL({ itemId, patch } = {}) {
  if (!itemId)
    throw new Error("updateVportActorMenuItemDAL: itemId is required");

  if (!patch || typeof patch !== "object")
    throw new Error("updateVportActorMenuItemDAL: patch is required");

  const { data, error } = await supabase
    .schema("vc")
    .from("vport_actor_menu_items")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .select(ITEM_SELECT)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export default updateVportActorMenuItemDAL;
