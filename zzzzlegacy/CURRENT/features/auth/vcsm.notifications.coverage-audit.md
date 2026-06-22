# Notification Coverage Audit

Generated: 2026-04-09
Last updated: 2026-04-19 — post-migration state recorded
Codebase: `/Users/vcsm/Desktop/VCSM`

> **NOTE — MIGRATION COMPLETE AS OF 2026-04-19**
> This document was originally written as a pre-migration audit against `vc.notifications`. The system has since been fully migrated to the `notification.*` engine schema. Sections 2–9 below reflect the original state for historical reference. See the **Post-Migration Addendum** at the end for the current runtime reality.
> Authoritative current-state doc: `vcsm.notifications.pipeline.md`

---

## 1. Summary

The notification system is **architecturally solid but operationally fragmented**.

**The good:** A complete read/render pipeline exists with realtime subscriptions, block filtering, sender resolution, kind-based card rendering, and unread badge counting. The UI supports 10+ notification types with tailored messages and actions.

**The problem:** Notification *creation* is **entirely DB-trigger-driven** — no application-level code creates notifications in production. 13 DB trigger functions exist and are confirmed active. However, several major product events have **zero notification coverage** (bookings, reviews, messages). The client-side `dalInsertNotification()` function exists but is only called from dev diagnostics.

**Verdict: Partial coverage with good infrastructure.** The read side is production-quality. The write side relies on DB triggers which cover social interactions but miss business/commerce events entirely.

---

## 2. Current Notification Runtime

### Read/Render Pipeline

| Layer | File | Purpose |
|-------|------|---------|
| Screen | `features/notifications/screen/NotificationsScreen.jsx` | Entry point |
| View | `features/notifications/inbox/ui/Notifications.view.jsx` | List renderer |
| Hook | `features/notifications/inbox/hooks/useNotifications.js` | Lifecycle |
| Controller | `features/notifications/inbox/controller/Notifications.controller.js` | Fetch + filter + resolve |
| DAL Read | `features/notifications/inbox/dal/notifications.read.dal.js` | Query `vc.notifications` |
| Mapper | `features/notifications/inbox/model/notification.mapper.js` | Row → domain model |
| Sender Resolver | `features/notifications/inbox/lib/resolveSenders.js` | Actor enrichment |
| Block Filter | `features/notifications/inbox/lib/blockFilter.js` | Moderation filter |
| Badge | `features/notifications/inbox/hooks/useNotiCount.js` | Unread count |
| Realtime | `features/notifications/inbox/realtime/badgeSubscriptions.js` | Live updates |
| Card | `features/notifications/types/components/NotificationCard.jsx` | Render card |
| Type Switch | `features/notifications/inbox/ui/NotificationItem.view.jsx` | Kind → component |

### Notification Table

**Table:** `vc.notifications`

**Columns:**
- `id`, `recipient_actor_id`, `actor_id`, `kind`, `object_type`, `object_id`, `link_path`, `context` (jsonb), `is_read`, `is_seen`, `created_at`

### Badge System

- `useNotiCount()` — counts `is_seen = false` rows, 15s cache, realtime subscription
- `useUnreadBadge()` — counts `chat.inbox_entries` unread, 10s cache, realtime

---

## 3. Existing Notification Creation Paths

All notification creation happens via **DB triggers** on insert/update events. No production client-side code creates notifications.

### Confirmed Active DB Triggers (13 total)

| # | Trigger | Table | Event | Kind Created | Recipient | Method | Confidence |
|---|---------|-------|-------|-------------|-----------|--------|------------|
| 1 | `trg_actor_follows_notify` | `vc.actor_follows` | INSERT/UPDATE of `is_active` | `follow` | Followed actor | `vc.create_notification()` RPC | High |
| 2 | `trg_comment_likes_notify` | `vc.comment_likes` | INSERT | `comment_like` | Comment author | Direct INSERT | High |
| 3 | `trg_post_comments_notify` | `vc.post_comments` | INSERT | `comment` | Post owner | Direct INSERT | High |
| 4 | `trg_post_dislike_notify` | `vc.post_reactions` | INSERT (reaction='dislike') | `dislike` | Post owner | Direct INSERT | High |
| 5 | `trg_post_like_notify` | `vc.post_reactions` | INSERT (reaction='like') | `like` | Post owner | Direct INSERT | High |
| 6 | `trg_post_mentions_notify` | `vc.post_mentions` | INSERT | `post_mention` | Mentioned actor | Direct INSERT | High |
| 7 | `trg_post_rose_gifts_notify` | `vc.post_rose_gifts` | INSERT | `post_rose` | Post owner | Direct INSERT | High |
| 8 | `trg_social_follow_requests_notify` | `vc.social_follow_requests` | INSERT | `follow_request` | Target actor | Direct INSERT | High |
| 9 | `trg_social_follow_requests_notify` | `vc.social_follow_requests` | UPDATE | `follow_request_accepted` | Requester actor | Direct INSERT | High |
| 10 | `trg_social_follow_requests_accept_notify` | `vc.social_follow_requests` | UPDATE of `status` | `follow_request_accepted` | Requester + marks old as read | `vc.create_notification()` RPC | High |

