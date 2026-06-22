# @notifications Runtime Engine — Audit V1

**Date:** 2026-05-19  
**Trigger:** CEREBRO verification pass on `vcsm.dal.notifications.md` — IF-2 (IRONMAN finding: engine audit missing)  
**Application Scope:** VCSM  
**Status:** COMPLETE

---

## 1. Engine Root

```
apps/VCSM/src/features/notifications/runtime/
├── index.js                   ← public interface (Vite alias target)
├── notificationRuntime.dal.js ← 16 DAL operations, all notification.* tables
└── notificationRuntime.model.js ← inbox row mapping and normalization
```

**Vite alias:**
```js
// vite.config.js line 45–46
find: '@notifications',
replacement: fileURLToPath(new URL('./src/features/notifications/runtime/index.js', import.meta.url))
```

All app code imports the engine via `import { ... } from '@notifications'` — never via direct relative path.

---

## 2. Purpose

The `@notifications` runtime is the single execution layer for all notification operations in VCSM. It owns:

- **Publish** — inserting notification events and delivering them to recipients
- **Inbox read** — retrieving paginated inbox rows with join assembly and auto-mark-seen
- **Unread count** — counting unseen inbox items with in-memory caching and inflight deduplication
- **Lifecycle mutations** — mark read, mark seen, dismiss, archive
- **Cache invalidation** — in-memory count cache keyed by actorId:domain
- **DAL configuration** — injects the Supabase client into all 16 DAL operations at startup

The engine is app-internal: it lives in `apps/VCSM/src/features/notifications/runtime/` and is isolated from the `engines/` directory. It follows the same dependency injection + Vite alias contract as shared engines.

---

## 3. Scope

**In scope:**
- All notification reads (inbox, unread count)
- All notification writes (publish, status mutations)
- In-memory count cache lifecycle
- DAL client configuration

**Out of scope:**
- Self-notification filtering — owned by `publish.js` (caller layer)
- Notification rendering/display — owned by `notification.model.js` in the inbox feature
- Block filtering — owned by `Notifications.controller.js`
- Follow-request filtering — owned by `Notifications.controller.js`
- Sender hydration — owned by `resolveSenders.js` via `@hydration`
- UI state — owned by hooks layer (`useNotificationInbox`, `useNotificationsHeader`)
- Badge polling lifecycle — owned by `bootstrap.hydrate.controller.js` + `bootstrap.selectors.js`

---

## 4. Entry Points

**Initialization (must be first):**

```js
setupVcsmNotificationsEngine()  // setup.js — called from main.jsx before createRoot
  → configureNotificationsEngine({ supabaseClient, resolveActorCard })
    → configureNotificationsRuntimeDAL({ supabaseClient })
```

**Caller entry points:**

| Caller | Engine Function |
|---|---|
| `setup.js` | `configureNotificationsEngine` |
| `publish.js` | `publishEvent` |
| `inbox/controller/Notifications.controller.js` | `getInboxNotifications` |
| `inbox/controller/NotificationsHeader.controller.js` | `countUnread`, `getInboxNotifications` |
| `inbox/controller/notificationsCount.controller.js` | `countUnread` |
| `dev/diagnostics/groups/notificationsFeature.group.js` | `markRead` |

`bootstrap.invalidate.js` calls `invalidateCountUnreadCache()` directly on actor switch / logout.

---

## 5. Public Interface

All functions exported from `apps/VCSM/src/features/notifications/runtime/index.js`:

### `configureNotificationsEngine(nextConfig)`
Injects the Supabase client and optional resolvers into the runtime DAL. Must be called once before any other engine function. Called by `setup.js` only.

```js
configureNotificationsEngine({
  supabaseClient,   // required — main supabase client (same auth context as all features)
  resolveActorCard, // optional — async (actorId) => { displayName, username, avatarUrl } | null
})
```

### `publishEvent({ event, recipients, renderContext })`
Inserts a notification event and delivers it to all recipients in parallel.

