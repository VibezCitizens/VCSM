import { getScopeConfig } from '../config/uploadScopes.js'

/**
 * Compress an image file for a given scope.
 *
 * - Skips compression for video files.
 * - Uses scope's { maxDim, quality } config.
 * - If scope has no compression config, returns original file unchanged.
 * - If compression throws, returns original file — but the controller
 *   MUST re-validate size after compression to prevent size-limit bypass.
 *
 * @param {File} file
 * @param {string} scope
 * @returns {Promise<File>}
 */
export async function compressImageForScope(file, scope) {
  if (!file) return file
  if (!file.type.startsWith('image/')) return file

  const config = getScopeConfig(scope)
  if (!config.compression) return file

  const { maxDim, quality } = config.compression

  try {
    return await _compress(file, maxDim, quality)
  } catch {
    // Return original so the controller can re-validate size.
    return file
  }
}

async function _compress(file, maxDim, quality) {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')

  const scale = Math.min(
    maxDim / bitmap.width,
    maxDim / bitmap.height,
    1
  )

  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)

  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('[MediaEngine] Compression produced empty blob.'))
        resolve(
          new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, '.jpg'),
            { type: 'image/jpeg' }
          )
        )
      },
      'image/jpeg',
      quality
    )
  })
}

/**
 * Read pixel dimensions of an image file.
 * Non-fatal — caller should handle rejection gracefully.
 *
 * @param {File} file
 * @returns {Promise<{ width: number, height: number }>}
 */
export function getImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('[MediaEngine] Could not read image dimensions.'))
    }
    img.src = url
  })
}
