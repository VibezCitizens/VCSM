const LEARNING_REALM_COLUMNS = `
  id,
  slug,
  name,
  vc_realm_id,
  owner_actor_id,
  is_active,
  created_at,
  updated_at
`;

export async function getLearningRealmBySourceRealmIdDal({
  supabase,
  sourceRealmId,
}) {
  if (!supabase) {
    throw new Error("getLearningRealmBySourceRealmIdDal requires supabase");
  }

  if (!sourceRealmId) {
    throw new Error("getLearningRealmBySourceRealmIdDal requires sourceRealmId");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("realms")
    .select(LEARNING_REALM_COLUMNS)
    .eq("vc_realm_id", sourceRealmId)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01") {
      return null;
    }

    throw error;
  }

  return data ?? null;
}

export default getLearningRealmBySourceRealmIdDal;
