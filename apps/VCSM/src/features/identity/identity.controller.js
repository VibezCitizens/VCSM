import {
  readActorPrivacyDiagnosticDAL,
  readFallbackRealmDAL,
  readIdentityActorByIdDAL,
  readIdentityActorsByIdsDAL,
  readPreferredRealmByVoidStateDAL,
} from "@/features/identity/identity.read.dal";
import {
  resolveAuthenticatedContext,
} from "@identity";
import { debugLoginEvent, debugLoginError } from "@debuggers/identity";
import { hydrateActor } from "@hydration";
import { captureVcsmError, captureIdentityError } from "@/services/monitoring/vcsmMonitoring";
import {
  _identityInflight,
  _identityResolveCounts,
  logIdentityResolveCount,
} from "@/features/identity/identity.controller.inflight";

const IS_DEV = import.meta.env.DEV;

// Sentinel returned when the resolved actor's account has been soft-deleted.
// Callers (identityContext) must detect this and force-logout rather than
// treating it as a missing identity (which would trigger self-heal).
export const DELETED_ACCOUNT_SENTINEL = Object.freeze({ __accountDeleted: true });

export async function resolveRealmId(actor) {
  if (!actor) return null;

  try {
    const preferred = await readPreferredRealmByVoidStateDAL(actor.is_void);
    if (preferred?.id) return preferred.id;
  } catch (error) {
    if (IS_DEV) {
      console.warn("[Identity] resolveRealmId preferred query failed", error);
    }
  }

  try {
    const fallback = await readFallbackRealmDAL();
    return fallback?.id ?? null;
  } catch (error) {
    if (IS_DEV) {
      console.warn("[Identity] resolveRealmId fallback query failed", error);
    }
    captureVcsmError({
      feature: 'identity',
      module: 'identity.controller',
      behavior_id: 'behavior.identity.realm_resolution',
      severity: 'warning',
      message: 'resolveRealmId: both preferred and fallback realm queries failed — realmId will be null',
      error_name: error?.name,
      stack: error?.stack,
      operation: 'resolveRealmId',
      context: { dbErrorCode: error?.code ?? null },
    });
    return null;
  }
}

export async function hydrateIdentityActor(actor) {
  if (!actor?.id) return null;

  return hydrateActor({
    appKey: "vcsm",
    actorSource: "vc",
    actorId: actor.id,
    context: { actor },
  });
}

export async function loadIdentityForActorId(actorId) {
  return hydrateActor({
    appKey: "vcsm",
    actorSource: "vc",
    actorId,
  });
}

/**
 * Resolve identity through the shared identity engine.
 *
 * The engine handles:
 *   session → app → access → account → actor links → preferences → active actor
 *
 * This function then enriches the engine-selected actor with VCSM domain data
 * through the shared hydration engine and the app-owned VCSM hydrator adapter.
 *
 * Returns hydrated identity details. The provider reduces the public
 * useIdentity() surface to actor-first { actorId, kind }.
 */
export async function loadDefaultIdentityForUser({
  userId,
  savedActorId,
  resolveAttempt = 'initial',
}) {
  void savedActorId;

  // In-flight dedup: concurrent calls with same userId return same promise
  const inflightKey = `${userId}:${resolveAttempt}`;
  const existing = _identityInflight.get(inflightKey);
  if (existing) {
    if (IS_DEV) debugLoginEvent('ENGINE_RESOLVE_DEDUPED', { phase: 'engine', status: 'info', message: `Reusing in-flight resolve for ${userId?.slice(0, 8)}` });
    return existing;
  }

  const pending = _loadDefaultIdentityForUserInner({ userId, resolveAttempt });
  _identityInflight.set(inflightKey, pending);
  pending.finally(() => _identityInflight.delete(inflightKey));
  return pending;
}

