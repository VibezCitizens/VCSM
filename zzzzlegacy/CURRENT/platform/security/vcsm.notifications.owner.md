# Notifications — Ownership Record

_Created:_ 2026-05-19  
_Trigger:_ CEREBRO verification pass — `vcsm.dal.notifications.md`  
_Application Scope:_ VCSM  

---

## 1. Purpose

The notifications feature is responsible for:
- Inbox delivery and rendering of all in-app notifications
- Unread badge count and mark-seen/mark-read lifecycle
- Notification type dispatch (13+ type-specific views)
- Block filtering in the notification inbox (bidirectional)
- Sender identity resolution for inbox display
- Engine initialization and runtime configuration for `@notifications`
- Adapter surface for all cross-feature notification publish operations

The `@notifications` engine owns the persistence layer (publish, read, count, mark-seen/read, archive, dismiss). The feature layer owns presentation, type dispatch, sender resolution, and the adapter boundary.

---

## 2. Application Scope

VCSM

---

## 3. Code Roots

Primary path: `apps/VCSM/src/features/notifications/`

Key subdirectories:
- `adapters/` — cross-feature boundary
- `inbox/controller/` — business rule orchestration
- `inbox/dal/` — direct DB reads (blocks, senders)
- `inbox/hooks/` — React lifecycle
- `inbox/lib/` — utility functions
- `inbox/model/` — domain transforms
- `inbox/realtime/` — badge subscriptions (currently disabled noops)
- `inbox/ui/` — view layer (NotificationItem, Notifications, NotificationsHeader views)
- `runtime/` — engine DAL (16 functions) and model; encapsulated by engine
- `screen/` — Final Screens and View Screens
- `types/` — type-specific notification view dispatch (13+ files)
- `setup.js` — engine initialization entry point
- `publish.js` — legacy shape bridge to engine publish API

---

## 4. Core Layers

**DAL:**
- `inbox/dal/blocks.read.dal.js` — reads `moderation.blocks` (bidirectional block filter)
- `inbox/dal/senders.read.dal.js` — reads `vc.actors`, `public.profiles`, `vport.profiles` for sender resolution
- `runtime/notificationRuntime.dal.js` — all 16 engine DAL functions (`notification.*` schema) — engine-encapsulated; feature code must not import directly

**Model:**
- `inbox/model/notification.model.js` — maps notification row + sender map to domain notification object
- `runtime/notificationRuntime.model.js` — joins 4 DB result sets into normalized notification objects (engine-internal)

**Controller:**
- `inbox/controller/Notifications.controller.js` — primary inbox orchestration (block filter + sender resolution + model mapping)
- `inbox/controller/NotificationsHeader.controller.js` — unread count + mark-all-seen
- `inbox/controller/notificationsCount.controller.js` — thin count wrapper
- ~~`inbox/controller/inboxUnread.controller.js`~~ — DEAD / DELETE CANDIDATE (chat re-export shim)

**Service:** Fulfilled by `@notifications` engine (`runtime/index.js`)

**Adapter:**
- `adapters/notifications.adapter.js` — `publishVcsmNotification`, `publishVcsmNotificationBatch`, `getUnreadNotificationCount` (15+ external consumers)

**Bridge:**
- `publish.js` — maps legacy feature publish shape to engine `publishEvent()` API

**Hook:**
- `inbox/hooks/useNotificationInbox.js` — React Query source of truth (60s stale, polling)
- `inbox/hooks/useNotifications.js` — thin wrapper
- `inbox/hooks/useNotificationsHeader.js` — header count + mark-all-seen
- `inbox/hooks/useNotiCount.js` — delegates to bootstrap selectors
- ~~`inbox/hooks/useNotificationsInternal.js`~~ — DEAD / DELETE CANDIDATE
- ~~`inbox/hooks/useMarkNotificationsRead.js`~~ — DEAD / DELETE CANDIDATE + layer violation
- ~~`inbox/hooks/useUnreadBadge.js`~~ — DEAD / DELETE CANDIDATE (chat domain, wrong feature)

**Screen Hook:**
- `screen/hooks/useMyAppointments.js` — appointments screen data

**Component:**
- `types/components/NotificationCard.jsx` — type dispatch entry point (routes to type-specific views)