```js
publishEvent({
  event: {
    eventKey,        // required string — notification event type key
    sourceDomain,    // default 'vc'
    sourceActorId,
    sourceUserId,
    objectDomain,
    objectType,
    objectId,
    parentObjectType,
    parentObjectId,
    appId,
    realmId,
    visibility,      // default 'private'
    payload,         // default {}
  },
  recipients: [{
    recipientDomain,             // default 'vc'
    recipientKind,               // default 'actor'
    recipientActorId,
    recipientUserId,
    recipientUserAppAccountId,
    deliveryChannel,             // default 'in_app'
    inboxBucket,                 // default 'default'
    priority,                    // default 3
  }],
  renderContext: {
    ctaLabel, linkPath, imageUrl, icon
  }
})
// Returns: { eventId, recipientCount, deliveredCount, errors[] }
```

**Delivery is parallel** (V1 — post-KF-1 fix): all recipients processed via `Promise.allSettled`. Per-recipient failure status update runs inside each async branch before re-throw.

### `getInboxNotifications({ recipientActorId, recipientDomain, cursor, limit, autoMarkSeen })`
Reads a paginated inbox, joining events + rendered + inbox item rows in a single `Promise.all` batch.

```js
getInboxNotifications({
  recipientActorId, // required
  recipientDomain,  // default null
  cursor,           // default null (pagination cursor)
  limit,            // default 20
  autoMarkSeen,     // default true — marks unseen items seen in same call
})
// Returns: { notifications: NotificationRow[], hasMore: boolean }
```

### `countUnread({ recipientActorId, recipientDomain })`
Returns count of unseen inbox items. Results cached 5s per actorId:domain key. Concurrent calls for the same key share one in-flight promise.

```js
countUnread({ recipientActorId, recipientDomain })
// Returns: number (0 if no actorId)
```

### `invalidateCountUnreadCache(actorId?)`
Clears the count cache. No actorId = full clear. With actorId = clears only keys for that actor.

### `markSeen({ recipientIds })`
Marks an array of recipient IDs as seen in the DB. Invalidates count cache.

### `markRead({ recipientId })`
Marks a single recipient notification as read (sets `read_at`). Invalidates count cache.

### `dismiss({ recipientId })`
Marks a single notification as dismissed. Invalidates count cache.

### `archive({ recipientId })`
Marks a single notification as archived. Invalidates count cache.

---

## 6. Data Flow

### Publish Flow

```
publishEvent()
  1. insertNotificationEventDAL(buildEventRpcArgs(event))
       → notification.events (INSERT via RPC)
  2. insertNotificationRecipientsDAL(eventId, buildRecipientRows(recipients))
       → notification.recipients (INSERT via RPC)
  3. Promise.allSettled — parallel per-recipient delivery:
       → upsertNotificationRenderedDAL(recipientId, renderedFallback)
           → notification.rendered (UPSERT)
       → insertNotificationInboxItemDAL(recipientId)
           → notification.inbox_items (INSERT)
       → updateNotificationRecipientStatusDAL(recipientId, 'delivered' | 'failed', message)
           → notification.recipients (UPDATE)
  4. invalidateCountUnreadCache() — clears all count cache entries
```

Total: 2 fixed DB ops + 3 parallel per-recipient ops.

### Inbox Read Flow

```
getInboxNotifications()
  1. readNotificationRecipientRowsDAL({ recipientActorId, cursor, limit+1 })
       → notification.recipients (SELECT — RLS-scoped to authenticated actor)
  2. Promise.all:
       → readNotificationEventsByIdsDAL(eventIds)
           → notification.events (SELECT)
       → readNotificationRenderedByRecipientIdsDAL(recipientIds)
           → notification.rendered (SELECT)
       → readNotificationInboxRowsByRecipientIdsDAL(recipientIds)
           → notification.inbox_items (SELECT)
  3. mapNotificationInboxRows() — local normalization, no DB
  4. (if autoMarkSeen) markNotificationRecipientsSeenDAL(unseenIds, now)
       → notification.recipients (UPDATE)
     + invalidateCountUnreadCache(recipientActorId)
```

Total: 1 serial read + 3 parallel reads + 1 conditional write.

### Count Unread Flow

