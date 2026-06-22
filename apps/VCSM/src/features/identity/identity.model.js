export function toPublicIdentity(source) {
  if (!source?.actorId || !source?.kind) return null

  return {
    actorId: source.actorId,
    kind: source.kind,
  }
}

export function getIdentityEngineContext(identityDetails) {
  const meta = identityDetails?._engineMeta
  if (!identityDetails?.actorId || !meta?.engineResolved) return null

  return {
    userId: meta.userId ?? null,
    userAppAccountId: meta.userAppAccountId ?? null,
    availableActors: meta.availableActors ?? [],
    activeActor: {
      actorId: identityDetails.actorId,
      id: meta.actorLinkId ?? null,
      actorSource: meta.actorSource ?? 'vc',
    },
  }
}

export function isBlockedVportIdentity(identityDetails) {
  return (
    identityDetails?.kind === 'vport' &&
    (
      identityDetails?.isDeleted === true ||
      identityDetails?.isVoid === true ||
      identityDetails?.isActive === false
    )
  )
}

// mapProfileActor / mapVportActor — MOVED to features/hydration/model/vcsmActorMappers.model.js
// (IDENTITY-BOUNDARY-005). Display mapping is hydration-owned, not identity-owned.
