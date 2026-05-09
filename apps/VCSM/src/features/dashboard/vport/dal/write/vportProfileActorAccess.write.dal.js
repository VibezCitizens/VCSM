import vportSchema from "@/services/supabase/vportClient";

const COLS = "actor_id, role, status, is_primary";

export async function upsertProfileActorAccessDAL({ profileId, actorId, role, status = "active", isPrimary = false }) {
  if (!profileId || !actorId || !role) {
    throw new Error("upsertProfileActorAccessDAL: profileId, actorId, role required");
  }

  const { data, error } = await vportSchema
    .from("profile_actor_access")
    .upsert(
      { profile_id: profileId, actor_id: actorId, role, status, is_primary: isPrimary },
      { onConflict: "profile_id,actor_id" }
    )
    .select(COLS)
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfileActorAccessRoleDAL({ profileId, actorId, role }) {
  if (!profileId || !actorId || !role) {
    throw new Error("updateProfileActorAccessRoleDAL: profileId, actorId, role required");
  }

  const { data, error } = await vportSchema
    .from("profile_actor_access")
    .update({ role })
    .eq("profile_id", profileId)
    .eq("actor_id", actorId)
    .select(COLS)
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfileActorAccessStatusDAL({ profileId, actorId, status }) {
  if (!profileId || !actorId || !status) {
    throw new Error("updateProfileActorAccessStatusDAL: profileId, actorId, status required");
  }

  const { data, error } = await vportSchema
    .from("profile_actor_access")
    .update({ status })
    .eq("profile_id", profileId)
    .eq("actor_id", actorId)
    .select(COLS)
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProfileActorAccessDAL({ profileId, actorId }) {
  if (!profileId || !actorId) {
    throw new Error("deleteProfileActorAccessDAL: profileId and actorId required");
  }

  const { error } = await vportSchema
    .from("profile_actor_access")
    .delete()
    .eq("profile_id", profileId)
    .eq("actor_id", actorId);

  if (error) throw error;
}
