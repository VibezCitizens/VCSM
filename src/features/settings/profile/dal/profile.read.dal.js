// src/features/settings/profile/dal/profile.read.dal.js
// ============================================================
// Profile READ DAL (LOCKED)
// - Fetches raw profile data from DB
// - User + VPORT support (vc schema)
// - NO React
// - NO identity logic
// - NO models/controllers/hooks imports
// - Explicit column projections only
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

/**
 * fetchProfile
 *
 * @param {string} subjectId
 * @param {'user'|'vport'} mode
 * @returns {Promise<Object>}
 */
export async function fetchProfile(subjectId, mode) {
  if (!subjectId) {
    throw new Error('fetchProfile: subjectId required')
  }

 // ------------------------------------------------------------
// VPORT PROFILE (vc.vports)
// ------------------------------------------------------------
if (mode === 'vport') {
  const { data, error } = await supabase
    .schema('vc')
    .from('vports')
    .select(`
      id,
      owner_user_id,
      slug,
      name,
      bio,
      avatar_url,
      banner_url
    `)
    .eq('id', subjectId)
    .maybeSingle()

  if (error) throw error
  if (!data?.id) throw new Error('VPORT not found')

  return data
}


 // ------------------------------------------------------------
// USER PROFILE (public.profiles)
// ------------------------------------------------------------
const { data, error } = await supabase
  .from('profiles')
  .select(`
    id,
    username,
    display_name,
    email,
    bio,
    photo_url,
    banner_url
  `)
  .eq('id', subjectId)
  .maybeSingle()

if (error) throw error
if (!data?.id) throw new Error('User profile not found')

return data

}