```
countUnread()
  → cache check (5s TTL, per actorId:domain key)
     HIT  → return cached value immediately
     MISS → readNotificationRecipientIdsForUnreadDAL()
                → notification.recipients (SELECT)
            → countNotificationUnreadInboxItemsDAL(recipientIds)
                → notification.inbox_items (SELECT count)
            → cache set + return
  Note: concurrent calls share one inflight Promise per key
```

---

## 7. Source of Truth

| Data | Table | Schema | Owner |
|---|---|---|---|
| Notification events | `events` | `notification` | `@notifications` engine (write via RPC only) |
| Recipient delivery records | `recipients` | `notification` | `@notifications` engine (write via RPC only) |
| Per-recipient rendered content | `rendered` | `notification` | `@notifications` engine (write via RPC only) |
| Inbox items | `inbox_items` | `notification` | `@notifications` engine (write via RPC only) |
| Unread count cache | `countCache` (in-memory) | — | `@notifications` engine (5s TTL) |
| Event categories (ref) | `event_categories` | `notification` | Engine (public read) |

**Engine-internal tables not accessed via feature-layer DALs** (discovered via live DB 2026-05-19):
`notification.preferences`, `notification.delivery_attempts`, `notification.templates`, `notification.push_subscriptions`, `notification.event_types`

---

## 8. Dependencies

| Dependency | Type | Used For |
|---|---|---|
| `supabaseClient` | Injected at init | All DAL operations — same auth context as rest of app |
| `@hydration` engine | Caller-injected (`resolveActorCard`) | Actor card resolution for rendered notification content |
| `notificationRuntime.dal.js` | Internal (same dir) | All 16 DB operations |
| `notificationRuntime.model.js` | Internal (same dir) | Inbox row normalization via `mapNotificationInboxRows` |

The engine itself imports nothing from `@/features/notifications/` feature layer — dependency direction is one-way: feature → runtime, never runtime → feature.

---

## 9. File Map

| File | Role |
|---|---|
| `runtime/index.js` | Public interface — 9 exports, internal cache, orchestration (299 lines) |
| `runtime/notificationRuntime.dal.js` | 16 DAL operations for all notification.* table access |
| `runtime/notificationRuntime.model.js` | `mapNotificationInboxRows` — joins recipients + events + rendered + inbox_items |
| `setup.js` | One-time initialization wiring (`setupVcsmNotificationsEngine`) |
| `publish.js` | Self-notification guard + adapter-facing publish helpers (`publishVcsmNotification`, `publishVcsmNotificationBatch`) |

---

## 10. Boundary Guarantees

1. **App-internal only** — `@notifications` is a Vite alias that resolves inside `apps/VCSM/`. It is not in `engines/` and must not be imported from `apps/wentrex/` or `apps/Traffic/`.
2. **No app feature imports** — `runtime/index.js` does not import from any `@/features/` path. Only imports from within `runtime/`.
3. **DAL isolation** — all 16 DB operations are in `notificationRuntime.dal.js`. No raw Supabase calls in `index.js`.
4. **Self-notification guard** — enforced in `publish.js` (caller layer), not in the engine. Engine delivers to all provided recipients.
5. **RLS enforced at DB level** — all `notification.*` core tables have RLS with `notification.can_access_recipient()` multi-kind ownership check. Direct client reads are scoped to the authenticated actor regardless of what `recipientActorId` is passed.
6. **Write paths are RPC-only** — direct INSERT/UPDATE/DELETE on core tables is blocked via `WITH CHECK = false` RLS policies. All writes go through engine-owned RPC functions.

---

## 11. Initialization Contract

```
main.jsx (before createRoot)
  setupVcsmIdentityEngine()     [pos 1]
  setupVcsmHydration()          [pos 2]  ← @hydration must be initialized before @notifications
  setupVcsmChatEngine()         [pos 3]
  setupVcsmReviewsEngine()      [pos 4]
  setupVcsmPortfolioEngine()    [pos 5]
  setupVcsmNotificationsEngine() [pos 6]  ← @notifications — depends on @hydration at pos 2
  setupVcsmBookingEngine()      [pos 7]
  setupVcsmMediaEngine()        [pos 8]
```

