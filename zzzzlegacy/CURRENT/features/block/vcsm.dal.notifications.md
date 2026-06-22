# VCSM DAL — `notifications`

_Generated:_ 2026-05-11  
_Updated:_ 2026-05-11 (ARCHITECT live audit — chain resolution, Final Screen correction, console violations, scan artifact attribution; pipeline trace — model/controller/hook/screen per DAL)  
_Source:_ ARCHITECT static scan + manual verification · `apps/VCSM/src/features/notifications/`  
_Confidence:_ STATICALLY\_TRACED + MANUALLY\_VERIFIED

---

## Summary

| Item | Detail |
|---|---|
| DAL files | 3 |
| Exported functions | 23 |
| Tables accessed | 7 (per-function attribution — see RISK-4) |
| RPCs called | 5 (per-function attribution — see RISK-4) |
| Risk findings | 4 |
| Release flag | None — always active |
| Feature status | LIVE — bottom nav tab at `/notifications`, engine initialized at app startup |
| Architecture status | COMPLETE — two-tier system (feature layer + `@notifications` engine) |
| Dead code | None confirmed |
| Cleanup required | 6+ unguarded `console.error`/`console.log` across controller, lib, hook, and view files |

## DAL Files

### `blocks.read.dal.js`

**Path:** `features/notifications/inbox/dal/blocks.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listBlockedActorRowsDAL` | `read` | `blocks` |
| `listBlockingActorRowsDAL` | `read` | `blocks` |

### `notificationRuntime.dal.js`

**Path:** `features/notifications/runtime/notificationRuntime.dal.js`  
**Schema:** `notification` (singular) — all queries use `.schema('notification')`  
**Operations:** `read` · `update` · `rpc`  
**Note:** Table/RPC attribution below is file-level (scan artifact — see RISK-4). Each function uses only the relevant subset of tables/RPCs for its operation.  

**Exported functions:**

| `archiveNotificationDAL` | `read` · `update` · `rpc` | `recipients`, `inbox_items`, `events`, `rendered`, `insert_recipients`, `update_recipient_status`, `insert_inbox_item`, `create_event`, `upsert_rendered` |
| `configureNotificationsRuntimeDAL` | `read` · `update` · `rpc` | `recipients`, `inbox_items`, `events`, `rendered`, `insert_recipients`, `update_recipient_status`, `insert_inbox_item`, `create_event`, `upsert_rendered` |
| `countNotificationUnreadInboxItemsDAL` | `read` · `update` · `rpc` | `recipients`, `inbox_items`, `events`, `rendered`, `insert_recipients`, `update_recipient_status`, `insert_inbox_item`, `create_event`, `upsert_rendered` |
| `dismissNotificationDAL` | `read` · `update` · `rpc` | `recipients`, `inbox_items`, `events`, `rendered`, `insert_recipients`, `update_recipient_status`, `insert_inbox_item`, `create_event`, `upsert_rendered` |
| `insertNotificationEventDAL` | `read` · `update` · `rpc` | `recipients`, `inbox_items`, `events`, `rendered`, `insert_recipients`, `update_recipient_status`, `insert_inbox_item`, `create_event`, `upsert_rendered` |
| `insertNotificationInboxItemDAL` | `read` · `update` · `rpc` | `recipients`, `inbox_items`, `events`, `rendered`, `insert_recipients`, `update_recipient_status`, `insert_inbox_item`, `create_event`, `upsert_rendered` |
| `insertNotificationRecipientsDAL` | `read` · `update` · `rpc` | `recipients`, `inbox_items`, `events`, `rendered`, `insert_recipients`, `update_recipient_status`, `insert_inbox_item`, `create_event`, `upsert_rendered` |
| `markNotificationReadDAL` | `read` · `update` · `rpc` | `recipients`, `inbox_items`, `events`, `rendered`, `insert_recipients`, `update_recipient_status`, `insert_inbox_item`, `create_event`, `upsert_rendered` |
| `markNotificationRecipientsSeenDAL` | `read` · `update` · `rpc` | `recipients`, `inbox_items`, `events`, `rendered`, `insert_recipients`, `update_recipient_status`, `insert_inbox_item`, `create_event`, `upsert_rendered` |
| `readNotificationEventsByIdsDAL` | `read` · `update` · `rpc` | `recipients`, `inbox_items`, `events`, `rendered`, `insert_recipients`, `update_recipient_status`, `insert_inbox_item`, `create_event`, `upsert_rendered` |
| `readNotificationInboxRowsByRecipientIdsDAL` | `read` · `update` · `rpc` | `recipients`, `inbox_items`, `events`, `rendered`, `insert_recipients`, `update_recipient_status`, `insert_inbox_item`, `create_event`, `upsert_rendered` |
| `readNotificationRecipientIdsForUnreadDAL` | `read` · `update` · `rpc` | `recipients`, `inbox_items`, `events`, `rendered`, `insert_recipients`, `update_recipient_status`, `insert_inbox_item`, `create_event`, `upsert_rendered` |
| `readNotificationRecipientRowsDAL` | `read` · `update` · `rpc` | `recipients`, `inbox_items`, `events`, `rendered`, `insert_recipients`, `update_recipient_status`, `insert_inbox_item`, `create_event`, `upsert_rendered` |
| `readNotificationRenderedByRecipientIdsDAL` | `read` · `update` · `rpc` | `recipients`, `inbox_items`, `events`, `rendered`, `insert_recipients`, `update_recipient_status`, `insert_inbox_item`, `create_event`, `upsert_rendered` |
| `updateNotificationRecipientStatusDAL` | `read` · `update` · `rpc` | `recipients`, `inbox_items`, `events`, `rendered`, `insert_recipients`, `update_recipient_status`, `insert_inbox_item`, `create_event`, `upsert_rendered` |
| `upsertNotificationRenderedDAL` | `read` · `update` · `rpc` | `recipients`, `inbox_items`, `events`, `rendered`, `insert_recipients`, `update_recipient_status`, `insert_inbox_item`, `create_event`, `upsert_rendered` |

### `senders.read.dal.js`

**Path:** `features/notifications/inbox/dal/senders.read.dal.js`  
**Operations:** `read`  
**Schemas used:**
- `vc` schema — `listActorIdentityRowsByIdsDAL`, `listActorPresentationRowsByIdsDAL`, `listActorSummaryRowsByIdsDAL`, `listProfileRowsByIdsDAL` — via main `supabase` client
- `vport` schema — `listVportRowsByIdsDAL` — via `supabase.schema('vport')` (same auth context as main client; not a separate Supabase instance)

**Exported functions:**

| `listActorIdentityRowsByIdsDAL` | `read` | `vc.actors`, `public.profiles` |
| `listActorPresentationRowsByIdsDAL` | `read` | `vc.actors`, `public.profiles` |
| `listActorSummaryRowsByIdsDAL` | `read` | `vc.actors`, `public.profiles` |
| `listProfileRowsByIdsDAL` | `read` | `public.profiles` |
| `listVportRowsByIdsDAL` | `read` | `vport.profiles` (via `supabase.schema('vport')`) |

---

## Tables Accessed

| Table | Operations | Via Functions |
|---|---|---|
| `actors` | READ | `listActorIdentityRowsByIdsDAL`, `listActorPresentationRowsByIdsDAL`, `listActorSummaryRowsByIdsDAL`, `listProfileRowsByIdsDAL`, `listVportRowsByIdsDAL` |
| `blocks` | READ | `listBlockedActorRowsDAL`, `listBlockingActorRowsDAL` |
| `events` | UPDATE | `archiveNotificationDAL`, `configureNotificationsRuntimeDAL`, `countNotificationUnreadInboxItemsDAL`, `dismissNotificationDAL`, `insertNotificationEventDAL`, `insertNotificationInboxItemDAL`, `insertNotificationRecipientsDAL`, `markNotificationReadDAL`, `markNotificationRecipientsSeenDAL`, `readNotificationEventsByIdsDAL`, `readNotificationInboxRowsByRecipientIdsDAL`, `readNotificationRecipientIdsForUnreadDAL`, `readNotificationRecipientRowsDAL`, `readNotificationRenderedByRecipientIdsDAL`, `updateNotificationRecipientStatusDAL`, `upsertNotificationRenderedDAL` |
| `inbox_items` | UPDATE | `archiveNotificationDAL`, `configureNotificationsRuntimeDAL`, `countNotificationUnreadInboxItemsDAL`, `dismissNotificationDAL`, `insertNotificationEventDAL`, `insertNotificationInboxItemDAL`, `insertNotificationRecipientsDAL`, `markNotificationReadDAL`, `markNotificationRecipientsSeenDAL`, `readNotificationEventsByIdsDAL`, `readNotificationInboxRowsByRecipientIdsDAL`, `readNotificationRecipientIdsForUnreadDAL`, `readNotificationRecipientRowsDAL`, `readNotificationRenderedByRecipientIdsDAL`, `updateNotificationRecipientStatusDAL`, `upsertNotificationRenderedDAL` |
| `profiles` | READ | `listActorIdentityRowsByIdsDAL`, `listActorPresentationRowsByIdsDAL`, `listActorSummaryRowsByIdsDAL`, `listProfileRowsByIdsDAL`, `listVportRowsByIdsDAL` |
| `recipients` | UPDATE | `archiveNotificationDAL`, `configureNotificationsRuntimeDAL`, `countNotificationUnreadInboxItemsDAL`, `dismissNotificationDAL`, `insertNotificationEventDAL`, `insertNotificationInboxItemDAL`, `insertNotificationRecipientsDAL`, `markNotificationReadDAL`, `markNotificationRecipientsSeenDAL`, `readNotificationEventsByIdsDAL`, `readNotificationInboxRowsByRecipientIdsDAL`, `readNotificationRecipientIdsForUnreadDAL`, `readNotificationRecipientRowsDAL`, `readNotificationRenderedByRecipientIdsDAL`, `updateNotificationRecipientStatusDAL`, `upsertNotificationRenderedDAL` |
| `rendered` | UPDATE | `archiveNotificationDAL`, `configureNotificationsRuntimeDAL`, `countNotificationUnreadInboxItemsDAL`, `dismissNotificationDAL`, `insertNotificationEventDAL`, `insertNotificationInboxItemDAL`, `insertNotificationRecipientsDAL`, `markNotificationReadDAL`, `markNotificationRecipientsSeenDAL`, `readNotificationEventsByIdsDAL`, `readNotificationInboxRowsByRecipientIdsDAL`, `readNotificationRecipientIdsForUnreadDAL`, `readNotificationRecipientRowsDAL`, `readNotificationRenderedByRecipientIdsDAL`, `updateNotificationRecipientStatusDAL`, `upsertNotificationRenderedDAL` |

## RPCs Called

| RPC | Via Functions |
|---|---|
| `create_event` | `archiveNotificationDAL`, `configureNotificationsRuntimeDAL`, `countNotificationUnreadInboxItemsDAL`, `dismissNotificationDAL`, `insertNotificationEventDAL`, `insertNotificationInboxItemDAL`, `insertNotificationRecipientsDAL`, `markNotificationReadDAL`, `markNotificationRecipientsSeenDAL`, `readNotificationEventsByIdsDAL`, `readNotificationInboxRowsByRecipientIdsDAL`, `readNotificationRecipientIdsForUnreadDAL`, `readNotificationRecipientRowsDAL`, `readNotificationRenderedByRecipientIdsDAL`, `updateNotificationRecipientStatusDAL`, `upsertNotificationRenderedDAL` |
| `insert_inbox_item` | `archiveNotificationDAL`, `configureNotificationsRuntimeDAL`, `countNotificationUnreadInboxItemsDAL`, `dismissNotificationDAL`, `insertNotificationEventDAL`, `insertNotificationInboxItemDAL`, `insertNotificationRecipientsDAL`, `markNotificationReadDAL`, `markNotificationRecipientsSeenDAL`, `readNotificationEventsByIdsDAL`, `readNotificationInboxRowsByRecipientIdsDAL`, `readNotificationRecipientIdsForUnreadDAL`, `readNotificationRecipientRowsDAL`, `readNotificationRenderedByRecipientIdsDAL`, `updateNotificationRecipientStatusDAL`, `upsertNotificationRenderedDAL` |
| `insert_recipients` | `archiveNotificationDAL`, `configureNotificationsRuntimeDAL`, `countNotificationUnreadInboxItemsDAL`, `dismissNotificationDAL`, `insertNotificationEventDAL`, `insertNotificationInboxItemDAL`, `insertNotificationRecipientsDAL`, `markNotificationReadDAL`, `markNotificationRecipientsSeenDAL`, `readNotificationEventsByIdsDAL`, `readNotificationInboxRowsByRecipientIdsDAL`, `readNotificationRecipientIdsForUnreadDAL`, `readNotificationRecipientRowsDAL`, `readNotificationRenderedByRecipientIdsDAL`, `updateNotificationRecipientStatusDAL`, `upsertNotificationRenderedDAL` |
| `update_recipient_status` | `archiveNotificationDAL`, `configureNotificationsRuntimeDAL`, `countNotificationUnreadInboxItemsDAL`, `dismissNotificationDAL`, `insertNotificationEventDAL`, `insertNotificationInboxItemDAL`, `insertNotificationRecipientsDAL`, `markNotificationReadDAL`, `markNotificationRecipientsSeenDAL`, `readNotificationEventsByIdsDAL`, `readNotificationInboxRowsByRecipientIdsDAL`, `readNotificationRecipientIdsForUnreadDAL`, `readNotificationRecipientRowsDAL`, `readNotificationRenderedByRecipientIdsDAL`, `updateNotificationRecipientStatusDAL`, `upsertNotificationRenderedDAL` |
| `upsert_rendered` | `archiveNotificationDAL`, `configureNotificationsRuntimeDAL`, `countNotificationUnreadInboxItemsDAL`, `dismissNotificationDAL`, `insertNotificationEventDAL`, `insertNotificationInboxItemDAL`, `insertNotificationRecipientsDAL`, `markNotificationReadDAL`, `markNotificationRecipientsSeenDAL`, `readNotificationEventsByIdsDAL`, `readNotificationInboxRowsByRecipientIdsDAL`, `readNotificationRecipientIdsForUnreadDAL`, `readNotificationRecipientRowsDAL`, `readNotificationRenderedByRecipientIdsDAL`, `updateNotificationRecipientStatusDAL`, `upsertNotificationRenderedDAL` |

---

## Risk Findings

No risk findings for this feature.

---

## Pending Reviews

No pending reviews — feature DAL is clean.

---

## Call Chains

Who calls each DAL file — traced from DAL up to Screen.

### `blocks.read.dal.js`

**Direct callers:**

- `blockFilter.js` _Other_

**Partial chain (no screen reached):  **

```
`blocks.read.dal.js` → `blockFilter.js`
```
```
`blocks.read.dal.js` → `blockFilter.js` → `Notifications.controller.js`
```
```
`blocks.read.dal.js` → `blockFilter.js` → `Notifications.controller.js` → `notificationsFeature.group.js`
```

### `senders.read.dal.js`

**Direct callers:**

- `resolveSenders.js` _Other_

**Partial chain (no screen reached):  **

```
`senders.read.dal.js` → `resolveSenders.js`
```
```
`senders.read.dal.js` → `resolveSenders.js` → `notificationsFeature.group.js`
```
```
`senders.read.dal.js` → `resolveSenders.js` → `Notifications.controller.js`
```

---

## Architecture Pipeline

Full build order for this feature — `DAL → Model → Controller → Hook → Components → View Screen → Final Screen`

| Layer | Status | Files |
|---|---|---|
| **DAL** | ✓ PRESENT | _(documented above)_ |
| **Model** | ✓ PRESENT | `notification.model.js`, `notificationRuntime.model.js` |
| **Controller** | ✓ PRESENT | `Notifications.controller.js`, `NotificationsHeader.controller.js`, `notificationsCount.controller.js` _(+ `inboxUnread.controller.js` — dead, delete candidate)_ |
| **Adapter** | ✓ PRESENT | `notifications.adapter.js` |
| **Service** | ✓ PRESENT (engine-delegated) | `@notifications` engine (`runtime/index.js`) — publish, read, count, mark-seen/read, archive, dismiss |
| **Hook** | ✓ PRESENT | `useNotiCount.js`, `useNotificationInbox.js`, `useNotifications.js`, `useNotificationsHeader.js` _(+ 3 dead: `useMarkNotificationsRead.js`, `useNotificationsInternal.js`, `useUnreadBadge.js`)_ |
| **Component** | ✓ PRESENT | `NotificationCard.jsx` (dispatch) + 13 type views in `types/booking/`, `types/comment/`, `types/follow/`, `types/mention/`, `types/reaction/`, `types/review/`, `types/team/` |
| **View (inbox/ui/)** | ✓ PRESENT | `NotificationItem.view.jsx`, `Notifications.view.jsx`, `NotificationsHeader.view.jsx` |
| **View Screen** | ✓ PRESENT | `NotificationsScreenView.jsx`, `MyAppointmentsView.jsx` _(+ `screen/views/NotiViewPostScreen.jsx` — dead, delete candidate)_ |
| **Final Screen** | ✓ PRESENT | `NotificationsScreen.jsx` (route `/notifications`), `NotiViewPostScreen.jsx` (route `/noti/post/:postId`) |
| **Lib** | ✓ PRESENT | `blockFilter.js`, `resolveSenders.js`, `resolveInboxActor.js` |
| **Realtime** | ✓ PRESENT (inert) | `badgeSubscriptions.js` — noops only, zero callers, delete candidate |
| **Setup** | ✓ PRESENT | `setup.js` — `setupVcsmNotificationsEngine()` called from `main.jsx` |
| **Bridge** | ✓ PRESENT | `publish.js` — maps legacy shape to engine `publishEvent()` API |

### Model

_Pure transforms — no side effects, no DB access_

- `features/notifications/inbox/model/notification.model.js`
- `features/notifications/runtime/notificationRuntime.model.js`

### Controller

_Business rules, ownership, permissions — no React_

- `features/notifications/inbox/controller/Notifications.controller.js`
- `features/notifications/inbox/controller/NotificationsHeader.controller.js`
- `features/notifications/inbox/controller/inboxUnread.controller.js`
- `features/notifications/inbox/controller/notificationsCount.controller.js`

### Adapter

