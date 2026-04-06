import { LEARNING_ACTOR_COLUMNS } from "@/learning/administration/dal/actors/getLearningActorById.dal";

export async function getLearningActorByUserIdDal({ supabase, userId }) {
  if (!supabase) throw new Error("getLearningActorByUserIdDal requires supabase");
  if (!userId) throw new Error("getLearningActorByUserIdDal requires userId");

  const { data, error } = await supabase
    .schema("learning")
    .from("actors")
    .select(LEARNING_ACTOR_COLUMNS)
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export default getLearningActorByUserIdDal;
