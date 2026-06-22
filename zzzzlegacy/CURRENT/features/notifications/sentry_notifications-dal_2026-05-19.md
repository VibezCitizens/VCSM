# SENTRY — Compliance Audit: Notifications DAL

**Date:** 2026-05-19  
**Triggered by:** CEREBRO pass on `vcsm.dal.notifications.md`  
**Scope:** Notifications feature — dead code verification, layer violations, boundary compliance  
**Status:** REVIEW_PENDING — deletion decisions require user approval  

---

## Dead Code Confirmation (All confirmed zero external consumers)

### RISK-1: `screen/views/NotiViewPostScreen.jsx`

**Status: CONFIRMED DEAD**

Router (`lazyApp.jsx`) lazy-loads from `@/features/notifications/screen/NotiViewPostScreen` (Final Screen at `screen/NotiViewPostScreen.jsx`). The `screen/views/NotiViewPostScreen.jsx` file has zero routing references. It is a different, older implementation that is not routed and not imported by any production file.

**Action required:** Delete `apps/VCSM/src/features/notifications/screen/views/NotiViewPostScreen.jsx` after confirming no dynamic `import()` references.

---

### RISK-5: `useNotificationsInternal.js`

**Status: CONFIRMED DEAD**

`useNotificationsInternal` uses the old `useState`/`useEffect` pattern, replaced by `useNotificationInbox` (React Query). Grep confirms zero external consumers. The file imports from `social.adapter` and `Notifications.controller` but nothing imports from it.

**Action required:** Delete `apps/VCSM/src/features/notifications/inbox/hooks/useNotificationsInternal.js`.

---

### RISK-6: `useMarkNotificationsRead.js`

**Status: CONFIRMED DEAD + LAYER VIOLATION**

Both exports (`useMarkNotificationRead`, `useMarkAllNotificationsRead`) have zero external consumers. Additionally, `useMarkNotificationRead` calls `markRead()` directly from `@notifications` engine without going through a controller — a contract violation (Hooks → Controllers → Engine/DAL).

Note: `useMarkAllNotificationsRead` correctly calls `markAllNotificationsSeen()` from the controller layer — only `useMarkNotificationRead` has the violation.

All console calls in the file are DEV-gated. 

**Action required:** Delete `apps/VCSM/src/features/notifications/inbox/hooks/useMarkNotificationsRead.js`. If mark-notification-read functionality is ever needed, implement it via a controller first.

---

### RISK-7: `useUnreadBadge.js`

**Status: CONFIRMED DEAD + MISATTRIBUTED**

The hook queries chat unread count via `useChatUnreadOps()` — no connection to notifications DAL, engine, or controller. Zero external consumers.

**Action required:** Delete `apps/VCSM/src/features/notifications/inbox/hooks/useUnreadBadge.js`. If chat unread badge functionality is needed in the chat feature, implement there.

---

### RISK-8: `inboxUnread.controller.js`

**Status: CONFIRMED DEAD + FEATURE BOUNDARY VIOLATION**

File content (entire file):
```js
export { getChatInboxUnreadBadgeCount, getInboxUnreadBadgeCount } from '@/features/chat/inbox/controller/chatUnread.controller'
```

A notifications controller file re-exporting chat controller functions is a direct feature boundary violation per contract. Zero external consumers import from this file. Dev diagnostics bypass this shim and import from chat controller directly.

**Action required:** Delete `apps/VCSM/src/features/notifications/inbox/controller/inboxUnread.controller.js`.

---

### `badgeSubscriptions.js` (Additional Finding)

**Status: INERT + UNCALLED**

Both exported functions are explicit noops and neither is imported anywhere. File exists in `inbox/realtime/` but has no effect on the system.

**Action required:** Delete `apps/VCSM/src/features/notifications/inbox/realtime/badgeSubscriptions.js` or retain as documented placeholder if realtime subscriptions are planned. Comment in file explicitly states "disabled for now."

---

## Layer Violations (Open)

### RISK-9: `mapSummaryRowToSender()` in `lib/resolveSenders.js`

**Status: OPEN**

`inbox/lib/resolveSenders.js` contains `mapSummaryRowToSender()` — a pure domain transform that maps raw actor rows to sender shape objects. Per contract, domain transforms belong in the `model/` layer. The function is pure (no side effects, no DB access) but sits in `lib/`.

**Action required:** Move `mapSummaryRowToSender()` to `notification.model.js`. Keep the waterfall resolution logic in `resolveSenders.js` (that's orchestration, not a domain transform).

---

## Folder Organization (Open)

### RISK-3: `screen/views/` nesting

**Status: OPEN**

`screen/` contains both Final Screen files (`NotificationsScreen.jsx`, `NotiViewPostScreen.jsx`) and View Screens (`views/NotificationsScreenView.jsx`, `views/MyAppointmentsView.jsx`). Per contract, View Screens should be at a distinct `ui/` layer.

**Note:** The feature already has an `inbox/ui/` folder with `NotificationItem.view.jsx`, `Notifications.view.jsx`, `NotificationsHeader.view.jsx` — indicating the `ui/` convention exists. The `screen/views/` folder is inconsistent with this.

**Action required (LOW priority):** Move `screen/views/NotificationsScreenView.jsx` and `screen/views/MyAppointmentsView.jsx` to `features/notifications/ui/` per contract. Update imports in `NotificationsScreen.jsx`.

---

## Contract Compliance Verification

| Rule | Status | Notes |
|---|---|---|
| No `.ts`/`.tsx` files | ✓ CLEAN | Zero found |
| No `select('*')` | ✓ CLEAN | All DAL files use explicit column lists |
| Path aliases (`@/`) | ✓ CLEAN | All cross-folder imports verified |
| Adapter boundary (production) | ✓ CLEAN | All 15+ consumers use `notifications.adapter.js` |
| File length ≤ 300 lines | ⚠ AT LIMIT | `notificationRuntime.dal.js` = exactly 300 lines; `runtime/index.js` = 299 lines |
| Hooks → Controllers → Engine/DAL | ⚠ VIOLATION | `useMarkNotificationsRead.js` (dead — RISK-6) |
| Features don't cross-import internals | ⚠ VIOLATION | `inboxUnread.controller.js` (dead — RISK-8) |
| Domain transforms in model/ | ⚠ VIOLATION | `mapSummaryRowToSender()` in lib/ (RISK-9) |

**FILE LENGTH WARNING:** `notificationRuntime.dal.js` is exactly at the 300-line contract limit. Any additions will violate the limit. Plan a split before adding new functions.

---

## Deletion Priority Order

1. `inbox/controller/inboxUnread.controller.js` — 1-line chat re-export (RISK-8, zero deps)
2. `inbox/hooks/useUnreadBadge.js` — misattributed chat hook (RISK-7, zero deps)
3. `inbox/realtime/badgeSubscriptions.js` — noops, never called (additional finding, zero deps)
4. `inbox/hooks/useNotificationsInternal.js` — dead useState/useEffect hook (RISK-5)
5. `inbox/hooks/useMarkNotificationsRead.js` — dead + layer violation (RISK-6)
6. `screen/views/NotiViewPostScreen.jsx` — dead duplicate view (RISK-1)

All deletions confirmed safe based on zero consumer grep. No dynamic `import()` references found for any of these files.