_Cross-feature boundary — only approved cross-feature access point_

- `features/notifications/adapters/notifications.adapter.js`

### Hook

_Lifecycle / timing / state wiring — no business rules_

- `features/notifications/inbox/hooks/useMarkNotificationsRead.js`
- `features/notifications/inbox/hooks/useNotiCount.js`
- `features/notifications/inbox/hooks/useNotificationInbox.js`
- `features/notifications/inbox/hooks/useNotifications.js`
- `features/notifications/inbox/hooks/useNotificationsHeader.js`
- `features/notifications/inbox/hooks/useNotificationsInternal.js`
- `features/notifications/inbox/hooks/useUnreadBadge.js`
- `features/notifications/screen/hooks/useMyAppointments.js`

### Component

_Presentational only — no hooks, no data fetching_

- `features/notifications/types/components/NotificationCard.jsx`

### View Screen

_Hooks + component composition — no business logic_

- `features/notifications/screen/views/MyAppointmentsView.jsx`
- `features/notifications/screen/views/NotiViewPostScreen.jsx`
- `features/notifications/screen/views/NotificationsScreenView.jsx`

### Missing Layers

- 🟡 **Service** — not detected in static scan; feature delegates publish path to `@notifications` engine — not a gap
- ~~**Final Screen** — not detected in static scan~~ → **CORRECTED**: Final Screen is present (see ARCHITECT audit below)

> The static scan searched for a `screens/` directory pattern. The Final Screen exists at `screen/NotificationsScreen.jsx` (singular, non-plural path) — this caused the scan to miss it.

---

## ARCHITECT Live Audit Findings

_Appended:_ 2026-05-11 · ARCHITECT manual verification  
_Scope:_ Full chain resolution, doc corrections, console policy violations, scan artifact attribution

---

## Doc Corrections from Original Static Scan

| Field | Original (Wrong) | Corrected |
|---|---|---|
| Final Screen | ✗ MISSING | ✓ PRESENT — `screen/NotificationsScreen.jsx`, lazy-loaded at `/notifications` |
| Risk findings | 0 | 4 |
| Feature status | Not specified | LIVE — bottom nav, 15+ cross-feature consumers, engine initialized at startup |
| `blocks.read.dal.js` chain | "Partial chain (no screen reached)" | FALSE — chain completes through `Notifications.controller.js` → hooks → `NotificationsScreen` |
| `senders.read.dal.js` chain | "Partial chain (no screen reached)" | FALSE — chain completes through `Notifications.controller.js` → hooks → `NotificationsScreen` |
| `notificationRuntime.dal.js` table/RPC attribution | All 7 tables + 5 RPCs attributed to all 16 functions | SCAN ARTIFACT — each function uses only a relevant subset (see RISK-4) |

---

## Feature Entry Points

`/notifications` is a **bottom navigation tab** — a primary app surface.

| Entry | File | Condition |
|---|---|---|
| Bottom nav tab | `shared/components/BottomNavBar.jsx` | Always visible to authenticated users |
| Route | `app.routes.jsx` → `{ path: "/notifications", element: <NotificationsScreen /> }` | Always registered |
| Route | `app.routes.jsx` → `{ path: "/noti/post/:postId", element: <NotiViewPostScreen /> }` | Always registered |
| Redirect | `appRoutes.redirects.jsx` → `/vport/notifications` → `/notifications` | Legacy redirect |
| Lazy load | `app/routes/lazyApp.jsx` — both screens dynamically imported | On demand |
| Engine init | `main.jsx` → `setup.js` → `@notifications` engine | App startup |

---

## Corrected Call Chains

### `blocks.read.dal.js` — CHAIN COMPLETE

The static scan stopped at `blockFilter.js` (classified as "Other"). `blockFilter.js` is a `lib/` utility that is imported by `Notifications.controller.js`. The full chain is:

```
blocks.read.dal.js
  → blockFilter.js                     [lib/ utility]
    → Notifications.controller.js      [Controller]
      → useNotificationInbox.js        [Hook]
        → NotificationsScreenView.jsx  [View Screen]
          → NotificationsScreen.jsx    [Final Screen — /notifications]
      → useNotificationsInternal.js    [Hook]
        → NotificationsScreen.jsx      [Final Screen]
```

**Verdict:** LIVE — chain fully reaches `NotificationsScreen`. "Partial chain (no screen reached)" was a scan artifact.

---

### `senders.read.dal.js` — CHAIN COMPLETE

The static scan stopped at `resolveSenders.js` (classified as "Other"). `resolveSenders.js` is a `lib/` utility imported by `Notifications.controller.js`. The full chain is:

```
senders.read.dal.js
  → resolveSenders.js                  [lib/ utility]
    → Notifications.controller.js      [Controller]
      → useNotificationInbox.js        [Hook]
        → NotificationsScreenView.jsx  [View Screen]
          → NotificationsScreen.jsx    [Final Screen — /notifications]
      → useNotificationsInternal.js    [Hook]
        → NotificationsScreen.jsx      [Final Screen]
```

**Verdict:** LIVE — chain fully reaches `NotificationsScreen`. "Partial chain (no screen reached)" was a scan artifact.

---

### `notificationRuntime.dal.js` — LIVE (all 16 functions active)

Engine initialized at startup via `setup.js` called from `main.jsx`. The `@notifications` engine consumes this DAL for all runtime notification operations.

---

## Two-Tier Architecture

The notifications feature operates as a two-tier system:

```
Feature layer (features/notifications/)
  → notifications.adapter.js        [cross-feature boundary — 15+ external consumers]
  → publish.js                      [maps legacy dalInsertNotification shape to engine]
    → @notifications engine         [publishEvent — canonical engine]
      → notificationRuntime.dal.js  [DAL — all DB writes]
```

Engine is initialized at app startup:

```
main.jsx
  → setup.js (features/notifications/setup.js)
    → setupNotificationsEngine() from @notifications
```

---

## Adapter Surface (Clean Boundary)

`features/notifications/adapters/notifications.adapter.js` exports:

| Export | Consumers |
|---|---|
| `publishVcsmNotification` | 15+ controllers across the app — all import through adapter |
| `publishVcsmNotificationBatch` | Batch notification publish |
| `getUnreadNotificationCount` | Unread badge logic |

External controllers correctly use the adapter boundary — no direct controller-to-controller imports detected.

---

## Risk Findings

### RISK-1 — `NotiViewPostScreen.jsx` Duplicate File
**Severity:** MEDIUM  
**Classification:** STALE FILE  
**Detail:** Two files named `NotiViewPostScreen.jsx` exist:

1. `screen/NotiViewPostScreen.jsx` — **LIVE** — 12-line component, lazy-loaded by router, renders `PostDetailView`
2. `screen/views/NotiViewPostScreen.jsx` — **STALE** — different, older implementation, not referenced by router

The static scan's Architecture Pipeline listed `screen/views/NotiViewPostScreen.jsx` as the live View Screen. The router uses `screen/NotiViewPostScreen.jsx` (the Final Screen location). The `views/` version is a different file that is not routed.

**Recommended action:** Verify `screen/views/NotiViewPostScreen.jsx` has zero callers. If confirmed dead, delete it. If it is intentionally a View Screen composed by `screen/NotiViewPostScreen.jsx`, document the relationship.

---

### RISK-2 — Unguarded `console.error` / `console.log` Across Feature Files
**Severity:** ~~MEDIUM~~ → **RESOLVED** (2026-05-19 CEREBRO pass)  
**Classification:** ~~POLICY VIOLATION~~ → RESOLVED  
**Detail:** All console violations verified DEV-gated in live source. The violations listed at original scan time were subsequently gated via `import.meta.env.DEV` checks. See Codex Fix Pass 2026-05-11 and VENOM pass 2026-05-19.

| File | Line(s) | Type | DEV-gated? |
|---|---|---|---|
| `notifications/publish.js` | 79 | `console.error` | ✓ `if (import.meta.env.DEV)` |
| `inbox/controller/Notifications.controller.js` | 55 | `console.error` | ✓ `if (import.meta.env.DEV)` |
| `inbox/lib/resolveInboxActor.js` | 34, 53 | `console.error`, `console.warn` | ✓ DEV-gated |
| `inbox/hooks/useNotificationInbox.js` | 49, 51, 60, 85 | `console.log` | ✓ `const DEV = import.meta.env?.DEV` guard |
| `types/follow/FollowRequestItem.view.jsx` | 23, 72, 89 | `console.error` | ✓ DEV-gated (Codex Fix Pass 2026-05-11) |

_(Note: original doc listed `screen/views/FollowRequestItem.view.jsx` — corrected path is `types/follow/FollowRequestItem.view.jsx`)_

**No action required.** All violations resolved. `inbox/hooks/useMarkNotificationsRead.js` is a dead file (delete candidate).

---

### RISK-3 — `screen/views/` vs `screen/` Naming Inconsistency
**Severity:** LOW  
**Classification:** ORGANIZATION  
**Detail:** The `screen/` folder contains both Final Screen files (`NotificationsScreen.jsx`) and view files (`views/NotificationsScreenView.jsx`, `views/MyAppointmentsView.jsx`). Per contract, View Screens belong in `ui/` or a distinct `views/` folder separated from the Final Screen. The current structure nests views inside the screen directory rather than at the feature's `ui/` layer.

**Recommended action:** Move View Screens (`NotificationsScreenView.jsx`, `MyAppointmentsView.jsx`) to `features/notifications/ui/` per contract.

---

### RISK-4 — `notificationRuntime.dal.js` Table/RPC Attribution Is a Scan Artifact
**Severity:** LOW  
**Classification:** DOC CORRECTION  
**Detail:** The original scan attributed all 7 tables (`recipients`, `inbox_items`, `events`, `rendered`, `actors`, `profiles`, `blocks`) and all 5 RPCs (`insert_recipients`, `update_recipient_status`, `insert_inbox_item`, `create_event`, `upsert_rendered`) to every one of the 16 exported functions in `notificationRuntime.dal.js`.

This is a static scan artifact — the scanner detected all tables/RPCs used in the file and applied them to every function. Each function only accesses the subset relevant to its operation. For example:
- `countNotificationUnreadInboxItemsDAL` reads `recipients` + `inbox_items` only
- `insertNotificationEventDAL` calls `create_event` RPC only
- `markNotificationReadDAL` calls `update_recipient_status` RPC only

**Recommended action:** No code change needed. The per-function table/RPC breakdown in this document should be treated as "file-level attribution, not function-level" until a function-by-function audit is run.

---

## Pending Reviews

| Review | Command | Priority | Status |
|---|---|---|---|
| ~~Delete `screen/views/NotiViewPostScreen.jsx`~~ (RISK-1) | SENTRY | MEDIUM | **DELETED** 2026-05-19 |
| ~~Delete `inbox/hooks/useNotificationsInternal.js`~~ (RISK-5) | SENTRY | MEDIUM | **DELETED** 2026-05-19 |
| ~~Delete `inbox/hooks/useMarkNotificationsRead.js`~~ (RISK-6) | SENTRY | MEDIUM | **DELETED** 2026-05-19 |
| ~~Delete `inbox/hooks/useUnreadBadge.js`~~ (RISK-7) | SENTRY | LOW | **DELETED** 2026-05-19 |
| ~~Delete `inbox/controller/inboxUnread.controller.js`~~ (RISK-8) | SENTRY | LOW | **DELETED** 2026-05-19 |
| ~~Delete `inbox/realtime/badgeSubscriptions.js`~~ (CF-2) | SENTRY | LOW | **DELETED** 2026-05-19 |
| ~~Remove unguarded console.error/console.log~~ | ~~SENTRY~~ | ~~MEDIUM~~ | **RESOLVED** — all DEV-gated (RISK-2) |
| Move View Screens to `ui/` folder per contract (RISK-3) | SENTRY | LOW | OPEN |
| Move `mapSummaryRowToSender()` from `lib/resolveSenders.js` to `notification.model.js` (RISK-9) | SENTRY | LOW | OPEN |
| ~~Create `@notifications` engine audit v1 (IF-2)~~ | ~~LOGAN~~ | ~~MEDIUM~~ | **CREATED** — `NOTIFICATIONS_RUNTIME_ENGINE_AUDIT_V1.md` 2026-05-19 |
| ~~Implement `publishEvent()` parallel delivery loop — `Promise.allSettled` (KF-1)~~ | ~~Wolverine~~ | ~~HIGH~~ | **RESOLVED** — `Promise.allSettled` parallelization applied 2026-05-19 |
| Retrospective migration script for `notification.*` RLS policies | CARNAGE | LOW | OPEN |
| FALCON review — native parity (inbox, badge, type views, block filter, mark-seen) | FALCON | HIGH | OPEN — before next native release |
| Per-function table/RPC attribution audit for `notificationRuntime.dal.js` (RISK-4) | ARCHITECT | LOW | OPEN |

---

## ARCHITECT Pipeline Trace

_Appended:_ 2026-05-11 · ARCHITECT manual verification  
_Scope:_ Full architecture pipeline per DAL file — which Model, Controller, Hook, and Screen files touch each DAL

---

### Pipeline: `blocks.read.dal.js`

**Functions:** `listBlockedActorRowsDAL`, `listBlockingActorRowsDAL`  
**Table:** `moderation.blocks`

#### Lib intermediary

| File | Role | What it does |
|---|---|---|
| `inbox/lib/blockFilter.js` | Lib utility | `loadBlockSets(myActorId)` calls both DAL functions, returns `{iBlocked: Set, blockedMe: Set}`. `filterByBlocks(rows, blocks)` is a pure utility — no DAL calls. |

**Model gap:** Block data is converted to Sets inside `blockFilter.js` (a `lib/` file). No model file owns this transform. Per contract, domain transforms belong in `model/` — this is a layer gap (see RISK-9).

#### Controller

| File | How it touches the DAL |
|---|---|
| `inbox/controller/Notifications.controller.js` | Imports `loadBlockSets` and `filterByBlocks` from `blockFilter.js`. Calls `loadBlockSets(myActorId)` then `filterByBlocks(raw, blocks)` inside `getNotifications()`. |

#### Hooks

| File | How it touches the DAL | Status |
|---|---|---|
| `inbox/hooks/useNotificationInbox.js` | Calls `getNotifications()` → `Notifications.controller.js` → `loadBlockSets()` → DAL. React Query, 60s stale, `refetchInterval`. | LIVE |
| `inbox/hooks/useNotifications.js` | 1-line wrapper: `return useNotificationInbox()`. Consumed by `NotificationsScreenView`. | LIVE |
| `inbox/hooks/useNotificationsInternal.js` | Calls `getNotifications()` (old useState/useEffect pattern). **Zero external consumers** — dead. | DEAD (see RISK-5) |

#### Screens

| File | Layer | Route |
|---|---|---|
| `screen/views/NotificationsScreenView.jsx` | View Screen | — (composed by Final Screen) |
| `screen/NotificationsScreen.jsx` | Final Screen | `/notifications` |

#### Complete chain

```
blocks.read.dal.js
  → blockFilter.js                       [lib/ utility]
    → Notifications.controller.js        [Controller — getNotifications()]
      → useNotificationInbox.js          [Hook — React Query]
        → useNotifications.js            [Hook — thin wrapper]
          → NotificationsScreenView.jsx  [View Screen]
            → NotificationsScreen.jsx    [Final Screen — /notifications]
```

---

### Pipeline: `senders.read.dal.js`

**Functions:** `listActorSummaryRowsByIdsDAL`, `listActorPresentationRowsByIdsDAL`, `listActorIdentityRowsByIdsDAL`, `listProfileRowsByIdsDAL`, `listVportRowsByIdsDAL`  
**Tables:** `vc.actors`, `public.profiles`, vport `profiles` (via `vportClient`)  
**Engine delegation:** `listActorSummaryRowsByIdsDAL` and `listActorPresentationRowsByIdsDAL` delegate to `hydrateAndReturnSummaries()` from `@hydration` engine — they do not query Supabase directly.

#### Lib intermediary

| File | Role | What it does |
|---|---|---|
| `inbox/lib/resolveSenders.js` | Lib utility | `resolveSenders(actorIds)` — waterfall: tries `listActorSummaryRowsByIdsDAL` first, falls back to `listActorPresentationRowsByIdsDAL`, then resolves remaining via `listActorIdentityRowsByIdsDAL` + `listProfileRowsByIdsDAL` + `listVportRowsByIdsDAL` in parallel. Returns `{ [actorId]: senderObject }` map. |

**Model gap:** `resolveSenders.js` contains `mapSummaryRowToSender()` — a pure domain transform that maps raw actor rows to sender shape objects. This is model logic in a `lib/` file (see RISK-9).

#### Model

| File | Role | What it does |
|---|---|---|
| `inbox/model/notification.model.js` | Model | `mapNotification(row, senderMap)` receives the sender map returned by `resolveSenders()`. Calls `normalizeSender(rawSender, payload, senderActorId)` internally to produce the final `sender` shape on the domain notification object. |

#### Controller

| File | How it touches the DAL |
|---|---|
| `inbox/controller/Notifications.controller.js` | Calls `resolveSenders(actorIds)` to build sender map, then calls `mapNotification(r, senderMap)` for each notification row. |

#### Hooks

| File | How it touches the DAL | Status |
|---|---|---|
| `inbox/hooks/useNotificationInbox.js` | Calls `getNotifications()` → controller → `resolveSenders()` → DAL. | LIVE |
| `inbox/hooks/useNotifications.js` | Delegates to `useNotificationInbox()`. | LIVE |
| `inbox/hooks/useNotificationsInternal.js` | Calls `getNotifications()`. Zero external consumers — dead. | DEAD (see RISK-5) |

#### Screens

Same as `blocks.read.dal.js` — pipeline terminates at `NotificationsScreenView.jsx` → `NotificationsScreen.jsx`.

#### Complete chain

```
senders.read.dal.js
  → resolveSenders.js                    [lib/ utility — waterfall resolution]
    → Notifications.controller.js        [Controller — getNotifications()]
      → notification.model.js            [Model — mapNotification() + normalizeSender()]
        → useNotificationInbox.js        [Hook — React Query]
          → useNotifications.js          [Hook — thin wrapper]
            → NotificationsScreenView.jsx [View Screen]
              → NotificationsScreen.jsx  [Final Screen — /notifications]
```

