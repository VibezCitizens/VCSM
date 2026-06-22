---
name: vcsm.notifications.behavior
description: Feature-level behavior contract for the VCSM notifications feature — built from governance artifacts
metadata:
  type: behavior
  status: ACTIVE
  authored-by: LOGAN (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001)
  date: 2026-06-05
  priority: P0
  evidence-standard: GOVERNANCE_ARTIFACTS_ONLY
---

# Feature Behavior Contract — notifications
**Application:** VCSM
**Status:** ACTIVE — built from governance artifacts (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001)
**Evidence standard:** Governance artifacts only. No source code read. UNKNOWN = unproven.

---

## §1 Purpose

The notifications module is the full-stack notification system for VCSM. It handles two distinct concerns:

1. **Publishing notification events** — a thin adapter surface (`publishVcsmNotification`, `publishVcsmNotificationBatch`) over the `notification` engine's `publishEvent` API, callable from anywhere in the app.
2. **Rendering the in-app notification inbox** — fetching, filtering by blocks, resolving senders, mapping to domain objects, and presenting typed notification cards per event kind.

The module also owns the runtime engine bootstrap (`setup.js`) that wires Supabase and the hydration engine into the notification engine via dependency injection.

**Architecture note:** The module is simultaneously a domain feature and the engine provider — `runtime/index.js` is imported via the `@notifications` engine alias but physically lives inside `apps/VCSM/src/features/notifications/runtime/`. This dual-responsibility is a known pattern in this codebase (feature-as-engine) and should be treated as load-bearing architecture.

**Owner:** Notifications domain team (or Social/Core platform team).

Source: ARCHITECTURE.md § PURPOSE, § MODULE BOUNDARY WARNINGS; CURRENT_STATUS.md

---

## §2 Entry Points

Three documented entry points:

| Entry Point | Type | Description |
|---|---|---|
| `NotificationsScreen` | Screen | Primary entry point for the `/notifications` route, rendered via the app router. No static route entry in route-map — reached via dynamic in-app navigation (bottom tab or notification badge tap). |
| `notifications.adapter.js` | Adapter | Public adapter surface: `publishVcsmNotification`, `publishVcsmNotificationBatch`, `getUnreadNotificationCount`. All cross-feature publish callers depend on this surface. |
| `setupVcsmNotificationsEngine()` from `setup.js` | Bootstrap | Called once at app bootstrap to wire the notification engine (Supabase client + `resolveActorCard` hydration function). Must be called before any inbox render. |

**Route registration:** No static route entries are registered in the route-map for this feature. Navigation is dynamic only.

Source: ARCHITECTURE.md § ENTRY POINTS; INDEX.md § Routes

---

## §3 User Flows

### 3.1 View Notification Inbox

Actor navigates to the notifications screen (dynamic navigation via app router). The `useNotificationInbox` hook fetches inbox items for the authenticated actor using `useIdentity()` as the identity source (session-sourced). On cold open, a skeleton loading state is shown. On warm open, `keepPreviousData` prevents a flash. The inbox renders typed notification cards per event kind.

**Block filtering:** Inbox items from blocked senders are filtered before display via `blockFilter.js`. The filter loads `iBlocked` and `blockedMe` sets from `moderation.blocks` and removes any inbox row where `sourceActorId` is in either set.

**VPORT actor variant:** When the active identity is a VPORT, `resolveInboxActor` maps `targetActorId` to the vport's own actorId and `myActorId` to the ownerActorId for block filtering.

Source: ARCHITECTURE.md § MODULE RUNTIME READINESS; BlackWidow report § 5.2, 5.3

### 3.2 Mark Notification Read / Dismiss / Archive

Actor marks an individual notification read, dismisses it, or archives it. These are write operations against `notification.inbox_items`. Each operation is routed through the notification engine controllers (`markRead`, `dismiss`, `archive`) which call the DAL write functions.

