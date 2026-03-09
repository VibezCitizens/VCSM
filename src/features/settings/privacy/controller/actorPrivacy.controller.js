import {
  dalGetActorPrivacy,
  dalSetActorPrivacy,
} from '@/features/settings/privacy/dal/visibility.dal'

export async function ctrlGetActorPrivacy(actorId) {
  if (!actorId) return false
  return dalGetActorPrivacy(actorId)
}

export async function ctrlSetActorPrivacy({ actorId, isPrivate }) {
  if (!actorId) throw new Error('Missing actorId')
  await dalSetActorPrivacy(actorId, Boolean(isPrivate))
  return true
}