async function _loadDefaultIdentityForUserInner({ userId, resolveAttempt }) {
  try {
    logIdentityResolveCount(userId, resolveAttempt);

    debugLoginEvent('ENGINE_RESOLVE_START', {
      phase: 'engine',
      payload: { appKey: 'vcsm', userId, resolveAttempt },
    })

    const t0 = performance.now()
    const ctx = await resolveAuthenticatedContext({
      appKey: "vcsm",
      skipLoginRecord: true,
      resolveAttempt,
    });
    const engineMs = Math.round(performance.now() - t0)

    if (!ctx?.activeActor?.actorId) {
      debugLoginEvent('ENGINE_RESOLVE_EMPTY', { phase: 'engine', status: 'warn', message: 'No active actor from engine' })
      return null;
    }

    debugLoginEvent('ENGINE_RESOLVE_SUCCESS', {
      phase: 'engine', status: 'success',
      message: `Engine resolved in ${engineMs}ms`,
      payload: {
        appKey: 'vcsm',
        userId,
        userAppAccountId: ctx.userAppAccountId ?? null,
        actorId: ctx.activeActor.actorId,
        actorLinkId: ctx.activeActor.id ?? null,
        actorSource: ctx.activeActor.actorSource ?? 'vc',
        actorCount: ctx.availableActors?.length ?? 0,
        roleKeys: ctx.roleKeys ?? [],
        resolveAttempt,
      },
    })

    debugLoginEvent('ACTIVE_ACTOR_SELECTED', {
      phase: 'engine', status: 'success',
      payload: {
        actorId: ctx.activeActor.actorId,
        actorLinkId: ctx.activeActor.id ?? null,
        actorSource: ctx.activeActor.actorSource ?? 'vc',
        actorKind: ctx.activeActor.actorKind ?? null,
        isPrimary: ctx.activeActor.isPrimary ?? null,
        resolveAttempt,
      },
    })

    // Hydrate with VCSM domain data
    const selectedActorId = ctx.activeActor.actorId
    debugLoginEvent('HYDRATION_START', { phase: 'hydration', payload: {
      actorId: selectedActorId,
      actorLinkId: ctx.activeActor.id,
      actorKind: ctx.activeActor.actorKind,
      availableActorCount: ctx.availableActors?.length ?? 0,
      allActorIds: ctx.availableActors?.map(a => a.actorId) ?? [],
    }})
    const hydrationT0 = performance.now()

    // Monitoring only (no control-flow change): engine resolved an active actor but
    // VCSM hydration returned null. Distinguishes "active preference points at an
    // unhydratable actor" (recoverable via self-heal) from "engine returned no actor".
    const _flagActiveUnhydratable = (reason) => captureVcsmError({
      feature: 'identity',
      module: 'identity.controller',
      behavior_id: 'behavior.identity.active_unhydratable',
      severity: 'error',
      message: `IDENTITY_ACTIVE_UNHYDRATABLE: engine resolved active actor but hydration returned null (${reason})`,
      operation: 'loadDefaultIdentityForUser',
      is_handled: true,
      context: {
        sessionUserId: userId,
        badActorId: selectedActorId,
        badActorLinkId: ctx.activeActor.id ?? null,
        userAppAccountId: ctx.userAppAccountId ?? null,
        resolveAttempt,
        recoveryCode: 'ACTIVE_ACTOR_UNHYDRATABLE',
        reason,
      },
    });

    // RLS diagnostic: check if actor has a privacy row (can_view_actor depends on it)
    // Gated behind explicit opt-in flag to avoid extra DB read on every identity load.
    if (IS_DEV && import.meta.env.VITE_DEBUG_RLS_DIAGNOSTIC === '1') {
      try {
        const privRow = await readActorPrivacyDiagnosticDAL(selectedActorId)
        console.log('[IdentityHydration] RLS_DIAGNOSTIC', {
          actorId: selectedActorId,
          hasPrivacyRow: !!privRow,
          isPrivate: privRow?.is_private ?? null,
          privErr: null,
          warning: !privRow ? 'MISSING actor_privacy_settings row — can_view_actor will return NULL — RLS will block vc.actors read' : null,
        })
      } catch (privErr) {
        console.log('[IdentityHydration] RLS_DIAGNOSTIC', {
          actorId: selectedActorId,
          hasPrivacyRow: false,
          isPrivate: null,
          privErr: privErr?.message ?? null,
          warning: 'actor_privacy_settings diagnostic read failed',
        })
      }
    }

    let actorRow = null
    try {
      actorRow = await readIdentityActorByIdDAL(selectedActorId)
    } catch (actorReadErr) {
      // .single() on vc.actors can throw PGRST116 if RLS blocks the row.
      // This happens when actor_privacy_settings row is missing (can_view_actor returns NULL).
      debugLoginEvent('HYDRATION_ACTOR_READ_ERROR', {
        phase: 'hydration', status: 'error',
        message: `vc.actors read failed for ${selectedActorId}: ${actorReadErr?.message}`,
        payload: {
          actorId: selectedActorId,
          code: actorReadErr?.code,
          hint: 'If PGRST116: likely missing actor_privacy_settings row for this actor — can_view_actor returns NULL — RLS blocks row',
        },
      })
      captureVcsmError({
        feature: 'identity',
        module: 'identity.controller',
        behavior_id: 'behavior.identity.actor_row_read',
        severity: 'error',
        message: `vc.actors read failed: ${actorReadErr?.code ?? actorReadErr?.message ?? 'unknown'}`,
        error_name: actorReadErr?.name,
        stack: actorReadErr?.stack,
        operation: 'readIdentityActorByIdDAL',
        context: { hasActorId: !!selectedActorId, dbErrorCode: actorReadErr?.code ?? null },
      });
      _flagActiveUnhydratable('actor_read_error')
      return null
    }

    if (!actorRow) {
      debugLoginEvent('HYDRATION_ACTOR_READ_EMPTY', {
        phase: 'hydration', status: 'error',
        message: `vc.actors returned null for ${selectedActorId}`,
        payload: { actorId: selectedActorId },
      })
      _flagActiveUnhydratable('actor_row_null')
      return null
    }

    if (actorRow.is_deleted) {
      debugLoginEvent('HYDRATION_ACTOR_DELETED', {
        phase: 'hydration', status: 'warn',
        message: `Actor ${selectedActorId} is soft-deleted — returning DELETED_ACCOUNT_SENTINEL`,
        payload: { actorId: selectedActorId, kind: actorRow.kind },
      })
      return DELETED_ACCOUNT_SENTINEL
    }

    debugLoginEvent('HYDRATION_ACTOR_READ_SUCCESS', {
      phase: 'hydration', status: 'success',
      payload: { actorId: actorRow.id, kind: actorRow.kind },
    })

    const hydratedIdentity = await hydrateIdentityActor(actorRow)
    const hydrationMs = Math.round(performance.now() - hydrationT0)

    if (hydratedIdentity) {
      debugLoginEvent('HYDRATION_SUCCESS', {
        phase: 'hydration', status: 'success',
        message: `Hydrated in ${hydrationMs}ms`,
        payload: { actorId: hydratedIdentity.actorId, kind: hydratedIdentity.kind },
      })

      // Attach engine metadata so identityContext can include it in the final snapshot
      hydratedIdentity._engineMeta = {
        userId: ctx.userId ?? null,
        userAppAccountId: ctx.userAppAccountId ?? null,
        actorLinkId: ctx.activeActor.id ?? null,
        actorSource: ctx.activeActor.actorSource ?? 'vc',
        engineResolved: true,
        availableActors: ctx.availableActors ?? [],
      }
    } else {
      captureVcsmError({
        feature: 'identity',
        module: 'identity.controller',
        behavior_id: 'behavior.identity.hydrate_actor',
        severity: 'error',
        message: 'hydrateIdentityActor returned null — hydrator produced no identity object',
        operation: 'hydrateIdentityActor',
        context: { identityKind: actorRow.kind ?? null, hasActorId: !!actorRow.id },
      });
      _flagActiveUnhydratable('hydrator_returned_null')
    }

    return hydratedIdentity;
  } catch (error) {
    debugLoginError('ENGINE_RESOLVE_ERROR', error, {
      phase: 'engine',
      payload: { appKey: 'vcsm', userId, errorCode: error?.code },
    })
    captureIdentityError(error, {
      module: 'identity.controller',
      behavior_id: 'behavior.identity.engine_context',
      severity: error?.code === 'APP_NOT_FOUND' ? 'fatal' : 'error',
      operation: 'loadDefaultIdentityForUser',
      context: {
        phase: 'engine',
        resolveAttempt: resolveAttempt ?? 'initial',
        errorCode: error?.code ?? null,
      },
    });
    return null;
  }
}