### Confirmed Unused / Superseded

| Trigger Function | Status | Reason |
|-----------------|--------|--------|
| `vc.trg_follow_accept_notify()` | Superseded | Replaced by `trg_social_follow_requests_accept_notify` |
| `vc.trg_follow_request_notify()` | Superseded | Replaced by `trg_social_follow_requests_notify` |
| `vc.trg_post_reactions_notify()` | Generic fallback | Specific like/dislike triggers handle most cases |

### Client-Side Write Function (Unused in Production)

**File:** `features/notifications/inbox/dal/notifications.create.dal.js`
**Function:** `dalInsertNotification()`
**Called from:** Dev diagnostics only (`dev/diagnostics/groups/notificationsFeature.group.js`)
**Production calls:** ZERO

---

## 4. Notification Coverage Status (Updated 2026-04-19)

### Now Covered — Engine-Published Events (ALL 14)

| # | Event Key | Affected User | Controller | Status |
|---|-------|---------------|-----------|--------|
| 1 | `social.post.like` | Post owner | `togglePostReaction.controller.js` | **ENGINE** |
| 2 | `social.post.dislike` | Post owner | `togglePostReaction.controller.js` | **ENGINE** |
| 3 | `social.post.rose` | Post owner | `sendRose.controller.js` | **ENGINE** |
| 4 | `social.post.comment` | Post owner | `postComments.controller.js` | **ENGINE** |
| 5 | `social.post.comment_reply` | Comment author | `postComments.controller.js` | **ENGINE** |
| 6 | `social.post.comment_like` | Comment author | `commentReactions.controller.js` | **ENGINE** |
| 7 | `social.post.mention` | Mentioned actor | `createPostController.js` | **ENGINE** |
| 8 | `follow` | Followed actor | `follow.controller.js` | **ENGINE** |
| 9 | `follow_request` | Target actor | `followRequests.controller.js` | **ENGINE** |
| 10 | `follow_request_accepted` | Requester | `followRequests.controller.js` | **ENGINE** |
| 11 | `booking_created` | Vport owner | `createBooking.controller.js` | **ENGINE** |
| 12 | `booking_confirmed` | Customer | `confirmBooking.controller.js` | **ENGINE** |
| 13 | `booking_cancelled` | Other party | `cancelBooking.controller.js` | **ENGINE** |
| 14 | `review_created` | Vport owner | `VportReviews.controller.js` | **ENGINE** |
| 15 | `lead_received` | Vport owner | `vportBusinessCard.controller.js` | **ENGINE** |

Legacy DB triggers still dual-write to `vc.notifications` for events 1–7, but the UI reads exclusively from `notification.*`. Engine delivery is authoritative.

### ~~Covered by Legacy DB Triggers Only~~ — FULLY MIGRATED

All 14 events are now engine-published. The "pending migration" list from the 2026-04-12 audit is cleared.

### Still Missing — No Notification Exists

| # | Event | Affected User | Why Needed | Confidence |
|---|-------|---------------|------------|------------|
| 1 | **Review deleted** | Vport owner | Owner should know a review was removed | Medium |
| 2 | **New message** (chat) | Recipient actor | User should be notified of new messages | High |
| 3 | **Follow request declined** | Requester | Requester has no way to know it was declined | Medium |
| 4 | **Service area updated** | Subscribers | Customers in coverage area may want to know | Low |
| 5 | **Portfolio item published** | Subscribers | Followers may want to see new work | Low |

---

## 5. Inconsistent or Partial Notification Flows

### Duplicate Follow Request Triggers

Two trigger functions handle follow request acceptance:
- `trg_social_follow_requests_notify` (direct INSERT, handles both new request AND accept)
- `trg_social_follow_requests_accept_notify` (RPC-based, also handles accept + marks old as read)

Both fire on the same UPDATE event on `vc.social_follow_requests`. This could create **duplicate `follow_request_accepted` notifications** unless one is gated by a condition the other doesn't match.

**Risk:** Medium — may produce duplicate notifications on follow accept.

### Inconsistent Write Method

