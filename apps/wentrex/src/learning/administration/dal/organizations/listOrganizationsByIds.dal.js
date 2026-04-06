const ORGANIZATION_COLUMNS = `
  id,
  name,
  slug,
  is_active,
  realm_id
`;

export async function listOrganizationsByIdsDal({ supabase, organizationIds }) {
  if (!supabase) {
    throw new Error("listOrganizationsByIdsDal requires supabase");
  }

  if (!organizationIds?.length) {
    return [];
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("organizations")
    .select(ORGANIZATION_COLUMNS)
    .in("id", organizationIds);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export default listOrganizationsByIdsDal;
