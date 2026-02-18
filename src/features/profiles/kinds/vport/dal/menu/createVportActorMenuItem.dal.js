// src/features/profiles/kinds/vport/dal/menu/createVportActorMenuItem.dal.js

import { supabase } from "@/services/supabase/supabaseClient";

const ITEM_SELECT =
  "id,actor_id,category_id,key,name,description,is_active,sort_order,created_at,updated_at,price_cents,currency_code,image_url";

/**
 * DAL: create a vport actor menu item (raw db row).
 * - Explicit projection (no *)
 * - Deterministic
 * - No business meaning
 */
export async function createVportActorMenuItemDAL({
  actorId,
  categoryId,
  key,
  name,
  description,
  sortOrder,
  isActive,

  // ✅ NEW
  priceCents,
  currencyCode,
  imageUrl,
} = {}) {
  if (!actorId)
    throw new Error("createVportActorMenuItemDAL: actorId is required");

  if (!categoryId)
    throw new Error("createVportActorMenuItemDAL: categoryId is required");

  if (!name)
    throw new Error("createVportActorMenuItemDAL: name is required");

  const insertPayload = {
    actor_id: actorId,
    category_id: categoryId,
    key: key ?? null,
    name,
    description: description ?? null,
    sort_order: typeof sortOrder === "number" ? sortOrder : 0,
    is_active: typeof isActive === "boolean" ? isActive : true,

    // ✅ NEW
    price_cents:
      priceCents == null ? null : Math.max(0, Math.round(Number(priceCents))),
    currency_code:
      typeof currencyCode === "string" && currencyCode.trim().length === 3
        ? currencyCode.trim().toUpperCase()
        : "USD",
    image_url: typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : null,
  };

  const { data, error } = await supabase
    .schema("vc")
    .from("vport_actor_menu_items")
    .insert(insertPayload)
    .select(ITEM_SELECT)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export default createVportActorMenuItemDAL;
