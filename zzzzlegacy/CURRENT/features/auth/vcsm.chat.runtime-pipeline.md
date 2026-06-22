# VCSM Chat Runtime Pipeline

## 1. Architecture Overview

CURRENT RUNTIME

The main VCSM chat runtime is now **engine-backed**, but the overall codebase is still **hybrid**.

What is engine-backed in current runtime:

- inbox list loading
- inbox actions
- single-entry inbox lookup
- conversation metadata
- conversation members
- message timeline
- send/edit/unsend/delete-for-me message actions
- typing presence
- start conversation

What remains app-owned:

- engine setup and dependency injection
- actor identity and hydration
- actor search / actor summary enrichment / realm resolution
- block checks injected into the engine
- badge UI in `BottomNavBar.jsx`
- moderation/report side effects that still write `vc.*`

What still exists on disk but is no longer the main runtime:

- local `vc.*` chat DALs/controllers
- local realtime helpers under `features/chat/**/realtime`


## 2. Entry Screens and Runtime Hooks

Main runtime screens:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/chat/inbox/screens/InboxScreen.jsx`
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/chat/conversation/screen/ConversationScreen.jsx`
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/chat/conversation/screen/ConversationView.jsx`
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/chat/start/screens/StartConversationModal.jsx`

Current wrapper hooks that delegate to `@chat`:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/chat/inbox/hooks/useInbox.js`
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/chat/inbox/hooks/useInboxActions.js`
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/chat/inbox/hooks/useInboxEntryForConversation.js`
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/chat/conversation/hooks/conversation/useConversation.js`
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/chat/conversation/hooks/conversation/useConversationMembers.js`
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/chat/conversation/hooks/conversation/useConversationMessages.js`
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/chat/conversation/hooks/realtime/useTypingChannel.js`
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/chat/start/hooks/useStartConversation.js`


## 3. Current Runtime Authority

| Runtime slice | Current authority | Current schema / source |
| --- | --- | --- |
| Inbox list | `@chat` | `chat.inbox_entries` |
| Inbox actions | `@chat` | `chat.inbox_entries` |
| Start conversation | `@chat` | `chat.*` |
| Open conversation | `@chat` | `chat.conversations` |
| Members | `@chat` | `chat.conversation_members` |
| Messages | `@chat` | `chat.messages` |
| Send message (text+media) | `@chat` | `chat.send_message_atomic` RPC (with `p_attachments`) |
| Typing | `@chat` | presence + engine config |
| Actor enrichment | app DI via `@hydration` engine | `vc.get_actor_summaries` RPC → global Zustand store |
| Block checks | app DI | `moderation.blocks` WHERE status='active' |
| Realm resolution | app DI | VCSM realm helpers |
| Chat unread badge | app-local hook | `chat.inbox_entries` |
| Bell notifications | app-local notifications feature | `vc.notifications` |
| Spam/report side effects | app-local moderation/reporting | `moderation.reports`, `moderation.report_events`, `moderation.actions` |


## 4. Boot and Dependency Injection

Engine setup is performed in:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/chat/setup.js`
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/main.jsx`

Injected VCSM dependencies include:

- actor summaries
- actor search
- realm resolution
- actor realm context
- block relation checks
- `defaultActorSource: 'vc'`

That means VCSM runtime is engine-backed without being app-agnostic at the top layer.


## 5. Pipeline Summary

### Inbox

```text
InboxScreen
  -> useIdentity() for actorId
  -> useInbox({ actorId })
  -> @chat inbox hook
  -> chat.inbox_entries
  -> render InboxList

After entries load (background, non-blocking):
  -> useChatMessagePrefetch({ actorId, conversationIds: top-10 })
  -> queryClient.prefetchQuery(queryKeys.chatMessages(cid)) × up to 10
  -> getConversationMessages({ conversationId, actorId, limit: 20 })
  -> queryClient cache populated — warm for next open
```

### Conversation

