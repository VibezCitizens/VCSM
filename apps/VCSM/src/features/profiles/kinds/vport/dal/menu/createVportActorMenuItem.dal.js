// src/features/profiles/kinds/vport/dal/menu/createVportActorMenuItem.dal.js

import vportSchema from "@/services/supabase/vportClient";

const ITEM_SELECT =
  "id,profile_id,category_id,key,name,description,is_active,sort_order,created_at,updated_at,price_cents,currency_code,image_url";

async function resolveProfileId(actorId) {
  const { data } = await vportSchema
    .from("profiles")
    .select("id")
    .eq("actor_id", actorId)
    .maybeSingle();
  return data?.id ?? null;
}

export async function createVportActorMenuItemDAL({
  actorId,
  categoryId,
  key,
  name,
  description,
  sortOrder,
  isActive,
  priceCents,
  currencyCode,
  imageUrl,
} = {}) {
  if (!actorId) throw new Error("createVportActorMenuItemDAL: actorId is required");
  if (!categoryId) throw new Error("createVportActorMenuItemDAL: categoryId is required");
  if (!name) throw new Error("createVportActorMenuItemDAL: name is required");

  const profileId = await resolveProfileId(actorId);
  if (!profileId) return null;

  const { data, error } = await vportSchema
    .from("menu_items")
    .insert({
      profile_id: profileId,
      category_id: categoryId,
      key: key ?? null,
      name,
      description: description ?? null,
      sort_order: typeof sortOrder === "number" ? sortOrder : 0,
      is_active: typeof isActive === "boolean" ? isActive : true,
      price_cents:
        priceCents == null ? null : Math.max(0, Math.round(Number(priceCents))),
      currency_code:
        typeof currencyCode === "string" && currencyCode.trim().length === 3
          ? currencyCode.trim().toUpperCase()
          : "USD",
      image_url: typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : null,
    })
    .select(ITEM_SELECT)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export default createVportActorMenuItemDAL;
