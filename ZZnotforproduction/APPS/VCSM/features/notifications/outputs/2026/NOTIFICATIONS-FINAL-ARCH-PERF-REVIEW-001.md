# NOTIFICATIONS-FINAL-ARCH-PERF-REVIEW-001
# VCSM Notifications — Final Architecture & Performance Review
# Date: 2026-06-07
# Scope: Post-NOTI-SEC-002 audit — five phases, read-only

---

## Phase 1 — NOTI-SEC-002 Call Path Verification

### Implementation Confirmed (runtime/index.js:266-303)

```js
export async function markRead({ recipientId, actorId } = {}) {
  if (!recipientId || !actorId) return null
  if (!(await verifyRecipientOwnership(recipientId, actorId))) return null
  const data = await markNotificationReadDAL({ recipientId, now: new Date().toISOString() })
  invalidateCountUnreadCache()
  return data ?? null
}

export async function dismiss({ recipientId, actorId } = {}) {
  if (!recipientId || !actorId) return null
  if (!(await verifyRecipientOwnership(recipientId, actorId))) return null
  const data = await dismissNotificationDAL({ recipientId, now: new Date().toISOString() })
  invalidateCountUnreadCache()
  return data ?? null
}

export async function archive({ recipientId, actorId } = {}) {
  if (!recipientId || !actorId) return null
  if (!(await verifyRecipientOwnership(recipientId, actorId))) return null
  const data = await archiveNotificationDAL({ recipientId, now: new Date().toISOString() })
  invalidateCountUnreadCache()
  return data ?? null
}
```

`verifyRecipientOwnership` (inbox/lib/verifyRecipientOwnership.js:16-29): queries
`notification.recipients WHERE id = recipientId AND recipient_actor_id = actorId` via
`.maybeSingle()`. Returns `false` on error. Returns `!!data` — true only on exact match.

### Caller Inventory

Grep evidence for external callers of notification `markRead`, `dismiss`, `archive`:

| Symbol | File | Notes |
|---|---|---|
| `markRead` | `chat/inbox/screens/InboxScreen.jsx:44` | CHAT feature's `useMarkChatRead` — unrelated |
| `markRead` | `chat/conversation/screen/ConversationView.jsx:86` | CHAT — unrelated |
| `markRead` | `wanders/core/hooks/useWandersMailboxExperience.hook.js:69` | Wanders mailbox — unrelated |
| `markRead` from `@notifications` | `dev/diagnostics/groups/notificationsFeature.group.js:23,184` | ONLY notification markRead external caller |

Diagnostics call (line 184): `await markRead({ recipientId: context.actorId })` — passes `actorId`
value in `recipientId` field, missing `actorId` param entirely. After NOTI-SEC-002: returns `null`
immediately at the `if (!recipientId || !actorId) return null` guard. No mutation occurs.
Bug pre-existed; it was already a silent no-op due to ID space mismatch (UUID vs actor UUID
are the same type but semantically wrong). **NOTI-CLEANUP-003** covers this fix.

No production UI caller for `markRead`, `dismiss`, or `archive` from the notifications runtime.

### markSeen Verification

`markSeen` unchanged. Called exclusively from `getInboxNotifications` when `autoMarkSeen: true`
(runtime/index.js:209-218). The `unseenRecipientIds` array is built from:

```js
const unseenRecipientIds = notifications
  .filter((row) => !row.isSeen)
  .map((row) => row.recipientId)
```

`notifications` is built from `recipientRows` returned by `readNotificationRecipientRowsDAL`
which scopes by `.eq('recipient_actor_id', recipientActorId)` with `.limit(limit)`.
IDs are fully actor-scoped. No arbitrary ID injection possible on this path.

### Security Verdict

| Function | Production Caller | Arbitrary recipientId Risk | Defense Layer Active |
|---|---|---|---|
| `markRead` | None (diagnostics only, broken) | NONE — requires actorId + ownership check | App: verifyRecipientOwnership. DB: RLS UPDATE policy |
| `dismiss` | None | NONE | Same |
| `archive` | None | NONE | Same |
| `markSeen` | getInboxNotifications (autoMarkSeen) | NONE — IDs from actor-scoped fetch | N/A — no ownership check needed |

NOTI-SEC-002: **COMPLETE. Defense-in-depth achieved. No exploit path exists today.**

---

