import { readUserActorByProfileIdDAL } from "@/state/identity/identity.read.dal";
import { ensureVcsmPlatformBootstrap } from "@/features/identity/controller/ensureVcsmPlatformBootstrap.controller.js";
import {
  finalizeAccountState,
  switchActiveActor as engineSwitchActiveActor,
} from "@identity";

export async function findSelfHealActorForUser(userId) {
  const row = await readUserActorByProfileIdDAL(userId);
  return row?.id ? { actorId: row.id } : null;
}

export async function bootstrapIdentitySelfHeal({ userId, actorId }) {
  return ensureVcsmPlatformBootstrap({ userId, actorId });
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
