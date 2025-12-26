// src/features/settings/profile/dal/profile.write.dal.js
// ============================================================
// Profile WRITE DAL (LOCKED)
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

export async function updateProfile(subjectId, mode, data) {
  if (!subjectId) throw new Error('updateProfile: subjectId required')
  if (!data || typeof data !== 'object') {
    throw new Error('updateProfile: data payload required')
  }

  // ------------------------------------------------------------
  // VPORT UPDATE (vc.vports)
  // ------------------------------------------------------------
  if (mode === 'vport') {
    const payload = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.avatar_url !== undefined && { avatar_url: data.avatar_url }),
      ...(data.banner_url !== undefined && { banner_url: data.banner_url }),
    }

    const { error } = await supabase
      .schema('vc')
      .from('vports')
      .update(payload)
      .eq('id', subjectId)

    if (error) throw error
    return true
  }

  // ------------------------------------------------------------
  // USER PROFILE UPDATE (profiles)
  // ------------------------------------------------------------
  const payload = {
    ...(data.display_name !== undefined && { display_name: data.display_name }),
    ...(data.bio !== undefined && { bio: data.bio }),
    ...(data.photo_url !== undefined && { photo_url: data.photo_url }),
    ...(data.banner_url !== undefined && { banner_url: data.banner_url }),
  }

  const { data: row, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', subjectId)
    .select('id, photo_url, banner_url') // DB confirmation
    .single()

  if (error) {
    console.error('[updateProfile:user] DB ERROR', error)
    throw error
  }

  if (!row) {
    throw new Error('Profile update failed — no row returned')
  }

  return row
}
