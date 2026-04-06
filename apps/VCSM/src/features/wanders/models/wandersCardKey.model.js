// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\models\wandersCardKey.model.js
// ============================================================================
// WANDERS MODEL — CARD KEY
// ============================================================================

export function toWandersCardKey(row) {
  if (!row) return null
  return {
    cardId: row.card_id,
    wrappedKey: row.wrapped_key,
    alg: row.alg,
    createdAt: row.created_at,
  }
}
