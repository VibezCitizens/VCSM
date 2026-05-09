export async function listAllOrganizationSummariesDal({ supabase }) {
  const { data, error } = await supabase
    .schema("learning")
    .from("organizations")
    .select("id, realm_id");

  if (error) throw error;
  return data ?? [];
}
