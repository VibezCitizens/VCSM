const ACTOR_IDENTITY_COLUMNS = `id, user_id`;

export async function listActiveActorsByUserIdsDal({ supabase, userIds }) {
  if (!supabase) throw new Error("listActiveActorsByUserIdsDal requires supabase");
  if (!userIds?.length) return [];

  const { data, error } = await supabase
    .schema("learning")
    .from("actors")
    .select(ACTOR_IDENTITY_COLUMNS)
    .in("user_id", userIds)
    .eq("is_active", true);

  if (error) throw error;
  return data ?? [];
}

export default listActiveActorsByUserIdsDal;
