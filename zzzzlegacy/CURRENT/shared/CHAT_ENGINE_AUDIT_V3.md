# Chat Engine Architecture Audit — V3

Audited: 2026-04-30
Scope: engines/chat/src/ — mark-read controller and write DAL fixes for badge pipeline bug
Prior version: CHAT_ENGINE_AUDIT_V2.md (2026-04-19)

---

## Related Logan Docs

Canonical System Doc:
zNOTFORPRODUCTION/logan/vcsm/chat/vcsm.chat.runtime-pipeline.md

Supporting Docs:
zNOTFORPRODUCTION/logan/vcsm/chat/vcsm.chat.badge-pipeline.md
zNOTFORPRODUCTION/logan/vcsm/chat/vcsm.chat.message-flow-audit.md

---

## Bug Fixed in This Version

**BUGSBUNNY Session: 2026-04-30**

Opening a conversation (Vport Vox or personal chat) did not clear the unread badge on the
bottom nav. Two engine-level break points were identified and fixed.

---

## Break Point 1 — Early Return Skips Unread Reset

**File:** `engines/chat/src/controller/markConversationRead.controller.js`  
**Location:** Line 32 (pre-fix)

**Root cause:**
When `member.last_read_message_id === lastMessage.id`, the controller returned early without
calling `dalResetInboxUnreadCount`. The read pointer being current is not a guarantee that
`unread_count` is 0 — the `chat.send_message_atomic` RPC fan-out can leave `unread_count`
elevated even when the read pointer is already at the latest message.

**Fix:**
`dalResetInboxUnreadCount` is now called in all code paths, including the early-return path
where the read pointer is already current.

```js
if (member.last_read_message_id === lastMessage.id) {
  // Read pointer is current, but unread_count may still be > 0 due to data
  // inconsistency or RPC fan-out timing. Always reset to guarantee badge clears.
  await dalResetInboxUnreadCount({ conversationId, actorId })
  return {
    success: true,
    lastReadMessageId: lastMessage.id,
  }
}
```

---

## Break Point 2 — Silent RLS Failure Not Detectable

**File:** `engines/chat/src/dal/conversationRead.write.dal.js`  
**Function:** `dalResetInboxUnreadCount`

**Root cause:**
Supabase returns `{ error: null, data: null }` when an RLS policy blocks an UPDATE — 0 rows
affected, no error thrown. The original DAL only checked `{ error }` and always reported
success even when the RLS policy silently rejected the write. This masked the RLS persona
mismatch described below.

**Fix:**
Added `.select('actor_id')` to the UPDATE call so Supabase returns the affected rows.
`data.length` is checked — if 0 rows were updated, a DEV-only console.warn is emitted.
Return value changed from `true` to `{ success: boolean, rowsAffected: number }`.

```js
const { data, error } = await supabase
  .schema("chat")
  .from("inbox_entries")
  .update({ unread_count: 0 })
  .eq("conversation_id", conversationId)
  .eq("actor_id", actorId)
  .select("actor_id");

if (error) throw error;

const rowsAffected = Array.isArray(data) ? data.length : 0;

if (rowsAffected === 0 && import.meta.env.DEV) {
  console.warn(
    "[dalResetInboxUnreadCount] 0 rows updated — RLS may be blocking this actor.\n" +
    `  actorId:        ${actorId}\n` +
    `  conversationId: ${conversationId}\n` +
    "  Run SQL check: SELECT chat.current_actor_id(); — compare to actorId above."
  );
  return { success: false, rowsAffected: 0 };
}

return { success: true, rowsAffected };
```

**Production safety:** The `console.warn` is gated by `import.meta.env.DEV` — it never runs
in production builds.

**Backward compatibility:** All three call sites in `markConversationRead.controller.js`
use `await` without capturing the return value — the return type change is non-breaking.

---

## RLS Root Cause (App-Layer, Not Engine)

The primary cause of the bug was a Wentrex-era RLS policy on `chat.inbox_entries` that
used `actor_id = chat.current_actor_id()`. The function `chat.current_actor_id()` delegates
to `learning.current_actor_id()` which returns `ORDER BY actor_id LIMIT 1` from
`vc.actor_owners` — always the alphabetically-first actor UUID for the user, regardless of
active persona.

For VCSM users with both a personal actor and a Vport, any UPDATE attempted by the "other"
actor was silently blocked by RLS. The engine DAL received `{error: null, data: null}` and
had no way to detect the failure.

This was fixed by a VCSM-scoped RLS migration (not an engine change):
`apps/VCSM/supabase/migrations/20260430200000_fix_chat_rls_multi_actor.sql`

The engine itself is not responsible for RLS policy correctness. The DAL diagnostic added
in this version allows future RLS issues to be detected immediately in development.

