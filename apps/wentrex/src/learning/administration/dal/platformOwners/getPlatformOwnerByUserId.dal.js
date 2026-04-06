export async function getPlatformOwnerByUserIdDal({ supabase, userId }) {
  if (!supabase) {
    throw new Error("getPlatformOwnerByUserIdDal requires supabase");
  }

  if (!userId) {
    throw new Error("getPlatformOwnerByUserIdDal requires userId");
  }

  // core schema is not exposed via PostgREST, so use the security-definer RPC
  const { data, error } = await supabase
    .schema("learning")
    .rpc("is_platform_owner", { p_user_id: userId });

  if (error) {
    throw error;
  }

  // Return array format to match existing callers: [{ user_id }] or []
  return data === true ? [{ user_id: userId }] : [];
}

export default getPlatformOwnerByUserIdDal;
