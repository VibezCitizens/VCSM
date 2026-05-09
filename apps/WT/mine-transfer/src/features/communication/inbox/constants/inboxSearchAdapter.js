import { searchDirectoryController } from
  '@/features/chat/start/controllers/searchDirectory.controller'

/**
 * inboxOnSearch
 * ------------------------------------------------------------
 * - Actor-agnostic search adapter
 * - UI-safe (used by StartConversationModal)
 * - Returns normalized rows for picking
 *
 * NOTE:
 * - Does NOT resolve actorId
 * - Does NOT create conversations
 * - Pure search adapter
 */
export async function inboxOnSearch(query, opts = {}) {
  const {
    kinds = 'both',           // 'users' | 'vports' | 'both'
    excludeProfileId,
    excludeVportId,
    limitPerKind = 8,
  } = opts

  // ✅ SINGLE ENTRYPOINT — controller owns logic
  let rows = await searchDirectoryController(query, {
    kinds,
    limitPerKind,
  })

  // Optional exclusions (UI concern = allowed here)
  if (excludeProfileId) {
    rows = rows.filter(
      (r) => !(r.kind === 'user' && r.id === excludeProfileId)
    )
  }

  if (excludeVportId) {
    rows = rows.filter(
      (r) => !(r.kind === 'vport' && r.id === excludeVportId)
    )
  }

  // Normalize for modal consumption
  return rows.map((r) => ({
    id: r.id,
    display_name: r.display_name,
    username: r.username,
    photo_url: r.photo_url,
    _kind: r.kind,
  }))
}
