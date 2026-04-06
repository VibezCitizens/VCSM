import { COURSE_TERM_COLUMNS } from "@/learning/administration/dal/courseTerms/getTermById.dal";

export async function listTermsByOrganizationIdDal({ supabase, organizationId }) {
  if (!supabase) {
    throw new Error("listTermsByOrganizationIdDal requires supabase");
  }

  if (!organizationId) {
    throw new Error("listTermsByOrganizationIdDal requires organizationId");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("course_terms")
    .select(COURSE_TERM_COLUMNS)
    .eq("organization_id", organizationId)
    .order("starts_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export default listTermsByOrganizationIdDal;
