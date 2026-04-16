// src/features/profiles/kinds/vport/dal/menu/readVportActorMenuItems.dal.js

import vportSchema from "@/services/supabase/vportClient";

const ITEM_SELECT =
  "id,profile_id,category_id,key,name,description,is_active,sort_order,created_at,updated_at,price_cents,currency_code,image_url";

export async function readVportActorMenuItemDAL({ itemId } = {}) {
  if (!itemId) throw new Error("readVportActorMenuItemDAL: itemId is required");

  const { data, error } = await vportSchema
    .from("menu_items")
    .select(ITEM_SELECT)
    .eq("id", itemId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export default readVportActorMenuItemDAL;
