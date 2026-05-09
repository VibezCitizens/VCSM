import vportSchema from "@/services/supabase/vportClient";

const RESOURCE_COLS = "id, name, resource_type, is_active, member_actor_id, sort_order, meta";

export async function insertTeamMemberDAL({ profileId, name }) {
  if (!profileId || !name) throw new Error("insertTeamMemberDAL: profileId and name required");

  const { data, error } = await vportSchema
    .from("resources")
    .insert({
      profile_id: profileId,
      name: String(name).trim(),
      resource_type: "staff",
      is_active: true,
    })
    .select(RESOURCE_COLS)
    .single();

  if (error) throw error;
  return data;
}

export async function insertLinkedTeamMemberDAL({ profileId, memberActorId, name, role }) {
  if (!profileId || !memberActorId) throw new Error("insertLinkedTeamMemberDAL: profileId and memberActorId required");

  const { data, error } = await vportSchema
    .from("resources")
    .insert({
      profile_id: profileId,
      member_actor_id: memberActorId,
      name: String(name || memberActorId).trim(),
      resource_type: "staff",
      is_active: true,
      meta: { status: "linked", role: role ?? "staff", linked_at: new Date().toISOString() },
    })
    .select(RESOURCE_COLS)
    .single();

  if (error) throw error;
  return data;
}

export async function updateTeamMemberRoleDAL({ resourceId, meta, role }) {
  if (!resourceId) throw new Error("updateTeamMemberRoleDAL: resourceId required");

  const { data, error } = await vportSchema
    .from("resources")
    .update({ meta: { ...(meta ?? {}), role } })
    .eq("id", resourceId)
    .select(RESOURCE_COLS)
    .single();

  if (error) throw error;
  return data;
}

export async function setTeamMemberActiveDAL({ resourceId, isActive }) {
  if (!resourceId) throw new Error("setTeamMemberActiveDAL: resourceId required");

  const { data, error } = await vportSchema
    .from("resources")
    .update({ is_active: isActive })
    .eq("id", resourceId)
    .select(RESOURCE_COLS)
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTeamMemberByIdDAL(resourceId) {
  if (!resourceId) throw new Error("deleteTeamMemberByIdDAL: resourceId required");
  const { error } = await vportSchema.from("resources").delete().eq("id", resourceId);
  if (error) throw error;
}
