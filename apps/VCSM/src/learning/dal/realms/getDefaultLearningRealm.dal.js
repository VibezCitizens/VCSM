import { supabase } from "@/services/supabase/supabaseClient";
import { REALM_COLUMNS } from "@/learning/dal/realms/getLearningRealmById.dal";
import { logRealmDebug } from "@/learning/utils/realmDebug";

export async function getDefaultLearningRealmDal() {
  logRealmDebug("getDefaultLearningRealmDal", "query:start");

  const { data, error } = await supabase
    .schema("learning")
    .from("realms")
    .select(REALM_COLUMNS)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    logRealmDebug("getDefaultLearningRealmDal", "query:error", {
      error,
    });
    throw error;
  }

  logRealmDebug("getDefaultLearningRealmDal", "query:result", {
    found: Boolean(data),
    resolvedRealmId: data?.id ?? null,
    resolvedRealmSlug: data?.slug ?? null,
    isActive: data?.is_active ?? null,
  });

  return data ?? null;
}

export default getDefaultLearningRealmDal;