---

### Pipeline: `notificationRuntime.dal.js`

**Functions:** 16 — all read/write/rpc on `notification.*` schema  
**Exclusive consumer:** `runtime/index.js` — the `@notifications` engine module. **No feature code imports this DAL directly.** The DAL is fully encapsulated behind the engine API.

#### Per-function engine mapping

| Engine Function | DAL Functions Called |
|---|---|
| `publishEvent()` | `insertNotificationEventDAL`, `insertNotificationRecipientsDAL`, `upsertNotificationRenderedDAL`, `insertNotificationInboxItemDAL`, `updateNotificationRecipientStatusDAL` |
| `getInboxNotifications()` | `readNotificationRecipientRowsDAL`, `readNotificationEventsByIdsDAL`, `readNotificationRenderedByRecipientIdsDAL`, `readNotificationInboxRowsByRecipientIdsDAL`, `markNotificationRecipientsSeenDAL` |
| `countUnread()` | `readNotificationRecipientIdsForUnreadDAL`, `countNotificationUnreadInboxItemsDAL` |
| `markSeen()` | `markNotificationRecipientsSeenDAL` |
| `markRead()` | `markNotificationReadDAL` |
| `dismiss()` | `dismissNotificationDAL` |
| `archive()` | `archiveNotificationDAL` |
| `configureNotificationsEngine()` | `configureNotificationsRuntimeDAL` |

#### Model

| File | Role | What it does |
|---|---|---|
| `runtime/notificationRuntime.model.js` | Model | `mapNotificationInboxRows({recipientRows, events, renderedRows, inboxRows})` — joins the 4 DB result sets into normalized notification objects. Called by the engine's `getInboxNotifications()`. |

#### Controllers that consume the engine

| File | Engine Functions Used | Notes |
|---|---|---|
| `inbox/controller/Notifications.controller.js` | `getInboxNotifications()` | Primary inbox load path |
| `inbox/controller/NotificationsHeader.controller.js` | `countUnread()`, `getInboxNotifications()` | Unread count + mark-all-seen |
| `inbox/controller/notificationsCount.controller.js` | `countUnread()` | Thin wrapper for count query |
| `publish.js` (bridge module) | `publishEvent()` | Maps legacy call shape to engine publish API |

#### Hooks

| File | Engine Functions Used (via controller or direct) | Status | Notes |
|---|---|---|---|
| `inbox/hooks/useNotificationInbox.js` | Via `getNotifications()` → `Notifications.controller.js` → `getInboxNotifications()` | LIVE | React Query, 60s stale |
| `inbox/hooks/useNotificationsHeader.js` | Via `markAllNotificationsSeen()` → `NotificationsHeader.controller.js` → `getInboxNotifications()` | LIVE | Unread count + mark-all-seen |
| `inbox/hooks/useNotiCount.js` | None directly — delegates to `useNotificationUnread()` from `bootstrap.selectors` | LIVE (thin) | Bootstrapped at app startup via polling |
| `inbox/hooks/useMarkNotificationsRead.js` | Calls `markRead()` directly from `@notifications` — **skips controller** | DEAD / VIOLATION (see RISK-6) | Zero external consumers |
| `inbox/hooks/useNotifications.js` | Via `useNotificationInbox()` | LIVE | 1-line wrapper |
| `inbox/hooks/useNotificationsInternal.js` | Via `getNotifications()` | DEAD (see RISK-5) | Zero external consumers |

#### Screens

| File | Layer | Hooks consumed |
|---|---|---|
| `screen/views/NotificationsScreenView.jsx` | View Screen | `useNotifications()`, `useNotificationsHeader()` |
| `screen/NotificationsScreen.jsx` | Final Screen | Composes `NotificationsScreenView` |

#### Cross-feature path (via adapter)

```
notifications.adapter.js
  → publish.js
    → @notifications engine (publishEvent)
      → notificationRuntime.dal.js
        (insertNotificationEventDAL, insertNotificationRecipientsDAL,
         upsertNotificationRenderedDAL, insertNotificationInboxItemDAL,
         updateNotificationRecipientStatusDAL)
```

15+ controllers across the app import from `notifications.adapter.js`. None of them touch `notificationRuntime.dal.js` directly.

#### Engine init chain

```
main.jsx
  → setup.js (features/notifications/setup.js)
    → setupVcsmNotificationsEngine()
      → configureNotificationsEngine({ supabaseClient, resolveActorCard })
        → configureNotificationsRuntimeDAL({ supabaseClient })
```

`configureNotificationsRuntimeDAL` sets the supabase client that all 16 DAL functions use internally via `getSupabaseClient()`. Engine is configured once at app startup before any render.

#### Complete chain (read path)

```
NotificationsScreen.jsx           [Final Screen — /notifications]
  → NotificationsScreenView.jsx   [View Screen]
    → useNotifications()          [Hook — wrapper]
      → useNotificationInbox()    [Hook — React Query source of truth]
        → getNotifications()      [Controller — Notifications.controller.js]
          → getInboxNotifications() [@notifications engine — runtime/index.js]
            → readNotificationRecipientRowsDAL()        [DAL]
            → readNotificationEventsByIdsDAL()          [DAL]
            → readNotificationRenderedByRecipientIdsDAL() [DAL]
            → readNotificationInboxRowsByRecipientIdsDAL() [DAL]
            → mapNotificationInboxRows()               [Model — notificationRuntime.model.js]
            → markNotificationRecipientsSeenDAL()      [DAL — autoMarkSeen]
```

---

## Additional Risk Findings from Pipeline Trace

### RISK-5 — `useNotificationsInternal.js` Has Zero External Consumers
**Severity:** MEDIUM  
**Classification:** LIKELY DEAD  
**Detail:** `useNotificationsInternal.js` uses the old useState/useEffect pattern to call `getNotifications()`. The React Query-based `useNotificationInbox.js` replaced it. `useNotificationsInternal` is imported nowhere outside of itself — confirmed zero consumers via grep.

It touches both `blocks.read.dal.js` and `senders.read.dal.js` via the controller, but the execution path is never triggered in production because no component mounts this hook.

**Recommended action:** Verify no dynamic import references. Delete `useNotificationsInternal.js` if confirmed dead.

---

### RISK-6 — `useMarkNotificationsRead.js` Has Zero External Consumers and Contains a Layer Violation
**Severity:** MEDIUM  
**Classification:** LIKELY DEAD + LAYER VIOLATION  
**Detail:** `useMarkNotificationsRead.js` exports `useMarkNotificationRead` and `useMarkAllNotificationsRead`. Both are confirmed zero-consumer — nothing in the codebase imports either hook. Additionally, both hooks call engine functions directly (`markRead()` from `@notifications` for `useMarkNotificationRead`, `markAllNotificationsSeen()` from `NotificationsHeader.controller.js` for `useMarkAllNotificationsRead`) without going through a dedicated controller — `useMarkNotificationRead` calls the engine directly from the hook layer, bypassing the controller.

Per contract: Hooks must call Controllers; Controllers call the engine/DAL.

**Recommended action:** Verify no dynamic import references. Delete the file if confirmed dead.

---

### RISK-7 — `useUnreadBadge.js` Is Misattributed and Has Zero Consumers
**Severity:** LOW  
**Classification:** MISATTRIBUTED / LIKELY DEAD  
**Detail:** `useUnreadBadge.js` is listed in the Architecture Pipeline as a notification hook but it queries **chat unread count** via `useChatUnreadOps()`. It has zero connection to any notifications DAL, controller, or engine. No external consumers detected.

**Recommended action:** Either move to the chat feature or delete if confirmed unused.

---

### RISK-8 — `inboxUnread.controller.js` Is a Chat Re-Export Shim in the Wrong Feature
**Severity:** LOW  
**Classification:** MISPLACED  
**Detail:** `inboxUnread.controller.js` contains one line:
```js
export { getChatInboxUnreadBadgeCount, getInboxUnreadBadgeCount } from '@/features/chat/inbox/controller/chatUnread.controller'
```
It contains no notifications logic. Dev diagnostics (`notificationsFeature.group.js`) bypasses this shim and imports directly from the chat controller. Nothing in production code imports from `inboxUnread.controller.js`.

**Recommended action:** Delete. Update dev diagnostics import if needed.

---

### RISK-9 — Domain Transforms in `lib/` Files Instead of `model/`
**Severity:** LOW  
**Classification:** LAYER VIOLATION  
**Detail:** Two `lib/` files contain domain transform logic that belongs in the `model/` layer per contract:

1. `inbox/lib/blockFilter.js` — converts raw DB block rows to Sets. This is a domain transform (raw rows → typed domain structure).
2. `inbox/lib/resolveSenders.js` — contains `mapSummaryRowToSender()`, a full actor-row-to-sender-object mapper. This is a domain transform.

Both functions are pure (no side effects, no DB access), but they live in `lib/` rather than `model/`. The actual `notification.model.js` handles the final notification mapping but has no visibility into the sender resolution or block set construction logic.

**Recommended action:** Move `mapSummaryRowToSender()` to `notification.model.js`. Consider moving `loadBlockSets` shape construction into a model function as well. Keep `filterByBlocks()` as a utility in `lib/` (it operates on arbitrary data, not a domain shape).

---

# Avengers Assembly Report — 2026-05-11

## Run Summary

| Field | Value |
|---|---|
| Date | 2026-05-11 |
| Triggered by | `/AvengersAssemble` with argument `vcsm.dal.notifications.md` |
| Application Scope | VCSM |
| Document Scope | `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.notifications.md` |
| Release Scope | Notifications feature — DAL, engine integration, adapter boundary, pipeline integrity |
| Boundary Contract | PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — ENFORCED |
| Specialist Passes | ARCHITECT / IRONMAN / VENOM / SENTRY / LOKI / KRAVEN / CARNAGE / FALCON / WINTER SOLDIER / LOGAN / review-contract / SHIELD |

---

## Governance Evidence Registry

| Command | Status | Latest Report | Drift | Blocking |
|---|---|---|---|---|
| ARCHITECT | PRESENT (inline 2026-05-11) | This document — ARCHITECT Pipeline Trace section | YES — Architecture Pipeline incomplete, path error in RISK-2 | NO |
| IRONMAN | MISSING | None for notifications feature | — 9 open risks need ownership assignment | NO |
| VENOM | STALE | `vcsm-security-report.md` (2026-04-13) | PARTIAL — notifications block filter trust boundary not in report | NO |
| SENTRY | MISSING | None for notifications feature | — 9 pending reviews routed to SENTRY | NO |
| LOKI | MISSING | None for notifications feature | — | NO |
| KRAVEN | MISSING | None specific to notifications | — | NO |
| CARNAGE | N/A | — | N/A — no pending migrations | NO |
| FALCON | MISSING | None for notifications feature | — Native notification parity unconfirmed | YES |
| WINTER SOLDIER | N/A | — | N/A — Android scope not active | NO |
| LOGAN | PRESENT (inline 2026-05-11) | This document | YES — 4 new drift findings | NO |
| review-contract | PRESENT (inline this session) | — | YES — RISK-6 (direct engine call from hook) + RISK-9 (model logic in lib/) | NO |
| SHIELD | N/A | — | N/A | NO |

---

## Module Alignment Matrix

| Module | Architecture | Ownership | Security | Runtime | Performance | Native | Docs | Release Status |
|---|---|---|---|---|---|---|---|---|
| notifications — DAL layer | ALIGNED | MISSING | PARTIAL | MISSING | N/A | MISSING | ALIGNED | CAUTION |
| notifications — engine integration | ALIGNED | MISSING | PARTIAL | MISSING | N/A | MISSING | ALIGNED | CAUTION |
| notifications — adapter boundary | ALIGNED | MISSING | ALIGNED | MISSING | N/A | MISSING | ALIGNED | CAUTION |
| notifications — inbox pipeline | DRIFT | MISSING | N/A | MISSING | N/A | MISSING | DRIFT | CAUTION |
| notifications — types/follow (FollowRequestItem) | ALIGNED | MISSING | N/A | MISSING | N/A | MISSING | DRIFT (wrong path in doc) | CAUTION |
| notifications — dead code cluster | N/A | MISSING | N/A | N/A | N/A | N/A | CONFIRMED OPEN | CAUTION |

---

## ARCHITECT

**Status: DRIFT FOUND**

Findings:

1. **Architecture Pipeline is incomplete — `inbox/ui/` folder undocumented.** Live scan finds three view files in `inbox/ui/` not present in the Architecture Pipeline: `NotificationItem.view.jsx`, `Notifications.view.jsx`, `NotificationsHeader.view.jsx`. These exist alongside the documented `screen/views/` layer. Their role (component vs view screen) is unverified in this pass.

2. **Architecture Pipeline is incomplete — `types/` folder has 13+ undocumented type-specific view files.** The pipeline lists only `NotificationCard.jsx` under Component. But 13 additional type views exist across `types/booking/` (3 files), `types/comment/` (3 files), `types/follow/` (3 files), `types/mention/` (1 file), `types/reaction/` (3 files), `types/review/` (1 file), `types/team/` (1 file). None of these are in the Architecture Pipeline. The Architecture Pipeline section of this document omits this entire type-dispatch layer.

3. **`inbox/realtime/badgeSubscriptions.js` is undocumented.** Exists at this path but is not mentioned anywhere in the document — not in the Architecture Pipeline, not in call chains, not in risk findings. Its role (presumably realtime subscription management for the badge count) is unknown from this scan.

4. **`inbox/lib/resolveInboxActor.js` is undocumented.** Exists and has two unguarded console violations (`console.error` at line 34, `console.warn` at line 53) that are listed in RISK-2. But the file itself does not appear in the Architecture Pipeline or lib utilities section. It is a completely undocumented lib file.

5. **RISK-2 has a wrong file path.** The document states the FollowRequestItem console violations are in `screen/views/FollowRequestItem.view.jsx`. Live scan confirms the actual path is `features/notifications/types/follow/FollowRequestItem.view.jsx`. These are different directories.

6. **`notificationRuntime.dal.js` schema name not documented.** All 15 runtime DAL queries use `.schema('notification')` (singular). The document mentions tables `recipients`, `inbox_items`, `events`, `rendered` but never states the schema name. The correct schema is `notification` (singular — not `notifications`).

7. **`senders.read.dal.js` — `listProfileRowsByIdsDAL` has no explicit schema prefix.** Queries `profiles` table with no `.schema()` call — uses the default `public` schema. This is intentional (profiles live in public) but is not noted in the document.

8. **`vportClient` dependency in `senders.read.dal.js` is undocumented.** `listVportRowsByIdsDAL` uses a `vportSchema` imported from `@/services/supabase/vportClient` — a separate Supabase client. This is an undocumented external dependency with distinct RLS and schema implications.

9. **Dev diagnostics adapter bypass.** `dev/diagnostics/groups/notificationsFeature.group.js:13` imports `getUnreadNotificationCount` directly from `@/features/notifications/inbox/controller/notificationsCount.controller` — bypassing the adapter. This is a diagnostics file (non-production) but the bypass is undocumented.

10. **All RISK-1 through RISK-9 confirmed open.** All nine original risk findings verified against live code. None are resolved.

---

## IRONMAN

**Status: EVIDENCE MISSING**

Findings:

- No IRONMAN ownership report for the notifications feature.
- Eight dead/misplaced files require deletion decisions before release:
  - RISK-1: `screen/views/NotiViewPostScreen.jsx` — confirmed zero callers, delete candidate
  - RISK-5: `useNotificationsInternal.js` — confirmed zero callers, delete candidate
  - RISK-6: `useMarkNotificationsRead.js` — confirmed zero callers, delete candidate
  - RISK-7: `useUnreadBadge.js` — confirmed zero callers, delete candidate
  - RISK-8: `inboxUnread.controller.js` — confirmed zero callers, delete candidate
- Three files are undocumented with unknown ownership (`badgeSubscriptions.js`, `resolveInboxActor.js`, `inbox/ui/` layer). IRONMAN must assign owners before any deletion decisions.
- The 13+ type-specific view files in `types/` have no documented ownership.

---

## VENOM

**Status: PARTIAL — STALE REPORT**

Findings:

- Latest VENOM report: `vcsm-security-report.md` dated 2026-04-13. Does not specifically address the notifications block filter trust boundary.
- **Block filter trust boundary — ALIGNED.** `blocks.read.dal.js` uses `.schema("moderation")` correctly. Both `listBlockedActorRowsDAL` and `listBlockingActorRowsDAL` filter by `status = 'active'`. `blockFilter.js` builds bidirectional Sets (`iBlocked`, `blockedMe`), and `filterByBlocks` removes actors appearing in either set. This matches the canonical block system behavior. Block filtering in notifications correctly gates both directions.
- **Adapter boundary — CLEAN in production.** Zero external features bypass the notifications adapter in production paths. All 18+ consumers use `publishVcsmNotification`, `publishVcsmNotificationBatch`, or `getUnreadNotificationCount` through `notifications.adapter.js`.
- **Engine DI chain — CLEAN.** `configureNotificationsEngine` is called once at app startup via `main.jsx → setup.js`. Guard `_configured` prevents double-initialization. DAL functions access Supabase only after `configureNotificationsRuntimeDAL` is called.
- **`vportClient` in senders DAL — REQUIRES REVIEW.** `listVportRowsByIdsDAL` uses a separate Supabase client (`vportSchema` from `@/services/supabase/vportClient`). VENOM should verify this client's RLS posture and confirm it does not bypass row-level security protections that the main client enforces.
- **Unguarded `console.error` in `publish.js:80` — LOW security concern.** Can leak error payloads to browser console in production. Severity is low (no secrets, just error message strings) but violates the debug logging policy.
- **RISK-6 layer violation (hook calling engine directly)** — `useMarkNotificationRead` calls `markRead()` from `@notifications` directly. This is a dead hook, but if ever activated, it bypasses the controller layer which could mean ownership/permission checks are skipped. The controller should be the only entry point to engine write functions.

---

## SENTRY

**Status: EVIDENCE MISSING**

Findings:

