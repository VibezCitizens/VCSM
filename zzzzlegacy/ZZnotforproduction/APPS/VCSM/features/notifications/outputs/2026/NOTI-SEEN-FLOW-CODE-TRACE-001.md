# NOTI-SEEN-FLOW-CODE-TRACE-001
# Notifications — Seen Flow Code Trace
# Date: 2026-06-07
# Scope: apps/VCSM/src/features/notifications — read-only

---

## Full Call Chain: NotificationsScreen → DAL

```
NotificationsScreen.jsx:4
  → <NotificationsScreenView />

NotificationsScreenView.jsx:33
  const listState = useNotifications()

inbox/hooks/useNotifications.js:4
  return useNotificationInbox()

inbox/hooks/useNotificationInbox.js:17-36
  useQuery({
    queryKey: queryKeys.notificationsInbox(actorId),   // ['notifications','inbox',actorId]
    queryFn:  () => getNotifications(identity, { listIncomingRequests }),
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  })

inbox/controller/Notifications.controller.js:63-118
  getNotifications(identity, { listIncomingRequests })
    → resolveInboxActor(identity)  → targetActorId
    → getInboxNotifications({
        recipientActorId: targetActorId,
        limit: 20,
        autoMarkSeen: true,          ← always true on this path
      })

runtime/index.js:168-221
  getInboxNotifications({ recipientActorId, limit, autoMarkSeen })

    STEP A — paginated recipient fetch
    readNotificationRecipientRowsDAL({ recipientActorId, limit: 21 })
      SELECT id, event_id, ... FROM notification.recipients
      WHERE recipient_actor_id = ?
        AND delivery_channel = 'in_app'
        AND status = 'delivered'
      ORDER BY created_at DESC LIMIT 21

    STEP B — parallel hydration (3 queries in Promise.all)
    readNotificationEventsByIdsDAL(eventIds)
    readNotificationRenderedByRecipientIdsDAL(recipientIds)
    readNotificationInboxRowsByRecipientIdsDAL(recipientIds)
      ← inbox_items rows contain: is_seen, is_read, is_dismissed, archived_at

    STEP C — domain mapping
    mapNotificationInboxRows({ recipientRows, events, renderedRows, inboxRows })
      → each notification object gets:
          isSeen: inbox?.is_seen ?? false     ← DB state AT FETCH TIME
          isRead: inbox?.is_read ?? false     ← DB state AT FETCH TIME
      → returned as `notifications` array

    STEP D — autoMarkSeen (runtime/index.js:209-218)
    if (autoMarkSeen) {
      const unseenRecipientIds = notifications
        .filter((row) => !row.isSeen)      ← reads isSeen from STEP C objects
        .map((row) => row.recipientId)

      if (unseenRecipientIds.length) {
        await markRecipientIdsSeen(unseenRecipientIds)
        invalidateCountUnreadCache(recipientActorId)
      }
    }

    STEP E — markRecipientIdsSeen (runtime/index.js:108-113)
    markRecipientIdsSeen(recipientIds)
      → markNotificationRecipientsSeenDAL(recipientIds, now)

    notificationRuntime.dal.js:189-202
    markNotificationRecipientsSeenDAL(recipientIds, now)
      UPDATE notification.inbox_items
      SET is_seen = true, seen_at = now, updated_at = now
      WHERE recipient_id IN (...unseenRecipientIds...)
        AND is_seen = false

    STEP F — return (runtime/index.js:220)
    return { notifications, hasMore }
    ← notifications still carry isSeen=false from STEP C
    ← DB now has is_seen=true for those rows
    ← STALE isSeen in the returned objects

  ↑ back in getNotifications: block filtering, sender resolution, mapNotification
  ↑ returns to useNotificationInbox queryFn
  ← React Query stores result with isSeen=false, isRead=false on newly-seen items

STEP G — post-fetch invalidation
useNotificationInbox.js:82-91 (useEffect on query.dataUpdatedAt)
  queryClient.invalidateQueries({ queryKey: queryKeys.notificationUnread(actorId) })
  ← triggers badge refetch

STEP H — badge refetch
bootstrap.selectors.js:18-28
  useNotificationUnread()
    queryFn: () => getNotificationUnreadCount(actorId)  (adapter export)

hooks/useNotificationCount.js:32-37
  getNotificationUnreadCount(actorId)
    → deriveCountFromInboxCache(actorId)     ← first attempt

hooks/useNotificationCount.js:13-29
  deriveCountFromInboxCache(actorId)
    state = queryClient.getQueryState(queryKeys.notificationsInbox(actorId))
    if (!state?.dataUpdatedAt)                     → null
    if (Date.now() - state.dataUpdatedAt > 60_000) → null (staleness check)

    const cached = state.data  ← the just-fetched rows (from STEP F)
    if (!cached.length) return 0

    const unreadCount = cached.filter((row) => !row.isRead).length
    ← *** USES isRead, NOT isSeen ***
    ← markSeen only set is_seen=true, never touched is_read
    ← all newly-seen items still have isRead=false in the cache

    if (unreadCount === cached.length) return null  ← fall-through guard
    return unreadCount                               ← returned when count < total

STEP I — cache-aware path short-circuits (the bug)
  If unreadCount < cached.length:
    ← some rows are isRead=true (previously explicitly read)
    ← some rows are isRead=false (all newer ones, including those just marked seen)
    → deriveCountFromInboxCache returns isRead-based count (wrong, stale)
    → DB is NOT queried
    → badge shows stale "N unread" even though DB has is_seen=true for all

  If unreadCount === cached.length:
    ← all visible rows have isRead=false (no one has explicitly marked any read)
    → returns null
    → getUnreadNotificationCount falls through to getUnreadNotificationCount(actorId)
    → countUnread → countUnreadForActorDAL → DB returns 0 ✓
    → badge correctly drops to 0 in this case only
```

