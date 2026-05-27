import vportSchema from "@/services/supabase/vportClient";
import { resolveVportProfileId } from "@/features/profiles/kinds/vport/dal/services/resolveVportProfileId.dal";

const ITEM_SELECT =
  "id,profile_id,category_id,key,name,description,is_active,sort_order,created_at,updated_at,price_cents,currency_code,image_url";

export async function listVportActorMenuItemsDAL({
  actorId,
  categoryId,
  includeInactive = false,
} = {}) {
  if (!actorId) throw new Error("listVportActorMenuItemsDAL: actorId is required");

  const profileId = await resolveVportProfileId(actorId);
  if (!profileId) return [];

  let query = vportSchema
    .from("menu_items")
    .select(ITEM_SELECT)
    .eq("profile_id", profileId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (categoryId) query = query.eq("category_id", categoryId);
  if (!includeInactive) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export default listVportActorMenuItemsDAL;
