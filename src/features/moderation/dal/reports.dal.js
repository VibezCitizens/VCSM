// src/features/moderation/dal/reports.dal.js
import { supabase } from '@/services/supabase/supabaseClient'

// ============================================================
// REPORTS (DAL)
// - dumb DB adapters only
// - schema('vc') always
// - explicit select lists only
// - returns raw rows
// ============================================================

const REPORT_COLUMNS =
  'id,reporter_actor_id,object_type,object_id,conversation_id,post_id,message_id,reason_code,reason_text,status,priority,assigned_to_actor_id,reviewed_at,resolved_at,resolution,internal_note,dedupe_key,created_at,updated_at'

const REPORT_EVENT_COLUMNS =
  'id,report_id,actor_id,event_type,data,created_at'

const MOD_ACTION_COLUMNS =
  'id,actor_id,report_id,object_type,object_id,action_type,expires_at,reason,created_at'

const POST_HIDE_COLUMNS =
  'id,is_hidden,hidden_at,hidden_by_actor_id'

const MESSAGE_HIDE_COLUMNS =
  'id,is_hidden,hidden_at,hidden_by_actor_id'

const INBOX_ENTRY_FOLDER_COLUMNS =
  'conversation_id,actor_id,folder,last_message_id,last_message_at,unread_count,pinned,archived,muted,history_cutoff_at,archived_until_new,partner_display_name,partner_username,partner_photo_url'

function isRlsDenied(error) {
  if (!error) return false
  const code = String(error?.code ?? '')
  const msg = String(error?.message ?? '')
  const details = String(error?.details ?? '')
  return code === '42501' || /row-level security/i.test(`${msg} ${details}`)
}

let skipReportEventsInsertForSession = false

/**
 * upsertInboxEntryFolder (DAL)
 * - creates/updates inbox entry folder for an actor + conversation
 * - returns raw row
 */
export async function upsertInboxEntryFolder({
  actorId,
  conversationId,
  folder,
}) {
  const insert = {
    conversation_id: conversationId,
    actor_id: actorId,
    folder,
  }

  console.groupCollapsed('%c[DAL][inbox_entries.upsertFolder]', 'color:#22c55e;font-weight:bold')
  console.log('payload:', insert)

  const { data, error } = await supabase
    .schema('vc')
    .from('inbox_entries')
    .upsert(insert, { onConflict: 'conversation_id,actor_id' })
    .select(INBOX_ENTRY_FOLDER_COLUMNS)
    .maybeSingle()

  if (error) {
    console.error('❌ supabase error:', error)
  } else {
    console.log('✅ upserted:', {
      conversation_id: data?.conversation_id,
      actor_id: data?.actor_id,
      folder: data?.folder,
    })
  }
  console.groupEnd()

  return { row: data ?? null, error }
}

/**
 * insertReportRow (DAL)
 * - inserts report row and returns raw inserted row
 */
export async function insertReportRow({
  reporterActorId,
  objectType,
  objectId,
  reasonCode,
  reasonText = null,
  conversationId = null,
  postId = null,
  messageId = null,
  status = 'open',
  priority = 3,
  dedupeKey = null,
  createdAt,
  updatedAt,
}) {
  const insert = {
    reporter_actor_id: reporterActorId,
    object_type: objectType,
    object_id: objectId,
    reason_code: reasonCode,
    reason_text: reasonText,

    conversation_id: conversationId,
    post_id: postId,
    message_id: messageId,

    status,
    priority,
    dedupe_key: dedupeKey,
    created_at: createdAt,
    updated_at: updatedAt,
  }

  console.groupCollapsed('%c[DAL][reports.insert]', 'color:#f97316;font-weight:bold')
  console.log('payload:', insert)

  const { data, error } = await supabase
    .schema('vc')
    .from('reports')
    .insert(insert)
    .select(REPORT_COLUMNS)
    .maybeSingle()

  if (error) {
    console.error('❌ supabase error:', error)
    console.groupEnd()
    return { row: null, error }
  } else {
    console.log('✅ inserted id:', data?.id)
  }

  // ✅ BRIDGE: spam report on conversation → move to spam folder for reporter
  if (reasonCode === 'spam' && objectType === 'conversation') {
    const convoId = conversationId ?? data?.conversation_id ?? objectId

    if (convoId) {
      await upsertInboxEntryFolder({
        actorId: reporterActorId,
        conversationId: convoId,
        folder: 'spam',
      })
    } else {
      console.warn('[DAL][reports.insert] spam report missing conversation id', {
        reporterActorId,
        objectType,
        objectId,
        reasonCode,
        conversationId,
        dataConversationId: data?.conversation_id,
      })
    }
  }

  console.groupEnd()

  return { row: data ?? null, error: null }
}

