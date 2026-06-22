# NOTIFICATIONS ENGINE AUDIT — V1

**Snapshot Date:** 2026-04-12
**Status:** Engine core complete (Slices 1-3, 5). App integration pending (Slice 4).
**This file is immutable. Do not edit. Future changes produce V2.**

---

## Engine Root

```
/Users/vcsm/Desktop/VCSM/engines/notifications/
```

## Purpose

Domain-neutral notification engine handling the full lifecycle: event publishing, recipient resolution, preference evaluation, template rendering, delivery orchestration, and inbox state management. Built around the `notification.*` PostgreSQL schema to serve `vc`, `learning`, `vport`, and `platform` domains.

## Scope

**Owns:**
- Event creation and storage
- Recipient determination and status tracking
- Preference evaluation (mute, frequency, quiet hours)
- Template resolution with 4-level cascade and variable interpolation
- Delivery orchestration (in_app → inbox items; external → delivery attempts)
- Inbox state (seen, read, opened, dismissed, archived, snoozed)
- Delivery attempt recording and status lifecycle
- Pipeline tracing and observability

**Does not own:**
- React hooks (app responsibility)
- UI components / notification renderers (app responsibility)
- Push/email/SMS provider integrations (future)
- Legacy `vc.notifications` reads/writes (app-side bridge)
- Database triggers (remain on app tables)
- Block/privacy filtering (injected via DI)

## Entry Points

**Public API:** `engines/notifications/index.js` → `src/adapters/index.js`

| Export | Type | Purpose |
|--------|------|---------|
| `configureNotificationsEngine()` | Config | DI: supabaseClient, resolveRecipients, resolveActorCard, debugReporter |
| `publishEvent()` | Controller | Full pipeline: event → recipients → preferences → render → deliver |
| `getInboxNotifications()` | Controller | Paginated inbox with parallel hydration + auto-mark-seen |
| `countUnread()` | Controller | Count unseen non-dismissed non-archived items |
| `markSeen()` | Controller | Batch mark seen |
| `markRead()` | Controller | Single mark read |
| `dismiss()` | Controller | Dismiss inbox item |
| `archive()` | Controller | Archive inbox item |
| `evaluatePreference()` | Service | Direct preference check |
| `renderNotification()` | Service | Direct template render |
| `deliverToRecipient()` | Service | Direct delivery |
| `createPipelineTracer()` | Trace | Creates debugReporter for structured pipeline tracing |
| `getPipelineTraces()` | Trace | Query captured traces |
| `getPipelineSummaries()` | Trace | Completed summaries only |
| `exportTraceSnapshot()` | Trace | Full JSON export |
| `formatPipelineTrace()` | Trace | Human-readable output |
| `EVENTS` | Events | 12 domain event constants |
| `onNotificationEvent()` | Events | Subscribe to engine events |
| `*Model` | Models | 7 row-to-domain transforms |

## Data Flow

### Publishing Pipeline

```
publishEvent({ event, recipients, renderContext })
  ├─ dalGetEventType(eventKey)           → notification.event_types
  ├─ dalInsertEvent()                    → notification.events
  ├─ resolveRecipients (DI or explicit)
  ├─ expandByChannels (from event type supports_* flags)
  ├─ evaluatePreference() per recipient  → notification.preferences
  ├─ dalInsertRecipients()               → notification.recipients
  └─ per recipient:
     ├─ renderNotification()             → notification.templates
     ├─ dalUpsertRendered()              → notification.rendered
     └─ deliverToRecipient()
        ├─ in_app: dalInsertInboxItem()  → notification.inbox_items
        └─ external: dalInsertDeliveryAttempt() → notification.delivery_attempts
```

### Inbox Read Pipeline

```
getInboxNotifications({ recipientActorId, cursor, limit })
  ├─ dalListInboxRecipients()             → notification.recipients
  ├─ Promise.all([
  │    fetchEventsByIds()                 → notification.events
  │    dalGetRenderedByRecipientIds()     → notification.rendered
  │    dalGetInboxItemsByRecipientIds()   → notification.inbox_items
  │  ])
  ├─ compose InboxNotification objects
  └─ dalMarkInboxSeen() (auto)           → notification.inbox_items
```

### Preference Cascade

```
1. Specific: actorId + eventKey + channel
2. General:  actorId + NULL + channel
3. Default:  no row → allowed, frequency=immediate

Checks: is_enabled → frequency → mute_until → quiet_hours
```

### Template Cascade

```
1. Exact:   event_key + channel + locale
2. Fallback: event_key + channel + 'en'
3. Fallback: event_key + 'in_app' + locale
4. Base:    event_key + 'in_app' + 'en'
```

## Source of Truth

