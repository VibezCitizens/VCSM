import { supabase } from "@/services/supabase/supabaseClient";

/**
 * DAL: delete a vport actor menu category (raw delete result).
 * - Explicit schema
 * - No select(*)
 * - No business meaning
 */
export async function deleteVportActorMenuCategoryDAL({
  categoryId,
} = {}) {
  if (!categoryId) {
    throw new Error(
      "deleteVportActorMenuCategoryDAL: categoryId is required"
    );
  }

  const { error } = await supabase
    .schema("vc")
    .from("vport_actor_menu_categories")
    .delete()
    .eq("id", categoryId);

  if (error) throw error;

  // return minimal deterministic result
  return { id: categoryId };
}

export default deleteVportActorMenuCategoryDAL;
