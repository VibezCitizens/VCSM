import { supabase } from '@/services/supabase/supabaseClient'

/**
 * Update media_asset_id on one vc.post_media row.
 * Called non-blocking after platform.media_assets record is created.
 *
 * @param {object} params
 * @param {string} params.postMediaId — vc.post_media.id
 * @param {string} params.mediaAssetId — platform.media_assets.id
 */
export async function updatePostMediaAssetIdDAL({ postMediaId, mediaAssetId }) {
  if (!postMediaId || !mediaAssetId) return

  const { error } = await supabase
    .schema('vc')
    .from('post_media')
    .update({ media_asset_id: mediaAssetId })
    .eq('id', postMediaId)

  if (error) throw error
}
