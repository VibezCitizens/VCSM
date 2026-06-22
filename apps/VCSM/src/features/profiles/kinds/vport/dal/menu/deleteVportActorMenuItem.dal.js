import vportSchema from "@/services/supabase/vportClient";

export async function deleteVportActorMenuItemDAL({
  itemId,
} = {}) {
  if (!itemId) {
    throw new Error("deleteVportActorMenuItemDAL: itemId is required");
  }

  const { error } = await vportSchema
    .from("menu_items")
    .delete()
    .eq("id", itemId);

  if (error) throw error;
  return { id: itemId };
}

export default deleteVportActorMenuItemDAL;
