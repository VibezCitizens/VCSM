import { configureChatEngine } from '../config.js'
import {
  EVENTS,
  createEventEnvelope,
  emit,
  on,
  removeAllListeners,
} from '../events.js'

import useConversation from '../hooks/useConversation.js'
import useConversationGuards from '../hooks/useConversationGuards.js'
import useConversationMembers from '../hooks/useConversationMembers.js'
import useConversationMessages from '../hooks/useConversationMessages.js'
import useInbox from '../hooks/useInbox.js'
import useInboxActions from '../hooks/useInboxActions.js'
import useInboxEntryForConversation from '../hooks/useInboxEntryForConversation.js'
import useInboxFolder from '../hooks/useInboxFolder.js'
import useTypingChannel from '../hooks/useTypingChannel.js'

import { openConversationController as openConversation } from '../controller/openConversation.controller.js'
import { getConversationMessagesController as getConversationMessages } from '../controller/getConversationMessages.controller.js'
import { getConversationMembersController as getConversationMembers } from '../controller/getConversationMembers.controller.js'
import { readConversationMembersController as readConversationMembers } from '../controller/readConversationMembers.controller.js'
import { ensureConversationMembership } from '../controller/ensureConversationMembership.controller.js'
import { evaluateConversationPolicyController as evaluateConversationPolicy } from '../controller/evaluateConversationPolicy.controller.js'
import { createAllowedConversationController as createAllowedConversation } from '../controller/createAllowedConversation.controller.js'
import { createAnnouncementConversationController as createAnnouncementConversation } from '../controller/createAnnouncementConversation.controller.js'
import { startDirectConversation, startDirectConversation as createConversation } from '../controller/startDirectConversation.controller.js'
import { getOrCreateDirectConversation } from '../controller/getOrCreateDirectConversation.controller.js'
import { sendMessageController as sendMessage } from '../controller/sendMessage.controller.js'
import { editMessageController as editMessage } from '../controller/editMessage.controller.js'
import { deleteMessageForMeController } from '../controller/deleteMessageForMe.controller.js'
import { deleteThreadForMeController } from '../controller/deleteThreadForMe.controller.js'
import { unsendMessageController as unsendMessage } from '../controller/unsendMessage.controller.js'
import { deleteMessageController } from '../controller/deleteMessage.controller.js'
import { markConversationRead } from '../controller/markConversationRead.controller.js'
import { markConversationSpam } from '../controller/markConversationSpam.controller.js'
import { leaveConversation } from '../controller/leaveConversation.controller.js'
import { searchDirectoryController as searchDirectory } from '../controller/searchDirectory.controller.js'
import { ctrlGetInboxEntries as getInboxEntries } from '../controller/getInboxEntries.controller.js'
import { ctrlGetInboxEntryForConversation } from '../controller/getInboxEntryForConversation.controller.js'
import {
  ctrlArchiveConversationForActor as archiveConversationForActor,
  ctrlMoveConversationToFolder as moveConversationToFolder,
  ctrlUpdateInboxFlags as updateInboxFlags,
} from '../controller/inboxActions.controller.js'
import { getPermissionSnapshot } from '../controller/permissions.controller.js'

import { createPermissionSnapshot } from '../model/PermissionSnapshot.model.js'
import MessageModel from '../model/Message.model.js'
import { ConversationMemberModel } from '../model/ConversationMember.model.js'
import { InboxEntryModel } from '../model/InboxEntry.model.js'
import ConversationModel from '../model/Conversation.model.js'
import resolvePartnerActor from '../model/lib/resolvePartnerActor.js'
import buildInboxPreview from '../model/lib/buildInboxPreview.js'
import generateClientId from '../model/lib/generateClientId.js'
import {
  DEFAULT_INBOX_VISIBILITY_SETTINGS,
  DEFAULT_VEX_SETTINGS,
  normalizeInboxVisibilitySettings,
  normalizeVexSettings,
  shouldShowInboxEntry,
} from '../model/vexSettings.model.js'
import {
  CONVERSATION_ROLES,
  canEditConversation,
  canManageMembers,
  hasAtLeastRole,
  isValidConversationRole,
} from '../model/constants/conversationRoles.js'
import {
  MESSAGE_TYPES,
  hasMedia,
  hasText,
  isSystemMessage,
  isValidMessageType,
} from '../model/constants/messageTypes.js'
import {
  INBOX_FLAGS,
  isArchived,
  isMuted,
  isPinned,
  shouldHideFromInbox,
  shouldHighlight,
} from '../model/constants/inboxFlags.js'
import canReadConversation from '../model/permissions/canReadConversation.js'
import canSendMessage from '../model/permissions/canSendMessage.js'
import isActorBlocked from '../model/permissions/isActorBlocked.js'
import {
  CONVERSATION_ACCESS_MODES,
  isAnnouncementConversation,
  normalizeConversationAccessMode,
} from '../rules/conversationAccess.rules.js'

