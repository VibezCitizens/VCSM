// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\chat\api\chatApi.views.js
// VERSION: 2025-11-11 (views + inbox visibility filters; abortable; supabase v2)

import { supabase } from '@/lib/supabaseClient'

/**
 * Keep only visible rows:
 *  - archived = false
 *  - AND (archived_until_new = false OR unread_count > 0)
 * This matches "delete/hide" semantics without fighting server-side re-population.
 */
function applyInboxVisibilityFilters(q) {
  // PostgREST: archived=false AND (archived_until_new=false OR unread_count>0)
  return q
    .eq('archived', false)
    .or('archived_until_new.is.false,unread_count.gt.0')
}

/** Base select for vc inbox views */
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

/** Resolve the “other” member + basic header bundle for a conversation */
export async function fetchPartnerBundle(conversationId, selfActorId) {
  // (unchanged) — keep your current implementation here
}

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
