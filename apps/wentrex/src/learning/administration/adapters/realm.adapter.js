import { getLearningRealmByIdDal } from "@/learning/administration/dal/realms/getLearningRealmById.dal";
import { getLearningRealmBySlugDal } from "@/learning/administration/dal/realms/getLearningRealmBySlug.dal";
import { getLearningRealmBySourceRealmIdDal } from "@/learning/administration/dal/realms/getLearningRealmBySourceRealmId.dal";
import { getDefaultLearningRealmDal } from "@/learning/administration/dal/realms/getDefaultLearningRealm.dal";
import { mapRealm } from "@/learning/administration/model/realm.model";
import { logRealmDebug } from "@/learning/administration/utils/realmDebug";

export async function resolveLearningRealm({
  supabase,
  realmId = null,
  slug = null,
  sourceRealmId = null,
  fallbackToDefault = false,
} = {}) {
  if (!supabase) {
    logRealmDebug("resolveLearningRealm", "validation_error", {
      reason: "SUPABASE_REQUIRED",
      realmId,
      slug,
      sourceRealmId,
      fallbackToDefault,
    });
    return {
      ok: false,
      error: {
        code: "SUPABASE_REQUIRED",
        message: "resolveLearningRealm requires supabase",
      },
    };
  }

  if (!realmId && !slug && !sourceRealmId && !fallbackToDefault) {
    logRealmDebug("resolveLearningRealm", "validation_error", {
      reason: "REALM_REFERENCE_REQUIRED",
      realmId,
      slug,
      sourceRealmId,
      fallbackToDefault,
    });
    return {
      ok: false,
      error: {
        code: "REALM_REFERENCE_REQUIRED",
        message:
          "resolveLearningRealm requires realmId, slug, sourceRealmId, or default fallback",
      },
    };
  }

  let realmRow = null;

  logRealmDebug("resolveLearningRealm", "start", {
    mode: realmId ? "id" : slug ? "slug" : sourceRealmId ? "sourceRealmId" : "default",
    realmId,
    slug,
    sourceRealmId,
    fallbackToDefault,
  });

  if (realmId) {
    realmRow = await getLearningRealmByIdDal({
        supabase,
        realmId,
      });
  } else if (slug) {
    realmRow = await getLearningRealmBySlugDal({
        supabase,
        slug,
      });
  } else if (sourceRealmId) {
    realmRow = await getLearningRealmBySourceRealmIdDal({
      supabase,
      sourceRealmId,
    });
  }

  if (!realmRow && fallbackToDefault) {
    logRealmDebug("resolveLearningRealm", "fallback_requested", {
      realmId,
      slug,
      sourceRealmId,
    });
    realmRow = await getDefaultLearningRealmDal({ supabase });
  }

  if (!realmRow) {
    logRealmDebug("resolveLearningRealm", "not_found", {
      realmId,
      slug,
      sourceRealmId,
      fallbackToDefault,
    });
    return {
      ok: false,
      error: {
        code: "REALM_NOT_FOUND",
        message: "Learning realm was not found",
      },
    };
  }

  logRealmDebug("resolveLearningRealm", "success", {
    requestedRealmId: realmId,
    requestedSlug: slug,
    requestedSourceRealmId: sourceRealmId,
    fallbackToDefault,
    resolvedRealmId: realmRow.id,
    resolvedRealmSlug: realmRow.slug,
    isActive: realmRow.is_active,
  });

  return {
    ok: true,
    data: {
      realm: mapRealm(realmRow),
      realmId: realmRow.id,
    },
  };
}

export async function getLearningRealmAdapter(args = {}) {
  return resolveLearningRealm(args);
}

export default getLearningRealmAdapter;
