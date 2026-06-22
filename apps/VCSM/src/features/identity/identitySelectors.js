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

// /profile/self renders the viewer's own profile without exposing a UUID.
export const getProfilePath = (identity) =>
  identity?.actorId ? '/profile/self' : '/me';
