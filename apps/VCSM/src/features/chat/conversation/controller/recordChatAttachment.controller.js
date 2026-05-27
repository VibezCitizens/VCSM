import { createMediaAssetController } from '@/features/media/adapters/media.adapter'
import { resolveVcsmAppId } from '@/features/media/adapters/mediaAppId.adapter'
import { updateAttachmentMediaAssetIdDAL } from '@/features/chat/conversation/dal/updateAttachmentMediaAsset.write.dal'
import { bugBunnyUploadStep, bugBunnyUploadError } from '@debuggers/media/bugBunnyUploadDebugger'

/**
 * Record a chat image upload in platform.media_assets, then write the
 * resulting media_asset_id back to chat.message_attachments.
 *
 * Designed to be called fire-and-forget from useSendMessageActions.
 *
 * @param {object} params
 * @param {import('@media').MediaUploadResult} params.mediaUploadResult
 * @param {string}      params.ownerActorId
 * @param {string|null} params.messageId   — chat.messages.id (scopeId)
 * @param {string|null} params.storageKey  — used to locate the attachment row
 */
export async function recordChatAttachmentController({
  mediaUploadResult,
  ownerActorId,
  messageId,
  storageKey,
}) {
  bugBunnyUploadStep('chat_attachment', 'writeback:start', { ownerActorId, messageId, storageKey })

  const appId = await resolveVcsmAppId()
  const mediaAsset = await createMediaAssetController({
    mediaUploadResult,
    ownerActorId,
    createdByActorId: ownerActorId,
    scope:            'chat_attachment',
    scopeId:          messageId ?? null,
    mediaRole:        'attachment',
    appId,
  })

  if (messageId && storageKey) {
    try {
      await updateAttachmentMediaAssetIdDAL({
        messageId,
        storageKey,
        mediaAssetId: mediaAsset.id,
      })
      bugBunnyUploadStep('chat_attachment', 'writeback:attachment', { messageId, mediaAssetId: mediaAsset.id })
    } catch (e) {
      bugBunnyUploadError('chat_attachment', 'writeback:attachment-failed', e, { messageId, storageKey })
      throw e
    }
  } else {
    bugBunnyUploadStep('chat_attachment', 'writeback:attachment-skipped', { hasMessageId: !!messageId, hasStorageKey: !!storageKey })
  }

  return mediaAsset
}
