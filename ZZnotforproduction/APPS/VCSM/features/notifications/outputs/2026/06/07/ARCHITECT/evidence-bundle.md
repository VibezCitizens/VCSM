# ARCHITECT Evidence Bundle — notifications
Generated: 2026-06-07T08:45:00
Scope: VCSM:notifications
Command: ARCHITECT V2
Scanner Version: 1.1.0

---

## Source Files Read

| File | Layer | Lines |
|---|---|---|
| apps/VCSM/src/features/notifications/publish.js | service/adapter | 1-154 |
| apps/VCSM/src/features/notifications/inbox/lib/verifyRecipientOwnership.js | service | 1-29 |

---

## Layer Counts (from callgraph)

| Layer | Count |
|---|---|
| controller | 8 |
| dal | 25 |
| hook | 7 |
| model | 4 |
| screen | 39 |
| barrel | 3 |
| module | 26 |
| component | 1 |
| **Total** | **113** |

---

## Call Chains

### CHAIN-noti-001: Publish Notification (from any caller)
```
publishVcsmNotification({recipientActorId, actorId, kind, ...}) → {
  if (!recipientActorId || !kind) return false [guard]
  if (actorId === recipientActorId) return false [self-notify skip]
  supabase.auth.getSession() [SESSION GUARD — return false if no session]
  publishEvent({...}) [notification engine]
}
```
Session guard: PRESENT [SOURCE_VERIFIED — TICKET-ARCH-NOTI-SESSION-001 DONE]
Confidence: HIGH [SOURCE_VERIFIED]

### CHAIN-noti-002: Inbox Ownership Verification
```
verifyRecipientOwnership(recipientId, actorId) → {
  if (!recipientId || !actorId) return false [null guard]
  supabase.schema('notification').from('recipients')
    .select('id')
    .eq('id', recipientId)
    .eq('recipient_actor_id', actorId)
    .maybeSingle()
  return !!data [only true if both fields match]
}
```
Ownership checked: YES (double-column match)
Confidence: HIGH [SOURCE_VERIFIED]

### CHAIN-noti-003: createEvent RPC
```
publish.js → publishEvent (engine) → notificationRuntime.dal.js → rpc("create_event", {
  sourceActorId, eventKey, objectType, objectId, recipientActorId, ...
})
```
Source actor bound by: session guard in publish.js (app layer)
DB RPC: DB BEFORE INSERT trigger enforces source_actor_id ownership via vc.actor_owners
(TICKET-ARCH-NOTI-SESSION-001 DONE)

---

## Security-Sensitive Surfaces

| Surface | File | Risk | Priority |
|---|---|---|---|
| publishVcsmNotification | notifications/publish.js | Session guard required before publish | CRITICAL |
| publishVcsmNotificationBatch | notifications/publish.js | Same session guard | CRITICAL |
| verifyRecipientOwnership | inbox/lib/verifyRecipientOwnership.js | Inbox mutation gate | HIGH |
| create_event RPC | notificationRuntime.dal.js | sourceActorId injection | HIGH |
| update_recipient_status RPC | notificationRuntime.dal.js | Recipient must match caller | HIGH |

---

## Database Writes (5 RPCs + 4 UPDATEs)

| DAL | Operation | Table/RPC | Ownership Check |
|---|---|---|---|
| notificationRuntime.dal.js | RPC | create_event | SESSION GUARD + DB trigger ✅ |
| notificationRuntime.dal.js | RPC | insert_inbox_item | Engine-managed |
| notificationRuntime.dal.js | RPC | insert_recipients | Engine-managed |
| notificationRuntime.dal.js | RPC | update_recipient_status | verifyRecipientOwnership gate |
| notificationRuntime.dal.js | RPC | upsert_rendered | Engine-managed |
| notificationRuntime.dal.js | UPDATE | notification.inbox_items | verifyRecipientOwnership gate |

---

## DB Audit Note
- DB BEFORE INSERT trigger on notification.events: DEPLOYED per TICKET-ARCH-NOTI-SESSION-001
- Trigger enforces: source_actor_id must match auth.uid() via vc.actor_owners

---

## Provenance
- Source maps consumed: rpc-map, write-surface-map, callgraph
- Source files validated: 2
- Confidence: HIGH
