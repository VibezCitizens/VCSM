import {
  dalGetProfileDiscoverable,
  dalUpdateProfileDiscoverable,
} from '../dal/profile.dal'
import { ProfileModel } from '../model/profile.model'

export async function ensureProfileDiscoverable(profileId) {
  const row = await dalGetProfileDiscoverable(profileId)
  const profile = ProfileModel(row)

  if (!profile) return

  if (!profile.isDiscoverable) {
    await dalUpdateProfileDiscoverable({
      profileId,
      discoverable: true,
      updatedAt: new Date().toISOString(),
    })
  }
}
