// src/features/settings/profile/hooks/useProfileUploads.js
// ============================================================
// Profile Uploads Hook (UPLOAD ONLY)
// - Uploads avatar/banner via media engine
// - Creates platform.media_assets record
// - Writes media_asset_id back to the owning profile column
// - Identity flows as actorId only — no profileId or vportProfileId
// - All write-back is non-blocking (IIFE + catch)
// - actorId is snapshotted at upload action time, not hook render time
// ============================================================

import { uploadMediaController } from '@media'
import { useIdentity } from '@/features/identity/adapters/identity.adapter'
import { ctrlGetCurrentAuthUserId } from '@/features/settings/profile/controller/authSession.controller'
import { createMediaAssetController } from '@/features/media/controller/createMediaAsset.controller'
import { recordProfileMediaAssetController } from '@/features/settings/profile/controller/recordProfileMediaAsset.controller'

const DEV = import.meta.env?.DEV

export function useProfileUploads({ mode, subjectId }) {
  const { identity, setIdentity } = useIdentity()

  // ── user avatar ──────────────────────────────────────────────
  async function uploadAvatar(file) {
    if (!file) return null
    if (!subjectId) throw new Error('uploadAvatar: subjectId missing')

    // Snapshot at action time — guards against actor switch between pick and save.
    const actorId = identity?.actorId ?? null

    if (mode === 'user') {
      const userId = await ctrlGetCurrentAuthUserId()
      if (!userId) throw new Error('Not authenticated')

      const result = await uploadMediaController({ file, scope: 'user_avatar', ownerActorId: userId })
      if (DEV) console.log('[useProfileUploads] upload done:', { scope: 'user_avatar', publicUrl: result?.publicUrl, storageKey: result?.storageKey, mimeType: result?.mimeType, sizeBytes: result?.sizeBytes, actorId, subjectId })

      ;(async () => {
        try {
          if (!actorId) {
            if (DEV) console.warn('[useProfileUploads] actorId is null for user_avatar — media_assets record skipped. Identity not loaded?')
            return
          }
          const payload = { mediaUploadResult: result, ownerActorId: actorId, createdByActorId: actorId, scope: 'user_avatar', scopeId: subjectId, mediaRole: 'avatar' }
          if (DEV) console.log('[useProfileUploads] media asset payload (user_avatar):', payload)

          const mediaAsset = await createMediaAssetController(payload)
          if (DEV) console.log('[useProfileUploads] media asset created:', { id: mediaAsset?.id, scopeType: mediaAsset?.scopeType })

          await recordProfileMediaAssetController({ scope: 'user_avatar', mediaAssetId: mediaAsset?.id ?? null, actorId })

          // Patch identityDetails.avatar so nav/header consumers (useIdentityDisplayDeprecated)
          // reflect the new avatar without waiting for the next identity engine re-resolution.
          if (identity?.kind === 'user') {
            setIdentity(prev => prev ? { ...prev, avatar: result.publicUrl } : prev)
          }
        } catch (e) {
          if (DEV) console.warn('[useProfileUploads] user_avatar media record failed:', e?.code, e?.message, e)
        }
      })()

      return result.publicUrl
    }

    // ── vport avatar ─────────────────────────────────────────────
    const result = await uploadMediaController({ file, scope: 'vport_avatar', ownerActorId: subjectId })
    if (DEV) console.log('[useProfileUploads] upload done:', { scope: 'vport_avatar', publicUrl: result?.publicUrl, storageKey: result?.storageKey, mimeType: result?.mimeType, sizeBytes: result?.sizeBytes, actorId, subjectId })

    ;(async () => {
      try {
        if (!actorId) {
          if (DEV) console.warn('[useProfileUploads] actorId is null for vport_avatar — media_assets record skipped. Identity not loaded?')
          return
        }
        const payload = { mediaUploadResult: result, ownerActorId: actorId, createdByActorId: actorId, scope: 'vport_avatar', scopeId: subjectId, mediaRole: 'avatar' }
        if (DEV) console.log('[useProfileUploads] media asset payload (vport_avatar):', payload)

        const mediaAsset = await createMediaAssetController(payload)
        if (DEV) console.log('[useProfileUploads] media asset created:', { id: mediaAsset?.id, scopeType: mediaAsset?.scopeType })

        await recordProfileMediaAssetController({ scope: 'vport_avatar', mediaAssetId: mediaAsset?.id ?? null, actorId })

        // Patch identityDetails.avatar only if this vport is the currently active actor.
        if (identity?.kind === 'vport') {
          setIdentity(prev => prev ? { ...prev, avatar: result.publicUrl } : prev)
        }
      } catch (e) {
        if (DEV) console.warn('[useProfileUploads] vport_avatar media record failed:', e?.code, e?.message, e)
      }
    })()

    return result.publicUrl
  }

  // ── banners ───────────────────────────────────────────────────
  async function uploadBanner(file) {
    if (!file) return null
    if (!subjectId) throw new Error('uploadBanner: subjectId missing')

    // Snapshot at action time — guards against actor switch between pick and save.
    const actorId = identity?.actorId ?? null

    if (mode === 'vport') {
      const result = await uploadMediaController({ file, scope: 'vport_banner', ownerActorId: subjectId })
      if (DEV) console.log('[useProfileUploads] upload done:', { scope: 'vport_banner', publicUrl: result?.publicUrl, storageKey: result?.storageKey, mimeType: result?.mimeType, sizeBytes: result?.sizeBytes, actorId, subjectId })

      ;(async () => {
        try {
          if (!actorId) {
            if (DEV) console.warn('[useProfileUploads] actorId is null for vport_banner — media_assets record skipped. Identity not loaded?')
            return
          }
          const payload = { mediaUploadResult: result, ownerActorId: actorId, createdByActorId: actorId, scope: 'vport_banner', scopeId: subjectId, mediaRole: 'banner' }
          if (DEV) console.log('[useProfileUploads] media asset payload (vport_banner):', payload)

          const mediaAsset = await createMediaAssetController(payload)
          if (DEV) console.log('[useProfileUploads] media asset created:', { id: mediaAsset?.id, scopeType: mediaAsset?.scopeType })

          await recordProfileMediaAssetController({ scope: 'vport_banner', mediaAssetId: mediaAsset?.id ?? null, actorId })

          // Patch identityDetails.banner only if this vport is the currently active actor.
          if (identity?.kind === 'vport') {
            setIdentity(prev => prev ? { ...prev, banner: result.publicUrl } : prev)
          }
        } catch (e) {
          if (DEV) console.warn('[useProfileUploads] vport_banner media record failed:', e?.code, e?.message, e)
        }
      })()

      return result.publicUrl
    }

    // ── user banner ───────────────────────────────────────────────
    const userId = await ctrlGetCurrentAuthUserId()
    if (!userId) throw new Error('Not authenticated')

    const result = await uploadMediaController({ file, scope: 'user_banner', ownerActorId: userId })
    if (DEV) console.log('[useProfileUploads] upload done:', { scope: 'user_banner', publicUrl: result?.publicUrl, storageKey: result?.storageKey, mimeType: result?.mimeType, sizeBytes: result?.sizeBytes, actorId, subjectId })

    ;(async () => {
      try {
        if (!actorId) {
          if (DEV) console.warn('[useProfileUploads] actorId is null for user_banner — media_assets record skipped. Identity not loaded?')
          return
        }
        const payload = { mediaUploadResult: result, ownerActorId: actorId, createdByActorId: actorId, scope: 'user_banner', scopeId: subjectId, mediaRole: 'banner' }
        if (DEV) console.log('[useProfileUploads] media asset payload (user_banner):', payload)

        const mediaAsset = await createMediaAssetController(payload)
        if (DEV) console.log('[useProfileUploads] media asset created:', { id: mediaAsset?.id, scopeType: mediaAsset?.scopeType })

        await recordProfileMediaAssetController({ scope: 'user_banner', mediaAssetId: mediaAsset?.id ?? null, actorId })

        // Patch identityDetails.banner so nav/header consumers (useIdentityDisplayDeprecated)
        // reflect the new banner without waiting for the next identity engine re-resolution.
        if (identity?.kind === 'user') {
          setIdentity(prev => prev ? { ...prev, banner: result.publicUrl } : prev)
        }
      } catch (e) {
        if (DEV) console.warn('[useProfileUploads] user_banner media record failed:', e?.code, e?.message, e)
      }
    })()

    return result.publicUrl
  }

  return { uploadAvatar, uploadBanner }
}
