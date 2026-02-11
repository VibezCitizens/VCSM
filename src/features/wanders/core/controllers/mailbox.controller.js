// src/features/wanders/core/controllers/mailbox.controller.js
// ============================================================================
// WANDERS CONTROLLER — MAILBOX (Guest Auth, CORE)
// Owns meaning: "my mailbox" == rows for owner_user_id = auth user.
// ============================================================================

import { ensureGuestUser } from "@/features/wanders/core/controllers/_ensureGuestUser";

import {
  listWandersMailboxItemsByOwnerUserId,
} from "@/features/wanders/core/dal/read/mailbox.read.dal";

import {
  updateWandersMailboxItem,
} from "@/features/wanders/core/dal/write/mailbox.write.dal";

import { toWandersMailboxItem } from "@/features/wanders/models/wandersMailboxItem.model";

/**
 * List mailbox items for current guest user.
 * @param {{ folder?: string|null, ownerRole?: string|null, limit?: number }} input
 */
export async function listMyMailboxAsGuest(input = {}) {
  const user = await ensureGuestUser();

  const rows = await listWandersMailboxItemsByOwnerUserId({
    ownerUserId: user.id,
    folder: input.folder ?? null,
    ownerRole: input.ownerRole ?? null,
    limit: input.limit ?? 50,
  });

  return (rows || []).map(toWandersMailboxItem);
}

/**
 * ✅ Compatibility alias (if other modules expect a different name)
 */
export const listMailboxForViewer = listMyMailboxAsGuest;

/**
 * Mark mailbox item read/unread.
 * @param {{ itemId: string, isRead?: boolean }} input
 */
export async function markMailboxItemRead(input) {
  const nowIso = new Date().toISOString();

  const row = await updateWandersMailboxItem({
    itemId: input.itemId,
    isRead: input.isRead ?? true,
    readAt: (input.isRead ?? true) ? nowIso : null,
  });

  return toWandersMailboxItem(row);
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
  });

  return toWandersMailboxItem(row);
}