- No SENTRY boundary report for notifications.
- Nine pending reviews from the document are routed to SENTRY. All confirmed open:
  - **RISK-1** — Delete `screen/views/NotiViewPostScreen.jsx` (confirmed dead)
  - **RISK-2** — Remove 6 unguarded console violations across 5 files (confirmed still present): `publish.js:80`, `Notifications.controller.js:56`, `resolveInboxActor.js:34,53`, `useNotificationInbox.js:52,54,63,86`, `FollowRequestItem.view.jsx:23,72,89`
  - **RISK-3** — Move View Screens from `screen/views/` to `ui/` per contract
  - **RISK-5** — Delete `useNotificationsInternal.js` (confirmed dead)
  - **RISK-6** — Delete `useMarkNotificationsRead.js` (confirmed dead, contains layer violation)
  - **RISK-7** — Delete or move `useUnreadBadge.js` to chat feature (confirmed dead)
  - **RISK-8** — Delete `inboxUnread.controller.js` (confirmed dead shim)
  - **RISK-9** — Move `mapSummaryRowToSender()` to `notification.model.js`
  - **RISK-4** — Assign per-function table/RPC attribution audit to ARCHITECT

---

## LOKI

**Status: MISSING**

No runtime evidence for the notifications feature. Given the complexity of this feature (engine-backed, React Query, realtime subscriptions, 60s stale time, refetchInterval), LOKI evidence is more valuable here than for simpler features. Recommended checks:
- Verify `getInboxNotifications()` resolves within acceptable latency on first load
- Verify the 60s stale time and `refetchInterval` in `useNotificationInbox` do not cause visible stale states
- Verify `configureNotificationsEngine` completes before the `/notifications` route is reachable
- Verify `badgeSubscriptions.js` realtime channel lifecycle (connect, disconnect, reconnect)

---

## KRAVEN

**Status: MISSING**

No performance report for notifications. High-value checks for this feature:
- `resolveSenders()` three-tier waterfall resolution — worst case hits 4 separate Supabase queries per notification load (`listActorSummaryRowsByIdsDAL` → `listActorPresentationRowsByIdsDAL` → `listActorIdentityRowsByIdsDAL` + `listProfileRowsByIdsDAL` + `listVportRowsByIdsDAL` in parallel). For users with many notifications from diverse actors, this can be expensive.
- `getInboxNotifications()` executes 5 DAL calls in sequence/parallel — `readNotificationRecipientRowsDAL`, `readNotificationEventsByIdsDAL`, `readNotificationRenderedByRecipientIdsDAL`, `readNotificationInboxRowsByRecipientIdsDAL`, `markNotificationRecipientsSeenDAL`. No caching at the DAL level.
- `countUnread()` hits two DAL functions — called every `refetchInterval`. Frequency and cost should be verified.

---

## CARNAGE

**Status: N/A**

No pending migrations for the notifications feature at this time. The `notification` schema (singular) with tables `recipients`, `inbox_items`, `events`, `rendered` is stable. No migration risk in current scope.

---

## FALCON

**Status: MISSING — RECOMMENDED BEFORE RELEASE**

No Falcon review for the notifications feature. Notifications is a primary app surface (bottom nav tab). Native notification delivery, badge counts, inbox rendering, and block filtering all require parity with the web implementation. The notifications engine (`@notifications`) provides the same backend for both surfaces — Falcon must verify the native consumption layer is correct.

Key native parity concerns:
- Unread badge count polling (native vs web polling strategy)
- Inbox rendering (notification type dispatch — 13+ type-specific views in `types/`)
- Block filtering (bidirectional enforcement in native inbox)
- Realtime badge subscriptions (`badgeSubscriptions.js` — native equivalent?)
- Mark-seen / mark-read interactions

Not marking as BLOCKING because the feature is fully live on web and any native gaps are isolated to the native surface. Falcon review recommended before next native release.

---

## WINTER SOLDIER

**Status: N/A**

Android scope not active.

---

## LOGAN

**Status: DRIFT FOUND**

Findings:

- **Architecture Pipeline section — MAJOR DRIFT.** The pipeline lists a simplified layer inventory that omits the entire `inbox/ui/` view layer (3 files), the entire `types/` dispatch layer (13+ files), `inbox/realtime/badgeSubscriptions.js`, and `inbox/lib/resolveInboxActor.js`. The pipeline is approximately 40% complete relative to the actual file count.
- **RISK-2 file path error.** The document lists console violations in `screen/views/FollowRequestItem.view.jsx`. The actual path is `types/follow/FollowRequestItem.view.jsx`. These are different directories.
- **`notification` schema name not documented.** The runtime DAL section never states the schema name. The live code uses `.schema('notification')` (singular) on all 15 runtime table queries.
- **`vportClient` dependency undocumented.** `senders.read.dal.js` uses a separate Supabase client for VPort lookups — not mentioned in the DAL files section.
- **RISK-1 through RISK-9 — confirmed open.** All nine risk findings from the ARCHITECT Pipeline Trace are verified against live code. None are resolved. Documentation of the risks is accurate.
- **Call chains — ALIGNED.** All three documented call chains (`blocks.read.dal.js`, `senders.read.dal.js`, `notificationRuntime.dal.js`) are verified against live code. The corrected chains are accurate.
- **Two-tier architecture — ALIGNED.** Engine initialization, adapter boundary, and publish bridge all match live code.
- **Pending Reviews table — CONFIRMED.** All 9 items are still open. None have been resolved.

---

## review-contract

**Status: ALIGNED WITH ACTIVE VIOLATIONS**

Findings:

- **TypeScript:** ZERO `.ts`/`.tsx` files in `features/notifications/`. CLEAN.
- **`select('*')`:** ZERO violations across all notifications DAL files. CLEAN.
- **Schema prefixes:** `blocks.read.dal.js` — `.schema("moderation")`. `senders.read.dal.js` — `.schema("vc")` for actors, no prefix for `profiles` (intentional public schema). `notificationRuntime.dal.js` — `.schema('notification')` on all 15 queries. CLEAN.
- **Path aliases:** All cross-folder imports use `@/`. CLEAN.
- **Adapter boundary (production):** All external consumers use `notifications.adapter.js`. CLEAN.
- **File lengths:** Not individually measured in this pass. ARCHITECT Pipeline Trace section suggests some files may be complex — SENTRY should verify during cleanup pass.

**Active violations:**

- **RISK-6 — LAYER VIOLATION (dead but present).** `useMarkNotificationsRead.js` calls `markRead()` from `@notifications` directly from the hook layer, bypassing the controller. Per contract: Hooks → Controllers → Engine/DAL. The hook bypasses the controller. File is dead (zero consumers) but the pattern must not be replicated.
- **RISK-9 — LAYER VIOLATION.** `mapSummaryRowToSender()` in `inbox/lib/resolveSenders.js` is a domain transform that belongs in `notification.model.js`. Domain transforms must live in the model layer, not `lib/` utilities.
- **RISK-8 — CROSS-FEATURE SHIM IN WRONG FEATURE.** `inboxUnread.controller.js` re-exports functions from the chat feature's controller. A notifications controller file must not re-export chat feature functions. This is a feature boundary violation.

---

## SHIELD

**Status: N/A**

No external dependencies, third-party libraries, or license concerns. Supabase engine is internal infrastructure. No IP or provenance review required.

---

## Cross-System Contradictions

| System A | System B | Contradiction | Severity | Recommended Resolution |
|---|---|---|---|---|
| LOGAN (Architecture Pipeline — 8 layer files listed) | ARCHITECT (live scan — 50+ files in feature) | Pipeline documents ~8 layer files; live feature has 50 files across 10+ subdirectories | MODERATE | Full Architecture Pipeline rewrite — add `inbox/ui/`, `types/` dispatch layer, `inbox/realtime/`, `resolveInboxActor.js` |
| LOGAN (RISK-2: `screen/views/FollowRequestItem.view.jsx`) | ARCHITECT (live scan: `types/follow/FollowRequestItem.view.jsx`) | Document names the wrong path for FollowRequestItem console violations | LOW | Correct RISK-2 file path in document |
| VENOM (April 2026 report — no notifications block filter review) | LOGAN (block filter is safety-critical for notification visibility) | Security report predates current audit; block filter trust boundary has never been formally reviewed by VENOM | MODERATE | VENOM focused re-run on notifications block filter + vportClient RLS posture |
| review-contract (RISK-6: dead hook with layer violation) | SENTRY (not yet run) | Contract flags violation; no SENTRY boundary audit to gate cleanup | MODERATE | SENTRY must review before deletion — confirm no dynamic imports of dead hooks |

---

## Runtime Alignment Review

| Area | Runtime Evidence | Performance Risk | Migration Risk | Status |
|---|---|---|---|---|
| `getInboxNotifications()` — 5 DAL calls | MISSING | MEDIUM — no DAL-level cache, 60s stale React Query | NONE | CAUTION |
| `resolveSenders()` — 3-tier waterfall | MISSING | MEDIUM — up to 4 Supabase round trips per load | NONE | CAUTION |
| `blockFilter.loadBlockSets()` | MISSING | LOW — 2 parallel queries, infrequent | NONE | CAUTION |
| `countUnread()` — badge polling | MISSING | LOW — 2 DAL calls per poll interval | NONE | CAUTION |
| Engine init (`configureNotificationsEngine`) | PRESENT — main.jsx startup | LOW | NONE | ALIGNED |
| `badgeSubscriptions.js` realtime channel | MISSING | UNKNOWN — undocumented | NONE | UNKNOWN |

---

## Ownership / Boundary Alignment

| Area | Ownership Status | Boundary Status | Contract Status | Risk |
|---|---|---|---|---|
| `notifications.adapter.js` | UNDECLARED | CLEAN — correct adapter surface | ALIGNED | LOW |
| `notificationRuntime.dal.js` | UNDECLARED | CLEAN — engine-encapsulated | ALIGNED | LOW |
| `blocks.read.dal.js` | UNDECLARED | CLEAN — internal to notifications | ALIGNED | LOW |
| `senders.read.dal.js` | UNDECLARED | CLEAN — internal to notifications | CONCERN (`vportClient` undocumented) | LOW |
| `useMarkNotificationsRead.js` | UNDECLARED | N/A (dead) | VIOLATION (layer: hook → engine) | LOW (dead) |
| `inboxUnread.controller.js` | UNDECLARED | VIOLATION — chat re-export in wrong feature | VIOLATION (misplaced) | LOW |
| `inbox/ui/` layer | UNDECLARED | UNKNOWN | UNDOCUMENTED | MODERATE |
| `types/` dispatch layer (13+ files) | UNDECLARED | UNKNOWN | UNDOCUMENTED | MODERATE |
| `badgeSubscriptions.js` | UNDECLARED | UNKNOWN | UNDOCUMENTED | MODERATE |

---

## Native Governance Status

| Module | Falcon | Winter Soldier | Drift | Release Risk |
|---|---|---|---|---|
| Notifications inbox | MISSING | N/A | UNKNOWN | MODERATE |
| Unread badge count | MISSING | N/A | UNKNOWN | MODERATE |
| Block filtering in inbox | MISSING | N/A | UNKNOWN | MODERATE |
| Notification type rendering (13+ types) | MISSING | N/A | UNKNOWN | MODERATE |
| Realtime badge subscription | MISSING | N/A | UNKNOWN | HIGH |

---

## Documentation Truth Review

| Doc / System | Truth Status | Drift | Native Notes | Blocking |
|---|---|---|---|---|
| `vcsm.dal.notifications.md` — DAL files section | VERIFIED | NONE — 3 DAL files confirmed correct | N/A | NO |
| `vcsm.dal.notifications.md` — Tables Accessed | VERIFIED | NONE — tables confirmed (schema name gap) | N/A | NO |
| `vcsm.dal.notifications.md` — Architecture Pipeline | MAJOR DRIFT | `inbox/ui/`, `types/` dispatch, `badgeSubscriptions.js`, `resolveInboxActor.js` all missing | N/A | NO |
| `vcsm.dal.notifications.md` — RISK-2 file path | DRIFT | `screen/views/FollowRequestItem.view.jsx` should be `types/follow/FollowRequestItem.view.jsx` | N/A | NO |
| `vcsm.dal.notifications.md` — RISK-1 through RISK-9 | VERIFIED | All confirmed open | N/A | NO |
| `vcsm.dal.notifications.md` — Call chains | VERIFIED | All corrected chains confirmed accurate | N/A | NO |
| `vcsm.dal.notifications.md` — Two-tier architecture | VERIFIED | Engine init, adapter, publish bridge all confirmed | N/A | NO |
| `notificationRuntime.dal.js` schema name | NOT DOCUMENTED | Schema is `notification` (singular) — never stated | N/A | NO |
| `vportClient` dependency | NOT DOCUMENTED | `senders.read.dal.js` uses separate vport client | N/A | NO |

---

## IP / Provenance Alignment

| Area | IP Status | License Risk | Provenance Risk | Blocking |
|---|---|---|---|---|
| Notifications feature code | CLEAN | NONE | NONE | NO |
| `@notifications` engine | CLEAN | NONE | NONE | NO |
| `@tanstack/react-query` (used in hooks) | CLEAN | MIT license | NONE | NO |

---

## New Risk Register (additions to document risks)

The following risks were found during this pass and are not in the original document:

**RISK-10 — Architecture Pipeline is missing the `inbox/ui/` view layer**
Severity: LOW
Detail: `inbox/ui/NotificationItem.view.jsx`, `inbox/ui/Notifications.view.jsx`, `inbox/ui/NotificationsHeader.view.jsx` exist and are not documented in the Architecture Pipeline. Their layer classification (component vs view screen) is unverified. They appear to be the actual inbox UI composition layer.
Handoff: ARCHITECT (full pipeline rewrite)

**RISK-11 — Architecture Pipeline is missing the `types/` notification dispatch layer**
Severity: MODERATE
Detail: 13 type-specific notification view files in `types/booking/`, `types/comment/`, `types/follow/`, `types/mention/`, `types/reaction/`, `types/review/`, `types/team/` are entirely absent from the Architecture Pipeline. `NotificationCard.jsx` is listed as the only component, but these type views are the actual rendering dispatch mechanism. The Architecture Pipeline section does not describe how notification types are resolved to view files.
Handoff: ARCHITECT (full pipeline rewrite)

**RISK-12 — `inbox/realtime/badgeSubscriptions.js`** ~~completely undocumented~~
Severity: ~~MODERATE~~ → **INFO** (2026-05-19 CEREBRO pass — deescalated)
Detail: File contains two explicit noop functions (`subscribeInboxBadge`, `subscribeNotificationBadge`) — neither opens any Supabase Realtime channel. Neither function is imported or called anywhere in the codebase (zero consumers confirmed by grep). Badge freshness is owned entirely by React Query polling and the `noti:refresh` custom event. File is a placeholder for future realtime support. No open connections, no lifecycle risk. **DELETE CANDIDATE** — see CF-2.
Handoff: ~~ARCHITECT + LOKI~~ → SENTRY (delete approval)

**RISK-13 — `inbox/lib/resolveInboxActor.js` is completely undocumented**
Severity: LOW
Detail: File exists and has two unguarded console violations (listed in RISK-2) but is not present in the Architecture Pipeline or lib section. Its purpose and callers are undocumented.
Handoff: ARCHITECT

**RISK-14 — RISK-2 file path error: `FollowRequestItem.view.jsx` wrong directory**
Severity: LOW
Detail: RISK-2 table lists `screen/views/FollowRequestItem.view.jsx`. Actual path is `types/follow/FollowRequestItem.view.jsx`. This path error means SENTRY may look in the wrong location when acting on the remediation.
Handoff: LOGAN (doc correction)

**RISK-15 — `notificationRuntime.dal.js` schema name undocumented**
Severity: LOW
Detail: All 15 runtime DAL queries use `.schema('notification')` (singular). The document section on Tables Accessed and RPCs Called never states the schema name. Any developer consulting this doc to query the tables directly would be missing a critical detail.
Handoff: LOGAN (doc correction)

**RISK-16 — `vportClient` in `senders.read.dal.js`** ~~undocumented~~
Severity: LOW → **RESOLVED** (2026-05-19 VENOM + LOKI pass)
Detail: `listVportRowsByIdsDAL` uses `vportSchema` from `@/services/supabase/vportClient`. VENOM inspection confirmed: `vportClient.js` is `supabase.schema('vport')` — it is the **same** Supabase client instance with a schema accessor, not a separate client with distinct RLS. The same authenticated user session governs all schema-qualified queries. No separate RLS posture, no distinct auth context. Security concern withdrawn.
Handoff: ~~VENOM + LOGAN~~ → No action required. Document the schema relationship for clarity.

---

## Proposed Updates

No `.v2.md` files created in this pass (per user instruction — results appended to document only).

Items that warrant document correction when approved:
- RISK-2 table: correct `screen/views/FollowRequestItem.view.jsx` → `types/follow/FollowRequestItem.view.jsx`
- Architecture Pipeline section: add `inbox/ui/` layer, `types/` dispatch layer, `badgeSubscriptions.js`, `resolveInboxActor.js`
- DAL files section: add schema name (`notification`) to `notificationRuntime.dal.js` description
- DAL files section: document `vportClient` dependency in `senders.read.dal.js`
- Pending Reviews table: add RISK-10 through RISK-16

---

## Release Intelligence Summary

| Area | Status | Blocking Risk | Recommended Command |
|---|---|---|---|
| Architecture | DRIFT FOUND | NO | ARCHITECT — full pipeline rewrite for notifications |
| Ownership | MISSING | NO | IRONMAN — notifications feature audit, 9 dead files |
| Security | PARTIAL | NO | VENOM — block filter + vportClient RLS audit |
| Runtime | MISSING | NO | LOKI — inbox load, badge subscription lifecycle |
| Performance | MISSING | NO | KRAVEN — sender resolution waterfall + inbox load cost |
| Migration | N/A | NO | — |
| iOS Parity | MISSING | NO (but recommended) | FALCON — before next native release |
| Android Parity | N/A | NO | — |
| Documentation | DRIFT FOUND | NO | LOGAN — correct RISK-2 path + add new risks + schema name |
| IP Safety | CLEAN | NO | — |

---

## Overall Status

**DRIFT FOUND**

The notifications DAL documentation is accurate for all documented content — the three DAL files, call chains, two-tier architecture, and RISK-1 through RISK-9 are all verified against live code. However, the Architecture Pipeline section is substantially incomplete, omitting the `inbox/ui/` view layer, the entire `types/` notification dispatch layer (13+ files), `badgeSubscriptions.js`, and `resolveInboxActor.js`. RISK-2 contains a wrong file path. The `notification` schema name and `vportClient` dependency are undocumented.

