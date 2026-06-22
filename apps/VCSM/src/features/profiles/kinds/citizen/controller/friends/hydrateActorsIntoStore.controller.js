// [CITIZEN_ONLY] — used by friends system
// Re-export from hydration engine (canonical source)
import { hydrateActorsByIds } from '@hydration'

export async function hydrateActorsIntoStore(actorIds = []) {
  return hydrateActorsByIds(actorIds)
}
