const ACTOR_ACCESS_COLUMNS = `
  actor_id,
  can_access_learning_center,
  granted_by_actor_id,
  granted_at,
  revoked_at,
  notes,
  created_at,
  updated_at
`;

export async function getActorAccessDal({ supabase, actorId }) {
  if (!supabase) {
    throw new Error("getActorAccessDal requires supabase");
  }

  if (!actorId) {
    throw new Error("getActorAccessDal requires actorId");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("actor_access")
    .select(ACTOR_ACCESS_COLUMNS)
    .eq("actor_id", actorId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export { ACTOR_ACCESS_COLUMNS };
export default getActorAccessDal;
