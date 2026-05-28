import { useCallback } from 'react'
import { useMediaUpload } from '@media'

/**
 * Feature hook: upload a single portfolio media file.
 *
 * Wraps the media engine's useMediaUpload with the portfolio_media scope.
 * Returns upload(file) → Promise<MediaUploadResult> — callers use result.publicUrl for the URL.
 *
 * @param {{ actorId: string }} params
 * @returns {{
 *   upload:    (file: File) => Promise<import('@media').MediaUploadResult>,
 *   uploading: boolean,
 *   error:     Error|null,
 *   reset:     () => void,
 * }}
 */
export function usePortfolioMediaUpload({ actorId }) {
  const { upload: uploadMedia, uploading, error, reset } = useMediaUpload({
    scope: 'portfolio_media',
    ownerActorId: actorId,
  })

  const upload = useCallback(
    async (file) => {
      const result = await uploadMedia(file)
      return result
    },
    [uploadMedia]
  )

  return { upload, uploading, error, reset }
}
