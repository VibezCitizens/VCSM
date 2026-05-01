// src/learning/controller/resolveLearningRealm.controller.js
// Orchestrates realm resolution. DALs own Supabase access.

import { getLearningRealmByIdDal } from "@/learning/dal/realms/getLearningRealmById.dal";
import { getLearningRealmBySlugDal } from "@/learning/dal/realms/getLearningRealmBySlug.dal";
import { getLearningRealmByVcRealmIdDal } from "@/learning/dal/realms/getLearningRealmByVcRealmId.dal";
import { getDefaultLearningRealmDal } from "@/learning/dal/realms/getDefaultLearningRealm.dal";
import { mapRealm } from "@/learning/model/realm.model";
import { logRealmDebug } from "@/learning/utils/realmDebug";

export async function resolveLearningRealmController({
  realmId = null,
  slug = null,
  vcRealmId = null,
  fallbackToDefault = false,
} = {}) {
  if (!realmId && !slug && !vcRealmId && !fallbackToDefault) {
    logRealmDebug("resolveLearningRealmController", "validation_error", {
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

  logRealmDebug("resolveLearningRealmController", "start", {
    mode: realmId ? "id" : slug ? "slug" : vcRealmId ? "vcRealmId" : "default",
    realmId,
    slug,
    vcRealmId,
    fallbackToDefault,
  });

  if (realmId) {
    realmRow = await getLearningRealmByIdDal({ realmId });
  } else if (slug) {
    realmRow = await getLearningRealmBySlugDal({ slug });
  } else if (vcRealmId) {
    realmRow = await getLearningRealmByVcRealmIdDal({ vcRealmId });
  }

  if (!realmRow && fallbackToDefault) {
    logRealmDebug("resolveLearningRealmController", "fallback_requested", {
      realmId,
      slug,
      vcRealmId,
    });
    realmRow = await getDefaultLearningRealmDal();
  }

  if (!realmRow) {
    logRealmDebug("resolveLearningRealmController", "not_found", {
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

  logRealmDebug("resolveLearningRealmController", "success", {
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
