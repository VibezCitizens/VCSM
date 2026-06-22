# VCSM Chat — Badge Pipeline

## 1 Purpose

Documents the end-to-end pipeline for the chat unread badge shown on the Vox tab of the
VCSM bottom navigation bar. Covers the read path (how the count is fetched), the clear
path (how opening a conversation resets the badge), the RLS dependency, and the realtime
status.

---

## 2 Scope

**Application Scope:** VCSM + ENGINE

Included:
- Bottom nav badge query and polling
- Mark-read controller and DAL (engine)
- Optimistic badge clear (React Query hook)
- RLS policies on `chat.inbox_entries`

Excluded:
- Bell notification badge (`vc.notifications`) — separate pipeline
- Wentrex chat unread — separate product, separate schema

---

## 3 Ownership

**Application Scope:** VCSM + ENGINE  
**Code Roots:**
- `apps/VCSM/src/bootstrap/bootstrap.selectors.js` (badge hook)
- `apps/VCSM/src/features/chat/inbox/hooks/useMarkChatRead.js` (clear hook)
- `apps/VCSM/src/features/chat/inbox/controller/chatUnread.controller.js`
- `apps/VCSM/src/features/chat/inbox/dal/inboxUnread.read.dal.js`
- `engines/chat/src/controller/markConversationRead.controller.js`
- `engines/chat/src/dal/conversationRead.write.dal.js`

**Related Engines:** `engines/chat`

---

## 4 Entry Points

**Badge read (UI):**
- `apps/VCSM/src/shared/components/BottomNavBar.jsx`

**Badge hook:**
- `apps/VCSM/src/bootstrap/bootstrap.selectors.js` — `useChatUnread()`

**Mark-read mutation:**
- `apps/VCSM/src/features/chat/inbox/hooks/useMarkChatRead.js` — `useMarkChatRead(actorId)`

**Engine controller:**
- `engines/chat/src/controller/markConversationRead.controller.js` — `markConversationRead({ actorId, conversationId })`

**Engine DAL:**
- `engines/chat/src/dal/conversationRead.write.dal.js` — `dalResetInboxUnreadCount`, `dalUpdateConversationMemberReadPointer`

**Query adapter (badge query fn):**
- `apps/VCSM/src/features/chat/inbox/hooks/useChatUnreadOps.js`
- `apps/VCSM/src/features/chat/inbox/controller/chatUnread.controller.js`
- `apps/VCSM/src/features/chat/inbox/dal/inboxUnread.read.dal.js`

---

## 5 Data Flow

### 5.1 Badge Read Pipeline

```text
BottomNavBar.jsx
  → useChatUnread()                          [bootstrap.selectors.js]
  → useBootstrapStore (hydratedForActorId)
  → useQuery({
      key: ['bootstrap', 'chat-unread', actorId],
      refetchInterval: 30_000 ms
    })
  → getChatInboxUnreadBadgeCount(actorId)    [chatUnread.controller.js]
  → readChatInboxUnreadRowsDAL(actorId)      [inboxUnread.read.dal.js]
  → SELECT unread_count
    FROM chat.inbox_entries
    WHERE actor_id = ?
      AND archived = false
      AND archived_until_new = false
  → sum(unread_count)
  → badge rendered on Vox tab
```

Query key: `['bootstrap', 'chat-unread', actorId]`  
Poll interval: 30 seconds  
Placeholder: `0` (no loading flash)

### 5.2 Mark-Read Pipeline (Badge Clear)

```text
ConversationView opens
  → useMarkChatRead(actorId).mutate(conversationId)
  → onMutate (optimistic — immediate):
      snapshot prevInbox + prevBadge from React Query cache
      setQueryData chatInbox → zero unread_count for this conversation
      setQueryData chatUnread → subtract removedUnread from badge (min 0)
  → mutationFn → markConversationRead({ actorId, conversationId })  [@chat engine]
      dalReadConversationMemberForReadState()
      dalReadLatestVisibleMessageInConversation()
      if no lastMessage:
        dalResetInboxUnreadCount()
        return
      if last_read_message_id === lastMessage.id:
        dalResetInboxUnreadCount()        ← always runs, not skipped
        return
      dalUpdateConversationMemberReadPointer()
      dalResetInboxUnreadCount()
      publishDomainEvent(CONVERSATION_READ)
  → onSuccess:
      invalidateQueries(['chat', 'unread', actorId])
      invalidateQueries(['bootstrap', 'chat-unread', actorId])
  → onError:
      rollback prevInbox and prevBadge to cache
      invalidateQueries both keys (restore from DB)
```

