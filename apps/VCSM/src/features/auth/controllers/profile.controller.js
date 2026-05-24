import {
  dalGetProfileDiscoverable,
  dalUpdateProfileDiscoverable,
} from '@/features/auth/dal/profile.dal'
import { dalGetAuthSession } from '@/features/auth/dal/authSession.read.dal'
import { ProfileModel } from '@/features/auth/model/profile.model'

// Login-phase operation: called with the auth userId before actor resolution.
// profiles.id === auth.users.id, so userId is the correct key here.
export async function ensureProfileDiscoverable(userId) {
  const session = await dalGetAuthSession()
  if (!session?.user?.id || session.user.id !== userId) return

  const row = await dalGetProfileDiscoverable(userId)
  const profile = ProfileModel(row)

  if (!profile) return

  if (!profile.isDiscoverable) {
    await dalUpdateProfileDiscoverable({
      userId,
      discoverable: true,
      updatedAt: new Date().toISOString(),
    })
  }
}
