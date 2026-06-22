Notification System Audit — Engine Extraction Plan
=====================================================

> **STATUS: EXECUTED — Migration complete 2026-04-12.**
> This document records the pre-migration audit and extraction design. The notification engine is live in VCSM.
> Authoritative current-state doc: `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/notifications/vcsm.notifications.pipeline.md`

Date: 2026-04-05
Purpose: Map current notification architecture to design a shared neutral engine.


1. Notification Folders Discovered
-------------------------------------

  VCSM:
    apps/VCSM/src/features/notifications/           — full feature (45+ files)
    apps/VCSM/src/features/notifications/inbox/      — core logic
    apps/VCSM/src/features/notifications/screen/     — UI screens
    apps/VCSM/src/features/notifications/types/      — per-kind renderers

  Wentrex:
    NONE — no dedicated notification folder
    Chat unread badges referenced in dashboard screens only

  Engines:
    engines/notifications/ — DOES NOT EXIST
    engines/chat/src/events.js — domain event bus (not notifications)
    engines/identity/src/events.js — identity event bus (not notifications)


2. Notification Files Discovered (VCSM)
-----------------------------------------

  Controllers: 4 files
    Notifications.controller.js, notificationsCount.controller.js,
    inboxUnread.controller.js, NotificationsHeader.controller.js

  DALs: 8 files
    notifications.read.dal.js, notifications.write.dal.js,
    notifications.create.dal.js, notifications.count.dal.js,
    notifications.dal.js, inboxUnreadCount.dal.js,
    senders.read.dal.js, blocks.read.dal.js

  Hooks: 5 files
    useNotifications.js, useNotificationsInternal.js,
    useNotiCount.js, useUnreadBadge.js, useNotificationsHeader.js

  Model: 1 file — notification.mapper.js
  Lib: 3 files — resolveInboxActor.js, resolveSenders.js, blockFilter.js
  Realtime: 1 file — badgeSubscriptions.js
  UI: 14+ files (screen, views, type-specific renderers)


3. Notification Event Sources
-------------------------------

  ALL notifications are created by DATABASE TRIGGERS on vc.* tables.
  Zero app-code notification creation in the main runtime path.

  Trigger                               | Source Table              | Kind Created
  --------------------------------------|---------------------------|------------------
  trg_actor_follows_notify              | vc.actor_follows          | follow
  trg_follow_request_notify             | vc.social_follow_requests | follow_request
  trg_follow_accept_notify              | vc.social_follow_requests | follow_request_accepted
  trg_social_follow_requests_notify     | vc.social_follow_requests | follow_request
  trg_social_follow_requests_accept     | vc.social_follow_requests | follow_request_accepted
  trg_post_comments_notify              | vc.post_comments          | comment / comment_reply
  trg_comment_like_notify               | vc.comment_likes          | comment_like
  trg_post_reactions_notify             | vc.post_reactions          | like / dislike / post_rose
  trg_post_rose_gifts_notify            | vc.post_rose_gifts        | post_rose
  trg_post_mentions_notify              | vc.post_mentions          | post_mention

  All triggers call: vc.create_notification() RPC (SECURITY DEFINER)

  Additional source:
    dalInsertNotification() — client-side fallback in notifications.create.dal.js
    Used for: follow notifications when DB trigger might not have access


4. Notification Storage Tables
--------------------------------

  Table: vc.notifications
  Schema: vc (app-specific, NOT shared)

  Columns:
    id, recipient_actor_id, actor_id, kind, object_type, object_id,
    link_path, context (jsonb), ref_type, ref_id, data (jsonb),
    is_read, is_seen, created_at, user_id (legacy), vport_id (legacy)

  RLS: Force enabled. 4 policies:
    INSERT: service_role only + actor ownership check
    SELECT: actor ownership check
    UPDATE: actor ownership check

  RPC: vc.create_notification() — SECURITY DEFINER, inserts row

  NOTE: This table is in vc.* schema — NOT neutral.
  A shared engine would need a notifications.* or platform.* schema.

  Also relevant:
    chat.inbox_entries — separate unread count for chat (engine-backed)
    chat.outbox_events — domain events for async processing (engine-backed)


