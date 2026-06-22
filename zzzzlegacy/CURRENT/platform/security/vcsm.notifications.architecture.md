# MODULE ARCHITECTURE REPORT

**Module:** notifications
**Application Scope:** apps/VCSM
**Module Type:** Feature Module — Notification Inbox & Publishing
**Primary Root:** `apps/VCSM/src/features/notifications/`
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

Owns notification rendering: inbox display, unread badge count, notification type views (follow, mention, reaction, comment, booking, review, team invite), realtime badge updates, and notification publishing. Wraps the `@notifications` engine via `setup.js`.

---

## ENTRY POINTS

- `/notifications` → `NotificationsScreen.jsx`
- `/notifications/post/:postId` → `NotiViewPostScreen.jsx`

---

## LAYER MAP

**inbox/ sub-module:**
DAL: `blocks.read.dal.js`, `senders.read.dal.js`
Controllers: `Notifications.controller.js`, `NotificationsHeader.controller.js`, `inboxUnread.controller.js`, `notificationsCount.controller.js`
Hooks: `useMarkNotificationsRead.js`, `useNotiCount.js`, `useNotificationInbox.js`, `useNotifications.js`, `useNotificationsHeader.js`, `useNotificationsInternal.js`, `useUnreadBadge.js`
Model: `notification.model.js`
Realtime: `badgeSubscriptions.js`
Lib: `blockFilter.js`, `resolveInboxActor.js`, `resolveSenders.js`
UI: `NotificationItem.view.jsx`, `Notifications.view.jsx`, `NotificationsHeader.view.jsx`

**runtime/ sub-module:**
- `notificationRuntime.dal.js` — runtime DAL
- `notificationRuntime.model.js` — runtime model
- `runtime/index.js`

**screen/ sub-module:**
- `NotificationsScreen.jsx` — final screen
- `NotiViewPostScreen.jsx` — post-from-notification screen (DUPLICATE: also `screen/views/NotiViewPostScreen.jsx`)
- `hooks/useMyAppointments.js` — appointments hook inside screen (layer violation: hook in screen folder)
- `views/MyAppointmentsView.jsx`
- `views/NotiViewPostScreen.jsx` (DUPLICATE of `screen/NotiViewPostScreen.jsx`)
- `views/NotificationsScreenView.jsx`

**types/ sub-module (notification type views):**
- booking: `BookingCancelledNotificationItem.view.jsx`, `BookingConfirmedNotificationItem.view.jsx`, `BookingCreatedNotificationItem.view.jsx`
- comment: `CommentLikeNotificationItem.view.jsx`, `CommentNotificationItem.view.jsx`, `CommentReplyNotificationItem.view.jsx`
- components: `NotificationCard.jsx`
- follow: `AcceptFriendRequestItem.jsx`, `FollowNotificationItem.view.jsx`, `FollowRequestItem.view.jsx`
- mention: `PostMentionNotificationItem.view.jsx`
- reaction: `PostDislikeNotificationItem.view.jsx`, `PostLikeNotificationItem.view.jsx`, `PostRoseNotificationItem.view.jsx`
- review: `ReviewCreatedNotificationItem.view.jsx`
- team: `TeamInviteNotificationItem.view.jsx`

**Other:**
- `publish.js` — notification publishing function
- `setup.js` — engine setup

**Adapter:** `notifications.adapter.js`

**Store:** None (realtime via `badgeSubscriptions.js`)

