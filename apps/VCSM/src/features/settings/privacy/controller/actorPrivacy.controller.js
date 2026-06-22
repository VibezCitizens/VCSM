import {
  dalGetActorPrivacy,
  dalSetActorPrivacy,
} from '@/features/settings/privacy/dal/visibility.dal'
import { invalidateActorPrivacyCacheAdapter } from '@/features/social/adapters/privacy/actorPrivacy.adapter'
import { invalidateActorBundleEntry } from '@/features/CentralFeed/adapters/feedCache.adapter'
import { assertActorOwnsVportActorController } from '@/features/booking/adapters/booking.adapter'

export async function ctrlGetActorPrivacy(actorId) {
  if (!actorId) return false
  return dalGetActorPrivacy(actorId)
}

export async function ctrlSetActorPrivacy({ actorId, callerActorId, isPrivate, refreshActorFn }) {
  if (!actorId) throw new Error('Missing actorId')
  if (!callerActorId) throw new Error('Missing callerActorId')
  // User actors own themselves; VPORT actors verified via actor_owners
  if (callerActorId !== actorId) {
    await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId })
  }
  await dalSetActorPrivacy(actorId, Boolean(isPrivate))
  // Bust both caches so the new privacy state takes effect immediately
  invalidateActorPrivacyCacheAdapter(actorId)
  invalidateActorBundleEntry(actorId)
  refreshActorFn?.(actorId)
  return true
}
