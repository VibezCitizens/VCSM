import { dalGetActorPrivacy } from '@/features/social/privacy/dal/actorPrivacy.dal'

export async function ctrlGetActorPrivacy({ actorId }) {
  return dalGetActorPrivacy({ actorId })
}
