// src/features/chat/conversation/features/generateClientId.js
// ============================================================
// generateClientId
// ------------------------------------------------------------
// - Client-owned message identity generator
// - Used for optimistic UI reconciliation
// - Stable across optimistic → realtime → server roundtrip
// - Phase-2 ready (encryption, signing, multi-device)
// - NO side effects
// - NO dependencies
// ============================================================

/**
 * Generate a globally unique client-side message ID.
 *
 * CONTRACT:
 * ------------------------------------------------------------
 * - Generated BEFORE send
 * - Passed through controller → DAL → DB
 * - Returned via realtime + reads
 * - Used to reconcile optimistic messages
 *
 * This ID is NOT the database primary key.
 * It is safe to expose and index.
 *
 * @returns {string} UUID v4
 */
export function generateClientId() {
  // Preferred: native crypto UUID (secure, collision-safe)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  // Fallback: RFC4122-compliant UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/* ============================================================
   EXPORTS
   ============================================================ */

export default generateClientId
