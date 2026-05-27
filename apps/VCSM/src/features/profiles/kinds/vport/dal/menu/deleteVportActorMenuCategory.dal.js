import vportSchema from "@/services/supabase/vportClient";

export async function deleteVportActorMenuCategoryDAL({
  categoryId,
  actorId,
} = {}) {
  if (!categoryId) {
    throw new Error("deleteVportActorMenuCategoryDAL: categoryId is required");
  }
  if (!actorId) {
    throw new Error("deleteVportActorMenuCategoryDAL: actorId is required");
  }

  const { error } = await vportSchema
    .from("menu_categories")
    .delete()
    .eq("id", categoryId)
    .eq("actor_id", actorId);

  if (error) throw error;
  return { id: categoryId };
}

export default deleteVportActorMenuCategoryDAL;
