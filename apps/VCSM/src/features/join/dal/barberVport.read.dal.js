import vportSchema from "@/services/supabase/vportClient";

export async function readBarberVportByOwnerUserIdDAL(userId) {
  if (!userId) return null;

  // Join runs before actor provisioning, so this flow must scope by auth user id.
  const { data } = await vportSchema
    .from("profiles")
    .select("id, name, actor_id, primary_category_key")
    .eq("owner_user_id", userId)
    .eq("primary_category_key", "barber")
    .maybeSingle();

  return data ?? null;
}

export async function findBarberVportForUserDAL(userId) {
  if (!userId) return null;

  // Join runs before actor provisioning, so this flow must scope by auth user id.
  const { data, error } = await vportSchema
    .from("profile_categories")
    .select("profile_id, category_key, is_primary, profile:profiles!inner(id, name, actor_id, owner_user_id, is_active)")
    .eq("category_key", "barber")
    .eq("is_primary", true)
    .eq("profile.owner_user_id", userId)
    .eq("profile.is_active", true)
    .maybeSingle();

  if (error) return null;
  if (!data?.profile) return null;

  return {
    id: data.profile.id,
    name: data.profile.name,
    actor_id: data.profile.actor_id,
  };
}