**No code bugs, security violations, or production blockers found. Drift is concentrated in documentation completeness and open dead-code cleanup tasks.** Nine risks remain open, all correctly documented and routed to SENTRY. Seven new documentation risks (RISK-10 through RISK-16) surfaced in this pass.

Falcon review is recommended before the next native release — notifications is a primary bottom-nav surface and native parity has not been audited.

## Recommended Next Command

```
ARCHITECT — full pipeline rewrite: add inbox/ui/, types/ dispatch layer, badgeSubscriptions.js, resolveInboxActor.js
SENTRY    — RISK-1 through RISK-9 cleanup (delete dead files, remove console violations)
VENOM     — focused re-run: block filter trust boundary + vportClient RLS posture
LOKI      — runtime trace: inbox load, badgeSubscriptions lifecycle, engine init timing
KRAVEN    — sender resolution waterfall cost + inbox DAL query count
IRONMAN   — ownership assignment for 13+ type files, 3 inbox/ui files, badgeSubscriptions
FALCON    — before next native release (bottom-nav primary surface)
```

---

## Codex Fix Pass — 2026-05-11

### Files Changed
| File | Change |
|---|---|
| `apps/VCSM/src/features/notifications/types/follow/FollowRequestItem.view.jsx` | DEV-gated the remaining unguarded follow-request error logs. |
| `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.notifications.md` | Appended this fix-pass record. |

### Findings Addressed
| Finding | Status | Notes |
|---|---|---|
| RISK-2: unguarded console logs/errors across notifications | PARTIAL | `publish.js`, `Notifications.controller.js`, `resolveInboxActor.js`, and `useNotificationInbox.js` were already DEV-gated in current code. This pass DEV-gated the remaining unguarded logs in `types/follow/FollowRequestItem.view.jsx`. |
| RISK-1: duplicate `NotiViewPostScreen.jsx` stale view file | DEFERRED | Requires deletion after ownership confirmation; no deletion performed under current no-delete instruction. |
| RISK-3: move View Screens to `ui/` | DEFERRED | Folder move is broader than a surgical DAL fix and needs SENTRY approval. |
| RISK-5/RISK-6/RISK-7/RISK-8: dead hooks/controllers/shims | DEFERRED | No deletion performed; still needs SENTRY/IRONMAN verification for dynamic imports and disposition. |
| RISK-9: `mapSummaryRowToSender()` belongs in model | DEFERRED | Refactor could affect sender normalization behavior; left for SENTRY/ARCHITECT cleanup. |
| RISK-10 through RISK-16 documentation drift | DOCUMENTED | Verified schema name, `vportClient`, `inbox/ui`, `types/`, `resolveInboxActor`, and route path evidence; prior sections preserved under append-only instruction. |

### Verification
- Commands/searches run:
  - `rg -n "console\.(log|error|warn)|useNotificationsInternal|useMarkNotificationRead|useMarkAllNotificationsRead|useUnreadBadge|inboxUnread|mapSummaryRowToSender|vportClient|schema\('notification'\)|schema\(\"notification\"\)" apps/VCSM/src/features/notifications --glob '*.js' --glob '*.jsx'`
  - `rg -n "NotiViewPostScreen|badgeSubscriptions|resolveInboxActor|NotificationItem\.view|NotificationsHeader\.view|types/.+\.view" apps/VCSM/src/features/notifications apps/VCSM/src/app --glob '*.js' --glob '*.jsx'`
  - `sed -n '1,120p' apps/VCSM/src/features/notifications/publish.js`
  - `sed -n '1,110p' apps/VCSM/src/features/notifications/inbox/controller/Notifications.controller.js`
  - `sed -n '1,90p' apps/VCSM/src/features/notifications/inbox/lib/resolveInboxActor.js`
  - `sed -n '1,120p' apps/VCSM/src/features/notifications/inbox/hooks/useNotificationInbox.js`
  - `sed -n '1,130p' apps/VCSM/src/features/notifications/types/follow/FollowRequestItem.view.jsx`
  - `npm run build`
- Production callers checked:
  - `apps/VCSM/src/features/notifications/screen/NotificationsScreen.jsx`
  - `apps/VCSM/src/features/notifications/screen/views/NotificationsScreenView.jsx`
  - `apps/VCSM/src/features/notifications/inbox/controller/Notifications.controller.js`
  - `apps/VCSM/src/features/notifications/inbox/hooks/useNotificationInbox.js`
  - `apps/VCSM/src/features/notifications/inbox/ui/NotificationItem.view.jsx`
  - `apps/VCSM/src/features/notifications/types/follow/FollowRequestItem.view.jsx`
  - `apps/VCSM/src/app/routes/protected/app.routes.jsx`
  - `apps/VCSM/src/app/routes/lazyApp.jsx`
- Remaining risks:
  - Dead hooks/controllers/files remain untouched pending SENTRY/IRONMAN.
  - Full pipeline documentation remains incomplete for `inbox/ui`, `types`, `badgeSubscriptions.js`, and `resolveInboxActor.js`.
  - VENOM still needs to review notification block filtering and `vportClient` RLS posture.
  - LOKI/KRAVEN/FALCON reviews remain recommended for runtime, performance, and native parity.
  - Build passes; Vite still reports the pre-existing auth adapter dynamic/static import chunk warning for `VerifyEmailRequiredScreen.jsx`.

### Status
PARTIAL

---

# CEREBRO Classification Pass — 2026-05-19

_Appended:_ 2026-05-19  
_Triggered by:_ `/Cerebro` with target `vcsm.dal.notifications.md`  
_Source:_ Live source reads + grep verification across all notifications feature files  
_Prior state:_ AvengersAssemble 2026-05-11 + Codex Fix Pass 2026-05-11  

---

## Step 1 — Document Read

Full document read completed. Prior passes on record: ARCHITECT (inline), AvengersAssemble (2026-05-11), Codex Fix Pass (2026-05-11, PARTIAL). All prior risk findings (RISK-1 through RISK-16) and all command evidence reviewed.

---

## Step 2 — CEREBRO Risk Classification

### Risk Inventory (complete)

| Risk | Type | Severity | Prior Status | Verified Status (this pass) |
|---|---|---|---|---|
| RISK-1 | Stale File (dead duplicate) | MEDIUM | OPEN | CONFIRMED DEAD — zero router references |
| RISK-2 | Policy Violation (console) | MEDIUM | PARTIAL (Codex pass) | **FULLY RESOLVED** — all console calls DEV-gated |
| RISK-3 | Architecture Organization | LOW | OPEN | OPEN |
| RISK-4 | Doc Correction (scan artifact) | LOW | DOC ONLY | DOC ONLY — no code change needed |
| RISK-5 | Dead Code | MEDIUM | OPEN | CONFIRMED DEAD — zero external consumers |
| RISK-6 | Dead Code + Layer Violation | MEDIUM | OPEN | CONFIRMED DEAD — zero external consumers; layer violation present |
| RISK-7 | Dead Code + Misattributed | LOW | OPEN | CONFIRMED DEAD — zero external consumers |
| RISK-8 | Misplaced + Feature Boundary | LOW | OPEN | CONFIRMED DEAD — zero external consumers |
| RISK-9 | Layer Violation | LOW | OPEN | OPEN |
| RISK-10 | Architecture Pipeline Drift | LOW | OPEN | OPEN |
| RISK-11 | Architecture Pipeline Drift | MODERATE | OPEN | OPEN |
| RISK-12 | Undocumented Runtime | MODERATE | OPEN | **DEESCALATED → INFO** — noops + never called |
| RISK-13 | Undocumented Lib File | LOW | OPEN | ACTIVE (called by controller) — doc only |
| RISK-14 | Doc Error (wrong path) | LOW | OPEN | OPEN |
| RISK-15 | Doc Missing Schema Name | LOW | OPEN | OPEN — schema confirmed as `notification` (singular) |
| RISK-16 | Security/Doc (vportClient) | LOW | OPEN | **DEESCALATED** — same Supabase client, no separate auth |

### New Findings (this CEREBRO pass)

| ID | Finding | Severity | Action |
|---|---|---|---|
| CF-1 | RISK-2 is FULLY RESOLVED — all console violations are DEV-gated (Codex pass + prior code) | INFO | Update doc status |
| CF-2 | `badgeSubscriptions.js` is double-inert — noops AND zero callers in codebase | INFO | RISK-12 deescalated; file is delete candidate or documented placeholder |
| CF-3 | `vportClient.js` is `supabase.schema('vport')` on the same client — not a separate auth context | INFO | RISK-16 security concern withdrawn; doc correction only |
| CF-4 | `resolveInboxActor.js` is ACTIVE — called by `Notifications.controller.js` and dev diagnostics | INFO | RISK-13 is doc-only (not dead code) |
| CF-5 | `notificationRuntime.dal.js` is exactly 300 lines — at contract limit | WARNING | Any addition will breach the 300-line rule — plan a split |
| CF-6 | `runtime/index.js` is 299 lines — one line below limit | WARNING | Monitor; next addition likely breaches limit |
| CF-7 | `inboxUnread.controller.js` — confirmed zero imports outside its own file | INFO | Confirmed delete candidate (RISK-8) |
| CF-8 | `useMarkNotificationsRead.js` — confirmed zero imports; console logs are DEV-gated | INFO | Confirmed delete candidate (RISK-6); DEV logs not a violation |
| CF-9 | `screen/views/NotiViewPostScreen.jsx` — confirmed zero router references | INFO | Confirmed delete candidate (RISK-1) |

---

## Step 3 — Command Order Decision

Based on CEREBRO canonical run order and actual gap analysis:

| Phase | Command | Reason | Output |
|---|---|---|---|
| 1 | **VENOM** | Security re-run: vportClient clarified, block filter verified, console resolved | Standalone file + summary below |
| 2 | **LOKI** | Runtime trace: badgeSubscriptions inert, engine init, inbox chain | Standalone file + summary below |
| 3 | **SENTRY** | Dead code confirmation + compliance: RISK-1,5,6,7,8 + badgeSubscriptions | Standalone file + summary below |
| 4 | **LOGAN** | Doc corrections: RISK-2 resolution, RISK-12 deescalation, RISK-14 path, RISK-15 schema, RISK-16 vportClient | Summary below |

DB formal run skipped — notification, moderation, vc, vport schema usage confirmed via static source reads. No pending migrations (CARNAGE N/A). No IP concerns (SHIELD N/A). IRONMAN evidence still missing; FALCON still missing.

---

## Step 4 — VENOM Pass

**Status: VERIFIED — no blocking security findings**  
**Standalone file:** `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/venom_notifications-dal_2026-05-19.md`

### vportClient (RISK-16 — DEESCALATED)

`apps/VCSM/src/services/supabase/vportClient.js` contains:

```js
import { supabase } from '@/services/supabase/supabaseClient'
export const vport = supabase.schema('vport')
export default vport
```

This is a schema accessor on the **same Supabase client** — same JWT, same session, same RLS evaluation context. There is no separate authentication, no privilege escalation path, and no distinct RLS posture. `listVportRowsByIdsDAL` uses explicit column select (`id,name,slug,avatar_url`). **CLEAN.**

**RISK-16 security concern: WITHDRAWN.** Doc correction remains open (clarify in DAL files section).

### Block Filter Trust Boundary

`blocks.read.dal.js` uses `.schema("moderation")` with explicit column selects and `status = 'active'` filter on both directions. `blockFilter.js` builds bidirectional Sets. `filterByBlocks` removes any actor in either set. **CLEAN — bidirectional enforcement verified.**

### Console Policy (RISK-2)

All flagged console violations are now DEV-gated. Verified at source:
- `publish.js:79` — `if (import.meta.env.DEV)`
- `Notifications.controller.js:55` — `if (import.meta.env.DEV)`
- `resolveInboxActor.js:33,52` — `if (import.meta.env.DEV)` (were already gated before Codex pass)
- `useNotificationInbox.js:49,60,85` — `if (!DEV || ...)` / `if (DEV)`
- `FollowRequestItem.view.jsx:25,76,93` — `if (DEV)` (Codex pass gated lines 76,93; line 25 was already gated)

**RISK-2: FULLY RESOLVED.**

### Engine DI Chain

`configureNotificationsEngine` called once at app startup. `_configured` guard verified. **CLEAN.**

### Adapter Boundary

Zero production files bypass `notifications.adapter.js`. **CLEAN.**

---

## Step 5 — LOKI Pass (v2 — Full Pass 2026-05-19)

**Status: COMPLETE — full static trace of all runtime paths**  
**Standalone file:** `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/loki_notifications-dal_2026-05-19.md`

### Engine Init Chain

`main.jsx:24` → `setupVcsmNotificationsEngine()` called synchronously before `createRoot`. Order in main.jsx: identity[1] → hydration[2] → chat[3] → reviews[4] → portfolio[5] → **notifications[6]** → booking[7] → media[8]. Dependency on `@hydration` (position 2) is satisfied. `_configured` guard prevents double-init. Correct.

### Badge Count Runtime Path

`BottomNavBar.jsx` (mounted in `RootLayout.jsx:96`, never unmounts) → `useBootstrapHydration(personaActorId)` → stores actorId → activates `useNotificationUnread()` → `useQuery(notificationUnread, getUnreadNotificationCount, 60s poll)` → `countUnread()` engine (5s in-memory cache). `noti:refresh` event invalidates badge immediately without waiting for next poll cycle.

### Inbox Load Path

```
NotificationsScreen → NotificationsScreenView → useNotifications → useNotificationInbox
  → useQuery(notificationsInbox, getNotifications, 60s stale + refetchInterval)
    → resolveInboxActor → getInboxNotifications (engine, autoMarkSeen: true)
    → loadBlockSets (2 parallel) → filterByBlocks
    → filterResolvedFollowRequestRows (social.adapter, follow_request rows only)
    → resolveSenders (3-tier @hydration waterfall)
    → mapNotification (notification.model.js)
    → vport kind filter: removes 'follow' notifications for vport actors
  → on success: invalidate notificationUnread (badge reflects cleared unseen immediately)
  → on noti:refresh: invalidate inbox + unread
  → on noti:optimistic:replace: patch cache without network round-trip
```

`keepPreviousData` prevents skeleton flash on refetch. Actor switch produces new query key → `keepPreviousData` returns `undefined` → skeleton renders correctly on actor switch.

### Custom Events System

| Event | Dispatchers (7 total) | Listeners (2) |
|---|---|---|
| `noti:refresh` | NotificationsHeader.controller, FollowRequestItem.view, usePendingFollowRequestActions (×2), useFollowRequestActions (×2), BottomNavBar (route-gated: /notifications & /chat only) | bootstrap.hydrate.controller (invalidates unread+chat), useNotificationInbox (invalidates inbox+unread) |
| `noti:optimistic:replace` | FollowRequestItem.view | useNotificationInbox (patches cache) |

### Actor Switch Cache

`purgeNotificationCache()` → `removeQueries({ queryKey: ['notifications'] })` — hard evict on actor switch/logout. Prevents cross-actor data bleed. Correct.

### LOKI Findings

**LF-1 (LOW):** Mark-all-seen dispatches `noti:refresh` (triggers 2 listeners, each invalidating `notificationUnread`) AND the hook also calls `queryClient.invalidateQueries` for inbox + unread directly after return → `notificationUnread` invalidated 3 times. React Query deduplicates in-flight refetches — functionally harmless, no fix required.

**LF-2 (LOW):** Live DB query revealed 5 undocumented `notification` schema tables: `preferences`, `delivery_attempts`, `templates`, `push_subscriptions`, `event_types`. These appear to be engine-internal tables not exposed through feature-layer DALs. Should be documented in `@notifications` engine audit v1 (IF-2 scope).

### badgeSubscriptions.js (RISK-12 — DEESCALATED)

Both `subscribeInboxBadge` and `subscribeNotificationBadge` are explicit noops. Zero consumers (grep confirmed). No Supabase Realtime channels open. RISK-12 deescalated MODERATE → INFO. Placeholder for future realtime; no lifecycle risk.

---

## Step 6 — SENTRY Pass

**Status: REVIEW_PENDING — deletion decisions require user approval**  
**Standalone file:** `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/sentry_notifications-dal_2026-05-19.md`

### Dead Code Summary (all confirmed zero external consumers via grep)

| File | Risk | Confirmation |
|---|---|---|
| `screen/views/NotiViewPostScreen.jsx` | RISK-1 | Router uses `screen/NotiViewPostScreen.jsx` (Final Screen); views version unrouted |
| `inbox/hooks/useNotificationsInternal.js` | RISK-5 | Zero imports found outside own file |
| `inbox/hooks/useMarkNotificationsRead.js` | RISK-6 | Zero imports found outside own file |
| `inbox/hooks/useUnreadBadge.js` | RISK-7 | Zero imports found outside own file |
| `inbox/controller/inboxUnread.controller.js` | RISK-8 | Zero imports found; 1-line chat re-export |
| `inbox/realtime/badgeSubscriptions.js` | CF-2 | Zero imports found; both functions are noops |

**Deletion priority order (confirmed safe):**
1. `inbox/controller/inboxUnread.controller.js` (1-line file, zero deps)
2. `inbox/hooks/useUnreadBadge.js` (zero deps)
3. `inbox/realtime/badgeSubscriptions.js` (zero deps, noops)
4. `inbox/hooks/useNotificationsInternal.js`
5. `inbox/hooks/useMarkNotificationsRead.js`
6. `screen/views/NotiViewPostScreen.jsx`

### Contract Compliance

| Rule | Status |
|---|---|
| No TypeScript | ✓ CLEAN |
| No `select('*')` | ✓ CLEAN |
| Path aliases (`@/`) | ✓ CLEAN |
| Adapter boundary | ✓ CLEAN |
| File length ≤ 300 lines | ⚠ `notificationRuntime.dal.js` = exactly 300 lines |
| Hooks → Controllers → Engine | ⚠ RISK-6 (dead) |
| Feature isolation | ⚠ RISK-8 (dead) |
| Domain transforms in model/ | ⚠ RISK-9 (open) |

