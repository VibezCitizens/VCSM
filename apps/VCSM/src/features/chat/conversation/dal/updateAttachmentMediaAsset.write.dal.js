import { supabase } from '@/services/supabase/supabaseClient'

/**
 * Update media_asset_id on a chat.message_attachments row.
 * Matches by message_id + storage_path to avoid a prior read.
 * Called non-blocking after the platform.media_assets record is created.
 *
 * @param {object} params
 * @param {string} params.messageId    — chat.messages.id
 * @param {string} params.storageKey   — the storage_path stored during send
 * @param {string} params.mediaAssetId — platform.media_assets.id
 */
export async function updateAttachmentMediaAssetIdDAL({ messageId, storageKey, mediaAssetId }) {
  if (!messageId || !storageKey || !mediaAssetId) return

  const { error } = await supabase
    .schema('chat')
    .from('message_attachments')
    .update({ media_asset_id: mediaAssetId })
    .eq('message_id', messageId)
    .eq('storage_path', storageKey)

  if (error) throw error
}