---

## Questions Answered

### 1. Where is autoMarkSeen passed?

**Two places:**

| File | Line | Value | Triggered by |
|---|---|---|---|
| `inbox/controller/Notifications.controller.js` | 78 | `true` | Every inbox screen open (via `useNotificationInbox` → `getNotifications`) |
| `inbox/controller/NotificationsHeader.controller.js` | 23 | `true` | User clicks "Mark All Read" button (`markAllNotificationsSeen`) |

---

### 2. Is autoMarkSeen true on the Notifications screen?

**YES — unconditionally.** `Notifications.controller.js:75-79`:
```js
const { notifications: raw } = await getInboxNotifications({
  recipientActorId: targetActorId,
  limit: 20,
  autoMarkSeen: true,   // hardcoded, always true
})
```

Every time the query runs (mount + 60s refetchInterval) it calls `getInboxNotifications` with
`autoMarkSeen: true`. There is no opt-out or condition.

---

### 3. Does getInboxNotifications actually call markSeen?

**YES, conditionally on there being unseen items.** `runtime/index.js:209-218`:
```js
if (autoMarkSeen) {
  const unseenRecipientIds = notifications
    .filter((row) => !row.isSeen)
    .map((row) => row.recipientId)

  if (unseenRecipientIds.length) {
    await markRecipientIdsSeen(unseenRecipientIds)
    invalidateCountUnreadCache(recipientActorId)
  }
}
```

`markRecipientIdsSeen` calls `markNotificationRecipientsSeenDAL` (DAL:189-202).
The call is awaited — the function does not return until the DB write completes.

---

### 4. Does markSeen update is_seen or is_read?

**Only `is_seen`.** `notificationRuntime.dal.js:189-202`:
```js
.update({ is_seen: true, seen_at: now, updated_at: now })
.in('recipient_id', recipientIds)
.eq('is_seen', false)
```

`is_read` is **never touched** by `markSeen` or `markNotificationRecipientsSeenDAL`.

`is_read` is only set by `markNotificationReadDAL` (DAL:244-263):
```js
.update({ is_read: true, read_at: now, is_seen: true, seen_at: now, updated_at: now })
```

which is called from `markRead(...)` — currently has no production UI caller.

---

