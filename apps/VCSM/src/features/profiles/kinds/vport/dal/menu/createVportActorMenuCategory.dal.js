import vportSchema from "@/services/supabase/vportClient";
import { resolveVportProfileId } from "@/features/profiles/kinds/vport/dal/services/resolveVportProfileId.dal";

const CATEGORY_SELECT =
  "id,profile_id,key,name,description,sort_order,is_active,created_at,updated_at";

export async function createVportActorMenuCategoryDAL({
  actorId,
  key = null,
  name,
  description = null,
  sortOrder = 0,
  isActive = true,
}) {
  if (!actorId) throw new Error("createVportActorMenuCategoryDAL: actorId is required");

  const profileId = await resolveVportProfileId(actorId);
  if (!profileId) return null;

  const { data, error } = await vportSchema
    .from("menu_categories")
    .insert([
      {
        profile_id: profileId,
        key,
        name,
        description,
        sort_order: sortOrder,
        is_active: isActive,
      },
    ])
    .select(CATEGORY_SELECT)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export default createVportActorMenuCategoryDAL;
