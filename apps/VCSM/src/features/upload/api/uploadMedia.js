import { uploadMediaController } from '@media'

const MAX_VIBES_PHOTOS = 10

function scopeForMode(mode) {
  if (mode === '24drop') return 'story_24drop'
  if (mode === 'vdrop') return 'vdrop'
  return 'vibe_post'
}

function mediaTypeFromKind(mediaKind) {
  if (mediaKind === 'image') return 'image'
  if (mediaKind === 'video') return 'video'
  return 'file'
}

/**
 * Uploads 1..N files and returns { mediaUrls, mediaTypes } preserving order.
 * - VIBES (mode === 'post'): up to 10 images
 * - stories/vdrops: single file (image or video)
 */
export async function uploadMedia(files, actorId, mode = 'post') {
  const list = Array.isArray(files) ? files.filter(Boolean) : []
  if (!list.length) return { mediaUrls: [], mediaTypes: [], uploadResults: [] }

  const scope = scopeForMode(mode)

  // Non-vibes: first file only
  if (mode !== 'post') {
    const result = await uploadMediaController({ file: list[0], scope, ownerActorId: actorId })
    return {
      mediaUrls:     [result.publicUrl],
      mediaTypes:    [mediaTypeFromKind(result.mediaKind)],
      uploadResults: [result],
    }
  }

  // Vibes: images only, up to 10
  const images = list.filter((f) => String(f?.type || '').startsWith('image/'))
  if (!images.length) return { mediaUrls: [], mediaTypes: [] }

  if (images.length > MAX_VIBES_PHOTOS) {
    throw new Error(`VIBES: max ${MAX_VIBES_PHOTOS} photos per upload.`)
  }

  const batchId = Math.floor(Date.now() / 1000).toString(10)

  const results = await Promise.all(
    images.map((file) =>
      uploadMediaController({ file, scope, ownerActorId: actorId, opts: { extraPath: `batch-${batchId}` } })
    )
  )

  return {
    mediaUrls:     results.map((r) => r.publicUrl),
    mediaTypes:    results.map((r) => mediaTypeFromKind(r.mediaKind)),
    uploadResults: results,
  }
}
