# Chat Engine — Public Contract

**Status:** FROZEN (2026-03-31)
**Owner:** Platform infrastructure
**Consumers:** apps/wentrex (via app-owned adapters)

---

## Purpose

Generic actor-based messaging engine. Owns conversations, messages, inbox, receipts, and moderation primitives. Does not know what any specific app means.

---

## Public API

### Configuration
- `configureChatEngine(config)` — must be called once at startup

### Conversation Lifecycle
- `evaluateConversationPolicy(request)` — check if policy allows conversation
- `createAllowedConversation(request)` — create via policy decision
- `createAnnouncementConversation(request)` — create announcement-type conversation
- `startDirectConversation(params)` — full DM flow (resolve + block check + create + open)
- `getOrCreateDirectConversation(params)` — idempotent direct conversation
- `openConversation(conversationId)` — fetch conversation record

### Messages
- `sendMessage`, `editMessage`, `unsendMessage`
- `deleteMessage`, `deleteMessageForSelf`, `hideMessage`
- `hardDeleteMessage`, `deleteMessageAdmin`
- `getConversationMessages(params)` — timeline with visibility filtering

### Inbox
- `getInboxEntries(params)` — fetch inbox with fallback hydration
- `archiveConversationForActor`, `moveConversationToFolder`, `updateInboxFlags`

### Membership
- `ensureConversationMembership`, `getConversationMembers`, `readConversationMembers`

### Directory & Permissions
- `searchDirectory(query)` — actor search (delegates to injected `searchActors`)
- `getPermissionSnapshot(params)` — permission matrix for actor

### Reactions, Receipts, Attachments, Typing, Outbox
- `addReaction`, `removeReaction`, `groupReactionsForMessage`
- `markDelivered`, `markRead`
- `attachFileToMessage`, `getAttachmentsForMessage`, `validateAttachment`
- `startTyping`, `stopTyping`, `pruneStaleTypingStates`
- `fetchPendingOutboxEvents`, `markOutboxEventPublished`, `markOutboxEventFailed`

### Hooks (React)
- `useConversation`, `useConversationMessages`, `useConversationMembers`
- `useInbox`, `useInboxActions`, `useInboxEntryForConversation`, `useInboxFolder`
- `useConversationGuards`

### Models & Constants
- `ConversationModel`, `MessageModel`, `ConversationMemberModel`, `InboxEntryModel`
- `CONVERSATION_ROLES`, `MESSAGE_TYPES`, `INBOX_FLAGS`, `CONVERSATION_ACCESS_MODES`
- `createPermissionSnapshot`

---

## Database Schema

The engine reads/writes ONLY from `chat.*`:

```
chat.conversations
chat.conversation_members
chat.messages
chat.message_receipts
chat.inbox_entries
chat.message_attachments
chat.message_reactions
chat.typing_states
chat.moderation_actions
chat.outbox_events
chat.saved_messages
chat.conversation_pins
chat.legacy_mappings
```

**The engine MUST NOT query:**
- `vc.*` — removed 2026-03-31 (was actor_presentation, actors, user_blocks)
- `learning.*` — belongs to Wentrex app
- `platform.*` — belongs to identity engine
- Any app-specific schema

---

## Dependency Injection

Apps configure the engine at startup:

```javascript
configureChatEngine({
  supabaseClient,                    // required
  getActorSummariesByIds,            // required — actor display data
  resolveRealm,                      // required — realm routing
  resolveConversationPolicy,         // optional — app-specific policy
  canModerateConversation,           // optional — app-specific moderation
  searchActors,                      // required — directory search implementation
  resolveActorRealmContext,          // optional — actor realm routing
  checkBlockRelation,                // optional — block enforcement
  defaultActorSource,                // optional — 'learning' | 'vc' | null
  normalizeHandleTerm,               // optional
  toContainsPattern,                 // optional
  isUuid,                            // optional
})
```

---

## Forbidden Dependencies

- No imports from `apps/`
- No imports from `engines/identity/`
- No `vc.*` schema queries (removed 2026-03-31)
- No `learning.*` schema queries
- No `platform.*` schema queries
- No app-specific role interpretation
- No app-specific policy enforcement (delegate to injected resolver)
- No React components beyond hooks

---

## Generic Fields (app interprets meaning)

- `scope_kind` / `scope_id` — stored and returned, not interpreted
- `actorSource` — tag on messages/members, engine doesn't interpret values
- `realmId` — injected via config, engine doesn't know what a realm means
- `access_mode` — 'standard' | 'announcement', engine enforces `can_post` flag per member

---

## Change Policy

- Public API additions require review
- Internal DAL/service refactors are safe if public API is unchanged
- App-specific code must NEVER be added to this engine
- All external schema dependencies must go through config injection