**Idempotency (PARTIAL):** `markSeen` includes an `.eq('is_seen', false)` guard preventing double-execution. `dismiss` and `archive` do NOT include equivalent idempotency guards — replay updates the dismissed_at / archived_at timestamps.

Source: BlackWidow report § F (Mutation Replay), BW-NOTI-007

### 3.3 Mark All Seen

Actor triggers "mark all seen" via the header action. `useNotificationsHeader` hook calls `markAllNotificationsSeen(actorId)` where `actorId` is passed as a prop from the calling component. The controller has a null guard but does not independently verify `actorId` against the session.

Source: BlackWidow report § B (Session Mutation), BW-NOTI-002

### 3.4 Publish a Notification

Cross-feature callers (booking, social, post, upload, chat, settings, etc.) call `publishVcsmNotification` or `publishVcsmNotificationBatch` from `notifications.adapter.js`. The publish path:

1. Applies a self-notification guard: if `actorId === recipientActorId`, the call returns `false` immediately without writing.
2. Dispatches through the `notification` engine's `publishEvent`, which writes to `notification.events`, `notification.recipients`, `notification.rendered`, and `notification.inbox_items` via RPC.

**No route entry exists for publish** — publish is a library call, not a screen action.

Source: ARCHITECTURE.md § ENTRY POINTS; Venom report § VEN-NOTIFICATIONS-004; BlackWidow report § I, SI-4

### 3.5 Optimistic Inbox Update

The `noti:optimistic:replace` window custom event can be dispatched to mutate the in-memory notification cache. The handler removes one notification by ID and inserts a caller-supplied `add` object into the React Query cache. This is used for optimistic UI updates after local actions.

Source: Venom report § VEN-NOTIFICATIONS-005; BlackWidow report § I, SI-5

### 3.6 Inbox Refresh

The `noti:refresh` window custom event invalidates React Query caches for the current actor's inbox. Any script with DOM access can trigger this.

Source: Venom report § VEN-NOTIFICATIONS-005

---

## §4 Business Rules

| # | Rule | Source |
|---|---|---|
| BR-1 | An actor must not receive notifications from themselves. `publishVcsmNotification` enforces `actorId !== recipientActorId` and returns `false` if equal. | BlackWidow report § I, SI-4 (BLOCKED) |
| BR-2 | An actor must not see inbox items from actors they have blocked or who have blocked them. Block filtering runs server-side before the inbox is returned. | BlackWidow report § I, SI-3 (BLOCKED) |
| BR-3 | Inbox items are fetched with React Query — stale time 60 seconds, garbage collect 5 minutes. | ARCHITECTURE.md § MODULE COMPLETENESS MATRIX (Cache/runtime behavior) |
| BR-4 | Unread count cache has a 5-second TTL via an in-memory count cache in `runtime/index.js`. | ARCHITECTURE.md § MODULE COMPLETENESS MATRIX |
| BR-5 | Realtime subscription is intentionally disabled. Inbox refresh is event-bus driven via `noti:refresh`. | ARCHITECTURE.md § MODULE COMPLETENESS MATRIX |
| BR-6 | The `professional` feature writes to a separate legacy `vc.notifications` table directly — bypassing the notification engine entirely. This is a known schema boundary gap. | ARCHITECTURE.md § MODULE DEPENDENCY GRAPH (vc.notifications), MODULE MISSING PIECES |
| BR-7 | `setupVcsmNotificationsEngine()` must be called before any inbox render or publish action. If setup is missing, notification engine is unconfigured. | ARCHITECTURE.md § MODULE RUNTIME READINESS |
| BR-8 | The `notifications.adapter.js` exposes publish and count surfaces only. Inbox hooks are not exposed via the adapter. | ARCHITECTURE.md § MODULE COMPLETENESS MATRIX |

---

## §5 State Rules

### Documented inbox_items state transitions

