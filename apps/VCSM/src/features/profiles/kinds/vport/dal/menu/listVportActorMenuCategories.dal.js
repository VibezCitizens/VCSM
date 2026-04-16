import vportSchema from "@/services/supabase/vportClient";

const CATEGORY_SELECT =
  "id,profile_id,key,name,description,sort_order,is_active,created_at,updated_at";

async function resolveProfileId(actorId) {
  const { data } = await vportSchema
    .from("profiles")
    .select("id")
    .eq("actor_id", actorId)
    .maybeSingle();
  return data?.id ?? null;
}

export async function listVportActorMenuCategoriesDAL({
  actorId,
  includeInactive = false,
} = {}) {
  if (!actorId) throw new Error("listVportActorMenuCategoriesDAL: actorId is required");

  const profileId = await resolveProfileId(actorId);
  if (!profileId) return [];

  let query = vportSchema
    .from("menu_categories")
    .select(CATEGORY_SELECT)
    .eq("profile_id", profileId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (!includeInactive) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export default listVportActorMenuCategoriesDAL;
