// engines/hydration/index.js
// ============================================================
// Hydration Engine — Entry Point
// ============================================================

// Config
export { configureHydrationEngine, getHydrationConfig, getHydrator, getSupabaseClient } from './src/config.js'

// Store
export { useActorStore } from './src/store.js'

// Hydration pipeline
export { hydrateActorsFromRows, hydrateActorsByIds, hydrateAndReturnSummaries } from './src/hydrate.js'

// Normalization
export { normalizeActorSummary, normalizeActorSummaries } from './src/normalize.js'

// Extraction
export { extractActorIdsForHydration } from './src/extract.js'

// DAL
export { getActorSummariesByIdsDAL } from './src/dal.js'

// Consumer hook
export { useActorSummary } from './src/useActorSummary.js'

// Legacy hydrator (existing)
export { hydrateActor } from './src/controller/hydrateActor.controller.js'