import {
  addReaction,
  groupReactionsForMessage,
  removeReaction,
} from '../services/reactionService.js'
import { markDelivered, markRead } from '../services/receiptService.js'
import {
  attachFileToMessage,
  getAttachmentsForMessage,
  validateAttachment,
} from '../services/attachmentService.js'
import {
  pruneStaleTypingStates,
  startTyping,
  stopTyping,
} from '../services/typingService.js'
import {
  fetchPendingOutboxEvents,
  markOutboxEventFailed,
  markOutboxEventPublished,
} from '../services/outboxService.js'

import {
  DEFAULT_PAGE_SIZE,
  buildPageInfo,
  decodeCursor,
  encodeCursor,
  resolveLimit,
} from '../utils/pagination.js'
import { generateClientId as generateMessageClientId } from '../utils/idempotency.js'

export async function getInboxEntryForConversation(params) {
  return ctrlGetInboxEntryForConversation(params)
}

export async function getUnreadCount(params) {
  const entry = await ctrlGetInboxEntryForConversation(params)
  return Number(entry?.unreadCount || 0)
}

export const hideMessage = deleteMessageForMeController
export const deleteInboxThread = deleteThreadForMeController
export const deleteMessageForSelf = deleteMessageForMeController
export const deleteMessage = deleteMessageForMeController
export const hardDeleteMessage = deleteMessageController
export const deleteMessageAdmin = deleteMessageController

export {
  configureChatEngine,
  on,
  emit,
  createEventEnvelope,
  EVENTS,
  removeAllListeners,
  useInbox,
  useConversation,
  useConversationMessages,
  useConversationMembers,
  useInboxActions,
  useInboxEntryForConversation,
  useInboxFolder,
  useTypingChannel,
  useConversationGuards,
  evaluateConversationPolicy,
  createAllowedConversation,
  createAnnouncementConversation,
  createConversation,
  startDirectConversation,
  getOrCreateDirectConversation,
  openConversation,
  ensureConversationMembership,
  getConversationMessages,
  getConversationMembers,
  readConversationMembers,
  sendMessage,
  editMessage,
  unsendMessage,
  markConversationRead,
  markConversationSpam,
  leaveConversation,
  searchDirectory,
  getInboxEntries,
  archiveConversationForActor,
  moveConversationToFolder,
  updateInboxFlags,
  getPermissionSnapshot,
  createPermissionSnapshot,
  MessageModel,
  ConversationMemberModel,
  InboxEntryModel,
  ConversationModel,
  resolvePartnerActor,
  buildInboxPreview,
  generateClientId,
  DEFAULT_INBOX_VISIBILITY_SETTINGS,
  normalizeInboxVisibilitySettings,
  shouldShowInboxEntry,
  DEFAULT_VEX_SETTINGS,
  normalizeVexSettings,
  CONVERSATION_ROLES,
  isValidConversationRole,
  hasAtLeastRole,
  canManageMembers,
  canEditConversation,
  MESSAGE_TYPES,
  isValidMessageType,
  isSystemMessage,
  hasMedia,
  hasText,
  INBOX_FLAGS,
  isMuted,
  isArchived,
  isPinned,
  shouldHighlight,
  shouldHideFromInbox,
  canReadConversation,
  canSendMessage,
  isActorBlocked,
  CONVERSATION_ACCESS_MODES,
  normalizeConversationAccessMode,
  isAnnouncementConversation,
  addReaction,
  removeReaction,
  groupReactionsForMessage,
  markDelivered,
  markRead,
  attachFileToMessage,
  getAttachmentsForMessage,
  validateAttachment,
  startTyping,
  stopTyping,
  pruneStaleTypingStates,
  fetchPendingOutboxEvents,
  markOutboxEventPublished,
  markOutboxEventFailed,
  encodeCursor,
  decodeCursor,
  buildPageInfo,
  resolveLimit,
  DEFAULT_PAGE_SIZE,
  generateMessageClientId,
}