| State Column | Write Function | Guard | Notes |
|---|---|---|---|
| `is_seen` | `markNotificationRecipientsSeenDAL` (bulk) | `.eq('is_seen', false)` — idempotency guard PRESENT | Bulk operation on array of recipientIds |
| `is_read` | `markNotificationReadDAL` | No idempotency guard | Single recipientId |
| `is_dismissed` | `dismissNotificationDAL` | No idempotency guard (`.eq('is_dismissed', false)` ABSENT) | BW-NOTI-007: replay updates dismissed_at |
| `archived_at` | `archiveNotificationDAL` | No idempotency guard (`.is('archived_at', null)` ABSENT) | BW-NOTI-007: replay updates archived_at |

**State machine completeness:** PARTIALLY DOCUMENTED. Only `is_seen` has an idempotency guard. Transitions for `is_read`, `is_dismissed`, and `archived_at` are terminal writes without state-machine guards. Full state machine (e.g., whether dismissed items can be un-dismissed, whether archived items can be read) is UNKNOWN — REQUIRES IMPLEMENTATION REVIEW.

Source: BlackWidow report § F (Mutation Replay), BW-NOTI-007; INDEX.md § Write Surface Map

---

## §6 Security Constraints

Each constraint is derived from a documented finding. Status reflects current enforcement state.

| Constraint | Finding ID | Current Status |
|---|---|---|
| CONSTRAINT: Inbox state mutations (markRead, dismiss, archive, markSeen) must only execute against the authenticated actor's own inbox items. No cross-actor tamper must be possible. | BW-NOTI-001, VEN-NOTIFICATIONS-002 | VIOLATED — engine controllers accept arbitrary recipientId with no ownership assertion at any layer. RLS on `notification.inbox_items` is UNVERIFIED. |
| CONSTRAINT: The `actorId` used in `markAllNotificationsSeen` must be verified against the active session — it must not be accepted as a prop without session cross-check. | BW-NOTI-002 | PARTIAL — null guard present, no session cross-check. Stale/swapped actorId prop can operate on wrong actor's inbox. |
| CONSTRAINT: When `resolveInboxActor` processes a vport identity, `ownerActorId` must be present. If missing, block filtering must not be silently disabled. | BW-NOTI-003 | PARTIAL — missing ownerActorId returns `myActorId: null`, which causes block filter to return empty sets (filtering skipped). |
| CONSTRAINT: RLS on `notification.inbox_items` must enforce that UPDATE operations are restricted to the authenticated actor's own recipient rows. | BW-NOTI-004 | UNRESOLVED — RLS presence on this table for UPDATE operations is not verified in any governance artifact. |
| CONSTRAINT: The `sourceActorId` in published notification events must match the authenticated session actor. Callers must not be able to impersonate a different actor as the notification source. | BW-NOTI-005, VEN-NOTIFICATIONS-004 | VIOLATED — `publishEvent` accepts caller-supplied `sourceActorId` with no session verification at the engine layer. |
| CONSTRAINT: The `noti:optimistic:replace` window event handler must validate the `add` object shape and sanitize `linkPath`. Unvalidated payloads must not be injected into the notification cache. | VEN-NOTIFICATIONS-005 | VIOLATED — handler accepts any shape from `e.detail` without validation. Fake notifications can be injected into the UI via XSS or console dispatch. |
| CONSTRAINT: The diagnostics panel must pass a real `recipientId` (from `notification.recipients`) to `markRead` — not an `actorId`. These are different ID namespaces. | VEN-NOTIFICATIONS-003 | VIOLATED in DEV — diagnostics panel passes `context.actorId` where `recipientId` is expected (ID namespace mismatch). |
| CONSTRAINT: `linkPath` values in published notifications must not contain raw UUID values. All navigation paths must use human-readable slugs. | BW-NOTI-009 | VIOLATED in DEV (diagnostics passes `/profile/${actorId}`). UNRESOLVED for production callers — no validation gate at publish layer. |
| CONSTRAINT: Sender display name fallback must not use payload-embedded values when those values could contain unescaped HTML or script content. | BW-NOTI-008 | PARTIAL — fallback to `ctx.senderDisplayName` from notification payload occurs when hydration fails. Risk conditional on UI escaping. |
| CONSTRAINT: Engine markRead/dismiss/archive must include a null guard on recipientId at the engine controller level. | BW-NOTI-006 | PARTIAL — app-layer DAL has a null guard; engine controller does not. Defense-in-depth gap. |

