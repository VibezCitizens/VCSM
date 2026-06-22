import { uploadMediaController } from '@media'
import { createMediaAssetController } from '@/features/media/adapters/media.adapter'
import { resolveVcsmAppId } from '@/features/media/adapters/mediaAppId.adapter'
import { saveFlyerPublicDetails } from '@/features/flyerBuilder/dal/flyer.write.dal'
import { requireOwnerActorAccess } from '@/features/flyerBuilder/designStudio/controllers/designStudio.shared.controller'
import { resolveVportProfileId } from '@/shared/lib/vport/resolveVportProfileId'

export async function uploadFlyerImageCtrl({ vportId, file }) {
  await requireOwnerActorAccess(vportId)

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

export async function saveFlyerPublicDetailsCtrl({ patch, ownerActorId } = {}) {
  if (!ownerActorId) throw new Error('ownerActorId is required')
  await requireOwnerActorAccess(ownerActorId)

  const profileId = await resolveVportProfileId(ownerActorId)
  if (!profileId) throw new Error('VPORT profile not found.')

  return saveFlyerPublicDetails({ profileId, patch })
}
