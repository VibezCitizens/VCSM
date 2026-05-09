export async function listAllRealmsDal({ supabase, userId }) {
  if (!supabase) {
    throw new Error("listAllRealmsDal requires supabase");
  }

  if (!userId) {
    throw new Error("listAllRealmsDal requires userId");
  }

  const { data, error } = await supabase
    .schema("learning")
    .rpc("list_all_realms_admin", { p_caller_user_id: userId });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export default listAllRealmsDal;
