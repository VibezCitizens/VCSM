# DEADPOOL-NOTIFICATIONS-REVIEW-001
# Full Deep Review — VCSM Notifications Feature
# Date: 2026-06-07
# Scope: /apps/VCSM/src/features/notifications

---

## A. EXECUTIVE VERDICT

**Grade: B-**

| Dimension | Result |
|---|---|
| Is notifications modular? | Mostly yes — adapter boundary is respected by all external callers. Three internal cracks (identity DAL leak, duplicate sender resolution, blocks direct schema access). |
| Is it safe? | Conditionally. Write path (publish) has session guard + DB trigger. Mutation operations (mark-read, dismiss, archive) have no app-layer actor ownership guard — security relies entirely on DB RLS. |
| Is it first-class actor compliant? | Mostly. Public surface uses actorId + kind correctly. VPORT owner resolution is correct. profileId leaks in sender fallback resolution (raw join to `profiles` and `vport.profiles` tables). |
| Biggest risk | Two risks tie: (1) No `captureVcsmError` monitoring on publish failures — silent data loss invisible to ops. (2) `countUnreadInner` unbounded row fetch — O(N) DB query per badge poll cycle. |

---

## B. FOLDER MAP

| Path | Purpose | Status |
|---|---|---|
| `adapters/notifications.adapter.js` | Public surface — 4 exports | OK |
| `publish.js` | Wraps engine `publishEvent` — single + batch | OK (monitoring gap) |
| `setup.js` | DI wires supabase + resolveActorCard into engine | OK |
| `runtime/index.js` | Notification engine — publishEvent, getInboxNotifications, countUnread, markRead/Seen/dismiss/archive | OK (actor guard gap) |
| `runtime/notificationRuntime.dal.js` | Raw DB/RPC calls to notification.* schema | OK |
| `runtime/notificationRuntime.model.js` | Maps DB rows to engine shape | OK |
| `inbox/controller/Notifications.controller.js` | Fetches + filters + maps inbox for UI | OK |
| `inbox/controller/notificationsCount.controller.js` | Thin countUnread wrapper | OK |
| `inbox/controller/NotificationsHeader.controller.js` | Header unread count + markAllSeen | OK (window.dispatchEvent in controller) |
| `inbox/controller/resolveVportOwnerActor.controller.js` | Resolves citizen owner from VPORT actorId | VIOLATION — direct identity DAL import |
| `inbox/hooks/useNotificationInbox.js` | React Query wrapper for inbox | OK |
| `inbox/hooks/useNotiCount.js` | Alias for useNotificationUnread | LOW — thin wrapper |
| `inbox/hooks/useNotifications.js` | Alias for useNotificationInbox | DEAD — unused alias |
| `inbox/lib/resolveInboxActor.js` | Identity → inbox actor semantics | OK |
| `inbox/lib/blockFilter.js` | Block list loader + filter | OK (direct moderation schema access) |
| `inbox/lib/resolveSenders.js` | Actor summary → sender map | PARTIAL — listActorPresentationRowsByIdsDAL duplicates summary call |
| `inbox/dal/blocks.read.dal.js` | Reads moderation.blocks directly | ACCEPTABLE (read-only cross-schema) |
| `inbox/dal/senders.read.dal.js` | Sender hydration with 3-tier fallback | PARTIAL — presentation tier duplicates summary tier |
| `inbox/model/notification.model.js` | Maps engine row to UI notification object | OK |
| `inbox/ui/Notifications.view.jsx` | List view with skeleton | OK |
| `inbox/ui/NotificationItem.view.jsx` | Switch dispatcher for notification types | OK |
| `inbox/ui/NotificationsHeader.view.jsx` | Header bar with unread count | OK |
| `hooks/useNotificationCount.js` | Cache-aware unread count (plain function, not hook) | NAMING VIOLATION — in hooks/ folder |
| `screen/NotificationsScreen.jsx` | Screen passthrough | OK |
| `screen/views/NotificationsScreenView.jsx` | Tab-switcher: notifications vs appointments | OK |
| `screen/views/MyAppointmentsView.jsx` | Appointment cards with cancel/dismiss | OK (feature scope question) |
| `screen/hooks/useMyAppointments.js` | Booking data for appointments tab | OK (uses booking adapter) |
| `screen/NotiViewPostScreen.jsx` | Deep-link post viewer | OK |
| `types/*/` | Per-kind notification UI components (12 types) | OK |
| `styles/notifications-modern.css` | Scoped CSS | OK |

---

## C. PUBLIC ADAPTER SURFACE

