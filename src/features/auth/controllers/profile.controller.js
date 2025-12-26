import { dalGetProfileDiscoverable } from '../dal/profile.dal'
import { ProfileModel } from '../model/profile.model'
import { supabase } from '@/services/supabase/supabaseClient'

export async function ensureProfileDiscoverable(profileId) {
  const row = await dalGetProfileDiscoverable(profileId)
  const profile = ProfileModel(row)

  if (!profile) return

  if (!profile.isDiscoverable) {
    const { error } = await supabase
      .from('profiles')
      .update({
        discoverable: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId)

    if (error) throw error
  }
}
