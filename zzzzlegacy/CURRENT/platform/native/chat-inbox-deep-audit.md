# Chat / Inbox — Deep Audit
PWA → Native iOS Transfer Reference

**Audit date:** 2026-05-04
**Scope:** All PWA inbox + conversation screens, full data layer, engine contracts, realtime, moderation, settings

---

## 1. PWA Route Inventory

| Route | Screen | Folder |
|---|---|---|
| `/chat` | `InboxScreen` | `inbox` |
| `/chat/new` | `NewChatScreen` (wraps `StartConversationModal`) | — |
| `/chat/spam` | `SpamInboxScreen` | `spam` |
| `/chat/requests` | `RequestsInboxScreen` | `requests` |
| `/chat/archived` | `ArchivedInboxScreen` | `archived` |
| `/chat/settings` | `InboxChatSettingsScreen` (hub) | — |
| `/chat/settings/inbox` | `InboxSettingsScreen` | — |
| `/chat/settings/privacy` | `MessagePrivacyScreen` | — |
| `/chat/settings/blocked` | `BlockedUsersScreen` | — |
| `/chat/:conversationId` | `ChatConversationScreen` → `ConversationView` | — |
| `/vport/inbox` | Redirects to `/chat` | — |
| `/vport/chat/:conversationId` | `ChatConversationScreen` (same) | — |

**Total routes: 12** (10 real, 2 redirects/aliases)

---

## 2. Supabase Schema Contracts

All chat data lives in the **`chat`** schema. Not `vc`, not `vport`.

### `chat.inbox_entries`

```
conversation_id      uuid
actor_id             uuid          ← scoped to current actor (RLS)
last_message_id      uuid          ← nullable
last_message_at      timestamptz   ← nullable
unread_count         int4
pinned               bool
archived             bool
muted                bool
archived_until_new   bool          ← archived but will resurface on new message
history_cutoff_at    timestamptz   ← nullable; messages before this not shown
folder               text          ← 'inbox' | 'spam' | 'requests' | 'archived'
partner_display_name text          ← denormalized from partner actor
partner_username     text          ← denormalized from partner actor
partner_photo_url    text          ← denormalized from partner actor
```

### `chat.conversations`

```
id                   uuid
conversation_kind    text          ← 'direct' | 'group' | 'announcement'
access_mode          text          ← 'standard' | 'announcement'
visibility           text          ← 'members'
scope_kind           text          ← nullable (e.g. 'course' for LMS)
scope_id             uuid          ← nullable
title                text          ← nullable; used for group chats
```

### `chat.conversation_members`

```
conversation_id      uuid
actor_id             uuid
role                 text
membership_status    text          ← 'active' | 'invited' | 'removed'
can_post             bool
can_manage           bool
can_moderate         bool
```

### `chat.messages`

```
id                   uuid
conversation_id      uuid
sender_actor_id      uuid
message_kind         text          ← 'text' | 'image' | 'video' | 'system'
body                 text          ← null if deleted or hidden
reply_to_message_id  uuid          ← nullable
conversation_seq     int8          ← monotonic per-conversation sequence
edited_at            timestamptz   ← nullable
deleted_at           timestamptz   ← soft delete (null body shown as "Message deleted")
is_hidden            bool          ← moderation hide
created_at           timestamptz
client_id            text          ← idempotency key (UUID from client)
```

### `chat.message_attachments` (joined as `message_attachments`)

```
id                   uuid
attachment_kind      text          ← 'image' | 'video'
public_url           text          ← CDN URL
storage_path         text          ← storage key
original_name        text          ← nullable
mime_type            text
size_bytes           int8
width                int4          ← nullable
height               int4          ← nullable
duration_ms          int8          ← nullable (video)
checksum             text          ← nullable
upload_status        text          ← 'ready' | 'pending'
sort_order           int4
meta                 jsonb         ← nullable
created_at           timestamptz
```

### `chat.typing_states`

Used by typing presence controller. Schema not directly queried by app — accessed via Supabase presence channel, not postgres_changes.

---

## 3. Engine Architecture

The chat system is two-layered:

```
apps/VCSM/src/features/chat/   ← app adapter layer
engines/chat/src/               ← engine (app-agnostic)
```

The app layer imports from engine via `@chat` alias. The engine exports controllers, models, hooks, and services. The app adds:
- React Query caching (inbox)
- Warm-cache seeding (messages)
- iOS-specific keyboard/scroll behaviors
- Avatar/ActorLink UI
- Moderation adapter imports

**Engine path:** `engines/chat/src/`

**Engine key exports (via `engines/chat/index.js`):**
- `getInboxEntries` — inbox fetch controller
- `InboxEntryModel` — inbox entry shape constructor
- `markConversationRead` — mark as read controller
- `useTypingChannel` — typing presence hook
- `useInboxActions` — inbox mutation actions hook
- `MessageModel` — message shape constructor

