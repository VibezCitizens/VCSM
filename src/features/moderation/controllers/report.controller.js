// src/features/moderation/controllers/report.controller.js
// ============================================================
// Report Controller (USE-CASE BOUNDARY)
// ------------------------------------------------------------
// Owns meaning + idempotency.
// - Creates reports
// - Writes report_events audit trail
// - Returns domain-safe report objects (NOT raw rows)
// ============================================================

import {
  insertReportRow,
  insertReportEventRow,
  getReportRowByDedupeKey, // ✅ fix name
} from '@/features/moderation/dal/reports.dal'

import { toDomainReport } from '@/features/moderation/models/report.model'

export async function createReportController({
  reporterActorId,
  objectType,
  objectId,
  reasonCode,
  reasonText = null,

  conversationId = null,
  postId = null,
  messageId = null,

  dedupeKey = null,
}) {
  if (!reporterActorId) {
    return { ok: false, error: new Error('reporterActorId required') }
  }
  if (!objectType || !objectId) {
    return { ok: false, error: new Error('objectType/objectId required') }
  }
  if (!reasonCode) {
    return { ok: false, error: new Error('reasonCode required') }
  }

  // Controller-level idempotency: optional dedupe
  if (dedupeKey) {
    const { row: existing, error: dedupeErr } =
      await getReportRowByDedupeKey({ // ✅ fix call
        reporterActorId,
        dedupeKey,
      })

    if (dedupeErr) return { ok: false, error: dedupeErr }

    if (existing) {
      return {
        ok: true,
        report: toDomainReport(existing),
        didCreate: false,
      }
    }
  }

  const nowIso = new Date().toISOString()

  const { row: reportRow, error: insertErr } = await insertReportRow({
    reporterActorId,
    objectType,
    objectId,
    reasonCode,
    reasonText: reasonText && String(reasonText).trim() ? String(reasonText).trim() : null,
    conversationId,
    postId,
    messageId,
    dedupeKey,
    createdAt: nowIso,
    updatedAt: nowIso,
  })

  if (insertErr) return { ok: false, error: insertErr }
  if (!reportRow) return { ok: false, error: new Error('Failed to create report') }

  await insertReportEventRow({
    reportId: reportRow.id,
    actorId: reporterActorId,
    eventType: 'created',
    data: {
      object_type: reportRow.object_type,
      object_id: reportRow.object_id,
      reason_code: reportRow.reason_code,
    },
    createdAt: nowIso,
  })

  return {
    ok: true,
    report: toDomainReport(reportRow),
    didCreate: true,
  }
}
