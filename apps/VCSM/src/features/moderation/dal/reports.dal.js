// src/features/moderation/dal/reports.dal.js
import { supabase } from '@/services/supabase/supabaseClient'
import {
  REPORT_COLUMNS,
  MOD_ACTION_COLUMNS,
  POST_HIDE_COLUMNS,
  MESSAGE_HIDE_COLUMNS,
  INBOX_ENTRY_FOLDER_COLUMNS,
} from '@/features/moderation/dal/reports.dal.columns'
export { getReportRowById, getReportRowByDedupeKey } from '@/features/moderation/dal/reports.read.dal'

function logModerationDalError(...args) {
  if (import.meta.env?.DEV) console.error(...args)
}

// ============================================================
// REPORTS (DAL)
// - dumb DB adapters only
// - schema('moderation') for reports, report_events, actions
// - schema('chat') for inbox_entries
// - schema('vc') for posts, messages
// - explicit select lists only
// - returns raw rows
// ============================================================

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
    logModerationDalError('[DAL][inbox_entries.upsertFolder] error', { insert, error })
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
    logModerationDalError('[DAL][moderation.reports.insert] error', { insert, error })
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

  if (error) logModerationDalError('[DAL][moderation.reports.updateStatus] error', { reportId, patch, error })
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

  const { error } = await supabase
    .schema('moderation')
    .from('report_events')
    .insert(insert)

  if (error) {
    logModerationDalError('[DAL][moderation.report_events.insert] error', { insert, error })
    return { row: null, error }
  }

  return { row: insert, error: null }
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

  if (error) logModerationDalError('[DAL][moderation.actions.insert] error', { insert, error })
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

  if (error) logModerationDalError('[DAL][posts.hide] error', { moderatorActorId, postId, error })
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

  if (error) logModerationDalError('[DAL][messages.hide] error', { moderatorActorId, messageId, error })
  return { row: data ?? null, error }
}
