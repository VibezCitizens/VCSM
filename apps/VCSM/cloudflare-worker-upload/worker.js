// worker.js — VCSM Upload Worker
// ============================================================
// Auth:   Token validated by calling Supabase /auth/v1/user.
//         Works with HS256 and RS256 — no JWT secret needed.
//         Requires: env.SUPABASE_URL     (set in [vars])
//                   env.SUPABASE_ANON_KEY (set in [vars])
//
// Authorization: The user's Supabase user.id is used to query
//         vc.actor_owners to confirm the actorId embedded in the
//         upload key is owned by this user.
//         Client-supplied actorId/userId is never trusted.
//
// Upload: MIME deny list, MIME allow list, 100MB cap,
//         R2 key prefix validation, safe Content-Type storage.
// ============================================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://vibezcitizens.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Max-Age': '86400',
}

// ============================================================
// Upload security constants
// ============================================================

const MAX_FILE_BYTES = 100 * 1024 * 1024 // 100 MB

const BLOCKED_MIMES = new Set([
  'image/svg+xml',
  'text/html',
  'text/javascript',
  'application/javascript',
  'application/xml',
  'text/xml',
])

const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
])

const ALLOWED_KEY_PREFIXES = new Set([
  'vibes',
  'stories',
  'vdrops',
  'avatar-photos',
  'avatar-banners',
  'vport-avatar-photos',
  'vport-avatar-banners',
  'portfolio',
  'menu-items',
  'vox',
  'design-assets',
  'wanders',
])

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ============================================================
// Token verification
//
// Delegates to Supabase — works for any JWT algorithm (HS256,
// RS256). Returns { ok, userId } on success.
// Fails closed on any error.
// ============================================================

async function verifyToken(token, supabaseUrl, supabaseAnonKey) {
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseAnonKey,
      },
    })

    if (!res.ok) return { ok: false }

    const user = await res.json().catch(() => null)
    if (!user?.id) return { ok: false }

    return { ok: true, userId: user.id }
  } catch {
    return { ok: false }
  }
}

// ============================================================
// Actor ownership verification
//
// Queries vc.actor_owners to confirm the actorId embedded in
// the upload key belongs to the authenticated user.
// Uses the user's own JWT so Supabase RLS limits the query to
// rows where user_id = auth.uid() — no service role key needed.
// Fails closed on any error.
// ============================================================

async function verifyActorOwnership(userId, actorId, supabaseUrl, supabaseAnonKey, userToken) {
  if (!UUID_RE.test(actorId)) return false

  const url = `${supabaseUrl}/rest/v1/actor_owners` +
    `?user_id=eq.${encodeURIComponent(userId)}` +
    `&actor_id=eq.${encodeURIComponent(actorId)}` +
    `&select=actor_id&limit=1`

  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'apikey': supabaseAnonKey,
        'Accept-Profile': 'vc',
      },
    })

    if (!res.ok) return false
    const rows = await res.json().catch(() => [])
    return Array.isArray(rows) && rows.length > 0
  } catch {
    return false
  }
}

// ============================================================
// Upload validation helpers
// ============================================================

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

function normalizeFolder(value) {
  return String(value || '').replace(/^\/+|\/+$/g, '')
}

function validateKey(key) {
  if (!key || typeof key !== 'string') return { ok: false, error: 'Missing object key.' }
  if (key.includes('..') || key.includes('//')) return { ok: false, error: 'Invalid object key.' }
  if (key.startsWith('/') || key.endsWith('/')) return { ok: false, error: 'Invalid object key.' }
  const prefix = key.split('/')[0]
  if (!ALLOWED_KEY_PREFIXES.has(prefix)) return { ok: false, error: 'Invalid object key prefix.' }
  return { ok: true }
}

function validateMime(rawMime) {
  const mime = String(rawMime || '').toLowerCase().split(';')[0].trim()
  if (BLOCKED_MIMES.has(mime)) return { ok: false, error: `File type "${mime}" is not permitted.` }
  if (!ALLOWED_MIMES.has(mime)) return { ok: false, error: 'Only image and video files are accepted.' }
  return { ok: true, safeMime: mime }
}

// ============================================================
// Worker
// ============================================================

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS })
    }

    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      return jsonResponse({ error: 'Worker misconfigured.' }, 500)
    }

    // ── Authentication ─────────────────────────────────────────
    const authHeader = String(request.headers.get('Authorization') || '')
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null

    if (!token) {
      return jsonResponse({ error: 'Unauthorized.' }, 401)
    }

    const authResult = await verifyToken(token, env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
    if (!authResult.ok) {
      return jsonResponse({ error: 'Unauthorized.' }, 401)
    }

    const userId = authResult.userId

    // ── Upload ─────────────────────────────────────────────────
    try {
      const contentLength = parseInt(request.headers.get('content-length') || '0', 10)
      if (contentLength > MAX_FILE_BYTES) {
        return jsonResponse({ error: `File too large. Maximum is ${MAX_FILE_BYTES / 1024 / 1024}MB.` }, 413)
      }

      const form = await request.formData()
      const file = form.get('file')
      const key = String(form.get('key') || '').trim()
      const folder = normalizeFolder(form.get('folder'))

      if (!file) return jsonResponse({ error: 'Missing file.' }, 400)

      // Build and validate the object key
      const safeFallback = `upload-${Date.now()}.bin`
      const safeName = String(file.name || safeFallback)
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/^_+/, '')
      const objectKey = key || [folder, safeName].filter(Boolean).join('/')

      const keyResult = validateKey(objectKey)
      if (!keyResult.ok) return jsonResponse({ error: keyResult.error }, 400)

      // ── Authorization: verify actorId in key is owned by this user ──
      // Key format: {prefix}/{actorId}/{date/…}/{uuid}.{ext}
      // actorId is derived from the key — never from a client-supplied field.
      const keyActorId = objectKey.split('/')[1] ?? ''
      const owned = await verifyActorOwnership(userId, keyActorId, env.SUPABASE_URL, env.SUPABASE_ANON_KEY, token)
      if (!owned) {
        return jsonResponse({ error: 'Forbidden.' }, 403)
      }

      // Second size check catches chunked transfers that omit content-length.
      if (file.size > MAX_FILE_BYTES) {
        return jsonResponse({ error: `File too large. Maximum is ${MAX_FILE_BYTES / 1024 / 1024}MB.` }, 413)
      }

      const mimeResult = validateMime(file.type)
      if (!mimeResult.ok) return jsonResponse({ error: mimeResult.error }, 415)

      await env.R2_BUCKET.put(objectKey, file.stream(), {
        httpMetadata: { contentType: mimeResult.safeMime },
      })

      return jsonResponse({ url: `https://cdn.vibezcitizens.com/${objectKey}` }, 200)
    } catch (err) {
      return jsonResponse({ error: err?.message || 'Upload failed.' }, 500)
    }
  },
}
