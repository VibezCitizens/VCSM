# Chat Engine Capability

The reusable chat engine owns chat domain behavior for any app that consumes it through [`src/adapters/chat.adapter.js`](/Users/vcsm/Desktop/VCSM/engines/chat/src/adapters/chat.adapter.js).

## Locked Engine Rules

- Chat is actor-based end to end. The engine accepts `actorId`, never `userId`, `profileId`, or `vportId`.
- Messages are the source of truth. Inbox rows are per-actor metadata and must not block message persistence.
- Message send is idempotent by `clientId`.
- Conversation reads, member reads, conversation creation, hide/delete flows, and moderation actions enforce membership or moderation permissions inside the engine boundary.
- Conversation shape is schema-native: `conversation_kind`, `access_mode`, `visibility`, `scope_kind`, `scope_id`, plus member-level `can_post`, `can_manage`, and `can_moderate`.
- Announcement conversations are first-class engine behavior. Read-only membership is enforced with member posting flags instead of app UI booleans.
- Domain events are emitted with an envelope and may also be written to the outbox for downstream workers.

## Identity Roadmap

- The long-term shared-chat identity model is an explicit actor reference: `actorSource + actorId`.
- Phase 1 keeps Wentrex first. Engine-facing request models and app adapters should treat Wentrex actors as `actorSource: 'learning'` even while some storage remains bridge-backed.
- Phase 2 adds `actor_source` beside actor-bearing IDs in `chat.*` so permissions, membership, send, receipts, inbox, and moderation become domain-explicit in storage as well as in runtime models.
- Phase 3 freezes Wentrex on shared chat as the reference implementation.
- Phase 4 backfills VC as `actorSource: 'vc'` only after Wentrex is stable on the shared model.

## Engine-Owned Workflows

- Conversation lifecycle: start/open/rejoin direct conversations, evaluate policy-driven conversation requests, create announcement conversations, leave/archive semantics, membership enforcement.
- Message lifecycle: send, edit, hide-for-self, unsend-for-all, hard delete for moderators/system.
- Read state: update conversation read pointer and unread reset.
- Inbox projection: sender unread stays `0`; other active members get unread fan-out on send.
- Moderation actions: mark spam, submit report, record moderation hide action.
- Outbox handoff: public adapter exposes outbox worker reads/writes without leaking DAL internals.

## Public Surface Expectations

- Apps import only from `/Users/vcsm/Desktop/VCSM/engines/chat` or [`src/adapters/chat.adapter.js`](/Users/vcsm/Desktop/VCSM/engines/chat/src/adapters/chat.adapter.js).
- Prefer explicit actions such as `evaluateConversationPolicy`, `createAllowedConversation`, `createAnnouncementConversation`, `hideMessage`, `unsendMessage`, `hardDeleteMessage`, `getInboxEntries`, and `getConversationMessages`.
- Apps remain responsible for UI, routes, branding, and app-specific policy facts injected through `configureChatEngine()`. Wentrex now plugs those facts in through an app-side policy resolver rather than screen logic.

## Emitted Events

- `conversation.created`
- `conversation.archived`
- `conversation.read`
- `member.removed`
- `message.sent`
- `message.edited`
- `message.deleted`
- `message.hidden`
- `receipt.read`
- `reaction.added`
- `reaction.removed`
- `attachment.added`
- `report.submitted`
