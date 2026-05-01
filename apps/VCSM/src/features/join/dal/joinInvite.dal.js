import vportSchema from "@/services/supabase/vportClient";

const RESOURCE_COLS = "id, name, resource_type, is_active, member_actor_id, meta, profile_id, barbershop:profiles!profile_id(id, name, actor_id)";

export async function fetchJoinResourceByIdDAL(resourceId) {
  if (!resourceId) return null;

  const { data, error } = await vportSchema
    .from("resources")
    .select(RESOURCE_COLS)
    .eq("id", resourceId)
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
    .select(RESOURCE_COLS)
    .single();

  if (error) throw error;
  return data;
}
