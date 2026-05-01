import { addMedia } from '@portfolio'
import { createMediaAssetController } from '@/features/media/controller/createMediaAsset.controller'
import { resolveVcsmAppIdDAL } from '@/features/media/dal/resolveAppId.read.dal'
import { updatePortfolioMediaAssetIdDAL } from '@/features/dashboard/vport/dal/write/portfolioMediaRecord.write.dal'

/**
 * Composite controller: add a portfolio media row then record it in platform.media_assets.
 *
 * Drop-in replacement for the `addMedia` engine call in PortfolioItemForm.
 * Returns the same PortfolioMediaModel shape as addMedia.
 * Recording is non-blocking — any failure logs a DEV warning and never blocks the save.
 *
 * @param {object} params
 * @param {string} params.itemId
 * @param {string} params.actorId
 * @param {string} params.url
 * @param {string} [params.mediaType]
 * @param {string} [params.mediaRole]
 * @param {string} [params.altText]
 * @param {number} [params.width]
 * @param {number} [params.height]
 * @param {number} [params.durationSeconds]
 * @param {number} [params.sortOrder]
 * @param {import('@media').MediaUploadResult} params.mediaUploadResult
 * @returns {Promise<object>} PortfolioMediaModel
 */
export async function addPortfolioMediaWithRecord({
  itemId,
  actorId,
  url,
  mediaType,
  mediaRole,
  altText,
  width,
  height,
  durationSeconds,
  sortOrder,
  mediaUploadResult,
}) {
  const portfolioMedia = await addMedia({
    itemId,
    actorId,
    url,
    mediaType,
    mediaRole,
    altText,
    width,
    height,
    durationSeconds,
    sortOrder,
  })

  if (mediaUploadResult && portfolioMedia?.id) {
    ;(async () => {
      try {
        const appId = await resolveVcsmAppIdDAL()
        const mediaAssetRecord = await createMediaAssetController({
          mediaUploadResult,
          ownerActorId:     actorId,
          createdByActorId: actorId,
          scope:            'portfolio_media',
          scopeId:          portfolioMedia.id,
          appId,
        })
        await updatePortfolioMediaAssetIdDAL({
          portfolioMediaId: portfolioMedia.id,
          mediaAssetId:     mediaAssetRecord.id,
        })
      } catch (e) {
        if (import.meta.env?.DEV) console.warn('[addPortfolioMediaWithRecord] media_assets record failed (non-fatal):', e?.message)
      }
    })()
  }

  return portfolioMedia
}
