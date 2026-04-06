export async function getAuthUserDal({ supabase }) {
  if (!supabase) {
    throw new Error("getAuthUserDal requires supabase");
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return user ?? null;
}

export default getAuthUserDal;
