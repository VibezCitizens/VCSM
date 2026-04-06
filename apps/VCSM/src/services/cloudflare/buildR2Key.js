// src/services/cloudflare/buildR2Key.js
function pad2(n) {
  return String(n).padStart(2, '0')
}

function randomHex(bytes = 3) {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function extFromFile(file) {
  const name = String(file?.name || '')
  const dot = name.lastIndexOf('.')
  if (dot > -1 && dot < name.length - 1) {
    return name.slice(dot + 1).toLowerCase().replace(/[^\w]+/g, '') || 'bin'
  }

  const type = String(file?.type || '').toLowerCase()
  if (type.includes('/')) {
    const e = type.split('/')[1]
    if (e === 'jpeg') return 'jpg'
    return e.replace(/[^\w]+/g, '') || 'bin'
  }

  return 'bin'
}

/**
 * buildR2Key(prefix, ownerId, file, opts?)
 *
 * prefix examples:
 * - 'profile-pictures'
 * - 'profile-banners'
 * - 'posts'
 * - 'stories'
 * - 'vdrops'
 *
 * ownerId examples:
 * - actorId
 * - vportId
 *
 * opts.extraPath can add extra nesting like conversationId etc.
 */
export function buildR2Key(prefix, ownerId, file, opts = {}) {
  const now = new Date()
  const yyyy = String(now.getFullYear())
  const mm = pad2(now.getMonth() + 1)
  const dd = pad2(now.getDate())

  const ts = Math.floor(Date.now() / 1000)
  const rand = randomHex(3)
  const ext = extFromFile(file)

  const extraPath = String(opts.extraPath || '').replace(/^\/+|\/+$/g, '')
  const mid = extraPath ? `${extraPath}/` : ''

  // <prefix>/<ownerId>/<yyyy>/<mm>/<dd>/<ts>-<rand>.<ext>
  return `${prefix}/${ownerId}/${mid}${yyyy}/${mm}/${dd}/${ts}-${rand}.${ext}`
}