File: `adapters/notifications.adapter.js`

| Export | Source | Used By | Keep/Change |
|---|---|---|---|
| `publishVcsmNotification` | `publish.js` | post, booking, social, vportDashboard, upload, reviews, public/vportBusinessCard | KEEP |
| `publishVcsmNotificationBatch` | `publish.js` | booking, vportDashboard/team | KEEP |
| `getUnreadNotificationCount` | `inbox/controller/notificationsCount.controller` | `settings/vports/hooks/useVportNotificationBadges.js` | KEEP — DB-direct, for React Query callers |
| `getNotificationUnreadCount` | `hooks/useNotificationCount.js` | `bootstrap/bootstrap.selectors.js` | KEEP — cache-aware, for global badge |

**Note:** The name similarity between `getUnreadNotificationCount` and `getNotificationUnreadCount` is a hazard. Only word order differs. Recommend renaming one.

**Not exported from adapter** (engine-direct calls, internal only): `markRead`, `markSeen`, `dismiss`, `archive` — used only in `runtime/index.js` and accessed via `@notifications` in diagnostics. No external feature calls these directly. Acceptable for now.

---

## D. WRITE PATH TRACE

| Entry | Source Actor | Recipient Actor | App Guard | DB/RPC Guard | Monitoring | Failure Behavior |
|---|---|---|---|---|---|---|
| `publishVcsmNotification` | `actorId` param (caller-supplied) | `recipientActorId` param | Session check (auth.getSession) + self-filter | DB BEFORE INSERT trigger enforces source_actor_id via actor_owners (TICKET-ARCH-NOTI-SESSION-001) | None — `console.error` DEV-only, catch returns `false` | Silent false return — caller has no signal |
| `publishVcsmNotificationBatch` | `actorId` param | `recipientActorIds[]` param | Session check + self-filter | Same DB trigger | None — catch block is completely empty | Silent false return, no log at all |
| `publishEvent` (engine) | `event.sourceActorId` (passthrough) | `recipients[].recipientActorId` | None (app layer must guard) | RPC `create_event` enforces DB constraints | None | Throws — caught by `publishVcsmNotification` |
| `insertNotificationEventDAL` | `p_source_actor_id` param | N/A | None | RPC constraint | None | Throws on error |
| `insertNotificationRecipientsDAL` | N/A | `recipient_actor_id` in row | None | RPC constraint | None | Throws on error |
| `upsertNotificationRenderedDAL` | N/A | `p_recipient_id` row | None | RPC constraint | None | Throws → caught by publishEvent, marks status 'failed' |
| `insertNotificationInboxItemDAL` | N/A | `p_recipient_id` row | None | RPC constraint | None | Same |
| `updateNotificationRecipientStatusDAL` | N/A | `p_recipient_id` row | None | RPC constraint | None | Error silently swallowed |

**Critical gap:** `publishVcsmNotificationBatch` at `publish.js:141` has an empty catch block — zero logging, zero monitoring, zero signal to the caller. The single-notification variant at least has a DEV-gated console.error. Batch failures are completely dark.

---

## E. INBOX READ PATH TRACE

| Entry | Actor Scope | Guard | Risk |
|---|---|---|---|
| `getNotifications(identity)` | Resolved via `resolveInboxActor(identity)` | identity.actorId + identity.kind required | Safe — identity SSOT from upstream |
| `resolveInboxActor(identity)` | user: targetActorId = identity.actorId; vport: targetActorId = identity.actorId, myActorId = resolved citizen owner | Validates kind; logs DEV error on owner resolution failure | Graceful fallback: if owner not found, vport actorId used (no notifications read, not a data leak) |
| `getInboxNotifications({recipientActorId})` | `readNotificationRecipientRowsDAL` filters by `.eq('recipient_actor_id', recipientActorId)` | Actor-scoped at DB query level | Safe |
| `countUnread({recipientActorId})` | `readNotificationRecipientIdsForUnreadDAL` filters by `recipient_actor_id` | Actor-scoped | Safe — but N unbounded rows fetched (see performance) |
| `markNotificationRecipientsSeenDAL(unseenRecipientIds)` | `unseenRecipientIds` derived from actor-scoped inbox fetch | Implicit actor scope via fetch chain | Safe in current call path |
| `markRead({recipientId})` | NO actor scope | None | RISK — depends on DB RLS on notification.inbox_items |
| `dismiss({recipientId})` | NO actor scope | None | RISK — same |
| `archive({recipientId})` | NO actor scope | None | RISK — same |
| `markSeen({recipientIds})` | Array of recipientIds — no actor scope | None | RISK — callers pass derived IDs (safe today), but function signature allows arbitrary IDs |

