// src/features/moderation/models/report.model.js
// ============================================================
// Report Model (DOMAIN TRANSLATOR)
// ------------------------------------------------------------
// Translates raw vc.reports rows → domain-safe report objects
// Pure, deterministic, no side effects.
// ============================================================

/**
 * @param {object} row - raw vc.reports row (snake_case)
 * @returns {object|null} domain-safe report object
 */
export function toDomainReport(row) {
  if (!row) return null

  return {
    // identity
    id: row.id,

    // reporter
    reporterActorId: row.reporter_actor_id,

    // target
    objectType: row.object_type,
    objectId: row.object_id,

    // context (nullable)
    conversationId: row.conversation_id ?? null,
    postId: row.post_id ?? null,
    messageId: row.message_id ?? null,

    // reason
    reasonCode: row.reason_code,
    reasonText: row.reason_text ?? null,

    // state
    status: row.status,
    priority: row.priority,

    assignedToActorId: row.assigned_to_actor_id ?? null,

    reviewedAt: row.reviewed_at ?? null,
    resolvedAt: row.resolved_at ?? null,
    resolution: row.resolution ?? null,

    internalNote: row.internal_note ?? null,

    // dedupe / idempotency
    dedupeKey: row.dedupe_key ?? null,

    // timestamps
    createdAt: row.created_at,
    updatedAt: row.updated_at,

    // derived meaning (SAFE)
    isOpen: row.status === 'open',
    isResolved:
      row.status === 'actioned' ||
      row.status === 'dismissed',

    hasResolution: !!row.resolution,
  }
}

/**
 * Optional: bulk translation helper
 * ------------------------------------------------------------
 * @param {Array<object>} rows
 * @returns {Array<object>}
 */
export function toDomainReports(rows) {
  if (!Array.isArray(rows)) return []
  return rows.map(toDomainReport).filter(Boolean)
}
