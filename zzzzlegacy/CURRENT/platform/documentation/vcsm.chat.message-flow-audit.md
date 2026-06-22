# VCSM Chat — Message Flow Audit

**Scope:** VCSM chat feature + chat engine
**Last updated:** 2026-04-19
**Type:** Forensic review — no code changes
**Related docs:**
- `vcsm/chat/vcsm.chat.runtime-pipeline.md`
- `vcsm/chat/vcsm.chat.badge-pipeline.md`

---

## 1. Executive Summary

The chat system is well-architected with clean DAL → Controller → Hook → Screen layering, idempotent sends via `client_id` deduplication, optimistic inserts, and atomic RPC for consistency. However, there are critical performance and UX weaknesses around rendering efficiency, scroll behavior, inbox refetch, and perceived latency that need addressing.

**Strengths:**
- Solid layer separation (engine-owned hooks, atomic RPC)
- Idempotent message send via `clientId`
- Optimistic insert + tombstone-safe merge
- Send deduplication prevents double-sends

**Critical weaknesses:**
- Full thread re-render on every message arrival (no memoization)
- Inbox does a full refetch on every single message across any conversation
- Auto-scroll interrupts user scrolling up to read history
- `__optimistic` flag generated but never used in render (no visual send feedback)

---

## 2. Architecture Overview

### Entry Points

| Screen | Route | File |
|--------|-------|------|
| Inbox | `/chat` | `apps/VCSM/src/features/chat/inbox/screens/InboxScreen.jsx` |
| Conversation | `/chat/:conversationId` | `apps/VCSM/src/features/chat/conversation/screen/ConversationScreen.jsx` |

### UI Component Tree
```
ConversationView
├── ChatHeader
├── MessageList
│   └── MessageGroup
│       └── MessageBubble   ← avatar slot gated on actor; no phantom gutter when actor is null
├── ChatInput (T circle → topbar composer + attachment)
└── MessageActionsMenu / ConversationActionsMenu
```

### Chat Input Layout (mobile)
The chat input has two states:
- **Collapsed:** `chat-bottom-t` — floating circle button (`52×52px`, `bottom: 10px + safe-area`)
- **Expanded:** `chat-topbar` — pill-shaped bar anchored `bottom: 10px + safe-area`, slides in from below

Message list `padding-bottom: 88px + safe-area` guarantees the last message always sits above the T circle with comfortable clearance.

### State Location
All message state is in local `useState` inside `useConversationMessages` (chat engine hook). No Zustand — per-conversation lifecycle only.

### Engine Wiring
Chat feature imports from `@chat` (configured in `apps/VCSM/src/features/chat/setup.js`). All hooks delegate to `engines/chat/src/`.

---

## 3. Send Flow

```
ChatInput
  → doPrimary()
  → (media: upload to R2 first)
  → addOptimistic(clientId) — message appears immediately in thread
  → sendMessageController({ conversationId, actorId, body, clientId })
      → validate membership + can_post
      → sendMessageAtomic RPC (chat.send_message_atomic)
          → INSERT chat.messages
          → INSERT chat.message_attachments
          → UPDATE conversation last_message pointers
          → fan-out inbox_entries for all members
          → INSERT outbox event (async processing)
  → replaceOptimistic(clientId, serverMessage)
  → scroll to bottom
```

**On error:** `markFailed(clientId)` — message stays in thread with `__failed: true`, rendered at reduced opacity with a "Failed · Retry" tap target. `retryMessage(clientId)` resets to `__optimistic: true` and re-runs `sendMessageController` with the same `clientId` for idempotency.

**Media upload path:** `prebuiltClientId` param pre-inserts an `__uploading` placeholder before the upload starts. If upload fails, `markFailed(prebuiltClientId)` is called. If upload succeeds, the same `clientId` is handed to `onSendMessage` — the placeholder transitions to the real message without a gap.