---

## 4. InboxEntry Model Shape

Shape produced by `InboxEntryModel(raw, selfActorId)`:

```
conversationId       string
actorId              string
folder               'inbox' | 'spam' | 'requests' | 'archived'
conversationKind     'direct' | 'group' | 'announcement' | null
accessMode           'standard' | 'announcement'
visibility           'members'
scopeKind            string | null
scopeId              string | null
title                string | null
isAnnouncement       bool

lastMessageId        string | null
lastMessageAt        string | null
lastMessageBody      string | null   ← normalized: "📷 Photo" / "🎥 Video" for media

unreadCount          number
pinned               bool
archived             bool
muted                bool
archivedUntilNew     bool
historyCutoffAt      string | null

members              Array<{ actorId, kind, displayName, username, photoUrl }>

partnerActorId       string | null
partnerKind          string | null
partnerDisplayName   string | null   ← from members first, then partner_display_name column
partnerUsername      string | null
partnerPhotoUrl      string | null

preview              null            ← set by app layer after modeling
```

**App layer adds `preview` field** (after modeling):
```
preview = (lastMessageBody && lastMessageBody.trim()) || (unreadCount > 0 ? 'New message' : '')
```

---

## 5. Message Model Shape

Shape produced by `MessageModel(row)`:

```
id                   string
conversationId       string
senderActorId        string
kind                 'text' | 'image' | 'video' | 'system'
type                 same as kind (alias)
body                 string | null   ← null if isDeleted or isHidden
replyToMessageId     string | null
conversationSeq      number | null
createdAt            string (ISO)
editedAt             string | null
deletedAt            string | null
isEdited             bool
isDeleted            bool
isHidden             bool
isSystem             bool            ← kind === 'system'
clientId             string | null   ← idempotency key
mediaUrl             string | null   ← media_url or first attachment's public_url
attachments          Array           ← [] if deleted or hidden
```

**Optimistic message fields (app-only, not from DB):**
```
__optimistic         bool   ← true while waiting for server ACK
__uploading          bool   ← true while image upload in progress
__failed             bool   ← true if send failed
```

---

## 6. Inbox Data Flow

```
InboxScreen
  └── useInbox({ actorId })
        └── useChatInbox(actorId, { folder })
              └── React Query: staleTime=30s, refetchInterval=30s
                    └── getInboxEntries({ actorId, folder }) [engine controller]
                          └── inbox.read.dal.js [DAL — explicit selects]
                                chat.inbox_entries + joined conversation + members + last_message
              → InboxEntryModel[] (modeled)
              → filter by hiddenRef (optimistic hide tombstones)
              → entries

  └── buildInboxPreview({ entry, currentActorId })
        → resolves display actor (members first, then partner_* columns)
        → preview priority: body → modeledPreview → "Message" (if lastMessageId) → "New message" (if unread)
        → returns: { conversationId, unreadCount, pinned, muted, archived, partnerActorId, partnerKind,
                     partnerDisplayName, partnerUsername, partnerPhotoUrl, preview, lastMessageAt, lastMessageId }

  └── shouldShowInboxEntry(entry, settings)
        → if hideEmptyConversations: only show entries with lastMessageId OR unreadCount OR preview text
        → default: show all

  └── InboxList → CardInbox cards
```

**Polling:** React Query polls every 30 seconds in foreground. No realtime subscription for inbox in PWA app layer (intentional — comment says "Realtime intentionally disabled for chat inbox/unread for now").

**NATIVE RECOMMENDATION:** Use Supabase realtime for inbox instead of polling. Engine's `subscribeToInbox` already exists — subscribe to INSERT/UPDATE/DELETE on `chat.inbox_entries` for `actor_id=eq.{actorId}` and reload on any change.

---

## 7. Conversation Data Flow

```
ChatConversationScreen (Final Screen — guard only)
  └── ConversationView({ conversationId })
        ├── location.state?.inboxPreview → seedConversation, seedPartnerActor (instant shell)
        │
        ├── useConversation({ conversationId, actorId })          ← openConversation RPC
        ├── useConversationMembers({ conversationId, actorId })   ← readConversationMembers
        │
        ├── useConversationMessages({ conversationId, actorId })  ← messages + realtime
        │     └── app adapter: seeds from React Query cache synchronously on mount
        │           → engine hook owns actual load + realtime
        │
        ├── useTypingChannel({ conversationId, actorId })         ← presence channel
        │
        ├── useMarkChatRead(actorId)                               ← fires on mount
        │
        ├── effectiveConversation = conversation ?? seedConversation
        ├── effectivePartnerActor = resolvedPartnerActor ?? seedPartnerActor
        │
        ├── canReadConversation({ actorId, members }) — enforced AFTER members load
        │
        └── renders: ChatHeader / MessageList / ChatInput / menus / covers
```

---

## 8. Message Loading + Realtime

