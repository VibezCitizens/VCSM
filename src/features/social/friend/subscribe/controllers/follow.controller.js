import {
  dalInsertFollow,
  dalDeactivateFollow,
} from '@/features/social/friend/request/dal/actorFollows.dal'

export async function ctrlSubscribe({
  followerActorId,
  followedActorId,
}) {
  if (!followerActorId || !followedActorId) {
    throw new Error('Missing actor ids')
  }

  if (followerActorId === followedActorId) {
    throw new Error('Cannot follow yourself')
  }

  await dalInsertFollow({
    followerActorId,
    followedActorId,
  })

  return true
}

export async function ctrlUnsubscribe({
  followerActorId,
  followedActorId,
}) {
  if (!followerActorId || !followedActorId) {
    throw new Error('Missing actor ids')
  }

  if (followerActorId === followedActorId) {
    throw new Error('Cannot unsubscribe from yourself')
  }

  await dalDeactivateFollow({
    followerActorId,
    followedActorId,
  })

  return true
}