### 5. After markSeen, is notificationUnread query invalidated?

**YES — in two ways, but both are insufficient alone:**

**A. Runtime in-memory cache cleared (runtime/index.js:216):**
```js
invalidateCountUnreadCache(recipientActorId)
```
Clears the 5s TTL in-memory `countCache` Map. Next call to `countUnread` will hit DB.

**B. React Query cache invalidated (useNotificationInbox.js:84):**
```js
// useEffect on query.dataUpdatedAt
queryClient.invalidateQueries({ queryKey: queryKeys.notificationUnread(actorId) })
```
Fires after every successful inbox fetch. Causes `useNotificationUnread` to refetch
`getNotificationUnreadCount`. This IS the right signal.

**What is NOT invalidated:** `queryKeys.notificationsInbox(actorId)`. The inbox query
cache stays live with the stale `isSeen=false, isRead=false` values until the next
60s refetchInterval or a manual `invalidateNotificationQueries()` call.

---

### 6. Does the UI badge count is_seen=false or is_read=false?

**`isRead=false` (wrong field).** `hooks/useNotificationCount.js:23`:
```js
const unreadCount = cached.filter((row) => !row.isRead).length
```

The DB function `count_unread_for_actor` uses:
```sql
AND i.is_seen = false
```

**This is the core field mismatch:**

| Layer | Field used | Set by |
|---|---|---|
| DB count (`count_unread_for_actor`) | `is_seen = false` | `markSeen` / `autoMarkSeen` |
| Cache-aware badge path | `!row.isRead` | `markRead` only — no UI calls it |

`markSeen` sets `is_seen=true` but never `is_read`. The cache-aware path reads `isRead`,
which is never cleared by opening the screen. The two layers measure different things.

---

### 7. Does the inbox list keep seen notifications visible by design?

**YES — by design.** `inbox/ui/Notifications.view.jsx:46-51`:
```jsx
<ul className="notifications-list">
  {rows.map((n) => (
    <NotificationItem key={n.id} notification={n} />
  ))}
</ul>
```

No filtering on `isSeen` or `isRead`. All 20 fetched rows are rendered regardless of state.

The **visual unread indicator** (highlighted card background via `notifications-card--unread`)
is driven by `!notification.isRead` in every notification type component. e.g.
`BookingCreatedNotificationItem.view.jsx:34`:
```jsx
unread={!notification.isRead}
```

Because `markSeen` never sets `is_read=true`, all cards remain visually highlighted as
"unread" even after the user opens the screen. The highlight only clears via `markRead`,
which has no UI caller.

---

### 8. Is the bottom badge stale because React Query cache is not invalidated?

**Partially.** The `notificationUnread` query IS invalidated (see Q5B). The badge
**would** drop to 0 if the badge query hit the DB directly. But it does not because:

The cache-aware path in `deriveCountFromInboxCache` intercepts first. It reads the
`notificationsInbox` cache — which is fresh (just fetched) and passes the 60s staleness
check — and returns an `isRead`-based count without querying the DB.

The cache-aware path only falls through to the DB when:
```js
if (unreadCount === cached.length) return null  // all rows appear unread
```

This only happens when every row in the inbox is `isRead=false`. The moment any
notification has been `markRead`'d (mix of `isRead=true` and `isRead=false`), the
path returns the stale `isRead`-based count and the DB is never queried.

---

## Lifecycle Map: NEW → SEEN → READ

```
State          is_seen  is_read  isSeen(cache)  isRead(cache)  DB count  Badge
─────────────────────────────────────────────────────────────────────────────────
Delivered      false    false    false          false          counted   counted
After screen   true     false    false(stale)   false          NOT       STILL counted
open                                                           counted   (cache-aware
  (markSeen                                                    (DB=0)    path returns
   ran in DB)                                                            isRead count)
After markRead true     true     —              true           NOT       0 ✓
  (no UI yet)                                                 counted
```

The lifecycle has three states but the badge and visual indicator track different fields.
The badge tracks DB `is_seen`. The card highlight tracks cache `isRead`. There is no code
path that transitions the badge from "counted" to "not counted" on screen open when the
inbox is in a mixed state.

