// src/features/settings/profile/hooks/useProfileUploads.js
// ============================================================
// Profile Uploads Hook (UPLOAD ONLY)
// - Handles avatar + banner uploads
// - User + VPORT aware
// - Upload ONLY (no DB writes)
// - Accepts File as argument (controller owns draft state)
// ============================================================

import imageCompression from 'browser-image-compression'
import { uploadToCloudflare } from '@/services/cloudflare/uploadToCloudflare'
import { supabase } from '@/services/supabase/supabaseClient'
import { buildR2Key } from '@/services/cloudflare/buildR2Key'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

function validateImage(file, label) {
  if (!file) return null
  if (!file.type?.startsWith('image/')) {
    throw new Error(`${label} must be an image`)
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`${label} too large (max 5MB)`)
  }
  return file
}

/**
 * useProfileUploads
 *
 * @param {Object} opts
 * @param {'user'|'vport'} opts.mode
 * @param {string} opts.subjectId
 */
export function useProfileUploads({ mode, subjectId }) {
  async function uploadAvatar(file) {
    const f = validateImage(file, 'Avatar')
    if (!f) return null
    if (!subjectId) throw new Error('uploadAvatar: subjectId missing')

    // ---- USER AVATAR PHOTO (NEW) ----
    if (mode === 'user') {
      const { data } = await supabase.auth.getUser()
      const userId = data?.user?.id
      if (!userId) throw new Error('Not authenticated')

      const compressed = await imageCompression(f, {
        maxSizeMB: 0.7,
        maxWidthOrHeight: 600,
        useWebWorker: true,
      })

      // avatar-photos/<userId>/<yyyy>/<mm>/<dd>/<ts>-<rand>.<ext>
      const key = buildR2Key('avatar-photos', userId, compressed)

      const { url, error } = await uploadToCloudflare(compressed, key)
      if (error || !url) throw new Error(error || 'Avatar upload failed')

      return url
    }

    // ---- VPORT AVATAR PHOTO (NEW) ----
    // vport-avatar-photos/<subjectId>/<yyyy>/<mm>/<dd>/<ts>-<rand>.<ext>
    const key = buildR2Key('vport-avatar-photos', subjectId, f)

    const { url, error } = await uploadToCloudflare(f, key)
    if (error || !url) throw new Error(error || 'VPORT avatar upload failed')

    return url
  }

  async function uploadBanner(file) {
    const f = validateImage(file, 'Banner')
    if (!f) return null
    if (!subjectId) throw new Error('uploadBanner: subjectId missing')

    // ---- VPORT AVATAR BANNER (NEW) ----
    if (mode === 'vport') {
      // vport-avatar-banners/<subjectId>/<yyyy>/<mm>/<dd>/<ts>-<rand>.<ext>
      const key = buildR2Key('vport-avatar-banners', subjectId, f)

      const { url, error } = await uploadToCloudflare(f, key)
      if (error || !url) throw new Error(error || 'Banner upload failed')

      return url
    }

    // ---- USER AVATAR BANNER (NEW) ----
    // avatar-banners/<userId>/<yyyy>/<mm>/<dd>/<ts>-<rand>.<ext>
    const key = buildR2Key('avatar-banners', subjectId, f)

    const { url, error } = await uploadToCloudflare(f, key)
    if (error || !url) throw new Error(error || 'Banner upload failed')

    return url
  }

  return {
    uploadAvatar,
    uploadBanner,
  }
}
