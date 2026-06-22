# Runtime Feature Index: notifications

## Metadata
| Field | Value |
|---|---|
| Feature | notifications |
| CURRENT Folder | CURRENT/features/notifications |
| Source Folder | apps/VCSM/src/features/notifications |
| Generated | 2026-06-02 |
| Scope | VCSM |
| Evidence Mode | Source scan + CURRENT evidence |
| ARCHITECT Run | 2026-06-02 (ARCHITECT-NOTIFICATIONS-0001) |

## Source Inventory
| Layer | Count | Key Files |
|---|---:|---|
| Controllers | 3 | Notifications.controller.js, NotificationsHeader.controller.js, notificationsCount.controller.js |
| DALs | 3 | blocks.read.dal.js, senders.read.dal.js, notificationRuntime.dal.js |
| Hooks | 5 | useNotificationInbox.js, useNotifications.js, useNotiCount.js, useNotificationsHeader.js, useMyAppointments.js |
| Models | 2 | notification.model.js, notificationRuntime.model.js |
| Screens | 2 | NotificationsScreen.jsx, NotiViewPostScreen.jsx (DEAD — pending deletion) |
| Components | 14 | NotificationCard.jsx + 13 notification type views (booking x3, comment x3, follow x3, mention x1, reaction x3, review x1, team x1) |
| Lib (utility) | 3 | blockFilter.js, resolveInboxActor.js, resolveSenders.js |
| Views | 3 | Notifications.view.jsx, NotificationsHeader.view.jsx, NotificationItem.view.jsx |
| Screen Views | 2 | NotificationsScreenView.jsx, MyAppointmentsView.jsx |
| Adapter | 1 | notifications.adapter.js |
| Publish bridge | 1 | publish.js |
| Setup | 1 | setup.js |
| Routes | 1 | /notifications — protected |
| Tests | 0 | NONE FOUND |

**Engine Files (engines/notifications/src/):**
| Layer | Count | Key Files |
|---|---:|---|
| Engine Controllers | 3 | publishEvent.controller.js, getInbox.controller.js, countUnread.controller.js |
| Engine DALs | 7+ | inbox.read.dal.js + events/recipients/rendered/preferences write DALs |
| Engine Config | 2 | config.js, events.js |
| Engine Adapters | 1 | adapters/index.js |

## Route / Screen Map
| Route / Screen | Source Path | Public/Auth/Owner | Notes |
|---|---|---|---|
| /notifications | NotificationsScreen.jsx → NotificationsScreenView.jsx | AUTH | Main notification inbox with badge count and mark-all-seen |
| /notifications (appointments tab) | MyAppointmentsView.jsx | AUTH | Booking appointment list — upcoming, pending, past |
| NotiViewPostScreen.jsx | screen/NotiViewPostScreen.jsx | AUTH | DEAD — confirmed duplicate, pending deletion (SENTRY RISK-1) |

## Mutation Surface Map
| Surface | Source Path | Write Type | Ownership Gate Known | Risk |
|---|---|---|---|---|
| `publishVcsmNotification()` | adapters/notifications.adapter.js → publish.js | INSERT via engine (notification.events, notification.recipients, notification.rendered, notification.inbox_items) | NO — no ACL rule controls callers | MEDIUM |
| `publishVcsmNotificationBatch()` | adapters/notifications.adapter.js → publish.js | INSERT (batch, same tables) | NO — same ACL gap | MEDIUM |
| `markAllNotificationsSeen()` | inbox/controller/NotificationsHeader.controller.js | UPDATE notification.inbox_items (is_seen) | PARTIAL — actorId parameter guard only | LOW |
| `autoMarkSeen` in `getInboxNotifications` | runtime/notificationRuntime.dal.js | UPDATE notification.inbox_items | PARTIAL — recipientActorId is the only filter | LOW |
| `cancelAppointment()` | screen/hooks/useMyAppointments.js → booking.adapter | UPDATE (booking state via engine) | PARTIAL — actorId passed to cancelBooking | MEDIUM |
| `dismissAppointment()` | screen/hooks/useMyAppointments.js → @booking engine | UPDATE (booking state) | PARTIAL — actorId guard | LOW |
| `markNotificationReadDAL` | runtime/notificationRuntime.dal.js | UPDATE notification.inbox_items | PARTIAL — recipientId direct; no ownership assertion | LOW |
| `dismissNotificationDAL` | runtime/notificationRuntime.dal.js | UPDATE notification.inbox_items | PARTIAL — recipientId direct; no ownership assertion | LOW |
| `archiveNotificationDAL` | runtime/notificationRuntime.dal.js | UPDATE notification.inbox_items | PARTIAL — recipientId direct; no ownership assertion | LOW |

