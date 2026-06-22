# Module Architecture Report — vcsm.notifications
# Generated: 2026-06-02
# Ticket: ARCHITECT-NOTIFICATIONS-0001
# ARCHITECT §26.11 — Dated Immutable Module Report
# Status: IMMUTABLE — do not edit; supersede with a new dated report

---

# notifications — Full Module Architecture Report

## Report Header

| Field | Value |
|---|---|
| Feature | notifications |
| App | VCSM |
| Security Tier | MEDIUM |
| Feature Status | ACTIVE |
| Base Source Path | `apps/VCSM/src/features/notifications/` |
| Engine Path | `engines/notifications/` (consumed via `@notifications` alias) |
| Architecture State | EVOLVING |
| Module Status | MOSTLY COMPLETE |
| Run Date | 2026-06-02 |
| Ticket | ARCHITECT-NOTIFICATIONS-0001 |
| Prior ARCHITECT Evidence | None — first ARCHITECT run for this feature |
| Prior ARCHITECTURE.md | Not found — created by this run |

---

## Feature Overview

The `notifications` feature manages the full lifecycle of in-app notification delivery
for VCSM actors: publishing events via the `@notifications` engine, reading and rendering
the inbox with bidirectional block filtering, tracking unread badge counts, and dispatching
typed notification views per event kind (booking, comment, follow, mention, reaction,
review, team). It also owns the `My Appointments` panel, which surfaces booking state
to the authenticated citizen via the `@booking` engine.

The feature completed a full migration from the legacy `vc.notifications` DAL to the
engine-driven `@notifications` pipeline (evidenced by migration comments in controllers).
The `runtime/notificationRuntime.dal.js` serves as a VCSM-side DI bridge that wraps
engine RPC calls — this is architecturally correct but is at the 300-line split limit.

Six dead files from the pre-migration era remain in the codebase (SENTRY REVIEW_PENDING).

---

## Layer Presence

| Layer | Present | Path |
|---|---|---|
| Controllers | YES | `apps/VCSM/src/features/notifications/inbox/controller/` |
| DALs | YES | `apps/VCSM/src/features/notifications/inbox/dal/` + `apps/VCSM/src/features/notifications/runtime/notificationRuntime.dal.js` |
| Models | YES | `apps/VCSM/src/features/notifications/inbox/model/notification.model.js` + `apps/VCSM/src/features/notifications/runtime/notificationRuntime.model.js` |
| Hooks | YES | `apps/VCSM/src/features/notifications/inbox/hooks/` + `apps/VCSM/src/features/notifications/screen/hooks/` |
| Screens | YES | `apps/VCSM/src/features/notifications/screen/` |
| Components | YES | `apps/VCSM/src/features/notifications/types/components/` + `apps/VCSM/src/features/notifications/inbox/ui/` |
| Adapters | YES | `apps/VCSM/src/features/notifications/adapters/notifications.adapter.js` |
| Lib (utility) | YES | `apps/VCSM/src/features/notifications/inbox/lib/` |
| Publish bridge | YES | `apps/VCSM/src/features/notifications/publish.js` |
| Setup / DI | YES | `apps/VCSM/src/features/notifications/setup.js` |
| Engine controllers | YES | `engines/notifications/src/controller/` |
| Engine DALs | YES | `engines/notifications/src/dal/` |

---

## Active Controllers

| Controller | Purpose | Auth Gate |
|---|---|---|
| `Notifications.controller.js` | Fetch inbox via engine `getInboxNotifications`, apply bidirectional block filter, filter resolved follow requests, resolve senders, map to domain objects. VPORT filter: suppresses `kind='follow'` at output. | `resolveInboxActor(identity)` — returns `[]` on null `targetActorId` |
| `NotificationsHeader.controller.js` | `loadNotificationHeader(actorId)` returns `{ unreadCount }` via `countUnread`. `markAllNotificationsSeen(actorId)` uses `getInboxNotifications` with `autoMarkSeen: true` + dispatches `noti:refresh` window event. | Parameter guard: early return on null `actorId` |
| `notificationsCount.controller.js` | Single function `getUnreadNotificationCount(actorId)` delegates directly to engine `countUnread`. | Parameter guard: returns `0` on null `actorId` |

