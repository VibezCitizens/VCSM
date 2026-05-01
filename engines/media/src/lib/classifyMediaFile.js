const IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
])

const VIDEO_MIMES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
])

/**
 * Classify a file as 'image' or 'video' based on its MIME type.
 *
 * @param {File} file
 * @returns {{ mediaKind: 'image'|'video'|null, error: string|null }}
 */
export function classifyMediaFile(file) {
  if (!file) return { mediaKind: null, error: 'No file provided.' }

  const mime = String(file?.type || '').toLowerCase()

  if (IMAGE_MIMES.has(mime)) return { mediaKind: 'image', error: null }
  if (VIDEO_MIMES.has(mime)) return { mediaKind: 'video', error: null }

  return { mediaKind: null, error: `Unrecognized media type: "${mime}"` }
}
