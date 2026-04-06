// Identity resolution — Learning-local model
// Resolves the current user's Learning actor from learning.actors by user_id.
// No longer reads from vc.actor_owners or vc.actors.

async function readAuthUserFromSupabase(supabase) {
  if (!supabase?.auth) {
    return null;
  }

  const userResult = await supabase.auth.getUser?.();

  if (userResult?.error) {
    throw userResult.error;
  }

  if (userResult?.data?.user) {
    return userResult.data.user;
  }

  const sessionResult = await supabase.auth.getSession?.();

  if (sessionResult?.error) {
    throw sessionResult.error;
  }

  return sessionResult?.data?.session?.user ?? null;
}

async function readActorIdFromLearningActors(supabase, userId) {
  if (!supabase || !userId) {
    return null;
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("actors")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.id ?? null;
}

export async function resolveLearningActor({
  supabase,
  user = null,
  actorId = null,
} = {}) {
  if (actorId) {
    return {
      ok: true,
      data: {
        actorId,
        user: user ?? null,
      },
    };
  }

  const authUser = user ?? (await readAuthUserFromSupabase(supabase));
  const resolvedActorId = await readActorIdFromLearningActors(supabase, authUser?.id);

  if (!resolvedActorId) {
    return {
      ok: false,
      error: {
        code: "ACTOR_NOT_FOUND",
        message: "Learning actor not found for current user",
      },
    };
  }

  return {
    ok: true,
    data: {
      actorId: resolvedActorId,
      user: authUser ?? null,
    },
  };
}

export async function getLearningActorAdapter(args = {}) {
  return resolveLearningActor(args);
}

export default getLearningActorAdapter;