Source: SECURITY.md; Venom report § 7; BlackWidow report § 7

---

## §7 Error Handling

| Scenario | Documented Behavior | Source |
|---|---|---|
| Null identity on inbox load | `resolveInboxActor` returns `{ targetActorId: null, myActorId: null }`. `Notifications.controller.js` returns `[]` (empty array). No engine calls made. | BlackWidow report § E |
| Null actorId on `getUnreadNotificationCount` | Controller returns `0` immediately. | BlackWidow report § E |
| Null actorId on `loadNotificationHeader` | Controller returns `{ unreadCount: 0 }` immediately. | BlackWidow report § E |
| Null recipientId on `markRead` (engine controller) | Engine controller has no null guard. Supabase query would match no rows (safe but silent). App-layer DAL does have a null guard returning `null`. | BlackWidow report § E, BW-NOTI-006 |
| Sender hydration failure | `resolveSenders.js` degrades gracefully (`.catch(() => [])`). Falls back through: `listActorSummaryRowsByIdsDAL` → `listActorPresentationRowsByIdsDAL` → `listActorIdentityRowsByIdsDAL`. Final fallback: `ctx.senderDisplayName` from notification payload (XSS risk — see BW-NOTI-008). | BlackWidow report § G |
| Query error in inbox hook | `query.error` is exposed by `useNotificationInbox`. Error rendering behavior in views not confirmed from governance. | ARCHITECTURE.md § MODULE RUNTIME READINESS |
| Empty inbox | Hook returns empty array. Empty state rendering behavior in `NotificationsScreenView.jsx` is UNKNOWN — not verified from governance. | ARCHITECTURE.md § MODULE RUNTIME READINESS |

**Error handling completeness: PARTIAL.** Null identity and count guards are documented as BLOCKED by BlackWidow. View-level empty state and error rendering are UNKNOWN — REQUIRES IMPLEMENTATION REVIEW.

---

## §8 Cross-Feature Dependencies

| Dependency | Type | Direction | Approval Status | Notes |
|---|---|---|---|---|
| `engines/notification` (`@notifications` alias) | engine | inbound | APPROVED | `runtime/index.js` IS the engine implementation; module owns the engine wiring |
| `engines/hydration` | engine | inbound | APPROVED | Sender resolution via `hydrateAndReturnSummaries` in `setup.js` |
| `features/identity` (adapter) | feature | inbound | APPROVED | `useIdentity()` in `useNotificationInbox` — session-sourced actorId |
| `features/social` (adapter) | feature | inbound | APPROVED | `useSocialFollowRequestOps` for follow-request filtering in controller |
| `notification.events` (DB) | db | write | APPROVED | Via `notification.create_event` RPC |
| `notification.recipients` (DB) | db | write | APPROVED | Via `notification.insert_recipients` RPC |
| `notification.rendered` (DB) | db | write | APPROVED | Via `notification.upsert_rendered` RPC |
| `notification.inbox_items` (DB) | db | write/read | APPROVED — with caveat | write via RPC + direct UPDATE; direct UPDATE bypasses RPC pattern |
| `vc.notifications` (DB) | db | legacy write | PARTIAL | `professional` feature writes here directly, separate from this module; schema boundary gap |

**Independence status:** MOSTLY INDEPENDENT (ARCHITECT, CURRENT_STATUS.md)

Source: ARCHITECTURE.md § MODULE DEPENDENCY GRAPH

---

## §9 Must Never Happen — Security Invariants

These invariants are derived from BlackWidow source-inferred invariants and confirmed finding results. Current enforcement status reflects governance artifact evidence only.

