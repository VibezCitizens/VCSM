# Runtime Feature Index: chat

## Metadata
| Field | Value |
|---|---|
| Feature | chat |
| CURRENT Folder | CURRENT/features/chat |
| Source Folder | apps/VCSM/src/features/chat + engines/chat |
| Generated | 2026-06-02 |
| Scope | VCSM |
| Evidence Mode | Source scan + CURRENT evidence |

## Source Inventory
| Layer | Count | Key Files |
|---|---:|---|
| Controllers (app) | 2 | recordChatAttachment.controller.js, chatUnread.controller.js |
| Controllers (engine) | 28 | sendMessage, startDirectConversation, permissions, evaluateConversationPolicy, inboxActions, markConversationRead, getOrCreateDirectConversation, ensureConversationMembership, deleteMessage, editMessage, unsendMessage, leaveConversation, getConversationMessages, getConversationMembers, getInboxEntries, getInboxEntryForConversation, openConversation, readConversationMembers, resolvePickedToActorId, searchDirectory, typingPresence, markConversationSpam, deleteMessageForMe, deleteThreadForMe, createAllowedConversation, createAnnouncementConversation, markConversationRead, permissionsController |
| DALs (app) | 2 | updateAttachmentMediaAsset.write.dal.js, inboxUnread.read.dal.js |
| DALs (engine) | 34 | messages.write, messages.timeline.read, messages.last.read, sendMessageAtomic.rpc, inbox.read, inbox.write, inbox_entries.write, inbox.entry.read, conversationMembers.read, conversationMembers.partner.read, conversationMembership.read, conversationMembership.write, conversations.write, getOrCreateDirectConversation.rpc, openConversation.rpc, blockRelations.read, attachments.write, editMessage.write, moderationActions.write, messageReactions.write, messageReceipts.write, typingPresence, subscribeToConversation, subscribeToInbox, searchActors, savedMessages.write, pins.write, outbox.write, messageVisibility.read, messageForEdit.read, deleteThreadForMe, conversationRead.read, conversationRead.write, actorRealm.read, legacyMappings, typingStates.write |
| Hooks (app) | 22 | useConversation, useConversationMembers, useConversationMessages, useTypingChannel, useSendMessageActions, useChatAttachmentUpload, useConversationActionsMenu, useConversationScroll, useMediaViewer, useMessageActionsMenu, useChatInbox, useInbox, useInboxActions, useInboxEntryForConversation, useInboxFolder, useArchiveChat, useDeleteChat, useMarkChatRead, useChatUnreadOps, useVexSettings, useMessagePrivacySettings, useChatMessagePrefetch, useStartConversation |
| Models (app) | 1 | vexSettings.model.js |
| Models (engine) | 6 | Conversation.model, ConversationMember.model, InboxEntry.model, Message.model, PermissionSnapshot.model, DirectorySearchResult.model, vexSettings.model + constants + lib transformers |
| Screens | 11 | InboxScreen, ArchivedInboxScreen, RequestsInboxScreen, SpamInboxScreen, InboxChatSettingsScreen, InboxSettingsScreen, BlockedUsersScreen, MessagePrivacyScreen, ConversationScreen, ConversationView, StartConversationModal |
| Components | 12 | ChatHeader, ChatInput, ConversationActionsMenu, MessageActionsMenu, MessageBubble, MessageGroup, MessageList, MessageMedia, CardInbox, InboxEmptyState, InboxList, InboxListSkeleton |
| Routes | 7 | /chat, /chat/archived, /chat/requests, /chat/spam, /chat/blocked, /chat/:conversationId, /chat/settings |
| Tests | 0 | NONE FOUND |

## Route / Screen Map
| Route / Screen | Source Path | Public/Auth/Owner | Notes |
|---|---|---|---|
| /chat | apps/VCSM/src/features/chat/inbox/screens/InboxScreen.jsx | AUTH | Main chat inbox; requires identity.actorId |
| /chat/archived | apps/VCSM/src/features/chat/inbox/screens/ArchivedInboxScreen.jsx | AUTH | Archived conversation folder |
| /chat/requests | apps/VCSM/src/features/chat/inbox/screens/RequestsInboxScreen.jsx | AUTH | Message requests inbox |
| /chat/spam | apps/VCSM/src/features/chat/inbox/screens/SpamInboxScreen.jsx | AUTH | Spam folder |
| /chat/blocked | apps/VCSM/src/features/chat/inbox/screens/settings/BlockedUsersScreen.jsx | AUTH | Blocked users management |
| /chat/:conversationId | apps/VCSM/src/features/chat/conversation/screen/ConversationScreen.jsx | AUTH + OWNER | canReadConversation checked (currently from View Screen — SF-01 OPEN) |
| /chat/settings | apps/VCSM/src/features/chat/inbox/screens/InboxChatSettingsScreen.jsx | AUTH | Chat display and privacy settings |
| StartConversationModal | apps/VCSM/src/features/chat/start/screens/StartConversationModal.jsx | AUTH | Modal to start a new conversation; navigates to /chat/:id on success |

