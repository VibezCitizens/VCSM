// src/utils/conversations.js
// Centralized helpers. No direct table inserts. Uses DAL (data/chat.js) which calls SECURITY DEFINER RPCs.

import { supabase } from '@/lib/supabaseClient';
import { chat } from '@/data/chat';

/**
 * Get or create a private 1:1 conversation between the authed user and the other user.
 * - Uses RPC via DAL (getOrCreateDirectVisible) → creates if needed, unarchives your membership,
 *   and stamps partner_user_id. Optionally restores history.
 *
 * @param {string|null} userId1 - usually currentUser.id (ignored; auth determines "me")
 * @param {string} userId2      - the other user's id (or the target if userId1 is me)
 * @param {{ restoreHistory?: boolean }} [opts]
 * @returns {Promise<string|null>} conversation id or null
 */
export async function getOrCreatePrivateConversation(userId1, userId2, opts = {}) {
  const { data: auth, error } = await supabase.auth.getUser();
  if (error || !auth?.user?.id) {
    console.error('[getOrCreatePrivateConversation] not authenticated', error);
    return null;
  }
  const me = auth.user.id;

  // Determine the other participant robustly
  let otherUserId = null;
  if (userId1 && userId1 !== me) otherUserId = userId1;
  if (!otherUserId && userId2 && userId2 !== me) otherUserId = userId2;

  if (!otherUserId || otherUserId === me) {
    console.error('[getOrCreatePrivateConversation] invalid otherUserId', { me, userId1, userId2 });
    return null;
  }

  try {
    const { id } = await chat.getOrCreateDirectVisible(otherUserId, {
      restoreHistory: !!opts.restoreHistory,
    });
    return id || null;
  } catch (e) {
    console.error('[getOrCreatePrivateConversation] DAL error', e);
    return null;
  }
}