**Engine Consumers:** `@notifications` engine (via setup.js)

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Notification inbox clear | — |
| Owner defined | PARTIAL | No IRONMAN record | — |
| Entry points mapped | PASS | NotificationsScreen, NotiViewPostScreen | — |
| Controllers present/delegated | PASS | 4 controllers | — |
| DAL/repository present/delegated | PASS | 3 local DALs | — |
| Models/transformers present | PASS | 2 models | — |
| Hooks/view models present | PARTIAL | 7 inbox hooks, 1 hook inside screen/ | Hook in screen/ = layer violation |
| Screens/components present | PASS | 2 screens + 15 notification type views | — |
| Services/adapters present | PASS | notifications.adapter.js | — |
| Database objects mapped | PARTIAL | notifications schema (engine) + vc.blocks | Engine tables not mapped |
| Authorization path mapped | PARTIAL | Block filter in inbox | No auth gate on notifications screen |
| Cache/runtime behavior mapped | PARTIAL | badgeSubscriptions.js realtime | TTL cache not documented |
| Error/loading/empty states mapped | PARTIAL | Some present | Not systematic |
| Documentation linked | FAIL | No Logan doc | — |
| Tests/validation noted | FAIL | No tests | — |
| Native parity noted | N/A | — | — |
| Engine dependencies mapped | PARTIAL | @notifications via setup.js | Engine boundary not documented |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| `@notifications` engine | engine | notifications → @notifications | YES | Core notification data |
| `booking` feature | feature | notifications → booking | YES | Booking notification types |
| `post` feature | feature | notifications → post | YES (via link) | Post notification navigation |
| `block` feature | feature | notifications → block | PARTIAL | blockFilter.js inside inbox/lib |
| notifications schema | database | @notifications engine | YES (via engine) | — |
| vc.blocks | database | notifications reads | YES | Block filtering |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| Notification list | read | @notifications engine | NotificationsScreen | — |
| Unread count | derived | notifications (+ chat unread?) | Badge, TabBar | Overlap with chat unread count |
| Badge count | derived | notifications | App shell | Realtime subscribed |
| Notification type views | read | notifications | NotificationsScreen | — |
| publish.js | write | notifications | All other features | All features call this to emit notifications |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PASS | NotificationsScreen routed | — |
| Loading state | PARTIAL | Not confirmed | — |
| Empty state | PARTIAL | Not confirmed | — |
| Error state | FAIL | Not confirmed | — |
| Auth/owner gates | PARTIAL | Session-based | No route-level guard |
| Cache behavior | PARTIAL | badgeSubscriptions realtime | Engine cache not visible |
| Runtime dependencies | PASS | @notifications engine initialized | — |
| Hot paths | HIGH | Badge count updates in real-time | Subscription must be efficient |

---

## DEAD CODE / SPAGHETTI SIGNALS

| Signal | Evidence | Risk | Recommended Handoff |
|---|---|---|---|
| Duplicate NotiViewPostScreen | `screen/NotiViewPostScreen.jsx` AND `screen/views/NotiViewPostScreen.jsx` | HIGH | SENTRY |
| Hook inside screen/ folder | `screen/hooks/useMyAppointments.js` | HIGH — layer violation | SENTRY |
| Appointments view inside notifications | `screen/views/MyAppointmentsView.jsx` — unrelated to notifications | MEDIUM | IRONMAN |
| `blocks.read.dal.js` in notifications/inbox | Block reads belong to block feature | MEDIUM | SENTRY |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | — | MISSING |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | @notifications | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Remove duplicate NotiViewPostScreen | HIGH | Two files, unclear canonical | SENTRY |
| Move hook out of screen/ | HIGH | Layer violation | SENTRY |
| Appointments screen ownership | HIGH | MyAppointmentsView doesn't belong in notifications | IRONMAN |
| Block reads through block adapter | MEDIUM | block.read.dal.js in notifications/inbox violates boundary | SENTRY |
| Logan documentation | HIGH | No canonical notifications architecture | LOGAN |
| Engine boundary documentation | HIGH | What @notifications provides vs what feature adds | IRONMAN |

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

## RECOMMENDED HANDOFFS:
- SENTRY (boundary: duplicate screen, hook in screen, block DAL in notifications)
- IRONMAN (ownership: appointments view, engine boundary)
- LOGAN (documentation)
- LOKI (runtime: badge subscription trace)