**Finding:** `markRead`, `dismiss`, and `archive` in `runtime/index.js` accept a caller-supplied `recipientId` and call the DAL with no actor verification. The DAL updates `notification.inbox_items WHERE recipient_id = ?` with no actor_id join. Correct operation depends entirely on DB RLS restricting which `recipient_id` values the session user may update.

---

## F. OWNERSHIP FINDINGS

| Finding | File | Severity | Explanation |
|---|---|---|---|
| Direct identity DAL import | `inbox/controller/resolveVportOwnerActor.controller.js:1` | HIGH | Imports `readActorOwnerUserDAL` and `readUserActorByProfileIdDAL` from `@/state/identity/identity.read.dal`. This is a raw DAL import from the identity state domain — outside the adapter contract. Should go through identity adapter or be provided by the notifications engine's `resolveActorCard` DI hook. |
| No app-layer actor guard on markRead/dismiss/archive | `runtime/index.js:265-298` | HIGH | `markRead`, `dismiss`, `archive` accept arbitrary `recipientId` with no ownership check. If DB RLS on `notification.inbox_items` is absent or misconfigured, any authenticated session can mark any recipient row. The engine is consumed at app layer only, but the contract is incomplete. |
| Sender fallback reads profileId | `inbox/dal/senders.read.dal.js:107-138` | LOW | Fallback path: reads `vc.actors(id, profile_id, vport_id)`, then joins to `profiles(id, username, display_name, photo_url)`. The `profile_id` is used as a join key (acceptable) but the resulting sender object contains `username`, `display_name`, `photo_url` from profiles directly — not derived from actor_id. No profileId exposed in public shape, but the join itself bypasses the profiles adapter. |
| VPORT owner resolution uses readUserActorByProfileIdDAL | `inbox/controller/resolveVportOwnerActor.controller.js:7-8` | MEDIUM | Name suggests it takes a `profileId` not a `userId`. `readActorOwnerUserDAL(vportActorId)` returns `ownerRow.user_id`. That `user_id` is then passed to `readUserActorByProfileIdDAL` — but `user_id` is a Supabase auth UID, not a profile row ID. The function name is misleading; verify the function implementation accepts `user_id` (auth UID) not `profile_id`. |

---

## G. BOUNDARY FINDINGS

| Source | Target | Import | Severity | Notes |
|---|---|---|---|---|
| `resolveVportOwnerActor.controller.js` | `@/state/identity/identity.read.dal` | `readActorOwnerUserDAL`, `readUserActorByProfileIdDAL` | HIGH | DAL layer from identity state — bypasses identity adapter. Should use identity adapter or engine DI. |
| `blocks.read.dal.js` | `moderation.blocks` (Supabase schema) | Direct schema query | LOW | No moderation adapter. Read-only query, acceptable for now. Becomes a violation if moderation adds filtering logic in future. |
| `senders.read.dal.js` | `vc.actors`, `profiles`, `vport.profiles` (Supabase) | Direct table selects | LOW | Fallback-only path. Primary path uses `@hydration`. Fallback tables bypass identity/profiles/vport adapters. |
| `diagnostics/notificationsFeature.group.js` | `inbox/controller/*`, `inbox/lib/*`, `inbox/model/*` | Direct internal imports | MEDIUM | Diagnostics panel imports internals, not adapter. Acceptable for a testing harness, but widens surface that must be maintained when internals change. |
| `screen/hooks/useMyAppointments.js` | `@/features/booking/adapters/booking.adapter` | `useBookingOps` | OK | Correct adapter import. |
| `screen/hooks/useMyAppointments.js` | `@booking` (engine alias) | `dismissBooking` | LOW | Engine alias import — bypasses booking adapter. Booking adapter should expose `dismissBooking`. |
| External callers (post, social, booking, etc.) | `@/features/notifications/adapters/notifications.adapter` | `publishVcsmNotification` | OK | All external publishers use adapter. |
| `bootstrap/bootstrap.selectors.js` | `@/features/notifications/adapters/notifications.adapter` | `getNotificationUnreadCount` | OK | Correct adapter import. |
| `settings/vports/hooks/useVportNotificationBadges.js` | `@/features/notifications/adapters/notifications.adapter` | `getUnreadNotificationCount` | OK | Correct adapter import. |

---

## H. MONITORING FINDINGS

