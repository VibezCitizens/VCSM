---
name: vcsm.notifications.architecture
description: ARCHITECT V2 module architecture report for VCSM:notifications
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-04
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** notifications
**Application Scope:** VCSM
**Module Type:** feature
**Primary Root:** apps/VCSM/src/features/notifications
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The notifications module is the full-stack notification system for VCSM. It handles two distinct concerns: (1) publishing notification events from anywhere in the app via a thin adapter over the `notification` engine's `publishEvent` API, and (2) rendering the in-app notification inbox — fetching, filtering by blocks, resolving senders, mapping to domain objects, and presenting typed notification cards per event kind. The module also owns the runtime engine bootstrap (`setup.js`) that wires Supabase and the hydration engine into the notification engine via dependency injection.

## OWNERSHIP

Notifications domain team (or Social/Core platform team). The module is self-contained: it owns the engine setup, all inbox read paths, write acknowledgement paths (mark-seen, mark-read, dismiss, archive), and all typed notification item views. Cross-feature publish callers (booking, social, post, upload, chat, settings, etc.) depend on this module's adapter surface.

## ENTRY POINTS

- `NotificationsScreen` — primary entry point for the `/notifications` route, rendered via the app router
- `notifications.adapter.js` — public adapter surface: `publishVcsmNotification`, `publishVcsmNotificationBatch`, `getUnreadNotificationCount`
- `setupVcsmNotificationsEngine()` from `setup.js` — called once at app bootstrap to wire the notification engine

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 25 | notificationRuntime.dal.js (write/read surfaces for notification.* schema), blocks.read.dal.js, senders.read.dal.js |
| Model | 4 | notificationRuntime.model.js (inbox row mapping), notification.model.js (domain mapper + kind normalizer) |
| Controller | 7 | Notifications.controller.js, NotificationsHeader.controller.js, notificationsCount.controller.js |
| Service | N/A | — |
| Adapter | 1 | notifications.adapter.js (public surface: publish + count) |
| Hook | 7 | useNotificationInbox.js, useNotifications.js, useNotiCount.js, useNotificationsHeader.js, useMyAppointments.js |
| Component | 1 | NotificationCard.jsx |
| Screen | 38 | NotificationsScreen.jsx, NotiViewPostScreen.jsx, 13+ typed notification item views (booking, comment, follow, reaction, mention, review, team) |
| Barrel | 3 | runtime/index.js (engine barrel), publish.js (publisher), setup.js |

