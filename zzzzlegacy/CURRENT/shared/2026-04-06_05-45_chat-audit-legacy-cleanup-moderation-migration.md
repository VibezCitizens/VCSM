# Session Summary — chat-audit-legacy-cleanup-moderation-migration (2026-04-06)

## What was worked on
- Full audit of Wentrex chat implementation against the `chat.*` database schema (16 tables), producing a table-by-table compliance report with 19 issues found across severity levels
- Read and compared the VCSM chat system against the same schema, discovering VCSM had a dual-path architecture: engine hooks (active, `chat.*`) + legacy DAL files (dead code, `vc.*`)
- Removed all 46 legacy `vc.*` DAL files, controllers, models, and constants from VCSM chat — confirmed they were dead code only used by diagnostics
- Fixed the image/media send pipeline end-to-end: updated the RPC from `send_message_atomic` to `send_message_with_media_atomic` (later consolidated back to `send_message_atomic` with `p_attachments` param), threaded `attachments` through DAL → service → controller → hook → UI, updated `MessageModel` to expose `mediaUrl` and `attachments`, added attachment join to timeline read DAL
- Fixed multiple chat UI bugs: non-scrollable conversation screen (`justify-content: flex-end` scroll bug), media border styling (purple gradient kept for own messages only), inbox sort order, hidden message preview in inbox, archive navigation history stack, missing trash button on archived inbox
- Migrated all schema references from `vc.*` to `chat.*` for chat tables across ~10 files (moderation DALs, diagnostics, scripts)
- Full migration of reporting, blocking, and reporter-local hide flows from `vc.*` tables to new `moderation.*` schema (22 files updated across 5 slices)

## Decisions made
- VCSM local chat controllers/DALs confirmed as dead code — all active UI paths go through engine hooks. Deletion was safe without rewiring.
- Identity DALs (searchActors, blockRelations, actorRealm) inlined into `setup.js` rather than kept as separate files, since they're VCSM-specific DI injections
- Image send uses `chat.message_attachments` table (structured metadata) rather than storing URL in message meta JSONB — supports multiple attachments, dimensions, mime types
- `MessageModel` derives `mediaUrl` from first attachment's `public_url` as a convenience field
- Timeline read DAL joins `message_attachments` via Supabase nested select so existing messages load with attachments on page refresh
- Replaced `justify-content: flex-end` on `.chat-messages` with `margin-top: auto` on first child to fix scroll-to-top browser bug
- Block unblock changed from DELETE to UPDATE `status='released'` with `released_at` timestamp for permanent audit history
- Report schema uses `target_domain`/`target_type`/`target_id` neutral fields; conversation reports get `target_domain='chat'`, post reports get `target_domain='vc'`
- `moderation.block_events` records both block and unblock actions for audit trail

## Files changed
### Chat engine (engines/chat/src/)
- `dal/sendMessageAtomic.rpc.dal.js` — updated RPC name + added `p_attachments` param
- `dal/messages.timeline.read.dal.js` — added `message_attachments` nested join
- `services/messageService.js` — threaded `attachments` param
- `controller/sendMessage.controller.js` — threaded `attachments` param
- `model/Message.model.js` — added `mediaUrl` + `attachments` extraction
- `hooks/useConversationMessages.js` — `onSendMessage` accepts/passes `attachments`, optimistic state includes media
- `controller/getInboxEntries.controller.js` — hidden message filtering for inbox preview + sort guarantee

### VCSM app (apps/VCSM/src/)
#### Deleted (46 legacy files)
- All files in `features/chat/conversation/dal/` (19 DAL files)
- All files in `features/chat/conversation/controllers/` (13 controllers)
- All files in `features/chat/inbox/dal/` (4 DAL files)
- All files in `features/chat/inbox/controllers/` (4 controllers)
- All files in `features/chat/start/dal/` (5 DAL files)
- All files in `features/chat/start/controllers/` (4 controllers)
- `features/chat/conversation/model/Message.model.js`, `ConversationMember.model.js`
- `features/chat/conversation/constants/messageTypes.js`
- `features/chat/conversation/features/messages/generateClientId.js`

#### Modified
- `features/chat/setup.js` — inlined 3 identity DALs, updated block check to `moderation.blocks`
- `features/chat/conversation/hooks/conversation/useSendMessageActions.js` — builds attachments array from Cloudflare upload
- `features/chat/conversation/screen/ConversationView.jsx` — removed unnecessary flex classes
- `features/chat/conversation/layout/ChatScreenLayout.jsx` — added `relative` positioning
- `features/chat/conversation/components/MessageMedia.jsx` — purple gradient border for own messages only
- `features/chat/styles/chat-modern.css` — unchanged (CSS already correct)
- `features/chat/inbox/screens/ArchivedInboxScreen.jsx` — added onDelete prop + useInboxActions
- `features/chat/inbox/constants/inboxSearchAdapter.js` — rewired import to `@chat`
- `features/chat/conversation/hooks/conversation/useConversationActionsMenu.js` — archive/spam navigate with `replace: true`
- `app/platform/ios/ios.css` — replaced `justify-content: flex-end` with `margin-top: auto` first-child

