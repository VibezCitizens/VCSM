// src/config.js
// ============================================================
// Hydration Engine — Dependency Injection
// ------------------------------------------------------------
// Apps must call configureHydrationEngine() before use.
// Hydrators are registered per app and actor source.
// ============================================================

let _config = {
  hydrators: {},
  supabaseClient: null,
}

function mergeHydrators(currentHydrators = {}, nextHydrators = {}) {
  const merged = { ...currentHydrators }

  for (const [appKey, sourceMap] of Object.entries(nextHydrators)) {
    merged[appKey] = {
      ...(merged[appKey] ?? {}),
      ...(sourceMap ?? {}),
    }
  }

  return merged
}

export function configureHydrationEngine(config = {}) {
  _config = {
    ..._config,
    ...config,
    hydrators: mergeHydrators(_config.hydrators, config.hydrators),
  }
}

export function getHydrationConfig() {
  return _config
}

export function getHydrator({ appKey, actorSource }) {
  if (!appKey || !actorSource) {
    return null
  }

  return _config.hydrators?.[appKey]?.[actorSource] ?? null
}

export function getSupabaseClient() {
  return _config.supabaseClient ?? null
}