## Phase 2 — NOTI-PERF-001 Query Chain Analysis

### Full Call Graph

```
Global badge (bootstrap.selectors.js:11,22)
  └── getNotificationUnreadCount(actorId)       [adapter export]
      └── hooks/useNotificationCount.js:32-36
          ├── [cache hit] deriveCountFromInboxCache(actorId) → 0 DB calls
          └── [cache miss] getUnreadNotificationCount(actorId)
                            [adapter export, notificationsCount.controller.js:4-10]
              └── countUnread({ recipientActorId: actorId })  [runtime/index.js:235]
                  ├── [5s in-memory cache hit] → 0 DB calls
                  └── [cache miss] countUnreadInner({ recipientActorId })
                      ├── DB Call 1: readNotificationRecipientIdsForUnreadDAL
                      │     SELECT id FROM notification.recipients
                      │     WHERE recipient_actor_id = ?
                      │       AND delivery_channel = 'in_app'
                      │       AND status = 'delivered'
                      │     -- NO LIMIT -- returns ALL matching rows
                      │     Index: expected idx on recipient_actor_id
                      │     Transfer: N rows × 16 bytes UUID per row
                      └── DB Call 2: countNotificationUnreadInboxItemsDAL
                            SELECT recipient_id [count:exact, head:true]
                            FROM notification.inbox_items
                            WHERE recipient_id IN (...N UUIDs...)
                              AND is_seen = false
                              AND is_dismissed = false
                              AND archived_at IS NULL
                            Transfer: count integer only (head:true — no rows)
```

Also: NotificationsHeader.controller.js:2,8 calls `countUnread` directly from `@notifications`
inside the feature — internal usage, not an adapter violation.

### Confirmed — No LIMIT on Call 1

`readNotificationRecipientIdsForUnreadDAL` (notificationRuntime.dal.js:204-226):
No `.limit()` call anywhere in the function. Contrast with `readNotificationRecipientRowsDAL`
(line 173) which correctly uses `.limit(limit)`. The count query fetches ALL delivered
in_app recipient IDs for the actor.

### Complexity

| Scenario | DB Round Trips | Rows Transferred (Call 1) | Rows Transferred (Call 2) |
|---|---|---|---|
| 5s in-memory cache hit | 0 | 0 | 0 |
| React Query cache + in-memory miss, 10 notifications | 2 | 10 × 16B = 160B | 0 (head:true) |
| 100 notifications | 2 | 100 × 16B = 1.6KB | 0 |
| 1000 notifications | 2 | 1000 × 16B = 16KB | 0 |
| 10,000 notifications | 2 | 10,000 × 16B = 160KB | 0 |

### Current Mitigations

1. 5s in-memory inflight dedup (`countInflight`) — concurrent calls share one pending promise
2. 5s TTL in-memory cache (`countCache`) — subsequent calls within 5s are free
3. React Query staleTime 60s for VPORT badges (`useVportNotificationBadges`) — 60s window
4. `bootstrap.selectors.js` uses `getNotificationUnreadCount` (cache-aware) — tries React Query
   inbox cache before hitting DB

### Fix Profile (NOTI-PERF-001)

Replace two-query pattern with a single COUNT JOIN:

```sql
SELECT COUNT(*)
FROM notification.recipients r
JOIN notification.inbox_items i ON i.recipient_id = r.id
WHERE r.recipient_actor_id = $1
  AND r.delivery_channel = 'in_app'
  AND r.status = 'delivered'
  AND i.is_seen = false
  AND i.is_dismissed = false
  AND i.archived_at IS NULL
```

Result: 1 DB call, 0 UUID row transfer, one indexed join. Requires a new DB function
(migration) and a DAL replacement. Shared cache logic (5s TTL, inflight dedup) remains.

**Impact at current scale:** Low-medium. Indexes make Call 1 fast; 5s + 60s caching
reduces actual poll frequency. At >500 notifications per actor the unbounded fetch
becomes meaningful. Highest priority DB performance ticket but not urgent.

---

## Phase 3 — NOTI-PERF-002 Badge Volume Calculation

### Call Path

`useVportNotificationBadges.js:22` → `getUnreadNotificationCount(v.actor_id)` per VPORT.
This is the DB-direct export (notificationsCount.controller.js), **not** the cache-aware
`getNotificationUnreadCount`. No React Query inbox cache check. Goes straight to countUnread.

