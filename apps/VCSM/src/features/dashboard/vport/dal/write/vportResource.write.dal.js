import vportSchema from "@/services/supabase/vportClient";

const SELECT_COLS = "id,profile_id,owner_actor_id,member_actor_id,resource_type,name,is_active,sort_order,meta,created_at,updated_at";

export async function insertVportResourceDAL({ row } = {}) {
  if (!row?.profile_id) throw new Error("insertVportResourceDAL: profile_id is required");

  const { data, error } = await vportSchema
    .from("resources")
    .insert(row)
    .select(SELECT_COLS)
    .single();

  if (error) throw error;
  return data;
}
