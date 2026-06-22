# BOTTOM NAV — VOX (CHAT) BUTTON ARCHITECTURE MAP

**Generated:** 2026-05-11
**Button:** Vox / Chat (MessageCircle icon)
**Route:** `/chat` → `InboxScreen`
**Feature:** chat

---

## Button Definition

```jsx
<Tab
  to="/chat"
  label={chatUnread > 0 ? t('nav.voxWithCount', { count: chatUnread }) : t('nav.vox')}
  icon={<MessageCircle size={18} />}
  badgeCount={chatUnread}
/>
```
- NavLink — React Router push
- Dynamic label and badge from `useChatUnread()` via bootstrap.selectors
- Badge count capped at 99+ display

---

## Badge Data Flow (always-running, not route-specific)

```
BottomNavBar mounts (always)
  → useBootstrapHydration(actorId) → bootstrap.store.setHydrated(actorId)
  → useChatUnread() → bootstrap.selectors.js
    → React Query useQuery({ queryKey: ['chatUnread', actorId] })
    → queryFn: getUnreadBadgeCount(actorId) → @chat engine
    → refetchInterval: 30_000 (every 30s)
    → chatUnread count drives badge
```

---

## Screen Chain

```
/chat → InboxScreen → useChatInbox(actorId) → @chat engine → getInboxEntries
```

**Screen:** `features/chat/inbox/screen/InboxScreen.jsx` (STATICALLY INFERRED from route-tree.md)
**View Hook:** `useChatInbox(actorId)`

---

## Primary Hooks

| Hook | File | Purpose | Calls |
|---|---|---|---|
| `useChatInbox(actorId)` | `chat/inbox/hooks/useChatInbox.js` | React Query owner of chat.inbox_entries | `getInboxEntries` from `@chat` engine |
| `useInbox` | `chat/inbox/hooks/useInbox.js` | INFERRED: wraps useChatInbox | — |
| `useChatUnread` | `bootstrap/bootstrap.selectors.js` | Badge poll (30s) | `getUnreadBadgeCount` via chat.adapter |
| `useChatUnreadOps` | `chat/adapters/chat.adapter` | Chat adapter unread ops | `@chat` engine |

---

## Primary Controllers (STATICALLY TRACED via engine)

| Controller | File | Purpose |
|---|---|---|
| `getInboxEntries` | `@chat engine` | Loads inbox entries with hydrated conversation data |
| `chatUnread.controller.js` | `chat/inbox/controller/chatUnread.controller.js` | Unread count logic |

---

## Primary DAL Reads

| DAL Method | File | Tables / Views / RPCs | Notes |
|---|---|---|---|
| `inboxUnread.read.dal.js` | `chat/inbox/dal/inboxUnread.read.dal.js` | `chat` schema — inbox unread count | Used by badge via chatUnread controller |
| `getInboxEntries` (engine) | `@chat engine` | `chat.inbox_entries` + `chat.conversations` + `chat.participants` | INFERRED — engine-owned DAL |
| Block rows | `chat/inbox/dal/blocks.read.dal.js` (INFERRED from prior audit) | `moderation.blocks` | Blocks filter in inbox — DUPLICATE of block feature |

---

## State Stores

| Store | File | Data Held |
|---|---|---|
| React Query cache | `queryClient` | Inbox entries keyed by `['chatInbox', actorId]` (+ folder) |
| chatUiStore (Zustand) | `chat/store/chatUiStore.js` | selectedConversationId, isNewChatModalOpen, scroll position |
| bootstrap.store (Zustand) | `bootstrap/bootstrap.store.js` | hydratedForActorId — gates badge query |

---

## Polling Behavior

- Inbox list: polls every **30s** (`CHAT_INBOX_REFETCH_MS`)
- Unread badge: polls every **30s** (`CHAT_POLL_MS`)
- No Supabase Realtime subscription in inbox (disabled by design — comment in useChatInbox.js: "Realtime is intentionally disabled")
- `hiddenRef` pattern: optimistic hide of deleted/archived conversations without refetch

---

## Data Flow

```
User taps Vox tab → navigate('/chat')
  → InboxScreen mounts
  → useChatInbox(actorId, { folder: 'inbox' })
    → React Query useQuery(queryKeys.chatInbox(actorId))
    → queryFn: getInboxEntries({ actorId, folder, includeArchived: false })
    → @chat engine: fetches chat.inbox_entries → conversation members → preview
    → InboxEntryModel shapes raw rows into { conversationId, preview, unreadCount, ... }
    → returns entries array

UI renders InboxList
  → CardInbox per entry (preview, avatar, timestamp, unread badge)
  → InboxEmptyState if no entries

User taps a conversation card
  → navigate('/chat/:conversationId')
  → ConversationScreen (chat sub-screen)
  → BottomNavBar and TopNav HIDDEN (isChatSubScreen = true)
  → ConversationScreen owns: useConversationMessages, useConversation, useTypingChannel
```

---

## Security / Ownership Gates

- INFERRED: `actorId` gates query (`enabled: !!actorId`)
- INFERRED: chat engine enforces participant ownership — only conversations actor belongs to
- Block filtering: `chat/inbox/dal/blocks.read.dal.js` — DUPLICATE of block feature (spaghetti flag from prior audit)
- RLS: INFERRED — `chat.inbox_entries` filtered by actor via RLS policy

---

## Loading / Error States

| State | Behavior |
|---|---|
| Loading (cold open) | `query.isLoading` → InboxListSkeleton |
| Loading (warm open) | Previous data shown immediately, background refetch silent |
| Empty inbox | InboxEmptyState component |
| Error | INFERRED: error prop surfaced — exact UI not traced |

---

## Spaghetti / Risk Flags

| Signal | Evidence | Risk | Handoff |
|---|---|---|---|
| Block DAL duplicated in inbox | `chat/inbox/dal/` has blocks.read.dal.js | HIGH — should use block.adapter | SENTRY |
| Realtime disabled (polling only) | Comment in useChatInbox.js — polling at 30s | MEDIUM — message delay up to 30s in inbox | IRONMAN |
| InboxScreen file not read | `screen/InboxScreen.jsx` structure inferred | INFERRED | NEEDS LOKI |

---

## Missing Pieces

- Realtime for inbox is disabled — 30s polling gap
- Block DAL owned locally in chat inbox — should delegate to block.adapter