| # | Invariant | Derived From | BW Result |
|---|---|---|---|
| INV-1 | An authenticated actor must NEVER be able to read or modify another actor's inbox state (markRead, dismiss, archive, markSeen). | SI-1; BW-NOTI-001, VEN-NOTIFICATIONS-002 | BYPASSED — engine controllers accept any recipientId with no ownership assertion. CRITICAL. |
| INV-2 | A notification must NEVER be attributed to an actor who did not generate the triggering event. sourceActorId must always equal the authenticated session actor. | SI-2; BW-NOTI-005, VEN-NOTIFICATIONS-004 | BYPASSED — sourceActorId is caller-supplied with no session verification. |
| INV-3 | An actor must NEVER receive inbox items from actors they have blocked or who have blocked them. | SI-3 | BLOCKED — block filter confirmed active. Partially weakened by BW-NOTI-003 (missing ownerActorId disables filtering). |
| INV-4 | Self-notifications must NEVER be delivered. An actor must never receive a notification where they are both the source and the recipient. | SI-4; publish.js self-guard | BLOCKED — `publish.js` enforces `actorId !== recipientActorId`. |
| INV-5 | The in-app notification cache must NEVER be mutated by externally dispatched window events that carry unvalidated payloads. No fake notifications may be injected via DOM event dispatch. | SI-5; VEN-NOTIFICATIONS-005 | BYPASSED — `noti:optimistic:replace` handler accepts any `e.detail` shape without validation. |
| INV-6 | Raw UUID values must NEVER appear in notification `linkPath` values delivered to end users. All paths must use human-readable slugs. | BW-NOTI-009; platform memory no-raw-IDs-in-URLs | BYPASSED in DEV (diagnostics). UNRESOLVED for production publish callers — no validation gate. |
| INV-7 | Inbox state mutation functions (dismiss, archive) must NEVER apply updates to items already in the target state (double-dismiss, double-archive). | BW-NOTI-007 | BYPASSED — no idempotency guards on dismiss or archive. |
| INV-8 | Sender display names rendered in the notification inbox must NEVER be sourced from unescaped caller-supplied payload strings when hydration fails. | BW-NOTI-008 | PARTIAL — fallback path exists; risk conditional on UI render escaping. |

---

## §10 Module Responsibilities

The following modules are enumerated in governance artifacts. Responsibility is documented where governance evidence exists. Specifics are UNKNOWN where module BEHAVIOR.md is STUB only.

### Module: runtime

**Responsibility:** Engine wiring, bootstrap, and the publish surface.
- `setup.js` — configures notification engine on app boot via dependency injection (Supabase client + resolveActorCard).
- `publish.js` (`publishVcsmNotification`) — accepts notification payload, enforces self-notification guard, dispatches via `@notifications` engine.
- `notificationRuntime.dal.js` — all 9 write surfaces to `notification.*` schema (5 RPCs + 4 direct UPDATEs on inbox_items).
- `notifications.adapter.js` — exposes publish boundary and count query to other features.

**Invariants from module BEHAVIOR.md (STUB — UNVERIFIED):**
- `sourceActorId` must be session-derived (NOT enforced — BW-NOTI-005 BYPASSED).
- `linkPath` must not contain raw UUIDs (NOT enforced — BW-NOTI-009 BYPASSED).

Source: modules/runtime/BEHAVIOR.md (STUB); ARCHITECTURE.md § LAYER MAP; INDEX.md § Write Surface Map

### Module: inbox

**Responsibility:** Inbox read path, block filtering, actor identity resolution, and all inbox state mutation acknowledgements.
- `useNotificationInbox.js` — primary React Query hook for fetching inbox items. Identity via `useIdentity()` (session-sourced). Window event listeners for `noti:refresh` and `noti:optimistic:replace`.
- `Notifications.controller.js` — resolves inbox actor, applies block filter, triggers autoMarkSeen.
- `NotificationsHeader.controller.js` — loads unread count header, exposes markAllSeen.
- `resolveInboxActor.js` — maps identity (user or vport) to targetActorId + myActorId.
- `blockFilter.js` — filters inbox rows by block sets. Returns empty sets if `myActorId` is null (BW-NOTI-003 gap).

