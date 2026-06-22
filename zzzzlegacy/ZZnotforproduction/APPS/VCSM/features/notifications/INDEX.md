---
name: vcsm.notifications.index
description: VCSM notifications feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / notifications

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-04
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 7 | Notifications.controller.js, NotificationsHeader.controller.js, notificationsCount.controller.js (callgraph count) |
| DAL files | 25 | notificationRuntime.dal.js (primary — all notification.* schema operations), blocks.read.dal.js, senders.read.dal.js |
| Hooks | 7 | useNotificationInbox.js (primary), useNotifications.js, useNotiCount.js, useNotificationsHeader.js, useMyAppointments.js |
| Models | 4 | notificationRuntime.model.js (inbox row mapper), notification.model.js (domain mapper + kind normalizer) |
| Screens | 38 | NotificationsScreen.jsx, NotiViewPostScreen.jsx, NotificationsScreenView.jsx, MyAppointmentsView.jsx, 14 typed item views (booking, comment, follow, reaction, mention, review, team) |
| Components | 1 | NotificationCard.jsx |
| Adapters | 1 | notifications.adapter.js — exposes publishVcsmNotification, publishVcsmNotificationBatch, getUnreadNotificationCount |
| Barrels | 3 | runtime/index.js (engine barrel + implementation), publish.js, setup.js |
| Tests | 0 | No test files detected by scanner |
| Routes | 0 | No static route entries; navigation is dynamic via app router |
| Total source files | 43 | From scanner feature-map |

## Write Surface Map

| Operation | Schema | Table | Function |
|---|---|---|---|
| rpc | notification | — | insertNotificationEventDAL → create_event |
| rpc | notification | — | insertNotificationRecipientsDAL → insert_recipients |
| rpc | notification | — | upsertNotificationRenderedDAL → upsert_rendered |
| rpc | notification | — | insertNotificationInboxItemDAL → insert_inbox_item |
| rpc | notification | — | updateNotificationRecipientStatusDAL → update_recipient_status |
| update | notification | inbox_items | markNotificationRecipientsSeenDAL |
| update | notification | inbox_items | markNotificationReadDAL |
| update | notification | inbox_items | dismissNotificationDAL |
| update | notification | inbox_items | archiveNotificationDAL |

## Security-Sensitive Surfaces

The `publishVcsmNotification` and `publishVcsmNotificationBatch` functions write to `notification.events` and `notification.recipients` with a `recipientActorId` supplied by the caller. The self-notification guard (`actorId === recipientActorId`) is enforced client-side only in `publish.js`. There is no documented server-side ownership check or RLS policy confirming that the calling actor is authorized to send notifications to the declared recipient. This is a HIGH sensitivity surface — recommend VENOM / ELEKTRA audit.

`markNotificationReadDAL`, `dismissNotificationDAL`, and `archiveNotificationDAL` update `notification.inbox_items` scoped by `recipient_id` only. If `recipient_id` is not validated as belonging to the calling actor at the RLS layer, any actor who learns a `recipient_id` could modify another actor's inbox state.

## Engine Dependencies

- notification (primary — runtime/index.js IS the engine implementation; `@notifications` alias resolves here)
- hydration (sender resolution via `hydrateAndReturnSummaries` in setup.js)
- identity (actor resolution via `useIdentity()` in useNotificationInbox)
- booking, profile, review (listed by scanner engine-candidate pass — likely consumed by caller features, not this module directly)

## Routes

No routes registered in the static route-map for this feature. The notifications screen is reached via dynamic in-app navigation through the app router (bottom tab or notification badge tap). No public-facing routes exist in this module.

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT — placeholder only, no contract content |
| ARCHITECTURE.md | PRESENT (this run — 2026-06-04) |
| CURRENT_STATUS.md | PRESENT (this run — 2026-06-04) |
