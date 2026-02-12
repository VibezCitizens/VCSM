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

  // ✅ DEBUG: confirm what DAL actually returned (raw)
  try {
    const r0 = rows?.[0];
    const c0 = r0?.card ?? null;

    console.log("[mailbox.controller] rows.length =", Array.isArray(rows) ? rows.length : null);
    console.log("[mailbox.controller] rows[0].keys =", r0 ? Object.keys(r0) : null);
    console.log("[mailbox.controller] rows[0].card keys =", c0 ? Object.keys(c0) : null);

    const rawCustom = c0?.customization;
    console.log("[mailbox.controller] rows[0].card.customization =", rawCustom);
    console.log("[mailbox.controller] rows[0].card.customization type =", typeof rawCustom);

    if (rawCustom && typeof rawCustom === "object") {
      console.log("[mailbox.controller] rows[0] customization has imageUrl =", "imageUrl" in rawCustom);
      console.log("[mailbox.controller] rows[0] customization has image_url =", "image_url" in rawCustom);
    }
  } catch (e) {
    console.warn("[mailbox.controller] raw debug failed", e);
  }

  const mapped = (rows || []).map(toWandersMailboxItem);

  // ✅ DEBUG: confirm what the model produced (mapped)
  try {
    const m0 = mapped?.[0];
    const mc0 = m0?.card ?? null;

    console.log("[mailbox.controller] mapped.length =", Array.isArray(mapped) ? mapped.length : null);
    console.log("[mailbox.controller] mapped[0].keys =", m0 ? Object.keys(m0) : null);
    console.log("[mailbox.controller] mapped[0].card keys =", mc0 ? Object.keys(mc0) : null);

    const mappedCustom = mc0?.customization;
    console.log("[mailbox.controller] mapped[0].card.customization =", mappedCustom);
    console.log("[mailbox.controller] mapped[0].card.customization type =", typeof mappedCustom);

    if (mappedCustom && typeof mappedCustom === "object") {
      console.log("[mailbox.controller] mapped customization has imageUrl =", "imageUrl" in mappedCustom);
      console.log("[mailbox.controller] mapped customization has image_url =", "image_url" in mappedCustom);
      console.log("[mailbox.controller] mapped customization.imageUrl =", mappedCustom.imageUrl ?? null);
      console.log("[mailbox.controller] mapped customization.image_url =", mappedCustom.image_url ?? null);
    }
  } catch (e) {
    console.warn("[mailbox.controller] mapped debug failed", e);
  }

  return mapped;
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