**Key files:**
- `apps/VCSM/src/features/chat/conversation/components/ChatInput.jsx`
- `apps/VCSM/src/features/chat/conversation/hooks/conversation/useSendMessageActions.js`
- `engines/chat/src/hooks/useConversationMessages.js`
- `engines/chat/src/controller/sendMessage.controller.js`
- `engines/chat/src/dal/sendMessageAtomic.rpc.dal.js`

---

## 4. Receive Flow

```
subscribeToConversation(conversationId)
  → Supabase realtime INSERT on chat.messages where conversation_id = {id}
  → onMessageInserted(raw)
      → MessageModel(raw) — normalize to domain shape
      → check deletedForMeIdsRef — skip if tombstoned locally
      → reconcile via clientId (optimistic → server replacement)
      → OR append new message
      → sort by createdAt
```

**Unread update:** Inbox subscription fires on `inbox_entries` INSERT/UPDATE/DELETE → calls full `load()` → refetches all inbox entries. No targeted update.

**Read state:** `markConversationRead()` on conversation open. Error is silently swallowed (no retry).

**Key files:**
- `engines/chat/src/dal/subscribeToConversation.js`
- `engines/chat/src/hooks/useConversationMessages.js` (line 334)
- `engines/chat/src/hooks/useInbox.js`

---

## 5. Rendering / Performance

### Message List Keys — FIXED (2026-04-19)
```js
// MessageList.jsx
<MessageGroup
  key={`group-${group.messages[0]?.id ?? group.messages[0]?.clientId ?? index}`}
  ...
/>
```
Stable keys — only groups with new messages trigger DOM updates.

### Memoization — FIXED (2026-04-19)
- `MessageGroup` — wrapped in `React.memo`
- `MessageBubble` — not yet wrapped (lower priority; group-level memo covers most cases)

### Grouping is Memoized (Good)
```js
const groups = useMemo(() => { ... }, [messages])
```
Groups are only recomputed when message array changes.

### Scroll Behavior — FIXED (2026-04-19)
```js
// Only fires when user is ≤100px from bottom
const dist = container.scrollHeight - container.scrollTop - container.clientHeight
if (dist < 100) { requestAnimationFrame(() => scrollToBottom('auto')) }
```
"Jump to latest ↓" floating button appears when user is >120px from bottom.

### Performance Estimate (post-fix)
For a thread with 100 messages and one new arrival:
1. State update
2. Full group recompute (useMemo — only when messages change)
3. Only the new/changed MessageGroup re-renders (stable keys + React.memo)
4. Auto-scroll skipped if user is reading history

Estimated render time: ~5–20ms on mid-range mobile.

---

## 6. Realtime / Sync

### Race Condition — Initial Load vs. Subscription
```js
useEffect(() => { loadInitial() }, [loadInitial])         // async
useEffect(() => { return subscribeToConversation(...) }, [...])  // sync
```
If a new message from another user arrives **during** the initial fetch, it enters state via the subscription handler. When the fetch completes, it appends that message again. The `mergeMessages` dedup guard handles same-sender optimistic reconciliation, but cross-user messages reconcile by ID only — if the fetch hasn't returned yet, the ID won't be in the index yet.

**Risk:** Low probability but non-zero potential duplicate render for incoming messages during load window.

### Subscription Channel Naming
```js
const channelName = `chat-conv-${conversationId}-${_subCounter}`
_subCounter++
```
Global monotonic counter. Each mount creates a new channel name. Old channels from fast unmount/remount may linger in Supabase until GC. Long sessions with frequent navigation could accumulate orphaned channels.

### Inbox Subscription — Coarse Granularity
```js
// useInbox.js
.on('postgres_changes', { event: 'INSERT', table: 'inbox_entries', filter: `actor_id=eq.${actorId}` }, handleChange)
.on('postgres_changes', { event: 'UPDATE', ... }, handleChange)
.on('postgres_changes', { event: 'DELETE', ... }, handleChange)
// handleChange = () => load()  ← full refetch
```
Every message in **any** conversation triggers a complete inbox reload. For a user with 50 conversations, this is very high DB churn.

---

## 7. State Model

