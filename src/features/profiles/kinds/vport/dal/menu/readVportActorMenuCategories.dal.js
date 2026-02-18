import { supabase } from "@/services/supabase/supabaseClient";

const CATEGORY_SELECT =
  "id,actor_id,key,name,description,sort_order,is_active,created_at,updated_at";

export async function readVportActorMenuCategoryDAL({ categoryId } = {}) {
  if (!categoryId)
    throw new Error("readVportActorMenuCategoryDAL: categoryId is required");

  const { data, error } = await supabase
    .schema("vc")
    .from("vport_actor_menu_categories")
    .select(CATEGORY_SELECT)
    .eq("id", categoryId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

// ✅ alias with the name your controllers use
export const readVportActorMenuCategoriesDAL = readVportActorMenuCategoryDAL;

export default readVportActorMenuCategoriesDAL;