**Dead / Superseded Controllers:**
- `inboxUnread.controller.js` — DEAD (SENTRY RISK-8 — chat re-export boundary violation). Zero consumers. Deletion approved pending sign-off.

---

## Active DALs

| DAL | Tables | Notes |
|---|---|---|
| `blocks.read.dal.js` | `moderation.blocks` | Bidirectional block lookup: `listBlockedActorRowsDAL` (actors I blocked) + `listBlockingActorRowsDAL` (actors who blocked me). Explicit column selects. |
| `senders.read.dal.js` | `vc.actors`, public `profiles`, vport `profiles` | Actor summary lookup via `@hydration` engine (cache-aware). Also provides direct `listActorIdentityRowsByIdsDAL`, `listProfileRowsByIdsDAL`, `listVportRowsByIdsDAL` for fallback resolution. Uses `vportClient` for vport profiles. |
| `notificationRuntime.dal.js` | `notification.events`, `notification.recipients`, `notification.rendered`, `notification.inbox_items` | AT 300-LINE CONTRACT LIMIT. Full RPC surface: `create_event`, `insert_recipients`, `upsert_rendered`, `insert_inbox_item`, `update_recipient_status`. Also handles all inbox read/write state operations (markSeen, markRead, dismiss, archive). Configured via `configureNotificationsRuntimeDAL` DI pattern. |

**Engine DALs (engines/notifications/src/dal/):**

| Engine DAL | Tables | Notes |
|---|---|---|
| `inbox.read.dal.js` | `notification.recipients`, `notification.inbox_items` | Read-only inbox fetch (`dalListInboxRecipients`, `dalGetInboxItemsByRecipientIds`). Uses `notification.*` schema only. |
| Additional engine DALs | `notification.events`, `notification.rendered`, `notification.preferences`, `notification.delivery_attempts`, `notification.templates`, `notification.event_types` | Full write pipeline. 5 of these tables are undocumented in RLS governance (LOKI LF-2). |

---

## Active Hooks

| Hook | Calls | Purpose |
|---|---|---|
| `useNotificationInbox.js` | `Notifications.controller.getNotifications`, `useSocialFollowRequestOps`, `useIdentity` | React Query source of truth for inbox. 60s polling. `noti:refresh` + `noti:optimistic:replace` window event listeners. Badge invalidation after successful fetch. `keepPreviousData` for warm-open UX. |
| `useNotifications.js` | `useNotificationInbox` | Thin re-export wrapper only. |
| `useNotiCount.js` | `useNotificationUnread` from `@/bootstrap/bootstrap.selectors` | Thin wrapper — count from bootstrap React Query selector. All polling/TTL logic removed. |
| `useNotificationsHeader.js` | `NotificationsHeader.controller.markAllNotificationsSeen`, `useNotificationUnread` | Mark-all-seen + badge query invalidation. |
| `useMyAppointments.js` | `useBookingOps` (booking.adapter), `dismissBooking` (@booking), `hydrateActorsByIds` (@hydration) | Booking appointment list with upcoming/pending/past segmentation. Cancel + dismiss actions. |

**Dead Hooks (pending deletion):**
- `useUnreadBadge.js` — RISK-7 (misattributed chat hook)
- `useNotificationsInternal.js` — RISK-5 (dead useState/useEffect, zero consumers)
- `useMarkNotificationsRead.js` — RISK-6 (dead + calls @notifications engine directly, bypassing controller)

---

## Lib Layer

| File | Purpose |
|---|---|
| `blockFilter.js` | `loadBlockSets(actorId)` + `filterByBlocks(rows, blocks, opts)` — bidirectional block set union filter applied client-side over notification rows |
| `resolveInboxActor.js` | Maps VCSM identity object to inbox actor semantics (`targetActorId`, `myActorId`) for user and vport kinds |
| `resolveSenders.js` | `resolveSenders(actorIds)` builds sender map from `senders.read.dal.js`. Contains `mapSummaryRowToSender()` — a domain transform that belongs in `model/` (SENTRY RISK-9 OPEN) |

---

## Engine Dependencies

