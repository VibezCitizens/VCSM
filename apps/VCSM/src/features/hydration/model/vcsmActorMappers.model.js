// VCSM actor display mappers — hydration-owned.
// Relocated verbatim from state/identity/identity.model.js by IDENTITY-BOUNDARY-005.
// Pure functions: map a vc actor row + profile/vport row into the hydrated display
// shape consumed by vcsmActorHydrator. No DB access, no identity-runtime logic.

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
    isDeleted: vport?.is_deleted ?? false,
    createdAt: vport?.created_at ?? null,
    updatedAt: vport?.updated_at ?? null,
    vportType: vport?.vport_type ?? null,
  };
}