### Message Shape
```js
{
  id: string,           // DB ID (real) or clientId (optimistic)
  clientId: string,     // For dedup + retry idempotency
  conversationId: string,
  senderActorId: string,
  kind: 'text' | 'image',
  body: string | null,
  mediaUrl: string | null,
  attachments: Array,
  createdAt: ISO string,
  editedAt: ISO string | null,
  deletedAt: ISO string | null,
  isEdited: boolean,
  isDeleted: boolean,
  isHidden: boolean,
  isSystem: boolean,
  __optimistic: boolean,   // pending send — renders at 65% opacity
  __failed: boolean,       // failed send — renders at 80% opacity with retry button
  __uploading: boolean,    // media upload in progress — renders placeholder
}
```

### Storage
Local `useState([])` — array sorted by `createdAt`. Full rebuild on every merge (no indexed lookup). O(n) operations throughout.

### Pending / Sent / Failed States
| State | Flag | Visual feedback |
|-------|------|----------------|
| Uploading media | `__uploading: true` | Gray 144×144 placeholder, "Uploading…" label |
| Pending send | `__optimistic: true` | Row at 65% opacity, "Sending…" status label |
| Sent | `__optimistic: false` + real ID | Full opacity, no label |
| Failed | `__failed: true` | Row at 80% opacity, "Failed · Retry" tap target |

---

## 8. UX / Perceived Speed

| Concern | Current state | Assessment |
|---------|--------------|------------|
| Send latency (text) | Optimistic insert is instant | Good |
| Send latency (media) | `__uploading` placeholder appears instantly; real message follows upload | Good |
| Receive latency | Realtime, ~50–200ms | Good |
| Empty state | Generic text | Acceptable |
| Conversation open latency | Optimistic shell from inbox seed — renders header+input immediately, skeleton in message area | **RESOLVED 2026-05-03** |
| Error state | "Couldn't load Vox" + retry button | Good |
| Scroll-to-bottom | Smart scroll — only fires when ≤100px from bottom | Good |
| Jump to latest | "Jump to latest ↓" floating button when scrolled up >120px | Good |
| Optimistic send feedback | 65% opacity + "Sending…" label | Good |
| Failed send recovery | Message persists at 80% opacity with "Failed · Retry" button | Good |
| Load older messages | Not implemented | Missing feature |

---

## 9. Weaknesses Summary

### Critical
| # | Issue | File | Status |
|---|-------|------|--------|
| C1 | Full thread re-render on every message | `MessageList.jsx`, `MessageGroup.jsx` | **RESOLVED 2026-04-19** — stable group keys + `React.memo` on `MessageGroup` |
| C2 | `__optimistic` flag unused in render | `MessageBubble.jsx` | **RESOLVED 2026-04-19** — pending/uploading/failed states rendered visually |
| C3 | Inbox full refetch on every message | `engines/chat/src/hooks/useInbox.js` | Open — targeted single-entry update needed |
| C4 | Scroll-to-bottom interrupts user reading | `ConversationView.jsx` | **RESOLVED 2026-04-19** — smart scroll (≤100px threshold) + "Jump to latest" button |

### High
| # | Issue | File | Status |
|---|-------|------|--------|
| H1 | Failed message vanishes — no recovery | `useConversationMessages.js` | **RESOLVED 2026-04-19** — `markFailed` + `retryMessage` + retry UI |
| H2 | Race on initial load + realtime | `useConversationMessages.js` | Open |
| H3 | Silent `markConversationRead` failure | `useConversation.js` | Open |
| H4 | Orphaned subscription channels | `subscribeToConversation.js` | Open |
| H5 | Conversation open blocked ~4s on serial DB queries | `InboxScreen.jsx`, `ConversationView.jsx` | **RESOLVED 2026-05-03** — optimistic shell (nav state seed) + warm message cache (RQ prefetch) |

### Medium
| # | Issue | Status |
|---|-------|--------|
| M1 | Index-based group keys | **RESOLVED 2026-04-19** — key uses `group.messages[0]?.id ?? clientId ?? index` |
| M2 | No load-older-messages | Open |
| M3 | No media-send optimistic insert | **RESOLVED 2026-04-19** — `__uploading` placeholder via `prebuiltClientId` |

