// src/features/moderation/controllers/report.controller.js
// ============================================================
// Report Controller (USE-CASE BOUNDARY)
// ------------------------------------------------------------
// Owns meaning + idempotency.
// - Creates reports in moderation.reports
// - Writes moderation.report_events audit trail
// - Returns domain-safe report objects (NOT raw rows)
// ============================================================

import {
  insertReportRow,
  insertReportEventRow,
  getReportRowByDedupeKey,
} from '@/features/moderation/dal/reports.dal'

import { toDomainReport } from '@/features/moderation/models/report.model'

/**
 * Resolve target_domain from objectType.
 * Conversations live in chat schema, everything else in vc.
 */
function resolveTargetDomain(objectType) {
  if (objectType === 'conversation') return 'chat'
  return 'vc'
}

export async function createReportController({
  reporterActorId,
  objectType,
  objectId,
  reasonCode,
  reasonText = null,

  // Legacy context fields — mapped to target_* columns
  conversationId = null,
  postId = null,
  messageId = null,

  dedupeKey = null,
  meta = {},
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
      await getReportRowByDedupeKey({
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
  const targetDomain = resolveTargetDomain(objectType)

  const { row: reportRow, error: insertErr } = await insertReportRow({
    reporterActorId,
    reporterDomain: 'vc',
    targetDomain,
    targetType: objectType,
    targetId: objectId,
    reasonCode,
    reasonText: reasonText && String(reasonText).trim() ? String(reasonText).trim() : null,
    dedupeKey,
    meta: {
      ...meta,
      // Preserve legacy context for queries
      conversationId: conversationId ?? null,
      postId: postId ?? null,
      messageId: messageId ?? null,
    },
    createdAt: nowIso,
    updatedAt: nowIso,
  })

  if (insertErr) return { ok: false, error: insertErr }
  if (!reportRow) return { ok: false, error: new Error('Failed to create report') }

  const { error: reportEventError, skipped: reportEventSkipped } = await insertReportEventRow({
    reportId: reportRow.id,
    actorDomain: 'vc',
    actorId: reporterActorId,
    eventType: 'created',
    data: {
      target_domain: targetDomain,
      target_type: objectType,
      target_id: objectId,
      reason_code: reportRow.reason_code,
    },
    createdAt: nowIso,
  })

  // Audit trail is best-effort from client; report creation is authoritative.
  if (reportEventError && !reportEventSkipped) {
    console.warn('[createReportController] report event not persisted (non-fatal)')
  }

  return {
    ok: true,
    report: toDomainReport(reportRow),
    didCreate: true,
  }
}
