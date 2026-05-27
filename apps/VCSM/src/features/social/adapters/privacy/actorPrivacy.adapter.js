import {
  ctrlGetActorPrivacy,
  ctrlInvalidateActorPrivacyCache,
} from '@/features/social/privacy/controllers/getActorPrivacy.controller'

export function getActorPrivacyAdapter(params) {
  return ctrlGetActorPrivacy(params)
}

export function invalidateActorPrivacyCacheAdapter(actorId) {
  return ctrlInvalidateActorPrivacyCache(actorId)
}