**Type Views (13 files):**
- `types/booking/` — 3 files (BookingCancelledNotificationItem, BookingConfirmedNotificationItem, BookingCreatedNotificationItem)
- `types/comment/` — 3 files (CommentLikeNotificationItem, CommentNotificationItem, CommentReplyNotificationItem)
- `types/follow/` — 3 files (AcceptFriendRequestItem, FollowNotificationItem, FollowRequestItem)
- `types/mention/` — 1 file (PostMentionNotificationItem)
- `types/reaction/` — 3 files (PostDislikeNotificationItem, PostLikeNotificationItem, PostRoseNotificationItem)
- `types/review/` — 1 file (ReviewCreatedNotificationItem)
- `types/team/` — 1 file (TeamInviteNotificationItem)

**UI Views (inbox layer):**
- `inbox/ui/NotificationItem.view.jsx`
- `inbox/ui/Notifications.view.jsx`
- `inbox/ui/NotificationsHeader.view.jsx`

**View Screen:**
- `screen/views/NotificationsScreenView.jsx`
- `screen/views/MyAppointmentsView.jsx`
- ~~`screen/views/NotiViewPostScreen.jsx`~~ — DEAD / DELETE CANDIDATE

**Final Screen:**
- `screen/NotificationsScreen.jsx` — route `/notifications`
- `screen/NotiViewPostScreen.jsx` — route `/noti/post/:postId`

**Lib Utilities:**
- `inbox/lib/blockFilter.js` — `loadBlockSets()`, `filterByBlocks()`
- `inbox/lib/resolveSenders.js` — sender waterfall resolution
- `inbox/lib/resolveInboxActor.js` — identity → inbox semantics adapter

**Engine DAL (encapsulated — not for direct feature import):**
- `runtime/notificationRuntime.dal.js` — 16 functions; exclusive consumer is `runtime/index.js`

**Realtime (disabled):**
- `inbox/realtime/badgeSubscriptions.js` — noops; neither function called anywhere

**Setup:**
- `setup.js` — `setupVcsmNotificationsEngine()` — called from `main.jsx`

---

## 5. Engines Used

| Engine | How Used |
|---|---|
| `@notifications` | Primary engine — all notification persistence (publish, read, count, mark-seen/read, archive, dismiss); initialized at app startup |
| `@hydration` | Delegated sender resolution — `listActorSummaryRowsByIdsDAL` + `listActorPresentationRowsByIdsDAL` delegate to hydration cache |
| `@tanstack/react-query` | Inbox data fetching, badge polling, cache management |

---

## 6. Database / Schema Ownership

| Table | Schema | Primary Owner | Operations |
|---|---|---|---|
| `recipients` | `notification` | @notifications engine | READ + WRITE |
| `inbox_items` | `notification` | @notifications engine | READ + WRITE |
| `events` | `notification` | @notifications engine | READ + WRITE |
| `rendered` | `notification` | @notifications engine | READ + WRITE |
| `blocks` | `moderation` | Moderation feature (read by notifications) | READ only |
| `actors` | `vc` | Identity feature (read by notifications) | READ only |
| `profiles` | `public` | Identity feature (read by notifications) | READ only |
| `profiles` | `vport` | Vport feature (read by notifications via vportClient) | READ only |

**RPCs:** `insert_recipients`, `update_recipient_status`, `insert_inbox_item`, `create_event`, `upsert_rendered` — all in `notification` schema, owned by `@notifications` engine

**Migration owner:** `@notifications` engine — all schema changes must go through CARNAGE  
**RLS owner:** `notification` schema RLS policies owned by notifications team (not verified in this pass — DB-level audit required)  
**Schema name:** `notification` (singular)

---

## 7. Rule Ownership

| Rule | Owner | Enforcement Layer |
|---|---|---|
| Block filter — suppress blocked actors in inbox | `notifications` feature | Controller (`Notifications.controller.js` via `blockFilter.js`) |
| Recipient ownership on read | `@notifications` engine | DAL — `readNotificationRecipientRowsDAL` scoped by `recipientActorId` |
| Mark-seen authorization | `@notifications` engine | Engine layer — `markNotificationRecipientsSeenDAL` |
| Publish access — who can create notifications | `@notifications` engine | Engine — any caller via `publishEvent()` can publish; no publish-level ACL |
| Actor identity surface on notifications | `notifications` feature | Sender resolution returns `actorId`, `kind`, display fields only |

---

## 8. Contracts Touched

