import { BLOCKED_MIMES } from '../config/uploadLimits.js'
import { getScopeConfig } from '../config/uploadScopes.js'

/**
 * Validate a single file against a scope's rules.
 *
 * Checks (in order):
 *   1. File exists
 *   2. MIME type not in deny list (SVG, script types)
 *   3. MIME type in scope's allow list
 *   4. File size within scope's limit
 *
 * @param {File} file
 * @param {string} scope
 * @returns {{ ok: boolean, error: string|null }}
 */
export function validateMediaFile(file, scope) {
  if (!file) return { ok: false, error: 'No file provided.' }

  const config = getScopeConfig(scope)
  const mime = String(file.type || '').toLowerCase()

  if (BLOCKED_MIMES.includes(mime)) {
    return { ok: false, error: `File type "${mime}" is not permitted.` }
  }

  if (!config.allowedMimes.includes(mime)) {
    const kinds = config.mediaKinds.join(' or ')
    return { ok: false, error: `Only ${kinds} files are accepted for this upload.` }
  }

  if (file.size > config.maxBytes) {
    const mb = Math.round(config.maxBytes / (1024 * 1024))
    return { ok: false, error: `File is too large. Maximum allowed size is ${mb}MB.` }
  }

  return { ok: true, error: null }
}

/**
 * Validate a batch of files against a scope's rules.
 * Checks count limit first, then validates each file individually.
 *
 * @param {File[]} files
 * @param {string} scope
 * @returns {{ ok: boolean, error: string|null }}
 */
export function validateMediaFiles(files, scope) {
  const config = getScopeConfig(scope)
  const fileList = Array.isArray(files) ? files : [files]

  if (fileList.length === 0) return { ok: false, error: 'No files provided.' }

  if (fileList.length > config.maxFiles) {
    return {
      ok: false,
      error: `Too many files. Maximum is ${config.maxFiles} for this upload type.`,
    }
  }

  for (const file of fileList) {
    const result = validateMediaFile(file, scope)
    if (!result.ok) return result
  }

  return { ok: true, error: null }
}
