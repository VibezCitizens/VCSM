// src/features/chat/utils/getOrCreateConversation.js
// Thin wrappers around the centralized DAL. No Supabase calls here.
import { chat } from '@/data/chat';

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
