// src/season/lovedrop/dal/lovedropOutbox.dal.js
// ============================================================================
// LOVE DROP DAL — OUTBOX ITEMS
// Contract: raw rows only, explicit selects, no derived meaning.
// DEBUG: prints a live overlay on screen + console logs (NO RPCs required).
// ============================================================================

import { getLovedropSupabase } from '@/season/lovedrop/services/lovedropSupabaseClient'

const SCHEMA = 'vc'
const TABLE = 'lovedrop_outbox_items'

const COLS_BASE = [
  'id',
  'card_id',
  'owner_actor_id',
  'owner_anon_id',
  'created_at',
].join(',')

const COLS_OUTBOX_WITH_CARD = [
  'id',
  'created_at',
  [
    'card:card_id (',
    [
      'id',
      'public_id',
      'realm_id',
      'created_at',
      'updated_at',
      'status',
      'sent_at',
      'expires_at',
      'sender_actor_id',
      'sender_anon_id',
      'recipient_actor_id',
      'recipient_anon_id',
      'recipient_email',
      'recipient_phone',
      'recipient_channel',
      'is_anonymous',
      'message_text',
      'message_ciphertext',
      'message_nonce',
      'message_alg',
      'template_key',
      'customization',
      'opened_at',
      'last_opened_at',
      'open_count',
      'sender_claim_token',
      'recipient_claim_token',
      'is_void',
    ].join(','),
    ')',
  ].join(''),
].join(',')

const DEBUG = true
const OVERLAY_ID = '__lovedrop_dal_debug_overlay__'

function safeJson(v) {
  try {
    return JSON.stringify(v, null, 2)
  } catch {
    return String(v)
  }
}

function pickError(e) {
  if (!e) return null
  return {
    message: e.message,
    code: e.code,
    details: e.details,
    hint: e.hint,
    status: e.status,
    name: e.name,
  }
}

// Normalize IDs:
// - undefined/null => null
// - empty/whitespace string => null
// - otherwise keep as-is (do not coerce types)
function normalizeId(v) {
  if (v == null) return null
  if (typeof v === 'string' && v.trim() === '') return null
  return v
}

// === On-screen overlay (no React, no RPCs) ===
function ensureOverlay() {
  if (!DEBUG) return null
  if (typeof document === 'undefined') return null

  let el = document.getElementById(OVERLAY_ID)
  if (el) return el

  el = document.createElement('div')
  el.id = OVERLAY_ID
  el.style.position = 'fixed'
  el.style.zIndex = '2147483647'
  el.style.top = '10px'
  el.style.right = '10px'
  el.style.width = '420px'
  el.style.maxHeight = '70vh'
  el.style.overflow = 'auto'
  el.style.background = 'rgba(0,0,0,0.88)'
  el.style.color = '#fff'
  el.style.border = '1px solid rgba(255,255,255,0.2)'
  el.style.borderRadius = '12px'
  el.style.boxShadow = '0 10px 40px rgba(0,0,0,0.4)'
  el.style.fontFamily =
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
  el.style.fontSize = '12px'
  el.style.lineHeight = '1.35'
  el.style.padding = '10px'
  el.style.whiteSpace = 'pre-wrap'
  el.style.wordBreak = 'break-word'
  el.style.pointerEvents = 'auto'

  const header = document.createElement('div')
  header.style.display = 'flex'
  header.style.alignItems = 'center'
  header.style.justifyContent = 'space-between'
  header.style.gap = '8px'
  header.style.marginBottom = '8px'

  const title = document.createElement('div')
  title.textContent = 'Lovedrop DAL Debug'
  title.style.fontWeight = '800'
  title.style.fontSize = '12px'
  title.style.opacity = '0.95'

  const btns = document.createElement('div')
  btns.style.display = 'flex'
  btns.style.gap = '6px'

  const mkBtn = (label, onClick) => {
    const b = document.createElement('button')
    b.textContent = label
    b.style.border = '1px solid rgba(255,255,255,0.2)'
    b.style.background = 'rgba(255,255,255,0.08)'
    b.style.color = '#fff'
    b.style.borderRadius = '8px'
    b.style.padding = '4px 8px'
    b.style.cursor = 'pointer'
    b.style.fontSize = '12px'
    b.onclick = onClick
    return b
  }

  const body = document.createElement('div')
  body.id = `${OVERLAY_ID}__body`
  body.textContent = ''

  btns.appendChild(
    mkBtn('clear', () => {
      body.textContent = ''
    })
  )
  btns.appendChild(
    mkBtn('hide', () => {
      el.style.display = 'none'
    })
  )

  header.appendChild(title)
  header.appendChild(btns)

  el.appendChild(header)
  el.appendChild(body)
  document.body.appendChild(el)

  // expose helpers for manual control in console
  globalThis.__LD_DEBUG__ = {
    show() {
      const o = document.getElementById(OVERLAY_ID)
      if (o) o.style.display = 'block'
    },
    hide() {
      const o = document.getElementById(OVERLAY_ID)
      if (o) o.style.display = 'none'
    },
    clear() {
      const b = document.getElementById(`${OVERLAY_ID}__body`)
      if (b) b.textContent = ''
    },
  }

  return el
}

function overlayAppend(line) {
  const o = ensureOverlay()
  if (!o) return
  const body = document.getElementById(`${OVERLAY_ID}__body`)
  if (!body) return
  const ts = new Date().toISOString().slice(11, 19)
  body.textContent = `${ts} ${line}\n\n${body.textContent}`
}

function dbg(label, payload) {
  if (!DEBUG) return
  const msg = `${label}\n${safeJson(payload)}`
  console.debug(`[LovedropOutbox.DAL] ${label}`, payload)
  overlayAppend(msg)
}

