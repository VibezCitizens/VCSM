import { supabase } from "@/services/supabase/supabaseClient";

/**
 * DAL: delete a vport actor menu item (raw delete result).
 * - Explicit schema
 * - No select(*)
 * - No business meaning
 */
export async function deleteVportActorMenuItemDAL({
  itemId,
} = {}) {
  if (!itemId) {
    throw new Error(
      "deleteVportActorMenuItemDAL: itemId is required"
    );
  }

  const { error } = await supabase
    .schema("vc")
    .from("vport_actor_menu_items")
    .delete()
    .eq("id", itemId);

  if (error) throw error;

  // minimal deterministic return
  return { id: itemId };
}

export default deleteVportActorMenuItemDAL;
