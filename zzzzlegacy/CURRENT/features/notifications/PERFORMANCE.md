# notifications — PERFORMANCE.md

**Source audit:** `_ACTIVE/audits/performance/2026-05-19_kraven_notifications-dal.md`
**KRAVEN audit date:** 2026-05-19
**Runtime criticality:** Notification-critical (publish, inbox load, badge polling)
**LOKI evidence status:** PARTIAL — static analysis only; live browser DevTools timing not measured

---

## Runtime Criticality

| Area | Criticality |
|---|---|
| `publishEvent()` write path | Notification-critical — all notification triggers across app funnel through this path |
| `getInboxNotifications()` read path | Notification-critical — primary inbox load, bottom-nav tab |
| `resolveSenders()` waterfall | Notification-critical — executes on every inbox load; worst case 4 DB round trips |
| `countUnread()` badge polling | Notification-critical — polled every 60s while app is open |
| `loadBlockSets()` block filter | Notification-critical — 2 parallel queries on every inbox load |

---

## Query Amplification

| Runtime Path | Primary Records | DB Operations | Amplification | Severity |
|---|---:|---:|---:|---|
| Inbox read (warm hydration cache) | 20 notifications | 6 (4 read + 1 markSeen + 2 blocks) | 0.3 | HEALTHY |
| Inbox read (cold hydration cache) | 20 notifications | 9 (4 read + 1 markSeen + 2 blocks + 3 sender fallback) | 0.45 | HEALTHY |
| `publishEvent()` — 1 recipient | 1 notification | 5 (event + recipients + rendered + inbox + status) | 5.0 | ELEVATED |
| `publishEvent()` — 10 recipients | 10 notifications | 32 (2 fixed + 3×10 serial) | 3.2 | ELEVATED |
| `publishEvent()` — 50 recipients | 50 notifications | 152 (2 fixed + 3×50 serial) | 3.04 | ELEVATED — 152 serial ops |
| `countUnread()` — cache miss | 1 badge count | 2 | 2.0 | HEALTHY |
| `countUnread()` — cache hit (5s TTL) | 1 badge count | 0 | 0 | HEALTHY |

---

## Waterfall Detection

| Chain | Serial Operations | Estimated Delay | Optimization |
|---|:---:|:---:|---|
| `publishEvent()` delivery loop | 3 serial awaits × N recipients | O(N × 3 × RTT) — ~150ms+ for 10 recipients at 5ms/RTT | Parallelize with `Promise.allSettled` across recipients |
| `getInboxNotifications()` read lead | 1 serial before 3 parallel | ~1 RTT | Unavoidable — recipient IDs required for subsequent queries |
| `getInboxNotifications()` autoMarkSeen | 1 serial write after 3 parallel reads | ~1 RTT | Fire-and-forget acceptable; already non-blocking for data return |
| `resolveSenders()` — cold cache | 3 serial tiers | ~3 RTTs worst case | Warm hydration cache eliminates tiers 1–2; tier 3 is internally parallel |

---

## Open Performance Findings

### OPEN — KF-1 (KRAVEN + LOKI confirmed)
**`publishEvent()` serial per-recipient delivery loop**

The engine's `publishEvent()` iterates recipients serially:
```
for (const recipient of recipientRows) {
  await upsertNotificationRenderedDAL(...)
  await insertNotificationInboxItemDAL(...)
  await updateNotificationRecipientStatusDAL(...)
}
```
This is an N+1 pattern on the write path. For 50 recipients: 152 serial DB ops.

Recommended fix: parallelize across recipients using `Promise.allSettled`. This is an engine-layer change (not feature-layer).

---

## Patterns Summary (KRAVEN)

| Pattern | Status |
|---|---|
| Duplicate reads | NONE detected on inbox read path — all queries batched by IDs |
| N+1 on inbox read | NONE |
| N+1 on publish write | EXISTS — per-recipient serial loop (KF-1) |
| Cache miss — badge | `countUnread()` has 5s in-memory cache — GOOD |
| Cache miss — post grid | N/A (not a profiles concern here) |
| Payload size | LOW — bounded inbox payload; explicit column selects throughout |
| Hydration join cost | LOW — `mapNotificationInboxRows` joins 4 result sets in memory; not expensive |
