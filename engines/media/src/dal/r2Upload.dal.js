import { getUploadFn, getPublicUrlFn } from '../config.js'

/**
 * DAL: transport layer for R2 file uploads.
 *
 * Owns the connection to the upload endpoint.
 * Does NOT build keys, validate files, or know about scopes —
 * those are controller and library responsibilities.
 *
 * Calls the uploadFn configured by the host app via configureMediaEngine().
 *
 * @param {File} file
 * @param {string} storageKey — fully-formed R2 object key
 * @returns {Promise<{ publicUrl: string }>}
 * @throws {Error} on upload failure or missing URL in response
 */
export async function dalUploadToR2(file, storageKey) {
  const uploadFn = getUploadFn()
  const result = await uploadFn(file, storageKey)

  if (result?.error) {
    throw new Error(result.error || '[MediaEngine] Upload failed.')
  }

  const publicUrlFn = getPublicUrlFn()
  const url = result?.url || publicUrlFn(storageKey)

  if (!url) {
    throw new Error('[MediaEngine] Upload succeeded but returned no public URL.')
  }

  return { publicUrl: url }
}
