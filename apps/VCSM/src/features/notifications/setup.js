// src/features/notifications/setup.js
// ============================================================
// VCSM Notifications Engine — Startup Configuration
// ============================================================
// Wires VCSM-specific dependencies into the shared notifications
// engine via dependency injection. Must be called once before render.
//
// Follows the same pattern as chat/identity/reviews/portfolio setup.
// ============================================================

import { configureNotificationsEngine } from '@notifications'
import { hydrateAndReturnSummaries } from '@hydration'
import { supabase } from '@/services/supabase/supabaseClient'

let _configured = false

/**
 * Resolve an actor card for sender enrichment in rendered notifications.
 * Uses the hydration engine to fetch canonical actor summary.
 *
 * @param {string} actorId
 * @returns {Promise<{displayName: string, username: string, avatarUrl: string}|null>}
 */
async function resolveActorCard(actorId) {
  if (!actorId) return null

  try {
    const { rows } = await hydrateAndReturnSummaries({ actorIds: [actorId] })
    const actor = rows?.[0]
    if (!actor) return null

    return {
      displayName: actor.display_name ?? actor.displayName ?? null,
      username: actor.username ?? actor.vport_slug ?? null,
      avatarUrl: actor.photo_url ?? actor.photoUrl ?? actor.vport_avatar_url ?? null,
    }
  } catch {
    return null
  }
}

export function setupVcsmNotificationsEngine() {
  if (_configured) return
  _configured = true

  configureNotificationsEngine({
    supabaseClient: supabase,
    resolveActorCard,
  })
}
