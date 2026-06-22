# VCSM Notifications System — Current Runtime Pipeline

> Updated: 2026-05-10 — booking notification recipient fix (wrong vport actorId); bidirectional confirm/cancel notifications; team member batch notification; booking event controller names corrected; appointments tab hydration engine wiring documented

## 1. Architecture Overview

CURRENT RUNTIME (POST-MIGRATION)

VCSM notifications now use the **notification engine** (`notification.*` schema) as the primary authority for reads AND writes. Legacy `vc.notifications` is still populated by DB triggers but is **no longer read** by the app.

1. Bell notifications
   - source: `notification.*` schema (via notification engine)
   - read: engine `getInboxNotifications()` → `notification.recipients` + `notification.events` + `notification.rendered` + `notification.inbox_items`
   - badge: engine `countUnread()` → `notification.recipients` + `notification.inbox_items`
   - entry: `/notifications`

2. Chat unread badge
   - source: `chat.inbox_entries` (unchanged)
   - entry: bottom nav `Vox` badge
   - badge: sum of `unread_count`

3. Professional Briefings
   - parallel reader — may still reference `vc.notifications` (not yet migrated)

4. VPORT row badges (Settings → VPORTs tab)
   - source: same `countUnread()` call per VPORT actor_id
   - query key: `['notifications', 'unread', actorId]` — shared with global badge
   - badge: total unread count per VPORT, shown inline on each row
   - entry: `/settings` → VPORTs tab


## 2. Entry Screens and User Flows

Main notifications entry:

- `apps/VCSM/src/features/notifications/screen/NotificationsScreen.jsx`
- `apps/VCSM/src/features/notifications/screen/views/NotificationsScreenView.jsx`

Global badge entry:

- `apps/VCSM/src/shared/components/BottomNavBar.jsx`

Settings VPORT row badges:

- `apps/VCSM/src/features/settings/vports/ui/VportsTab.view.jsx`
- `apps/VCSM/src/features/settings/vports/hooks/useVportNotificationBadges.js`

Parallel consumer:

- `apps/VCSM/src/features/professional/briefings/screen/ProfessionalBriefingsScreen.jsx`


## 3. Current Data Authority

| Concern | Current authority | Schema / table |
| --- | --- | --- |
| Notification list | notification engine | `notification.recipients` + `notification.events` + `notification.rendered` + `notification.inbox_items` |
| Bell badge count | notification engine | `notification.recipients` + `notification.inbox_items` |
| VPORT row badges (Settings) | notification engine | `notification.recipients` + `notification.inbox_items` (same as bell badge, per VPORT actor_id) |
| Mark seen (auto on inbox open) | notification engine | `notification.inbox_items` |
| Mark all seen (header) | notification engine | `getInboxNotifications(autoMarkSeen)` |
| Chat unread badge | app-local badge hook | `chat.inbox_entries` |
| Sender resolution / block filtering | app-local helper logic | `vc.*` support reads |
| Professional briefings | parallel app-local reader | `vc.notifications` (NOT YET MIGRATED) |
| Notification creation (7 events) | notification engine | `notification.events` + `notification.recipients` via `publishEvent()` |
| Notification creation (7 events) | legacy DB triggers | `vc.notifications` (dual-write — legacy writes are invisible to UI) |


## 4. Bell Notification Load (MIGRATED)

```text
NotificationsScreen
  -> useNotifications()
  -> useNotificationsInternal(identity)
  -> Notifications.controller.getNotifications(identity)
  -> resolveInboxActor(identity)
  -> engine getInboxNotifications({ recipientActorId, autoMarkSeen })
  -> block filter (with configurable getActorId) + sender resolution + mapNotification()
  -> render typed notification card
```

Key files:

- `apps/VCSM/src/features/notifications/inbox/controller/Notifications.controller.js` — calls `getInboxNotifications()` from `@notifications`
- `apps/VCSM/src/features/notifications/inbox/model/notification.mapper.js` — maps engine `InboxNotification` shape
- `apps/VCSM/src/features/notifications/inbox/lib/blockFilter.js` — supports `getActorId` extractor for engine shape


