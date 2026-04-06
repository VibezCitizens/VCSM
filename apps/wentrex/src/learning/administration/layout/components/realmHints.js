// src/learning/layout/components/realmHints.js
// ============================================================
// Pure helpers for LearningLayout — realm hint resolution
// and localStorage wrappers.
// ============================================================

export function readStorageValue(key) {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    const value = window.localStorage.getItem(key);
    return typeof value === "string" && value.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

export function writeStorageValue(key, value) {
  if (typeof window === "undefined" || !window.localStorage || !value) {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures in private browsing or locked-down environments.
  }
}

export function removeStorageValue(key) {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage failures in private browsing or locked-down environments.
  }
}

export function pickFirstString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

export function readRealmHintsFromUser(user) {
  return {
    realmId: pickFirstString(
      user?.learning_realm_id,
      user?.learningRealmId,
      user?.realm_id,
      user?.realmId,
      user?.app_metadata?.learning_realm_id,
      user?.app_metadata?.learningRealmId,
      user?.app_metadata?.realm_id,
      user?.app_metadata?.realmId,
      user?.user_metadata?.learning_realm_id,
      user?.user_metadata?.learningRealmId,
      user?.user_metadata?.realm_id,
      user?.user_metadata?.realmId,
    ),
    slug: pickFirstString(
      user?.learning_realm_slug,
      user?.learningRealmSlug,
      user?.realm_slug,
      user?.realmSlug,
      user?.app_metadata?.learning_realm_slug,
      user?.app_metadata?.learningRealmSlug,
      user?.app_metadata?.realm_slug,
      user?.app_metadata?.realmSlug,
      user?.user_metadata?.learning_realm_slug,
      user?.user_metadata?.learningRealmSlug,
      user?.user_metadata?.realm_slug,
      user?.user_metadata?.realmSlug,
    ),
    sourceRealmId: pickFirstString(
      user?.source_realm_id,
      user?.sourceRealmId,
      user?.vc_realm_id,
      user?.vcRealmId,
      user?.app_metadata?.source_realm_id,
      user?.app_metadata?.sourceRealmId,
      user?.app_metadata?.vc_realm_id,
      user?.app_metadata?.vcRealmId,
      user?.user_metadata?.source_realm_id,
      user?.user_metadata?.sourceRealmId,
      user?.user_metadata?.vc_realm_id,
      user?.user_metadata?.vcRealmId,
    ),
  };
}
