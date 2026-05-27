import vportSchema from "@/services/supabase/vportClient";

export async function deleteVportActorMenuItemDAL({
  itemId,
  actorId,
} = {}) {
  if (!itemId) {
    throw new Error("deleteVportActorMenuItemDAL: itemId is required");
  }
  if (!actorId) {
    throw new Error("deleteVportActorMenuItemDAL: actorId is required");
  }

  const { error } = await vportSchema
    .from("menu_items")
    .delete()
    .eq("id", itemId)
    .eq("actor_id", actorId);

  if (error) throw error;
  return { id: itemId };
}

export default deleteVportActorMenuItemDAL;
