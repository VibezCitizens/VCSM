---
title: Inbox Module — Architecture
status: STUB
feature: notifications
module: inbox
source: venom+bw-derived
created: 2026-06-05
---

# notifications / modules / inbox — ARCHITECTURE

## Read Path

```
useNotificationInbox / useNotifications
  └── Notifications.controller.js
        ├── resolveInboxActor.js → myActorId (vport branch: null if ownerActorId missing) ← BW-NOTI-003
        ├── blocks.read.dal.js → blocked actor list
        ├── senders.read.dal.js → sender profiles
        ├── blockFilter.js → filters inbox by blocked senders
        └── notification.model.js → domain mapping
```

## Mark Read/Dismiss/Archive Path

```
useNotificationsHeader → NotificationsHeader.controller.js
  └── markAllNotificationsSeen(actorId from prop) ← BW-NOTI-002
        └── engines/notifications → markSeen/markRead/dismiss/archive
              └── notification.inbox_items UPDATE
                    ├── recipientId = caller-supplied ← VEN-NOTIFICATIONS-002 / BW-NOTI-001 CRITICAL
                    └── RLS = UNVERIFIED ← BW-NOTI-004
```

## Count Path

```
useNotiCount
  └── notificationsCount.controller.js
        └── notification.inbox_items SELECT count
              └── RLS (UNVERIFIED)
```

## Diagnostics Namespace Mismatch

```
diagnostics panel → markRead({ recipientId: actorId })
                                              ↑ actorId used where recipientId expected ← VEN-NOTIFICATIONS-003
```

## TODO

- [ ] Confirm notification.inbox_items RLS policies (SELECT + UPDATE)
- [ ] Trace recipientId source through controller chain