React Query config: `staleTime: 60_000, gcTime: 300_000`. No `refetchInterval`.
Queries fire when cache is stale (>60s old) or absent. `useQueries` fires all N
concurrently on mount when stale.

The runtime's 5s in-memory cache (`countCache`) is keyed by actorId. Each VPORT is a
different actorId → each fires its own DB query concurrently. No cross-VPORT sharing.

### Volume Table

| VPORT Count | DB Calls (mount, stale cache) | DB Calls / minute (steady state) |
|---|---|---|
| 1 | 2 | ~2 per 60s poll cycle |
| 5 | 10 | ~10 |
| 10 | 20 | ~20 |
| 25 | 50 | ~50 |

Steady state = every 60s when component remounts or focus triggers stale check.

### Assessment

At current user scale, 50 DB calls per 60s for a 25-VPORT user is operationally
acceptable (~0.83 calls/sec). The 2-query pattern per badge means each is actually
2 DB round trips, but all complete in parallel. Total wall-clock per badge refresh:
max(RTT × 2) — not sum × N.

**NOTI-PERF-002 is lower priority than initially ranked.** A batch RPC would reduce
N round trips to 1 per poll cycle, but the current cadence (60s poll, no active interval)
makes the absolute savings small. Schedule after NOTI-PERF-001 eliminates the two-query
pattern that NOTI-PERF-002 multiplies.

---

## Phase 4 — NOTI-ARCH-002 Monitoring Gap Assessment

### Current State (publish.js:87-92, 141-143)

```js
// publishVcsmNotification catch (line 87-92):
} catch (err) {
  if (import.meta.env.DEV) {
    console.error('[publishVcsmNotification] failed:', err)
  }
  return false
}

// publishVcsmNotificationBatch catch (line 141-143):
} catch {
  return false
}
```

`captureVcsmError`: **ZERO usage in the entire notifications feature.** Confirmed by
grep of all `.js` / `.jsx` files under `apps/VCSM/src/features/notifications/`.

### Failure Signal Matrix

| Failure Point | DB Record Created? | DEV Log? | Sentry / captureVcsmError? |
|---|---|---|---|
| `publishVcsmNotification` → `create_event` RPC fails | NO | YES (DEV only) | NO |
| `publishVcsmNotification` → `insert_recipients` RPC fails | YES (event exists) | YES (DEV only) | NO |
| `publishVcsmNotification` → per-recipient delivery fails | YES (`status='failed'`) | NO (Promise.allSettled) | NO |
| `publishVcsmNotificationBatch` → any throw | NO (if `create_event` failed) | NO — EMPTY CATCH | NO |
| `publishEvent` → successful partial delivery | YES (delivered + failed per recipient) | NO | NO |

### Why DB Records Are Not Enough

- Failed DB records on `notification.recipients` only exist if `insertNotificationEventDAL`
  succeeded first. If `create_event` RPC errors → no event, no recipients, no record anywhere.
- `publishVcsmNotificationBatch` catch is completely empty. A full batch failure (network error,
  DB connection drop, RPC bug) produces zero signal at any level.
- Ops cannot detect publish failures in real-time from DB records alone — requires active query
  (`SELECT * FROM notification.recipients WHERE status = 'failed' ORDER BY created_at DESC`).
  No dashboard or alert is known to run this query.
- `captureVcsmError` provides real-time Sentry alerting. Its use in auth (4 controllers),
  upload (createPost), and moderation (report) confirms the pattern is established. Adding it
  to notifications publish paths is a 2-line change per catch block.

### Fix Profile (NOTI-ARCH-002)

Two catch blocks need `captureVcsmError`. Import it from the existing path used by other features.
Change confined to `publish.js` only. No engine change, no migration, no adapter change.

```js
// publishVcsmNotification:
} catch (err) {
  captureVcsmError(err, 'publishVcsmNotification')
  return false
}

// publishVcsmNotificationBatch:
} catch (err) {
  captureVcsmError(err, 'publishVcsmNotificationBatch')
  return false
}
```

The DEV-only `console.error` in the single variant can remain or be removed — `captureVcsmError`
handles production monitoring; the console log is noise-only in dev.

**Effort: S. Risk: None. Benefit: Real-time ops visibility for the only completely silent
failure path in the notifications feature.**

---

## Phase 5 — Final Priority Re-rank

### CLOSED

