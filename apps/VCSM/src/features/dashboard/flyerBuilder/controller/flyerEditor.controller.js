import { uploadMediaController } from '@media'
import { createMediaAssetController } from '@/features/media/adapters/media.adapter'
import { resolveVcsmAppId } from '@/features/media/adapters/mediaAppId.adapter'
import { saveFlyerPublicDetails } from '../dal/flyer.write.dal'

export async function uploadFlyerImageCtrl({ vportId, file, kind }) {
  const result = await uploadMediaController({
    file,
    scope: 'design_asset',
    ownerActorId: vportId,
    opts: { extraPath: 'assets' },
  })

  resolveVcsmAppId().then((appId) =>
    createMediaAssetController({
      mediaUploadResult:  result,
      ownerActorId:       vportId,
      createdByActorId:   vportId,
      scope:              'design_asset',
      scopeId:            vportId,
      mediaRole:          'original',
      appId,
    })
  ).catch((e) => {
    if (import.meta.env?.DEV) console.warn('[uploadFlyerImageCtrl] media_assets record failed (non-fatal):', e?.message)
  })

  return result.publicUrl
}

export async function saveFlyerPublicDetailsCtrl({ profileId, patch }) {
  return saveFlyerPublicDetails({ profileId, patch })
}
