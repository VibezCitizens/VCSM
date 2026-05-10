import vportSchema from "@/services/supabase/vportClient";

export async function readVportProfileByActorIdDAL({ actorId } = {}) {
  if (!actorId) return null

  const { data, error } = await vportSchema
    .from("profiles")
    .select("id, actor_id, name, slug, is_active, is_deleted")
    .eq("actor_id", actorId)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data ?? null
}

export async function getVportProfileIdByActorDAL({ actorId } = {}) {
  if (!actorId) return null;

  const { data, error } = await vportSchema
    .from("profiles")
    .select("id")
    .eq("actor_id", actorId)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

export async function getVportActorIdByProfileIdDAL({ profileId } = {}) {
  if (!profileId) return null;

  const { data, error } = await vportSchema
    .from("profiles")
    .select("actor_id")
    .eq("id", profileId)
    .maybeSingle();

  if (error) throw error;
  return data?.actor_id ?? null;
}
