function readActorIdFromAuthUser(user) {
  if (!user) return null;

  return (
    user.actor_id ??
    user.actorId ??
    user.id ??
    user.user_id ??
    user?.app_metadata?.actor_id ??
    user?.app_metadata?.actorId ??
    user?.user_metadata?.actor_id ??
    user?.user_metadata?.actorId ??
    null
  );
}

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
  const resolvedActorId = readActorIdFromAuthUser(authUser);

  if (!resolvedActorId) {
    return {
      ok: false,
      error: {
        code: "ACTOR_NOT_FOUND",
        message: "Unable to resolve authenticated actor",
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

export function getActorIdFromUser(user) {
  return readActorIdFromAuthUser(user);
}

export default getLearningActorAdapter;