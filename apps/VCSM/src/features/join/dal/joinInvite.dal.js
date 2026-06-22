import vportSchema from "@/services/supabase/vportClient";

const RESOURCE_COLS = "id, name, resource_type, is_active, member_actor_id, meta, barbershop:profiles!profile_id(name, actor_id)";

export async function fetchJoinResourceByIdDAL(resourceId) {
  if (!resourceId) return null;

  const { data, error } = await vportSchema
    .from("resources")
    .select(RESOURCE_COLS)
    .eq("id", resourceId)
    .eq("resource_type", "staff")
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function acceptJoinResourceDAL(resourceId, barberVportActorId, extraMeta = {}) {
  if (!resourceId || !barberVportActorId) {
    throw new Error("acceptJoinResourceDAL: resourceId and barberVportActorId required");
  }

  const { data: current, error: readError } = await vportSchema
    .from("resources")
    .select("meta")
    .eq("id", resourceId)
    .maybeSingle();

  if (readError) throw readError;

  // ELEK-001: atomic state guard — update only fires when the resource is still in
  // pending_onboarding state and the slot is unclaimed. Prevents mutation replay:
  // a reused or race-concurrent token cannot overwrite an already-linked member_actor_id.
  const { data, error } = await vportSchema
    .from("resources")
    .update({
      member_actor_id: barberVportActorId,
      is_active: true,
      meta: {
        ...(current?.meta || {}),
        ...extraMeta,
        status: "linked",
        accepted_at: new Date().toISOString(),
      },
    })
    .eq("id", resourceId)
    .eq("meta->>status", "pending_onboarding")
    .is("member_actor_id", null)
    .select(RESOURCE_COLS)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("join resource is no longer available");
  return data;
}
