export async function listAllRealmsDal({ supabase, userId }) {
  const { data, error } = await supabase
    .schema("learning")
    .rpc("list_all_realms_admin", { p_caller_user_id: userId });

  if (error) throw error;
  return data ?? [];
}
