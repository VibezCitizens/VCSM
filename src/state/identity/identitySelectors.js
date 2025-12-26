export const isUserActor = (identity) => identity?.kind === 'user'
export const isVportActor = (identity) => identity?.kind === 'vport'

export const getActorId = (identity) => identity?.actorId ?? null
export const getProfileId = (identity) => identity?.profileId ?? null
export const getVportId = (identity) => identity?.vportId ?? null
export const getRealmId = (identity) => identity?.realmId ?? null // ✅ ADDED

export const getDisplayName = (identity) =>
  identity?.displayName ?? 'Unknown'

export const getUsername = (identity) => identity?.username ?? null
export const getAvatar = (identity) => identity?.avatar ?? '/avatar.jpg'
export const getBanner = (identity) =>
  identity?.banner ?? '/default-banner.jpg'

export const getProfilePath = (identity) =>
  identity?.kind === 'vport'
    ? identity?.username
      ? `/vport/${identity.username}`
      : `/vport/id/${identity?.vportId}`
    : '/me'
