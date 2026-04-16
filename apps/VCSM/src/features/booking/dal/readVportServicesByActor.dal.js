import vportSchema from "@/services/supabase/vportClient";

const SERVICES_SELECT =
  "id,profile_id,key,label,description,service_group,sort_order,enabled,meta,created_at,updated_at";

async function resolveProfileId(actorId) {
  const { data } = await vportSchema
    .from("profiles")
    .select("id")
    .eq("actor_id", actorId)
    .maybeSingle();
  return data?.id ?? null;
}

export default async function readVportServicesByActorDAL({
  actorId,
  includeDisabled = true,
} = {}) {
  if (!actorId) throw new Error("readVportServicesByActorDAL: actorId is required");

  const profileId = await resolveProfileId(actorId);
  if (!profileId) return [];

  let query = vportSchema
    .from("services")
    .select(SERVICES_SELECT)
    .eq("profile_id", profileId)
    .order("sort_order", { ascending: true })
    .order("key", { ascending: true });

  if (!includeDisabled) query = query.eq("enabled", true);

  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}