| File | Missing / Present | Recommendation |
|---|---|---|
| `publish.js:86-92` | `captureVcsmError` MISSING. Only DEV-gated `console.error`. | Add `captureVcsmError(err, 'publishVcsmNotification')` in catch block (production). |
| `publish.js:141` | Catch block is completely EMPTY for batch variant. No log, no monitoring, no console. | Add at minimum DEV-gated `console.error` to match single-notification parity. Add `captureVcsmError` for production. |
| `runtime/index.js:144-145` | `updateNotificationRecipientStatusDAL(recipientId, 'failed', ...)` records failure in DB. But throw still propagates upward. | OK — DB records delivery failure. No additional monitoring needed here. |
| `inbox/controller/Notifications.controller.js:56-59` | DEV `console.error` on follow_request filter failure. | Acceptable DEV logging. Not a production path. |
| `inbox/lib/resolveInboxActor.js:39-43` | DEV `console.error` on VPORT owner resolution failure. | Acceptable DEV logging. Add `captureVcsmError` for production to detect broken owner chains. |
| `inbox/controller/notificationsCount.controller.js:7-10` | Catch returns 0 silently. | For a badge count, silent 0 is acceptable UX. No change needed. |
| `inbox/controller/NotificationsHeader.controller.js:22-26` | Catch returns `{ unreadCount: 0 }` silently. | Acceptable. |

---

## I. PERFORMANCE FINDINGS

| Issue | File | Impact | Recommendation |
|---|---|---|---|
| Unbounded recipient ID fetch for count | `runtime/index.js:222-232` + `notificationRuntime.dal.js:204-226` | HIGH — User with 1000 notifications: fetches 1000 UUIDs across the wire, then does an IN-clause count. O(N) transfer per badge poll cycle. | Replace two-query approach with a single COUNT query joining `recipients` and `inbox_items`. Push to DB function. |
| N-parallel VPORT badge queries | `settings/vports/hooks/useVportNotificationBadges.js:19-28` | MEDIUM — N queries per 60s poll (one per VPORT). Each query hits the two-query count pattern above. 10 VPORTs = 20 DB queries/min just for badges. | Add `getUnreadNotificationCountBatch(actorIds[])` to the adapter + engine. Single RPC with array input. |
| 3-tier sender resolution fallback | `inbox/lib/resolveSenders.js` | LOW — Two of three tiers call the same hydration function. Third tier does 4 parallel queries (actors, profiles, vports). In practice: hydration cache should resolve most senders in tier 1, making tiers 2-3 rare. | Remove tier 2 (`listActorPresentationRowsByIdsDAL`) — it duplicates tier 1. Keep tier 3 as the only true fallback. |
| 60s inbox polling with no realtime | `inbox/hooks/useNotificationInbox.js:26` `refetchInterval: STALE_MS` | LOW — Intentional. Realtime is disabled. `noti:refresh` custom event provides fresh invalidation when needed. | Acceptable. Document the decision in BEHAVIOR.md if not already there. |
| keepPreviousData on inbox | `useNotificationInbox.js:35` | POSITIVE — Prevents skeleton flash on refetch. Safe because query keys are actorId-scoped. | No change needed. |
| Cache-aware count (`deriveCountFromInboxCache`) | `hooks/useNotificationCount.js:13-28` | POSITIVE — Avoids DB call when inbox is fresh. Falls through when all rows are unread (accuracy guard). | No change needed. |

---

## J. DEAD / STALE CODE

