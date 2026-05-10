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

export async function hideReportedObjectController({
  moderatorActorId,
  reportId,
}) {
  // 0) Authorization: verify caller holds a moderation role before any read or write.
  await assertModerationAccessController(moderatorActorId)

  // 1) read report (raw)
  const { row: reportRow, error: readErr } = await getReportRowById({ reportId })
  if (readErr) return { ok: false, error: readErr }
  if (!reportRow) return { ok: false, error: new Error('Report not found') }

  // 2) idempotency: if already actioned/dismissed, no-op domain result
  if (reportRow.status === 'actioned') {
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
    if (error) return { ok: false, error }
  } else if (targetType === 'message') {
    const { error } = await hideMessageRow({
      moderatorActorId,
      messageId: targetId,
    })
    if (error) return { ok: false, error }
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
  if (actionErr) return { ok: false, error: actionErr }

  // 5) update report state
  const { row: updatedReportRow, error: updErr } = await updateReportRowStatus({
    reportId,
    status: 'actioned',
    resolution: 'content_removed',
    resolvedAt: new Date().toISOString(),
    reviewedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  if (updErr) return { ok: false, error: updErr }

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
  // 0) Authorization: verify caller holds a moderation role before any read or write.
  await assertModerationAccessController(moderatorActorId)

  const { row: reportRow, error: readErr } = await getReportRowById({ reportId })
  if (readErr) return { ok: false, error: readErr }
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
  if (updErr) return { ok: false, error: updErr }

  await insertReportEventRow({
    reportId,
    actorDomain: 'vc',
    actorId: moderatorActorId,
    eventType: 'dismissed',
    data: { note },
  })

  return { ok: true, report: toDomainReport(updatedReportRow), didChange: true }
}
