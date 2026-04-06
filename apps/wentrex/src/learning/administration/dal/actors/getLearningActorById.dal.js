const LEARNING_ACTOR_COLUMNS = `id, user_id, profile_id, user_app_account_id, is_active`;

export async function getLearningActorByIdDal({ supabase, actorId }) {
  if (!supabase) throw new Error("getLearningActorByIdDal requires supabase");
  if (!actorId) throw new Error("getLearningActorByIdDal requires actorId");

  const { data, error } = await supabase
    .schema("learning")
    .from("actors")
    .select(LEARNING_ACTOR_COLUMNS)
    .eq("id", actorId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export { LEARNING_ACTOR_COLUMNS };
export default getLearningActorByIdDal;