## 5. Chat Badge Load (UNCHANGED)

```text
BottomNavBar
  -> useUnreadBadge({ actorId })
  -> getInboxUnreadBadgeCount(actorId)
  -> engine countUnread({ recipientActorId })
  -> notification.recipients + notification.inbox_items
  -> render bell badge
```

- `apps/VCSM/src/features/notifications/inbox/controller/inboxUnread.controller.js` — calls `countUnread()` from `@notifications`


## 6. VPORT Row Badges — Settings → VPORTs Tab

Each active VPORT row in Settings displays the total unread notification count for that VPORT actor without the user switching into it.

```text
VportsTab.view.jsx
  -> useVportNotificationBadges(activeVports)
     -> useQueries([...]) — one query per VPORT actor_id, parallel, non-blocking
        -> getUnreadNotificationCount(actorId)     [notificationsCount.controller.js]
           -> countUnread({ recipientActorId })    [runtime/index.js]
  -> getVportCount(resolveVportActorId(v))
  -> <span> badge rendered when count > 0
```

Key files:

- `apps/VCSM/src/features/settings/vports/hooks/useVportNotificationBadges.js` — hook using `useQueries` for parallel per-VPORT count fetches
- `apps/VCSM/src/features/settings/vports/ui/VportsTab.view.jsx` — renders inline count badge on each active VPORT row

**Cache sharing:** Each VPORT's count uses `queryKeys.notificationUnread(actorId)` = `['notifications', 'unread', actorId]` — the same key used by the global bell badge and `bootstrap.selectors.useNotificationUnread`. Visiting the Settings VPORTs tab warm-fills the cache for each VPORT. Switching into a VPORT after viewing Settings skips a badge network round-trip.

**Cache safety:** `purgeNotificationCache()` in `bootstrap.invalidate.js` uses `removeQueries({ queryKey: ['notifications'] })`, which covers all per-VPORT counts. It fires on both actor switch and logout — no VPORT count bleeds across sessions.

**Poll cadence:** `staleTime: 60_000` — consistent with the existing badge poll. No background polling is added; counts refresh when the Settings screen is open or on next mount.

**Badge display:** `count > 0` only. Caps at `99+`. Style: `bg-purple-500/90` inline span, positioned between VPORT name and Switch button.

**Category badges:** Not currently implemented. `countUnread` returns total only. Category breakdown (bookings / reviews / social / follows) would require a new `countUnreadByKind(actorId)` function in the runtime querying `notification.inbox_items JOIN notification.events` grouped by `event_key` prefix. No DB schema change needed. Tracked as a future task.


## 7. Mark Read / Mark Seen Paths (MIGRATED)

- **Auto-mark-seen on inbox load:** Engine `getInboxNotifications({ autoMarkSeen: true })` marks all fetched items as seen in `notification.inbox_items`
- **Mark all seen (header button):** `NotificationsHeader.controller.js` calls `getInboxNotifications({ limit: 50, autoMarkSeen: true })` then dispatches `noti:refresh`
- **Legacy write DAL:** `notifications.write.dal.js` retained for dev diagnostics only. 3 orphaned read DALs deleted (legacy cleanup complete).


## 7. Realtime (DISABLED — polling only)

Bell badge realtime: **no-op**

- `subscribeNotificationBadge({ actorId, onChange })` — returns a no-op unsubscribe function; no Supabase channel is created
- file: `apps/VCSM/src/features/notifications/inbox/realtime/badgeSubscriptions.js`

Chat unread badge realtime:

- `subscribeInboxBadge({ actorId, onChange })`
- schema: `chat`
- table: `inbox_entries`
- file: `apps/VCSM/src/features/notifications/inbox/realtime/badgeSubscriptions.js`

Bell badge and inbox are kept current via **60s React Query polling** only. The `noti:refresh` custom event provides immediate invalidation on navigation (BottomNavBar) and on inbox load (useNotificationInbox). Realtime on `notification.*` tables is intentionally disabled until confirmed stable in production.


## 8. Notification Creation Status (MIGRATED)

### Engine-Published Events (14 total — all active events)

