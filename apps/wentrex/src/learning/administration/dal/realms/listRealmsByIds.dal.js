const REALM_COLUMNS = `
  id,
  name,
  slug,
  is_active
`;

export async function listRealmsByIdsDal({ supabase, realmIds }) {
  if (!supabase) {
    throw new Error("listRealmsByIdsDal requires supabase");
  }

  if (!realmIds?.length) {
    return [];
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("realms")
    .select(REALM_COLUMNS)
    .in("id", realmIds);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export default listRealmsByIdsDal;