## Security-Sensitive Surface Map
| Surface | Source Path | Sensitivity | Evidence |
|---|---|---|---|
| `publishVcsmNotification()` via adapter | adapters/notifications.adapter.js | MEDIUM — publish ACL gap | IRONMAN OPEN: any caller can publish to any actorId; no enforcement documented |
| Inbox fetch `getInboxNotifications` | inbox/controller/Notifications.controller.js | LOW — session-scoped | Actor guard via resolveInboxActor; block filter applied |
| `notificationRuntime.dal.js` | runtime/notificationRuntime.dal.js | DB_LIMIT | AT 300-line contract limit; split required before adding functions |
| Dead code with layer violation | inbox/hooks/useMarkNotificationsRead.js | LOW | VENOM RISK-6: calls @notifications engine directly, bypassing controller; must not be replicated |
| Chat re-export boundary violation | inbox/controller/inboxUnread.controller.js | LOW | SENTRY RISK-8: dead file with boundary violation pending deletion |
| 5 undocumented schema tables | notification.* DB | DB_RLS UNKNOWN | preferences, delivery_attempts, templates, push_subscriptions, event_types — no RLS documentation |

## Dead Files Pending Deletion (SENTRY REVIEW_PENDING)
| File | Risk ID | Reason |
|---|---|---|
| `inbox/controller/inboxUnread.controller.js` | RISK-8 | Dead — chat re-export boundary violation |
| `inbox/hooks/useUnreadBadge.js` | RISK-7 | Dead — misattributed chat hook |
| `inbox/realtime/badgeSubscriptions.js` | — | Dead — noops, never called |
| `inbox/hooks/useNotificationsInternal.js` | RISK-5 | Dead — unused useState/useEffect hook |
| `inbox/hooks/useMarkNotificationsRead.js` | RISK-6 | Dead + layer violation |
| `screen/views/NotiViewPostScreen.jsx` | RISK-1 | Dead — duplicate view |

## Open Findings Summary
| Finding | Severity | Source | Status |
|---|---|---|---|
| KF-1 — serial publish delivery loop O(N×3×RTT) | ELEVATED | KRAVEN 2026-05-19 | OPEN |
| Publish ACL gap — no publisher enforcement | MEDIUM | IRONMAN 2026-05-19 | OPEN |
| RISK-9 — domain transform in lib/ not model/ | LOW | SENTRY 2026-05-19 | OPEN |
| 6 dead files pending deletion | LOW | SENTRY 2026-05-19 | REVIEW_PENDING |
| 5 undocumented notification schema tables | LOW | LOKI/DB 2026-05-19 | OPEN |
| notificationRuntime.dal.js at 300-line limit | LOW | SENTRY 2026-05-19 | OPEN |
| UI layer + types dispatch ownership unassigned | LOW | IRONMAN 2026-05-19 | OPEN |

## Architecture Summary
- **Architecture State:** EVOLVING (migration from legacy vc.notifications DAL complete; dead file cleanup in progress)
- **Module Status:** MOSTLY COMPLETE
- **Engine Integration:** COMPLETE — @notifications engine wired via setup.js DI pattern
- **Publish Surface:** ADAPTER COMPLETE — notifications.adapter.js is the correct public boundary
- **THOR Status:** BLOCKED — open MEDIUM finding (publish ACL), KF-1 ELEVATED, no test coverage, BLACKWIDOW not run

## Recommended Next Command

SPIDER-MAN (zero test coverage), then CARNAGE (RLS undocumented for 5 notification schema tables), then BLACKWIDOW (adversarial runtime verification never run).

## Recommended Next Ticket

TICKET-NOTIFICATIONS-RUNTIME-001 — Delete 6 dead files (pending SENTRY sign-off), relocate `mapSummaryRowToSender()` from lib/ to model/ (RISK-9), fix KF-1 parallel delivery with Promise.allSettled, document publish ACL enforcement rule, and split notificationRuntime.dal.js before adding new functions.
