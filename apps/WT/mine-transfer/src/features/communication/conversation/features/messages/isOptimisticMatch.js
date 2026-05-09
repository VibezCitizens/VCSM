// src/features/chat/conversation/features/generateClientId.js
// ============================================================
// generateClientId
// ------------------------------------------------------------
// - Client-side message identity generator
// - Used for optimistic UI reconciliation
// - Stable across optimistic → realtime → server roundtrip
// - Phase-2 ready (encryption, signing, multi-device)
// ============================================================

/**
 * Generate a globally unique, client-owned message ID.
 *
 * IMPORTANT:
 * - This ID is NOT tied to database primary keys
 * - It survives optimistic → realtime reconciliation
 * - It is safe to expose in plaintext
 * - It MUST be forwarded to the backend on send
 *
 * @returns {string} UUID v4
 */
export function generateClientId() {
  // Prefer native crypto when available
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/* ============================================================
   EXPORT CONTRACT
   ============================================================ */

export default generateClientId
