import { REALM_COLUMNS } from "@/learning/dal/realms/getLearningRealmById.dal";
import { logRealmDebug } from "@/learning/utils/realmDebug";

export async function getLearningRealmBySlugDal({ supabase, slug }) {
  if (!supabase) {
    throw new Error("getLearningRealmBySlugDal requires supabase");
  }

  if (!slug) {
    throw new Error("getLearningRealmBySlugDal requires slug");
  }

  logRealmDebug("getLearningRealmBySlugDal", "query:start", {
    slug,
  });

  const { data, error } = await supabase
    .schema("learning")
    .from("realms")
    .select(REALM_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    logRealmDebug("getLearningRealmBySlugDal", "query:error", {
      slug,
      error,
    });
    throw error;
  }

  logRealmDebug("getLearningRealmBySlugDal", "query:result", {
    slug,
    found: Boolean(data),
    resolvedRealmId: data?.id ?? null,
    resolvedRealmSlug: data?.slug ?? null,
    isActive: data?.is_active ?? null,
  });

  return data ?? null;
}

export default getLearningRealmBySlugDal;