Counts from scanner callgraph data (cg_layerCounts).

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Source confirms dual-responsibility: publish + inbox UI | BEHAVIOR.md is a placeholder (no contract written) |
| Owner defined | PARTIAL | Module is cohesive but no explicit ownership declaration | No OWNERSHIP.md or team annotation |
| Entry points mapped | PASS | NotificationsScreen, adapter, setup.js all confirmed | No route entry in route-map (navigation handled by app router) |
| Controllers present/delegated | PASS | 7 controllers (callgraph) | — |
| DAL/repository present/delegated | PASS | 25 DAL nodes (callgraph); runtime.dal.js is comprehensive | — |
| Models/transformers present | PASS | 4 models; notificationRuntime.model.js + notification.model.js confirmed | — |
| Hooks/view models present | PASS | 7 hooks; useNotificationInbox.js is primary React Query source | — |
| Screens/components present | PASS | 38 screens (callgraph); 14 typed notification views confirmed | — |
| Services/adapters present | PASS | notifications.adapter.js confirmed | Adapter exports only publish + count; inbox hooks not exposed |
| Database objects mapped | PASS | notification.* schema: events, recipients, rendered, inbox_items | All 9 write surfaces mapped in scanner |
| Authorization path mapped | PARTIAL | Self-notification guard in publish.js; inbox owner assertion in controller | No RLS audit documented; block filtering is present |
| Cache/runtime behavior mapped | PASS | React Query (stale 60s, gc 5min), in-memory count cache (5s TTL) in runtime/index.js | No realtime subscription (intentional, noted in hook comment) |
| Error/loading/empty states mapped | PARTIAL | Loading (skeleton on cold open), error (query.error exposed) confirmed in hook | Empty state behavior not verified in views |
| Documentation linked | FAIL | BEHAVIOR.md present but is a placeholder — no contract content | Full behavior contract missing |
| Tests/validation noted | FAIL | 0 tests (scanner) | No test coverage for any notification path |
| Native parity noted | N/A | — | — |
| Engine dependencies mapped | PASS | notification engine (primary), hydration engine (sender resolution in setup.js), booking/identity/profile/review engines also listed | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| engines/notification (`@notifications`) | engine | inbound | YES — via runtime/index.js + setup.js | Module owns the engine wiring; runtime/index.js IS the engine implementation inline |
| engines/hydration (`@hydration`) | engine | inbound | YES — via setup.js resolveActorCard | Used for sender enrichment at engine config time |
| features/identity (adapter) | feature | inbound | YES — via identity.adapter | useIdentity() in useNotificationInbox |
| features/social (adapter) | feature | inbound | YES — via social.adapter | useSocialFollowRequestOps for follow-request filtering in controller |
| notification.events (DB) | db | write | YES — via notification.create_event RPC | — |
| notification.recipients (DB) | db | write | YES — via notification.insert_recipients RPC | — |
| notification.rendered (DB) | db | write | YES — via notification.upsert_rendered RPC | — |
| notification.inbox_items (DB) | db | write/read | YES — via RPC + direct table queries | mark-seen, mark-read, dismiss, archive |
| vc.notifications (DB) | db | legacy | PARTIAL — professional feature still writes here | `professional` feature writes vc.notifications directly; separate from this module |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| notification.events | RPC write (create_event) | notifications module | engine | LOW — insert only, RPC-gated |
| notification.recipients | RPC write (insert_recipients) | notifications module | engine | LOW |
| notification.rendered | RPC write (upsert_rendered) | notifications module | engine | LOW |
| notification.inbox_items | RPC write (insert_inbox_item) + direct UPDATE | notifications module | inbox hook, badge count | MEDIUM — direct UPDATE queries bypass RPC pattern used for writes |
| notification.inbox_items (read) | SELECT (is_seen, is_read, archived_at, etc.) | notifications module | useNotificationInbox | LOW |
| notification.recipients (read) | SELECT (delivered, in_app channel) | notifications module | inbox fetch pipeline | LOW |
| notification.events (read) | SELECT by event_id | notifications module | inbox mapping pipeline | LOW |
| notification.rendered (read) | SELECT by recipient_id | notifications module | inbox display | LOW |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | READY | NotificationsScreen.jsx confirmed; app router navigation wires it | No route in static route-map — dynamic nav only |
| Loading state | READY | Skeleton on cold open (query.isPending && !isPlaceholderData) | Warm open uses keepPreviousData — no flash |
| Empty state | UNKNOWN | Hook returns empty array; view behavior not verified from source read | Risk: empty state may not render a meaningful message |
| Error state | PARTIAL | query.error exposed by hook | Error rendering in views not confirmed |
| Auth/owner gates | PARTIAL | Self-notification guard in publish.js; inbox owner assertion in Notifications.controller.js | No RLS audit; DB-level owner isolation not documented |
| Cache behavior | READY | React Query 60s stale / 5min gc; count cache 5s TTL; noti:refresh event bus invalidation | Realtime intentionally disabled (comment in useNotificationInbox.js) |
| Runtime dependencies | READY | setupVcsmNotificationsEngine() must be called before render; configures supabase + resolveActorCard | Bootstrap call not verified in this scan; risk if setup is missing |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/notifications/BEHAVIOR.md | PRESENT (placeholder only) |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | — | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md is a placeholder — zero contract content | HIGH | Controllers, inbox filtering, follow-request resolution, and kind normalization are non-trivial behaviors with no documentation anchor | LOGAN |
| Zero test coverage | HIGH | Publish path, inbox fetch pipeline, block filtering, follow-request filtering, kind normalization are all untested | SPIDER-MAN |
| Security audit absent | HIGH | publishVcsmNotification has a self-notification guard but no server-side ownership check — client can pass any recipientActorId; no RLS audit documented | VENOM / ELEKTRA |
| Empty state behavior not confirmed in views | MEDIUM | NotificationsScreenView.jsx not read; empty inbox UX is unknown | IRONMAN |
| `professional` feature writes to legacy `vc.notifications` table | MEDIUM | Creates a split-schema situation; `professional` bypasses the engine entirely | CARNAGE / IRONMAN |
| Engine audit missing | MEDIUM | runtime/index.js is the inline engine implementation — it is very large and handles event creation, delivery pipeline, count cache, inbox paging; no audit of failure modes | LOKI / KRAVEN |
| No route registered in route-map | LOW | Static scanner cannot trace navigation entry; discoverability gap | HAWKEYE |

