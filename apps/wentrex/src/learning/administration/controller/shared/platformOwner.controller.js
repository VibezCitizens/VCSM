/**
 * Checks whether a user is a platform owner via platform.platform_owners.
 * Platform owner is the highest authority tier — above all learning roles.
 * Uses user_id (auth.users.id), NOT actor_id.
 */
export async function isPlatformOwner(supabase, userId) {
  if (!supabase || !userId) {
    return false;
  }

  const { data, error } = await supabase
    .schema("platform")
    .from("platform_owners")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01") {
      return false;
    }

    throw error;
  }

  return !!data;
}