| Event Key | Source Controller | Published Via |
|-----------|------------------|---------------|
| `social.post.like` | `togglePostReaction.controller.js` | `publishVcsmNotification()` |
| `social.post.dislike` | `togglePostReaction.controller.js` | `publishVcsmNotification()` |
| `social.post.rose` | `sendRose.controller.js` | `publishVcsmNotification()` |
| `social.post.comment` | `postComments.controller.js` | `publishVcsmNotification()` |
| `social.post.comment_reply` | `postComments.controller.js` | `publishVcsmNotification()` |
| `social.post.comment_like` | `commentReactions.controller.js` | `publishVcsmNotification()` |
| `social.post.mention` | `createPostController.js` | `publishVcsmNotification()` |
| `follow` | `follow.controller.js` | `publishVcsmNotification()` |
| `follow_request` | `followRequests.controller.js` | `publishVcsmNotification()` |
| `follow_request_accepted` | `followRequests.controller.js` | `publishVcsmNotification()` |
| `booking_created` | `vportPublicBooking.controller.js` | `publishVcsmNotificationBatch()` — sends to vport profile actor + `resource.member_actor_id` (deduped Set, requester excluded) |
| `booking_confirmed` | `updateVportBooking.controller.js` | `publishVcsmNotification()` — bidirectional: client acting → notify vport actor; vport acting → notify customer actor |
| `booking_cancelled` | `updateVportBooking.controller.js` | `publishVcsmNotification()` — bidirectional: client acting → notify vport actor; vport acting → notify customer actor |
| `review_created` | `VportReviews.controller.js` | `publishVcsmNotification()` |

Adapter: `apps/VCSM/src/features/notifications/publish.js` — maps legacy shape to engine `publishEvent()`

### Legacy DB-Trigger Events (dual-write — all still fire, none read by UI)

| Event | Source Table | Trigger |
|-------|------------|---------|
| `comment` | `vc.post_comments` | `trg_post_comments_notify` |
| `comment_reply` | `vc.post_comments` | `trg_post_comments_notify` |
| `comment_like` | `vc.comment_likes` | `trg_comment_like_notify` |
| `like` | `vc.post_reactions` | `trg_post_like_notify` |
| `dislike` | `vc.post_reactions` | `trg_post_dislike_notify` |
| `rose` | `vc.post_rose_gifts` | `trg_post_rose_gifts_notify` |
| `mention` | `vc.post_mentions` | `trg_post_mentions_notify` |

These still fire and write to `vc.notifications`, but the UI no longer reads from that table. They are safe to disable once the engine delivery pipeline is confirmed stable in production.


## 9. Engine Setup

Engine wired in `apps/VCSM/src/main.jsx`:

```text
setupVcsmNotificationsEngine()
  -> configureNotificationsEngine({ supabaseClient, resolveActorCard })
```

Setup file: `apps/VCSM/src/features/notifications/setup.js`


## 10. Appointments Tab (My Appointments)

The Notifications screen includes a **My Appointments** tab that displays the current citizen's bookings — split into Upcoming / Pending / Past — with vport identity (avatar + name) and team member identity resolved via the hydration engine.

### Read Flow

```text
NotificationsScreen → MyAppointmentsView
  → useMyAppointments({ actorId })
    → booking.adapter.listMyBookings({ actorId })
      → listBookingsByCustomerDAL({ actorId })   [vport.bookings + profiles!profile_id + resources!resource_id]
      → mapBookingRows()                          [produces vportActorId, vportName, memberActorId, memberName]
    → hydrateActorsByIds([...vportActorIds, ...memberActorIds])  [pre-warms hydration store]
  → splits rows: upcoming (confirmed + future) | pending | past (completed/cancelled/no_show/confirmed+past)
  → AppointmentCard → VportCell + MemberLine
```

### Identity Resolution in Appointment Cards

