import { ProfileModel } from '@/features/profiles/model/profile.model'

import { readActorProfileDAL } from '@/features/profiles/dal/readActorProfile.dal'
import { useActorStore } from '@hydration'
import { readFollowStateDAL } from '@/features/profiles/dal/readFollowState.dal'

export async function getProfileView({
  viewerActorId,
  profileActorId,
}) {
  const [actorRow, followRow] = await Promise.all([
    readActorProfileDAL(profileActorId),
    viewerActorId
      ? readFollowStateDAL({ viewerActorId, targetActorId: profileActorId }).catch(() => null)
      : Promise.resolve(null),
  ])

  if (!actorRow || !actorRow.actor) {
    throw new Error('Actor not found')
  }

  const {
    actor,
    profile: userProfile,
    vport,
  } = actorRow

  try {
    const summary = {
      actor_id: profileActorId,
      kind: actor.kind,
      display_name: actor.kind === 'vport' ? (vport?.name ?? null) : (userProfile?.display_name ?? null),
      username: actor.kind === 'vport' ? (vport?.slug ?? null) : (userProfile?.username ?? null),
      photo_url: actor.kind === 'vport' ? (vport?.avatar_url ?? null) : (userProfile?.photo_url ?? null),
      banner_url: actor.kind === 'vport' ? (vport?.banner_url ?? null) : (userProfile?.banner_url ?? null),
      bio: actor.kind === 'vport' ? (vport?.bio ?? null) : (userProfile?.bio ?? null),
      vport_name: vport?.name ?? null,
      vport_slug: vport?.slug ?? null,
      vport_avatar_url: vport?.avatar_url ?? null,
    }
    useActorStore.getState().upsertActors([summary])
  } catch (_) {
    // Non-critical — don't block profile load
  }

  const isFollowing = !!followRow?.is_active

  let profile

  if (actor.kind === 'vport') {
    profile = {
      actorId: profileActorId,
      kind: 'vport',

      vportId: vport?.id ?? null,
      vport_id: vport?.id ?? null,

      vportType: vport?.vport_type ?? null,
      vport_type: vport?.vport_type ?? null,

      displayName: vport?.name ?? null,
      username: vport?.slug ?? null,
      bio: vport?.bio ?? null,

      avatarUrl: vport?.avatar_url ?? '/avatar.jpg',
      bannerUrl: vport?.banner_url ?? '/default-banner.jpg',

      vport: {
        id: vport?.id,
        name: vport?.name,
        slug: vport?.slug,
        isActive: vport?.is_active ?? false,
      },

      isVport: true,
      isFollowing,
    }
  } else {
    profile = {
      ...ProfileModel(userProfile),
      actorId: profileActorId,
      kind: 'user',
      vport: null,
      isVport: false,
      isFollowing,
    }
  }

  return { profile }
}