// === Request tracing fetch wrapper ===
// This lets you SEE the actual request URL + response status + response body (when JSON).
function withDebugFetch(baseFetch) {
  return async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url
    const method =
      init?.method ||
      (typeof Request !== 'undefined' && input instanceof Request ? input.method : 'GET')

    // Merge headers for visibility (do not mutate actual request)
    const h = new Headers(
      (typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined) ||
        init.headers ||
        {}
    )

    // show profile headers if present
    const profile = h.get('content-profile') || h.get('accept-profile') || null
    const clientKey = h.get('x-client-key') ? 'present' : 'missing'

    // log presence only (no secrets)
    const hasApiKey = h.has('apikey')
    const hasAuth = h.has('authorization')

    dbg('fetch.request', {
      method,
      url,
      profile,
      xClientKey: clientKey,
      hasApiKey,
      hasAuth,
    })

    const res = await baseFetch(input, init)

    const info = {
      method,
      url,
      status: res.status,
      ok: res.ok,
      contentType: res.headers.get('content-type'),
    }

    // Try to read response body safely (clone)
    try {
      const ct = res.headers.get('content-type') || ''
      if (ct.includes('application/json')) {
        const j = await res.clone().json()
        dbg('fetch.response.json', { ...info, body: j })
      } else {
        const t = await res.clone().text()
        dbg('fetch.response.text', { ...info, body: t.slice(0, 800) })
      }
    } catch (e) {
      dbg('fetch.response.read_error', { ...info, error: pickError(e) })
    }

    return res
  }
}

/**
 * Insert outbox item (raw row returned).
 * @param {{ cardId: string, ownerActorId?: string|null, ownerAnonId?: string|null }} input
 */
export async function createLovedropOutboxItem(input) {
  // Wrap fetch ONCE per call (no global mutation). This does not change DB meaning.
  const supabase = getLovedropSupabase()
  const originalFetch = supabase?.rest?.fetch || fetch
  const debugFetch = withDebugFetch(originalFetch)

  // If supabase-js exposes rest.fetch, patch it for this call.
  // Fallback: we still get console/overlay logs from errors below.
  if (supabase?.rest && typeof supabase.rest.fetch === 'function') {
    supabase.rest.fetch = debugFetch
  }

  const row = {
    card_id: input.cardId,
    owner_actor_id: normalizeId(input.ownerActorId),
    owner_anon_id: normalizeId(input.ownerAnonId),
  }

  // Hard guardrails: match your RLS intent explicitly
  // - anon insert: actor must be null, anon must be present
  // - actor insert: anon must be null, actor must be present
  const hasActor = row.owner_actor_id != null
  const hasAnon = row.owner_anon_id != null

  if (hasActor && hasAnon) {
    const e = new Error('Outbox insert invalid: both owner_actor_id and owner_anon_id are set.')
    dbg('outbox.insert.validation_error', { error: pickError(e), row })
    throw e
  }
  if (!hasActor && !hasAnon) {
    const e = new Error('Outbox insert invalid: neither owner_actor_id nor owner_anon_id is set.')
    dbg('outbox.insert.validation_error', { error: pickError(e), row })
    throw e
  }

  dbg('outbox.insert.attempt', { schema: SCHEMA, table: TABLE, row })

  // PROBE: forces a request so you can see headers/profile routing in the overlay.
  try {
    const probe = await supabase.schema(SCHEMA).from(TABLE).select('id').limit(1)
    dbg('outbox.probe.select', {
      error: pickError(probe.error),
      count: Array.isArray(probe.data) ? probe.data.length : null,
    })
  } catch (e) {
    dbg('outbox.probe.exception', pickError(e))
  }

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .insert(row)
    .select(COLS_BASE)
    .maybeSingle()

  if (error) {
    dbg('outbox.insert.error', { error: pickError(error), row })
    throw error
  }

  dbg('outbox.insert.ok', { data })
  return data
}

/**
 * List outbox + nested card rows by owner_anon_id.
 * @param {{ ownerAnonId: string, limit?: number }} input
 */
export async function listLovedropOutboxWithCardsByAnonId(input) {
  const supabase = getLovedropSupabase()
  const limit = input?.limit ?? 100

  dbg('outbox.listByAnon.attempt', {
    schema: SCHEMA,
    table: TABLE,
    ownerAnonId: input?.ownerAnonId ?? null,
    limit,
  })

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS_OUTBOX_WITH_CARD)
    .eq('owner_anon_id', input.ownerAnonId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    dbg('outbox.listByAnon.error', { error: pickError(error) })
    throw error
  }

  dbg('outbox.listByAnon.ok', { count: Array.isArray(data) ? data.length : 0 })
  return data ?? []
}

/**
 * List outbox + nested card rows by owner_actor_id.
 * @param {{ ownerActorId: string, limit?: number }} input
 */
export async function listLovedropOutboxWithCardsByActorId(input) {
  const supabase = getLovedropSupabase()
  const limit = input?.limit ?? 100

  dbg('outbox.listByActor.attempt', {
    schema: SCHEMA,
    table: TABLE,
    ownerActorId: input?.ownerActorId ?? null,
    limit,
  })

  const { data, error } = await supabase
    .schema(SCHEMA)
    .from(TABLE)
    .select(COLS_OUTBOX_WITH_CARD)
    .eq('owner_actor_id', input.ownerActorId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    dbg('outbox.listByActor.error', { error: pickError(error) })
    throw error
  }

  dbg('outbox.listByActor.ok', { count: Array.isArray(data) ? data.length : 0 })
  return data ?? []
}

export default {
  createLovedropOutboxItem,
  listLovedropOutboxWithCardsByAnonId,
  listLovedropOutboxWithCardsByActorId,
}