Some triggers use `vc.create_notification()` RPC (which has deduplication, self-skip, and safety logic), while others do direct `INSERT INTO vc.notifications`. This means:
- Direct INSERTs bypass `p_skip_if_self` logic
- Direct INSERTs bypass any future notification middleware
- No consistent deduplication across all paths

**Affected:** comment, post like/dislike, post mention, post rose, follow request (new path)

### Comment Reply vs Comment Notification

`trg_post_comments_notify` fires on ALL comment inserts and creates kind `comment`. The UI has a separate `comment_reply` renderer, but there is **no DB trigger** that creates `comment_reply` kind notifications. Comment replies are treated the same as root comments in the DB — the UI differentiator is unused.

**Result:** Comment reply notifications render as generic "commented on your Spark" instead of "replied to your Spark."

### Kind Normalization Drift

The mapper normalizes kinds aggressively:
- `reaction` → checks `context.reaction` to split into `like`/`dislike`/`post_rose`
- `followed_you` / `subscribe` / `subscribed` → `follow`
- Dots replaced with underscores

But some DB triggers write kinds that don't match what the UI expects:
- Trigger writes `comment_like` but mapper doesn't explicitly handle this → falls through to default
- Some triggers write `follow.request` (with dot) which gets normalized to `follow_request`

---

## 6. Legacy / Duplicate / Dead Notification Paths

| Item | Status | Details |
|------|--------|---------|
| `vc.trg_follow_accept_notify()` | Dead | Superseded by `trg_social_follow_requests_accept_notify` |
| `vc.trg_follow_request_notify()` | Dead | Superseded by `trg_social_follow_requests_notify` |
| `vc.trg_post_reactions_notify()` | Redundant | Generic reaction trigger; specific like/dislike triggers handle the same events |
| `dalInsertNotification()` | Unused in prod | Only called from dev diagnostics |
| `notifications.dal.js` | **DELETED** | Legacy DAL removed — was orphaned after engine migration |
| `notifications.read.dal.js` | **DELETED** | Legacy DAL removed — was orphaned after engine migration |
| `notifications.count.dal.js` | **DELETED** | Legacy DAL removed — was orphaned after engine migration |
| `comment_reply` UI renderer | Orphaned | UI component exists but no trigger creates `comment_reply` kind |
| `diagnostics` kind | Dev-only | Used in diagnostic testing, not production |

---

## 7. Data Contract Findings

### Writer Shape (DB Trigger INSERT)

```sql
INSERT INTO vc.notifications (
  recipient_actor_id,  -- who receives
  actor_id,            -- who triggered
  kind,                -- notification type
  object_type,         -- entity type (e.g. 'post', 'comment', 'actor')
  object_id,           -- entity UUID
  link_path,           -- nav path (e.g. '/post/{id}')
  context,             -- jsonb (reaction type, sender name, etc.)
  is_read,             -- default false
  is_seen              -- default false
)
```

### Reader Expectation (UI Mapper)

```javascript
{
  id, kind, createdAt, isRead, isSeen,
  sender: { id, kind, displayName, username, avatar, route },
  objectType, objectId, linkPath, context
}
```

### Mismatches Found

| Issue | Impact |
|-------|--------|
| Some triggers don't set `link_path` | UI may not navigate correctly on tap |
| Some triggers don't set `object_type` | Mapper falls back to empty string |
| `context` payload varies wildly between triggers | Some include `senderDisplayName`, others don't |
| No `ref_type` / `ref_id` columns used | Schema has them but no trigger populates them |
| `comment_like` trigger uses different INSERT pattern than `comment` trigger | Inconsistent payload shape |
| Rose trigger includes `context` with rose count; like/dislike don't | Asymmetric context data |

---

## 8. Exact Files That Matter Most

### Current Notification Blueprint (Read Side)

| Priority | File |
|----------|------|
| Critical | `features/notifications/inbox/controller/Notifications.controller.js` |
| Critical | `features/notifications/inbox/dal/notifications.read.dal.js` |
| Critical | `features/notifications/inbox/model/notification.mapper.js` |
| Critical | `features/notifications/inbox/ui/NotificationItem.view.jsx` |
| High | `features/notifications/inbox/dal/notifications.create.dal.js` |
| High | `features/notifications/inbox/lib/resolveSenders.js` |
| High | `features/notifications/inbox/realtime/badgeSubscriptions.js` |

### Highest-Priority Event-Producing Files (No Notifications)

| Priority | File | Missing Notification |
|----------|------|---------------------|
| Critical | `features/booking/controller/createBooking.controller.js` | Booking created |
| Critical | `features/profiles/kinds/vport/controller/review/VportReviews.controller.js` | Review submitted |
| High | `features/booking/dal/updateBookingStatus.dal.js` | Booking status changed |
| High | `features/post/commentcard/controller/postComments.controller.js` | Comment reply (distinct from comment) |
| High | `engines/chat/` (message send path) | New message |