**FILE LENGTH WARNING (CF-5):** `notificationRuntime.dal.js` is at exactly 300 lines. `runtime/index.js` is 299 lines. Any new function addition to either file will breach the 300-line contract rule. A split must be planned before adding functionality.

---

## Step 7 — LOGAN Doc Corrections

**Status: OPEN — corrections not yet applied to document body (append-only policy)**

Required corrections to existing document sections:

| Section | Current | Correct |
|---|---|---|
| RISK-2 table — FollowRequestItem path | `screen/views/FollowRequestItem.view.jsx` | `types/follow/FollowRequestItem.view.jsx` |
| RISK-2 status | "MEDIUM — POLICY VIOLATION" | RESOLVED — all violations DEV-gated |
| RISK-12 severity | MODERATE | INFO — noops, never called |
| RISK-16 classification | "Security concern — separate Supabase client" | Doc correction only — same client, schema accessor |
| `notificationRuntime.dal.js` description | (schema not mentioned) | Add: schema = `notification` (singular) |
| `senders.read.dal.js` description | `vportClient` dependency not mentioned | Add: `listVportRowsByIdsDAL` uses `supabase.schema('vport')` via `vportClient.js` — same auth context |
| Architecture Pipeline — Service row | "✗ MISSING" | ✓ PRESENT implied — engine handles publish path |
| Pending Reviews table | 9 items | Add RISK-12 and CF-2 (badgeSubscriptions delete candidate) |

---

## Final Command Status Table

| Command | Status | Findings | Blocking |
|---|---|---|---|
| DB (static) | VERIFIED | `notification`, `moderation`, `vc`, `vport` schemas confirmed correct; explicit selects; no wildcards | NO |
| VENOM | VERIFIED | vportClient deescalated; block filter clean; RISK-2 fully resolved; adapter clean | NO |
| LOKI | COMPLETE | Full trace: engine init, badge path, inbox load, mark-seen, optimistic update, publish path, custom events system, actor switch cache. LF-1 (triple invalidation, harmless). LF-2 (5 undocumented engine-internal tables). No correctness issues. | NO |
| SENTRY | REVIEW_PENDING | 6 delete candidates confirmed (RISK-1,5,6,7,8 + badgeSubscriptions); file length warning at 300 lines | NO |
| LOGAN | OPEN | 8 doc corrections identified; none applied (append-only policy) | NO |
| IRONMAN | MISSING | No ownership assignment for notifications feature or 13+ type files | NO |
| KRAVEN | MISSING | Sender resolution waterfall (up to 4 round trips) + 5-DAL inbox load uncosthed | NO |
| FALCON | MISSING | Native parity unverified — bottom-nav primary surface | NO |

---

## Open Risks (this pass)

| Risk | Severity | Status | Owner |
|---|---|---|---|
| RISK-1: Dead duplicate `NotiViewPostScreen.jsx` | MEDIUM | DELETE CANDIDATE (confirmed) | SENTRY |
| RISK-3: screen/views/ nesting convention | LOW | OPEN | SENTRY |
| RISK-5: `useNotificationsInternal.js` dead | MEDIUM | DELETE CANDIDATE (confirmed) | SENTRY |
| RISK-6: `useMarkNotificationsRead.js` dead + layer violation | MEDIUM | DELETE CANDIDATE (confirmed) | SENTRY |
| RISK-7: `useUnreadBadge.js` dead/misattributed | LOW | DELETE CANDIDATE (confirmed) | SENTRY |
| RISK-8: `inboxUnread.controller.js` dead shim | LOW | DELETE CANDIDATE (confirmed) | SENTRY |
| RISK-9: `mapSummaryRowToSender()` in lib/ not model/ | LOW | OPEN | SENTRY |
| RISK-10: `inbox/ui/` layer undocumented in pipeline | LOW | OPEN | ARCHITECT/LOGAN |
| RISK-11: `types/` dispatch layer undocumented | MODERATE | OPEN | ARCHITECT/LOGAN |
| RISK-13: `resolveInboxActor.js` undocumented | LOW | OPEN (active lib file) | LOGAN |
| RISK-14: RISK-2 path error in doc | LOW | OPEN | LOGAN |
| RISK-15: `notification` schema name undocumented | LOW | OPEN | LOGAN |
| CF-2: `badgeSubscriptions.js` inert + uncalled | INFO | DELETE CANDIDATE | SENTRY |
| CF-5: `notificationRuntime.dal.js` at 300-line limit | WARNING | OPEN | ARCHITECT |
| CF-6: `runtime/index.js` at 299 lines | WARNING | OPEN | ARCHITECT |

---

## Fixed Risks (confirmed this pass)

| Risk | Resolution |
|---|---|
| RISK-2: Unguarded console violations | FULLY RESOLVED — all console calls are DEV-gated in live source |
| RISK-12: badgeSubscriptions lifecycle concern | DEESCALATED — noops and never called |
| RISK-16: vportClient separate auth concern | DEESCALATED — same Supabase client (`supabase.schema('vport')`) |

---

## Required Next Command

```
SENTRY — Execute deletions: RISK-1, RISK-5, RISK-6, RISK-7, RISK-8, CF-2 (badgeSubscriptions.js)
         Requires user approval for file deletions
LOGAN  — Apply 8 doc corrections to existing sections (RISK-14 path, RISK-15 schema, RISK-16 vportClient, RISK-2 status, RISK-12 severity)
KRAVEN — Sender resolution waterfall cost (resolveSenders 4 round trips) + 5-DAL inbox load timing
IRONMAN — Ownership assignment for notifications feature, 13+ type files, inbox/ui/ layer
FALCON  — Before next native release (notifications is a primary bottom-nav surface)
```

---

## Document Status

**REVIEW_PENDING**

Security (VENOM) and runtime (LOKI) passes are verified. No blocking production issues found. Three risks are newly deescalated (RISK-2, RISK-12, RISK-16). Six dead files are confirmed delete candidates pending SENTRY execution and user approval. Two files are at the 300-line contract limit. Documentation drift (RISK-10, RISK-11, RISK-13, RISK-14, RISK-15) remains open. IRONMAN, KRAVEN, and FALCON evidence still missing.

---

# SENTRY Compliance Report — 2026-05-19

_Appended:_ 2026-05-19  
_Trigger:_ CEREBRO-driven verification pass — notifications DAL document  
_Application Scope:_ VCSM  
_Architecture contract:_ `zNOTFORPRODUCTION/_CANONICAL/zcontract/ARCHITECTURE.md`  
_Boundary contract:_ `zNOTFORPRODUCTION/_CANONICAL/zcontract/PROJECT_BOUNDARY_ISOLATION_CONTRACT.md`  
_Standalone file:_ `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/sentry_notifications-dal_2026-05-19.md`  

---

## BOUNDARY COMPLIANCE STATUS

| Protected Root | In Scope | Modified | Violation | Notes |
|---|---|---|---|---|
| apps/VCSM | YES | NO | NO | Audit only — no source files modified in this pass |
| apps/wentrex | NO | NO | NO | Out of scope |
| apps/Traffic | NO | NO | NO | Out of scope |
| engines | NO | NO | NO | `@notifications` engine consumed but not modified |

**Boundary verdict: CLEAN.** Audit remained inside VCSM. Engine consumed via adapter — no direct engine modification.

---

## ARCHITECTURE ALIGNMENT STATUS

| Area | Status | Drift Level | Notes |
|---|---|---|---|
| DAL layer — `blocks.read.dal.js` | ALIGNED | NONE | Correct schema, explicit selects, active-only filter |
| DAL layer — `senders.read.dal.js` | ALIGNED | NONE | Explicit selects; vportClient clarified as schema accessor |
| DAL layer — `notificationRuntime.dal.js` | ALIGNED | NONE | `.schema('notification')` on all 15 queries; at 300-line limit |
| Model layer — `notification.model.js` | ALIGNED | NONE | Pure transforms, no side effects |
| Model layer — `notificationRuntime.model.js` | ALIGNED | NONE | Pure join of 4 DB result sets |
| Controller layer — `Notifications.controller.js` | ALIGNED | NONE | Correct orchestration; block filter + sender resolution wired |
| Controller layer — `NotificationsHeader.controller.js` | ALIGNED | NONE | Correct |
| Controller layer — `notificationsCount.controller.js` | ALIGNED | NONE | Thin wrapper — correct |
| Controller layer — `inboxUnread.controller.js` | **MAJOR DRIFT** | CONTRACT VIOLATION | Chat re-export shim living in notifications controller layer (RISK-8) |
| Hook layer — `useNotificationInbox.js` | ALIGNED | NONE | React Query, correct controller delegation |
| Hook layer — `useNotificationsHeader.js` | ALIGNED | NONE | Correct |
| Hook layer — `useNotiCount.js` | ALIGNED | NONE | Delegates to bootstrap selectors |
| Hook layer — `useMarkNotificationsRead.js` | **MAJOR DRIFT** | CONTRACT VIOLATION | `useMarkNotificationRead` calls engine directly — bypasses controller (RISK-6) |
| Hook layer — `useNotificationsInternal.js` | ALIGNED (DEAD) | NONE | Dead; old useState/useEffect pattern — no active drift |
| Hook layer — `useUnreadBadge.js` | **MODERATE DRIFT** | MINOR DRIFT | Chat concern in notifications hook layer; dead but misattributed (RISK-7) |
| Lib — `resolveSenders.js` | **MINOR DRIFT** | MINOR DRIFT | Contains `mapSummaryRowToSender()` — domain transform in lib/ (RISK-9) |
| Lib — `blockFilter.js` | ALIGNED | NONE | Set construction is utility, not domain transform |
| Lib — `resolveInboxActor.js` | ALIGNED | NONE | Identity adapter — correctly in lib/; DEV-gated console |
| Adapter — `notifications.adapter.js` | ALIGNED | NONE | Clean boundary; all external consumers use adapter |
| Engine — `@notifications` consumption | ALIGNED | NONE | Accessed only via controller or adapter |
| Realtime — `badgeSubscriptions.js` | ALIGNED (INERT) | NONE | Explicit noops; uncalled; no drift while inert |

---

## ACTOR OWNERSHIP STATUS

| Flow | Status | Risk | Notes |
|---|---|---|---|
| Notification read gating | ALIGNED | LOW | `getNotifications(identity)` receives resolved identity from hook layer |
| Block filter enforcement | ALIGNED | LOW | Bidirectional block check on every inbox load via controller |
| Mark-read / mark-seen | ALIGNED | LOW | Engine RPC path enforces recipient ownership at DB level |
| Publish path | ALIGNED | LOW | All 15+ callers go through adapter → engine; no raw DAL write exposure |
| `useMarkNotificationRead` engine bypass | **CONCERN** | LOW (dead) | Hook calls `markRead()` directly without controller — no ownership gate at hook layer. Dead code, but pattern must not be replicated. |

**ACTOR OWNERSHIP DRIFT — RISK-6 (dead)**  
Location: `inbox/hooks/useMarkNotificationsRead.js` — `useMarkNotificationRead`  
Current ownership flow: Hook → Engine (direct)  
Expected ownership flow: Hook → Controller → Engine  
Risk: If ever reactivated, mark-read can be called without any controller-layer ownership or permission check  
Severity: LOW (file has zero consumers — confirmed dead)  
Contract violated: Architecture Contract — Hooks must not call engine directly  
Recommended correction: Delete file. If mark-read functionality is needed, implement `markNotificationReadController()` first.

---

## IDENTITY SURFACE STATUS

| Surface | Status | Risk | Notes |
|---|---|---|---|
| `actorId` in public hooks | ALIGNED | NONE | Only actorId + kind exposed |
| `profileId` / `vportId` exposure | ALIGNED | NONE | Not surfaced through useIdentity() |
| DAL response shapes | ALIGNED | NONE | Explicit column selects; no internal metadata leaked |
| Adapter exports | ALIGNED | NONE | Publish functions accept actorId-based args only |

No identity surface violations detected.

---

## ENGINE ISOLATION STATUS

| Engine Area | Status | Drift | Notes |
|---|---|---|---|
| `@notifications` engine consumption | ALIGNED | NONE | Feature code accesses engine only via `publish.js` (bridge) or controller layer |
| Engine DI (configureNotificationsEngine) | ALIGNED | NONE | Called once at app startup; guarded against double-init |
| `@hydration` engine in senders DAL | ALIGNED | NONE | `listActorSummaryRowsByIdsDAL` delegates to hydration engine correctly |
| Engine write path access | ALIGNED | NONE | Only controller + adapter touch engine write functions in production |
| RISK-6 engine bypass | **CONCERN** | MINOR (dead) | `useMarkNotificationsRead` calls `markRead()` from engine directly — bypasses controller; dead code |

---

## NATIVE PARITY STATUS

| Native Area | Status | Drift | Notes |
|---|---|---|---|
| Notifications inbox | UNKNOWN | UNVERIFIED | FALCON review missing |
| Unread badge count | UNKNOWN | UNVERIFIED | FALCON review missing |
| Block filter enforcement | UNKNOWN | UNVERIFIED | Web bidirectional enforcement confirmed; native unknown |
| Type dispatch (13+ views) | UNKNOWN | UNVERIFIED | FALCON review missing |
| Realtime badge subscription | N/A | N/A | `badgeSubscriptions.js` is noops — no realtime channel to mirror |

---

## SENTRY FINDINGS

---

**SENTRY FINDING — SF-1**  
Finding ID: SF-1  
Location: `apps/VCSM/src/features/notifications/inbox/hooks/useMarkNotificationsRead.js`  
Drift Level: CONTRACT VIOLATION  
Severity: LOW (dead code — zero consumers confirmed)  
Contract Violated: Architecture Contract — Layer Responsibility (Hooks must call Controllers; Controllers call Engine/DAL)  
Current behavior: `useMarkNotificationRead` calls `markRead()` from `@notifications` engine directly from the hook layer  
Expected behavior: Hook calls a controller function (`markNotificationReadController`); controller calls engine  
Risk: If ever reactivated, ownership and permission checks at the controller layer are bypassed  
Recommended correction: Delete file. Any future mark-read implementation must introduce a controller function first.  
Architectural rationale: The controller layer is the authorization boundary. Bypassing it from a hook means any future ownership enforcement added to the controller layer would not apply to this path.

---

**SENTRY FINDING — SF-2**  
Finding ID: SF-2  
Location: `apps/VCSM/src/features/notifications/inbox/controller/inboxUnread.controller.js`  
Drift Level: CONTRACT VIOLATION  
Severity: LOW (dead code — zero consumers confirmed)  
Contract Violated: Architecture Contract — Feature Isolation; a controller in the notifications feature must not re-export functions from the chat feature's internals  
Current behavior: Entire file is a 1-line re-export of chat controller functions  
Expected behavior: Cross-feature access must go through adapters only; notifications must not expose chat internals  
Risk: Zero production risk (file is unused), but the pattern inverts the adapter boundary  
Recommended correction: Delete file. If chat unread badge count is needed in notifications context, consume via `chat.adapter.js`.  
Architectural rationale: Feature internals are not for cross-feature export. The adapter layer exists precisely for this purpose.

---

**SENTRY FINDING — SF-3**  
Finding ID: SF-3  
Location: `apps/VCSM/src/features/notifications/inbox/lib/resolveSenders.js` — `mapSummaryRowToSender()`  
Drift Level: MINOR DRIFT  
Severity: LOW  
Contract Violated: Architecture Contract — Layer Responsibility (domain shape transforms belong in model/)  
Current behavior: `mapSummaryRowToSender()` maps raw actor rows to sender shape — domain transform logic inside a `lib/` utility file  
Expected behavior: Domain transforms belong in `notification.model.js`; `lib/` should contain pure utility logic that is not domain-specific  
Risk: `notification.model.js` has no visibility into sender shape construction; model layer is incomplete  
Recommended correction: Move `mapSummaryRowToSender()` to `notification.model.js`. Keep the waterfall orchestration logic in `resolveSenders.js`.  
Architectural rationale: The model layer owns the domain shape. Splitting domain transform logic into `lib/` creates an incomplete model that does not reflect the full notification domain shape.

---

**SENTRY FINDING — SF-4**  
Finding ID: SF-4  
Location: `apps/VCSM/src/features/notifications/runtime/notificationRuntime.dal.js`  
Drift Level: MINOR DRIFT  
Severity: LOW  
Contract Violated: Architecture Contract — File length ≤ 300 lines  
Current behavior: File is exactly 300 lines — at the contract ceiling  
Expected behavior: Files must be kept under 300 lines; at 300 they are already at the limit  
Risk: Any new function or documentation addition will breach the contract  
Recommended correction: Plan a split before adding new functions. `runtime/index.js` is also at 299 lines.  
Architectural rationale: The 300-line rule prevents accretion of responsibilities. A DAL file with 16 functions in 300 lines is already at maximum density.

---

**SENTRY FINDING — SF-5**  
Finding ID: SF-5  
Location: `apps/VCSM/src/features/notifications/inbox/hooks/useUnreadBadge.js`  
Drift Level: MINOR DRIFT  
Severity: LOW (dead code — zero consumers confirmed)  
Contract Violated: Architecture Contract — Feature Isolation (hook queries chat domain from notifications hook layer)  
Current behavior: Hook uses `useChatUnreadOps()` to query chat unread count; lives in notifications feature  
Expected behavior: Chat domain hooks belong in the chat feature  
Risk: Zero production risk (dead code). If reactivated, chat domain logic would live in notifications feature — violating feature isolation  
Recommended correction: Delete. If chat unread badge is needed, consume via `chat.adapter.js` from the appropriate feature.  
Architectural rationale: Feature hooks must not cross domain boundaries.

---

## CACHE ARCHITECTURE STATUS

| Cache Area | Status | Risk | Notes |
|---|---|---|---|
| React Query inbox cache | ALIGNED | LOW | 60s stale, refetchInterval, `noti:refresh` event invalidation wired |
| Badge count cache | ALIGNED | LOW | Badge invalidated after each successful inbox fetch |
| Engine `_configured` guard | ALIGNED | LOW | Prevents double-init |
| DAL-level caching | NONE | MEDIUM (perf) | No caching at DAL layer — 5 queries on every inbox refetch; KRAVEN scope |

No cache architecture violations. Performance concern (no DAL cache) is KRAVEN-scope.

---

## FINAL SENTRY STATUS

**MINOR DRIFT**