## Mutation Surface Map
| Surface | Source Path | Write Type | Ownership Gate Known | Risk |
|---|---|---|---|---|
| recordChatAttachment.controller.js | apps/VCSM/src/features/chat/conversation/controller/ | INSERT platform.media_assets + UPDATE chat.message_attachments | PARTIAL — relies on engine canPost enforcement upstream; no explicit gate at app layer | HIGH |
| updateAttachmentMediaAsset.write.dal.js | apps/VCSM/src/features/chat/conversation/dal/ | UPDATE chat.message_attachments (media_asset_id writeback) | NO — no ownership check; matched only by message_id + storage_path | MEDIUM |
| sendMessage.controller.js (engine) | engines/chat/src/controller/ | INSERT chat.messages + fan-out via RPC | YES — membership_status + can_post + block check enforced | MEDIUM |
| inboxActions.controller.js (engine) | engines/chat/src/controller/ | UPDATE chat.inbox_entries (archive, spam, delete) | YES — actor membership required | LOW |
| markConversationRead.controller.js (engine) | engines/chat/src/controller/ | UPDATE chat.inbox_entries + conversation read pointer | YES — actor membership required | LOW |
| editMessage.write.dal.js (engine) | engines/chat/src/dal/ | UPDATE chat.messages | PARTIAL — controller checks ownership before calling DAL | MEDIUM |
| moderationActions.write.dal.js (engine) | engines/chat/src/dal/ | INSERT chat.moderation_actions | YES — moderation controller enforces identity | LOW |
| conversations.write.dal.js (engine) | engines/chat/src/dal/ | INSERT/UPDATE chat.conversations | YES — startDirectConversation controller orchestrates | LOW |
| attachments.write.dal.js (engine) | engines/chat/src/dal/ | INSERT chat.message_attachments | YES — called only from sendMessageController after content validation | LOW |

## Security-Sensitive Surface Map
| Surface | Source Path | Sensitivity | Evidence |
|---|---|---|---|
| canReadConversation | apps/VCSM/src/features/chat/conversation/permissions/canReadConversation.js | AUTH — membership gate | SF-01 OPEN: called from ConversationView.jsx (View Screen) — must move to hook layer |
| buildInboxPreview | apps/VCSM/src/features/chat/inbox/lib/buildInboxPreview.js | AUTH — preview leak risk | SF-02 OPEN: called from 4 Final Screens — must move to hook |
| sendMessage auth gate | engines/chat/src/controller/sendMessage.controller.js | AUTH — block + membership + can_post | Confirmed present and correct in engine; iOS native lacks canPost parity (FALCON DRIFT-01) |
| chat attachment upload | apps/VCSM/src/features/chat/conversation/hooks/conversation/useChatAttachmentUpload.js | MEDIA — upload to Cloudflare R2 + media_assets insert | Scope locked to 'chat_attachment' via media engine |
| inbox unread badge | apps/VCSM/src/features/chat/inbox/controller/chatUnread.controller.js | AUTH — exposes unread counts | actorId null guard only; no ownership assertion beyond actor_id equality in DAL |
| SECURITY.md | CURRENT/features/chat/ | MISSING | CRITICAL: No standalone SECURITY.md for HIGH-tier feature. VENOM ran 2026-05-11 inline only. |
| chat.inbox_entries index | DB | DB_PERF — query performance at scale | KF-01 OPEN: badge query index existence unverified; CARNAGE required |
| moderation.blocks cross-schema read | engines/chat/src/dal/blockRelations.read.dal.js | AUTH — cross-schema access | Intentional DI: app injects checkBlockRelation; engine reads moderation.blocks for send gate |

## Recommended Next Command

ELEKTRA

## Recommended Next Ticket

TICKET-CHAT-SECURITY-001 — Promote 2026-05-11 VENOM inline findings (vcsm.dal.chat.md) to canonical SECURITY.md. Run ELEKTRA for source-to-sink chain analysis on attachment upload and inbox mutation paths. Resolve SF-01 (canReadConversation to hook), SF-02 (buildInboxPreview to hook). Run CARNAGE to confirm inbox_entries index. This is the THOR gate blocker.
