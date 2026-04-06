// src/features/profiles/controller/friends/hydrateActorsIntoStore.controller.js
// Re-export from hydration engine (canonical source)
import { hydrateActorsByIds } from '@hydration'

export async function hydrateActorsIntoStore(actorIds = []) {
  return hydrateActorsByIds(actorIds)
}
