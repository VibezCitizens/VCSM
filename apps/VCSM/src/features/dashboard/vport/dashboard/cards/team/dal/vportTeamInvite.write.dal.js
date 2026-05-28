import vportSchema from "@/services/supabase/vportClient";

const COLS = "id, name, resource_type, is_active, member_actor_id, sort_order, meta, profile_id";

export async function insertTeamRequestDAL({ profileId, name, memberActorId, ownerActorId, requestedByActorId }) {
  if (!profileId || !name || !memberActorId) {
    throw new Error("insertTeamRequestDAL: profileId, name, memberActorId required");
  }

  const { data, error } = await vportSchema
    .from("resources")
    .insert({
      profile_id:     profileId,
      name:           String(name).trim(),
      resource_type:  "staff",
      is_active:      false,
      owner_actor_id: ownerActorId ?? null,
      member_actor_id: memberActorId,
      meta: {
        status: "pending_acceptance",
        requested_at: new Date().toISOString(),
        requested_by_actor_id: requestedByActorId ?? null,
      },
    })
    .select(COLS)
    .single();

  if (error) throw error;
  return data;
}

export async function acceptTeamRequestDAL(resourceId, currentMeta) {
  if (!resourceId) throw new Error("acceptTeamRequestDAL: resourceId required");

  // Atomic state guard — update fires only when the request is still pending_acceptance.
  // Prevents concurrent accepts or replay of an already-accepted/declined request.
  const { data, error } = await vportSchema
    .from("resources")
    .update({
      is_active: true,
      meta: {
        ...(currentMeta || {}),
        status: "linked",
        accepted_at: new Date().toISOString(),
      },
    })
    .eq("id", resourceId)
    .eq("meta->>status", "pending_acceptance")
    .select(COLS)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("request is no longer available");
  return data;
}

export async function declineTeamRequestDAL(resourceId, currentMeta) {
  if (!resourceId) throw new Error("declineTeamRequestDAL: resourceId required");

  const { data, error } = await vportSchema
    .from("resources")
    .update({
      meta: {
        ...(currentMeta || {}),
        status: "declined",
        declined_at: new Date().toISOString(),
      },
    })
    .eq("id", resourceId)
    .select(COLS)
    .single();

  if (error) throw error;
  return data;
}

export async function acceptTeamInviteByActorDAL(resourceId, barberVportActorId, currentMeta) {
  if (!resourceId || !barberVportActorId) {
    throw new Error("acceptTeamInviteByActorDAL: resourceId and barberVportActorId required");
  }

  // ELEK-001: atomic state guard — update only fires when the invite is still pending_acceptance.
  // Prevents replay of an already accepted, declined, or linked invite resource.
  const { data, error } = await vportSchema
    .from("resources")
    .update({
      member_actor_id: barberVportActorId,
      is_active: true,
      meta: {
        ...(currentMeta || {}),
        status: "linked",
        accepted_at: new Date().toISOString(),
      },
    })
    .eq("id", resourceId)
    .eq("meta->>status", "pending_acceptance")
    .select(COLS)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("invite is no longer available");
  return data;
}

export async function deleteTeamResourceDAL(resourceId) {
  if (!resourceId) throw new Error("deleteTeamResourceDAL: resourceId required");
  const { error } = await vportSchema.from("resources").delete().eq("id", resourceId);
  if (error) throw error;
}