Engine `useConversationMessages` (owns all state):

**Initial load:**
```
getConversationMessagesController({ conversationId, actorId, limit: 50 })
  └── messages.timeline.read.dal.js
        chat.messages (newest-first, limit 50, reversed to chronological)
        + joined chat.message_attachments (explicit columns)
  → MessageModel[]
```

**Realtime:**
```
subscribeToConversation({ conversationId, actorId, onMessageInserted })
  Channel name: chat-conv-{conversationId}-{counter}
  Event: INSERT on chat.messages WHERE conversation_id=eq.{conversationId}
  → MessageModel(payload.new)
  → mergeMessages([])  — deduplicates, reconciles optimistic via clientId
```

**Merge engine logic (deterministic, tombstone-safe):**
1. Index existing messages by id and clientId
2. For each incoming message:
   - Skip if id or clientId is in delete-for-me tombstone sets
   - Skip if existing is already isDeleted and incoming has no deletedAt (no resurrection)
   - If id exists: update in place (handles edits/unsends)
   - If clientId exists: reconcile optimistic → real (preserves mediaUrl from optimistic)
   - Otherwise: add as new
3. Sort by createdAt

---

## 9. Send Message Flow

```
ChatInput → handleSend(text) OR handleAttach(files)
  └── useSendMessageActions.handleSend(text)
        └── onSendMessage({ body: text, type: 'text' })
              └── engine useConversationMessages.onSendMessage()
                    1. addOptimistic() → inserts local message with __optimistic:true
                    2. sendMessageController({ conversationId, actorId, body, messageKind, clientId })
                          ├── ensureConversationMembership()
                          ├── fetchConversationMember() → validates active + can_post
                          └── idempotentSendMessage() → send_message_atomic RPC
                                Atomic RPC does:
                                  ①  chat.messages INSERT (with conversation_seq)
                                  ②  chat.conversations UPDATE (last_message_id, last_message_at)
                                  ③  chat.inbox_entries fan-out for all members
                                  ④  chat.outbox_events INSERT
                    3. replaceOptimistic(clientId, message) → swaps local with server message
                    4. On error: markFailed(clientId) → shows "Failed · Retry"
```

**Retry flow:** User taps "Failed · Retry" → resets to `__optimistic:true, __failed:false` → retries `sendMessageController` → if success replaces, if fails marks failed again.

---

## 10. Image Attach Flow

```
ChatInput → fileRef.click() → handleFilePick → mediaPreview state
ChatInput → doPrimary() → onAttach([file])

handleAttach(files):
  1. Only images allowed (startsWith 'image/') — returns error for video/other
  2. addOptimistic({ kind:'image', body:'', __uploading:true }) → placeholder shown
  3. uploadAttachment(file, { extraPath: conversationId })
       ├── Validates type
       ├── Compresses: max 1600px, quality 0.82
       ├── Generates UUID storage key
       └── Uploads to CDN → returns { publicUrl, storageKey, mimeType, sizeBytes }
  4. updateOptimistic(clientId, { mediaUrl: url, __uploading:false }) → image visible immediately
  5. onSendMessage({ type:'image', body:'', mediaUrl:url, attachments:[...], prebuiltClientId })
       → DB insert via RPC
  6. recordChatAttachmentController() → writes to platform.media_assets (non-fatal if fails)
```

**PWA media support:**
- Send: images only (jpeg, png, gif, webp, etc.)
- Receive/view: images AND video (video plays inline in MessageMedia component)

---

## 11. Realtime Architecture

Three distinct realtime mechanisms:

| Mechanism | Transport | Used for |
|---|---|---|
| `subscribeToInbox` | postgres_changes (INSERT/UPDATE/DELETE) | Inbox list updates |
| `subscribeToConversation` | postgres_changes (INSERT on messages) | New message delivery |
| `useTypingChannel` | Supabase Presence | Typing indicator |

**CRITICAL: Channel lifecycle rule from engine.**
1. Create fresh channel (unique name per subscription — includes `_subCounter` suffix)
2. Attach ALL `.on()` handlers BEFORE calling `.subscribe()`
3. Call `.subscribe()` exactly ONCE
4. Return cleanup that calls `supabase.removeChannel(channel)`
5. NEVER reuse channels between subscriptions (React Strict Mode / fast remount safe)

**Inbox channel name:** `chat-inbox-{actorId}-{counter}`
**Conversation channel name:** `chat-conv-{conversationId}-{counter}`
**Typing channel name:** per `ctrlCreateTypingPresenceChannel` implementation

---

## 12. Typing Presence

**Channel type:** Supabase Presence (NOT postgres_changes)

```
ctrlCreateTypingPresenceChannel({ conversationId, actorId })
  → channel.on('presence', { event: 'sync' }, ...)
  → presenceState() → typingActors (filtered to exclude self)

notifyTyping():
  → ctrlTrackTypingPresence({ channel, actorPresentation })
  → debounced: 3s timeout clears state
```

