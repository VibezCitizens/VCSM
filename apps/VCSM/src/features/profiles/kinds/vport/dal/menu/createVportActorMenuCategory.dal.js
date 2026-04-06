import { supabase } from "@/services/supabase/supabaseClient";

const CATEGORY_SELECT =
  "id,actor_id,key,name,description,sort_order,is_active,created_at,updated_at";

/**
 * DAL: insert category row and return raw inserted row.
 */
export async function createVportActorMenuCategoryDAL({
  actorId,
  key = null,
  name,
  description = null,
  sortOrder = 0,
  isActive = true,
}) {
  const { data, error } = await supabase
    .schema("vc")
    .from("vport_actor_menu_categories")
    .insert([
      {
        actor_id: actorId,
        key,
        name,
        description,
        sort_order: sortOrder,
        is_active: isActive,
      },
    ])
    .select(CATEGORY_SELECT)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export default createVportActorMenuCategoryDAL;