### 5.3 Unread Increment Pipeline

```text
Message sent
  → useConversationMessages() → @chat sendMessageController()
  → chat.send_message_atomic RPC
  → DB fan-out: increments chat.inbox_entries.unread_count for all members
  → React Query poll (30s) picks up new count
  → badge updates on next poll
```

---

## 6 Source of Truth

| Data | Table | Column |
|---|---|---|
| Unread count per conversation | `chat.inbox_entries` | `unread_count` |
| Read pointer | `chat.conversation_members` | `last_read_message_id`, `last_read_at` |
| Badge total | React Query cache `['bootstrap', 'chat-unread', actorId]` | (sum of unread_count rows) |

---

## 7 UI States

| State | Trigger |
|---|---|
| Badge hidden | `chatUnread === 0` or no actor hydrated |
| Badge visible | `chatUnread > 0` |
| Badge clears immediately on open | Optimistic `setQueryData` in `onMutate` of `useMarkChatRead` |
| Badge confirmed cleared | `onSuccess` invalidateQueries → poll refetches DB value |
| Badge rolled back on error | `onError` restores prevBadge snapshot |

---

## 8 Dependencies

**Internal modules:**
- `useBootstrapStore` — provides `hydratedForActorId` (actorId for badge polling)
- `queryKeys` — `chatUnread`, `chatInbox`, `chatUnreadCount` key factories
- `@chat` engine — `markConversationRead` controller

**Shared engines:**
- `engines/chat` — mark-read controller, write DALs

**External services:**
- Supabase — `chat.inbox_entries`, `chat.conversation_members`

**Database objects:**
- `chat.inbox_entries` — unread count projection table
- `chat.conversation_members` — read pointer per member
- `vc.actor_owners` — used by RLS policy (see Section 10)

---

## 9 Rules / Invariants

1. `useChatUnread()` must read `hydratedForActorId` from bootstrap store — not from `useIdentity()` directly. The bootstrap store manages hydration timing.

2. `dalResetInboxUnreadCount` must always be called when a conversation is marked read — even when `last_read_message_id` already equals `lastMessage.id`. The read pointer being current does not guarantee `unread_count` is already 0 (RPC fan-out timing can leave it non-zero).

3. Optimistic badge subtraction in `onMutate` must use a snapshot for rollback. The rollback must be applied in `onError` before `invalidateQueries` so the UI never shows stale data longer than one poll cycle.

4. `badgeSubscriptions.js` is a **no-op stub**. The badge is refreshed by React Query polling only — there is no active Supabase realtime subscription for the badge. Do not assume realtime clears the badge.

5. The badge query and the mark-read mutation use different React Query keys. Both must be invalidated in `onSuccess` to ensure the badge clears on the next poll even if the optimistic update was skipped (e.g. `removedUnread === 0`).

---

## 10 Failure Risks

### RLS Persona Mismatch

**Risk:** Supabase returns `{ error: null, data: [] }` when RLS blocks an UPDATE — 0 rows affected, no error thrown. If the actor in the UPDATE query is not permitted by the RLS policy, the badge silently stays non-zero.

**Previous cause (fixed 2026-04-30):** `chat.current_actor_id()` always returned `ORDER BY actor_id LIMIT 1` from `vc.actor_owners` — the alphabetically-first actor for the user. For multi-actor users (personal + Vport), UPDATEs for the "other" actor were silently blocked.

**Current policy (as of migration `20260430200000_fix_chat_rls_multi_actor.sql`):**  
`chat.inbox_entries` UPDATE, SELECT, INSERT, DELETE all use:
```sql
EXISTS (
  SELECT 1 FROM vc.actor_owners ao
  WHERE ao.actor_id = chat.inbox_entries.actor_id
    AND ao.user_id  = auth.uid()
    AND coalesce(ao.is_void, false) = false
)
```
This allows any actor owned by `auth.uid()` to update its own rows — not just the alphabetically-first actor.

**Diagnostic:** `dalResetInboxUnreadCount` logs a DEV-only `console.warn` when `rowsAffected === 0`. Run `SELECT chat.current_actor_id();` in Supabase SQL editor and compare against the `actorId` in use.

### Early Return Skip (fixed 2026-04-30)

**Previous cause:** `markConversationRead.controller.js` returned early when `member.last_read_message_id === lastMessage.id` without calling `dalResetInboxUnreadCount`. If the read pointer was current but `unread_count` was still > 0, the badge would not clear.