**IMPORTANT GAP:** `typingActors` is returned by `useTypingChannel` in the app's `ConversationView` but is **NOT rendered anywhere** in the PWA UI. The typing indicator is fully wired on the data side but there is no UI component displaying "User is typing..." text. Native should decide: implement typing UI or skip for parity.

---

## 13. Mark Read + Unread Badge

**Mark read (fires on conversation open):**
```
useMarkChatRead(actorId).mutate(conversationId)
  ├── Optimistic: zeros unread_count in React Query inbox cache
  ├── Optimistic: subtracts from badge cache (immediate nav badge clear)
  └── markConversationRead({ actorId, conversationId }) [engine controller]
        → chat.inbox_entries UPDATE unread_count=0 WHERE actor_id=actorId AND conversation_id=conversationId
```

**Unread badge count:**
```
getChatInboxUnreadBadgeCount(actorId)
  └── readChatInboxUnreadRowsDAL(actorId)
        chat.inbox_entries
          .select('unread_count')
          .eq('actor_id', actorId)
          .eq('archived', false)
          .eq('archived_until_new', false)
  → sum of all unread_count values
```

Note: archived=true and archived_until_new=true entries are excluded from the badge count. Spam and requests folders ARE included (they are not filtered by folder, only by archived flags).

---

## 14. Permissions (Pure Functions — No IO)

These are pure model functions used client-side to guard UI. RLS enforces server-side.

### `canReadConversation({ actorId, members })`

```
members.some(m => m.actorId === actorId && m.isActive === true)
```

- Returns false if actorId null or members not array
- Called in ConversationView AFTER members array has loaded (not on seed)

### `canSendMessage({ actorId, conversation, members })`

```
members.find(m => m.actorId === actorId && m.isActive)
  + no can_post === false restriction
```

- Returns false if actorId, conversation, or members missing
- Currently no additional restrictions (future-safe comment suggests announcement mode etc)
- ChatInput's disabled state comes from a different source (conversationCovered / not from canSendMessage directly)

### `isActorBlocked({ actorId, otherActorId, blocks })`

```
blocks.some(b =>
  (b.blocker_actor_id === actorId && b.blocked_actor_id === otherActorId) ||
  (b.blocker_actor_id === otherActorId && b.blocked_actor_id === actorId)
)
```

- Symmetric: either direction blocked = communication blocked
- Uses `moderation` schema rows (columns: `blocker_actor_id`, `blocked_actor_id`)
- NOT the `vc.user_blocks` table — use `moderation.block_actor` / `moderation.unblock_actor` RPCs

---

## 15. Moderation / Cover System

`useConversationCover` adapter:
- `conversationCovered: bool` — true if conversation has a moderation cover active
- `setConversationCovered(bool)` — sets cover (triggered by mark-spam action)
- `undoConversationCover()` — removes cover (triggered by "undo spam" action)

When `conversationCovered === true`:
- `ChatInput` is hidden (`!conversationCovered && <ChatInput />`)
- `MessageActionsMenu` disabled (`conversationCovered ? undefined : openMenu`)
- `ChatHeader` menu disabled (`conversationCovered ? undefined : openConvMenu`)
- `ChatSpamCover` rendered over the message list

`ChatSpamCover` props:
- `onPrimary` → navigates to `/chat/spam` or `/chat` depending on `isSpamThread`
- `onSecondary` → calls `handleUndoSpam`

`ConversationActionsMenu` actions:
- Archive / Unarchive (toggles based on `isArchived` flag from `inboxEntry`)
- Report Conversation (opens `ReportModal`)
- Mark Spam (sets cover, fires `handleMarkSpamConversation`)
- No "Block" in conv menu — block lives in settings/blocked screen

`MessageActionsMenu` actions:
- Copy (clipboard)
- Edit (own messages only — `menu.isOwn`)
- Delete for Me (all messages)
- Unsend (own messages only — removes for all)
- Report Message (opens `ReportModal`)

---

## 16. Inbox Folder Architecture

```
folder string → useInboxFolder({ actorId, folder })
                  → useInbox({ actorId, folder, includeArchived: folder==='archived' })
                      → useChatInbox(actorId, { folder, includeArchived })
                          → React Query: getInboxEntries({ actorId, folder, includeArchived })
                              DAL: .eq('folder', folder)
                              + if !includeArchived && folder==='inbox': .eq('archived', false).eq('archived_until_new', false)
```

**Folder routing:**
- `inbox`: main inbox, excludes archived and archived_until_new entries
- `spam`: reads from chat.inbox_entries WHERE folder='spam'
- `requests`: reads folder='requests' AND applies `isRequestEntry()` filter (defensive multi-field check in PWA)
- `archived`: reads folder='archived' WITH includeArchived=true (does not filter out archived flag)