```text
InboxScreen (tap row)
  -> find preview in local previews array
  -> navigate(`/chat/${id}`, { state: { inboxPreview: preview } })

ConversationView (mount)
  -> location.state?.inboxPreview  →  seedConversation + seedPartnerActor
  -> renders shell immediately (header + input bar) — no server wait
  -> useConversationMessages() reads RQ cache synchronously:
       cached = queryClient.getQueryData(queryKeys.chatMessages(id))
       if cached → messages rendered immediately, no skeleton
       if no cache → skeleton while engine loads

Background (concurrent):
  -> useConversation()        -> @chat -> chat.conversations (3-5 serial queries via openConversation.rpc)
  -> useConversationMembers() -> @chat -> chat.conversation_members
  -> useConversationMessages() engine -> @chat -> chat.messages
      + realtime subscription for new message inserts
      + when engine resolves: setQueryData(queryKeys.chatMessages) keeps cache fresh
  -> useInboxEntryForConversation() -> @chat -> chat.inbox_entries

Reconciliation:
  effectiveConversation = conversation ?? seedConversation  (server truth wins when available)
  effectivePartnerActor = resolvedPartnerActor ?? seedPartnerActor
  messages = engine.loading && engine.messages.length===0 ? cached : engine.messages
```

### Start conversation

```text
StartConversationModal
  -> useStartConversation()
  -> @chat.startDirectConversation(...)
  -> engine uses VCSM DI for search/block/realm support
```

### Send message

```text
ConversationView
  -> useConversationMessages()
  -> @chat sendMessageController()
  -> chat.send_message_atomic RPC
```


## 6. Historical / Legacy Code — Removed

HISTORICAL NOTE

The repo previously contained a broad legacy local chat stack, including:

- `features/chat/inbox/controllers/getInboxEntries.controller.js`
- `features/chat/inbox/dal/inbox.read.dal.js`
- `features/chat/conversation/controllers/sendMessage.controller.js`
- `features/chat/conversation/dal/write/messages.write.dal.js`
- `features/chat/start/controllers/startDirectConversation.controller.js`
- local realtime helpers under `features/chat/**/realtime`

Current status (as of 2026-04-05):

- all 46 legacy `vc.*` chat DAL/controller files have been deleted
- the main wrapper hooks used by runtime screens delegate to `@chat`
- no legacy local chat code remains on disk


## 7. Important Corrections

OUTDATED CLAIM CORRECTED

- chat unread badge is **not** backed by `vc.inbox_entries` anymore
- current unread badge query and realtime subscription both use `chat.inbox_entries`

OUTDATED CLAIM CORRECTED

- VCSM chat is no longer accurately described as “all legacy vc.* runtime”
- the main user-facing chat runtime is engine-backed now

OUTDATED CLAIM CORRECTED

- the presence of legacy `vc.*` chat code in the repo does not mean it is the main runtime path


## 8. ChatInput Component — Conversation Input Bar

Updated: 2026-04-18

File: `apps/VCSM/src/features/chat/conversation/components/ChatInput.jsx`

### Overview

The conversation composer renders at the bottom of the conversation screen as a floating
input bar (`chat-topbar`). It is hidden when the user has not yet tapped to open the
keyboard, and opened via a visible trigger button (`chat-bottom-t`).

### UI States

| State | Trigger |
|-------|---------|
| Bar hidden | `topBarOpen = false` (default) |
| Bar open, input empty | User tapped keyboard button |
| Bar open, input has text | User typed content |
| Edit mode | `editing=true` prop from parent |
| Sending | `submitBusy=true` during async send |

### Send Button Design System

The send button uses a CSS class-based state system defined in `chat-modern.css`.
Two classes, one transition — no inline style logic.

| CSS class | State | Visual |
|-----------|-------|--------|
| `.chat-send-btn` | Inactive (empty input) | `var(--vc-surface-input)` background, muted icon, 55% opacity, `cursor: not-allowed` |
| `.chat-send-btn.chat-send-btn--active` | Active (has text or media) | Purple gradient, white icon, glow shadow, full opacity |

Transition: `0.2s ease` on `background`, `border-color`, `box-shadow`, `color`, `opacity`.

The button remains `disabled` (HTML attribute) when input is empty — so no send is
triggered. But the visual never shows a broken white block; the inactive state is a
clearly muted dark surface.

**Previous bug:** The inactive button used `bg-white/6/40` (invalid UnoCSS class with
double slash). The browser applied no background, falling through to the default white
button style. Fixed 2026-04-18 by replacing the entire inline conditional class-string
approach with the `.chat-send-btn` / `.chat-send-btn--active` CSS class system.