| Table | Purpose |
|-------|---------|
| `notification.event_categories` | Event category registry |
| `notification.event_types` | Event definitions with channel support flags |
| `notification.events` | Event instances |
| `notification.recipients` | Per-recipient delivery records |
| `notification.rendered` | Rendered content (1:1 with recipients) |
| `notification.inbox_items` | Inbox state (1:1 with recipients) |
| `notification.delivery_attempts` | Delivery tracking |
| `notification.preferences` | Per-actor/event/channel preferences |
| `notification.templates` | Rendering templates |

## Dependencies

- **Supabase client** (injected via DI)
- **No imports from apps/** — engine is fully isolated
- **No imports from other engines** — no cross-engine dependencies
- **Browser APIs:** `performance.now()` (trace timing only)

## File Map (31 files)

### Root
| File | Purpose |
|------|---------|
| `index.js` | Re-exports adapters |
| `CLAUDE.md` | Scope rules |

### src/
| File | Purpose |
|------|---------|
| `config.js` | DI: supabaseClient, resolveRecipients, resolveActorCard, debugReporter, createTrace |
| `events.js` | 12 domain events + emit/on |
| `types/index.js` | 22 JSDoc typedefs |

### src/model/ (7 files)
| File | Table |
|------|-------|
| `Event.model.js` | notification.events |
| `Recipient.model.js` | notification.recipients |
| `InboxItem.model.js` | notification.inbox_items |
| `Rendered.model.js` | notification.rendered |
| `Template.model.js` | notification.templates |
| `Preference.model.js` | notification.preferences |
| `DeliveryAttempt.model.js` | notification.delivery_attempts |

### src/dal/ (11 files)
| File | Operations |
|------|-----------|
| `events.write.dal.js` | INSERT events |
| `events.read.dal.js` | SELECT events by ID |
| `eventTypes.read.dal.js` | SELECT event_types by key/list |
| `recipients.write.dal.js` | INSERT recipients, UPDATE status |
| `recipients.read.dal.js` | SELECT recipients by event/ID |
| `inbox.write.dal.js` | INSERT inbox_items, UPDATE seen/read/dismiss/archive |
| `inbox.read.dal.js` | SELECT inbox recipients, COUNT unseen, SELECT inbox_items |
| `rendered.write.dal.js` | UPSERT rendered, SELECT by recipient IDs |
| `templates.read.dal.js` | SELECT templates with cascade |
| `preferences.read.dal.js` | SELECT preferences by actor/event/channel |
| `deliveryAttempts.write.dal.js` | INSERT attempts, UPDATE status |

### src/services/ (4 files)
| File | Purpose |
|------|---------|
| `templateRenderer.service.js` | Template lookup + {{variable}} interpolation |
| `preferenceEvaluator.service.js` | Preference cascade with mute/frequency/quiet hours |
| `deliveryOrchestrator.service.js` | in_app → inbox; external → delivery attempts |
| `trace.service.js` | Pipeline tracing: timeline, summaries, export, formatting |

### src/controller/ (4 files)
| File | Purpose |
|------|---------|
| `publishEvent.controller.js` | Full pipeline orchestration |
| `getInbox.controller.js` | Paginated inbox with parallel hydration |
| `inboxState.controller.js` | markSeen, markRead, dismiss, archive |
| `countUnread.controller.js` | Count unseen items |

### src/adapters/ (1 file)
| File | Purpose |
|------|---------|
| `index.js` | Public API surface — all external exports |

## Changes Since Previous Version

N/A — this is V1.

## Debug Notes

- Inject `createPipelineTracer()` as `debugReporter` for structured pipeline traces
- All 51 trace points across 15 files feed into timeline collection
- `formatPipelineTrace()` produces human-readable output
- `exportTraceSnapshot()` produces full JSON for external analysis
- 12 engine events available via `onNotificationEvent()`

## Verification Notes

- `npx vite build --mode development` passes clean
- All DALs query `notification` schema only (verified)
- No imports from apps/ or other engines (verified)
- Public API via adapters/index.js only (verified)
- DI pattern matches reviews/chat engine conventions (verified)
- `@notifications` Vite alias registered in apps/VCSM/vite.config.js
- Engine not yet wired into VCSM app (Slice 4 pending)

## Known Layer Violations

Two controllers contain `.from()` calls that should be in DAL:
- `countUnread.controller.js` — queries `recipients` and `inbox_items` directly
- `getInbox.controller.js` — queries `events` directly

These should be extracted to DAL functions in a future pass.

## Related Logan Docs

Canonical System Doc:
`/Users/vcsm/Desktop/VCSM/logan/engines/engines.notifications.engine-architecture.md`

Supporting Docs:
- `/Users/vcsm/Desktop/VCSM/logan/vcsm/notifications/vcsm.notifications.engine-extraction-plan.md`
- `/Users/vcsm/Desktop/VCSM/logan/vcsm/notifications/vcsm.notifications.pipeline.md`
