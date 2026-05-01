import vportSchema from "@/services/supabase/vportClient";

export async function readVportProfileActorAccessDAL({ profileId } = {}) {
  if (!profileId) return []

  const { data, error } = await vportSchema
    .from("profile_actor_access")
    .select("actor_id, role, status, is_primary")
    .eq("profile_id", profileId)

  if (error) throw error
  return data ?? []
}
