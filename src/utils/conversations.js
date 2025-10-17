// src/utils/conversations.js
// DEPRECATED: this file used to create conversations directly in public.conversations.
// Now it delegates to the centralized chat DAL to ensure correct behavior for
// both USER and VPORT modes, without changing existing call sites.
//
// Usage (legacy, unchanged):
//   const id = await getOrCreatePrivateConversation(currentUserId, targetUserId);
//
// Optional VPORT support (new, backward-compatible):
//   const id = await getOrCreatePrivateConversation(currentUserId, targetUserId, { vportId });
//
// You can also pass { restoreHistory: true } to un-clear local history on open.

import chat from "@/data/user/chat/chat.js";

/**
 * Get or create a private conversation.
 * - If options.vportId is provided -> ensures a VPORT-to-user conversation and returns its id.
 * - Otherwise -> ensures a user-to-user conversation is visible to the authed user and returns its id.
 *
 * @param {string} userId          // kept for backward compat (not required by DAL)
 * @param {string} targetUserId
 * @param {{ vportId?: string, restoreHistory?: boolean }} [options]
 * @returns {Promise<string|null>}
 */
export async function getOrCreatePrivateConversation(userId, targetUserId, options = {}) {
  const { vportId = null, restoreHistory = false } = options || {};
  try {
    if (!targetUserId) return null;

    // VPORT mode: start/ensure vport conversation path (pairs with /vport/chat/:id screens)
    if (vportId) {
      const convId = await chat.startVportConversation(vportId, targetUserId);
      return convId || null;
    }

    // USER mode: make the DM visible and stamp partner_user_id
    const conv = await chat.getOrCreateDirectVisible(targetUserId, { restoreHistory });
    return conv?.id || null;
  } catch (err) {
    console.error("[utils/conversations] getOrCreatePrivateConversation failed:", err);
    return null;
  }
}

/* Optional convenience exports if you want explicit calls elsewhere */
export async function openUserDm(targetUserId, { restoreHistory = false } = {}) {
  try {
    const conv = await chat.getOrCreateDirectVisible(targetUserId, { restoreHistory });
    return conv?.id || null;
  } catch (err) {
    console.error("[utils/conversations] openUserDm failed:", err);
    return null;
  }
}

export async function openVportDm(vportId, targetUserId) {
  try {
    if (!vportId) throw new Error("openVportDm: missing vportId");
    return await chat.startVportConversation(vportId, targetUserId);
  } catch (err) {
    console.error("[utils/conversations] openVportDm failed:", err);
    return null;
  }
}
