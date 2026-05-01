// src/features/settings/profile/dal/profileMediaAsset.write.dal.js
// ============================================================
// Profile media_asset_id WRITE DAL
// Writes media_asset_id back to public.profiles after upload.
// No caller-supplied user/profile ID — session UID resolved internally.
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

async function _getSessionUserId() {
  const { data } = await supabase.auth.getUser()
  return data?.user?.id ?? null
}

export async function updateUserPhotoMediaAssetIdDAL({ mediaAssetId }) {
  if (!mediaAssetId) return
  const uid = await _getSessionUserId()
  if (!uid) return
  const { error } = await supabase
    .from('profiles')
    .update({ photo_media_asset_id: mediaAssetId })
    .eq('id', uid)
  if (error) throw error
}

export async function updateUserBannerMediaAssetIdDAL({ mediaAssetId }) {
  if (!mediaAssetId) return
  const uid = await _getSessionUserId()
  if (!uid) return
  const { error } = await supabase
    .from('profiles')
    .update({ banner_media_asset_id: mediaAssetId })
    .eq('id', uid)
  if (error) throw error
}
