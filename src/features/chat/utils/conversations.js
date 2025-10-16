// Thin wrappers around the centralized DAL (src/data/user/chat/chat.js).
// ❌ No direct Supabase calls here.

import chat from "@/data/user/chat/chat.js";

/** Finds (or creates) a private 1:1 conversation and returns its id. */
export async function getOrCreatePrivateConversation(userIdA, userIdB) {
  try {
    const conv = await chat.getOrCreatePrivateConversation(userIdA, userIdB);
    return conv?.id || null;
  } catch (err) {
    console.error("getOrCreatePrivateConversation failed:", err);
    return null;
  }
}

/** Ensure a VPORT conversation exists (returns id or null). */
export async function startVportConversation(vportId, receiverUserId) {
  try {
    const conv = await chat.startVportConversation(vportId, receiverUserId);
    return conv?.id || null;
  } catch (err) {
    console.error("startVportConversation failed:", err);
    return null;
  }
}

/** Make a DM visible to the authed user, stamping partner_user_id. */
export async function getOrCreateConversation(otherUserId, { restoreHistory = false } = {}) {
  return chat.getOrCreateDirectVisible(otherUserId, { restoreHistory });
}

export default {
  getOrCreateConversation,
  getOrCreatePrivateConversation,
  startVportConversation,
};
