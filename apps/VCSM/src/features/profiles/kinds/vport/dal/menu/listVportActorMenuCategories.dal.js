import vportSchema from "@/services/supabase/vportClient";
import { resolveVportProfileId } from "@/shared/lib/vport/resolveVportProfileId";

const CATEGORY_SELECT =
  "id,profile_id,key,name,description,sort_order,is_active,created_at,updated_at";

export async function listVportActorMenuCategoriesDAL({
  actorId,
  includeInactive = false,
} = {}) {
  if (!actorId) throw new Error("listVportActorMenuCategoriesDAL: actorId is required");

  const profileId = await resolveVportProfileId(actorId);
  if (!profileId) return [];

  let query = vportSchema
    .from("menu_categories")
    .select(CATEGORY_SELECT)
    .eq("profile_id", profileId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (!includeInactive) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export default listVportActorMenuCategoriesDAL;
