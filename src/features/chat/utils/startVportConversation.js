// src/features/chat/utils/startVportConversation.js
// Use the centralized DAL — no direct Supabase calls here.
import { db } from '@/data/data';

/**
 * Ensure a VPORT conversation exists between the acting VPORT and a user.
 * Returns the conversation id (string) or null on failure.
 *
 * Kept the same function name/signature for drop-in replacement.
 */
export async function startVportConversation(vportId, receiverUserId) {
  try {
    if (!vportId || !receiverUserId) return null;

    // chat DAL should encapsulate auth + RPC/SQL details.
    const res = await db.chat.getOrCreateVport(vportId, receiverUserId);

    // Accept either a plain id or an object with { id }.
    const cid = typeof res === 'string' ? res : res?.id;
    return cid ?? null;
  } catch (err) {
    console.error('[startVportConversation] failed:', err);
    return null;
  }
}

export default startVportConversation;