| Field | Source | Fallback |
|---|---|---|
| Vport actor ID | `profiles!profile_id(actor_id)` — always present | — |
| Vport name (instant) | `profiles!profile_id(name)` from DB join | "Unknown place" |
| Vport name (live) | `useActorSummary(vportActorId).displayName` from hydration store | DB join name |
| Vport avatar | `useActorSummary(vportActorId).avatar` from hydration store | `/avatar.jpg` |
| Member actor ID | `resources!resource_id(member_actor_id)` — only when booking has resource_id | null |
| Member name (instant) | `resources!resource_id(name)` from DB join | hidden |
| Member name (live) | `useActorSummary(memberActorId).displayName` | DB join name |

**No avatar flash:** `vportName` from the DB join is available immediately as the name fallback — the card never briefly shows "Unknown place" while the hydration store loads.

**Avatar rule:** Vport avatar uses `width: 44, height: 44, borderRadius: 8` — square with rounded-lg corners, never circular.

### Key Files

| File | Purpose |
|---|---|
| `apps/VCSM/src/features/notifications/screen/views/MyAppointmentsView.jsx` | Tabbed appointment list with VportCell + MemberLine sub-components |
| `apps/VCSM/src/features/notifications/screen/hooks/useMyAppointments.js` | Loads bookings, pre-warms hydration, splits into upcoming/pending/past, cancel + dismiss mutations |

### Actions

- **Cancel** — available for `pending` and `confirmed` bookings. Calls `cancelBooking({ bookingId, requestActorId })` then reloads.
- **Remove (Dismiss)** — available for `cancelled`, `completed`, and `no_show` bookings. Calls `dismissBooking({ bookingId, requestActorId })` and removes row from local state immediately (no reload).

---

## 11. Known Bug History

### 2026-04-19 — Notifications Screen Not Scrollable (FIXED)

**Symptom:** The notifications screen could not be scrolled — all notifications were visible but the list was clipped and had no scroll behaviour.

**Root cause:** `NotificationsScreenView.jsx` had `h-full min-h-0 overflow-y-auto` on its root div, creating an inner scroll container. `RootLayout` uses natural document scrolling for all non-chat routes — the root element grows with content and the document scrolls. The inner container had no constrained height to scroll against, so `overflow-y-auto` had nothing to activate.

**Fix:** Removed `h-full min-h-0 overflow-y-auto` from `NotificationsScreenView.jsx`. The screen now flows naturally and inherits the layout's document scroll.

**Scroll contract (from `RootLayout.jsx`):**
- `RootLayout` owns the viewport
- `<main>` is the ONE scroll container for non-chat routes
- Screens must NOT add their own `overflow-y-auto` or `h-full` — those classes break the contract

---

### 2026-04-19 — Delivery Pipeline Silent Failure (FIXED)

**Symptom:** No notifications appeared in badge or inbox screen for any engine-published event (reactions, follow, bookings, etc.). All `notification.recipients` rows stuck at `status='pending'`. `notification.rendered` and `notification.inbox_items` were empty.

**Root cause:** `upsert_rendered` and `insert_inbox_item` both used `RETURNS TABLE(recipient_id uuid, ...)` which creates an implicit PL/pgSQL OUT parameter named `recipient_id`. This clashed with `ON CONFLICT (recipient_id)` inside the function body — PostgreSQL error `42702: column reference "recipient_id" is ambiguous`. The error was silently swallowed because `publishVcsmNotification` is fire-and-forget (no `await` at the call site in controllers).

**Fix applied:**
- Recreated `notification.upsert_rendered` — renamed RETURNS TABLE columns to `out_*`, replaced `ON CONFLICT (recipient_id)` with `ON CONFLICT ON CONSTRAINT rendered_pkey`
- Recreated `notification.insert_inbox_item` — same fix pattern, `ON CONFLICT ON CONSTRAINT inbox_items_pkey`
- Recreated `notification.update_recipient_status` — same pattern: `RETURNS TABLE(out_id, out_status, out_delivered_at)`, `ELSE notification.recipients.delivered_at` in CASE expression to eliminate ambiguity
- Migration: `20260419010000_fix_notification_delivery_rpc_ambiguity.sql` (covers all 3 functions)