/**
 * List actor choices through the shared identity engine.
 * Uses a single batched query instead of N+1 individual actor reads.
 *
 * @param {string} _userId
 * @param {{ ctx?: object }} [opts] - Pass a pre-resolved engine ctx (e.g. from
 *   useIdentityEngineQuery cache) to skip the resolveAuthenticatedContext call.
 */
export async function loadOwnedActorChoices(_userId, { ctx: preResolvedCtx } = {}) {
  try {
    const ctx = preResolvedCtx ?? await resolveAuthenticatedContext({
      appKey: "vcsm",
      skipLoginRecord: true,
    });

    if (!ctx?.availableActors?.length) return [];

    // Batch read: single query for all actor IDs instead of N+1
    const actorIds = ctx.availableActors.map((link) => link.actorId).filter(Boolean);
    if (!actorIds.length) return [];

    const actorRows = await readIdentityActorsByIdsDAL(actorIds);
    const actorMap = new Map((actorRows || []).map((a) => [a.id, a]));
    const linkIdMap = new Map(ctx.availableActors.map((link) => [link.actorId, link.id]));

    return actorIds
      .map((id) => ({
        actor_id: id,
        actor: actorMap.get(id) ?? null,
        _linkId: linkIdMap.get(id) ?? null,
      }))
      .filter((row) => row.actor);
  } catch (error) {
    if (IS_DEV) {
      console.warn("[Identity] Engine actor choices failed:", error?.message);
    }
    return [];
  }
}
