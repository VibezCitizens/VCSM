---
title: Inbox Module — Index
status: STUB
feature: notifications
module: inbox
source: venom+bw-derived
created: 2026-06-05
---

# notifications / modules / inbox

Notification inbox list — reads, counts, filters, marks read/dismissed/archived. Primary mutation surface; all actor inbox state changes flow through here.

## Source Files

| File | Layer |
|---|---|
| inbox/controller/Notifications.controller.js | controller |
| inbox/controller/NotificationsHeader.controller.js | controller |
| inbox/controller/notificationsCount.controller.js | controller |
| inbox/dal/blocks.read.dal.js | read DAL |
| inbox/dal/senders.read.dal.js | read DAL |
| inbox/hooks/useNotiCount.js | hook |
| inbox/hooks/useNotificationInbox.js | hook |
| inbox/hooks/useNotifications.js | hook |
| inbox/hooks/useNotificationsHeader.js | hook |
| inbox/lib/blockFilter.js | lib |
| inbox/lib/resolveInboxActor.js | lib |
| inbox/lib/resolveSenders.js | lib |
| inbox/model/notification.model.js | model |
| inbox/ui/NotificationItem.view.jsx | UI |
| inbox/ui/Notifications.view.jsx | UI |
| inbox/ui/NotificationsHeader.view.jsx | UI |
| screen/NotificationsScreen.jsx | screen |
| screen/views/NotificationsScreenView.jsx | view |

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## THOR Status

**THOR RELEASE BLOCKER** — INBOX-SEC-001 (CRITICAL), INBOX-SEC-002 (HIGH)
