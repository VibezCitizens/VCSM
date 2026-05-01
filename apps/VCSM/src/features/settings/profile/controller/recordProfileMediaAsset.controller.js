// src/features/settings/profile/controller/recordProfileMediaAsset.controller.js
// ============================================================
// Pure write-back router — actor-scoped only.
// Receives a resolved mediaAssetId and actorId.
// Profile/vport row resolution happens inside the DAL.
// No profileId or vportProfileId crosses this boundary.
// ============================================================

import { updateUserPhotoMediaAssetIdDAL, updateUserBannerMediaAssetIdDAL } from '@/features/settings/profile/dal/profileMediaAsset.write.dal'
import { updateVportAvatarMediaAssetIdDAL, updateVportBannerMediaAssetIdDAL } from '@/features/vport/dal/vport.write.profileMedia.dal'
import { bugBunnyUploadStep, bugBunnyUploadError } from '@debuggers/media/bugBunnyUploadDebugger'

/**
 * Write a resolved media_asset_id back to the owning profile row.
 *
 * @param {object} params
 * @param {string} params.scope        — 'user_avatar' | 'user_banner' | 'vport_avatar' | 'vport_banner'
 * @param {string} params.mediaAssetId — platform.media_assets.id (must be non-null)
 * @param {string} params.actorId      — vc.actors.id (canonical identity only)
 */
export async function recordProfileMediaAssetController({ scope, mediaAssetId, actorId }) {
  if (!mediaAssetId) {
    if (import.meta.env?.DEV) console.warn('[recordProfileMediaAsset] mediaAssetId is null — skipping write-back', { scope, actorId })
    return
  }
  if (!actorId) {
    if (import.meta.env?.DEV) console.warn('[recordProfileMediaAsset] actorId is null — skipping write-back', { scope })
    return
  }

  if (import.meta.env?.DEV) console.log('[recordProfileMediaAsset] write-back payload:', { scope, mediaAssetId, actorId })
  bugBunnyUploadStep(scope, 'writeback:route', { scope, mediaAssetId, actorId })

  try {
    if (scope === 'user_avatar') {
      await updateUserPhotoMediaAssetIdDAL({ mediaAssetId })
      if (import.meta.env?.DEV) console.log('[recordProfileMediaAsset] ✓ wrote user_avatar → public.profiles.photo_media_asset_id', { actorId, mediaAssetId })
      bugBunnyUploadStep(scope, 'writeback:done', { actorId, mediaAssetId })
      return
    }

    if (scope === 'user_banner') {
      await updateUserBannerMediaAssetIdDAL({ mediaAssetId })
      if (import.meta.env?.DEV) console.log('[recordProfileMediaAsset] ✓ wrote user_banner → public.profiles.banner_media_asset_id', { actorId, mediaAssetId })
      bugBunnyUploadStep(scope, 'writeback:done', { actorId, mediaAssetId })
      return
    }

    if (scope === 'vport_avatar') {
      await updateVportAvatarMediaAssetIdDAL({ actorId, mediaAssetId })
      if (import.meta.env?.DEV) console.log('[recordProfileMediaAsset] ✓ wrote vport_avatar → vport.profiles.avatar_media_asset_id', { actorId, mediaAssetId })
      bugBunnyUploadStep(scope, 'writeback:done', { actorId, mediaAssetId })
      return
    }

    if (scope === 'vport_banner') {
      await updateVportBannerMediaAssetIdDAL({ actorId, mediaAssetId })
      if (import.meta.env?.DEV) console.log('[recordProfileMediaAsset] ✓ wrote vport_banner → vport.profiles.banner_media_asset_id', { actorId, mediaAssetId })
      bugBunnyUploadStep(scope, 'writeback:done', { actorId, mediaAssetId })
      return
    }

    if (import.meta.env?.DEV) console.warn('[recordProfileMediaAsset] unknown scope — no write-back:', scope)
  } catch (e) {
    bugBunnyUploadError(scope, 'writeback:failed', e, { mediaAssetId, actorId })
    if (import.meta.env?.DEV) console.warn('[recordProfileMediaAsset] write-back DB error (non-fatal):', e?.message, e)
  }
}
