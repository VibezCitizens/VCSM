import {
  dalInsertFollow,
  dalDeactivateFollow,
} from '@/features/social/friend/request/dal/actorFollows.dal'
import { dalInsertNotification } from '@/features/notifications/inbox/dal/notifications.create.dal'

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

  try {
    await dalInsertNotification({
      recipientActorId: followedActorId,
      actorId: followerActorId,
      kind: 'follow',
      objectType: 'actor',
      objectId: followerActorId,
      linkPath: `/profile/${followerActorId}`,
      context: {
        followerActorId,
        followedActorId,
      },
    })
  } catch (error) {
    console.error('[ctrlSubscribe] notification insert failed', error)
  }

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