**Secondary fixes (same session):**
- `publish.js` — added `recipientDomain: 'vc'` and `recipientKind: 'actor'` to recipient objects (required fields per `notification.recipients` NOT NULL constraints)
- `notification.mapper.js` `normalizeKind()` — added mappings for all engine event keys to UI-renderable kinds
- `GRANT SELECT ON notification.events TO authenticated` — table had RLS policy but no privilege grant; inbox `fetchEventsByIds` was returning 403 — fixed in migration `20260419030000_grant_notification_events_select.sql`

**Complete notification event key → normalized kind mapping:**
| Engine event key | Normalized kind | UI card |
|----|----|---|
| `social.post.like` | `like` | `PostLikeNotificationItem` |
| `social.post.dislike` | `dislike` | `PostDislikeNotificationItem` |
| `social.post.rose` | `post_rose` | `PostRoseNotificationItem` |
| `social.post.comment_like` | `comment_like` | `CommentLikeNotificationItem` |
| `social.post.comment` | `comment` | `CommentNotificationItem` |
| `social.post.comment_reply` | `comment_reply` | `CommentReplyNotificationItem` |
| `social.post.mention` | `post_mention` | `PostMentionNotificationItem` |
| `follow` | `follow` | `FollowNotificationItem` |
| `follow_request` | `follow_request` | `FollowRequestItem` |
| `follow_request_accepted` | `follow_request_accepted` | `AcceptFriendRequestItem` |
| `booking_created` | `booking_created` | `BookingCreatedNotificationItem` |
| `booking_confirmed` | `booking_confirmed` | `BookingConfirmedNotificationItem` |
| `booking_cancelled` | `booking_cancelled` | `BookingCancelledNotificationItem` |
| `review_created` | `review_created` | `ReviewCreatedNotificationItem` |


### 2026-05-03 — Missing EXECUTE Grants on Recreated RPCs (FIXED)

**Symptom:** Notifications not appearing in UI. Inbox empty despite publish calls executing without visible errors. Badge count stuck at 0. `notification.recipients` rows existed but `status='pending'`. `notification.rendered` and `notification.inbox_items` empty.

**Root cause:** When the 3 RPCs (`upsert_rendered`, `insert_inbox_item`, `update_recipient_status`) were recreated with new signatures in the 2026-04-19 migration, `GRANT EXECUTE` was not applied to the new function overloads. PostgreSQL treats functions with different argument types as distinct objects — the original grants were on the old signatures and did not carry over.

**Pipeline state at failure:**
```
create_event              ✅ (EXECUTE grant present)
insert_recipients         ✅ (EXECUTE grant present)
upsert_rendered           ❌ (EXECUTE grant missing)
insert_inbox_item         ❌ (EXECUTE grant missing)
update_recipient_status   ❌ (EXECUTE grant missing)
```

**Effect:** Event + recipient rows were created. Delivery then failed silently — `runtime/index.js` catches per-recipient errors and calls `updateNotificationRecipientStatusDAL(recipientId, 'failed')` — but that RPC also lacked EXECUTE, so the status stayed `'pending'`. No `rendered` or `inbox_items` rows were written. Inbox reads filter by `status='delivered'` → always 0 results.

**Fix applied:**
```sql
GRANT EXECUTE ON FUNCTION notification.upsert_rendered(uuid, uuid, text, text, text, text, text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION notification.insert_inbox_item(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION notification.update_recipient_status(uuid, text, text) TO authenticated;
NOTIFY pgrst, 'reload schema';
```

**Post-fix state:**
- Full pipeline operational
- 32 rows delivered, 5 rows remain in `'pending'` from pre-fix attempts (non-blocking, no repair needed)
- RLS access control confirmed correct via `notification.can_access_recipient()` using `platform.owns_actor_via_app_link()`

**Lesson:** When recreating PostgreSQL functions with new signatures, EXECUTE grants must be explicitly re-applied. The prior GRANT on the old overload is silently orphaned. Always include GRANT EXECUTE in the same migration that creates or replaces a function.

---

### 2026-05-10 — booking_created Sent to Wrong Vport Actor (FIXED)

**Symptom:** After a public booking, the vport owner's notification inbox showed no `booking_created` notification. DB query confirmed `notification.recipients` had `recipient_actor_id = 6a5b7f9d-...` (wrong vport) with `status='delivered'`. The user's active barbershop vport was `766484aa-...` — a completely different actor.

