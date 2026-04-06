// src/features/moderation/dal/reports.dal.js
import { supabase } from '@/services/supabase/supabaseClient'

// ============================================================
// REPORTS (DAL)
// - dumb DB adapters only
// - schema('moderation') for reports, report_events, actions
// - schema('chat') for inbox_entries
// - schema('vc') for posts, messages
// - explicit select lists only
// - returns raw rows
// ============================================================

const REPORT_COLUMNS =
  'id,reporter_domain,reporter_actor_id,target_domain,target_type,target_id,parent_target_domain,parent_target_type,parent_target_id,reason_code,reason_text,status,priority,assigned_domain,assigned_actor_id,reviewed_at,resolved_at,resolution,internal_note,dedupe_key,meta,created_at,updated_at'

const REPORT_EVENT_COLUMNS =
  'id,report_id,actor_domain,actor_id,event_type,data,created_at'

const MOD_ACTION_COLUMNS =
  'id,report_id,actor_domain,actor_id,target_domain,target_type,target_id,action_type,reason,expires_at,meta,created_at'

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

  const { data, error } = await supabase
    .schema('chat')
    .from('inbox_entries')
    .upsert(insert, { onConflict: 'conversation_id,actor_id' })
    .select(INBOX_ENTRY_FOLDER_COLUMNS)
    .maybeSingle()

  if (error) {
    console.error('[DAL][inbox_entries.upsertFolder] error', { insert, error })
  }

  return { row: data ?? null, error }
}

/**
 * insertReportRow (DAL)
 * - inserts report row into moderation.reports
 * - returns raw inserted row
 */
export async function insertReportRow({
  reporterActorId,
  reporterDomain = 'vc',
  targetDomain,
  targetType,
  targetId,
  parentTargetDomain = null,
  parentTargetType = null,
  parentTargetId = null,
  reasonCode,
  reasonText = null,
  status = 'open',
  priority = 3,
  dedupeKey = null,
  meta = {},
  createdAt,
  updatedAt,
}) {
  const insert = {
    reporter_domain: reporterDomain,
    reporter_actor_id: reporterActorId,
    target_domain: targetDomain,
    target_type: targetType,
    target_id: targetId,
    parent_target_domain: parentTargetDomain,
    parent_target_type: parentTargetType,
    parent_target_id: parentTargetId,
    reason_code: reasonCode,
    reason_text: reasonText,
    status,
    priority,
    dedupe_key: dedupeKey,
    meta: meta ?? {},
    created_at: createdAt,
    updated_at: updatedAt,
  }

  const { data, error } = await supabase
    .schema('moderation')
    .from('reports')
    .insert(insert)
    .select(REPORT_COLUMNS)
    .maybeSingle()

  if (error) {
    console.error('[DAL][moderation.reports.insert] error', { insert, error })
    return { row: null, error }
  }

  // BRIDGE: spam report on conversation -> move to spam folder for reporter
  if (reasonCode === 'spam' && targetType === 'conversation') {
    const convoId = targetId
    if (convoId) {
      await upsertInboxEntryFolder({
        actorId: reporterActorId,
        conversationId: convoId,
        folder: 'spam',
      })
    }
  }

  return { row: data ?? null, error: null }
}

/**
 * getReportRowById (DAL)
 */
export async function getReportRowById({ reportId }) {
  const { data, error } = await supabase
    .schema('moderation')
    .from('reports')
    .select(REPORT_COLUMNS)
    .eq('id', reportId)
    .maybeSingle()

  if (error) console.error('[DAL][moderation.reports.getById] error', { reportId, error })
  return { row: data ?? null, error }
}

/**
 * getReportRowByDedupeKey (DAL)
 * - idempotency helper
 */
export async function getReportRowByDedupeKey({ reporterActorId, dedupeKey }) {
  const { data, error } = await supabase
    .schema('moderation')
    .from('reports')
    .select(REPORT_COLUMNS)
    .eq('reporter_actor_id', reporterActorId)
    .eq('dedupe_key', dedupeKey)
    .maybeSingle()

  if (error) console.error('[DAL][moderation.reports.getByDedupeKey] error', { reporterActorId, dedupeKey, error })
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
    .schema('moderation')
    .from('reports')
    .update(patch)
    .eq('id', reportId)
    .select(REPORT_COLUMNS)
    .maybeSingle()

  if (error) console.error('[DAL][moderation.reports.updateStatus] error', { reportId, patch, error })
  return { row: data ?? null, error }
}

/**
 * insertReportEventRow (DAL)
 * - inserts into moderation.report_events
 */
export async function insertReportEventRow({
  reportId,
  actorDomain = 'vc',
  actorId = null,
  eventType,
  data = null,
  createdAt,
}) {
  const insert = {
    report_id: reportId,
    actor_domain: actorDomain,
    actor_id: actorId,
    event_type: eventType,
    data,
    created_at: createdAt,
  }

  if (skipReportEventsInsertForSession) {
    return { row: null, error: null, skipped: true }
  }

  const { error } = await supabase
    .schema('moderation')
    .from('report_events')
    .insert(insert)

  if (error) {
    if (isRlsDenied(error)) {
      skipReportEventsInsertForSession = true
      console.warn('[DAL][moderation.report_events.insert] skipped by RLS (non-fatal)', {
        reportId,
        actorId,
        eventType,
        code: error?.code ?? null,
        message: error?.message ?? null,
      })
    } else {
      console.error('[DAL][moderation.report_events.insert] error', { insert, error })
    }
    return { row: null, error, skipped: false }
  }

  return { row: insert, error: null, skipped: false }
}

/**
 * insertModerationActionRow (DAL)
 * - inserts into moderation.actions
 */
export async function insertModerationActionRow({
  actorId,
  actorDomain = 'vc',
  reportId = null,
  targetDomain = 'vc',
  targetType,
  targetId,
  actionType,
  expiresAt = null,
  reason = null,
  meta = {},
}) {
  const insert = {
    report_id: reportId,
    actor_domain: actorDomain,
    actor_id: actorId,
    target_domain: targetDomain,
    target_type: targetType,
    target_id: targetId,
    action_type: actionType,
    expires_at: expiresAt,
    reason,
    meta: meta ?? {},
  }

  const { data, error } = await supabase
    .schema('moderation')
    .from('actions')
    .insert(insert)
    .select(MOD_ACTION_COLUMNS)
    .maybeSingle()

  if (error) console.error('[DAL][moderation.actions.insert] error', { insert, error })
  return { row: data ?? null, error }
}

/**
 * hidePostRow (DAL)
 * - updates vc.posts to set hidden flags
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
 * - updates chat.messages to set hidden flags
 */
export async function hideMessageRow({ moderatorActorId, messageId, hiddenAt }) {
  const { data, error } = await supabase
    .schema('chat')
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
