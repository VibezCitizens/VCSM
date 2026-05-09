# Chat Domain Contract

## Inbox & Messages (Actor‑Based, End‑to‑End)

This document defines **non‑negotiable rules** for how **messages** and **inbox entries** behave in the chat domain.

These rules exist to prevent:

* `actor_id = undefined` bugs
* message alignment errors
* inbox corruption during identity hydration
* controller / DAL responsibility leaks
* legacy identity contamination (user/profile/vport bleed)

---

## Core Principle (GLOBAL — LOCKED)

> **Chat is ACTOR‑BASED end‑to‑end.**

Chat **never** operates on users, profiles, or vports directly.

Everything resolves into **actor** before chat is touched.

```
actorId   → runtime identity (UI / hooks / controllers)
actor_id  → database column (vc.* tables)
```

This rule is **absolute** and **permanent**.

---

## Actor Purity Rule (NEW — CRITICAL)

Chat is a **pure actor domain**.

* Chat **does not accept bridges**
* Chat **does not infer identity**
* Chat **does not tolerate partial hydration**

If identity is not resolved into an `actorId`, **chat must not be entered**.

Other features may bridge.
**Chat never does.**

---

## Naming Contract (MANDATORY)

| Layer                    | Name              | Meaning                      |
| ------------------------ | ----------------- | ---------------------------- |
| UI / Hooks / Controllers | `actorId`         | Active actor (string | null) |
| Database                 | `actor_id`        | Actor UUID column            |
| Messages                 | `sender_actor_id` | Actor who sent the message   |
| Inbox                    | `actor_id`        | Owner of inbox entry         |

❌ Never use `userId`, `profileId`, `vportId` in chat
✅ Those resolve **before chat boundaries**

---

## MESSAGE CONTRACT

### Ownership (LOCKED)

Every message **must** have:

```
sender_actor_id = actorId
```

Sender actor is the **sole authority** for:

* edit
* unsend
* ownership‑based UI actions

No exceptions.

---

### Message Creation Rules

* Messages **must send even if inbox fails**
* Messages are **source of truth**
* Inbox is **derived metadata**

A message that exists without an inbox entry is **valid**.

---

### Authoritative Message Flow

```
UI
 → useConversationMessages
   → sendMessageController
     → insertMessage (DAL)
       → vc.messages.sender_actor_id
```

No inbox logic is allowed to block this flow.

---

### Message Model Contract

```ts
Message {
  id: string
  conversationId: string
  senderActorId: string        // REQUIRED
  body: string | null
  mediaUrl: string | null
  createdAt: string
  isEdited: boolean
  isDeleted: boolean
}
```

If `senderActorId` is missing → **BUG (hard failure)**

---

## MESSAGE ALIGNMENT RULE (UI — LOCKED)

Alignment is **pure UI logic**.

```js
isMine = message.senderActorId === currentActorId
```

❌ Never infer from:

* user_id
* profile_id
* vport_id
* conversation members
* message index

---

## INBOX CONTRACT

### Inbox Is Metadata Only

Inbox exists to support:

* unread counts
* ordering
* pin / mute / archive
* per‑actor conversation state

Inbox **does not own messages**.

---

### Inbox Write Rule (CRITICAL)

> **Inbox writes must NEVER throw due to identity issues.**

Inbox is **best‑effort**.

#### REQUIRED Guard Pattern

```js
if (!actorId || !conversationId) {
  console.warn('[inbox] skipped — missing params')
  return
}
```

❌ Inbox failures must not block messages
❌ Inbox failures must not crash UI
✅ Inbox eventually becomes consistent

---

### Inbox Ownership

Each inbox row is owned by:

```
vc.inbox_entries.actor_id
```

That actor alone controls:

* unread count
* archive / mute / pin
* leave / rejoin semantics

Leaving does **not** affect other actors.

---

### Inbox Fan‑Out Rule

When a message is sent:

* Sender inbox → unread remains `0`
* Other actors → unread increments

Fan‑out **must never break message send**.

---

## CONTROLLER RESPONSIBILITY

Controllers:

* enforce actor ownership
* validate conversation membership
* decide business meaning
* may skip inbox updates if unsafe

Controllers **must never skip message writes**.

---

## DAL RESPONSIBILITY

DAL:

* performs raw reads/writes
* does not infer actor meaning
* does not apply business rules
* does not throw on inbox identity gaps

DAL answers only:

> “What does the database say?”

---

## REALTIME RULES

Realtime may fire:

* before identity hydration
* during actor switching
* while inbox is stale

Therefore:

* realtime inbox updates must be guarded
* realtime messages must always render

---

## LEGACY / NON‑ACTOR BRIDGE RULE (NEW)

Other features **may temporarily bridge** legacy identities:

* user → actor
* profile → actor
* vport → actor

**Chat does not participate in bridging.**

Rules:

* Bridging happens **outside chat**
* Chat receives **actorId only**
* No fallback logic allowed inside chat

❌ No chat‑side resolution
❌ No silent inference
❌ No partial hydration tolerance

---

## ABSOLUTE BANS (ENFORCED)

❌ `user_id` anywhere in chat
❌ inbox logic in UI
❌ throwing from inbox DAL on missing actorId
❌ alignment logic outside `senderActorId === actorId`
❌ bridging inside chat

---

## PHASE 1 STABILITY GOAL (LOCKED)

Messages must always:

* send
* render
* align correctly

Inbox may lag.
Inbox may skip.
Inbox may heal later.

**That is acceptable.**

---

# 🔐 CHAT ENCRYPTION CONTRACT (FUTURE‑SAFE)

Encryption is **infrastructure**, not a chat feature.

Chat **uses** encryption.
Chat **does not own** encryption.

---

## Encryption Scope (Phase‑Aware)

### Phase 1 — Server‑Side Encryption

* Messages encrypted **before DB insert**
* Decryption only in controllers / edge
* Database never stores plaintext

### Phase 2+ — Selective / Full E2EE

* Server may not possess keys
* Encryption format must remain compatible
* No schema rewrites allowed

---

## Canonical Encryption Primitive (LOCKED)

| Item        | Value              |
| ----------- | ------------------ |
| Algorithm   | XChaCha20‑Poly1305 |
| Library     | libsodium          |
| Mode        | AEAD               |
| Encoding    | base64             |
| Key length  | 256‑bit            |
| Nonce       | random per message |
| Nonce reuse | **FORBIDDEN**      |

❌ No custom crypto
❌ No symbol maps
❌ No AES without AEAD

---

## END CONTRACT
