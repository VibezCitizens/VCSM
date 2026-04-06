import { getLearningRealmByIdDal } from "@/learning/administration/dal/realms/getLearningRealmById.dal";
import { getOrganizationByIdDal } from "@/learning/administration/dal/organizations/getOrganizationById.dal";
import { getDefaultLearningRealmDal } from "@/learning/administration/dal/realms/getDefaultLearningRealm.dal";

const DEBUG_PREFIX = "[resolveRealmSlug]";

export async function resolveRealmSlugByRealmId({ supabase, realmId }) {
  console.log(`${DEBUG_PREFIX} resolveRealmSlugByRealmId`, { realmId });

  if (!realmId) return null;

  let realm = null;
  try {
    realm = await getLearningRealmByIdDal({ supabase, realmId });
  } catch (err) {
    console.error(`${DEBUG_PREFIX} resolveRealmSlugByRealmId query threw`, {
      realmId,
      error: err?.message ?? err,
      code: err?.code,
    });
  }

  if (realm?.slug) {
    console.log(`${DEBUG_PREFIX} resolveRealmSlugByRealmId resolved`, {
      realmId,
      realmSlug: realm.slug,
    });
    return realm.slug;
  }

  // Fallback: direct lookup failed (RLS or timing issue) — try default realm
  console.warn(`${DEBUG_PREFIX} resolveRealmSlugByRealmId direct lookup failed; trying default realm`, {
    realmId,
    realm,
  });

  try {
    const defaultRealm = await getDefaultLearningRealmDal({ supabase });
    if (defaultRealm?.slug) {
      console.log(`${DEBUG_PREFIX} resolveRealmSlugByRealmId using default realm fallback`, {
        realmId,
        defaultSlug: defaultRealm.slug,
      });
      return defaultRealm.slug;
    }
  } catch (e) {
    console.warn(`${DEBUG_PREFIX} default realm fallback also failed`, e);
  }

  return null;
}

export async function resolveRealmSlug({ supabase, organizationId, realmId }) {
  console.log(`${DEBUG_PREFIX} resolveRealmSlug start`, {
    organizationId,
    realmId,
  });

  if (realmId) {
    return resolveRealmSlugByRealmId({ supabase, realmId });
  }

  if (!organizationId) return null;

  const organization = await getOrganizationByIdDal({ supabase, organizationId });

  if (!organization?.realm_id) {
    console.warn(`${DEBUG_PREFIX} resolveRealmSlug organization lookup failed; trying default realm`, {
      organizationId,
      organization: organization ?? null,
    });

    // Fallback: when user can't read the organizations table (RLS), use the default realm
    try {
      const defaultRealm = await getDefaultLearningRealmDal({ supabase });
      if (defaultRealm?.slug) {
        console.log(`${DEBUG_PREFIX} resolveRealmSlug using default realm fallback`, {
          realmSlug: defaultRealm.slug,
        });
        return defaultRealm.slug;
      }
    } catch (e) {
      console.warn(`${DEBUG_PREFIX} default realm fallback failed`, e);
    }

    return null;
  }

  console.log(`${DEBUG_PREFIX} resolveRealmSlug organization lookup resolved`, {
    organizationId,
    realmId: organization.realm_id,
  });

  return resolveRealmSlugByRealmId({ supabase, realmId: organization.realm_id });
}