| File | Evidence | Action |
|---|---|---|
| `inbox/hooks/useNotifications.js` | 4-line alias: `export default function useNotifications() { return useNotificationInbox() }`. Not exported from adapter. Not imported by any external consumer (grep: no external hits). Used only internally by `NotificationsScreenView.jsx` which could import `useNotificationInbox` directly. | REMOVE — delete file, update `NotificationsScreenView.jsx` to import `useNotificationInbox` directly. |
| `inbox/dal/senders.read.dal.js` — `listActorPresentationRowsByIdsDAL` | Lines 23-30. Identical implementation to `listActorSummaryRowsByIdsDAL` (both call `hydrateAndReturnSummaries({ actorIds })`). Tier 2 in `resolveSenders` will always return the same data tier 1 already returned (or empty for IDs hydration can't resolve — which tier 3 catches anyway). | REMOVE function. Delete tier 2 block in `resolveSenders.js`. |
| `styles/notifications-modern.css` | Referenced in `NotificationsScreenView.jsx`. Cannot verify as dead without CSS content review, but isolated module CSS is the correct pattern. | KEEP — verify no dead selectors in a future CSS audit pass. |
| Realtime subscription comment in `notificationsFeature.group.js:24` | `// badgeSubscriptions.js removed — realtime badge subscriptions are disabled (noops).` | Comment is informative. KEEP as intent documentation. |

---

## K. FINAL TICKET QUEUE

### P0 — Security

**NOTI-SEC-001: Verify DB RLS on notification.inbox_items for mark-read/dismiss/archive mutations**
- `runtime/index.js:265-298` — `markRead`, `dismiss`, `archive` have no app-layer actor guard
- If RLS is present and correct, document it in SECURITY.md for notifications
- If RLS is absent or uses `auth.uid()` without joining to `recipient_actor_id` → patch required: add `assertSessionOwnsNotificationRecipient` or move ownership check into the RPC

### P1 — Architecture

**NOTI-ARCH-001: Remove direct identity DAL import from resolveVportOwnerActor.controller.js**
- `inbox/controller/resolveVportOwnerActor.controller.js:1`
- Replace `readActorOwnerUserDAL` + `readUserActorByProfileIdDAL` imports with identity adapter calls
- Also verify: `readUserActorByProfileIdDAL` function name — it accepts `user_id` (auth UID), not `profileId`. If the function name is wrong, it's a naming hazard.

**NOTI-ARCH-002: Add captureVcsmError monitoring to publish paths**
- `publish.js:86-92` — add `captureVcsmError(err, 'publishVcsmNotification')`
- `publish.js:141` — add at minimum DEV logging, then `captureVcsmError` for production
- Also add to `inbox/lib/resolveInboxActor.js` on owner resolution failure

**NOTI-ARCH-003: Rename near-identical adapter exports to eliminate confusion**
- `getUnreadNotificationCount` vs `getNotificationUnreadCount` (one word order apart)
- Propose: `getUnreadCountDirect` (DB-direct) vs `getUnreadCountCacheAware` (cache-first), or similar unambiguous names

**NOTI-ARCH-004: Move hooks/useNotificationCount.js to controller layer**
- It is a plain async function, not a React hook
- Rename: `notifications/inbox/controller/notificationUnreadCount.cache.controller.js` or similar
- Update adapter re-export path

**NOTI-ARCH-005: Fix @booking engine alias in useMyAppointments.js**
- `screen/hooks/useMyAppointments.js:3` imports `dismissBooking` from `@booking` (engine alias), bypassing booking adapter
- Add `dismissBooking` to `booking.adapter.js` and update import

### P2 — Performance

**NOTI-PERF-001: Replace two-query countUnreadInner with single DB function**
- `runtime/index.js:222-232`
- New RPC: `count_actor_unread(p_recipient_actor_id, p_delivery_channel)` → COUNT with JOIN
- Eliminates unbounded recipient ID row transfer

**NOTI-PERF-002: Add batch unread count endpoint for VPORT badge queries**
- `settings/vports/hooks/useVportNotificationBadges.js`
- New RPC: `count_unread_batch(p_actor_ids[])` → `{ actor_id, count }[]`
- Reduces N queries to 1 per poll cycle for the VPORT switcher

### P3 — Cleanup

**NOTI-CLEANUP-001: Remove useNotifications.js alias**
- `inbox/hooks/useNotifications.js` — dead alias
- Update `NotificationsScreenView.jsx` to import `useNotificationInbox` directly

**NOTI-CLEANUP-002: Remove listActorPresentationRowsByIdsDAL duplicate**
- `inbox/dal/senders.read.dal.js:23-30` + tier 2 block in `resolveSenders.js`
- Tier 1 (hydration) → Tier 2 (direct DB fallback) is sufficient; tier 2 is a dead duplicate of tier 1

**NOTI-CLEANUP-003: Fix diagnostics test insert_and_mark_read**
- `diagnostics/notificationsFeature.group.js:184`
- `markRead({ recipientId: context.actorId })` is wrong — `recipientId` is a notification row UUID, not actor ID
- Test silently no-ops. Should fetch a real recipient ID from inbox first, then mark it read.

---

## Summary Counts

| Severity | Count |
|---|---|
| CRITICAL | 0 |
| HIGH | 3 (monitoring gap, actor guard gap, countUnreadInner performance) |
| MEDIUM | 4 (identity DAL import, diagnostics boundary, VPORT badge fanout, presentation DAL duplicate) |
| LOW | 6 (naming confusion, hooks/ folder misname, useNotifications alias, diagnostics test bug, window.dispatchEvent in controller, @booking engine bypass) |
| INFO | 2 (realtime disabled intentionally, keepPreviousData positive pattern) |

---

*Report written by DEADPOOL-NOTIFICATIONS-REVIEW-001 — 2026-06-07*
