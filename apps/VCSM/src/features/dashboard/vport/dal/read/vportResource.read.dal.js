import vportSchema from "@/services/supabase/vportClient";

export async function getVportResourceByIdDAL({ resourceId } = {}) {
  if (!resourceId) return null;

  const { data, error } = await vportSchema
    .from("resources")
    .select("id,profile_id,owner_actor_id,member_actor_id,resource_type,name,is_active,sort_order,meta")
    .eq("id", resourceId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function listVportResourcesByProfileIdDAL({ profileId, includeInactive = false } = {}) {
  if (!profileId) return [];

  let query = vportSchema
    .from("resources")
    .select("id,profile_id,owner_actor_id,member_actor_id,resource_type,name,is_active,sort_order,meta")
    .eq("profile_id", profileId)
    .order("sort_order", { ascending: true });

  if (!includeInactive) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function listVportResourcesByOwnerActorIdDAL({ ownerActorId, includeInactive = false } = {}) {
  if (!ownerActorId) return [];

  let query = vportSchema
    .from("resources")
    .select("id,profile_id,owner_actor_id,member_actor_id,resource_type,name,is_active,sort_order,meta")
    .eq("owner_actor_id", ownerActorId)
    .order("sort_order", { ascending: true });

  if (!includeInactive) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}
