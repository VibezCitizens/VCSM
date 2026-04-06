const REALM_COLUMNS = `
  id,
  slug,
  name,
  vc_realm_id,
  owner_actor_id,
  is_active,
  created_at,
  updated_at
`;

export async function getLearningRealmByIdDal({ supabase, realmId }) {
  if (!supabase) {
    throw new Error("getLearningRealmByIdDal requires supabase");
  }

  if (!realmId) {
    throw new Error("getLearningRealmByIdDal requires realmId");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("realms")
    .select(REALM_COLUMNS)
    .eq("id", realmId)
    .maybeSingle();

  if (error) {
    console.error("[getLearningRealmByIdDal] query error", {
      realmId,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw error;
  }

  if (!data) {
    console.warn("[getLearningRealmByIdDal] no row returned", { realmId });
  }

  return data ?? null;
}

export { REALM_COLUMNS };
export default getLearningRealmByIdDal;