**Current behavior:** `dalResetInboxUnreadCount` is always called in all code paths, including the early-return path.

### Stale Badge After Error

If `markConversationRead` throws and `onError` is reached, the optimistic badge update is rolled back. The badge will reappear until the next 30-second poll clears it from DB truth. This is expected behavior — the mutation failed so the rollback is correct.

---

## 11 Debug Notes

**Check RLS is not blocking:**
```sql
-- In Supabase SQL Editor, authenticated as the affected user:
SELECT chat.current_actor_id();
-- Compare the UUID returned against the actorId the app is using.
-- If they differ and the app actor is NOT the primary actor, the old RLS would block.
-- After the migration, both actors should be permitted.
```

**Check unread count in DB:**
```sql
SELECT actor_id, conversation_id, unread_count
FROM chat.inbox_entries
WHERE actor_id = '<actorId>';
```

**Check read pointer in DB:**
```sql
SELECT actor_id, conversation_id, last_read_message_id, last_read_at
FROM chat.conversation_members
WHERE actor_id = '<actorId>'
  AND conversation_id = '<conversationId>';
```

**DEV console warning:**  
`[dalResetInboxUnreadCount] 0 rows updated — RLS may be blocking this actor.`  
Guarded by `import.meta.env.DEV` — never logs in production.

---

## 12 Files Map

| File | Responsibility |
|---|---|
| `apps/VCSM/src/shared/components/BottomNavBar.jsx` | Renders badge via `useChatUnread()` |
| `apps/VCSM/src/bootstrap/bootstrap.selectors.js` | `useChatUnread()` — React Query polling hook |
| `apps/VCSM/src/features/chat/inbox/hooks/useMarkChatRead.js` | React Query mutation, optimistic clear, rollback |
| `apps/VCSM/src/features/chat/inbox/hooks/useChatUnreadOps.js` | Adapter binding for badge query fn |
| `apps/VCSM/src/features/chat/inbox/controller/chatUnread.controller.js` | `getChatInboxUnreadBadgeCount` — sums rows |
| `apps/VCSM/src/features/chat/inbox/dal/inboxUnread.read.dal.js` | `readChatInboxUnreadRowsDAL` — SELECT from `chat.inbox_entries` |
| `apps/VCSM/src/queries/queryKeys.js` | `chatUnread`, `chatInbox`, `chatUnreadCount` key factories |
| `apps/VCSM/src/features/notifications/inbox/realtime/badgeSubscriptions.js` | No-op stub — realtime disabled |
| `engines/chat/src/controller/markConversationRead.controller.js` | Mark-read orchestration — calls both write DALs |
| `engines/chat/src/dal/conversationRead.write.dal.js` | `dalResetInboxUnreadCount`, `dalUpdateConversationMemberReadPointer` |
| `apps/VCSM/supabase/migrations/20260430200000_fix_chat_rls_multi_actor.sql` | RLS fix — replaces 5 policies with ownership EXISTS predicate |

---

## Audit References

Latest Engine Audit:
`zNOTFORPRODUCTION/_CANONICAL/logan/engines/CHAT_ENGINE_AUDIT_V3.md`

Previous Engine Audit:
`zNOTFORPRODUCTION/_CANONICAL/logan/engines/CHAT_ENGINE_AUDIT_V2.md`

---

## 13 Change Log

### 2026-04-30 20:00

**Task:** Full rewrite to fix MAJOR DRIFT detected during BUGSBUNNY session.

**Drift Found:**
- Wrong hook listed: `useUnreadBadge()` → actual: `useChatUnread()` from `bootstrap.selectors.js`
- Dead file paths: `notifications/inbox/hooks/`, `notifications/inbox/controller/`, `notifications/inbox/dal/` — badge pipeline lives in `chat/inbox/` and `bootstrap/`
- False realtime claim: `badgeSubscriptions.js` is a confirmed no-op stub — badge refreshes via polling only
- Missing: full mark-read pipeline documentation
- Missing: RLS dependency and persona mismatch risk
- Missing: optimistic update and rollback behavior

**Code Status Before:** MAJOR DRIFT  
**Summary:** Rewrote document entirely from verified code inspection. All file paths, hook names, data flows, RLS policies, and invariants confirmed against current implementation.

**Files Changed:** `vcsm.chat.badge-pipeline.md` (full rewrite)

**Validation:** All file paths verified to exist. Hook names confirmed against `BottomNavBar.jsx` import. RLS policies confirmed against migration file. Engine controller and DAL confirmed against current source.