**Invariants from module BEHAVIOR.md (STUB — UNVERIFIED):**
- All mutations must be scoped to the authenticated actor's inbox (NOT enforced — BW-NOTI-001 BYPASSED).
- `recipientId` must derive from session (NOT enforced — BW-NOTI-002 PARTIAL).

Source: modules/inbox/BEHAVIOR.md (STUB); BlackWidow report § 5.2, 5.3, 5.4

### Module: types

**Responsibility:** Typed notification item views — renders correct type component based on `notification.type` discriminator. Covers booking, comment, follow, reaction, mention, review, and team notification types. `NotiViewPostScreen` navigates to linked posts. `MyAppointmentsView` renders upcoming booking notifications via `useMyAppointments`.

**All expected behaviors UNVERIFIED** — module BEHAVIOR.md is STUB. Specific type discriminator values, deep-link formats, and appointments view data source are UNKNOWN — REQUIRES IMPLEMENTATION REVIEW.

Source: modules/types/BEHAVIOR.md (STUB); INDEX.md § Source Inventory (Screens)

---

## §11 Known Gaps

### UNKNOWN items requiring implementation review

- Empty state rendering behavior in `NotificationsScreenView.jsx` — whether a meaningful empty inbox message is displayed is not confirmed in any governance artifact.
- Error state rendering in notification views — `query.error` is exposed by the hook but how it is rendered in views is not confirmed.
- Confirmation that `setupVcsmNotificationsEngine()` is actually called at app bootstrap — ARCHITECTURE.md flags this as a risk ("Bootstrap call not verified in this scan").
- Full state machine for inbox items — whether dismissed items can be un-dismissed, whether archived items can be read, and what terminal states exist.
- Specific `notification.type` discriminator values used to select typed view components.
- Deep-link format for each notification type.
- Whether `MyAppointmentsView` is driven by notification type or a separate bookings query.
- Exact payload shape expected by `publishEvent`.
- What Supabase table and channel name the realtime subscription uses (noted as intentionally disabled in hook comment, but confirmation is unverified).

### Missing governance artifacts

- OWNERSHIP.md — does not exist. No explicit team annotation or ownership declaration.
- TESTS.md — does not exist. Zero tests confirmed by scanner (INDEX.md § Tests: 0).
- ELEKTRA has never run on this feature (SECURITY.md: ELEKTRA Status: NOT RUN).
- No runtime audit (LOKI has not run).
- No performance audit (KRAVEN has not run).
- No migration audit (CARNAGE has not run for this feature).
- No engine audit for `runtime/index.js` — it is large and handles event creation, delivery pipeline, count cache, and inbox paging with no documented failure modes.
- Module BEHAVIOR.md files for `inbox`, `runtime`, and `types` are all STUB status — no confirmed behavioral content.

### Open security tickets / THOR blockers

- BW-NOTI-001: CRITICAL — inbox ownership bypass (OPEN, BYPASSED)
- BW-NOTI-004: HIGH — RLS on notification.inbox_items UNVERIFIED (OPEN, UNRESOLVED)
- BW-NOTI-010: HIGH — this BEHAVIOR.md was a PLACEHOLDER blocking §9 invariants (RESOLVING with this document)
- VEN-NOTIFICATIONS-002: HIGH — markRead/dismiss/archive have no ownership guard (OPEN)

### Architecture concerns

- `runtime/index.js` is the inline engine implementation living inside the feature directory — dual-responsibility (feature + engine provider) should be explicitly documented as accepted architecture or scheduled for separation.
- `professional` feature writes to `vc.notifications` (legacy table) directly, bypassing the engine entirely — schema split risk.
- No route registered in static route-map — scanner cannot trace navigation entry; discoverability gap for HAWKEYE.
- Cross-feature dependency on `features/social` via adapter inside `useNotificationInbox` — adapter-gated and accepted, but increases surface.

