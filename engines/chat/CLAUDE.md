# Engine: Chat

You are working inside a monorepo, but your scope is strictly limited.

## Working Directory

Your task is to work ONLY inside:

```
/Users/vcsm/Desktop/VCSM/engines/chat/src
```

## Root Project Structure (for context only)

```
/engines/chat/src   ← your scope
/apps/vibez
/apps/wentrex
/shared
/contracts
/database
```

---

## Strict Scope Rules

1. **NEVER modify anything outside** `/Users/vcsm/Desktop/VCSM/engines/chat/src`
2. **DO NOT import code from** `/apps`, `/database migrations`, or any frontend code
3. **The engine must remain APP-AGNOSTIC** — it cannot know anything about:
   - Vibez
   - Wentrex
   - UI / frontend
   - App-specific policies

---

## Database Schema

The engine operates ONLY on the neutral chat schema:

```
chat.conversations
chat.conversation_members
chat.messages
chat.message_attachments
chat.message_receipts
chat.inbox_entries
chat.conversation_keys
chat.moderation_actions
chat.message_reactions
chat.typing_states
chat.participant_snapshots
chat.saved_messages
chat.conversation_pins
chat.outbox_events
chat.audit_log
chat.legacy_mappings
```

---

## Engine Responsibilities

**Conversation lifecycle**
- createConversation, archiveConversation, addMember, removeMember, updateConversation

**Message lifecycle**
- sendMessage, editMessage, deleteMessage, hideMessage, replyToMessage

**Receipts**
- markDelivered, markRead

**Inbox projection**
- updateInboxEntries, computeUnreadCounts

**Moderation**
- moderateMessage, removeMember, muteConversation

**Realtime events**
- emitOutboxEvent

**Typing state**
- startTyping, stopTyping

**Attachments**
- attachFileToMessage

**Reactions**
- addReaction, removeReaction

**Pins**
- pinMessage, unpinMessage

**Saved messages**
- saveMessage, unsaveMessage

---

## Internal Architecture

```
src/
  dal/
    conversationDal
    messageDal
    memberDal
    inboxDal
    receiptDal
    moderationDal
    outboxDal

  controllers/
    conversationController
    messageController
    membershipController
    inboxController
    moderationController

  services/
    messageService
    receiptService
    reactionService
    typingService
    attachmentService

  events/
    eventPublisher
    eventTypes

  types/
    domainTypes

  utils/
    transaction
    idempotency
    pagination
```

---

## Layer Contracts

**DAL** — database queries only. No business logic.

**Controllers** — orchestrate:
- permission checks
- transaction boundaries
- DAL calls
- outbox event publishing

**Services** — reusable domain logic:
- message ordering
- inbox updates
- unread counts
- receipt updates
- moderation side effects

---

## Outbox Events

Every important action must produce an outbox event. These are consumed by external workers.

```
message.sent
message.edited
message.deleted
conversation.created
conversation.archived
member.added
member.removed
receipt.read
```

---

## Guarantees the Engine Must Uphold

- Transactional message send
- Message ordering via `conversation_seq`
- Idempotent message send using `client_id`
- Safe membership validation
- Reliable outbox event creation

---

## Code Quality Requirements

- Type-safe domain models
- Clear layer separation
- Transaction-safe operations
- No circular dependencies

---

## DO NOT Implement

These belong outside the engine — never add them here:

- HTTP controllers
- WebSocket servers
- UI logic
- Push notifications
- Email notifications
