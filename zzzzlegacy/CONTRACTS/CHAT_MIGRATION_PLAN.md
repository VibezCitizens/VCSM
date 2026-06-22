# Shared Chat Migration Plan

## Locked Target

Wentrex goes first.
VC is the final migration phase.

The long-term shared-chat identity model is Option A:

```ts
type ActorSource = 'learning' | 'vc'

type ActorRef = {
  actorSource: ActorSource
  actorId: string
}
```

This becomes the canonical actor reference for shared chat at runtime and in storage.

## Code Structure Ownership

- `engines/chat/src/types` owns the public shared-chat actor contract: `ActorSource` and `ActorRef`.
- `engines/chat/src/rules` owns engine-level normalization of actor refs, conversation requests, announcement behavior, and permission decisions.
- `engines/chat/src/services` owns materialization, inbox projection, idempotent send, moderation, and migration-safe orchestration.
- `engines/chat/src/dal` owns `chat.*` storage with explicit `actor_source` on all first-wave tables.
- `apps/wentrex/src/features/communication/policy` owns Wentrex-only role facts and participant rules.
- `apps/wentrex/src/features/communication/adapters/chatEngine.adapter.js` is the only Wentrex app boundary for shared-chat create/evaluate flows.
- `apps/wentrex/src/features/communication/inbox` and `conversation` consume engine hooks exclusively. No app-local DAL/controller/hook code remains.

## Current Status

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1 — Wentrex on engine | **Complete** | Data migrated from learning.communication_* to chat.* |
| Phase 2 — Explicit actor_source | **Complete** | First-wave columns added, backfilled as 'learning', engine writes actor_source |
| Phase 3 — Freeze Wentrex | **Complete** | Screens on engine hooks, app-local dead code removed, RLS enforced |
| Phase 4 — VC migration | **Not started** | Deferred until VC work begins |

### Phase 3 Completion Details

- InboxScreen uses engine `useInbox` hook. Only remaining direct Supabase call is `get_messageable_contacts` RPC (Wentrex policy, not chat data).
- ConversationView uses engine `useConversation`, `useConversationMessages`, `useConversationMembers` hooks.
- Direct conversation creation uses engine `startDirectConversation`.
- `defaultActorSource: 'learning'` configured in setup.js, flows through all write paths.
- App-local DALs, controllers, hooks, models, realtime, components all deleted. Communication feature is 9 files.
- Admin InboxScreen deleted (was unused in routes).
- RLS enabled on all 16 chat tables. 12 user-facing tables with scoped policies, 4 backend-only tables revoked.
- Zero console.log/error/warn in chat engine.
- Zero `learning.communication_*` references in Wentrex app.

## Phase 1 — Wentrex First On Current Schema (COMPLETE)

Goal: move Wentrex behind `engines/chat` and toward `chat.*` as the target model without waiting for `actor_source` columns everywhere.

Acceptance gate (MET):

- Wentrex `/messages` no longer performs direct chat business writes from screen components.
- Wentrex announcement conversations are created through the shared engine.
- Existing Wentrex messaging rules do not regress.
- VC work does not begin.

## Phase 2 — Add Explicit `actor_source` To `chat.*` (COMPLETE)

Goal: make shared-chat storage match the Option A runtime model.

First-wave tables with `actor_source` (DONE):

1. `chat.conversation_members.actor_source`
2. `chat.inbox_entries.actor_source`
3. `chat.messages.sender_actor_source`
4. `chat.conversations.created_by_actor_source`
5. `chat.message_receipts.actor_source`
6. `chat.moderation_actions.actor_source`
7. `chat.audit_log.actor_source`
8. `chat.participant_snapshots.actor_source`

Second-wave tables (DEFERRED to Phase 4):

1. `chat.message_reactions.actor_source`
2. `chat.typing_states.actor_source`
3. `chat.conversation_pins.actor_source`

Phase 2 acceptance gate (MET):

- Engine DAL reads/writes use `chat` schema on all tables.
- Engine DAL writes include `actor_source` on first-wave tables.
- `getDefaultActorSource()` returns `'learning'` for Wentrex, flows through all controller and service write paths.
- Realtime subscriptions use `schema: 'chat'`.

