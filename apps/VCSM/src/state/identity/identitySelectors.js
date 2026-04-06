export const isUserActor = (identity) => identity?.kind === "user";
export const isVportActor = (identity) => identity?.kind === "vport";

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
