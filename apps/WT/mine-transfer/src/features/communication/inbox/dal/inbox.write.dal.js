// src/features/communication/inbox/dal/inbox.write.dal.js
// ============================================================
// Barrel re-export — preserves the original import path for
// all existing callers while the actual implementations live
// in focused DAL files.
// ============================================================

export {
  upsertInboxEntry,
  incrementUnread,
  resetUnread,
  updateInboxLastMessage,
} from './inboxUpsert.write.dal'

export {
  updateInboxFlags,
  archiveConversationForActor,
  moveConversationToFolder,
} from './inboxFlags.write.dal'
