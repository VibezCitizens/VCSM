const PROFILE_COLUMNS = `id, display_name, username, email`;

export async function listProfilesByIdsDal({ supabase, profileIds }) {
  if (!supabase) throw new Error("listProfilesByIdsDal requires supabase");
  if (!profileIds?.length) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .in("id", profileIds);

  if (error) throw error;
  return data ?? [];
}

export default listProfilesByIdsDal;
