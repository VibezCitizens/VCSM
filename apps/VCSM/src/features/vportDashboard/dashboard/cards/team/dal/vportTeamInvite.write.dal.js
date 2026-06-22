import vportSchema from "@/services/supabase/vportClient";

const COLS = "id, name, resource_type, is_active, member_actor_id, sort_order, meta, profile_id";

function splitMetaScope(currentMeta) {
  const {
    __profileId: profileId,
    __memberActorId: memberActorId,
    ...meta
  } = currentMeta || {};
  return { meta, profileId, memberActorId };
}

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
  const { meta, memberActorId } = splitMetaScope(currentMeta);
  if (!memberActorId) throw new Error("acceptTeamRequestDAL: memberActorId required");

  // Atomic state guard — update fires only when the request is still pending_acceptance.
  // Prevents concurrent accepts or replay of an already-accepted/declined request.
  const { data, error } = await vportSchema
    .from("resources")
    .update({
      is_active: true,
      meta: {
        ...meta,
        status: "linked",
        accepted_at: new Date().toISOString(),
      },
    })
    .eq("id", resourceId)
    .eq("member_actor_id", memberActorId)
    .eq("meta->>status", "pending_acceptance")
    .select(COLS)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("request is no longer available");
  return data;
}

export async function declineTeamRequestDAL(resourceId, currentMeta) {
  if (!resourceId) throw new Error("declineTeamRequestDAL: resourceId required");
  const { meta, profileId, memberActorId } = splitMetaScope(currentMeta);
  if (!profileId && !memberActorId) {
    throw new Error("declineTeamRequestDAL: profileId or memberActorId required");
  }

  let query = vportSchema
    .from("resources")
    .update({
      meta: {
        ...meta,
        status: "declined",
        declined_at: new Date().toISOString(),
      },
    })
    .eq("id", resourceId);

  if (profileId) query = query.eq("profile_id", profileId);
  if (memberActorId) query = query.eq("member_actor_id", memberActorId);

  const { data, error } = await query
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
    .eq("member_actor_id", barberVportActorId)
    .eq("meta->>status", "pending_acceptance")
    .select(COLS)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("invite is no longer available");
  return data;
}

export async function deleteTeamResourceDAL({ resourceId, profileId }) {
  if (!resourceId || !profileId) throw new Error("deleteTeamResourceDAL: resourceId and profileId required");
  const { error } = await vportSchema.from("resources").delete().eq("id", resourceId).eq("profile_id", profileId);
  if (error) throw error;
}
