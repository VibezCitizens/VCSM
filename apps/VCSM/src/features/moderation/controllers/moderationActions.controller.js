// src/features/moderation/controllers/moderationActions.controller.js
// ============================================================
// Moderation Actions Controller (USE-CASE BOUNDARY)
// ------------------------------------------------------------
// Owns meaning + permissions + idempotency.
// Calls DAL, translates to domain.
// Uses moderation.reports, moderation.report_events, moderation.actions
// ============================================================

import {
  insertModerationActionRow,
  updateReportRowStatus,
  insertReportEventRow,
  hidePostRow,
  hideMessageRow,
  getReportRowById,
} from '@/features/moderation/dal/reports.dal'

import { toDomainReport } from '@/features/moderation/models/report.model'
import { assertModerationAccessController } from '@/features/moderation/controllers/assertModerationAccess.controller'
import { captureVcsmError } from '@/services/monitoring/vcsmMonitoring'
import { readCurrentAuthUser } from '@/features/auth/adapters/authSession.adapter'

export async function hideReportedObjectController({
  moderatorActorId,
  reportId,
}) {
  // 0a) Session presence: reject unauthenticated callers before any DB access.
  const sessionUser = await readCurrentAuthUser()
  if (!sessionUser) {
    const err = new Error('hideReportedObjectController: unauthenticated')
    err.code = 'FORBIDDEN'
    throw err
  }

  // 0b) Authorization: verify caller holds a moderation role before any read or write.
  await assertModerationAccessController(moderatorActorId)

  // 1) read report (raw)
  const { row: reportRow, error: readErr } = await getReportRowById({ reportId })
  if (readErr) {
    captureVcsmError({ feature: 'moderation', module: 'moderationActions.controller', severity: 'error', message: `hideReportedObjectController: getReportRowById failed — ${readErr?.message ?? 'unknown'}`, error_name: readErr?.name, operation: 'getReportRowById', is_handled: true, context: { reportId } })
    return { ok: false, error: readErr }
  }
  if (!reportRow) return { ok: false, error: new Error('Report not found') }

  // 2) idempotency: if already actioned or dismissed, no-op domain result
  if (reportRow.status === 'actioned' || reportRow.status === 'dismissed') {
    return {
      ok: true,
      report: toDomainReport(reportRow),
      didChange: false,
    }
  }

  const targetType = reportRow.target_type ?? reportRow.object_type
  const targetId = reportRow.target_id ?? reportRow.object_id
  const targetDomain = reportRow.target_domain ?? 'vc'

  // 3) apply enforcement to target object
  if (targetType === 'post') {
    const { error } = await hidePostRow({
      moderatorActorId,
      postId: targetId,
    })
    if (error) {
      captureVcsmError({ feature: 'moderation', module: 'moderationActions.controller', severity: 'error', message: `hideReportedObjectController: hidePostRow failed — ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'hidePostRow', is_handled: true, context: { reportId, targetId } })
      return { ok: false, error }
    }
  } else if (targetType === 'message') {
    const { error } = await hideMessageRow({
      moderatorActorId,
      messageId: targetId,
    })
    if (error) {
      captureVcsmError({ feature: 'moderation', module: 'moderationActions.controller', severity: 'error', message: `hideReportedObjectController: hideMessageRow failed — ${error?.message ?? 'unknown'}`, error_name: error?.name, operation: 'hideMessageRow', is_handled: true, context: { reportId, targetId } })
      return { ok: false, error }
    }
  } else {
    return {
      ok: false,
      error: new Error(`Unsupported hide for target_type=${targetType}`),
    }
  }

  // 4) record moderation action in moderation.actions
  const { error: actionErr } = await insertModerationActionRow({
    actorId: moderatorActorId,
    actorDomain: 'vc',
    reportId,
    targetDomain,
    targetType,
    targetId,
    actionType: 'hide',
    reason: 'moderation_hide',
    expiresAt: null,
  })
  if (actionErr) {
    captureVcsmError({ feature: 'moderation', module: 'moderationActions.controller', severity: 'error', message: `hideReportedObjectController: insertModerationActionRow failed — ${actionErr?.message ?? 'unknown'}`, error_name: actionErr?.name, operation: 'insertModerationActionRow', is_handled: true, context: { reportId } })
    return { ok: false, error: actionErr }
  }

  // 5) update report state
  const { row: updatedReportRow, error: updErr } = await updateReportRowStatus({
    reportId,
    status: 'actioned',
    resolution: 'content_removed',
    resolvedAt: new Date().toISOString(),
    reviewedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  if (updErr) {
    captureVcsmError({ feature: 'moderation', module: 'moderationActions.controller', severity: 'error', message: `hideReportedObjectController: updateReportRowStatus failed — ${updErr?.message ?? 'unknown'}`, error_name: updErr?.name, operation: 'updateReportRowStatus', is_handled: true, context: { reportId } })
    return { ok: false, error: updErr }
  }

  // 6) event log
  await insertReportEventRow({
    reportId,
    actorDomain: 'vc',
    actorId: moderatorActorId,
    eventType: 'content_hidden',
    data: { targetType, targetId, targetDomain },
  })

  return {
    ok: true,
    report: toDomainReport(updatedReportRow),
    didChange: true,
  }
}

export async function dismissReportController({
  moderatorActorId,
  reportId,
  note = null,
}) {
  // 0a) Session presence: reject unauthenticated callers before any DB access.
  const sessionUser = await readCurrentAuthUser()
  if (!sessionUser) {
    const err = new Error('dismissReportController: unauthenticated')
    err.code = 'FORBIDDEN'
    throw err
  }

  // 0b) Authorization: verify caller holds a moderation role before any read or write.
  await assertModerationAccessController(moderatorActorId)

  const { row: reportRow, error: readErr } = await getReportRowById({ reportId })
  if (readErr) {
    captureVcsmError({ feature: 'moderation', module: 'moderationActions.controller', severity: 'error', message: `dismissReportController: getReportRowById failed — ${readErr?.message ?? 'unknown'}`, error_name: readErr?.name, operation: 'getReportRowById', is_handled: true, context: { reportId } })
    return { ok: false, error: readErr }
  }
  if (!reportRow) return { ok: false, error: new Error('Report not found') }

  if (reportRow.status === 'dismissed' || reportRow.status === 'actioned') {
    return { ok: true, report: toDomainReport(reportRow), didChange: false }
  }

  const now = new Date().toISOString()

  const { row: updatedReportRow, error: updErr } = await updateReportRowStatus({
    reportId,
    status: 'dismissed',
    resolution: 'no_action',
    resolvedAt: now,
    reviewedAt: now,
    updatedAt: now,
    internalNote: note,
  })
  if (updErr) {
    captureVcsmError({ feature: 'moderation', module: 'moderationActions.controller', severity: 'error', message: `dismissReportController: updateReportRowStatus failed — ${updErr?.message ?? 'unknown'}`, error_name: updErr?.name, operation: 'updateReportRowStatus', is_handled: true, context: { reportId } })
    return { ok: false, error: updErr }
  }

  await insertReportEventRow({
    reportId,
    actorDomain: 'vc',
    actorId: moderatorActorId,
    eventType: 'dismissed',
    data: { note },
  })

  return { ok: true, report: toDomainReport(updatedReportRow), didChange: true }
}
