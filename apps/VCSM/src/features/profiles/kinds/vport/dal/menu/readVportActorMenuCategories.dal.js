import vportSchema from "@/services/supabase/vportClient";

const CATEGORY_SELECT =
  "id,profile_id,key,name,description,sort_order,is_active,created_at,updated_at";

export async function readVportActorMenuCategoryDAL({ categoryId } = {}) {
  if (!categoryId)
    throw new Error("readVportActorMenuCategoryDAL: categoryId is required");

  const { data, error } = await vportSchema
    .from("menu_categories")
    .select(CATEGORY_SELECT)
    .eq("id", categoryId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export const readVportActorMenuCategoriesDAL = readVportActorMenuCategoryDAL;

export default readVportActorMenuCategoriesDAL;
