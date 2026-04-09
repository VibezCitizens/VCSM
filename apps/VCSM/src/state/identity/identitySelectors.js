export const isUserActor = (identity) => identity?.kind === "user";
export const isVportActor = (identity) => identity?.kind === "vport";

/**
 * Single source of truth for citizen booking eligibility.
 * Returns true only when the resolved identity is a citizen/user actor.
 * Returns false for vport/business identities or missing identity.
 */
export const canCitizenBook = (identity) => {
  if (!identity) return false;
  return identity.kind === "user";
};

export const getActorId = (identity) => identity?.actorId ?? null;
export const getRealmId = (identity) => identity?.realmId ?? null;

export const getDisplayName = (identity) =>
  identity?.displayName ?? "Unknown";

export const getUsername = (identity) => identity?.username ?? null;
export const getAvatar = (identity) => identity?.avatar ?? "/avatar.jpg";
export const getBanner = (identity) =>
  identity?.banner ?? "/default-banner.jpg";

export const getProfilePath = (identity) =>
  identity?.actorId ? `/profile/${identity.actorId}` : "/me";
