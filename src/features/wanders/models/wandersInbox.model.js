// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\models\wandersInbox.model.js
// ============================================================================
// WANDERS MODEL — INBOX
// ============================================================================

export function toWandersInbox(row) {
  if (!row) return null
  return {
    id: row.id,
    publicId: row.public_id,
    realmId: row.realm_id,
    ownerActorId: row.owner_actor_id,
    ownerAnonId: row.owner_anon_id,
    isActive: row.is_active,
    acceptsAnon: row.accepts_anon,
    defaultFolder: row.default_folder,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
