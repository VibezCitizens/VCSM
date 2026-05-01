/**
 * @typedef {object} MediaUploadResult
 * @property {string}           publicUrl     — CDN URL for the uploaded file
 * @property {string}           storageKey    — R2 object key
 * @property {'image'|'video'}  mediaKind
 * @property {string}           mimeType
 * @property {number|null}      sizeBytes
 * @property {string}           scope
 * @property {string}           ownerActorId
 * @property {number|null}      width         — pixel width (images only, best-effort)
 * @property {number|null}      height        — pixel height (images only, best-effort)
 */

/**
 * Normalize raw upload result into the canonical MediaUploadResult shape.
 * All callers receive a consistent object regardless of scope.
 *
 * @param {object} raw
 * @returns {MediaUploadResult}
 */
export function normalizeMediaUploadResult({
  publicUrl,
  storageKey,
  mediaKind,
  mimeType,
  sizeBytes,
  scope,
  ownerActorId,
  width = null,
  height = null,
}) {
  return {
    publicUrl:    String(publicUrl || ''),
    storageKey:   String(storageKey || ''),
    mediaKind:    mediaKind ?? null,
    mimeType:     String(mimeType || ''),
    sizeBytes:    typeof sizeBytes === 'number' ? sizeBytes : null,
    scope:        String(scope || ''),
    ownerActorId: String(ownerActorId || ''),
    width:        typeof width  === 'number' ? width  : null,
    height:       typeof height === 'number' ? height : null,
  }
}
