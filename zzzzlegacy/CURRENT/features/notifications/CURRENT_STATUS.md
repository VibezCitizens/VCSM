---
# notifications — CURRENT_STATUS.md
# Last Updated: 2026-06-02
# Source: Audit sprint 2026-05-19 (CEREBRO-triggered)
# Status: CURRENT SOURCE OF TRUTH

## Feature Status

Status: ACTIVE
Security Tier: MEDIUM
Feature Path: apps/VCSM/src/features/notifications/
Engine: engines/@notifications (consumed via configureNotificationsEngine)

## Command Audit Status

| Command | Status | Date | Open Findings |
|---|---|---|---|
| VENOM | COMPLETE | 2026-05-19 | RISK-6 layer violation (dead code, LOW) |
| LOKI | COMPLETE | 2026-05-19 | LF-1 (triple invalidation, LOW), LF-2 (5 undocumented tables, LOW) |
| IRONMAN | COMPLETE | 2026-05-19 | Publish ACL gap OPEN (MEDIUM); UI layer ownership UNASSIGNED; native parity MISSING |
| KRAVEN | COMPLETE | 2026-05-19 | KF-1 serial publish delivery loop OPEN (ELEVATED) |
| SENTRY | REVIEW_PENDING | 2026-05-19 | 6 dead files pending deletion approval; RISK-9 domain transform misplacement OPEN |
| THOR | NOT_STARTED | — | — |
| BLACKWIDOW | NOT_STARTED | — | — |
| CARNAGE | NOT_STARTED | — | RLS ownership for notification.* tables undocumented |
| DB | NOT_STARTED | — | 5 undocumented tables flagged (LF-2): preferences, delivery_attempts, templates, push_subscriptions, event_types |
| FALCON | MISSING | — | No native parity review; native ownership UNASSIGNED |
| ARCHITECT | NOT_STARTED | — | — |

## Open Findings Summary

### OPEN — RISK-6 (VENOM / SENTRY)
Dead code + layer violation: `useMarkNotificationsRead.js` — `useMarkNotificationRead` calls `markRead()` directly from `@notifications` engine, bypassing controller. File confirmed dead (zero consumers). Pattern must not be replicated. Deletion approved pending user sign-off.

### OPEN — LF-1 (LOKI)
`markAllNotificationsSeen` path triple-invalidates `notificationUnread` query key. React Query deduplicates — functionally harmless. Code clarity issue only.

### OPEN — LF-2 (LOKI)
Five notification schema tables exist in live DB with no documentation in DAL doc or IRONMAN record: `notification.preferences`, `notification.delivery_attempts`, `notification.templates`, `notification.push_subscriptions`, `notification.event_types`. Scope: engine audit v1 (IF-2).

### OPEN — KF-1 (KRAVEN)
`publishEvent()` delivery loop is serial per-recipient: 3 awaits × N recipients = O(N × 3 × RTT). For 10 recipients: ~150ms+ at 5ms/RTT; for 50 recipients: 152 serial DB ops. Recommended fix: `Promise.allSettled` across recipients.

### OPEN — Publish ACL gap (IRONMAN)
No documented rule controlling who can publish notifications. Any caller via `notifications.adapter.js` can publish. No enforcement layer documented.

### OPEN — RISK-9 (SENTRY)
`mapSummaryRowToSender()` in `inbox/lib/resolveSenders.js` — pure domain transform sitting in lib/ instead of model/. Should move to `notification.model.js`.

### OPEN — Dead file deletion (SENTRY / REVIEW_PENDING)
6 files confirmed dead and pending deletion approval:
1. `inbox/controller/inboxUnread.controller.js` (RISK-8 — chat re-export boundary violation)
2. `inbox/hooks/useUnreadBadge.js` (RISK-7 — misattributed chat hook)
3. `inbox/realtime/badgeSubscriptions.js` (noops, never called)
4. `inbox/hooks/useNotificationsInternal.js` (RISK-5 — dead useState/useEffect hook)
5. `inbox/hooks/useMarkNotificationsRead.js` (RISK-6 — dead + layer violation)
6. `screen/views/NotiViewPostScreen.jsx` (RISK-1 — dead duplicate view)

### OPEN — UI layer ownership (IRONMAN)
`inbox/ui/` views (3 files) and `types/` dispatch layer (13 files) have no documented owner. `types/` dispatch covers booking/comment/follow etc — ownership conflict unclear.

## File Length Warning (SENTRY)
`notificationRuntime.dal.js` is exactly at the 300-line contract limit. Any additions will violate the limit. Split required before adding new functions.
---
