// ============================================================
// Media Engine — Dependency Injection
// ------------------------------------------------------------
// Host apps must call configureMediaEngine() before use.
// The engine does not import any app-specific service directly.
// ============================================================

let _config = {}

/**
 * Configure the media engine with host-app dependencies.
 *
 * @param {object} config
 * @param {Function} config.uploadFn
 *   (file: File, key: string) => Promise<{ url: string|null, error: string|null }>
 *   The host app's R2 upload transport. Must match the uploadToCloudflare interface.
 * @param {Function} config.publicUrlFn
 *   (key: string) => string
 *   Derives the public CDN URL from a storage key.
 */
export function configureMediaEngine(config) {
  _config = { ..._config, ...config }
}

export function getUploadFn() {
  if (!_config.uploadFn) {
    throw new Error('[MediaEngine] uploadFn not configured. Call configureMediaEngine() first.')
  }
  return _config.uploadFn
}

export function getPublicUrlFn() {
  if (!_config.publicUrlFn) {
    throw new Error('[MediaEngine] publicUrlFn not configured. Call configureMediaEngine() first.')
  }
  return _config.publicUrlFn
}
