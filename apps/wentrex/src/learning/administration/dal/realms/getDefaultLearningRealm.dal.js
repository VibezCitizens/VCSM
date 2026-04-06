import { REALM_COLUMNS } from "@/learning/administration/dal/realms/getLearningRealmById.dal";

export async function getDefaultLearningRealmDal({ supabase }) {
  if (!supabase) {
    throw new Error("getDefaultLearningRealmDal requires supabase");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("realms")
    .select(REALM_COLUMNS)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export default getDefaultLearningRealmDal;