---

## 10. Optimization Plan (Ranked)

### Tier 1 — Quick wins (< 1 hour total)
1. Fix `MessageGroup` key: `key={`group-${group.messages[0]?.id}`}`
2. Wrap `MessageGroup` and `MessageBubble` in `React.memo`
3. Render `__optimistic: true` messages with opacity/spinner dot
4. Add retry buttons to error states (conversation + inbox)

### Tier 2 — Next sprint (3–6 hours each)
5. Smart scroll: only auto-scroll if user is at bottom; add "jump to new" button
6. Fix race condition: record subscription start timestamp, skip messages from fetch that arrived after
7. Fix `markConversationRead` silent failure

### Tier 3 — Architectural (8–12 hours each)
8. Replace inbox `load()` on any event with targeted single-entry update
9. Add load-older-messages with cursor pagination
10. Normalize message state: `{ byId: Map }` instead of flat array

---

## 11. Key Files

| File | Layer | Role |
|------|-------|------|
| `apps/VCSM/src/features/chat/conversation/components/MessageList.jsx` | UI | Renders groups; index key bug here |
| `apps/VCSM/src/features/chat/conversation/components/MessageGroup.jsx` | UI | Groups messages; no memo |
| `apps/VCSM/src/features/chat/conversation/components/MessageBubble.jsx` | UI | Single message; avatar slot gated on actor presence |
| `apps/VCSM/src/features/chat/conversation/components/ChatInput.jsx` | UI | Composer; upload + send |
| `apps/VCSM/src/features/chat/conversation/screen/ConversationView.jsx` | UI | Scroll logic; error state |
| `apps/VCSM/src/features/chat/inbox/screens/InboxScreen.jsx` | UI | Inbox; error state |
| `engines/chat/src/hooks/useConversationMessages.js` | Hook | All message state, optimistic, merge |
| `engines/chat/src/hooks/useInbox.js` | Hook | Inbox state; full refetch on subscription |
| `engines/chat/src/hooks/useConversation.js` | Hook | `markConversationRead`; silent failure |
| `engines/chat/src/dal/subscribeToConversation.js` | DAL | Realtime subscription; channel naming |
| `engines/chat/src/dal/sendMessageAtomic.rpc.dal.js` | DAL | Atomic RPC for send |
| `engines/chat/src/controller/sendMessage.controller.js` | Controller | Validation + idempotent send |

---

## 12. Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-04-19 | Initial audit — full message flow, send/receive, rendering, realtime, state model, UX weaknesses, optimization plan | WOLVERINE |
| 2026-04-19 | Chat UX Upgrade Pack applied — resolved C1 (stable keys + React.memo), C2 (visual pending/uploading/failed states), C4 (smart scroll + jump button), H1 (markFailed + retryMessage), M1 (stable keys), M3 (prebuiltClientId upload placeholder). Updated state model, send flow, UX table, weakness status. | WOLVERINE |
| 2026-04-20 | Avatar slot phantom gap fixed — `MessageBubble.jsx` avatar slot (both the avatar div and the non-last spacer) now gated entirely on `actor` being non-null. When actor is null, all incoming messages are flush left with no phantom 28px gutter. When actor is present, last message shows avatar, others show spacer for group alignment. | WOLVERINE |
| 2026-04-20 | Chat input T circle layout — `chat-modern.css`: T circle `bottom` lowered from `calc(20px + safe-area)` to `calc(10px + safe-area)`; message list `padding-bottom` raised from `60px` to `88px` + safe-area to guarantee last message always clears the T circle. | WOLVERINE |

---

## Audit References

Latest Engine Audit:
`zNOTFORPRODUCTION/_CANONICAL/logan/engines/CHAT_ENGINE_AUDIT_V3.md`

Previous Engine Audit:
`zNOTFORPRODUCTION/_CANONICAL/logan/engines/CHAT_ENGINE_AUDIT_V2.md`