---

## §12 Validation Sources

| Governance File | Status | Key Facts Extracted |
|---|---|---|
| `ZZnotforproduction/APPS/VCSM/features/notifications/CURRENT_STATUS.md` | READ | Architecture state: EVOLVING. Independence: MOSTLY INDEPENDENT. Completeness: MOSTLY COMPLETE. Spaghetti: WATCH. Top gap: BEHAVIOR.md placeholder on a 43-file, cross-platform, high-traffic module. Zero test coverage. |
| `ZZnotforproduction/APPS/VCSM/features/notifications/SECURITY.md` | READ | THOR Blocker: YES. Highest severity: CRITICAL. VENOM: 6 findings (0 CRITICAL, 2 HIGH, 2 MEDIUM, 2 LOW). BW: 10 findings (1 CRITICAL, 2 HIGH, 4 MEDIUM, 3 LOW). ELEKTRA: NEVER RUN. THOR blockers: BW-NOTI-001, VEN-NOTIFICATIONS-002, BW-NOTI-004, BW-NOTI-010. |
| `ZZnotforproduction/APPS/VCSM/features/notifications/ARCHITECTURE.md` | READ | Full module map: 43 files, 7 controllers, 25 DAL files, 7 hooks, 4 models, 38 screens, 1 adapter, 3 barrels. Entry points, dependency graph, data contract, runtime readiness matrix, completeness matrix. Spaghetti: WATCH. Build priority: P1 BEHAVIOR.md, P1 tests, P2 security audit, P3 professional feature audit. |
| `ZZnotforproduction/APPS/VCSM/features/notifications/INDEX.md` | READ | Source inventory counts confirmed. Write surface map (9 operations). Security-sensitive surfaces: publishVcsmNotification recipient validation and inbox_items UPDATE surfaces. Engine dependencies confirmed. |
| `ZZnotforproduction/APPS/VCSM/features/notifications/modules/inbox/BEHAVIOR.md` | READ | STUB. Expected behaviors listed as UNVERIFIED. Key: block filter confirmed, resolveInboxActor documented, BW-NOTI-001 ownership bypass acknowledged, RLS unresolved (BW-NOTI-004). |
| `ZZnotforproduction/APPS/VCSM/features/notifications/modules/runtime/BEHAVIOR.md` | READ | STUB. Expected behaviors listed as UNVERIFIED. Key: sourceActorId must be session-derived (NOT enforced — BW-NOTI-005), linkPath must not contain raw UUIDs (NOT enforced — BW-NOTI-009). |
| `ZZnotforproduction/APPS/VCSM/features/notifications/modules/types/BEHAVIOR.md` | READ | STUB. Expected behaviors listed as UNVERIFIED. Key: type discriminator, deep-link format, appointments view driver all UNKNOWN. Sender display name fallback to payload (BW-NOTI-008) noted. |
| `ZZnotforproduction/APPS/VCSM/features/notifications/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_notifications-security-review.md` | READ | VENOM V2 full report. 6 findings SOURCE_VERIFIED. THOR blocker: VEN-NOTIFICATIONS-002. Full write surface inventory (9 surfaces, 5 RPCs). Source verification table confirming all 16 files read by VENOM. CISSP domain coverage. |
| `ZZnotforproduction/APPS/VCSM/features/notifications/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_notifications-adversarial-review.md` | READ | BLACKWIDOW V2 full report. 10 findings SOURCE_VERIFIED. THOR blockers: BW-NOTI-001 (CRITICAL), BW-NOTI-004, BW-NOTI-010. 5 source-inferred invariants tested (2 BLOCKED, 3 BYPASSED). Full attack surface inventory. 10 SPIDER-MAN test requirements. Line-level citations for all BYPASSED findings. |

