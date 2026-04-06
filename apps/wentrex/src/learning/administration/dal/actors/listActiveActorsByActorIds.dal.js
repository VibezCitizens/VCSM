const ACTOR_IDENTITY_COLUMNS = `id, user_id`;

export async function listActiveActorsByActorIdsDal({ supabase, actorIds }) {
  if (!supabase) throw new Error("listActiveActorsByActorIdsDal requires supabase");
  if (!actorIds?.length) return [];

  const { data, error } = await supabase
    .schema("learning")
    .from("actors")
    .select(ACTOR_IDENTITY_COLUMNS)
    .in("id", actorIds)
    .eq("is_active", true);

  if (error) throw error;
  return data ?? [];
}

export default listActiveActorsByActorIdsDal;
