# Chat Engine Architecture Audit — V2

Audited: 2026-04-19
Scope: engines/chat/src/ — hook layer changes for chat UX upgrade
Prior version: CHAT_ENGINE_AUDIT_V1.md (V1, 2026-03-31)

---

## Related Logan Docs

Canonical System Doc:
zNOTFORPRODUCTION/logan/vcsm/chat/vcsm.chat.runtime-pipeline.md

Supporting Docs:
zNOTFORPRODUCTION/logan/vcsm/chat/vcsm.chat.message-flow-audit.md
zNOTFORPRODUCTION/logan/vcsm/chat/vcsm.chat.badge-pipeline.md

---

## Changes Since V1

### Hook Layer — useConversationMessages.js

Three new capabilities added to the hook:

**1. `markFailed(clientId)`**

Transitions a pending optimistic message to `__failed: true` instead of removing it.
Called on the error path of `onSendMessage` instead of `removeOptimistic`.
Messages in failed state remain visible at 80% opacity with a retry affordance.

```js
const markFailed = useCallback((clientId) => {
  setMessages((prev) =>
    prev.map((m) =>
      m.id === clientId || m.clientId === clientId
        ? { ...m, __optimistic: false, __failed: true }
        : m
    )
  )
}, [])
```

**2. `retryMessage(clientId)`**

Re-submits a failed message using the same `clientId` for idempotency.
Resets the message to `__optimistic: true` before re-sending.
Calls `sendMessageController` with the original body, mediaUrl, and kind.
On second failure, `markFailed` is called again — no infinite retry loop.

```js
const retryMessage = useCallback(async (clientId) => {
  const msg = messages.find((m) => m.id === clientId || m.clientId === clientId)
  if (!msg) return { ok: false, error: 'Message not found.' }
  // reset to pending
  setMessages((prev) => prev.map((m) =>
    m.id === clientId || m.clientId === clientId
      ? { ...m, __optimistic: true, __failed: false }
      : m
  ))
  try {
    const { message } = await sendMessageController({ ..., clientId: msg.clientId })
    replaceOptimistic(msg.clientId, message)
    return { ok: true, message }
  } catch (err) {
    markFailed(msg.clientId)
    return { ok: false, error: err?.message || 'Failed to send message.' }
  }
}, [messages, conversationId, actorId, replaceOptimistic, markFailed])
```

**3. `prebuiltClientId` param on `addOptimistic`**

`addOptimistic` now accepts an optional `prebuiltClientId`.
When provided, uses that ID as the message's `clientId` instead of generating a new `uuid`.
This allows the media upload flow to pre-insert an `__uploading` placeholder, then hand
the same `clientId` to `onSendMessage` — the placeholder transitions to the real message
without a visual gap or duplicate entry.

---

## Updated State Flags

The message domain model now supports three transient UI flags:

| Flag | Meaning | Visual |
|------|---------|--------|
| `__optimistic: true` | Send in flight | 65% opacity, "Sending…" label |
| `__uploading: true` | Media upload in flight | 144×144 gray placeholder |
| `__failed: true` | Send or upload failed | 80% opacity, "Failed · Retry" button |

All three flags are ephemeral — they live in local hook state only and are never persisted to the database.

---

## Architecture Status (unchanged from V1)

All V1 findings remain accurate. This audit covers only the hook layer additions.

For the full schema coupling analysis, VC/Wentrex isolation assessment, broken column
references, and P0/P1/P2 cleanup backlog, see CHAT_ENGINE_AUDIT_V1.md (V1).

---

## File Map (changed files only)

| File | Change |
|------|--------|
| `engines/chat/src/hooks/useConversationMessages.js` | Added `markFailed`, `retryMessage`, `prebuiltClientId` support; error path now calls `markFailed` instead of `removeOptimistic` |

---

## Verification Notes

- `markFailed` / `retryMessage` / `prebuiltClientId` confirmed implemented in hook
- Error path in `onSendMessage` confirmed updated to call `markFailed`
- `addOptimistic` return value confirmed to be the generated/prebuilt `clientId`
- `retryMessage` uses same `clientId` — idempotent at `chat.send_message_atomic` RPC level
