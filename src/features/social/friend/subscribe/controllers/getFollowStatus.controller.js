import { dalGetFollowStatus } from '@/features/social/friend/request/dal/actorFollows.dal'

export async function ctrlGetFollowStatus({
  followerActorId,
  followedActorId,
}) {
  return dalGetFollowStatus({
    followerActorId,
    followedActorId,
  })
}
