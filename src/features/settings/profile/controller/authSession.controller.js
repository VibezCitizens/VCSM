import { dalGetCurrentAuthUserId } from '@/features/settings/profile/dal/auth.read.dal'

export async function ctrlGetCurrentAuthUserId() {
  return dalGetCurrentAuthUserId()
}
