const ORGANIZATION_COLUMNS = `
  id,
  slug,
  name,
  is_active,
  created_at,
  updated_at,
  realm_id,
  owner_actor_id
`;

export async function getOrganizationByIdDal({ supabase, organizationId }) {
  if (!supabase) {
    throw new Error("getOrganizationByIdDal requires supabase");
  }

  if (!organizationId) {
    throw new Error("getOrganizationByIdDal requires organizationId");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("organizations")
    .select(ORGANIZATION_COLUMNS)
    .eq("id", organizationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export { ORGANIZATION_COLUMNS };
export default getOrganizationByIdDal;