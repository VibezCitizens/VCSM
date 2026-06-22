---
title: Runtime Module — Architecture
status: STUB
feature: notifications
module: runtime
source: venom+bw-derived
created: 2026-06-05
---

# notifications / modules / runtime — ARCHITECTURE

## Publish Path

```
[consuming feature]
  └── notifications.adapter.js → publishVcsmNotification(payload)
        └── publish.js
              └── engines/notifications → publishEvent
                    ├── sourceActorId = caller-supplied ← VEN-NOTIFICATIONS-004 / BW-NOTI-005
                    ├── linkPath = caller-supplied (raw UUID risk) ← BW-NOTI-009
                    └── notification.inbox_items INSERT
```

## Realtime Subscription

```
app boot → setup.js → configureNotificationRuntime
  └── notificationRuntime.dal.js → Supabase realtime channel
        └── notification.inbox_items changes → notificationRuntime.model.js
```

## Optimistic Replace Event

```
window.addEventListener('noti:optimistic:replace', payload)
  └── unvalidated external payload ← VEN-NOTIFICATIONS-005 (XSS vector)
```

## TODO

- [ ] Confirm notification.inbox_items realtime policy (UNVERIFIED)
- [ ] Confirm linkPath format expected by navigation layer