- Architecture Contract (`ARCHITECTURE.md`) — Layer ordering, DAL rules, adapter boundary
- Boundary Isolation Contract — Feature isolation
- Actor Ownership Contract — `actorId + kind` as canonical identity

---

## 9. Documentation Links

| Doc | Path | Status |
|---|---|---|
| DAL document | `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.notifications.md` | PARTIAL (8 corrections pending) |
| VENOM security audit | `CURRENT/features/dashboard/evidence/venom_notifications-dal_2026-05-19.md` | VERIFIED |
| SENTRY compliance | `CURRENT/features/dashboard/evidence/sentry_notifications-dal_2026-05-19.md` | MINOR DRIFT |
| LOKI runtime | `CURRENT/features/dashboard/evidence/loki_notifications-dal_2026-05-19.md` | PARTIAL |
| KRAVEN performance | `_ACTIVE/audits/performance/2026-05-19_kraven_notifications-dal.md` | PRESENT |
| IRONMAN ownership | This file | PRESENT |
| @notifications engine audit | None on file | MISSING |
| FALCON native parity | None on file | MISSING |

---

## 10. Runtime Ownership

| Entry Point | Owner | Hot Path |
|---|---|---|
| `/notifications` route | `notifications` feature | `NotificationsScreen → NotificationsScreenView → useNotifications → useNotificationInbox → getNotifications → engine` |
| `/noti/post/:postId` route | `notifications` feature | `NotiViewPostScreen → PostDetailView` |
| Adapter publish path | `notifications.adapter.js` | `publishVcsmNotification → publish.js → @notifications engine → 2+3N DAL ops` |
| Bottom nav badge | Bootstrap selectors + `useNotiCount` | `countUnread() → 2 DAL ops (5s cache)` |

**Performance hotspot:** `publishEvent()` delivery loop — serial per-recipient (KF-1 from KRAVEN pass)

---

## 11. Responsibilities

The notifications feature is responsible for:
1. Owning the adapter surface (`notifications.adapter.js`) — all cross-feature publish goes through here
2. Owning inbox presentation — 13+ type-specific views, inbox/ui/ views, NotificationCard dispatch
3. Owning block filter enforcement in the inbox
4. Owning sender identity resolution for inbox display
5. Owning engine initialization at app startup (`setup.js`)
6. Owning the publish bridge (`publish.js`) between legacy shape and engine API
7. Owning the `notification` schema (via `@notifications` engine) — migrations require CARNAGE

---

## 12. Boundaries

The notifications feature must NOT:
- Import directly from other features' internals (must use adapters)
- Allow non-notifications controllers to read `notification.*` tables directly (engine encapsulation)
- Expose `profileId` or `vportId` through the adapter or hooks surface
- Own business rules belonging to the moderation, chat, or identity features
- Let hooks call the engine directly (must go through controllers)

---

## 13. Change Impact Rules

When notifications feature changes, these must be updated:
- `vcsm.dal.notifications.md` — DAL layer documentation
- VENOM audit — if block filter or adapter boundary changes
- SENTRY compliance — if layer ordering or adapter boundary changes
- KRAVEN audit — if engine write path or inbox read path changes
- FALCON — if inbox presentation, badge behavior, or type views change (native parity)
- `@notifications` engine audit (create new version) — if engine DAL or public API changes

---

## 14. Release Gate Notes

- SENTRY: MINOR DRIFT — dead code cleanup required before release
- LOGAN: PARTIAL — 8 doc corrections pending
- FALCON: MISSING — native parity not verified for bottom-nav primary surface
- KRAVEN: KF-1 (publishEvent serial loop) — HIGH priority optimization, not blocking release
- IRONMAN: This ownership record created; @notifications engine audit missing

---

## 15. Open Ownership Questions

| Question | Priority | Assigned To |
|---|---|---|
| Who owns the 13+ type-specific views in `types/`? (booking, comment, follow, mention, reaction, review, team) | MEDIUM | Unassigned |
| Who owns `inbox/ui/` layer (3 views)? | MEDIUM | Unassigned |
| Does the booking feature own `types/booking/` views or does notifications? | MEDIUM | Requires cross-team decision |
| Who owns `badgeSubscriptions.js` — delete or implement? | LOW | Notifications |
| Who owns the `@notifications` engine? Should an engine audit exist? | MEDIUM | Unassigned |
| RLS policies on `notification.*` tables — who reviews? | HIGH | DB/CARNAGE |
