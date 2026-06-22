import { readUserActorByProfileIdDAL } from "@/features/identity/identity.read.dal";
import { ensureVcsmPlatformBootstrap } from "@/features/identity/adapters/identityOps.adapter";
import {
  finalizeAccountState,
  switchActiveActor as engineSwitchActiveActor,
  invalidateIdentityResultCache,
} from "@identity";
import { captureVcsmError } from "@/services/monitoring/vcsmMonitoring";

export async function findSelfHealActorForUser(userId) {
  const row = await readUserActorByProfileIdDAL(userId);
  if (!row?.id) {
    captureVcsmError({
      feature: 'identity',
      module: 'identitySelfHeal.controller',
      behavior_id: 'behavior.identity.self_heal',
      severity: 'warning',
      message: 'findSelfHealActorForUser: no vc.actors row found — self-heal actor unavailable',
      operation: 'readUserActorByProfileIdDAL',
      context: { hasUser: !!userId, hasSelfHealActor: false, healPhase: 'discovery' },
    });
  }
  return row?.id ? { actorId: row.id } : null;
}

export async function bootstrapIdentitySelfHeal({ userId, actorId }) {
  const result = await ensureVcsmPlatformBootstrap({ userId, actorId });
  if (!result.ok) {
    captureVcsmError({
      feature: 'identity',
      module: 'identitySelfHeal.controller',
      behavior_id: 'behavior.identity.self_heal',
      severity: 'error',
      message: `bootstrapIdentitySelfHeal failed: ${result.error ?? 'unknown'}`,
      operation: 'ensureVcsmPlatformBootstrap',
      context: {
        bootstrapOk: false,
        bootstrapError: result.error ?? 'unknown',
        healPhase: 'bootstrap',
        hasSelfHealActor: !!actorId,
      },
    });
    return result;
  }

  // Provision (platform.provision_vcsm_identity) unconditionally overwrote
  // user_app_preferences.active_actor_link_id to the self-heal actor. The identity
  // engine keeps a 120s result cache that still holds the pre-heal context pointing
  // at the unhydratable active actor. Clear it so the retry resolve reads fresh DB
  // truth and selects the self-heal actor — enabling same-boot recovery.
  //
  // Called with no argument (clear-all): invalidateIdentityResultCache(userId) targets
  // the wrong key — the cache is keyed `${userId}:${appKey}`, so a raw-userId delete is
  // a silent no-op. No-arg clear-all matches every existing caller (switchActiveActor,
  // logoutCleanup, refreshAvailableActors).
  invalidateIdentityResultCache();

  captureVcsmError({
    feature: 'identity',
    module: 'identitySelfHeal.controller',
    behavior_id: 'behavior.identity.self_heal',
    severity: 'warning',
    message: 'IDENTITY_BOOT_RECOVERY_CACHE_BUST: engine result cache cleared after self-heal provision — retry will resolve fresh preference',
    operation: 'invalidateIdentityResultCache',
    is_handled: true,
    context: {
      sessionUserId: userId,
      fallbackActorId: actorId,
      userAppAccountId: result.userAppAccountId ?? null,
      selfHealUsed: true,
      recoveryCode: 'CACHE_BUSTED_RETRY',
    },
  });

  return result;
}

export async function finalizeSelfHealedIdentity(identityDetails) {
  const meta = identityDetails?._engineMeta ?? {};
  if (!meta.userAppAccountId || !meta.actorLinkId) {
    return {
      skipped: true,
      preferenceWritten: false,
      stateFinalized: false,
      stateError: null,
      userAppAccountId: meta.userAppAccountId ?? null,
      actorLinkId: meta.actorLinkId ?? null,
    };
  }

  await engineSwitchActiveActor({
    userAppAccountId: meta.userAppAccountId,
    actorLinkId: meta.actorLinkId,
  });

  try {
    await finalizeAccountState({
      userAppAccountId: meta.userAppAccountId,
      actorLinkId: meta.actorLinkId,
    });

    return {
      skipped: false,
      preferenceWritten: true,
      stateFinalized: true,
      stateError: null,
      userAppAccountId: meta.userAppAccountId,
      actorLinkId: meta.actorLinkId,
    };
  } catch (stateError) {
    return {
      skipped: false,
      preferenceWritten: true,
      stateFinalized: false,
      stateError,
      userAppAccountId: meta.userAppAccountId,
      actorLinkId: meta.actorLinkId,
    };
  }
}
