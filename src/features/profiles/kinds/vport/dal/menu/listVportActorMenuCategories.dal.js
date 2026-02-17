import { supabase } from "@/services/supabase/supabaseClient";

const CATEGORY_SELECT =
  "id,actor_id,key,name,description,sort_order,is_active,created_at,updated_at";

/**
 * DAL: list categories for a vport actor (raw db rows).
 * - Explicit projection (no *)
 * - Deterministic
 * - No business meaning
 */
export async function listVportActorMenuCategoriesDAL({
  actorId,
  includeInactive = false,
} = {}) {
  if (!actorId) throw new Error("listVportActorMenuCategoriesDAL: actorId is required");

  let query = supabase
    .schema("vc")
    .from("vport_actor_menu_categories")
    .select(CATEGORY_SELECT)
    .eq("actor_id", actorId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (!includeInactive) query = query.eq("is_active", true);

  const { data, error } = await query;

  if (error) throw error;
  return data ?? [];
}

export default listVportActorMenuCategoriesDAL;