#### Moderation migration (vc.* → moderation.*)
- `features/moderation/dal/reports.dal.js` — `moderation.reports`, `moderation.report_events`, `moderation.actions`
- `features/moderation/dal/moderationActions.dal.js` — `moderation.actions`
- `features/moderation/dal/conversationCover.write.dal.js` — `chat.inbox_entries`
- `features/moderation/dal/conversationCover.read.dal.js` — `chat.messages`
- `features/moderation/controllers/report.controller.js` — new column names
- `features/moderation/controllers/moderationActions.controller.js` — fixed import, new schema
- `features/moderation/controllers/postVisibility.controller.js` — `targetType`/`targetIds`
- `features/moderation/controllers/commentVisibility.controller.js` — `targetType`/`targetIds`
- `features/moderation/models/report.model.js` — handles new + legacy columns
- `features/block/dal/block.write.dal.js` — `moderation.blocks` + `moderation.block_events`
- `features/block/dal/block.read.dal.js` — `moderation.blocks` WHERE `status='active'`
- `features/block/dal/block.check.dal.js` — `moderation.blocks` WHERE `status='active'`
- `features/settings/privacy/dal/blocks.dal.js` — `moderation.blocks`
- `features/settings/privacy/models/blocks.model.js` — new columns
- `features/feed/dal/feed.read.hiddenPosts.dal.js` — `moderation.actions`
- `features/feed/dal/feed.read.blockRows.dal.js` — `moderation.blocks`
- `features/notifications/inbox/dal/blocks.read.dal.js` — `moderation.blocks`
- `features/profiles/dal/friends/blockedActorSet.read.dal.js` — `moderation.blocks`
- `features/explore/dal/search.data.js` — `moderation.blocks` (replaced legacy columns)

#### Diagnostics
- `dev/diagnostics/groups/chatFeature.group.js` — imports from `@chat`
- `dev/diagnostics/groups/chatStartFeature.group.js` — imports from `@chat`
- `dev/diagnostics/groups/chatConversationFeature.group.js` — imports from `@chat`
- `dev/diagnostics/groups/chatInboxFeature.group.js` — imports from `@chat`
- `dev/diagnostics/groups/messaging.group.js` — `chat.*` schema
- `dev/diagnostics/groups/schemaIntegrity.group.js` — `chat.*` schema
- `dev/diagnostics/groups/reports.group.js` — `moderation.*` schema
- `dev/diagnostics/groups/social.group.js` — `moderation.blocks`
- `dev/diagnostics/helpers/ensureContentSeeds.js` — `chat.*` schema
- `scripts/load/simulateAuthenticatedActors.mjs` — `chat.*` schema

## Problems solved
- **Image URL not persisted**: The entire image send pipeline was broken — `mediaUrl` was validated but never forwarded to the RPC. Fixed by threading `attachments` array through the full chain and using the new `send_message_atomic` RPC with `p_attachments` parameter
- **Chat screen not scrollable**: `justify-content: flex-end` on a scroll container is a known CSS bug that makes content above the viewport unreachable. Replaced with `margin-top: auto` on first child
- **Deleted-for-me messages showing in inbox**: Inbox preview wasn't checking `message_receipts.hidden_at`. Added hidden message filtering with backfill to find the previous visible message
- **Archive navigation loop**: Archiving pushed to history stack, so back button returned to the archived conversation. Fixed with `navigate(path, { replace: true })`
- **Missing trash button on archived inbox**: `ArchivedInboxScreen` wasn't passing `onDelete` to `InboxList`
- **Schema routing 404s**: Multiple files still using `vc.*` for chat tables that moved to `chat.*` schema
- **Broken moderationActions.controller.js import**: Was importing functions from wrong DAL file

## Open items
- `chat.audit_log` — still has zero writes from engine controllers (identified in Wentrex audit, not fixed in this session)
- `chat.participant_snapshots` — still has zero writes (identified in audit)
- `chat.conversation_keys` / encryption — schema exists but not implemented
- `chat.conversation_pins` and `chat.saved_messages` — DAL exists in engine but no React hooks for UI
- Engine outbox events are conditional (client-side unsafe) for edit/unsend/delete operations — only sendMessage has guaranteed outbox via atomic RPC
- Stale inbox pointers after unsend/hard-delete (last_message_id points to deleted message) — identified but not fixed
- `moderationActions.dal.js` in moderation feature still has `conversation_id` missing on hide action insert (from earlier audit)
- Diagnostic files use old column names in some insert payloads (e.g., `is_group`, `is_active`, `message_type` in messaging.group.js) — these are vc-schema specific and may fail against chat schema
- The `moderation.*` tables need RLS policies configured to match the old `vc.*` table policies

## Context for next session
The VCSM chat system is now fully running through the shared chat engine with zero legacy `vc.*` DAL files. The image send pipeline is wired end-to-end through `chat.message_attachments`. All reporting, blocking, and moderation flows have been migrated from `vc.reports`/`vc.user_blocks`/`vc.moderation_actions` to the new neutral `moderation.*` schema. The `moderation.*` tables must have proper RLS policies configured in Supabase for the migrated code to work in production. The chat engine audit from planning file 05-16 identified several gaps (audit_log, participant_snapshots, stale inbox pointers) that remain open for future work.
