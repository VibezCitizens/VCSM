import { createMediaAssetController } from '@/features/media/controller/createMediaAsset.controller'
import { resolveVcsmAppIdDAL } from '@/features/media/dal/resolveAppId.read.dal'
import { updatePostMediaAssetIdDAL } from '@/features/upload/dal/updatePostMediaAssetId.write.dal'
import { bugBunnyUploadStep, bugBunnyUploadError } from '@debuggers/media/bugBunnyUploadDebugger'

function scopeForMode(mode) {
  if (mode === '24drop') return 'story_24drop'
  if (mode === 'vdrop')  return 'vdrop'
  return 'vibe_post'
}

/**
 * Non-blocking: record each post media upload in platform.media_assets, then
 * write the resulting media_asset_id back to vc.post_media.
 *
 * postMediaIds[i] corresponds to uploadResults[i] (same sort_order).
 * Write-back is skipped silently for any index without a postMediaId.
 *
 * @param {object}   params
 * @param {string}   params.actorId
 * @param {string}   params.mode          — 'post' | '24drop' | 'vdrop'
 * @param {string}   params.postId
 * @param {import('@media').MediaUploadResult[]} params.uploadResults
 * @param {string[]} [params.postMediaIds] — vc.post_media.id per upload, in order
 */
export async function recordPostMediaController({ actorId, mode, postId, uploadResults, postMediaIds = [] }) {
  if (!actorId || !Array.isArray(uploadResults) || uploadResults.length === 0) return

  const scope = scopeForMode(mode)

  bugBunnyUploadStep(scope, 'writeback:start', { actorId, postId, count: uploadResults.length, postMediaIds })

  const appId = await resolveVcsmAppIdDAL()

  await Promise.allSettled(
    uploadResults.map((result, i) =>
      createMediaAssetController({
        mediaUploadResult:  result,
        ownerActorId:       actorId,
        createdByActorId:   actorId,
        scope,
        scopeId:            postId ?? null,
        mediaRole:          'original',
        appId,
      }).then(async (mediaAsset) => {
        const postMediaId = postMediaIds[i]
        if (postMediaId && mediaAsset?.id) {
          try {
            await updatePostMediaAssetIdDAL({ postMediaId, mediaAssetId: mediaAsset.id })
            bugBunnyUploadStep(scope, 'writeback:post_media', { postMediaId, mediaAssetId: mediaAsset.id, index: i })
          } catch (e) {
            bugBunnyUploadError(scope, 'writeback:post_media-failed', e, { postMediaId, index: i })
          }
        } else {
          bugBunnyUploadStep(scope, 'writeback:post_media-skipped', { index: i, hasPostMediaId: !!postMediaId, hasAssetId: !!mediaAsset?.id })
        }
      }).catch((e) => {
        bugBunnyUploadError(scope, 'writeback:media_asset-failed', e, { index: i })
      })
    )
  )

  bugBunnyUploadStep(scope, 'writeback:done', { actorId, postId })
}
