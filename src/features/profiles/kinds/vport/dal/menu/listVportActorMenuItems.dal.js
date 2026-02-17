import { supabase } from "@/services/supabase/supabaseClient";

const ITEM_SELECT =
  "id,actor_id,category_id,key,name,description,is_active,sort_order,created_at,updated_at";

/**
 * DAL: list menu items for a vport actor (raw db rows).
 * - Explicit projection (no *)
 * - Deterministic
 * - No business meaning
 */
export async function listVportActorMenuItemsDAL({
  actorId,
  categoryId,
  includeInactive = false,
} = {}) {
  if (!actorId)
    throw new Error("listVportActorMenuItemsDAL: actorId is required");

  let query = supabase
    .schema("vc")
    .from("vport_actor_menu_items")
    .select(ITEM_SELECT)
    .eq("actor_id", actorId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data ?? [];
}

export default listVportActorMenuItemsDAL;
