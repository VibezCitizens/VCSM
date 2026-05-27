import {
  dalGetActorPrivacy,
  invalidateActorPrivacyCache,
} from '@/features/social/privacy/dal/actorPrivacy.dal'

export async function ctrlGetActorPrivacy({ actorId }) {
  return dalGetActorPrivacy({ actorId })
}

export function ctrlInvalidateActorPrivacyCache(actorId) {
  invalidateActorPrivacyCache(actorId)
}