| Ticket | Decision |
|---|---|
| NOTI-SEC-001 | CLOSED — DB RLS `notification_inbox_items_update_own` confirmed with correct `vc.actor_owners` join on both QUAL and WITH_CHECK |
| NOTI-SEC-002 | DONE — `verifyRecipientOwnership` guard active in markRead / dismiss / archive |

### IMPLEMENT NEXT (high value, no migration required)

**NOTI-ARCH-002** — Add `captureVcsmError` to publish.js catch blocks
- Files: `publish.js` only
- Effort: S (2 lines per catch)
- Risk: None
- Dependency: None
- Value: Ops visibility for publish failures, especially the completely silent batch catch

### SCHEDULE WITH NEXT MIGRATION CYCLE (requires migration)

**NOTI-PERF-001** — Replace two-query countUnread with single COUNT JOIN
- Files: `notificationRuntime.dal.js` (replace two DAL functions with one), `runtime/index.js`
  (replace `countUnreadInner`), migration for new DB function `notification.count_unread_for_actor`
- Effort: M
- Risk: Low — cache layer (5s TTL, inflight dedup) remains unchanged
- Value: Eliminates O(N) UUID row transfer per badge poll

**NOTI-PERF-002** — Batch VPORT unread count RPC (deprecates N parallel queries)
- Files: `useVportNotificationBadges.js`, migration for batch count RPC, adapter change
- Effort: M
- Risk: Low
- Dependency: Author alongside NOTI-PERF-001 (same migration)
- Value: Reduces N×2 DB calls to 1 per VPORT switcher stale mount
- Note: Lower urgency than originally assessed — 60s poll + no active interval makes
  absolute savings small at current user scale

### ARCHITECTURE CLEANUP (schedule at will, no migration)

| Ticket | What | Effort |
|---|---|---|
| NOTI-ARCH-001 | Remove direct identity DAL import from `resolveVportOwnerActor.controller.js` | M |
| NOTI-ARCH-003 | Rename `getUnreadNotificationCount` / `getNotificationUnreadCount` (one word order apart) | S |
| NOTI-ARCH-004 | Move `hooks/useNotificationCount.js` to controller layer (not a hook, never was) | S |
| NOTI-ARCH-005 | Fix `@booking` alias import in `useMyAppointments.js` — use booking adapter | S |

### CLEANUP (schedule freely)

| Ticket | What | Risk |
|---|---|---|
| NOTI-CLEANUP-001 | Remove `inbox/hooks/useNotifications.js` (4-line alias, no external consumers) | None |
| NOTI-CLEANUP-002 | Remove `listActorPresentationRowsByIdsDAL` duplicate in `senders.read.dal.js` | Low |
| NOTI-CLEANUP-003 | Fix diagnostics test `insert_and_mark_read` — passes actorId in recipientId field | None |

---

## Additional Finding — NotificationsHeader.controller.js

Not previously ticketed. `inbox/controller/NotificationsHeader.controller.js:2` imports
`countUnread` and `getInboxNotifications` directly from `@notifications` (the runtime alias).
This is internal to the notifications feature folder, so it is not an adapter boundary
violation per se. However, it bypasses the controller layer that wraps `countUnread`
(`notificationsCount.controller.js`). The consequence is that `NotificationsHeader` uses
raw `countUnread` without the runtime cache-warm path that `getNotificationUnreadCount`
provides. Low priority but worth noting if the header ever becomes a hot-path query.

---

## Open Ticket Summary

| Ticket | Type | Effort | Requires Migration | Priority |
|---|---|---|---|---|
| NOTI-ARCH-002 | Monitoring | S | No | Next |
| NOTI-PERF-001 | Performance | M | Yes | High |
| NOTI-PERF-002 | Performance | M | Yes | Medium |
| NOTI-ARCH-001 | Architecture | M | No | Medium |
| NOTI-ARCH-003 | Cleanup | S | No | Low |
| NOTI-ARCH-004 | Cleanup | S | No | Low |
| NOTI-ARCH-005 | Cleanup | S | No | Low |
| NOTI-CLEANUP-001 | Cleanup | S | No | Low |
| NOTI-CLEANUP-002 | Cleanup | S | No | Low |
| NOTI-CLEANUP-003 | Fix | S | No | Low |

---

*Report written: NOTIFICATIONS-FINAL-ARCH-PERF-REVIEW-001 — 2026-06-07*