---

## Root Cause

**Two compounding issues:**

### Issue 1 — `getInboxNotifications` returns stale `isSeen` values

`runtime/index.js:202-221`: The notification objects are composed (`mapNotificationInboxRows`)
BEFORE `markRecipientIdsSeen` runs. The returned array reflects `is_seen` from DB AT FETCH TIME,
not AFTER markSeen. React Query caches these stale objects with `isSeen=false` on items
that the DB has since flipped to `is_seen=true`.

```js
// STEP C — objects composed with isSeen=false
const notifications = mapNotificationInboxRows({ ... })   // is_seen=false at this point

// STEP D — DB updated after objects already composed
await markRecipientIdsSeen(unseenRecipientIds)            // is_seen=true in DB now

return { notifications, hasMore }                          // returned with isSeen=false still
```

### Issue 2 — Badge cache-aware path uses `isRead` instead of `isSeen` (field mismatch)

`hooks/useNotificationCount.js:23`: `cached.filter((row) => !row.isRead).length`

The DB count uses `is_seen=false`. `markSeen` only sets `is_seen`. `is_read` is never
set by the screen-open flow. The cache-aware path is measuring a different field
than the DB, so it can never reflect the post-markSeen state correctly.

**The bug manifests when the inbox has mixed state (some `isRead=true`, some `isRead=false`).**
In that case `unreadCount < cached.length` → cache returns stale `isRead`-based count →
DB is never queried → badge does not update until next 60s poll cycle.

**Worst case: badges appear stuck for up to 60s after opening the notifications screen.**

---

## Minimal Fix Recommendation

Two changes. One file each.

### Fix A — Align cache-aware path field with DB semantics

**File:** `apps/VCSM/src/features/notifications/hooks/useNotificationCount.js:23`

```js
// Before:
const unreadCount = cached.filter((row) => !row.isRead).length

// After:
const unreadCount = cached.filter((row) => !row.isSeen).length
```

Effect: The stale `isSeen=false` values in the cache (Issue 1) cause `unreadCount === cached.length`
every time the inbox is freshly fetched. This triggers the null fallthrough to DB, which
returns the correct post-markSeen count. Badge drops to 0 immediately after screen open.

Caveat: relies on Issue 1's stale `isSeen=false` to produce the null fallthrough. Works
correctly as long as Issue 1 is NOT fixed. If Issue 1 is also fixed (objects return with
accurate `isSeen=true`), Fix A still works correctly — the cache returns the right count
from cache directly without DB.

---

### Fix B — Return accurate isSeen values after markSeen (closes Issue 1)

**File:** `apps/VCSM/src/features/notifications/runtime/index.js`

After `markRecipientIdsSeen` completes, patch the returned `notifications` array to set
`isSeen=true` on the IDs that were just marked:

```js
if (autoMarkSeen) {
  const unseenRecipientIds = notifications
    .filter((row) => !row.isSeen)
    .map((row) => row.recipientId)

  if (unseenRecipientIds.length) {
    await markRecipientIdsSeen(unseenRecipientIds)
    invalidateCountUnreadCache(recipientActorId)

    // patch returned objects so cache reflects post-markSeen state
    const seenSet = new Set(unseenRecipientIds)
    for (const n of notifications) {
      if (seenSet.has(n.recipientId)) n.isSeen = true
    }
  }
}
```

Effect: React Query inbox cache stores accurate `isSeen=true` after markSeen. The badge's
cache-aware path (after Fix A) can return 0 from cache without a DB round-trip.

---

### Fix priority

Fix A alone is sufficient to resolve the badge bug. It is a 1-line change in 1 file.

Fix B is the correct hygiene fix for the cache staleness issue. It has no behavior risk
(mutation of the `notifications` array before it leaves `getInboxNotifications`).

Both together make the system fully correct: cache is accurate, badge field aligns with
DB semantics, no stale display after screen open.

---

*Report written: NOTI-SEEN-FLOW-CODE-TRACE-001 — 2026-06-07*