---

## Engine Root

`engines/chat/src/`

---

## Purpose

App-agnostic chat domain engine. Manages conversation lifecycle, message send/edit/delete,
read receipts, inbox projections, moderation, typing presence, reactions, and pins.

---

## Scope

In scope for this audit version:
- `markConversationRead.controller.js` — mark-read orchestration
- `conversationRead.write.dal.js` — inbox unread reset and read pointer update

Out of scope (unchanged since V2):
- Message send flow
- Hook layer (`useConversationMessages`, `markFailed`, `retryMessage`)
- Media attachment flow
- Realtime / typing presence
- Moderation

---

## Entry Points (mark-read path)

```text
markConversationRead({ actorId, conversationId })
  engines/chat/src/controller/markConversationRead.controller.js

dalUpdateConversationMemberReadPointer({ conversationId, actorId, lastReadMessageId, lastReadAt })
  engines/chat/src/dal/conversationRead.write.dal.js

dalResetInboxUnreadCount({ conversationId, actorId })
  engines/chat/src/dal/conversationRead.write.dal.js
```

---

## Data Flow (mark-read)

```text
markConversationRead({ actorId, conversationId })
  → dalReadConversationMemberForReadState()
      → chat.conversation_members WHERE actor_id + conversation_id
  → dalReadLatestVisibleMessageInConversation()
      → chat.messages (latest visible)
  → if no lastMessage:
      → dalResetInboxUnreadCount()
      → return
  → if last_read_message_id === lastMessage.id:
      → dalResetInboxUnreadCount()    ← ALWAYS runs (V3 fix)
      → return
  → dalUpdateConversationMemberReadPointer()
      → UPDATE chat.conversation_members SET last_read_message_id, last_read_at
  → dalResetInboxUnreadCount()
      → UPDATE chat.inbox_entries SET unread_count = 0
      → .select('actor_id')           ← V3 addition for 0-rows detection
  → publishDomainEvent(CONVERSATION_READ)
```

---

## Source of Truth

| Data | Table | Column |
|---|---|---|
| Read pointer | `chat.conversation_members` | `last_read_message_id`, `last_read_at` |
| Unread count | `chat.inbox_entries` | `unread_count` |

---

## Dependencies

- `engines/chat/src/config.js` — `getSupabaseClient()`
- `engines/chat/src/events.js` — `EVENTS.CONVERSATION_READ`
- `engines/chat/src/services/domainEventService.js` — `publishDomainEvent`
- Supabase client (injected by app via `configureChatEngine()`)

---

## File Map (changed files only)

| File | Change |
|---|---|
| `engines/chat/src/controller/markConversationRead.controller.js` | Added `dalResetInboxUnreadCount` call in early-return branch (line 35) |
| `engines/chat/src/dal/conversationRead.write.dal.js` | Added `.select('actor_id')`, 0-rows detection, DEV-only console.warn, structured return value `{ success, rowsAffected }` |

---

## Changes Since V2

V2 (2026-04-19) covered only hook layer additions: `markFailed`, `retryMessage`,
`prebuiltClientId`. No write DAL or controller changes were made in V2.

V3 changes:

1. `markConversationRead.controller.js` — `dalResetInboxUnreadCount` is now called in all
   branches including the early-return path where `last_read_message_id === lastMessage.id`.

2. `conversationRead.write.dal.js` — `dalResetInboxUnreadCount` now uses `.select('actor_id')`
   to detect 0-rows-affected scenarios that would previously be silently swallowed. DEV-only
   warning added. Return type changed from `true` to `{ success, rowsAffected }`.

No other engine files were modified. No schema changes to engine-owned tables.

---

## Debug Notes

If `dalResetInboxUnreadCount` emits the 0-rows warning in development:

1. Run `SELECT chat.current_actor_id();` in Supabase SQL Editor (as the affected user)
2. Compare the returned UUID against the `actorId` logged in the warning
3. If they differ, the old `actor_id = chat.current_actor_id()` RLS policy is blocking
4. Verify the VCSM RLS migration `20260430200000_fix_chat_rls_multi_actor.sql` is applied

The engine DAL surfaces the diagnostic. The fix lives in the VCSM migration layer, not the engine.

---

## Verification Notes

- Early-return path confirmed calls `dalResetInboxUnreadCount` before `return`
- `.select('actor_id')` confirmed on UPDATE call in `dalResetInboxUnreadCount`
- `import.meta.env.DEV` guard confirmed — console.warn is dev-only
- Return type `{ success, rowsAffected }` confirmed — all 3 call sites use `await` without capturing return value
- No engine files outside `markConversationRead.controller.js` and `conversationRead.write.dal.js` were modified