## Phase 3 — Freeze Wentrex On Shared Chat (COMPLETE)

Goal: make Wentrex the stable reference implementation on `chat.*` with explicit actor source.

Acceptance gate (MET):

- Wentrex chat screens consume the engine public surface only.
- Shared chat tables and controllers are the source of truth for Wentrex.
- App-local chat DAL/controller/hook code is deleted (not just bypassed).
- RLS policies enforce membership, posting, management, and moderation checks at the database level.
- Zero console output in the engine.

### RLS Architecture

Helper functions: `chat.current_actor_id()`, `chat.is_conversation_member()`, `chat.can_current_actor_post()`, `chat.can_current_actor_manage()`, `chat.can_current_actor_moderate()`, `chat.can_current_actor_read_message()`.

User-facing tables (12): conversations, conversation_members, messages, inbox_entries, message_receipts, message_attachments, typing_states, moderation_actions, participant_snapshots, saved_messages, conversation_pins, message_reactions.

Backend-only tables (4): outbox_events, legacy_mappings, audit_log, conversation_keys — revoked from authenticated role.

## Phase 4 — VC Migration Last

Goal: migrate VC only after Wentrex is stable and frozen on the shared model.

Scope:

- Backfill VC legacy chat rows into `chat.*`.
- Mark VC actor identity as `actor_source = 'vc'`.
- Add VC-specific conversation policy rules through the same app-policy seam used by Wentrex.
- Add second-wave `actor_source` columns (reactions, typing_states, conversation_pins).
- Migrate VC app flows only after Wentrex parity is complete.

Rules:

- Do not redesign shared chat during VC migration.
- Do not reopen Wentrex behavior changes unless VC exposes a true shared-engine bug.
- VC adapts to the frozen shared model; the shared model is not reshaped around VC first.

## Future Extraction Boundaries

### engines/queue (outbox event processing)

Current surface inside engines/chat:
- `dal/outbox.write.dal.js` — insert, fetch pending, mark published/failed
- `services/outboxService.js` — fetch/mark wrappers with model mapping
- `services/domainEventService.js` — publishes events (in-memory + outbox row)

Extraction boundary: the outbox table (`chat.outbox_events`) and its DAL + service layer can become `engines/queue` when a second engine (e.g., notifications) needs durable event publishing. The domain event service would become a thin wrapper that delegates to the queue engine instead of writing directly to `chat.outbox_events`.

What stays in chat: event names, payload shapes, and the `emit()` in-memory bus. What moves: outbox table ownership, polling, retry, publish/fail lifecycle.

### engines/realtime (Supabase Postgres Changes subscriptions)

Current surface inside engines/chat:
- `dal/subscribeToInbox.js` — listens to `chat.inbox_entries` INSERT/UPDATE/DELETE
- `dal/subscribeToConversation.js` — listens to `chat.messages` INSERT/UPDATE + `chat.conversations` UPDATE
- `dal/typingPresence.dal.js` — Supabase channel for typing presence
- `hooks/useTypingChannel.js` — React hook for typing indicator

Extraction boundary: the Supabase `channel()` + `postgres_changes` subscription pattern can become `engines/realtime` when a second domain (e.g., notifications, activity feeds) needs realtime subscriptions. Each engine would register its tables and filters; the realtime engine would manage channel lifecycle.

What stays in chat: the callback handlers (`onInboxChanged`, `onMessageInserted`, etc.) and the hook state management. What moves: channel creation, subscription management, reconnection logic, filter registration.

### Not ready for extraction yet

- **Typing presence** is tightly coupled to chat UX (channel per conversation, presence tracking). Keep in chat until a second real-time presence domain emerges.
- **Attachment uploads** (`services/attachmentService.js`) depend on chat-specific validation. Keep in chat until a generic file service is needed.

## Non-Negotiables

- Wentrex is the first migration and the reference app.
- VC is the final phase.
- `actorSource + actorId` is the long-term shared-chat identity contract.
- No Wentrex behavior regression is acceptable during any phase.
- Phases 1-3 are complete and frozen. Do not reopen.
