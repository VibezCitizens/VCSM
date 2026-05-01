function pad2(n) {
  return String(n).padStart(2, '0')
}

function getFileExt(file) {
  const name = String(file?.name || '')
  const dot = name.lastIndexOf('.')
  if (dot > -1 && dot < name.length - 1) {
    const raw = name.slice(dot + 1).toLowerCase()
    const clean = raw.replace(/[^\w]+/g, '')
    if (clean) return clean
  }

  const mime = String(file?.type || '').toLowerCase()
  if (mime.includes('/')) {
    const part = mime.split('/')[1]
    if (part === 'jpeg') return 'jpg'
    const clean = part.replace(/[^\w]+/g, '')
    if (clean) return clean
  }

  return 'bin'
}

/**
 * Build a collision-proof, actor-scoped R2 storage key.
 *
 * Format: {prefix}/{ownerActorId}/{extraPath/}{yyyy}/{mm}/{dd}/{uuid}.{ext}
 *
 * - Uses crypto.randomUUID() for UUID-grade uniqueness (vs. timestamp+randomHex(3)).
 * - Raw filename is never trusted — only extension is extracted and sanitized.
 * - Owner actor ID is always in the path for RLS-style auditing.
 *
 * @param {string} prefix        — Scope prefix (e.g. 'menu-items')
 * @param {string} ownerActorId  — Actor who owns this file
 * @param {File}   file          — File being uploaded (used for extension only)
 * @param {{ extraPath?: string }} [opts]
 * @returns {string}
 */
export function buildMediaStorageKey(prefix, ownerActorId, file, opts = {}) {
  if (!prefix) throw new Error('[MediaEngine] buildMediaStorageKey: prefix is required')
  if (!ownerActorId) throw new Error('[MediaEngine] buildMediaStorageKey: ownerActorId is required')

  const now = new Date()
  const yyyy = String(now.getFullYear())
  const mm = pad2(now.getMonth() + 1)
  const dd = pad2(now.getDate())

  const uuid = crypto.randomUUID()
  const ext = getFileExt(file)

  const extraPath = String(opts.extraPath || '').replace(/^\/+|\/+$/g, '')
  const mid = extraPath ? `${extraPath}/` : ''

  return `${prefix}/${ownerActorId}/${mid}${yyyy}/${mm}/${dd}/${uuid}.${ext}`
}