5. Notification Delivery Mechanisms
--------------------------------------

  A. Supabase Realtime (Postgres Changes)
     Channel: noti-badge-{actorId}
     Schema: vc
     Table: notifications
     Events: INSERT, UPDATE, DELETE
     Consumer: useNotiCount hook → badge counter

  B. Supabase Realtime (Postgres Changes) — Chat inbox
     Channel: chat-badge-{actorId}
     Schema: chat
     Table: inbox_entries
     Events: INSERT, UPDATE, DELETE
     Consumer: useUnreadBadge hook → chat badge counter

  C. Polling fallback
     useNotiCount: polls every 45s
     useUnreadBadge: polls every 15s

  D. Window events (app-internal)
     noti:refresh — force badge recount
     noti:reload — force notification list reload
     noti:optimistic:replace — optimistic UI update

  E. Push notifications: NOT IMPLEMENTED
  F. Email notifications: NOT IMPLEMENTED
  G. SMS: NOT IMPLEMENTED


6. UI Consumers of Notifications
-----------------------------------

  BottomNavBar.jsx — notification bell badge (useNotiCount)
  BottomNavBar.jsx — chat inbox badge (useUnreadBadge)
  NotificationsScreen.jsx — notification list
  NotificationItem.view.jsx — per-kind routing to 10 renderer components
  NotificationsHeader.view.jsx — header with mark-all-read
  NotiViewPostScreen.jsx — deep link to post from notification


7. VCSM-Specific Notification Logic
--------------------------------------

  ALL current notification logic is VCSM-specific:
  - vc.notifications table
  - vc.create_notification RPC
  - 13 vc.* triggers on vc.* social/interaction tables
  - Actor summary resolution via vc.actor_presentation
  - Block filtering via moderation.blocks
  - Follow request reconciliation
  - 10 VCSM-specific notification kind renderers
  - link_path routes to VCSM screens (/profile/:id, /post/:id)


8. Wentrex-Specific Notification Logic
-----------------------------------------

  Wentrex has NO dedicated notification system.

  What exists:
  - Chat inbox unread badge (via shared chat engine — chat.inbox_entries)
  - Dashboard "new assignment" / "new submission" UI indicators
  - These are NOT stored as notification rows — they are live query results

  What does NOT exist:
  - No vc.notifications equivalent
  - No learning.notifications table
  - No notification triggers on learning.* tables
  - No notification bell
  - No notification list screen
  - No notification mapper/model
  - No realtime subscription for notifications

  Wentrex relies entirely on:
  - Chat inbox unread for messaging badges
  - Direct dashboard queries for academic activity


9. Engine Coupling Violations
-------------------------------

  NONE in current code — because there IS no notification engine.

  All notification code lives inside apps/VCSM/src/features/notifications/.
  It queries vc.* schema directly. No shared engine boundary exists.


10. Candidate Features for a Shared Notification Engine
---------------------------------------------------------

  These could move into engines/notifications/:

  A. Notification CRUD (engine core)
     - Create notification (insert into neutral table)
     - Read notifications (paginated, actor-scoped)
     - Mark as read / seen
     - Count unread
     - Delete / expire notifications

  B. Notification subscription (engine core)
     - Realtime channel management
     - Badge count subscription
     - Polling fallback

  C. Notification fanout (engine core)
     - Given an event, determine recipients
     - Create one notification per recipient
     - Deduplicate / aggregate

  D. Notification storage (engine-owned schema)
     - notifications.notifications table (neutral)
     - notifications.notification_preferences (per-actor settings)

  E. Notification model (engine core)
     - Domain model: id, recipientActorId, senderActorId, kind,
       objectType, objectId, linkPath, context, isRead, isSeen, createdAt


11. Features That Must Remain App Adapters
---------------------------------------------

  These MUST stay app-specific (injected via DI):

  A. Actor summary resolution
     VCSM: vc.get_actor_summaries / vc.actor_presentation
     Wentrex: learning.actor_profiles

  B. Notification kind definitions
     VCSM: follow, comment, like, rose, mention, etc.
     Wentrex: assignment_posted, submission_graded, course_enrolled, etc.

  C. Notification templates / renderers
     VCSM: 10 type-specific JSX components
     Wentrex: would need LMS-specific renderers

  D. Block/privacy filtering
     VCSM: moderation.blocks + actor_privacy_settings
     Wentrex: LMS access rules

  E. Link path generation
     VCSM: /profile/:id, /post/:id
     Wentrex: /course/:id, /assignment/:id

  F. Notification triggers / event sources
     VCSM: DB triggers on vc.* social tables
     Wentrex: would need triggers on learning.* tables