/**
 * getReportRowById (DAL)
 */
export async function getReportRowById({ reportId }) {
  const { data, error } = await supabase
    .schema('vc')
    .from('reports')
    .select(REPORT_COLUMNS)
    .eq('id', reportId)
    .maybeSingle()

  if (error) console.error('[DAL][reports.getById] error', { reportId, error })
  return { row: data ?? null, error }
}

/**
 * getReportRowByDedupeKey (DAL)
 * - optional idempotency helper
 */
export async function getReportRowByDedupeKey({ reporterActorId, dedupeKey }) {
  const { data, error } = await supabase
    .schema('vc')
    .from('reports')
    .select(REPORT_COLUMNS)
    .eq('reporter_actor_id', reporterActorId)
    .eq('dedupe_key', dedupeKey)
    .maybeSingle()

  if (error) console.error('[DAL][reports.getByDedupeKey] error', { reporterActorId, dedupeKey, error })
  return { row: data ?? null, error }
}

/**
 * updateReportRowStatus (DAL)
 * - updates report metadata, returns raw updated row
 */
export async function updateReportRowStatus({
  reportId,
  status,
  reviewedAt = null,
  resolvedAt = null,
  resolution = null,
  internalNote = null,
  updatedAt,
}) {
  const patch = {
    status,
    reviewed_at: reviewedAt,
    resolved_at: resolvedAt,
    resolution,
    internal_note: internalNote,
    updated_at: updatedAt,
  }

  const { data, error } = await supabase
    .schema('vc')
    .from('reports')
    .update(patch)
    .eq('id', reportId)
    .select(REPORT_COLUMNS)
    .maybeSingle()

  if (error) console.error('[DAL][reports.updateStatus] error', { reportId, patch, error })
  return { row: data ?? null, error }
}

/**
 * insertReportEventRow (DAL)
 */
export async function insertReportEventRow({
  reportId,
  actorId = null,
  eventType,
  data = null,
  createdAt,
}) {
  const insert = {
    report_id: reportId,
    actor_id: actorId,
    event_type: eventType,
    data,
    created_at: createdAt,
  }

  if (skipReportEventsInsertForSession) {
    return { row: null, error: null, skipped: true }
  }

  const { error } = await supabase
    .schema('vc')
    .from('report_events')
    .insert(insert)

  if (error) {
    if (isRlsDenied(error)) {
      skipReportEventsInsertForSession = true
      console.warn('[DAL][report_events.insert] skipped by RLS (non-fatal)', {
        reportId,
        actorId,
        eventType,
        code: error?.code ?? null,
        message: error?.message ?? null,
      })
    } else {
      console.error('[DAL][report_events.insert] error', { insert, error })
    }
    return { row: null, error, skipped: false }
  }

  return { row: insert, error: null, skipped: false }
}

/**
 * insertModerationActionRow (DAL)
 */
export async function insertModerationActionRow({
  actorId,
  reportId = null,
  objectType,
  objectId,
  actionType,
  expiresAt = null,
  reason = null,
}) {
  const insert = {
    actor_id: actorId,
    report_id: reportId,
    object_type: objectType,
    object_id: objectId,
    action_type: actionType,
    expires_at: expiresAt,
    reason,
  }

  const { data, error } = await supabase
    .schema('vc')
    .from('moderation_actions')
    .insert(insert)
    .select(MOD_ACTION_COLUMNS)
    .maybeSingle()

  if (error) console.error('[DAL][moderation_actions.insert] error', { insert, error })
  return { row: data ?? null, error }
}

/**
 * hidePostRow (DAL)
 */
export async function hidePostRow({ moderatorActorId, postId, hiddenAt }) {
  const { data, error } = await supabase
    .schema('vc')
    .from('posts')
    .update({
      is_hidden: true,
      hidden_at: hiddenAt,
      hidden_by_actor_id: moderatorActorId,
    })
    .eq('id', postId)
    .select(POST_HIDE_COLUMNS)
    .maybeSingle()

  if (error) console.error('[DAL][posts.hide] error', { moderatorActorId, postId, error })
  return { row: data ?? null, error }
}

/**
 * hideMessageRow (DAL)
 */
export async function hideMessageRow({ moderatorActorId, messageId, hiddenAt }) {
  const { data, error } = await supabase
    .schema('vc')
    .from('messages')
    .update({
      is_hidden: true,
      hidden_at: hiddenAt,
      hidden_by_actor_id: moderatorActorId,
    })
    .eq('id', messageId)
    .select(MESSAGE_HIDE_COLUMNS)
    .maybeSingle()

  if (error) console.error('[DAL][messages.hide] error', { moderatorActorId, messageId, error })
  return { row: data ?? null, error }
}