**Root cause:** `createVportPublicBookingController` resolved the recipient as `resource.owner_actor_id`. For this barbershop resource, `owner_actor_id` pointed to a different vport actor than the profile the user manages. The correct recipient is the `actor_id` from `vport.profiles` resolved via the resource's `profile_id`.

**Fix applied:**
- Added `getVportActorIdByProfileIdDAL({ profileId })` to `read/vportProfile.read.dal.js` — resolves `profile_id → actor_id` from `vport.profiles`
- `createVportPublicBookingController` now calls `getVportActorIdByProfileIdDAL({ profileId: resource.profile_id })` instead of using `resource.owner_actor_id`
- Switched from `publishVcsmNotification` (single) to `publishVcsmNotificationBatch` (multiple recipients) — vport actor + `resource.member_actor_id` (the specific team member/barber), deduplicated via Set, requester excluded

**Identity rule:** Notification recipient for booking must always be the `actor_id` from `vport.profiles` where `id = resource.profile_id`. `resource.owner_actor_id` is not a reliable proxy for the vport's notification actor.

---

### 2026-05-10 — No Notification on Confirm or Cancel (FIXED)

**Symptom:** Clicking Confirm or Cancel on the booking dashboard had no notification effect — the other party (customer or vport) received nothing.

**Root cause:** `updateBookingStatusController` performed only a DB status update with no notification logic at all.

**Fix applied:**
- Added `STATUS_TO_EVENT` map: `{ confirmed: "booking_confirmed", cancelled: "booking_cancelled" }` — `completed` and `no_show` intentionally excluded (no notification for those statuses)
- Added bidirectional routing: `isClientActing = (actorId === booking.customer_actor_id)`. If client acting → recipient is vport (resolved via `getVportActorIdByProfileIdDAL`). If vport acting → recipient is `customer_actor_id`
- Added `actorId` parameter to `updateBookingStatusController` and `useVportBookingActions` hook; all 4 action callbacks now pass `actorId: targetActorId`
- Notification fires via `publishVcsmNotification(...).catch(err => { if (DEV) console.error(...) })` — fire-and-forget with dev-only error logging

---



CURRENT RUNTIME (2026-05-10 — booking notifications corrected)

- bell inbox authority: `notification.*` schema (engine)
- bell badge authority: `notification.*` schema (engine)
- VPORT row badges: active — `useVportNotificationBadges` in Settings VPORTs tab, parallel per-actor counts
- realtime subscription: disabled (no-op) — polling only via 60s React Query refetchInterval
- notification creation: engine `publishEvent()` via `publishVcsmNotification()` / `publishVcsmNotificationBatch()`
- notification creation (legacy): DB triggers still fire dual-write to `vc.notifications` (invisible to UI)
- chat badge authority: `chat.inbox_entries` (unchanged)
- professional briefings: `vc.notifications` (NOT YET MIGRATED)
- legacy DALs: 3 orphaned DALs deleted. `notifications.write.dal.js` + `notifications.create.dal.js` retained for dev diagnostics only
- category badges: NOT YET IMPLEMENTED — requires `countUnreadByKind(actorId)` in runtime

**DB state (2026-05-03):**
- `notification.events` — SELECT granted to `authenticated`
- `notification.recipients` — `status='delivered'` for active events; 5 rows stuck at `'pending'` from pre-fix (non-blocking)
- `notification.rendered` — rows exist for all delivered recipients; `title` = null (templates not yet seeded; typed UI cards generate their own display text)
- `notification.inbox_items` — rows exist with `is_seen`, `is_read` tracking
- `vc.post_rose_gifts` — INSERT policy present
- RLS: `notification.can_access_recipient()` uses `platform.owns_actor_via_app_link()` for actor-based ownership checks
- RPC EXECUTE grants: all 5 RPCs now granted to `authenticated` role

---

## Audit References

Latest Engine Audit:
`zNOTFORPRODUCTION/_CANONICAL/logan/engines/NOTIFICATIONS_ENGINE_AUDIT_V1.md`

Previous Engine Audit:
N/A — V1 is the first version.