| Engine | Import Path | Purpose |
|---|---|---|
| `@notifications` | `engines/notifications/` | Core pipeline: `publishEvent`, `getInboxNotifications`, `countUnread`, `markSeen`, `markRead`, `dismiss`, `archive`, `configureNotificationsEngine` |
| `@hydration` | `engines/hydration/` | Actor summary hydration for sender enrichment (`hydrateAndReturnSummaries`, `hydrateActorsByIds`) |
| `@booking` | `engines/booking/` | Appointment list and dismiss operations in `useMyAppointments` |

---

## Cross-Feature Dependencies

| Feature | What is Imported | Direction | Compliant |
|---|---|---|---|
| `identity` | `useIdentity` from `@/features/identity/adapters/identity.adapter` | notifications → identity | YES — via adapter |
| `social` | `useSocialFollowRequestOps` from `@/features/social/adapters/social.adapter` | notifications → social | YES — via adapter |
| `social` | `useFollowRequestActions` from `@/features/social/adapters/friend/request/hooks/useFollowRequestActions.adapter` | notifications → social | YES — via adapter |
| `booking` | `useBookingOps` from `@/features/booking/adapters/booking.adapter` | notifications → booking | YES — via adapter |
| `shared` | `ActorLink`, `formatTimestamp` from `@/shared/` | notifications → shared | YES — shared primitives |

All cross-feature imports go through declared public adapter surfaces. No direct internal
imports from other features detected.

---

## Authorization Pattern

The notifications feature uses an **actor-scoped parameter guard** pattern:

1. **Identity resolution:** `resolveInboxActor(identity)` adapts the VCSM identity
   (`actorId`, `kind`, `ownerActorId`) into inbox semantics. Returns `{ targetActorId: null }`
   on invalid identity — controller returns empty array and exits immediately.
2. **Inbox scope:** Engine calls use `recipientActorId` as the sole data filter. The caller
   must provide their own actor ID (sourced from the session identity). No server-side
   ownership assertion beyond RLS at the DB level.
3. **Block filtering:** Bidirectional — `loadBlockSets(myActorId)` fetches both sides of
   the block relationship and applies as a client-side union filter.
4. **VPORT suppression:** `kind='follow'` notifications are filtered out at the controller
   output level for VPORT actors.
5. **Publish guard:** `publishVcsmNotification` guards `recipientActorId` and `kind` as
   required. Self-notification is blocked (`actorId === recipientActorId`). No further
   access control on who may call the publish surface.

**ACL Gap (OPEN — IRONMAN MEDIUM):** No documented rule controls which callers may invoke
`publishVcsmNotification()` via `notifications.adapter.js`. Any feature with a reference
to the adapter can publish to any recipient actor ID.

---

## Module Independence Classification

**DEPENDENT**

The notifications feature depends on three external feature adapters (identity, social,
booking) and three engines (@notifications, @hydration, @booking). The engine dependency
is the architectural foundation — the feature does not own its own DB write surface
directly but rather wraps the `@notifications` engine with VCSM-specific adapter logic.
All cross-feature imports go through declared adapter surfaces (structurally compliant).

---

## Architecture State

**EVOLVING**

The feature completed a full migration from the legacy `vc.notifications` DAL to the
`@notifications` engine. Core flows are stable. Six pre-migration dead files remain
(SENTRY REVIEW_PENDING). `notificationRuntime.dal.js` is at the split limit. My
Appointments is structurally co-located but is a separate concern with no documented
ownership.

---

## Known Structural Risks

