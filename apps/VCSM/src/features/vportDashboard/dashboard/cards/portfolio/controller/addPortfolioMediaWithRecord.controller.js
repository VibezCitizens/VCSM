import { addMedia } from '@portfolio'
import { createMediaAssetController } from '@/features/media/adapters/media.adapter'
import { resolveVcsmAppId } from '@/features/media/adapters/mediaAppId.adapter'
import { updatePortfolioMediaAssetIdDAL } from '@/features/vportDashboard/dashboard/cards/portfolio/dal/portfolioMediaRecord.write.dal'
import { captureVcsmError } from '@/services/monitoring/vcsmMonitoring'

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
  try {
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
          const appId = await resolveVcsmAppId()
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
            // PORT-V-005b: scope the UPDATE to rows the caller owns.
            callerProfileId:  portfolioMedia.profileId ?? portfolioMedia.profile_id,
          })
        } catch (e) {
          captureVcsmError({ feature: 'vportDashboard', module: 'portfolio.addPortfolioMediaWithRecord.controller', severity: 'warning', message: `addPortfolioMediaWithRecord: media_assets record failed (non-fatal) — ${e?.message ?? 'unknown'}`, error_name: e?.name, operation: 'recordPortfolioMediaAsset', is_handled: true, context: { dbErrorCode: e?.code ?? null } })
          if (import.meta.env?.DEV) console.warn('[addPortfolioMediaWithRecord] media_assets record failed (non-fatal):', e?.message)
        }
      })()
    }

    return portfolioMedia
  } catch (error) {
    captureVcsmError({ feature: 'vportDashboard', module: 'portfolio.addPortfolioMediaWithRecord.controller', severity: 'error', message: `addPortfolioMediaWithRecord: ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'addPortfolioMediaWithRecord', is_handled: false, context: { dbErrorCode: error?.code ?? null } })
    throw error
  }
}
