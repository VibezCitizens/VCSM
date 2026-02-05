// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\models\wandersEvent.model.js
// ============================================================================
// WANDERS MODEL — CARD EVENT
// ============================================================================

export function toWandersCardEvent(row) {
  if (!row) return null
  return {
    id: row.id,
    cardId: row.card_id,
    createdAt: row.created_at,
    actorId: row.actor_id,
    anonId: row.anon_id,
    eventType: row.event_type,
    meta: row.meta,
  }
}