**NOTE:** `isRequestEntry()` in `RequestsInboxScreen` has 20+ defensive conditions checking multiple field names. This is defensive coding, not schema complexity. Native only needs: `entry.folder === 'requests'`.

---

## 17. VexSettings

User preferences stored per actor. Two settings:

| Setting | Default | Meaning |
|---|---|---|
| `hideEmptyConversations` | `false` | Hides inbox entries with no lastMessageId, unreadCount, or preview text |
| `showThreadPreview` | `true` | Shows/hides preview text in inbox card |

Migration note: `showMessagePreview` is an old field name for `showThreadPreview`. `normalizeVexSettings()` handles both.

`useVexSettings()` → reads from DB, returns `{ settings }`.

Applied via `shouldShowInboxEntry(entry, settings)` before rendering each folder.

---

## 18. UI Component Contracts

### CardInbox

Input: `{ entry, onClick, onDelete, showThreadPreview }`

Layout:
- 12×12 avatar (48px, `rounded-xl border border-white/8`)
- Name: semibold white if unread, text-white/90 otherwise; truncated
- Preview: 12px, white/70 if unread, white/40 otherwise; `showThreadPreview` controls visibility; "No Vox yet" if empty
- Unread badge: purple-500 circle, min 18px, "99+" for > 99, right side
- Delete button: trash icon, right side, propagation stopped

### ChatHeader

Input: `{ conversation, partnerActor, onBack, onOpenMenu }`

Layout:
- 56px tall sticky header, blur backdrop, border-b
- Left: ChevronLeft back button (purple-300) + actor area
- Center: For DM — `ActorLink` (avatar + name); for group — initial-letter 40×40 badge
- Right: MoreVertical (22px) → fires `onOpenMenu(rect)` with button's BoundingClientRect

Behavior:
- `partnerActor.route` resolves to `/profile/{username ?? actorId}`
- If `onOpenMenu` is undefined (conversationCovered) → no three-dot menu

### ChatInput (two-state design)

State 1 — COLLAPSED: Single "T" button at bottom. `topBarOpen: false`.
State 2 — EXPANDED: Full input bar slides in. `topBarOpen: true`.

Input bar contents:
- Paperclip button → triggers file picker (image/video input)
- Media preview thumbnail (if file selected) with X to remove
- Text input: `enterKeyHint="send"`, `inputMode="text"`, `autoComplete="off"`, 4000 char max
- Send button: purple-600 active state when has content; Loader2 spinner while submitting

Edit mode:
- `editing: bool` + `initialValue: string` from parent
- Populates textarea with initialValue, uses "Edit message..." placeholder
- Enter → `onSaveEdit(text)`, Escape → `onCancelEdit()`
- `enterKeyHint="done"` in edit mode

Composition guard: `composingRef` blocks send on Enter during IME input.

### MessageBubble

Input: `{ message, senderActor, isMine, showAvatar, showName, statusSlot, onOpenActions, onOpenMedia, onRetry }`

Layout:
- Own: `justify-end`, purple-600 bg, `rounded-br-md` (right bottom tight corner)
- Other: `justify-start`, purple-500 bg, `rounded-bl-md` (left bottom tight corner)
- 78% max width
- Avatar slot: w-7 h-7, only for non-own messages, shows if `showAvatar`, spacer div if not

States:
- `isSystem`: centered 12px gray text, no bubble
- `isMediaOnly` (mediaUrl && !body): transparent bg, no padding — raw media
- `isUploading` (\_\_uploading && !mediaUrl): placeholder "Uploading…" box
- `isPending` (\_\_optimistic && !\_\_failed): opacity-65 + "Sending…" label
- `isFailed` (\_\_failed): opacity-80 + "Failed · Retry" tappable label
- `isDeleted`: "Message deleted" italic; no other content rendered (hard guard)
- `isEdited` (editedAt && !isDeleted): "(edited)" suffix inline

Long-press (500ms) → fires `onOpenActions({ messageId, senderActorId, anchorRect })`
Context menu (right-click) → same
Drag/move cancels long-press timer

### MessageList

Input: `{ messages, currentActorId, isGroupChat, statusForMessage, onOpenActions, onOpenMedia, retryMessage }`

Groups consecutive messages from same `senderActorId` into `MessageGroup` objects.

Auto-scroll: uses bottomRef.current?.scrollIntoView on messages.length change.
- First load or iOS: behavior='auto' (instant)
- Subsequent: behavior='smooth'

iOS visual viewport listener: re-anchors scroll on keyboard resize (critical for iOS chat UX).

Context menu preventDefault: on the container div, blocks iOS/Safari callout.

---

## 19. UX Behaviors (Critical for Native)

