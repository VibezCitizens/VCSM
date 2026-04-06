import {
  readFallbackRealmDAL,
  readIdentityActorByIdDAL,
  readPreferredRealmByVoidStateDAL,
} from "@/state/identity/identity.read.dal";
import { resolveAuthenticatedContext } from "@identity";
import { debugLoginEvent, debugLoginError } from "@debuggers/identity";
import { hydrateActor } from "@hydration";

const IS_DEV = import.meta.env.DEV;

export function mapProfileActor(actor, profile, realmId) {
  return {
    actorId: actor.id,
    kind: "user",
    realmId,
    isVoid: actor.is_void,
    displayName: profile?.display_name ?? null,
    username: profile?.username ?? null,
    email: profile?.email ?? null,
    avatar: profile?.photo_url ?? null,
    banner: profile?.banner_url ?? null,
    bio: profile?.bio ?? null,
    birthdate: profile?.birthdate ?? null,
    age: profile?.age ?? null,
    sex: profile?.sex ?? null,
    isAdult: profile?.is_adult ?? null,
    discoverable: profile?.discoverable ?? null,
    publish: profile?.publish ?? null,
    lastSeen: profile?.last_seen ?? null,
    createdAt: profile?.created_at ?? null,
    updatedAt: profile?.updated_at ?? null,
  };
}

export function mapVportActor(actor, vport, realmId) {
  return {
    actorId: actor.id,
    kind: "vport",
    realmId,
    isVoid: actor.is_void,
    displayName: vport?.name ?? null,
    username: vport?.slug ?? null,
    avatar: vport?.avatar_url ?? null,
    banner: vport?.banner_url ?? null,
    bio: vport?.bio ?? null,
    isActive: vport?.is_active ?? null,
    createdAt: vport?.created_at ?? null,
    updatedAt: vport?.updated_at ?? null,
    vportType: vport?.vport_type ?? null,
  };
}

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
 * Returns the same shape as before for useIdentity() consumers.
 */
export async function loadDefaultIdentityForUser({
  userId,
  savedActorId,
  resolveAttempt = 'initial',
}) {
  void savedActorId;

  try {
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

    // RLS diagnostic: check if actor has a privacy row (can_view_actor depends on it)
    if (IS_DEV) {
      try {
        const { supabase: _sb } = await import("@/services/supabase/supabaseClient")
        const { data: privRow, error: privErr } = await _sb
          .schema('vc')
          .from('actor_privacy_settings')
          .select('actor_id, is_private')
          .eq('actor_id', selectedActorId)
          .maybeSingle()
        if (import.meta.env.DEV) {
          console.log('[IdentityHydration] RLS_DIAGNOSTIC', {
            actorId: selectedActorId,
            hasPrivacyRow: !!privRow,
            isPrivate: privRow?.is_private ?? null,
            privErr: privErr?.message ?? null,
            warning: !privRow ? 'MISSING actor_privacy_settings row — can_view_actor will return NULL — RLS will block vc.actors read' : null,
          })
        }
      } catch (_) {}
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
      return null
    }

    if (!actorRow) {
      debugLoginEvent('HYDRATION_ACTOR_READ_EMPTY', {
        phase: 'hydration', status: 'error',
        message: `vc.actors returned null for ${selectedActorId}`,
        payload: { actorId: selectedActorId },
      })
      return null
    }

    debugLoginEvent('HYDRATION_ACTOR_READ_SUCCESS', {
      phase: 'hydration', status: 'success',
      payload: { actorId: actorRow.id, kind: actorRow.kind, profileId: actorRow.profile_id },
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
      }
    }

    return hydratedIdentity;
  } catch (error) {
    debugLoginError('ENGINE_RESOLVE_ERROR', error, {
      phase: 'engine',
      payload: { appKey: 'vcsm', userId, errorCode: error?.code },
    })
    return null;
  }
}

/**
 * List actor choices through the shared identity engine.
 */
export async function loadOwnedActorChoices(_userId) {
  try {
    const ctx = await resolveAuthenticatedContext({
      appKey: "vcsm",
      skipLoginRecord: true,
    });

    if (!ctx?.availableActors?.length) return [];

    const actors = await Promise.all(
      ctx.availableActors.map(async (link) => {
        const actor = await readIdentityActorByIdDAL(link.actorId);
        return { actor_id: link.actorId, actor, _linkId: link.id };
      })
    );

    return actors.filter((row) => row.actor);
  } catch (error) {
    if (IS_DEV) {
      console.warn("[Identity] Engine actor choices failed:", error?.message);
    }
    return [];
  }
}