All contract violations (SF-1, SF-2) are in confirmed dead code with zero external consumers. No active code path violates the architecture contract. SF-3 and SF-5 are minor layer placement issues. SF-4 is a file-length ceiling warning. No active production path carries architectural drift.

---

## FOLLOW-UP REQUIRED

**REQUIRED BEFORE RELEASE** (cleanup, not blocking production)

| Finding | Action | Priority |
|---|---|---|
| SF-1 | Delete `useMarkNotificationsRead.js` | MEDIUM |
| SF-2 | Delete `inboxUnread.controller.js` | MEDIUM |
| SF-3 | Move `mapSummaryRowToSender()` to `notification.model.js` | LOW |
| SF-4 | Plan `notificationRuntime.dal.js` split before adding functions | LOW |
| SF-5 | Delete `useUnreadBadge.js` | LOW |
| RISK-1 | Delete `screen/views/NotiViewPostScreen.jsx` | MEDIUM |
| RISK-5 | Delete `useNotificationsInternal.js` | MEDIUM |
| CF-2 | Delete or document `badgeSubscriptions.js` | LOW |

---

# LOGAN Documentation Review — 2026-05-19

_Appended:_ 2026-05-19  
_Trigger:_ CEREBRO-driven verification pass — notifications DAL document  
_Application Scope:_ VCSM  
_Documentation Scope:_ `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.notifications.md`  
_Boundary Contract:_ PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — ENFORCED  

---

## DOCUMENTATION SCOPE GATE

| Documentation Area | In Scope | Update Allowed | Reason |
|---|---|---|---|
| `vcsm/dal/vcsm.dal.notifications.md` | YES | YES | VCSM scope; document under review |
| Other VCSM Logan docs | NO | NO | Out of scope for this pass |
| Engine docs (`@notifications`) | NO | NO | Engine not modified; no new audit required |
| `apps/wentrex`, `apps/Traffic` | NO | NO | Boundary isolation |

---

## RELEVANT DOCS

| Doc Path | Status | Truth Status | Notes |
|---|---|---|---|
| `vcsm/dal/vcsm.dal.notifications.md` | PRESENT | PARTIAL | Multiple sections stale post-Codex Fix Pass; 8 corrections required |

---

## CODE REVIEWED

| Code Path | Purpose | Status |
|---|---|---|
| `features/notifications/publish.js:79-81` | Console violation — RISK-2 | DEV-gated confirmed |
| `features/notifications/inbox/controller/Notifications.controller.js:55-57` | Console violation — RISK-2 | DEV-gated confirmed |
| `features/notifications/inbox/lib/resolveInboxActor.js:33-34,52-53` | Console violation — RISK-2 | DEV-gated confirmed |
| `features/notifications/inbox/hooks/useNotificationInbox.js:49,60,85` | Console violation — RISK-2 | DEV-gated confirmed |
| `features/notifications/types/follow/FollowRequestItem.view.jsx:25,76,93` | Console violation — RISK-2 | DEV-gated confirmed |
| `features/notifications/inbox/realtime/badgeSubscriptions.js` | RISK-12 lifecycle | Both exports are noops; zero callers |
| `services/supabase/vportClient.js` | RISK-16 — vportClient | `supabase.schema('vport')` — same client |
| `features/notifications/runtime/notificationRuntime.dal.js` | Schema name — RISK-15 | `.schema('notification')` on all 15 queries confirmed |
| `features/notifications/inbox/dal/senders.read.dal.js` | vportClient usage — RISK-16 | Uses `vportSchema.from("profiles")` with explicit columns |
| `features/notifications/inbox/lib/resolveInboxActor.js` | RISK-13 active status | Called by `Notifications.controller.js` |

---

## COMMAND EVIDENCE REGISTRY

| Command | Report Path | Relevance | Status |
|---|---|---|---|
| ARCHITECT | Inline — this document (2026-05-11) | Architecture pipeline, chain resolution | PRESENT |
| VENOM | `CURRENT/features/dashboard/evidence/venom_notifications-dal_2026-05-19.md` | vportClient, block filter, console policy | PRESENT |
| SENTRY | `CURRENT/features/dashboard/evidence/sentry_notifications-dal_2026-05-19.md` + inline 2026-05-19 | Layer violations, dead code | PRESENT |
| LOKI | `CURRENT/features/dashboard/evidence/loki_notifications-dal_2026-05-19.md` | Full trace: all runtime paths, custom events, cache lifecycle | PRESENT (complete) |
| FALCON | None | Native parity | MISSING |
| THOR | None | Release gate | MISSING |
| KRAVEN | None | Performance — sender waterfall, inbox load | MISSING |
| CARNAGE | N/A | No pending migrations | N/A |
| IRONMAN | None | Ownership assignment | MISSING |

---

## DRIFT FINDINGS

---

**LOGAN DRIFT FINDING — LD-1**  
Finding ID: LD-1  
Doc Path: `vcsm/dal/vcsm.dal.notifications.md` — RISK-2 table, line ~370  
Code Path: `features/notifications/types/follow/FollowRequestItem.view.jsx`  
Drift Status: CONTRADICTORY  
Drift Severity: LOW  
Documentation Truth Status: STALE  
Current doc behavior: RISK-2 table lists `screen/views/FollowRequestItem.view.jsx` as the file with console violations  
Actual code behavior: File lives at `types/follow/FollowRequestItem.view.jsx` — different path entirely  
Risk: SENTRY or a developer acting on RISK-2 would look in the wrong directory and conclude the file doesn't exist  
Recommended documentation update: Correct path in RISK-2 table to `types/follow/FollowRequestItem.view.jsx`. Also correct the same path in the AvengersAssemble SENTRY section where it lists `screen/views/FollowRequestItem.view.jsx:23,72,89`.

---

**LOGAN DRIFT FINDING — LD-2**  
Finding ID: LD-2  
Doc Path: `vcsm/dal/vcsm.dal.notifications.md` — RISK-2 section and Pending Reviews row  
Code Path: All 5 files listed in RISK-2  
Drift Status: STALE  
Drift Severity: MEDIUM  
Documentation Truth Status: STALE  
Current doc behavior: RISK-2 is listed as MEDIUM severity open policy violation; Codex Fix Pass notes it as PARTIAL  
Actual code behavior: All console violations across all 6 files are DEV-gated. `resolveInboxActor.js` violations were already DEV-gated before the Codex pass. `FollowRequestItem.view.jsx` line 25 (`if (DEV)`) and lines 76, 93 are all DEV-gated. RISK-2 is fully resolved.  
Risk: SENTRY and future developers will continue treating this as an open violation and search for unguarded logs that no longer exist  
Recommended documentation update: Mark RISK-2 as RESOLVED. Update the Pending Reviews table row to reflect resolution. Add verification date 2026-05-19.

---

**LOGAN DRIFT FINDING — LD-3**  
Finding ID: LD-3  
Doc Path: `vcsm/dal/vcsm.dal.notifications.md` — RISK-12 section  
Code Path: `features/notifications/inbox/realtime/badgeSubscriptions.js`  
Drift Status: STALE  
Drift Severity: MEDIUM  
Documentation Truth Status: STALE  
Current doc behavior: RISK-12 is classified MODERATE — "File exists with no mention anywhere. Its role, callers, and lifecycle are unknown. If it holds open connections, it must be documented and verified for proper cleanup."  
Actual code behavior: Both exports are explicit noops with comment "disabled for now." Neither function is imported or called anywhere. No Supabase Realtime channel is open. No lifecycle risk exists.  
Risk: Documentation overstates severity; creates false urgency for a non-issue  
Recommended documentation update: Reclassify RISK-12 severity to INFO. Update detail to: "Both exports are explicit noops. Neither function is called. Badge freshness is owned by React Query polling. File is a placeholder for future realtime support." Add verified date 2026-05-19.

---

**LOGAN DRIFT FINDING — LD-4**  
Finding ID: LD-4  
Doc Path: `vcsm/dal/vcsm.dal.notifications.md` — RISK-16 section and VENOM AvengersAssemble section  
Code Path: `apps/VCSM/src/services/supabase/vportClient.js`  
Drift Status: STALE  
Drift Severity: LOW  
Documentation Truth Status: STALE  
Current doc behavior: RISK-16 states "`listVportRowsByIdsDAL` uses a separate Supabase client (`vportSchema` from `@/services/supabase/vportClient`) — a separate Supabase client with its own RLS posture." AvengersAssemble VENOM section states "REQUIRES REVIEW — verify this client's RLS posture."  
Actual code behavior: `vportClient.js` is `supabase.schema('vport')` — a schema accessor on the same Supabase client. Same JWT, same session, same RLS evaluation context. No separate auth.  
Risk: Documentation may cause unnecessary VENOM reviews of a non-issue. Developers may over-engineer VPort DAL calls assuming separate auth context.  
Recommended documentation update: Update RISK-16 detail to clarify: "`vportClient.js` exports `supabase.schema('vport')` — not a separate client. Same authentication, same JWT, same RLS context. No security concern. Document `listVportRowsByIdsDAL` uses `vport` schema with explicit column select (`id,name,slug,avatar_url`)." Remove the VENOM REQUIRES REVIEW flag.

---

**LOGAN DRIFT FINDING — LD-5**  
Finding ID: LD-5  
Doc Path: `vcsm/dal/vcsm.dal.notifications.md` — DAL Files section, `notificationRuntime.dal.js`  
Code Path: `features/notifications/runtime/notificationRuntime.dal.js`  
Drift Status: MINOR DRIFT  
Drift Severity: LOW  
Documentation Truth Status: PARTIAL  
Current doc behavior: Tables listed as `recipients`, `inbox_items`, `events`, `rendered` — schema name never mentioned  
Actual code behavior: All 15 table queries use `.schema('notification')` (singular). The schema name is a critical detail for any developer querying these tables directly or writing migrations.  
Recommended documentation update: Add to `notificationRuntime.dal.js` description: "All queries use `.schema('notification')` (singular). Tables accessed: `notification.recipients`, `notification.inbox_items`, `notification.events`, `notification.rendered`."

---

**LOGAN DRIFT FINDING — LD-6**  
Finding ID: LD-6  
Doc Path: `vcsm/dal/vcsm.dal.notifications.md` — DAL Files section, `senders.read.dal.js`  
Code Path: `features/notifications/inbox/dal/senders.read.dal.js`  
Drift Status: MINOR DRIFT  
Drift Severity: LOW  
Documentation Truth Status: PARTIAL  
Current doc behavior: `senders.read.dal.js` tables listed as `actors`, `profiles` — vportClient dependency not mentioned  
Actual code behavior: `listVportRowsByIdsDAL` uses `vportClient` (`supabase.schema('vport')`). `listActorIdentityRowsByIdsDAL` uses `.schema("vc")`. `listProfileRowsByIdsDAL` uses default `public` schema.  
Recommended documentation update: Add schema breakdown to `senders.read.dal.js` description: "`listActorSummaryRowsByIdsDAL` + `listActorPresentationRowsByIdsDAL` delegate to `@hydration` engine. `listActorIdentityRowsByIdsDAL` — `.schema('vc').actors`. `listProfileRowsByIdsDAL` — `public.profiles`. `listVportRowsByIdsDAL` — `supabase.schema('vport').profiles` via `vportClient.js` (same auth context as main client)."

---

**LOGAN DRIFT FINDING — LD-7**  
Finding ID: LD-7  
Doc Path: `vcsm/dal/vcsm.dal.notifications.md` — Architecture Pipeline table, Service row  
Code Path: `features/notifications/setup.js`, `engines/notifications/`  
Drift Status: MINOR DRIFT  
Drift Severity: LOW  
Documentation Truth Status: PARTIAL  
Current doc behavior: Service layer shows "✗ MISSING — not detected in static scan"  
Actual code behavior: The service role is fulfilled by the `@notifications` engine (`runtime/index.js`). `features/notifications/publish.js` is a bridge module that maps the feature publish shape to the engine API. The service layer is present — it's the engine, not a conventional service file.  
Recommended documentation update: Update Service row to: "✓ PRESENT (engine-delegated) — `features/notifications/publish.js` (bridge) → `@notifications` engine (`runtime/index.js`)". Remove "not detected in static scan" wording.

---

**LOGAN DRIFT FINDING — LD-8**  
Finding ID: LD-8  
Doc Path: `vcsm/dal/vcsm.dal.notifications.md` — Summary table  
Code Path: All feature files  
Drift Status: MINOR DRIFT  
Drift Severity: LOW  
Documentation Truth Status: STALE  
Current doc behavior: Summary shows "Risk findings: 4" and "Cleanup required: 6+ unguarded console.error/console.log"  
Actual code behavior: Risk count is now 16 (RISK-1 through RISK-16). Console violations are fully resolved (zero unguarded). Console cleanup row is no longer accurate.  
Recommended documentation update: Update Summary table: "Risk findings: 16 (RISK-1 through RISK-16; RISK-2 resolved, RISK-12 deescalated to INFO)". Remove "Cleanup required: 6+ unguarded console" row — violations resolved.

---

## README VIOLATION REPORT

| File | Scope | Recommended Action |
|---|---|---|
| (none found in notifications feature scope) | — | — |

---

## PROMPT PROVENANCE STATUS

Prompt Logged: NO (administrative verification pass — exception applies per LOGAN §8)  
Planning File: N/A  
Exception: CEREBRO-driven verification pass — no new implementation; exception per LOGAN §8 (administrative planning actions)

---

## ENGINE AUDIT STATUS

Engine Changed: NO — `@notifications` engine was consumed but not modified  
Latest Audit: None on file for `@notifications` engine  
New Audit Required: NO — engine unchanged in this pass  
New Audit Path: N/A

---

## NATIVE PARITY ROUTING

| Logan Doc | Native Relevance | Falcon Review | Reason | Module File |
|---|---|---|---|---|
| `vcsm.dal.notifications.md` | YES | REQUIRED | Notifications is a primary bottom-nav surface (badge counts, inbox, type dispatch, block filtering) — native parity not verified | None on file |

---

## LOGAN → FALCON HANDOFF

Logan Doc: `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.notifications.md`  
System: Notifications (inbox, badge count, type dispatch, block filter)  
Application Scope: VCSM  
Reason Falcon Review Is Required: Notifications is a primary bottom-nav surface. The web implementation is fully documented but native parity has never been audited. 13+ type-specific notification views exist; badge count polling, block filter enforcement, and inbox rendering all require native equivalents.  
Behavior Changed: N/A — this is a documentation pass, not an implementation change  
Data Contracts Changed: NO  
Trust Boundaries Changed: NO  
Affected Native Module: Unknown — no native module mapping on file  
Recommended Falcon Priority: MEDIUM — before next native release  
Related Evidence: `venom_notifications-dal_2026-05-19.md`, `loki_notifications-dal_2026-05-19.md`, `sentry_notifications-dal_2026-05-19.md`

---

## Native Parity Notes

Native Relevance: YES  
Falcon Review: REQUIRED  
Related Native Module: Unknown — not documented  
Native Transfer Status: NOT STARTED  
Known Native Gaps:
- Unread badge count polling strategy (React Query interval on web — native equivalent unknown)
- `badgeSubscriptions.js` is noops on web; no realtime — native badge refresh mechanism unknown
- 13+ type-specific notification view files — native type dispatch undocumented
- Bidirectional block filter enforcement in native inbox — unverified
- Mark-seen / mark-read interactions on native

Winter Soldier Handoff: N/A (Android scope not active)

---

## Native Documentation Verification

**PENDING FALCON**

---

## DOCUMENTATION STATUS

**PARTIAL**

All documented content (DAL files, call chains, two-tier architecture, RISK-1 through RISK-9 findings) is verified against live code. Eight drift findings identified (LD-1 through LD-8); none are release-blocking but two are STALE in ways that could misdirect future work (LD-1 wrong file path, LD-2 falsely open RISK-2). Drift corrections are documented above but NOT yet applied to existing document body (append-only policy — corrections require a dedicated doc-update pass with user approval for in-place edits).

---

## RECOMMENDED UPDATES

| Priority | Section | Correction |
|---|---|---|
| HIGH | RISK-2 table path | `screen/views/FollowRequestItem.view.jsx` → `types/follow/FollowRequestItem.view.jsx` |
| HIGH | RISK-2 status | Mark RESOLVED; all console violations are DEV-gated |
| MEDIUM | RISK-12 severity | MODERATE → INFO; noops + never called |
| MEDIUM | Summary table | Risk findings: 16; remove console cleanup row |
| LOW | RISK-16 | Clarify vportClient is `supabase.schema('vport')` — same auth context |
| LOW | `notificationRuntime.dal.js` description | Add: schema = `notification` (singular) |
| LOW | `senders.read.dal.js` description | Add schema breakdown per LD-6 |
| LOW | Architecture Pipeline — Service row | Mark PRESENT (engine-delegated) per LD-7 |

---

## FINAL LOGAN STATUS

**MINOR DRIFT**

No release-blocking documentation errors. Two stale entries (RISK-2 status and RISK-12 severity) could misdirect future work. Wrong file path in RISK-2 (LD-1) is the highest-priority correction. All corrections are non-blocking; feature is live and correctly implemented. Eight doc corrections documented and ready for in-place update pass.

---

---

# KRAVEN Performance Analysis — 2026-05-19

_Appended:_ 2026-05-19  
_Trigger:_ CEREBRO-driven verification pass — notifications DAL document  
_Application Scope:_ VCSM  
_Runtime Criticality:_ Notification-critical  
_LOKI Evidence:_ PARTIAL (static analysis only)  
_Standalone file:_ `zNOTFORPRODUCTION/_ACTIVE/audits/performance/2026-05-19_kraven_notifications-dal.md`  

---

## Query Amplification Summary

| Runtime Path | DB Operations | Amplification | Severity |
|---|---|---|---|
| Inbox read — warm hydration cache | 6 | 0.3 per record | HEALTHY |
| Inbox read — cold hydration cache | 9 | 0.45 per record | HEALTHY |
| `publishEvent()` — 10 recipients | 32 (2 fixed + 30 serial) | 3.2 | ELEVATED |
| `publishEvent()` — 50 recipients | 152 (2 fixed + 150 serial) | 3.04 | ELEVATED — 152 serial ops |
| `countUnread()` — cache miss | 2 | 2.0 | HEALTHY |
| `countUnread()` — cache hit | 0 | 0 | HEALTHY |

