// src/features/profiles/model/ActorProfileViewModel.js

export function ActorProfileViewModel({ actor, user, vport, isFollowing }) {
  if (actor.kind === 'vport') {
    return {
      actorId: actor.actorId,
      kind: 'vport',

      displayName: vport?.name ?? null,
      username: vport?.slug ?? null,
      bio: vport?.bio ?? null,

      avatarUrl: vport?.avatar_url ?? '/avatar.jpg',
      bannerUrl: vport?.banner_url ?? '/default-banner.jpg',

      isVport: true,
      isFollowing,

      vport: {
        id: vport?.id,
        name: vport?.name,
        slug: vport?.slug,
        isActive: vport?.is_active ?? false,
      },

      user: null,
    }
  }

  // user
  return {
    actorId: actor.actorId,
    kind: 'user',

    displayName: user?.display_name ?? null,
    username: user?.username ?? null,
    bio: user?.bio ?? null,

    avatarUrl: user?.photo_url ?? '/avatar.jpg',
    bannerUrl: user?.banner_url ?? '/default-banner.jpg',

    isVport: false,
    isFollowing,

    vport: null,
    user: user,
  }
}
