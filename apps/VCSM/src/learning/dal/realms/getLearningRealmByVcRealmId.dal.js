import { REALM_COLUMNS } from "@/learning/dal/realms/getLearningRealmById.dal";
import { logRealmDebug } from "@/learning/utils/realmDebug";

export async function getLearningRealmByVcRealmIdDal({ supabase, vcRealmId }) {
  if (!supabase) {
    throw new Error("getLearningRealmByVcRealmIdDal requires supabase");
  }

  if (!vcRealmId) {
    throw new Error("getLearningRealmByVcRealmIdDal requires vcRealmId");
  }

  logRealmDebug("getLearningRealmByVcRealmIdDal", "query:start", {
    vcRealmId,
  });

  const { data, error } = await supabase
    .schema("learning")
    .from("realms")
    .select(REALM_COLUMNS)
    .eq("vc_realm_id", vcRealmId)
    .maybeSingle();

  if (error) {
    logRealmDebug("getLearningRealmByVcRealmIdDal", "query:error", {
      vcRealmId,
      error,
    });
    throw error;
  }

  logRealmDebug("getLearningRealmByVcRealmIdDal", "query:result", {
    vcRealmId,
    found: Boolean(data),
    resolvedRealmId: data?.id ?? null,
    resolvedRealmSlug: data?.slug ?? null,
    isActive: data?.is_active ?? null,
  });

  return data ?? null;
}

export default getLearningRealmByVcRealmIdDal;
