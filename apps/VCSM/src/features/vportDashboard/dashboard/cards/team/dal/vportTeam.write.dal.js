import vportSchema from "@/services/supabase/vportClient";

const RESOURCE_COLS = "id, owner_actor_id, name, resource_type, is_active, member_actor_id, sort_order, meta";

export async function insertTeamMemberDAL({ profileId, ownerActorId, name }) {
  if (!profileId || !name) throw new Error("insertTeamMemberDAL: profileId and name required");

  const { data, error } = await vportSchema
    .from("resources")
    .insert({
      profile_id: profileId,
      owner_actor_id: ownerActorId ?? null,
      name: String(name).trim(),
      resource_type: "staff",
      is_active: true,
    })
    .select(RESOURCE_COLS)
    .single();

  if (error) throw error;
  return data;
}

export async function insertLinkedTeamMemberDAL({ profileId, ownerActorId, memberActorId, name, role }) {
  if (!profileId || !memberActorId) throw new Error("insertLinkedTeamMemberDAL: profileId and memberActorId required");

  const { data, error } = await vportSchema
    .from("resources")
    .insert({
      profile_id: profileId,
      owner_actor_id: ownerActorId ?? null,
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

export async function updateTeamMemberRoleDAL({ resourceId, profileId, meta, role }) {
  if (!resourceId || !profileId) throw new Error("updateTeamMemberRoleDAL: resourceId and profileId required");

  const { data, error } = await vportSchema
    .from("resources")
    .update({ meta: { ...(meta ?? {}), role } })
    .eq("id", resourceId)
    .eq("profile_id", profileId)
    .select(RESOURCE_COLS)
    .single();

  if (error) throw error;
  return data;
}

export async function setTeamMemberActiveDAL({ resourceId, profileId, isActive }) {
  if (!resourceId || !profileId) throw new Error("setTeamMemberActiveDAL: resourceId and profileId required");

  const { data, error } = await vportSchema
    .from("resources")
    .update({ is_active: isActive })
    .eq("id", resourceId)
    .eq("profile_id", profileId)
    .select(RESOURCE_COLS)
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTeamMemberByIdDAL({ resourceId, profileId }) {
  if (!resourceId || !profileId) throw new Error("deleteTeamMemberByIdDAL: resourceId and profileId required");
  const { error } = await vportSchema.from("resources").delete().eq("id", resourceId).eq("profile_id", profileId);
  if (error) throw error;
}
