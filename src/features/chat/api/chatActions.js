// src/features/chat/api/chatActions.js
import chat from "@/data/user/chat/chat.js";

const __DBG = true;

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
    const convId = await chat.startVportConversation(vportId, receiverUserId);
    if (__DBG) console.debug("[chatActions.startVportConversation] →", { vportId, receiverUserId, convId });
    return convId || null;
  } catch (err) {
    console.error("startVportConversation failed:", err);
    return null;
  }
}

/** Returns DAL object (use the Id variant for buttons). */
export async function getOrCreateConversation(otherUserId, { restoreHistory = false } = {}) {
  return chat.getOrCreateDirectVisible(otherUserId, { restoreHistory });
}

/** Always returns just the conversation id (or null). */
export async function getOrCreateConversationId(otherUserId, { restoreHistory = false } = {}) {
  try {
    const conv = await chat.getOrCreateDirectVisible(otherUserId, { restoreHistory });
    const id = conv?.id || null;
    if (__DBG) console.debug("[chatActions.getOrCreateConversationId] →", { otherUserId, id });
    return id;
  } catch (err) {
    console.error("getOrCreateConversationId failed:", err);
    return null;
  }
}

/**
 * Single entrypoint for “Message” buttons.
 * Uses identity to decide VPORT vs USER.
 */
export async function openChatWithUser({ identity, targetUserId, restoreHistory = false }) {
  if (__DBG) console.debug("[chatActions.openChatWithUser] input", { identity, targetUserId, restoreHistory });

  if (!targetUserId) return null;

  // VPORT path
  if (identity?.type === "vport" && identity?.vportId) {
    const id = await startVportConversation(identity.vportId, targetUserId);
    if (__DBG) console.debug("[chatActions.openChatWithUser] VPORT conv id", id);
    return id;
  }

  // USER path
  const id = await getOrCreateConversationId(targetUserId, { restoreHistory });
  if (__DBG) console.debug("[chatActions.openChatWithUser] USER conv id", id);
  return id;
}

export default {
  getOrCreateConversation,
  getOrCreateConversationId,
  getOrCreatePrivateConversation,
  startVportConversation,
  openChatWithUser,
};