---

## MODULE BOUNDARY WARNINGS

- `runtime/index.js` is imported as the `@notifications` engine alias but physically lives inside `apps/VCSM/src/features/notifications/runtime/`. It functions as the notification engine implementation rather than a clean separation to `engines/`. This is a known architecture pattern in this repo (feature-as-engine), but it means the feature is simultaneously a domain feature and an engine provider — a dual-responsibility that should be explicitly documented.
- `features/social` is imported inside `inbox/hooks/useNotificationInbox.js` via `social.adapter` — this is a controlled cross-feature dependency for follow-request filtering. It is adapter-gated and acceptable.
- The `professional` feature directly updates `vc.notifications` table (via `dalMarkProfessionalBriefingsSeen`). This is a schema boundary leak — `vc.notifications` is a different table from the `notification.*` schema tables used by the engine, suggesting a legacy migration gap.

---

## SPAGHETTI SCORE

**Module:** notifications
**Score:** WATCH
**Reasons:** Module is mostly clean. The dual-responsibility of being both a domain feature and the engine implementation (runtime/index.js) is the primary structural concern. Cross-feature dependency on social is adapter-gated. The follow-request filter logic in the controller is non-trivial (async DB call during inbox load path). No circular imports detected in static scan.
**Release risk:** MEDIUM (untested critical path, no security audit, placeholder BEHAVIOR.md)

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER — no contract content written

**Check A (Source without behavior):** FAIL — source is well-developed (43 files, full pipeline) but BEHAVIOR.md has no content
**Check B (Behavior without source):** N/A — BEHAVIOR.md declares no happy paths to verify
**Check C (§13 engine consistency):** Scanner declares engines: booking, hydration, identity, notification, profile, review. Source confirms: notification engine (runtime/index.js), hydration engine (setup.js), identity adapter (useNotificationInbox). booking/profile/review engines are likely consumed by caller features, not this module directly — possible scanner over-attribution.
**Check D (§6 data change consistency):** Scanner write surfaces (9 entries, all notification.* schema) match DAL functions confirmed in notificationRuntime.dal.js. Consistent.

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Write BEHAVIOR.md contract | Current placeholder blocks governance, onboarding, and security review | LOGAN |
| P1 | Add test coverage for publish path and inbox pipeline | Zero tests on a critical cross-platform path | SPIDER-MAN |
| P2 | Security audit: publishVcsmNotification recipient validation and DB RLS | Any actor can publish to any recipientActorId with no server-side check | VENOM / ELEKTRA |
| P3 | Audit professional feature's vc.notifications write — confirm it is a separate legacy table or migrate to engine | Schema confusion between vc.notifications and notification.* | CARNAGE |

## RECOMMENDED HANDOFFS

- **LOGAN** — BEHAVIOR.md contract is missing; this is a P1 gap for a high-traffic cross-feature module
- **SPIDER-MAN** — Zero test coverage across the publish path, inbox pipeline, kind normalization, and block filtering
- **VENOM** — No security audit; publishVcsmNotification has client-side-only self-notification guard; no RLS documentation
- **ELEKTRA** — Source-to-sink review on publishVcsmNotification: any actorId can name any recipientActorId
- **LOKI** — Runtime observability missing; inbox fetch pipeline has no tracing or error instrumentation documented
- **IRONMAN** — Empty state and error state UX in NotificationsScreenView not confirmed

---

## Scanner Inputs

| Map | Generated At | Freshness | Confidence |
|---|---|---|---|
| feature-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| callgraph | 2026-06-04T19:48:25Z | FRESH | HIGH |
| write-surface-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| route-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| engine-candidates | 2026-06-04T19:48:25Z | FRESH | MEDIUM |
| dependency-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
