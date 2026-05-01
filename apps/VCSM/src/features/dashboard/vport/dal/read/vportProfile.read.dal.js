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