### Input Composition Handling

- `composingRef` guards against Enter key submission during CJK/IME composition
- `onCompositionStart` / `onCompositionEnd` track composition state
- Char limit: 4000 (clamped in `handleChange`)

### Send Flow

```
User types → value state updates → chat-send-btn--active class applied
User presses Enter or taps send button
  → doPrimary()
    → if mediaPreview: onAttach([file])
    → if text: inEdit ? onSaveEdit(text) : onSend(text)
    → on success: setValue('') + setTopBarOpen(false) + dismissKeyboard()
    → on failure: onAttachError(message)
```

### Props Contract

| Prop | Type | Purpose |
|------|------|---------|
| `onSend` | `async (text) => bool\|{ok, error}` | Send plain text message |
| `onAttach` | `async (files[]) => bool\|{ok, error}` | Send media attachment |
| `onSaveEdit` | `async (text) => bool\|{ok, error}` | Save edited message |
| `onCancelEdit` | `() => void` | Cancel edit mode |
| `onTyping` | `() => void` | Typing presence signal |
| `onAttachError` | `(msg) => void` | Show attach/send error to user |
| `disabled` | `bool` | Disables all input (e.g. blocked conversation) |
| `isSending` | `bool` | External sending state lock |
| `editing` | `bool` | Activates edit mode |
| `initialValue` | `string` | Pre-fills input in edit mode |
| `maxLength` | `number` | Char limit (default 4000) |

---

## 9. Inbox → Conversation Open Performance (Optimistic Shell)

Updated: 2026-05-03

### Problem

`openConversation.rpc.js` (engine DAL) performs 3–5 serial Supabase round trips on every
conversation open: membership check → conditional reactivate → `inbox_entries` check →
conditional insert → SELECT `chat.conversations`. Combined with `useConversationMembers`
resolving after `useConversation`, the prior gate pattern blocked on both:

```js
// OLD — blocked ~4 seconds until both resolved
if (loading || !conversation || !members?.length) return <Spinner />
```

### Solution (VCSM-only, no engine changes)

**InboxScreen.jsx** — on row tap, find the matching preview and pass it via React Router
navigation state:

```js
navigate(`/chat/${id}`, { state: { inboxPreview: preview } })
```

**ConversationView.jsx** — read seed from location state, build effective values:

```js
const inboxSeed = location.state?.inboxPreview ?? null

const seedConversation = useMemo(() => { /* builds partial conversation from seed */ }, [inboxSeed])
const seedPartnerActor = useMemo(() => { /* builds partner actor from seed */ }, [inboxSeed])

const effectiveConversation = conversation ?? seedConversation
const effectivePartnerActor = resolvedPartnerActor ?? seedPartnerActor
```

Gate changed to fire only when truly no data:
```js
if (!effectiveConversation) return <Spinner label="Loading conversation..." />
```

`canReadConversation` check deferred until `members?.length > 0` (safe — inbox navigation
always implies membership; direct-link access still enforced once members arrive).

### Skeleton

While `messagesLoading && messages.length === 0` the message area shows 5 placeholder
rows (`animate-pulse`, `bg-white/8`) instead of a spinner. After messages resolve, the
real `<MessageList>` replaces the skeleton.

### DEV Timing Marks

In development builds (`import.meta.env?.DEV`), `chatNavDbg` records timing across the
full open sequence:

| Mark | Fires when |
|------|-----------|
| `chat:shell:rendered` | ConversationView mounts (records `hasSeed`) |
| `chat:openConversation:end` | `conversation` from `useConversation` arrives |
| `chat:participants:end` | `members.length > 0` |
| `chat:messages:end` | `messages.length > 0` |
| `chat:usable` | All three server values present (endRun) |

### Fallback

Direct-link navigation (no seed) falls back to full-page spinner until server data
arrives — unchanged from previous behavior.

---

## 10. Warm Message Cache (Prefetch + Seed)

Updated: 2026-05-03

### Architecture

Two-layer separation:

