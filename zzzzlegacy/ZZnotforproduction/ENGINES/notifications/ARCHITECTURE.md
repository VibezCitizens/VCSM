# ARCHITECTURE — engines/notifications

**Last ARCHITECT Run:** 2026-06-05
**Ticket:** TICKET-ARCHITECT-MISSING-0001
**Status:** COMPLETE — gaps identified
**Independence:** FULLY INDEPENDENT

---

## Engine Purpose

Shared domain engine for notification publish, delivery, and inbox management. Owns the full lifecycle: event publish → recipient resolution → preference evaluation → template rendering → delivery per channel → inbox state management.

## Source Root

`/Users/vcsm/Desktop/VCSM/engines/notifications/`

## Public API Alias

`@notifications` — consumed by VCSM only.

## DI Configuration

`apps/VCSM/src/features/notifications/setup.js` wires:
- `supabaseClient` — notification schema queries
- `resolveActorCard` → calls `@hydration` engine for actor enrichment (cross-engine in app layer)

NOT injected: `resolveRecipients` — VCSM passes explicit recipients via `publishVcsmNotification` adapter.

## Layer Structure

```
config.js         — DI (no freeze guard)
events.js         — 12 event constants + in-process emitter
types/index.js    — JSDoc typedefs (no runtime code)
dal/              — 10 files, notification schema exclusively + 2 RPCs
model/            — 7 pure row mappers
services/         — 4 services (delivery, preference, render, trace)
controller/       — 4 controllers (publish, inbox, inboxState, countUnread)
adapters/         — public surface (32 exported symbols)
```

## DB Access

notification schema exclusively. No vc, vport, learning, or platform queries inside the engine.

| Table | Access |
|-------|--------|
| notification.events | READ/WRITE (via create_event RPC) |
| notification.event_types, event_categories | READ |
| notification.recipients | READ/WRITE |
| notification.rendered | READ/WRITE |
| notification.inbox_items | READ/WRITE (via insert_inbox_item RPC) |
| notification.delivery_attempts | WRITE |
| notification.preferences | READ |
| notification.templates | READ |

## Publish Pipeline

8-step pipeline: validate event type → insert event (RPC) → resolve recipients → expand per channel → evaluate preferences → insert recipients → render + persist rendered → deliver per channel.

## Delivery Channel Status

| Channel | Status |
|---------|--------|
| in_app | IMPLEMENTED — insert_inbox_item RPC |
| email | STUB — queued delivery_attempt, no real provider |
| sms | STUB |
| push | STUB |
| webhook | STUB |

External channels silently "succeed" — delivery_attempts are marked "sent" with no actual delivery.

## App Consumers (VCSM)

| File | Purpose |
|------|---------|
| features/notifications/setup.js | DI wiring |
| features/notifications/publish.js | App adapter (publishVcsmNotification, publishVcsmNotificationBatch) |
| features/notifications/inbox/ | Inbox screen (getInboxNotifications, countUnread) |
| settings/vports/hooks/useVportNotificationBadges.js | Vport badge counts |

## Critical Gaps

- **dalCountUnseenInbox broken** — queries ALL inbox_items globally, ignores actorId filter. Dead code (controller bypasses it). Must be fixed or removed.
- **External delivery is a stub** — email/sms/push/webhook channels create delivery attempt rows and immediately mark recipients "delivered" with no real provider call.
- **No DI freeze guard** — configureNotificationsEngine() mutable post-startup.
- **BEHAVIOR.md MISSING** — Blue Team blocked.
- **SECURITY.md MISSING** — VENOM/ELEKTRA blocked.
- **Zero tests** — no test files in engine directory.
- **Self-notification guard in app adapter only** — engine doesn't prevent self-notify.

## Full Report

`ZZnotforproduction/ENGINES/notifications/outputs/2026/06/05/ARCHITECT/engine.notifications.architecture.md`