---

## 9. Exact Files That Would Need Future Update

**To add booking notifications:**
- `features/booking/controller/createBooking.controller.js` — call `dalInsertNotification()` after booking insert
- `features/booking/dal/updateBookingStatus.dal.js` — or add DB trigger on `vport.bookings`
- `features/notifications/inbox/ui/NotificationItem.view.jsx` — add `booking` kind renderer
- New: `features/notifications/types/booking/BookingNotificationItem.view.jsx`

**To add review notifications:**
- `features/profiles/kinds/vport/controller/review/VportReviews.controller.js` — call after engine submit
- `features/notifications/inbox/ui/NotificationItem.view.jsx` — add `review` kind renderer
- New: `features/notifications/types/review/ReviewNotificationItem.view.jsx`

**To fix comment reply notifications:**
- DB trigger `vc.trg_post_comments_notify()` — detect parent_id and use `comment_reply` kind
- No UI change needed (renderer already exists)

**To add message notifications:**
- `engines/chat/` — event hook or DB trigger on `chat.messages`
- New renderer for `message` kind

---

## 10. Confidence Level

**High confidence** on:
- Complete list of existing DB triggers (verified in `db_snapshot/full_schema.sql`)
- Complete list of UI notification types (verified in `NotificationItem.view.jsx`)
- Missing booking/review/message notifications (verified no notification code in those paths)
- Duplicate follow request trigger risk (verified both trigger functions)
- `dalInsertNotification()` being unused in production (verified only diagnostic call)

**Medium confidence** on:
- Chat message notification gap (couldn't find explicit message send controller — may be engine-internal)
- Comment reply kind distinction (trigger may have been updated since schema snapshot)

**Low confidence** on:
- Whether `ref_type`/`ref_id` columns are intended for future use or legacy
- Whether generic `reaction` trigger fires alongside specific like/dislike triggers (depends on trigger ordering)

---

## Post-Migration Addendum (2026-04-19)

**Current runtime state — supersedes all pre-migration findings above.**

### What is working

- **All 14 notification events** publish through `publishVcsmNotification()` → engine `publishEvent()`
- **Inbox read** — `getInboxNotifications()` joins `notification.recipients` + `notification.events` + `notification.rendered` + `notification.inbox_items` — fully operational
- **Bell badge** — `countUnread()` reads `notification.inbox_items.is_seen = false` — fully operational
- **Realtime** — `notification.inbox_items` (INSERT/UPDATE) + `notification.recipients` (INSERT) — active
- **Kind routing** — all 14 event keys normalize correctly in `normalizeKind()` to typed UI card kinds
- **Scroll** — `NotificationsScreenView` follows RootLayout scroll contract (no inner scroll container)
- **RLS** — `notification.events` SELECT granted to `authenticated`; `vc.post_rose_gifts` INSERT policy added

### DB migrations applied (2026-04-19)

| Migration | What it fixed |
|-----------|--------------|
| `20260419010000_fix_notification_delivery_rpc_ambiguity.sql` | `upsert_rendered`, `insert_inbox_item`, `update_recipient_status` — all had 42702 ambiguous column bug; fixed by renaming RETURNS TABLE columns to `out_*` |
| `20260419020000_rls_post_rose_gifts_insert.sql` | Added INSERT policy to `vc.post_rose_gifts` (was missing; blocked rose sends with 403) |
| `20260419030000_grant_notification_events_select.sql` | Granted SELECT on `notification.events` to `authenticated` (privilege was missing despite RLS policy existing) |

### Still missing — no notification exists

| Event | Affected User | Priority | Notes |
|-------|---------------|----------|-------|
| New chat message | Recipient actor | High | |
| Review deleted | Vport owner | Medium | |
| Follow request declined | Requester | Medium | |
| Portfolio item published | Followers | Low | |
| Lead received (TRAZE source) | Vport owner | High | TRAZE calls RPC directly — bypasses VCSM controller. Requires `notify-lead-owner` Edge Function. |

### Next steps

1. **Seed `notification.templates`** — currently no templates exist. The no-template fallback writes `title = eventKey` to `notification.rendered`. Typed in-app cards generate their own copy so this doesn't affect in-app display, but push notifications (future) will need templates.
2. **Disable legacy DB triggers** — once engine delivery is confirmed stable in production, the 7 legacy triggers writing to `vc.notifications` can be disabled. The table can then be archived.
3. **Seed `notification.event_types`** — event type rows control supported channels and preference evaluation. Currently absent; `publishEvent` defaults to `['in_app']` without them.
