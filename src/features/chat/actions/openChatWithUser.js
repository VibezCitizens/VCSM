// src/features/chat/actions/openChatWithUser.js
import { startVportConversation, getOrCreateConversation } from "@/features/chat/api/chatActions";
import { emitUnreadDelta } from "@/features/chat/events/badge";

/**
 * Open (or create) a conversation with a target user, respecting current identity.
 * - If identity.type === 'vport': use startVportConversation(vportId, targetUserId) and route to /vport/chat/:id
 * - Else: use getOrCreateConversation(targetUserId) and route to /chat/:id
 *
 * @param {object} params
 * @param {object} params.identity - from useIdentity()
 * @param {string} params.targetUserId - the user you want to chat with
 * @param {Function} params.navigate - react-router navigate
 * @param {Function} [params.onResolved] - optional callback(convId)
 */
export async function openChatWithUser({ identity, targetUserId, navigate, onResolved }) {
  if (!targetUserId || !navigate) return;

  try {
    if (identity?.type === "vport" && identity?.vportId) {
      // VPORT MODE
      const convId = await startVportConversation(identity.vportId, targetUserId);
      if (convId) {
        // no unread delta here (we're opening a just-started thread)
        navigate(`/vport/chat/${convId}`);
        onResolved?.(convId);
      }
      return;
    }

    // USER MODE
    const conv = await getOrCreateConversation(targetUserId, { restoreHistory: false });
    const convId = conv?.id || null;
    if (convId) {
      // reduce badge if any local unread was pre-counted (defensive; usually zero for new threads)
      emitUnreadDelta(0);
      navigate(`/chat/${convId}`);
      onResolved?.(convId);
    }
  } catch (err) {
    console.error("[openChatWithUser] failed:", err);
  }
}

export default { openChatWithUser };
