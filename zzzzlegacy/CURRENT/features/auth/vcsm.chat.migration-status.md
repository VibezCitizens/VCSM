VCSM Chat Migration Status
==========================

Date: 2026-04-06

CURRENT STATUS
--------------

Runtime classification: **ENGINE-BACKED (COMPLETE)**

Codebase classification: **CLEAN — all legacy vc.* chat code removed**

As of 2026-04-05/06:
- All VCSM chat screens and wrapper hooks delegate to `@chat` engine
- All legacy `vc.*` chat DAL files, controllers, and models have been deleted (46 files removed)
- Only re-export shims, UI components, hooks (engine wrappers), and pure logic remain
- Media/image send pipeline now works end-to-end via `send_message_atomic` RPC with `p_attachments`


1. Verified Runtime Authority
-----------------------------

Engine-backed runtime wrappers verified in current code:

- `inbox/hooks/useInbox.js`
- `inbox/hooks/useInboxActions.js`
- `inbox/hooks/useInboxEntryForConversation.js`
- `conversation/hooks/conversation/useConversation.js`
- `conversation/hooks/conversation/useConversationMembers.js`
- `conversation/hooks/conversation/useConversationMessages.js`
- `conversation/hooks/realtime/useTypingChannel.js`
- `start/hooks/useStartConversation.js`

All wrappers delegate to `@chat` engine. No local DAL or controller code remains.


2. Current Runtime Authority Table
----------------------------------

| Domain | Current runtime authority | Schema / source |
| --- | --- | --- |
| Inbox load | Engine | `chat.inbox_entries` |
| Inbox actions | Engine | `chat.inbox_entries` |
| Inbox single-entry lookup | Engine | `chat.inbox_entries` |
| Start conversation | Engine | `chat.*` |
| Conversation metadata | Engine | `chat.conversations` |
| Conversation members | Engine | `chat.conversation_members` |
| Message timeline reads | Engine | `chat.messages` + `chat.message_attachments` (joined) |
| Message writes (text) | Engine | `chat.send_message_atomic` RPC |
| Message writes (media) | Engine | `chat.send_message_atomic` RPC with `p_attachments` → `chat.message_attachments` |
| Typing presence | Engine | presence channels via engine |
| Chat unread badge | App hook over engine schema | `chat.inbox_entries` |
| Bell notifications | App-local notifications feature | `vc.notifications` |
| Actor summaries / realm | App DI into engine via `@hydration` | `vc.get_actor_summaries` RPC, also writes to global Zustand store |
| Block checks | App DI into engine | `moderation.blocks` WHERE status='active' |
| Moderation/report side effects | App-local | `moderation.reports`, `moderation.report_events`, `moderation.actions` |
| Audit logging | RPC-level | `chat.audit_log` (written by `send_message_atomic` RPC) |


3. Completed Migration Items
-----------------------------

LEGACY CODE REMOVED (2026-04-05)

All of these have been deleted:
- 19 conversation DAL files (vc.* schema queries)
- 4 inbox DAL files
- 5 start DAL files
- 13 conversation controllers
- 4 inbox controllers
- 4 start controllers
- 2 conversation models (Message.model, ConversationMember.model)
- 1 constants file (messageTypes.js)
- 1 utility (generateClientId.js)

Total: 46 legacy files removed.

SCHEMA MIGRATION COMPLETED (2026-04-05)

All remaining VCSM files that touched chat tables now use `.schema('chat')` instead of `.schema('vc')`.

MODERATION MIGRATION COMPLETED (2026-04-06)

All moderation/blocking migrated from:
- `vc.reports` → `moderation.reports`
- `vc.report_events` → `moderation.report_events`
- `vc.moderation_actions` → `moderation.actions`
- `vc.user_blocks` → `moderation.blocks` + `moderation.block_events`

ACTOR HYDRATION CONSOLIDATED (2026-04-06)

Actor hydration moved to shared engine at `engines/hydration/`:
- Zustand store with freshness metadata (5min TTL)
- Safe merge (no null overwrites)
- Chat DI now also writes to global store via `hydrateAndReturnSummaries`

MEDIA SEND PIPELINE COMPLETED (2026-04-05)

- `send_message_atomic` RPC now accepts `p_attachments` JSONB
- Attachments stored in `chat.message_attachments`
- Timeline read joins attachments
- `MessageModel` exposes `mediaUrl` and `attachments`
- Cloudflare upload → attachment metadata → RPC → DB (atomic)


4. Remaining Items
------------------

- `chat.audit_log` — only written by `send_message_atomic` RPC; other operations (edit, delete, leave) still don't write audit entries
- `chat.participant_snapshots` — never written
- `chat.conversation_keys` / encryption — schema exists, not implemented
- `chat.conversation_pins` and `chat.saved_messages` — DAL exists in engine, no UI hooks
- Outbox events conditional for edit/unsend/delete (only sendMessage guaranteed via RPC)
- Bell notification creation for chat messages not verified as wired
