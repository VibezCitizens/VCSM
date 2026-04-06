import { getLearningRealmByIdDal } from "@/learning/dal/realms/getLearningRealmById.dal";
import { getLearningRealmBySlugDal } from "@/learning/dal/realms/getLearningRealmBySlug.dal";
import { getLearningRealmByVcRealmIdDal } from "@/learning/dal/realms/getLearningRealmByVcRealmId.dal";
import { getDefaultLearningRealmDal } from "@/learning/dal/realms/getDefaultLearningRealm.dal";
import { mapRealm } from "@/learning/model/realm.model";
import { logRealmDebug } from "@/learning/utils/realmDebug";

export async function resolveLearningRealm({
  supabase,
  realmId = null,
  slug = null,
  vcRealmId = null,
  fallbackToDefault = false,
} = {}) {
  if (!supabase) {
    logRealmDebug("resolveLearningRealm", "validation_error", {
      reason: "SUPABASE_REQUIRED",
      realmId,
      slug,
      vcRealmId,
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

  if (!realmId && !slug && !vcRealmId && !fallbackToDefault) {
    logRealmDebug("resolveLearningRealm", "validation_error", {
      reason: "REALM_REFERENCE_REQUIRED",
      realmId,
      slug,
      vcRealmId,
      fallbackToDefault,
    });
    return {
      ok: false,
      error: {
        code: "REALM_REFERENCE_REQUIRED",
        message: "resolveLearningRealm requires realmId, slug, vcRealmId, or default fallback",
      },
    };
  }

  let realmRow = null;

  logRealmDebug("resolveLearningRealm", "start", {
    mode: realmId ? "id" : slug ? "slug" : vcRealmId ? "vcRealmId" : "default",
    realmId,
    slug,
    vcRealmId,
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
  } else if (vcRealmId) {
    realmRow = await getLearningRealmByVcRealmIdDal({
      supabase,
      vcRealmId,
    });
  }

  if (!realmRow && fallbackToDefault) {
    logRealmDebug("resolveLearningRealm", "fallback_requested", {
      realmId,
      slug,
      vcRealmId,
    });
    realmRow = await getDefaultLearningRealmDal({ supabase });
  }

  if (!realmRow) {
    logRealmDebug("resolveLearningRealm", "not_found", {
      realmId,
      slug,
      vcRealmId,
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
    requestedVcRealmId: vcRealmId,
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
