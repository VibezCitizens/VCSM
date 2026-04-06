// src/services/actorService.js
// ============================================================
// Identity Engine — Actor Service
// Resolves available actors and the active actor for an account.
//
// Active actor selection priority:
//   1. preferences.active_actor_link_id (user's explicit choice)
//   2. state.last_actor_link_id (last used)
//   3. The primary actor link (is_primary = true)
//   4. The first active actor link (fallback)
// ============================================================

import { dalGetActorLinksForAccount, dalGetActorLinkById } from '../dal/actorLinks.read.dal.js'
import { ActorLinkModel } from '../model/ActorLink.model.js'
import { getActorEnricher } from '../config.js'

/**
 * Fetch and enrich all active actor links for an account.
 *
 * @param {Object} params
 * @param {string} params.userAppAccountId
 * @returns {Promise<import('../types/index.js').DomainActorLink[]>}
 */
export async function resolveAvailableActors({ userAppAccountId, trace = null }) {
  const rows = await dalGetActorLinksForAccount({ userAppAccountId, trace })

  // Apply app-injected enrichment (e.g. live display_name from vc.actors)
  const enricher = getActorEnricher()
  const enriched = enricher ? await _tryEnrich(enricher, rows) : rows

  return enriched.map(ActorLinkModel)
}

/**
 * Resolve the currently active actor for an account.
 *
 * @param {Object} params
 * @param {import('../types/index.js').DomainActorLink[]} params.availableActors
 * @param {import('../types/index.js').DomainPreferences|null} params.preferences
 * @param {import('../types/index.js').DomainState|null} params.state
 * @returns {import('../types/index.js').DomainActorLink|null}
 */
export function resolveActiveActor({ availableActors, preferences, state, trace = null }) {
  trace?.report?.({
    step: 'ACTIVE_ACTOR_SELECT_START',
    status: 'start',
    dalName: 'resolveActiveActor',
    fileName: 'actorService.js',
    queryMode: 'array',
    rowCount: Array.isArray(availableActors) ? availableActors.length : 0,
    errorCode: null,
    errorMessage: null,
    failureMode: null,
  })

  if (!availableActors.length) {
    trace?.report?.({
      step: 'ACTIVE_ACTOR_SELECT_ERROR',
      status: 'error',
      message: 'No active actor candidates',
      dalName: 'resolveActiveActor',
      fileName: 'actorService.js',
      queryMode: 'array',
      rowCount: 0,
      errorCode: null,
      errorMessage: 'No active actor candidates',
      failureMode: 'NO_ACTIVE_ACTOR',
    })
    return null
  }

  const byId = (id) => availableActors.find((a) => a.id === id) ?? null

  // 1. Explicit user preference
  let selectionReason = null

  if (preferences?.activeActorLinkId) {
    const pick = byId(preferences.activeActorLinkId)
    if (pick) {
      selectionReason = 'PREFS_ACTIVE'
      trace?.report?.({
        step: 'ACTIVE_ACTOR_SELECT_SUCCESS',
        status: 'success',
        message: 'Selected active actor from preferences',
        dalName: 'resolveActiveActor',
        fileName: 'actorService.js',
        queryMode: 'array',
        rowCount: availableActors.length,
        errorCode: null,
        errorMessage: null,
        failureMode: null,
        selectedActorId: pick.actorId,
        selectedActorLinkId: pick.id,
        selectionReason,
      })
      return pick
    }
  }

  // 2. Last used actor from state
  if (state?.lastActorLinkId) {
    const pick = byId(state.lastActorLinkId)
    if (pick) {
      selectionReason = 'STATE_LAST'
      trace?.report?.({
        step: 'ACTIVE_ACTOR_SELECT_SUCCESS',
        status: 'success',
        message: 'Selected active actor from state',
        dalName: 'resolveActiveActor',
        fileName: 'actorService.js',
        queryMode: 'array',
        rowCount: availableActors.length,
        errorCode: null,
        errorMessage: null,
        failureMode: null,
        selectedActorId: pick.actorId,
        selectedActorLinkId: pick.id,
        selectionReason,
      })
      return pick
    }
  }

  // 3. Primary actor
  const primary = availableActors.find((a) => a.isPrimary)
  if (primary) {
    selectionReason = 'PRIMARY_FALLBACK'
    trace?.report?.({
      step: 'ACTIVE_ACTOR_SELECT_SUCCESS',
      status: 'success',
      message: 'Selected primary actor fallback',
      dalName: 'resolveActiveActor',
      fileName: 'actorService.js',
      queryMode: 'array',
      rowCount: availableActors.length,
      errorCode: null,
      errorMessage: null,
      failureMode: null,
      selectedActorId: primary.actorId,
      selectedActorLinkId: primary.id,
      selectionReason,
    })
    return primary
  }

  // 4. First available
  const first = availableActors[0]
  trace?.report?.({
    step: 'ACTIVE_ACTOR_SELECT_SUCCESS',
    status: 'success',
    message: 'Selected first available actor fallback',
    dalName: 'resolveActiveActor',
    fileName: 'actorService.js',
    queryMode: 'array',
    rowCount: availableActors.length,
    errorCode: null,
    errorMessage: null,
    failureMode: null,
    selectedActorId: first?.actorId ?? null,
    selectedActorLinkId: first?.id ?? null,
    selectionReason: 'FIRST_FALLBACK',
  })
  return first
}

async function _tryEnrich(enricher, rows) {
  try {
    return await enricher(rows)
  } catch (_err) {
    return rows
  }
}
