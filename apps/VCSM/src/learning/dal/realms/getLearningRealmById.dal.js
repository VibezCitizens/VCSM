import { logRealmDebug } from "@/learning/utils/realmDebug";

const REALM_COLUMNS = `
  id,
  slug,
  name,
  vc_realm_id,
  owner_actor_id,
  is_active,
  created_at,
  updated_at
`;

export async function getLearningRealmByIdDal({ supabase, realmId }) {
  if (!supabase) {
    throw new Error("getLearningRealmByIdDal requires supabase");
  }

  if (!realmId) {
    throw new Error("getLearningRealmByIdDal requires realmId");
  }

  logRealmDebug("getLearningRealmByIdDal", "query:start", {
    realmId,
  });

  const { data, error } = await supabase
    .schema("learning")
    .from("realms")
    .select(REALM_COLUMNS)
    .eq("id", realmId)
    .maybeSingle();

  if (error) {
    logRealmDebug("getLearningRealmByIdDal", "query:error", {
      realmId,
      error,
    });
    throw error;
  }

  logRealmDebug("getLearningRealmByIdDal", "query:result", {
    realmId,
    found: Boolean(data),
    resolvedRealmId: data?.id ?? null,
    resolvedRealmSlug: data?.slug ?? null,
    isActive: data?.is_active ?? null,
  });

  return data ?? null;
}

export { REALM_COLUMNS };
export default getLearningRealmByIdDal;
