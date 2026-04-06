// src/controller/hydrateActor.controller.js
// ============================================================
// Hydration Engine — Hydrate Actor
// ------------------------------------------------------------
// Resolves the app-registered hydrator for an app/source pair and
// delegates app-specific domain hydration to that adapter.
// ============================================================

import { getHydrator } from '../config.js'

export async function hydrateActor({
  actorId,
  actorSource,
  appKey,
  supabase,
  context = null,
}) {
  if (!actorId) {
    return null
  }

  const hydrator = getHydrator({ appKey, actorSource })

  if (!hydrator) {
    throw new Error(
      `[HydrationEngine] No hydrator configured for app '${appKey}' and actor source '${actorSource}'.`
    )
  }

  return hydrator({
    actorId,
    actorSource,
    appKey,
    supabase,
    context,
  })
}

export default hydrateActor
