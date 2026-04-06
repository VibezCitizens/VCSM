# Message Action Controllers

This folder contains **message action use-cases**.
Each controller owns a single, explicit domain meaning and must not overlap responsibilities.

Controllers in this folder enforce **actor intent**, **permissions**, and **idempotency**.
They delegate all database access to DAL functions and return domain-level results only.

---

## Controllers

### `unsendMessage.controller.js`

**Purpose**
- Allows the *sender* of a message to unsend it for *all participants*
- Implements WhatsApp-style "Unsend"

**Rules**
- Only `sender_actor_id` may unsend
- Soft-deletes the message (sets `deleted_at`)
- Idempotent: already-unsent messages succeed silently
- Triggers downstream DB logic (last_message pointers, receipts, etc.)

**Used by**
- Conversation message actions menu
- User-initiated unsend only

---

### `deleteMessageForMe.controller.js`

**Purpose**
- Hides a message *only for the current actor*
- Does not affect other participants

**Rules**
- Actor-based only
- Writes to per-actor visibility / receipts table
- No ownership enforcement (actor may hide any visible message)

**Used by**
- “Delete for me” UI action
- Local-only message cleanup

---

### `deleteMessage.controller.js`

**Purpose**
- Permanently deletes a message from the system

**Rules**
- Restricted to admin / moderator / system use
- Hard delete (irreversible)
- Sender-only rules do NOT apply
- Idempotent-safe

**Used by**
- Moderation tools
- Abuse handling
- System cleanup

---

## Design Notes

- Controllers in this folder **must never be merged**
- Each controller answers a different domain question
- Hooks select the appropriate controller based on user intent
- UI must never infer behavior from message state






