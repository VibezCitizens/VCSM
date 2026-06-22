import vportSchema from "@/services/supabase/vportClient";

export async function deleteVportActorMenuCategoryDAL({
  categoryId,
} = {}) {
  if (!categoryId) {
    throw new Error("deleteVportActorMenuCategoryDAL: categoryId is required");
  }

  const { error } = await vportSchema
    .from("menu_categories")
    .delete()
    .eq("id", categoryId);

  if (error) throw error;
  return { id: categoryId };
}

export default deleteVportActorMenuCategoryDAL;