| Layer | Role | Technology |
|-------|------|-----------|
| React Query cache | Shared cache: prefetch, seed, GC | `queryClient.prefetchQuery` / `getQueryData` / `setQueryData` |
| Engine hook | Live state: realtime, optimistic, tombstones | `useState` in engine's `useConversationMessages` |

Cache key: `queryKeys.chatMessages(conversationId)` = `['chat', 'messages', conversationId]`

### Prefetch (InboxScreen)

File: `apps/VCSM/src/features/chat/inbox/hooks/useChatMessagePrefetch.js`

After inbox entries load, fires background fetches for the top 10 visible conversations:

```text
previews[0..9].conversationId
  → if cache hit: log prefetch:hit, skip
  → if cache miss: prefetchQuery(queryKeys.chatMessages(cid), staleTime=90s)
      → getConversationMessages({ conversationId, actorId, limit: 20 })
          → membership check (chat.conversation_members)
          → messages fetch (chat.messages, limit 20)
          → hidden message IDs (chat.message_receipts)
          → history cutoff (chat.inbox_entries)
      → queryClient cache populated
```

Concurrency: 3 parallel fetches (waterfall pool). `staleTime: 90_000` — won't refetch data
that is already fresh in cache. Does not block inbox rendering.

### Seed (ConversationView open)

File: `apps/VCSM/src/features/chat/conversation/hooks/conversation/useConversationMessages.js`

On mount, reads synchronously from React Query cache before the engine hook fires its
first useEffect:

```js
const cached = queryClient.getQueryData(queryKeys.chatMessages(conversationId)) ?? []
// ...
const messages = engine.loading && engine.messages.length === 0 ? cached : engine.messages
const loading  = engine.loading && cached.length === 0 && engine.messages.length === 0
```

Warm open: `cached.length > 0` → messages render immediately, no skeleton.
Cold open: `cached.length === 0` → skeleton shows until engine resolves (unchanged).

### Write-Back

When engine finishes loading, the wrapper writes messages back to the React Query cache:

```js
useEffect(() => {
  if (!engine.loading && engine.messages.length > 0) {
    queryClient.setQueryData(queryKeys.chatMessages(conversationId), engine.messages)
  }
}, [engine.loading, engine.messages, conversationId, queryClient])
```

This keeps the cache current after realtime updates — the next open of the same conversation
is always warm as long as the user visited it within the last 5 minutes (React Query gcTime).

### Cache Lifecycle

| Event | What happens |
|-------|-------------|
| Inbox loads | `useChatMessagePrefetch` fires prefetch for top 10 conversations |
| Already cached | `prefetchQuery` skips (staleTime check) |
| User opens conversation | `getQueryData` reads synchronously → messages visible immediately |
| Engine resolves | `setQueryData` updates cache with full message set |
| 90s since prefetch | Cache data is stale but still shown; engine will refetch on next open |
| 5 min since last subscriber unmount | React Query GC evicts the cache entry |
| Actor switch / logout | Caller must `queryClient.invalidateQueries({ queryKey: ['chat', 'messages'] })` |

### DEV Timing Marks

| Mark | Source | Fires when |
|------|--------|-----------|
| `chat:messages:prefetch:hit` | `useChatMessagePrefetch` | Conversation already in RQ cache |
| `chat:messages:prefetch:start` | `useChatMessagePrefetch` | Prefetch query started |
| `chat:messages:prefetch:miss` | `useChatMessagePrefetch` | Prefetch completed with new data |
| `chat:messages:cache:rendered` | `useConversationMessages` | Mount served from cache (warm open) |
| `chat:messages:server:reconciled` | `useConversationMessages` | Engine loaded and replaced cache data |

---

## 11. Current Status Judgment

CURRENT RUNTIME

- engine-backed: yes
- app-local support seams: yes
- hybrid codebase: yes
- legacy `vc.*` chat code still present on disk: no (removed 2026-04-05)
- current unread badge aligned with engine chat schema: yes
- chat bell-notification creation visible in app runtime code: no

---

## Audit References

Latest Engine Audit:
`zNOTFORPRODUCTION/_CANONICAL/logan/engines/CHAT_ENGINE_AUDIT_V3.md`

Previous Engine Audit:
`zNOTFORPRODUCTION/_CANONICAL/logan/engines/CHAT_ENGINE_AUDIT_V2.md`
