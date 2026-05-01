import { getScopeConfig } from '../config/uploadScopes.js'
import { validateMediaFile } from '../lib/validateMediaFile.js'
import { classifyMediaFile } from '../lib/classifyMediaFile.js'
import { compressImageForScope, getImageDimensions } from '../lib/compressImage.js'
import { buildMediaStorageKey } from '../lib/buildMediaStorageKey.js'
import { dalUploadToR2 } from '../dal/r2Upload.dal.js'
import { normalizeMediaUploadResult } from '../model/mediaUploadResult.model.js'

/**
 * uploadMediaController — orchestrates single-file media upload.
 *
 * Pipeline:
 *   1. Validate file against scope rules (size, MIME, SVG block)
 *   2. Classify as image or video
 *   3. Compress image if scope has compression config
 *   4. Re-validate size after compression (prevents bypass via failed compression)
 *   5. Read image dimensions (best-effort, non-fatal)
 *   6. Build collision-proof UUID-based storage key
 *   7. Upload via DAL (configured upload transport)
 *   8. Return normalized MediaUploadResult
 *
 * @param {object} params
 * @param {File}   params.file
 * @param {string} params.scope         — one of UPLOAD_SCOPES keys
 * @param {string} params.ownerActorId  — actor who owns this file
 * @param {{ extraPath?: string }} [params.opts]
 * @returns {Promise<import('../model/mediaUploadResult.model.js').MediaUploadResult>}
 * @throws {Error} on validation failure or upload error
 */
export async function uploadMediaController({ file, scope, ownerActorId, opts = {} }) {
  if (!file)          throw new Error('[MediaEngine] file is required')
  if (!scope)         throw new Error('[MediaEngine] scope is required')
  if (!ownerActorId)  throw new Error('[MediaEngine] ownerActorId is required')

  const scopeConfig = getScopeConfig(scope)

  // 1. Validate before any IO
  const validation = validateMediaFile(file, scope)
  if (!validation.ok) throw new Error(validation.error)

  // 2. Classify
  const { mediaKind } = classifyMediaFile(file)

  // 3. Compress (images only)
  let uploadFile = file
  if (mediaKind === 'image' && scopeConfig.compression) {
    uploadFile = await compressImageForScope(file, scope)

    // 4. Re-validate size after compression attempt.
    // compressImageForScope may return the original file if compression failed.
    // We must never let a compression failure silently bypass the size limit.
    if (uploadFile.size > scopeConfig.maxBytes) {
      const mb = Math.round(scopeConfig.maxBytes / (1024 * 1024))
      throw new Error(`File is too large. Maximum allowed size is ${mb}MB.`)
    }
  }

  // 5. Read image dimensions (best-effort)
  let width = null
  let height = null
  if (mediaKind === 'image') {
    try {
      const dims = await getImageDimensions(uploadFile)
      width = dims.width
      height = dims.height
    } catch {
      // Non-fatal — width/height will be null in the result
    }
  }

  // 6. Build storage key
  const storageKey = buildMediaStorageKey(
    scopeConfig.prefix,
    ownerActorId,
    uploadFile,
    opts
  )

  // 7. Upload via DAL
  const { publicUrl } = await dalUploadToR2(uploadFile, storageKey)

  // 8. Return normalized result
  return normalizeMediaUploadResult({
    publicUrl,
    storageKey,
    mediaKind,
    mimeType: uploadFile.type,
    sizeBytes: uploadFile.size,
    scope,
    ownerActorId,
    width,
    height,
  })
}
