// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\controllers\wandersMailbox.controller.js
// ============================================================================
// WANDERS CONTROLLER — MAILBOX
// ============================================================================

import {
  listWandersMailboxItemsByOwnerAnonId,
  updateWandersMailboxItem,
} from '@/features/wanders/dal/wandersMailbox.dal'
import { ensureWandersAnonIdentity } from '@/features/wanders/controllers/ensureWandersAnoncontroller'
import { toWandersMailboxItem } from '@/features/wanders/models/wandersMailboxItem.model'

/**
 * List mailbox items for current anon.
 * @param {{ folder?: string|null, ownerRole?: string|null, limit?: number }} input
 */
export async function listMyMailboxAsAnon(input = {}) {
  const anon = await ensureWandersAnonIdentity({ touch: true })

  const rows = await listWandersMailboxItemsByOwnerAnonId({
    ownerAnonId: anon.id,
    folder: input.folder ?? null,
    ownerRole: input.ownerRole ?? null,
    limit: input.limit ?? 50,
  })

  return rows.map(toWandersMailboxItem)
}

/**
 * Mark mailbox item read.
 * @param {{ itemId: string, isRead?: boolean }} input
 */
export async function markMailboxItemRead(input) {
  const nowIso = new Date().toISOString()
  const row = await updateWandersMailboxItem({
    itemId: input.itemId,
    isRead: input.isRead ?? true,
    readAt: (input.isRead ?? true) ? nowIso : null,
  })
  return toWandersMailboxItem(row)
}

/**
 * Move mailbox item folder/pin/archive (simple wrapper).
 * @param {{ itemId: string, folder?: string, pinned?: boolean, archived?: boolean }} input
 */
export async function updateMailboxItem(input) {
  const row = await updateWandersMailboxItem({
    itemId: input.itemId,
    folder: input.folder,
    pinned: input.pinned,
    archived: input.archived,
  })
  return toWandersMailboxItem(row)
}
