// src/features/settings/profile/controllers/saveProfile.controller.js

import { supabase } from "@/services/supabase/supabaseClient";

export async function saveProfile({
  profileId,
  displayName,
  bio,
  photoUrl,
  bannerUrl,
}) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      bio,
      photo_url: photoUrl,
      banner_url: bannerUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profileId)
    .select('id, photo_url, banner_url') // 👈 FORCE DB CONFIRMATION
    .single()

  if (error) {
    console.error('[saveProfile] DB ERROR', error)
    throw error
  }

  if (!data) {
    throw new Error('Profile update failed — no row returned')
  }

  console.log('[saveProfile] DB CONFIRMED', data)
  return data
}