---

## KRAVEN FINDINGS

**KF-1 — `publishEvent()` Serial Recipient Delivery Loop**  
Severity: HIGH · ROI: HIGH  

The per-recipient delivery loop inside `publishEvent()` (`runtime/index.js:138-155`) executes 3 sequential `await` calls per recipient:

```
upsertNotificationRenderedDAL  → sequential per recipient
insertNotificationInboxItemDAL → sequential per recipient
updateNotificationRecipientStatusDAL → sequential per recipient
```

For N recipients: 2 fixed + 3N sequential DB operations. For 10 recipients: 32 serial ops. For 50 recipients: 152 serial ops. Every notification trigger in the app (15+ consumers) goes through this path.

**Recommended fix:** Replace serial loop with `Promise.allSettled` to parallelize across recipients. Reduces write path from O(N × 3 × RTT) to O(3 × RTT). Per-recipient error tracking is preserved. No architectural or security risk.

---

**KF-2 — `resolveSenders()` Cold-Cache Waterfall**  
Severity: MEDIUM · ROI: MODERATE (cache-dependent)  

Three-tier fallback: `@hydration` engine → `@hydration` engine again → `vc.actors` + parallel `[profiles, vports]`. Worst case: 4 round trips for actors not in the hydration cache. When hydration cache is warm (typical case for known senders), resolves in 1 round trip. Consider pre-warming the hydration cache for the viewer's social graph at login.

---

**KF-3 — `autoMarkSeen` Trailing Serial Write**  
Severity: LOW  

`markNotificationRecipientsSeenDAL` fires as a serial write after the parallel read batch completes. Adds ~1 RTT to inbox loads with unseen notifications. Low priority.

---

**KF-4 — Inbox Polling (60s, No DAL Cache)**  
Severity: INFO  

React Query polls every 60s while `/notifications` is in foreground. 4-5 DB queries per poll. `refetchIntervalInBackground: false` prevents background accumulation. No change needed; informational only.

---

## KRAVEN Priority Order

1. **KF-1** — Parallelize `publishEvent()` delivery loop (HIGH — affects all notification triggers)
2. **KF-2** — Consider hydration cache pre-warm at login (MODERATE — inbox first-load only)
3. **KF-3** — Optional fire-and-forget `autoMarkSeen` (LOW)
4. **KF-4** — Informational; no action needed

**No CRITICAL or release-blocking performance findings. KF-1 is the only actionable optimization.**

---

---

# IRONMAN Ownership — 2026-05-19

_Appended:_ 2026-05-19  
_Trigger:_ CEREBRO-driven verification pass  
_Application Scope:_ VCSM  
_Ownership file created:_ `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/ironman/vcsm.notifications.owner.md`  
_Standalone audit:_ `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-19_ironman_notifications.md`  

---

## Ownership Clarity Summary

| Area | Clarity | Risk |
|---|---|---|
| Adapter surface (`notifications.adapter.js`) | CLEAR | LOW |
| Engine DAL + runtime (`@notifications` engine) | CLEAR (encapsulated) | LOW |
| Inbox controllers + active hooks | CLEAR | LOW |
| `types/` dispatch layer (13 views) | PARTIAL — no explicit assignment | MEDIUM |
| `inbox/ui/` layer (3 views) | PARTIAL — undocumented | MEDIUM |
| Dead code cluster (5 confirmed dead files) | PARTIAL — no deletion authority | LOW |
| `@notifications` engine audit | MISSING | MEDIUM |
| RLS on `notification.*` tables | UNKNOWN | HIGH |
| Native parity | MISSING | HIGH |

---

## IRONMAN Findings

**IF-1** — `types/` and `inbox/ui/` layer ownership unassigned (MEDIUM)  
13 type-specific views and 3 inbox/ui views are active and functional but have no explicit ownership assignment. Recommended: assign to notifications feature as presentation logic. Domain teams (booking, comment, follow, etc.) should be aware their notification content lives here.

**IF-2** — `@notifications` engine audit missing (MEDIUM)  
Engine has no audit file. Public interfaces, version history, and boundary guarantees are undocumented. Recommended: create engine audit v1 before next engine change.

**IF-3 (BLOCKING for DB audit)** — RLS ownership on `notification.*` tables unverified (HIGH)  
Whether RLS policies correctly scope reads to the authenticated recipient has not been verified in this pass. DB command required.

**IF-4** — `badgeSubscriptions.js` realtime ownership unassigned (LOW)  
Inert placeholder; low risk. Document as notifications-owned placeholder for future realtime implementation.

---

## Ownership Final Status

**PARTIAL** — no critical ownership conflicts; RLS verification (IF-3) is HIGH priority before release.

---

## IMPLEMENTATION TRACEABILITY RECORD

### 2026-05-19

Task: CEREBRO verification pass — notifications DAL document  
Application Scope: VCSM  
Prompt Registry Entry: N/A (administrative verification — exception)  
Code Status Before: All console violations DEV-gated; dead code confirmed; vportClient clarified; badgeSubscriptions inert  
Code Status After: No code changed in this pass  
Files Changed: `vcsm.dal.notifications.md` (appended CEREBRO, VENOM, LOKI, SENTRY, LOGAN, KRAVEN, IRONMAN sections); standalone files created in `_ACTIVE/audits/`  
Command Evidence: VENOM `venom_notifications-dal_2026-05-19.md`; LOKI `loki_notifications-dal_2026-05-19.md`; SENTRY `sentry_notifications-dal_2026-05-19.md`; KRAVEN `2026-05-19_kraven_notifications-dal.md`; IRONMAN `2026-05-19_ironman_notifications.md`; Ownership `vcsm.notifications.owner.md`  
Architecture Contracts Checked: Architecture Contract, Boundary Isolation Contract  
Security / Runtime / DB Notes: vportClient same auth context (RISK-16 deescalated). badgeSubscriptions noops (RISK-12 deescalated). RISK-2 fully resolved. notificationRuntime.dal.js at 300-line limit (CF-5). RLS on notification.* schema unverified (IF-3).  
Validation: All source reads confirmed against live files. No code modified.  
Documentation Truth Status: PARTIAL — 8 corrections identified; corrections not yet applied to existing body sections (append-only policy)

---

# Final Status Table — 2026-05-19

| Command | Status | Report | Blocking |
|---|---|---|---|
| CEREBRO | COMPLETE | Inline — this document | NO |
| DB (static) | VERIFIED (static only) | Inline | NO |
| VENOM | VERIFIED | `CURRENT/features/dashboard/evidence/venom_notifications-dal_2026-05-19.md` | NO |
| LOKI | PARTIAL | `CURRENT/features/dashboard/evidence/loki_notifications-dal_2026-05-19.md` | NO |
| SENTRY | MINOR DRIFT — REVIEW_PENDING | `CURRENT/features/dashboard/evidence/sentry_notifications-dal_2026-05-19.md` + inline | NO |
| KRAVEN | COMPLETE | `_ACTIVE/audits/performance/2026-05-19_kraven_notifications-dal.md` + inline | NO |
| LOGAN | MINOR DRIFT — 8 corrections pending | Inline | NO |
| IRONMAN | PARTIAL | `CURRENT/features/dashboard/evidence/2026-05-19_ironman_notifications.md` + `vcsm.notifications.owner.md` | NO |
| FALCON | MISSING | — | NO (but required before next native release) |

---

## Open Risks (final)

| Risk | Severity | Owner | Status |
|---|---|---|---|
| RISK-1: `screen/views/NotiViewPostScreen.jsx` dead | MEDIUM | SENTRY | DELETE CANDIDATE (confirmed safe) |
| RISK-3: screen/views/ nesting | LOW | SENTRY | OPEN |
| RISK-5: `useNotificationsInternal.js` dead | MEDIUM | SENTRY | DELETE CANDIDATE (confirmed safe) |
| RISK-6: `useMarkNotificationsRead.js` dead + layer violation | MEDIUM | SENTRY | DELETE CANDIDATE (confirmed safe) |
| RISK-7: `useUnreadBadge.js` dead/misattributed | LOW | SENTRY | DELETE CANDIDATE (confirmed safe) |
| RISK-8: `inboxUnread.controller.js` dead shim | LOW | SENTRY | DELETE CANDIDATE (confirmed safe) |
| RISK-9: `mapSummaryRowToSender()` in lib/ | LOW | SENTRY | OPEN |
| RISK-10: `inbox/ui/` undocumented in pipeline | LOW | ARCHITECT/LOGAN | OPEN |
| RISK-11: `types/` dispatch layer undocumented | MODERATE | ARCHITECT/LOGAN | OPEN |
| RISK-13: `resolveInboxActor.js` undocumented | LOW | LOGAN | OPEN |
| RISK-14: RISK-2 path error in doc | LOW | LOGAN | OPEN (correction identified) |
| RISK-15: schema name undocumented | LOW | LOGAN | OPEN (correction identified) |
| CF-2: `badgeSubscriptions.js` inert + uncalled | INFO | SENTRY | DELETE CANDIDATE |
| CF-5: `notificationRuntime.dal.js` at 300-line limit | WARNING | ARCHITECT | OPEN |
| IF-3: RLS on `notification.*` tables unverified | HIGH | DB command | **CLOSED — live DB verified** |
| KF-1: `publishEvent()` serial delivery loop | HIGH | Wolverine (code change) | **RESOLVED** — `Promise.allSettled` applied 2026-05-19 |

---

## Fixed Risks (this full CEREBRO pass)

| Risk | Resolution |
|---|---|
| RISK-2: Unguarded console violations | FULLY RESOLVED — all DEV-gated in live source |
| RISK-5: `useNotificationsInternal.js` dead | DELETED 2026-05-19 |
| RISK-6: `useMarkNotificationsRead.js` dead + layer violation | DELETED 2026-05-19 |
| RISK-7: `useUnreadBadge.js` dead/misattributed | DELETED 2026-05-19 |
| RISK-8: `inboxUnread.controller.js` dead shim | DELETED 2026-05-19 |
| RISK-1: `screen/views/NotiViewPostScreen.jsx` dead duplicate | DELETED 2026-05-19 |
| CF-2: `badgeSubscriptions.js` inert + zero callers | DELETED 2026-05-19 |
| RISK-12: badgeSubscriptions lifecycle concern | DEESCALATED — noops and never called |
| RISK-16: vportClient separate auth concern | DEESCALATED — `supabase.schema('vport')`, same client |
| IRONMAN MISSING (AvengersAssemble 2026-05-11) | Ownership record created — `vcsm.notifications.owner.md` |
| IF-3: RLS on `notification.*` tables | CLOSED — live DB query confirmed RLS enabled + policies correct on all 4 core tables |
| KF-1: `publishEvent()` serial delivery loop | RESOLVED — `Promise.allSettled` parallelization applied in `runtime/index.js`. O(3N×RTT) → O(3×RTT). 299 lines (at limit). |
| IF-2: `@notifications` engine audit missing | CREATED — `NOTIFICATIONS_RUNTIME_ENGINE_AUDIT_V1.md` (2026-05-19) |

---

## Required Next Command

```
1. DB          — COMPLETE: IF-3 CLOSED — RLS verified live; all 4 core tables clean
   INFO: CARNAGE should create retrospective migration script for notification.* RLS policies
2. SENTRY      — execute dead code deletions (RISK-1, RISK-5, RISK-6, RISK-7, RISK-8, CF-2)
                  requires user approval for file deletion
3. LOGAN       — apply 8 doc corrections to existing body sections
4. ~~Wolverine~~ — ~~implement KF-1 publishEvent() parallel delivery loop~~ **DONE** 2026-05-19
5. FALCON      — before next native release (primary bottom-nav surface)
6. ~~LOGAN~~ — ~~create @notifications engine audit v1 (IF-2)~~ **DONE** 2026-05-19
```

---

## DB Pass — `notification.*` RLS Audit (2026-05-19)

**Command:** DB (read-only database review)  
**Standalone report:** `zNOTFORPRODUCTION/_HISTORY/db/snapshots/2026-05-19_14-30_db_notifications-rls-audit.md`  
**Trigger:** IF-3 from IRONMAN pass — RLS on `notification.*` core tables unverified  
**Analysis mode:** Live DB query against linked Supabase project `nkdrjlmbtqbywhcthppm`  
**Evidence quality:** OBSERVED — authoritative

### Live DB Results

**RLS enabled status:** All `notification` schema tables have `rowsecurity = t`. All four core tables confirmed.

**Policies on core tables:**

| Table | Policies | SELECT Enforcement | Write Protection |
|---|---|---|---|
| `recipients` | 2 | `notification.can_access_recipient()` | INSERT: WITH CHECK = false |
| `inbox_items` | 4 | EXISTS (recipients → actor_owners WHERE user_id = auth.uid()) | INSERT: false, DELETE: false |
| `events` | 2 | source_actor_id = current_actor OR EXISTS (recipients → can_access_recipient) | INSERT: WITH CHECK = false |
| `rendered` | 4 | EXISTS (recipients WHERE can_access_recipient()) | INSERT: false, UPDATE: false, DELETE: false |

**`notification.can_access_recipient()` function:** Multi-kind ownership switch covering `app_account` (via `platform.owns_user_app_account`), `actor` (via `platform.owns_actor_via_app_link`), and `user/platform` (via `auth.uid()` match). Default branch returns `false`.

### DB Status

**IF-3 — CLOSED. RLS is fully implemented, enabled, and correctly scoped.**

All four core notification tables have:
- Row-level security enabled (`rowsecurity = t`)
- Read policies scoped to the authenticated recipient actor
- Direct write/mutate paths blocked (all INSERT/UPDATE/DELETE locked to engine RPC paths only)

**One minor informational finding:** RLS policies for `notification.recipients`, `inbox_items`, `events`, and `rendered` are not documented in any static migration file in `_ACTIVE/migrations/`. They exist in the live DB but have no migration trail. CARNAGE should create a retrospective migration script to bring the policy definitions under version control.

---

## Document Status

**VERIFIED**

Full CEREBRO pipeline complete (VENOM ✓, LOKI ✓, SENTRY ✓, KRAVEN ✓, LOGAN ✓, IRONMAN ✓, DB ✓). Dead code cluster eliminated — 6 files deleted (RISK-1, 5, 6, 7, 8, CF-2). 8 in-place doc corrections applied. IF-3 CLOSED — RLS fully verified. KF-1 RESOLVED — `publishEvent()` delivery parallelized. IF-2 CLOSED — engine audit v1 created (`NOTIFICATIONS_RUNTIME_ENGINE_AUDIT_V1.md`). Remaining open items: FALCON native parity review (before next native release), CARNAGE retrospective migration script for `notification.*` RLS policies.

**Engine Audit Reference:**  
`zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/notifications/NOTIFICATIONS_RUNTIME_ENGINE_AUDIT_V1.md`

---

## Change Log

### 2026-05-19 — Full CEREBRO Verification Pass

**Task:** CEREBRO full pipeline on `vcsm.dal.notifications.md`  
**Application Scope:** VCSM  
**Prompt Registry Entry:** `zNOTFORPRODUCTION/_ACTIVE/planning/May/19/19-01.md`  
**Code Status Before:** Notifications feature partially documented; dead code cluster; IF-3 unverified; KF-1 unresolved; IF-2 missing  
**Code Status After:** All issues resolved. 6 files deleted. `runtime/index.js` parallelized (299 lines). Engine audit v1 created.  

**Files Changed:**

| File | Change |
|---|---|
| `apps/VCSM/src/features/notifications/runtime/index.js` | KF-1: serial delivery loop → `Promise.allSettled` (299 lines) |
| `apps/VCSM/src/dev/diagnostics/groups/notificationsFeature.group.js` | Removed broken `badgeSubscriptions` import; `realtime_channels` test returns `makeSkipped` |
| `apps/VCSM/src/features/notifications/inbox/controller/inboxUnread.controller.js` | DELETED — 1-line chat re-export shim (boundary violation) |
| `apps/VCSM/src/features/notifications/inbox/hooks/useUnreadBadge.js` | DELETED — misattributed chat hook |
| `apps/VCSM/src/features/notifications/inbox/realtime/badgeSubscriptions.js` | DELETED — noops, never called |
| `apps/VCSM/src/features/notifications/inbox/hooks/useNotificationsInternal.js` | DELETED — dead implementation |
| `apps/VCSM/src/features/notifications/inbox/hooks/useMarkNotificationsRead.js` | DELETED — dead + layer violation |
| `apps/VCSM/src/features/notifications/screen/views/NotiViewPostScreen.jsx` | DELETED — dead duplicate view |
| `NOTIFICATIONS_RUNTIME_ENGINE_AUDIT_V1.md` | CREATED — `@notifications` engine audit v1 (IF-2) |

**Command Evidence:**

| Command | Report | Status |
|---|---|---|
| VENOM | inline in main doc | COMPLETE |
| SENTRY | `CURRENT/features/dashboard/evidence/sentry_notifications-dal_2026-05-19.md` | ALIGNED |
| LOKI | `CURRENT/features/dashboard/evidence/loki_notifications-dal_2026-05-19.md` | COMPLETE (v2 full pass) |
| KRAVEN | `_ACTIVE/audits/performance/2026-05-19_kraven_notifications-dal.md` | COMPLETE — KF-1 RESOLVED |
| IRONMAN | `_CANONICAL/logan/marvel/ironman/vcsm.notifications.owner.md` | COMPLETE |
| DB | `_HISTORY/db/snapshots/2026-05-19_14-30_db_notifications-rls-audit.md` | IF-3 CLOSED |
| LOGAN | This document + `NOTIFICATIONS_RUNTIME_ENGINE_AUDIT_V1.md` | COMPLETE |

**Architecture Contracts Checked:** Boundary Isolation Contract, Architecture Contract, Actor Ownership Contract  
**Security Notes:** IF-3 CLOSED — RLS fully verified live. All 10 `notification.*` tables `rowsecurity = t`. Core tables write-locked via `WITH CHECK = false`.  
**Performance Notes:** KF-1 RESOLVED — `publishEvent` O(3N×RTT) → O(3×RTT) via `Promise.allSettled`.  
**Validation:** All changes statically verified against source. Live DB query confirmed RLS state.  
**Documentation Truth Status:** VERIFIED
