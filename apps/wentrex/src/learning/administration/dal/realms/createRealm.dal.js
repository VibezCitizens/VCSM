import { REALM_COLUMNS } from "@/learning/administration/dal/realms/getLearningRealmById.dal";

export async function createRealmDal({ supabase, name, slug }) {
  if (!supabase) {
    throw new Error("createRealmDal requires supabase");
  }

  if (!name) {
    throw new Error("createRealmDal requires name");
  }

  if (!slug) {
    throw new Error("createRealmDal requires slug");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("realms")
    .insert({
      name,
      slug,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select(REALM_COLUMNS)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export default createRealmDal;
