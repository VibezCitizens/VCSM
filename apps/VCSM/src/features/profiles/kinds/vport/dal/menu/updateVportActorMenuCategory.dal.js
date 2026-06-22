import vportSchema from "@/services/supabase/vportClient";

const CATEGORY_SELECT =
  "id,profile_id,key,name,description,sort_order,is_active,created_at,updated_at";

export async function updateVportActorMenuCategoryDAL({
  categoryId,
  profileId,
  patch,
} = {}) {
  if (!categoryId)
    throw new Error("updateVportActorMenuCategoryDAL: categoryId is required");
  if (!profileId)
    throw new Error("updateVportActorMenuCategoryDAL: profileId is required");
  if (!patch || typeof patch !== "object")
    throw new Error("updateVportActorMenuCategoryDAL: patch is required");

  const { data, error } = await vportSchema
    .from("menu_categories")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", categoryId)
    .eq("profile_id", profileId)
    .select(CATEGORY_SELECT)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export default updateVportActorMenuCategoryDAL;