| # | Risk | Severity | Source | Status |
|---|---|---|---|---|
| 1 | RISK-6: `useMarkNotificationsRead.js` dead + layer violation (calls engine directly) | LOW | VENOM 2026-05-19 | OPEN — deletion pending sign-off |
| 2 | RISK-8: `inboxUnread.controller.js` dead + chat re-export boundary violation | LOW | SENTRY 2026-05-19 | OPEN — deletion pending sign-off |
| 3 | RISK-7: `useUnreadBadge.js` dead (misattributed chat hook) | LOW | SENTRY 2026-05-19 | OPEN — deletion pending sign-off |
| 4 | RISK-5: `useNotificationsInternal.js` dead (zero consumers) | LOW | SENTRY 2026-05-19 | OPEN — deletion pending sign-off |
| 5 | RISK-1: `NotiViewPostScreen.jsx` dead duplicate view | LOW | SENTRY 2026-05-19 | OPEN — deletion pending sign-off |
| 6 | Dead `badgeSubscriptions.js` (noops, never called) | LOW | SENTRY 2026-05-19 | OPEN — deletion pending sign-off |
| 7 | RISK-9: `mapSummaryRowToSender()` domain transform in `lib/` not `model/` | LOW | SENTRY 2026-05-19 | OPEN |
| 8 | KF-1: Serial publish delivery loop — O(N × 3 × RTT) | ELEVATED | KRAVEN 2026-05-19 | OPEN |
| 9 | Publish ACL gap — any caller can publish to any actorId | MEDIUM | IRONMAN 2026-05-19 | OPEN |
| 10 | `notificationRuntime.dal.js` at 300-line contract limit | LOW | SENTRY 2026-05-19 | OPEN — split required |
| 11 | My Appointments scope mismatch — booking surface co-located in notifications screen | LOW | ARCHITECT 2026-06-02 | NEW |
| 12 | UI layer + types dispatch ownership unassigned | LOW | IRONMAN 2026-05-19 | OPEN |

---

## Module Completeness Matrix

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | DR_STRANGE.md, CURRENT_STATUS.md | — |
| Owner defined | PARTIAL | Engine layer assigned; UI layer, types dispatch, My Appointments unassigned | IRONMAN OPEN |
| Entry points mapped | PASS | notifications.adapter.js + publish.js documented | — |
| Controllers present | PASS | 3 active controllers confirmed | 1 dead controller pending deletion |
| DAL/repository present | PASS | 3 feature DALs + full engine DAL suite | notificationRuntime.dal.js at split limit |
| Models/transformers | PASS | notification.model.js + notificationRuntime.model.js | RISK-9: transform in lib/ not model/ |
| Hooks/view models | PASS | 5 active hooks confirmed | 3 dead hooks pending deletion |
| Screens/components | PASS | NotificationsScreen + 13 type views + NotificationCard + 3 inbox UI views | Dead NotiViewPostScreen pending deletion |
| Authorization path mapped | PARTIAL | Actor guard + block filter confirmed | Publish ACL gap OPEN (MEDIUM) |
| Engine dependencies mapped | PASS | @notifications, @hydration, @booking all confirmed | — |
| Tests/validation noted | FAIL | TESTS.md not found; SPIDER-MAN not run | No test coverage documented |

---

## Recommended Handoffs

| Command | Priority | Reason |
|---|---|---|
| SPIDER-MAN | HIGH | Zero test coverage. No TESTS.md. Required before THOR. |
| CARNAGE | HIGH | RLS ownership undocumented for 5 notification schema tables. |
| BLACKWIDOW | HIGH | Adversarial runtime verification never run. Required before THOR. |
| SENTRY | MEDIUM | Dead file deletion sign-off pending. RISK-9 transform relocation open. |
| ELEKTRA | MEDIUM | Precision scan of publish surface — ACL gap source→sink tracing. |

---

## Final Module Status

**MOSTLY COMPLETE**

Core inbox read, badge count, block filter, publish adapter, and engine integration are
all complete and structurally sound. Legacy DAL migration is done. The feature is blocked
from THOR by: 6 dead files (SENTRY), publish ACL gap (MEDIUM), KF-1 serial delivery loop
(ELEVATED), no test coverage, and BLACKWIDOW never run.

---

## ARCHITECT Run Record
- Date: 2026-06-02
- Ticket: ARCHITECT-NOTIFICATIONS-0001
- Architecture State: EVOLVING
- Files Scanned: 44 source files (apps/VCSM/src/features/notifications) + 7 engine files
- Controllers Found: 3 active, 1 dead
- DALs Found: 3 feature DALs + full engine DAL suite
- Hooks Found: 5 active, 3 dead
- Cross-Feature Imports: identity (1), social (2), booking (1), shared (2)
- Engine Dependencies: @notifications, @hydration, @booking
- New Findings: My Appointments scope mismatch (structural concern, LOW)
- Confirmed Open Findings: KF-1 ELEVATED, Publish ACL MEDIUM, 6 dead files, RISK-9, notificationRuntime.dal.js split limit