**Idempotency:** `_configured` boolean guard in `setup.js` prevents double-init on React StrictMode double-invoke or HMR. Calling `setupVcsmNotificationsEngine()` twice is a no-op after the first call.

**Failure mode:** If `configureNotificationsEngine` is never called, all DAL operations will fail with a missing-client error (runtime guard in `notificationRuntime.dal.js`).

---

## 12. Security Notes

- **RLS verified CLEAN** (2026-05-19 live DB query — `nkdrjlmbtqbywhcthppm`): all 10 `notification.*` schema tables have `rowsecurity = t`. Core tables have correctly-scoped SELECT and write-blocking INSERT/UPDATE/DELETE policies.
- **`notification.can_access_recipient()`**: Three-branch multi-kind ownership switch (`app_account` → `platform.owns_user_app_account()`, `actor` → `platform.owns_actor_via_app_link()`, `user/platform` → `auth.uid()` equality). Default branch is `false` — unrecognized kinds are denied.
- **Events policy**: `source_actor_id = vc.current_actor_id() OR EXISTS (recipients WHERE can_access_recipient())` — sender can also read their own sent events. By design.
- **Application-layer self-notification guard**: In `publish.js`, not in the engine. Engine trusts caller to filter recipients. This is correct for the diagnostics use case (where actorId = null is passed as sender deliberately).

---

## 13. Performance Notes

- **`publishEvent` delivery (post-KF-1, 2026-05-19):** Parallel `Promise.allSettled` per-recipient. O(3×RTT) regardless of recipient count. Previously O(3N×RTT) serial.
- **`getInboxNotifications` reads:** 3-way `Promise.all` for events/rendered/inbox join. Efficient for 20-item pages.
- **`countUnread` cache:** 5s in-memory TTL + inflight deduplication. Badge polling at 60s from React Query means cache is always warm at poll time.
- **`autoMarkSeen`:** Trailing write after inbox load adds 1 RTT for unseen batches. Acceptable — not on the critical display path.

---

## 14. Changes Since Previous Version

V1 — Initial audit. No previous version.

**Changes captured in V1 that occurred during the 2026-05-19 CEREBRO pass:**
- KF-1 RESOLVED: `publishEvent` delivery parallelized with `Promise.allSettled` (was serial `for...await`)
- 6 dead files deleted from `features/notifications/` (RISK-1, 5, 6, 7, 8, CF-2)
- `runtime/index.js` is at 299 lines (contract limit: 300)

---

## 15. Verification Notes

**Evidence quality:** OBSERVED — all claims verified by:
- Static source read: `runtime/index.js` (full 299 lines), `setup.js` (51 lines), `notificationRuntime.dal.js` (inspected)
- Live DB query (2026-05-19): RLS policies confirmed on all `notification.*` tables
- LOKI runtime trace (2026-05-19): full execution paths verified for publish, inbox load, badge count, mark-seen, actor switch
- SENTRY compliance check (2026-05-19): ALIGNED — no architecture violations

---

## 16. Related Logan Docs

| Document | Path | Notes |
|---|---|---|
| DAL pipeline (primary) | `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.notifications.md` | Full CEREBRO verification pass — source of all findings |
| Pipeline architecture | `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/notifications/vcsm.notifications.pipeline.md` | System-level flow |
| Ownership record | `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/ironman/vcsm.notifications.owner.md` | IRONMAN ownership map |
| LOKI runtime trace | `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/loki_notifications-dal_2026-05-19.md` | Full execution trace |
| KRAVEN performance | `zNOTFORPRODUCTION/_ACTIVE/audits/performance/2026-05-19_kraven_notifications-dal.md` | KF-1 serial loop finding (RESOLVED) |
| DB RLS audit | `zNOTFORPRODUCTION/_HISTORY/db/snapshots/2026-05-19_14-30_db_notifications-rls-audit.md` | IF-3 CLOSED — RLS verified live |
| SENTRY compliance | `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/sentry_notifications-dal_2026-05-19.md` | Architecture compliance ALIGNED |
