// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\chat\api\chatApi.js
// VERSION: 2025-11-11 (inbox filters + flag helpers; abortable; supabase v2)

import { supabase } from '@/lib/supabaseClient'

/** ---------------------------------------
 * Shared helpers
 * -------------------------------------*/

/**
 * Keep only visible rows:
 *  - archived = false
 *  - AND (archived_until_new = false OR unread_count > 0)
 * This matches "delete/hide" semantics without fighting server-side re-population.
 */
function applyInboxVisibilityFilters(q) {
  // PostgREST: archived=false AND (archived_until_new=false OR unread_count>0)
  return q.eq('archived', false).or('archived_until_new.is.false,unread_count.gt.0')
}

/** Base select for vc inbox views/tables */
const INBOX_SELECT = `
  conversation_id,
  actor_id,
  last_message_id,
  last_message_at,
  unread_count,
  pinned, archived, muted,
  history_cutoff_at, archived_until_new,
  partner_display_name, partner_username, partner_photo_url,
  conversation_title
`

/** ---------------------------------------
 * Conversations
 * -------------------------------------*/

/**
 * Create (or fetch) a 1:1 conversation between two actors.
 * Order-independent; returns conversation_id (uuid).
 * Retries once on duplicate/race errors.
 */
export async function getOrCreateOneToOne(myActorId, partnerActorId, opts = {}) {
  if (!myActorId) throw new Error('getOrCreateOneToOne: myActorId is required')
  if (!partnerActorId) throw new Error('getOrCreateOneToOne: partnerActorId is required')
  if (myActorId === partnerActorId) throw new Error('getOrCreateOneToOne: cannot start a 1:1 with the same actor')

  const [a1, a2] = [myActorId, partnerActorId].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0))

  const call = async () => {
    const { data, error } = await supabase
      .schema('vc')
      .rpc('vc_get_or_create_one_to_one', { a1, a2 }, { signal: opts.signal })

    if (error) {
      const code = error.code || error.hint || 'rpc_error'
      const msg = error.message || 'Unknown error'
      throw Object.assign(new Error(`vc_get_or_create_one_to_one failed [${code}]: ${msg}`), { cause: error })
    }
    if (!data) throw new Error('vc_get_or_create_one_to_one returned no data')
    return data // conversation_id (uuid)
  }

  try {
    return await call()
  } catch (e) {
    const text = `${e.message || ''}`.toLowerCase()
    const isRace =
      text.includes('duplicate') ||
      text.includes('unique') ||
      text.includes('deadlock') ||
      text.includes('serialization') ||
      (e.cause && /23505|40001/.test(String(e.cause.code || '')))
    if (isRace) return await call()
    throw e
  }
}

/** ---------------------------------------
 * Inbox: unified + views
 * -------------------------------------*/

/**
 * Fetch inbox rows for the current actor from vc.inbox_entries.
 * Returns rows sorted by last_message_at DESC.
 * Options:
 *  - includeArchived?: boolean (default false)
 *  - signal?: AbortSignal
 */
export async function listInboxForActor(actorId, opts = {}) {
  if (!actorId) return []

  let q = supabase
    .schema('vc')
    .from('inbox_entries')
    .select(INBOX_SELECT)
    .eq('actor_id', actorId)

  if (!opts.includeArchived) q = applyInboxVisibilityFilters(q)
  q = q.order('last_message_at', { ascending: false })

  if (opts?.signal && typeof q.abortSignal === 'function') q.abortSignal(opts.signal)

  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

/** Inbox for “user”-kind actors, from vc.v_inbox_user */
export async function listUserInbox(actorId, opts = {}) {
  if (!actorId) return []

  let q = supabase
    .schema('vc')
    .from('v_inbox_user')
    .select(INBOX_SELECT)
    .eq('actor_id', actorId)

  if (!opts.includeArchived) q = applyInboxVisibilityFilters(q)
  q = q.order('last_message_at', { ascending: false })

  if (opts.signal && typeof q.abortSignal === 'function') q.abortSignal(opts.signal)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

/** Inbox for “vport”-kind actors, from vc.v_inbox_vport */
export async function listVportInbox(actorId, opts = {}) {
  if (!actorId) return []

  let q = supabase
    .schema('vc')
    .from('v_inbox_vport')
    .select(INBOX_SELECT)
    .eq('actor_id', actorId)

  if (!opts.includeArchived) q = applyInboxVisibilityFilters(q)
  q = q.order('last_message_at', { ascending: false })

  if (opts.signal && typeof q.abortSignal === 'function') q.abortSignal(opts.signal)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

/** ---------------------------------------
 * Conversation header/partner bundle
 * -------------------------------------*/

/** Resolve the “other” member + basic header bundle for a conversation */
export async function fetchPartnerBundle(conversationId, selfActorId) {
  // (unchanged) — keep your existing implementation here
}

/** ---------------------------------------
 * Read state
 * -------------------------------------*/

/** Reads are correct (Accept-Profile: vc via .schema('vc')) */
export async function markConversationRead(conversationId, selfActorId, lastMessageId = null) {
  if (!conversationId || !selfActorId) return
  const { error } = await supabase
    .schema('vc')
    .rpc('mark_read', {
      p_conversation_id: conversationId,
      p_actor_id: selfActorId,
      p_last_message_id: lastMessageId, // null is fine
    })
  if (error) console.error('[markConversationRead] rpc error', error)
}

/** ---------------------------------------
 * Flag helpers (archive / hide-until-new / mute / pin / cutoff)
 * -------------------------------------*/

/** Patch a single inbox row’s flags for this actor */
export async function setInboxFlags(conversationId, actorId, patch) {
  if (!conversationId || !actorId) throw new Error('setInboxFlags: ids required')

  const allowed = ['archived', 'archived_until_new', 'pinned', 'muted', 'history_cutoff_at']
  const body = Object.fromEntries(Object.entries(patch).filter(([k]) => allowed.includes(k)))
  if (Object.keys(body).length === 0) return

  const q = supabase
    .schema('vc')
    .from('inbox_entries')
    .update(body)
    .eq('conversation_id', conversationId)
    .eq('actor_id', actorId)
    .select('conversation_id') // minimal returning

  const { error } = await q
  if (error) throw error
}

/** Hide thread permanently (until user explicitly unarchives) */
export async function archiveConversation(conversationId, actorId) {
  return setInboxFlags(conversationId, actorId, { archived: true, archived_until_new: false })
}

/** Hide thread but let it reappear only when new messages arrive */
export async function hideUntilNew(conversationId, actorId) {
  return setInboxFlags(conversationId, actorId, { archived: false, archived_until_new: true })
}

/** Bring a thread back (both flags off) */
export async function unarchiveConversation(conversationId, actorId) {
  return setInboxFlags(conversationId, actorId, { archived: false, archived_until_new: false })
}

/** Mute/unmute */
export async function setMuted(conversationId, actorId, muted) {
  return setInboxFlags(conversationId, actorId, { muted: !!muted })
}

/** Pin/unpin */
export async function setPinned(conversationId, actorId, pinned) {
  return setInboxFlags(conversationId, actorId, { pinned: !!pinned })
}

/**
 * Cut off visible history (e.g., "delete thread" UX):
 * Set history_cutoff_at = now(). Server-side queries/messages should respect this,
 * but the inbox row remains so membership & unread counters still work.
 */
export async function clearHistoryFromNow(conversationId, actorId) {
  return setInboxFlags(conversationId, actorId, { history_cutoff_at: new Date().toISOString() })
}