**Files not found (do not exist):**
- `OWNERSHIP.md` — not present
- `TESTS.md` — not present

---

## §13 THOR Release Status

**THOR Release Blocker: YES**

Exact text from SECURITY.md: `THOR Release Blocker: YES — BW-NOTI-001 (CRITICAL), VEN-NOTIFICATIONS-002, BW-NOTI-004, BW-NOTI-010`

### Active THOR Blockers

| Blocker ID | Severity | Description | Clearing Criteria |
|---|---|---|---|
| BW-NOTI-001 | CRITICAL | Engine inbox state mutations (markRead/dismiss/archive/markSeen) accept arbitrary recipientId with no ownership assertion at any layer — actor A can tamper with actor B's inbox. | Add `recipient_actor_id` ownership filter to all four DAL functions and thread `actorId` through engine API, OR verify and document DB-level RLS enforcement on `notification.inbox_items` UPDATE. |
| VEN-NOTIFICATIONS-002 | HIGH | markRead/dismiss/archive DAL functions have no ownership guard — any caller with a recipientId can tamper with any actor's inbox state. (Same root cause as BW-NOTI-001; both must be cleared.) | Same as BW-NOTI-001. Add `.eq('recipient_actor_id', actorId)` filter. Verified by DB audit. |
| BW-NOTI-004 | HIGH | RLS on `notification.inbox_items` is UNVERIFIED — inbox mutations filtered by `recipient_id` only; if RLS absent, any authenticated actor can modify any inbox item. | DB-level verification: confirm RLS policy on `notification.inbox_items` UPDATE enforces `auth.uid()` = `recipient_actor_id`. Document result in SECURITY.md. Cannot be cleared by code review alone. |
| BW-NOTI-010 | HIGH | BEHAVIOR.md was a PLACEHOLDER — all §9 invariants were unanchored; governance blocker for THOR. | **RESOLVING** — this document (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001) promotes BEHAVIOR.md from PLACEHOLDER to ACTIVE. Blocker clears when this file is accepted as the feature behavior contract. |

### Non-blocking open findings (must be tracked)

| Finding | Severity | Status |
|---|---|---|
| BW-NOTI-002 | MEDIUM | PARTIAL — markAllSeen actorId not session-verified |
| BW-NOTI-003 | MEDIUM | PARTIAL — missing ownerActorId disables block filter for vport |
| BW-NOTI-005 | MEDIUM | BYPASSED — sourceActorId impersonation (confirms VEN-NOTIFICATIONS-004) |
| BW-NOTI-008 | MEDIUM | PARTIAL — hydration poisoning via payload fallback |
| VEN-NOTIFICATIONS-003 | MEDIUM | VIOLATED in DEV — actorId/recipientId namespace mismatch in diagnostics |
| VEN-NOTIFICATIONS-004 | MEDIUM | BYPASSED — sourceActorId caller-supplied, no session check |
| VEN-NOTIFICATIONS-005 | MEDIUM | BYPASSED — noti:optimistic:replace unvalidated payload |
| BW-NOTI-006 | LOW | PARTIAL — null guard missing at engine controller level |
| BW-NOTI-007 | LOW | BYPASSED — dismiss/archive lack idempotency guards |
| BW-NOTI-009 | LOW | BYPASSED in DEV — raw UUID in linkPath (diagnostics) |
| VEN-NOTIFICATIONS-006 | LOW | RESOLVING — BEHAVIOR.md was placeholder, now ACTIVE |

**Required commands before THOR clearance:**
- DB — verify RLS on `notification.inbox_items` UPDATE (clears BW-NOTI-004)
- Carnage — add `recipient_actor_id` ownership filter to all 4 inbox_items UPDATE DAL functions (clears BW-NOTI-001 + VEN-NOTIFICATIONS-002)
- SPIDER-MAN — add regression tests (BW report § 13: 10 test cases, 4 at P0)
- ELEKTRA — first run required; audit `sourceActorId` injection chain and all `window.addEventListener` usages