### iOS Keyboard
- `ios.useIOSPlatform({ enableKeyboard: true })` + `ios.useIOSKeyboard(true)` in ConversationView
- ChatInput is NOT a standard textarea-at-bottom — it's a slide-in top bar (`chat-topbar` CSS class)
- The "T" button at the bottom acts as keyboard trigger (not a standard FAB)
- Multiple `focusInput()` calls with requestAnimationFrame + timeouts to force iOS keyboard open

### Conversation Seed Pattern (Critical for instant render)
InboxScreen passes `{ state: { inboxPreview: preview } }` in `navigate()` call.
ConversationView reads `location.state?.inboxPreview` and builds `seedConversation` + `seedPartnerActor`.
Server hooks load in background and reconcile (`effectiveConversation = conversation ?? seedConversation`).
Access control enforced only AFTER server members have loaded.

Native equivalent: pass known conversation data via navigation params to avoid blank flash.

### Jump to Latest
`useConversationScroll` returns `{ showJumpButton, scrollToBottom }`.
"Jump to latest ↓" button appears when user has scrolled up and new messages arrive.
Tapping scrolls smoothly to bottom and hides button.

### Long-press vs. Context Menu
500ms timer on touch start → `openAtElement(el)` with bubble's BoundingClientRect as anchor.
`clearLongPress` on touchMove/touchEnd/touchCancel (cancel on drag).
Desktop: `onContextMenu` fires immediately.
Both deliver `{ messageId, senderActorId, anchorRect }` to `useMessageActionsMenu`.

### Mark Read Timing
Fires on conversationId + actorId mount in ConversationView. Optimistic — clears badge immediately.

---

## 20. Issues Found (9 total)

**ISSUE #1: Inbox has no realtime — polling only**
App-layer `useChatInbox` explicitly comments "Realtime intentionally disabled for chat inbox/unread for now." Inbox uses 30-second polling via React Query. Engine's `subscribeToInbox` exists but is NOT wired in the app layer.
Native SHOULD use realtime for inbox (no polling burden in native).
Affected: `useChatInbox.js` line 8-9 comment.

**ISSUE #2: Typing indicator wired but not displayed**
`useTypingChannel` returns `typingActors` array in ConversationView but it is NEVER rendered. There is no "User is typing..." component anywhere in the conversation UI.
Native decision: implement typing indicator UI, or skip for parity with PWA.
Affected: `ConversationView.jsx` — `typingActors` destructured but unused.

**ISSUE #3: Video send not supported**
`useSendMessageActions.handleAttach()` immediately rejects non-image files (`!startsWith('image/')`). Video receive + fullscreen view IS supported (MessageMedia renders video tag). Video send is blocked at the UI layer.
Native: match PWA — send images only, view video.

**ISSUE #4: Requests folder defensive check is misleading**
`RequestsInboxScreen` has `isRequestEntry()` with 20+ field checks. This implies past instability. The canonical source is `chat.inbox_entries.folder = 'requests'`. All other checks are defensive dead weight.
Native: use `folder === 'requests'` only.

**ISSUE #5: media_assets recording is non-fatal**
`recordChatAttachmentController()` is called with `.catch(() => warn)` — failure is silent. `platform.media_assets` row may not exist for some older chat attachments.
Native: implement same (attempt but do not fail send if media_assets write fails).

**ISSUE #6: Unread badge excludes archived but not spam/requests**
`readChatInboxUnreadRowsDAL` filters `archived=false AND archived_until_new=false` but does NOT filter by folder. Unread counts from spam + requests folders are included in the badge total.
Native: match this behavior exactly.

**ISSUE #7: partner_* columns may be stale**
`partner_display_name`, `partner_username`, `partner_photo_url` in `chat.inbox_entries` are denormalized snapshots that may lag behind live actor profile updates. `InboxEntryModel` prefers members array partner over these columns, but members are only present when the conversation is joined.
If members array is empty (lightweight inbox query), falls back to potentially stale partner_* columns.
Native: same fallback chain; no fix needed.

**ISSUE #8: chat.messages UPDATE not subscribed**
`subscribeToConversation` registers INSERT on messages and UPDATE on conversations, but NOT UPDATE on messages. This means: edits, unsends, and hidden-state changes are NOT received via realtime. They only appear after navigation-triggered reload or if another message arrives.
Native: consider subscribing to message UPDATE events too for edit/unsend parity.

**ISSUE #9: Announcement conversations not guarded in UI**
`isAnnouncement = accessMode === 'announcement'` is modeled but there is no visible UI check in ConversationView or ChatInput to prevent non-admin actors from attempting to send messages to announcement conversations. `canSendMessage` has a future-safe comment for this case but no implementation yet.
Native: same gap; implement once PWA implements it.

---

## 21. Supabase Query Contracts (Verbatim)

### Inbox fetch (engine inbox.read.dal.js)

