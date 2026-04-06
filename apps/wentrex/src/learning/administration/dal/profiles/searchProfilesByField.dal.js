const PROFILE_SEARCH_COLUMNS = `id, display_name, username, email`;

export async function searchProfilesByFieldDal({ supabase, field, pattern, limit = 20 }) {
  if (!supabase) throw new Error("searchProfilesByFieldDal requires supabase");
  if (!field) throw new Error("searchProfilesByFieldDal requires field");
  if (!pattern) throw new Error("searchProfilesByFieldDal requires pattern");

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SEARCH_COLUMNS)
    .ilike(field, pattern)
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export default searchProfilesByFieldDal;
