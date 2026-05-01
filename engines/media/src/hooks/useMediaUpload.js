import { useState, useCallback } from 'react'
import { uploadMediaController } from '../controller/uploadMedia.controller.js'

/**
 * useMediaUpload — React hook for single-file media uploads via the media engine.
 *
 * The hook owns upload state (uploading, error).
 * The component owns file selection and preview state.
 *
 * @param {{ scope: string, ownerActorId: string }} params
 * @returns {{
 *   upload:    (file: File, opts?: { extraPath?: string }) => Promise<MediaUploadResult>,
 *   uploading: boolean,
 *   error:     Error|null,
 *   reset:     () => void,
 * }}
 *
 * Usage:
 *   const { upload, uploading, error } = useMediaUpload({ scope: 'menu_item_photo', ownerActorId: actorId })
 *   const result = await upload(file, { extraPath: `category-${categoryId}` })
 *   // result.publicUrl  → CDN URL ready to store in DB
 */
export function useMediaUpload({ scope, ownerActorId }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const reset = useCallback(() => {
    setError(null)
  }, [])

  const upload = useCallback(
    async (file, opts = {}) => {
      setError(null)
      setUploading(true)

      try {
        const result = await uploadMediaController({ file, scope, ownerActorId, opts })
        return result
      } catch (err) {
        const wrapped = err instanceof Error ? err : new Error(err?.message || 'Upload failed.')
        setError(wrapped)
        throw wrapped
      } finally {
        setUploading(false)
      }
    },
    [scope, ownerActorId]
  )

  return { upload, uploading, error, reset }
}