```sql
SELECT
  conversation_id, actor_id, last_message_id, last_message_at, unread_count,
  pinned, archived, muted, archived_until_new, history_cutoff_at, folder,
  partner_display_name, partner_username, partner_photo_url,
  last_message:messages!chat_inbox_entries_last_message_fk (
    id, body, message_kind, created_at, deleted_at
  ),
  conversation:conversations (
    id, conversation_kind, access_mode, visibility, scope_kind, scope_id, title,
    members:conversation_members (
      conversation_id, actor_id, role, membership_status, can_post, can_manage, can_moderate
    )
  )
FROM chat.inbox_entries
WHERE actor_id = {actorId}
  AND folder = {folder}
  [AND archived = false AND archived_until_new = false  -- inbox only]
ORDER BY pinned DESC, last_message_at DESC
```

### Message timeline fetch (engine messages.timeline.read.dal.js)

```sql
SELECT
  id, conversation_id, sender_actor_id, message_kind, body, reply_to_message_id,
  conversation_seq, edited_at, deleted_at, is_hidden, created_at, client_id,
  message_attachments (
    id, attachment_kind, public_url, storage_path, original_name, mime_type, size_bytes,
    width, height, duration_ms, checksum, upload_status, sort_order, meta, created_at
  )
FROM chat.messages
WHERE conversation_id = {conversationId}
  [AND created_at < {before}]   -- pagination
ORDER BY created_at DESC
LIMIT 50
```
Reversed to oldest→newest before returning.

### Unread badge fetch (app inboxUnread.read.dal.js)

```sql
SELECT unread_count
FROM chat.inbox_entries
WHERE actor_id = {actorId}
  AND archived = false
  AND archived_until_new = false
```

---

## 22. Swift Implementation Guide

### Core data models

```swift
// InboxEntry — maps to InboxEntryModel
struct InboxEntry {
    let conversationId: String
    let actorId: String
    let folder: InboxFolder        // enum: inbox, spam, requests, archived
    let conversationKind: String?  // "direct" | "group" | "announcement"
    let lastMessageId: String?
    let lastMessageAt: Date?
    let lastMessageBody: String?   // pre-normalized ("📷 Photo" etc.)
    let unreadCount: Int
    let pinned: Bool
    let archived: Bool
    let muted: Bool
    let archivedUntilNew: Bool
    let members: [ConversationMember]
    let partnerActorId: String?
    let partnerKind: String?
    let partnerDisplayName: String?
    let partnerUsername: String?
    let partnerPhotoUrl: String?
    var preview: String            // computed: lastMessageBody || "New message" || ""
}

// Message — maps to MessageModel
struct ChatMessage {
    let id: String
    let conversationId: String
    let senderActorId: String
    let kind: MessageKind          // enum: text, image, video, system
    let body: String?              // nil if deleted or hidden
    let clientId: String?
    let mediaUrl: String?
    let conversationSeq: Int?
    let createdAt: Date
    let editedAt: Date?
    let deletedAt: Date?
    let isEdited: Bool
    let isDeleted: Bool
    let isHidden: Bool
    let isSystem: Bool
    var isOptimistic: Bool         // not from DB — local state
    var isUploading: Bool          // not from DB — local state
    var isFailed: Bool             // not from DB — local state
}

enum InboxFolder: String {
    case inbox, spam, requests, archived
}

enum MessageKind: String {
    case text, image, video, system
}
```

### Inbox DAL

```swift
func fetchInboxEntries(actorId: String, folder: InboxFolder) async throws -> [InboxEntry] {
    supabase
        .schema("chat")
        .from("inbox_entries")
        .select("""
            conversation_id, actor_id, last_message_id, last_message_at, unread_count,
            pinned, archived, muted, archived_until_new, history_cutoff_at, folder,
            partner_display_name, partner_username, partner_photo_url,
            last_message:messages!chat_inbox_entries_last_message_fk (
                id, body, message_kind, created_at, deleted_at
            ),
            conversation:conversations (
                id, conversation_kind, access_mode, visibility, scope_kind, scope_id, title,
                members:conversation_members (
                    conversation_id, actor_id, role, membership_status, can_post, can_manage, can_moderate
                )
            )
        """)
        .eq("actor_id", actorId)
        .eq("folder", folder.rawValue)
        // inbox only: exclude archived
        .order("pinned", ascending: false)
        .order("last_message_at", ascending: false)
}
```

### Inbox realtime (NATIVE PREFERRED OVER POLLING)

```swift
func subscribeToInbox(actorId: String, onChange: @escaping () -> Void) -> RealtimeChannel {
    supabase
        .channel("chat-inbox-\(actorId)-\(counter)")
        .on(.postgresChanges, .init(
            event: .insert, schema: "chat", table: "inbox_entries",
            filter: "actor_id=eq.\(actorId)"
        )) { _ in onChange() }
        .on(.postgresChanges, .init(
            event: .update, schema: "chat", table: "inbox_entries",
            filter: "actor_id=eq.\(actorId)"
        )) { _ in onChange() }
        .on(.postgresChanges, .init(
            event: .delete, schema: "chat", table: "inbox_entries",
            filter: "actor_id=eq.\(actorId)"
        )) { _ in onChange() }
        .subscribe()
}
```

