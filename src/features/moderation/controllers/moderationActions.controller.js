// src/features/moderation/controllers/moderationActions.controller.js
// ============================================================
// Moderation Actions Controller (USE-CASE BOUNDARY)
// ------------------------------------------------------------
// Owns meaning + permissions + idempotency.
// Calls DAL, translates to domain.
// ============================================================

import {
  insertModerationActionRow,
  updateReportRowStatus,
  insertReportEventRow,
  hidePostRow,
  hideMessageRow,
  getReportRowById,
} from '@/features/moderation/dal/moderationActions.dal'

import { toDomainReport } from '@/features/moderation/models/report.model'

// NOTE: Permission checks should be either:
// - enforced by RLS (preferred), OR
// - checked here if you have role flags available in identity.
// This controller assumes RLS blocks non-mods.

export async function hideReportedObjectController({
  moderatorActorId,
  reportId,
}) {
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

  const objectType = reportRow.object_type
  const objectId = reportRow.object_id

  // 3) apply enforcement to target object
  if (objectType === 'post') {
    const { error } = await hidePostRow({
      moderatorActorId,
      postId: objectId,
    })
    if (error) return { ok: false, error }
  } else if (objectType === 'message') {
    const { error } = await hideMessageRow({
      moderatorActorId,
      messageId: objectId,
    })
    if (error) return { ok: false, error }
  } else {
    return {
      ok: false,
      error: new Error(`Unsupported hide for object_type=${objectType}`),
    }
  }

  // 4) record moderation action (raw)
  const { error: actionErr } = await insertModerationActionRow({
    actorId: moderatorActorId,
    reportId,
    objectType,
    objectId,
    actionType: 'hide',
    reason: 'moderation_hide',
    expiresAt: null,
  })
  if (actionErr) return { ok: false, error: actionErr }

  // 5) update report state (raw)
  const { row: updatedReportRow, error: updErr } = await updateReportRowStatus({
    reportId,
    status: 'actioned',
    resolution: 'content_removed',
    resolvedAt: new Date().toISOString(),
    reviewedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  if (updErr) return { ok: false, error: updErr }

  // 6) event log (raw)
  await insertReportEventRow({
    reportId,
    actorId: moderatorActorId,
    eventType: 'content_hidden',
    data: { objectType, objectId },
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
    actorId: moderatorActorId,
    eventType: 'dismissed',
    data: { note },
  })

  return { ok: true, report: toDomainReport(updatedReportRow), didChange: true }
}
