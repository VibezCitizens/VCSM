// src/features/moderation/models/report.model.js
// ============================================================
// Report Model (DOMAIN TRANSLATOR)
// ------------------------------------------------------------
// Translates raw moderation.reports rows → domain-safe objects
// Pure, deterministic, no side effects.
// ============================================================

/**
 * @param {object} row - raw moderation.reports row (snake_case)
 * @returns {object|null} domain-safe report object
 */
export function toDomainReport(row) {
  if (!row) return null

  return {
    // identity
    id: row.id,

    // reporter
    reporterDomain: row.reporter_domain ?? 'vc',
    reporterActorId: row.reporter_actor_id,

    // target (new neutral fields)
    targetDomain: row.target_domain ?? null,
    targetType: row.target_type ?? row.object_type ?? null,
    targetId: row.target_id ?? row.object_id ?? null,

    // parent target
    parentTargetDomain: row.parent_target_domain ?? null,
    parentTargetType: row.parent_target_type ?? null,
    parentTargetId: row.parent_target_id ?? null,

    // legacy aliases (for backward compat in UI)
    objectType: row.target_type ?? row.object_type ?? null,
    objectId: row.target_id ?? row.object_id ?? null,
    conversationId: row.meta?.conversationId ?? row.conversation_id ?? null,
    postId: row.meta?.postId ?? row.post_id ?? null,
    messageId: row.meta?.messageId ?? row.message_id ?? null,

    // reason
    reasonCode: row.reason_code,
    reasonText: row.reason_text ?? null,

    // state
    status: row.status,
    priority: row.priority,

    assignedDomain: row.assigned_domain ?? null,
    assignedActorId: row.assigned_actor_id ?? null,

    reviewedAt: row.reviewed_at ?? null,
    resolvedAt: row.resolved_at ?? null,
    resolution: row.resolution ?? null,

    internalNote: row.internal_note ?? null,

    // dedupe / idempotency
    dedupeKey: row.dedupe_key ?? null,

    // meta
    meta: row.meta ?? {},

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
 * @param {Array<object>} rows
 * @returns {Array<object>}
 */
export function toDomainReports(rows) {
  if (!Array.isArray(rows)) return []
  return rows.map(toDomainReport).filter(Boolean)
}
