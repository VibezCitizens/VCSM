import { supabase } from "@/services/supabase/supabaseClient";

const CATEGORY_SELECT =
  "id,actor_id,key,name,description,sort_order,is_active,created_at,updated_at";

/**
 * DAL: update a vport actor menu category (raw db row).
 * - Explicit projection (no *)
 * - Deterministic
 * - No business meaning
 */
export async function updateVportActorMenuCategoryDAL({
  categoryId,
  patch,
} = {}) {
  if (!categoryId)
    throw new Error("updateVportActorMenuCategoryDAL: categoryId is required");

  if (!patch || typeof patch !== "object")
    throw new Error("updateVportActorMenuCategoryDAL: patch is required");

  const { data, error } = await supabase
    .schema("vc")
    .from("vport_actor_menu_categories")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", categoryId)
    .select(CATEGORY_SELECT)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export default updateVportActorMenuCategoryDAL;