12. Proposed Neutral Notification Engine Boundaries
------------------------------------------------------

  Engine core (engines/notifications/):
    config.js                    — configureChatEngine-style DI
    dal/notifications.read.dal.js
    dal/notifications.write.dal.js
    dal/subscribeToNotifications.js
    model/Notification.model.js
    controller/getNotifications.controller.js
    controller/markNotificationRead.controller.js
    controller/countUnreadNotifications.controller.js
    hooks/useNotifications.js
    hooks/useNotificationCount.js
    adapters/index.js

  DI dependencies (app-injected):
    supabaseClient               — required
    getActorSummariesByIds       — required (reuse from chat setup)
    resolveNotificationFilter    — optional (block/privacy filtering)
    mapNotificationKind          — optional (kind normalization)
    buildNotificationLinkPath    — optional (route generation)

  Schema: notifications.* (neutral, not vc.* or learning.*)
    notifications.notifications
    notifications.notification_preferences


13. Suggested Folder Structure
---------------------------------

  engines/notifications/
    index.js
    CLAUDE.md
    src/
      config.js
      events.js
      adapters/
        index.js
      controller/
        getNotifications.controller.js
        markNotificationRead.controller.js
        countUnreadNotifications.controller.js
        createNotification.controller.js
      dal/
        notifications.read.dal.js
        notifications.write.dal.js
        notifications.count.dal.js
        subscribeToNotifications.js
      model/
        Notification.model.js
      hooks/
        useNotifications.js
        useNotificationCount.js
      services/
        fanoutService.js
        aggregationService.js


14. Highest-Risk Areas for Cross-App Drift
---------------------------------------------

  1. Notification kind definitions — VCSM has 10 kinds, Wentrex has 0
     Risk: if Wentrex adds notifications later, kind overlap or inconsistency

  2. Storage schema — VCSM uses vc.notifications, Wentrex would need separate
     Risk: no shared table means no shared engine reads/writes

  3. Trigger architecture — VCSM uses DB triggers, Wentrex has none
     Risk: different notification creation patterns per app

  4. Actor summary source — different tables per app
     Risk: already solved by chat engine DI pattern — use same approach

  5. Block/privacy filtering — VCSM has blocks, Wentrex has none
     Risk: already solved by chat engine DI pattern — inject filter


15. Final Verdict
-------------------

  STATUS: ENGINE INTEGRATED — VCSM READ + WRITE PATH MIGRATED

  Updated: 2026-04-12

  Current state:
  - Engine: engines/notifications/ — 30 files, fully operational
  - Schema: notification.* — 8 tables, RLS enabled
  - VCSM: **actively consuming engine for all reads and 7 write events**
  - Legacy: vc.notifications still populated by DB triggers but **no longer read by UI**
  - Wentrex: no notification system (unchanged)

  What is complete:
  - Engine wired into VCSM via setup.js + main.jsx
  - Inbox read path: engine getInboxNotifications()
  - Badge count: engine countUnread()
  - Header mark-all-seen: engine getInboxNotifications(autoMarkSeen)
  - Realtime: notification.inbox_items + notification.recipients
  - Write path (7 events): publishVcsmNotification() adapter → engine publishEvent()
    - booking_created, booking_confirmed, booking_cancelled
    - review_created
    - follow, follow_request, follow_request_accepted
  - 3 orphaned legacy DALs removed

  Legacy cleanup completed (2026-04-12):
  - 3 orphaned legacy DALs deleted: notifications.dal.js, notifications.read.dal.js, notifications.count.dal.js
  - Dev diagnostics migrated from legacy write DAL to notification engine
  - countUnread: 5s TTL cache with dedup added, state mutations bust cache
  - useUnreadBadge: rewired to read chat.inbox_entries directly (not notification engine)

  What remains:
  1. Seed notification.event_types + notification.templates for rendered content
  2. Disable legacy DB triggers on vc.* tables
  3. Remove remaining legacy DALs (notifications.create.dal.js, notifications.write.dal.js — kept for dev diagnostics)
  4. Wire Wentrex when needed

  See: `zNOTFORPRODUCTION/_CANONICAL/logan/engines/engines.notifications.engine-architecture.md` for full engine documentation.
