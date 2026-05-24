import {
  dalGetActorPrivacy,
  dalSetActorPrivacy,
} from '@/features/settings/privacy/dal/visibility.dal'
import { invalidateActorPrivacyCacheAdapter } from '@/features/social/adapters/privacy/actorPrivacy.adapter'
import { invalidateActorBundleEntry } from '@/features/feed/adapters/feedCache.adapter'

export async function ctrlGetActorPrivacy(actorId) {
  if (!actorId) return false
  return dalGetActorPrivacy(actorId)
}

export async function ctrlSetActorPrivacy({ actorId, isPrivate, refreshActorFn }) {
  if (!actorId) throw new Error('Missing actorId')
  await dalSetActorPrivacy(actorId, Boolean(isPrivate))
  // Bust both caches so the new privacy state takes effect immediately
  invalidateActorPrivacyCacheAdapter(actorId)
  invalidateActorBundleEntry(actorId)
  refreshActorFn?.(actorId)
  return true
}
