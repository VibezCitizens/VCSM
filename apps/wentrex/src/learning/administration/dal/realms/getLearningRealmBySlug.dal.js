import { REALM_COLUMNS } from "@/learning/administration/dal/realms/getLearningRealmById.dal";

export async function getLearningRealmBySlugDal({ supabase, slug }) {
  if (!supabase) {
    throw new Error("getLearningRealmBySlugDal requires supabase");
  }

  if (!slug) {
    throw new Error("getLearningRealmBySlugDal requires slug");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("realms")
    .select(REALM_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export default getLearningRealmBySlugDal;
