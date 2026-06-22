// src/features/profiles/kinds/vport/dal/menu/updateVportActorMenuItem.dal.js

import vportSchema from "@/services/supabase/vportClient";

const ITEM_SELECT =
  "id,profile_id,category_id,key,name,description,is_active,sort_order,created_at,updated_at,price_cents,currency_code,image_url";

export async function updateVportActorMenuItemDAL({ itemId, profileId, patch } = {}) {
  if (!itemId) throw new Error("updateVportActorMenuItemDAL: itemId is required");
  if (!profileId) throw new Error("updateVportActorMenuItemDAL: profileId is required");
  if (!patch || typeof patch !== "object")
    throw new Error("updateVportActorMenuItemDAL: patch is required");

  const { data, error } = await vportSchema
    .from("menu_items")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .eq("profile_id", profileId)
    .select(ITEM_SELECT)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export default updateVportActorMenuItemDAL;
