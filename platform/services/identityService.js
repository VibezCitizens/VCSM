// platform/services/identityService.js
// ============================================================
// Identity Service — Platform Service Layer
// ============================================================
// Stable API for identity resolution, actor context, and
// platform bootstrap orchestration.
//
// Wraps the identity engine and hydration engine into a single
// service boundary that apps can call instead of orchestrating
// engine calls + DAL reads + hydration themselves.
//
// Consumers: apps/VCSM, apps/wentrex (future), apps/Traffic (future)
// Dependencies: engines/identity, engines/hydration
// ============================================================

import { resolveAuthenticatedContext, switchActiveActor } from '../../engines/identity/index.js'
import { hydrateActorsByIds, useActorStore } from '../../engines/hydration/index.js'

/**
 * Resolve full platform context for the current authenticated user.
 *
 * Orchestrates: session -> app -> access -> account -> actor links -> active actor
 *
 * @param {Object} options
 * @param {string} options.appKey — app identifier ('vcsm', 'wentrex', 'traffic')
 * @param {string} [options.resolveAttempt] — dedup key for retry tracking
 * @returns {Promise<PlatformContext|null>}
 *
 * PlatformContext shape:
 *   {
 *     userId: string,
 *     userAppAccountId: string|null,
 *     activeActor: { actorId, actorSource, actorKind, isPrimary, id (linkId) },
 *     availableActors: Array<{ actorId, actorSource, actorKind, isPrimary, id }>,
 *     roleKeys: string[],
 *     capabilityKeys: string[],
 *   }
 */
export async function getPlatformContext({ appKey, resolveAttempt = 'initial' }) {
  if (!appKey) return null

  const ctx = await resolveAuthenticatedContext({
    appKey,
    skipLoginRecord: true,
    resolveAttempt,
  })

  if (!ctx?.activeActor?.actorId) return null

  return {
    userId: ctx.userId ?? null,
    userAppAccountId: ctx.userAppAccountId ?? null,
    activeActor: {
      actorId: ctx.activeActor.actorId,
      actorSource: ctx.activeActor.actorSource ?? 'vc',
      actorKind: ctx.activeActor.actorKind ?? null,
      isPrimary: ctx.activeActor.isPrimary ?? null,
      linkId: ctx.activeActor.id ?? null,
    },
    availableActors: (ctx.availableActors ?? []).map((link) => ({
      actorId: link.actorId,
      actorSource: link.actorSource ?? 'vc',
      actorKind: link.actorKind ?? null,
      isPrimary: link.isPrimary ?? null,
      linkId: link.id ?? null,
    })),
    roleKeys: ctx.roleKeys ?? [],
    capabilityKeys: ctx.capabilityKeys ?? [],
  }
}

/**
 * Get the active actor from the current platform context.
 *
 * Convenience wrapper — resolves context then returns just the active actor.
 *
 * @param {Object} options
 * @param {string} options.appKey
 * @returns {Promise<ActiveActor|null>}
 *
 * ActiveActor shape:
 *   { actorId, actorSource, actorKind, isPrimary, linkId }
 */
export async function getActiveActor({ appKey }) {
  const ctx = await getPlatformContext({ appKey })
  return ctx?.activeActor ?? null
}

/**
 * Get all actor links available to the current user.
 *
 * @param {Object} options
 * @param {string} options.appKey
 * @returns {Promise<Array<{ actorId, actorSource, actorKind, isPrimary, linkId }>>}
 */
export async function getActorLinks({ appKey }) {
  const ctx = await getPlatformContext({ appKey })
  return ctx?.availableActors ?? []
}

/**
 * Switch the active actor for the current user session.
 *
 * Delegates to the identity engine's switchActiveActor.
 *
 * @param {Object} options
 * @param {string} options.appKey
 * @param {string} options.actorLinkId — the actor_link ID to switch to
 * @returns {Promise<boolean>} — true if switch succeeded
 */
export async function switchActor({ appKey, actorLinkId }) {
  if (!appKey || !actorLinkId) return false

  try {
    await switchActiveActor({ appKey, actorLinkId })
    return true
  } catch {
    return false
  }
}

/**
 * Get combined user app state: context + hydrated actor summaries.
 *
 * Resolves platform context, then hydrates all available actors
 * into the actor store so downstream consumers have warm cache.
 *
 * @param {Object} options
 * @param {string} options.appKey
 * @returns {Promise<UserAppState|null>}
 *
 * UserAppState shape:
 *   {
 *     ...PlatformContext,
 *     hydratedActiveActor: object|null,
 *   }
 */
export async function getUserAppState({ appKey }) {
  const ctx = await getPlatformContext({ appKey })
  if (!ctx) return null

  const allActorIds = ctx.availableActors.map((a) => a.actorId).filter(Boolean)

  if (allActorIds.length) {
    await hydrateActorsByIds(allActorIds)
  }

  const store = useActorStore.getState()
  const hydratedActiveActor = store.getActor(ctx.activeActor.actorId)

  return {
    ...ctx,
    hydratedActiveActor,
  }
}
