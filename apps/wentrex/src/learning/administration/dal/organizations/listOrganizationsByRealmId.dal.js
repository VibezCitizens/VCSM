import { ORGANIZATION_COLUMNS } from "@/learning/administration/dal/organizations/getOrganizationById.dal";

export async function listOrganizationsByRealmIdDal({
  supabase,
  realmId,
  includeInactive = true,
}) {
  if (!supabase) {
    throw new Error("listOrganizationsByRealmIdDal requires supabase");
  }

  if (!realmId) {
    throw new Error("listOrganizationsByRealmIdDal requires realmId");
  }

  let query = supabase
    .schema("learning")
    .from("organizations")
    .select(ORGANIZATION_COLUMNS)
    .eq("realm_id", realmId)
    .order("name", { ascending: true });

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

export default listOrganizationsByRealmIdDal;