### Message timeline DAL

```swift
func fetchMessages(conversationId: String, limit: Int = 50, before: Date? = nil) async throws -> [ChatMessage] {
    // SELECT explicit columns + message_attachments
    // ORDER BY created_at DESC, LIMIT 50
    // Reverse result to chronological order
}
```

### Message realtime

```swift
func subscribeToConversation(conversationId: String, onInsert: @escaping (ChatMessage) -> Void) -> RealtimeChannel {
    supabase
        .channel("chat-conv-\(conversationId)-\(counter)")
        .on(.postgresChanges, .init(
            event: .insert, schema: "chat", table: "messages",
            filter: "conversation_id=eq.\(conversationId)"
        )) { payload in
            if let message = ChatMessage(from: payload.new) {
                onInsert(message)
            }
        }
        .subscribe()
}
```

### Permissions (pure — no async)

```swift
func canReadConversation(actorId: String, members: [ConversationMember]) -> Bool {
    members.contains { $0.actorId == actorId && $0.isActive }
}

func canSendMessage(actorId: String, members: [ConversationMember]) -> Bool {
    guard let member = members.first(where: { $0.actorId == actorId && $0.isActive })
    else { return false }
    return member.canPost != false
}

// isActorBlocked — requires preloaded blocks array
// blocks: [{blocker_actor_id, blocked_actor_id}] from moderation schema
func isActorBlocked(actorId: String, otherActorId: String, blocks: [BlockRow]) -> Bool {
    blocks.contains {
        ($0.blockerActorId == actorId && $0.blockedActorId == otherActorId) ||
        ($0.blockerActorId == otherActorId && $0.blockedActorId == actorId)
    }
}
```

---

## 23. Build Order for Native Implementation

Follow DAL → Model → Controller → Store → View order:

1. **DAL layer**
   - `ChatInbox.read.dal.swift` — inbox fetch with explicit select
   - `ChatMessages.read.dal.swift` — timeline fetch
   - `ChatMessages.write.dal.swift` — send_message_atomic RPC call
   - `ChatUnread.read.dal.swift` — badge count query
   - `ChatInbox.realtime.dal.swift` — subscribeToInbox
   - `ChatConversation.realtime.dal.swift` — subscribeToConversation

2. **Model layer**
   - `InboxEntry.model.swift` — maps DB row to InboxEntry struct
   - `ChatMessage.model.swift` — maps DB row to ChatMessage struct
   - `InboxPreview.model.swift` — buildInboxPreview equivalent
   - `VexSettings.model.swift` — normalizeVexSettings + shouldShowInboxEntry

3. **Controller layer**
   - `InboxController.swift` — load, refresh, folder filter, shouldShow
   - `ConversationController.swift` — openConversation, readMembers, permissions
   - `SendMessageController.swift` — validate + atomic send + optimistic
   - `MarkReadController.swift` — mark read + badge update
   - `InboxActionsController.swift` — archive, unarchive, spam, delete, ignore, pin

4. **Store layer**
   - `InboxStore.swift` — entries, loading, error, hideConversation (optimistic)
   - `ConversationStore.swift` — messages, optimistic lifecycle, merge engine

5. **View layer**
   - `InboxScreen.swift` — list of CardInbox cells, folder selector, new chat button
   - `CardInboxView.swift` — avatar + name + preview + unread badge + delete
   - `ConversationScreen.swift` — chat header + message list + input
   - `ChatHeaderView.swift` — back + partner avatar + options menu
   - `MessageBubble.swift` — own/other/system/media/deleted states
   - `ChatInputView.swift` — collapsed T button → expanded top bar
   - `ConversationActionsMenuView.swift`
   - `MessageActionsMenuView.swift`
   - `SpamCoverView.swift`
   - Folder screens: SpamInbox, RequestsInbox, ArchivedInbox, SettingsHub
   - Settings screens: InboxSettings (VexSettings), PrivacySettings, BlockedUsers

---

## 24. Native Transfer Status at Audit Date

Existing native: conversations, inbox folders, realtime, typing presence, moderation cards, settings, start conversation via `identity` directory.

Remaining gaps (from tracker + this audit):
- Realtime inbox (currently polling — should be realtime on native)
- Typing indicator UI (wired but not displayed in PWA — native decision)
- `platform.media_assets` recording for attachments (non-fatal gap)
- Runtime test: report/block/spam/request/archived actions
- Runtime test: realtime reliability on iOS background/foreground transition

**Audit conclusion:** Chat system is architecturally complete and well-specified. No hidden schema or feature gaps. The two major native gaps are realtime inbox (should be fixed in native) and typing indicator UI (native discretion).
