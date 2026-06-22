// src/features/identity/resolvers/vcsmIdentity.resolver.js
// ============================================================
// VCSM — App Context Resolver
// ------------------------------------------------------------
// Resolves actor identity for the VCSM app context.
// Injected into the identity engine via configureIdentityEngine().
//
// Supports multi-actor accounts (citizen + vport).
// Deterministically selects the active actor using preference/fallback order.
// ============================================================

/**
 * Create the VCSM all-in-one app context resolver.
 *
 * Reads ALL provisioned platform actor links for the account.
 * Supports multi-actor accounts (citizen + vport).
 * VCSM does not have LMS role semantics — roleKeys is always empty.
 *
 * @param {Object} supabase - Supabase client
 * @returns {Function} resolveAppContext
 */
import { captureVcsmError } from '@/services/monitoring/vcsmMonitoring';

export function createVcsmAppContextResolver(supabase) {
  return async function resolveAppContext({ userAppAccountId, userId, trace = null }) {
    // Read ALL active VC actor links for this account (supports multi-actor)
    trace?.report?.({
      step: 'ACTOR_LINKS_READ_START',
      status: 'start',
      dalName: 'createVcsmAppContextResolver.resolveAppContext',
      fileName: 'vcsmIdentity.resolver.js',
      queryMode: 'array',
      rowCount: null,
      errorCode: null,
      errorMessage: null,
      failureMode: null,
    })

    const { data: links, error: linkError } = await supabase
      .schema('platform')
      .from('user_app_actor_links')
      .select(`
        id,
        user_app_account_id,
        app_id,
        actor_id,
        actor_kind,
        actor_source,
        is_primary,
        is_switchable,
        status,
        display_name_snapshot,
        avatar_url_snapshot,
        meta,
        created_at
      `)
      .eq('user_app_account_id', userAppAccountId)
      .eq('actor_source', 'vc')
      .eq('status', 'active')
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })

    if (linkError) {
      trace?.report?.({
        step: 'ACTOR_LINKS_READ_ERROR',
        status: 'error',
        message: linkError?.message,
        error: linkError,
        dalName: 'createVcsmAppContextResolver.resolveAppContext',
        fileName: 'vcsmIdentity.resolver.js',
        queryMode: 'array',
        rowCount: null,
        errorCode: linkError?.code ?? null,
        errorMessage: linkError?.message ?? null,
        failureMode: 'THROWN_ERROR',
      })
      captureVcsmError({
        feature: 'identity',
        module: 'vcsmIdentity.resolver',
        behavior_id: 'behavior.identity.actor_link_read',
        severity: 'error',
        message: `vcsmIdentity.resolver: platform.user_app_actor_links read failed — ${linkError?.code ?? linkError?.message ?? 'unknown'}`,
        error_name: linkError?.name,
        stack: linkError?.stack,
        operation: 'resolveAppContext',
        context: { dbErrorCode: linkError?.code ?? null, hasAccountContext: !!userAppAccountId },
      });
      throw linkError
    }

    const rowCount = Array.isArray(links) ? links.length : 0

    if (!links || links.length === 0) {
      trace?.report?.({
        step: 'ACTOR_LINKS_READ_SUCCESS',
        status: 'success',
        message: 'No active VCSM actor links found',
        dalName: 'createVcsmAppContextResolver.resolveAppContext',
        fileName: 'vcsmIdentity.resolver.js',
        queryMode: 'array',
        rowCount,
        errorCode: null,
        errorMessage: null,
        failureMode: 'ZERO_ROWS',
      })
      captureVcsmError({
        feature: 'identity',
        module: 'vcsmIdentity.resolver',
        behavior_id: 'behavior.identity.actor_link_read',
        severity: 'error',
        message: 'vcsmIdentity.resolver: no active actor links found for account — identity cannot be resolved without self-heal',
        operation: 'resolveAppContext',
        context: { hasAccountContext: !!userAppAccountId, actorCount: 0, engineResolved: false },
      });
      return {
        actorLinks:         [],
        roleKeys:           [],
        capabilityKeys:     [],
        isSuspended:        false,
        defaultDestination: null,
      }
    }

    trace?.report?.({
      step: 'ACTOR_LINKS_READ_SUCCESS',
      status: 'success',
      message: 'Resolved active VCSM actor links',
      dalName: 'createVcsmAppContextResolver.resolveAppContext',
      fileName: 'vcsmIdentity.resolver.js',
      queryMode: 'array',
      rowCount,
      errorCode: null,
      errorMessage: null,
      failureMode: null,
      actorIds: links.map((link) => link.actor_id ?? null),
      actorLinkIds: links.map((link) => link.id ?? null),
      userId,
    })

    return {
      actorLinks: links,
      roleKeys:           [],
      capabilityKeys:     [],
      isSuspended:        false,
      defaultDestination: '/CentralFeed',
    }
  }
}
