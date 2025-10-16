// Thin wrappers around the centralized DAL. No Supabase calls here.
import chat from "@/data/user/chat/chat.js";


/**
 * Finds (or creates) a private 1:1 conversation and makes it visible to the authed user.
 * - Unarchives YOUR membership
 * - Stamps partner_user_id
 * - Optionally restores history when { restoreHistory: true }
 * Returns: { id, members }
 */
export async function getOrCreateConversation(otherUserId, { restoreHistory = false } = {}) {
  return chat.getOrCreateDirectVisible(otherUserId, { restoreHistory });
}

/**
 * Ensure a VPORT conversation exists between the acting vport and a user.
 * Returns the vport_conversations.id (string or null)
 */
export async function startVportConversation(vportId, receiverUserId) {
  return chat.startVportConversation(vportId, receiverUserId);
}

// Optional: also export a default so callers can do default or named imports.
export default { getOrCreateConversation, startVportConversation };
