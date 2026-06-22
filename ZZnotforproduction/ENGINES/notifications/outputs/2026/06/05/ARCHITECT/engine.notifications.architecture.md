# MODULE ARCHITECTURE REPORT

**Module:** engines/notifications
**Application Scope:** VCSM + ENGINE
**Module Type:** Shared Domain Engine — Notification Publish, Delivery & Inbox
**Primary Root:** /Users/vcsm/Desktop/VCSM/engines/notifications/
**ARCHITECT Run Date:** 2026-06-05
**Ticket:** TICKET-ARCHITECT-MISSING-0001

---

## PURPOSE

The notifications engine owns the full notification lifecycle:

```
Event Published
  → Recipient Resolution (injected or explicit)
  → Preference Evaluation (cascade: specific → general → allow)
  → Channel Expansion (per event type's supported channels)
  → Recipient Row Insert
  → Template Render + Persist
  → Delivery per Channel
      in_app  → insert_inbox_item RPC + mark delivered
      email/sms/push/webhook → delivery_attempt record (STUB — no real provider)
```

---

## OWNERSHIP

**Engine Owner:** Platform team
**App Scope:** VCSM only (no Wentrex consumer found)
**DI configured by:** `apps/VCSM/src/features/notifications/setup.js`

---

## ENTRY POINTS

**Public API:** `engines/notifications/index.js` → `src/adapters/index.js`
**Alias:** `@notifications` (used in setup.js: `import { configureNotificationsEngine } from '@notifications'`)

**Exported surface (32 symbols):**

Controllers:
- `publishEvent`, `getInboxNotifications`
- `markSeen`, `markRead`, `dismiss`, `archive`
- `countUnread`, `invalidateCountUnreadCache`

Services (direct access):
- `evaluatePreference`, `renderNotification`, `deliverToRecipient`

Observability (trace.service.js):
- `createPipelineTracer`, `getPipelineTraces`, `getPipelineSummaries`
- `getLatestPipeline`, `clearPipelineTraces`, `subscribePipelineTraces`
- `exportTraceSnapshot`, `formatPipelineTrace`

Config:
- `configureNotificationsEngine`

Events:
- `EVENTS`, `onNotificationEvent`, `emit`

Models (public contract shapes):
- `EventModel`, `RecipientModel`, `InboxItemModel`, `RenderedModel`
- `TemplateModel`, `PreferenceModel`, `DeliveryAttemptModel`

---

## LAYER MAP

```
config.js             — DI (supabaseClient, resolveRecipients, resolveActorCard, debugReporter)
events.js             — in-process event emitter + 12 event constants
types/index.js        — JSDoc typedefs (no runtime code)

dal/ (10 files):
  events.read.dal.js        — notification.events (read)
  events.write.dal.js       — notification.events (write via create_event RPC)
  eventTypes.read.dal.js    — notification.event_types, notification.event_categories
  recipients.read.dal.js    — notification.recipients (read)
  recipients.write.dal.js   — notification.recipients (write)
  rendered.write.dal.js     — notification.rendered (upsert + batch read)
  inbox.read.dal.js         — notification.recipients + notification.inbox_items (read)
  inbox.write.dal.js        — notification.inbox_items (write, via insert_inbox_item RPC)
  deliveryAttempts.write.dal.js — notification.delivery_attempts (write)
  preferences.read.dal.js   — notification.preferences (read)
  templates.read.dal.js     — notification.templates (read)

model/ (7 files — pure row mappers):
  Event.model.js
  InboxItem.model.js
  Recipient.model.js
  Rendered.model.js
  Template.model.js
  Preference.model.js
  DeliveryAttempt.model.js

services/ (4 files):
  deliveryOrchestrator.service.js — in_app + external channel dispatch
  preferenceEvaluator.service.js  — 3-level preference cascade (specific → general → allow)
  templateRenderer.service.js     — template lookup + {{var}} interpolation
  trace.service.js                — pipeline trace capture + export (8 functions)

controller/ (4 files):
  publishEvent.controller.js      — full 8-step publish pipeline
  getInbox.controller.js          — paginated inbox fetch + auto-markSeen
  inboxState.controller.js        — markSeen, markRead, dismiss, archive
  countUnread.controller.js       — count unseen + 5s cache + inflight dedup

adapters/index.js     — public API surface (32 exported symbols)
```

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|------|--------|----------|----------------|
| Purpose defined | PASS | CLAUDE.md, adapter header | — |
| Owner defined | PASS | VCSM setup.js, CLAUDE.md | — |
| Entry points mapped | PASS | adapters/index.js, 32 symbols | — |
| Controllers present | PASS | 4 controllers cover all use cases | — |
| DAL/repository present | PASS | 10 DAL files, notification schema exclusively | — |
| Models/transformers present | PASS | 7 model files | — |
| Services present | PASS | 4 services (delivery, preference, render, trace) | — |
| Hooks/view models present | N/A | Engine is framework-agnostic | hooks in apps/ |
| Screens/components present | N/A | Framework-agnostic | — |
| Database objects mapped | PASS | 9 tables per CLAUDE.md + 2 RPCs (create_event, insert_inbox_item) confirmed in DAL | — |
| Authorization path mapped | PARTIAL | Self-notification prevention in VCSM publish.js (app layer). No actor auth inside engine. | Engine trusts callers. No actor ownership check inside engine. |
| Cache/runtime behavior mapped | PASS | countUnread: 5s cache + inflight dedup Map; getInboxNotifications: autoMarkSeen default true | Process-scoped |
| Error/loading/empty states mapped | PARTIAL | Throws on DB errors; delivery errors collected as string array but pipeline continues | No retry logic for delivery failures |
| Documentation linked | PARTIAL | CLAUDE.md comprehensive; no BEHAVIOR.md or SECURITY.md | BEHAVIOR_CONTRACT_ABSENT |
| Tests/validation noted | PARTIAL | No test files found in engine directory | Full test gap |
| Native parity noted | N/A | Notifications are platform-level | — |
| Engine dependencies mapped | N/A | This IS an engine. Internally independent. | VCSM setup.js uses @hydration engine — cross-engine in app layer |

---

## DEPENDENCY INJECTION — APP CUSTOMIZATION POINTS

| Injection Point | Required | VCSM Value | Notes |
|----------------|----------|------------|-------|
| supabaseClient | REQUIRED | `supabase` (VCSM default client) | All notification.* schema queries |
| resolveRecipients | OPTIONAL | NOT INJECTED in VCSM | Explicit recipients always passed via publish.js adapter |
| resolveActorCard | OPTIONAL | `resolveActorCard` → @hydration engine | Actor display enrichment for rendered content |
| debugReporter | OPTIONAL | NOT INJECTED in VCSM | No debug output |

**No freeze guard:** `configureNotificationsEngine()` merges config on each call (`{ ..._config, ...config }`). No protection against rogue re-calls. Same gap as identity engine.

**CROSS-ENGINE DEPENDENCY (app layer):** VCSM's `resolveActorCard` injector calls `hydrateAndReturnSummaries` from `@hydration` engine. This is legal (app layer, not engine-to-engine), but it means the notifications engine's render path indirectly depends on the hydration engine in VCSM. If hydration fails, the actor card falls back to null and rendering proceeds without enrichment (try/catch in setup.js).

---

## PUBLISH PIPELINE — 8 STEPS

```
publishEvent({ event, recipients, renderContext, skipPreferences })
│
├─ Step 1: Validate event type (dalGetEventType)
│     → WARN if not found; pipeline continues (ad-hoc events allowed)
│
├─ Step 2: Insert event (dalInsertEvent → RPC: create_event)
│     → event ID returned from RPC
│     → Emits: EVENT_PUBLISHED
│
├─ Step 3: Resolve recipients
│     → Use explicit `recipients[]` param if provided
│     → Else: call injected resolveRecipients(event) if available
│     → If still 0 recipients: return early { recipientCount: 0 }
│
├─ Step 4: Expand by supported channels
│     → getSupportedChannels(eventType) from event type flags
│     → If recipient has no channel: one entry per supported channel
│     → Fallback: ['in_app'] if no event type found
│
├─ Step 5: Evaluate preferences (per expanded recipient, parallel)
│     → evaluatePreference: specific pref → general pref → allow
│     → Filter out disallowed recipients
│     → Emits: PREFERENCES_EVALUATED
│
├─ Step 6: Insert recipient rows (dalInsertRecipients)
│
└─ Step 7-8: For each recipient row:
      → renderNotification (template lookup + {{var}} interpolation)
      → dalUpsertRendered (persist rendered content)
      → Emits: RENDERED
      → deliverToRecipient:
            in_app → insert_inbox_item RPC + mark delivered → Emits: INBOX_ITEM_CREATED, DELIVERY_SUCCEEDED
            external → delivery_attempt record (queued→sent placeholder) + mark delivered
      → Errors collected; pipeline continues for other recipients
```

---

## DB SCHEMA: notification (exclusively)

All queries use `.schema('notification')` on supabaseClient.
No vc, vport, learning, or platform schema queries inside the engine itself.

### Tables Accessed

| Table | Access | DAL File | Notes |
|-------|--------|----------|-------|
| notification.events | READ/WRITE | events.read.dal.js, events.write.dal.js | WRITE via create_event RPC (not direct INSERT) |
| notification.event_types | READ | eventTypes.read.dal.js | — |
| notification.event_categories | READ | eventTypes.read.dal.js | — |
| notification.recipients | READ/WRITE | recipients.read.dal.js, recipients.write.dal.js, inbox.read.dal.js, countUnread controller | — |
| notification.rendered | READ/WRITE | rendered.write.dal.js (both read and write — naming mismatch) | — |
| notification.inbox_items | READ/WRITE | inbox.read.dal.js, inbox.write.dal.js | WRITE via insert_inbox_item RPC |
| notification.delivery_attempts | WRITE | deliveryAttempts.write.dal.js | — |
| notification.preferences | READ | preferences.read.dal.js | — |
| notification.templates | READ | templates.read.dal.js | — |

### Database RPCs (via supabase.rpc)

| RPC | DAL File | Purpose |
|-----|----------|---------|
| notification.create_event | events.write.dal.js | Atomically insert event with server validation |
| notification.insert_inbox_item | inbox.write.dal.js | Insert inbox item for recipient |

---

## DATABASE READ MAP

| Table | Function | Filter | Pattern | Called From |
|-------|----------|--------|---------|-------------|
| notification.event_types | dalGetEventType | eq(event_key) | point lookup | publishEvent (step 1) |
| notification.events | dalGetEventType (inline in getInbox.controller) | in(id[]) | batch | getInboxNotifications step 2 |
| notification.recipients | dalListInboxRecipients | eq(recipient_actor_id), eq(delivery_channel=in_app), eq(status=delivered), cursor | list+cursor | getInboxNotifications |
| notification.recipients | (inline in countUnread controller) | eq(recipient_actor_id), eq(delivery_channel=in_app), eq(status=delivered) | list (ids only) | countUnread |
| notification.inbox_items | dalGetInboxItemsByRecipientIds | in(recipient_id[]) | batch | getInboxNotifications |
| notification.inbox_items | (inline in countUnread controller) | in(recipient_id[]), eq(is_seen=false), eq(is_dismissed=false), is(archived_at=null) | count | countUnread |
| notification.rendered | dalGetRenderedByRecipientIds | in(recipient_id[]) | batch | getInboxNotifications |
| notification.preferences | dalGetPreference | eq(owner_actor_id), eq(event_key), eq(channel) | point lookup | evaluatePreference (2 calls: specific + general) |
| notification.templates | dalFindTemplate | eq(event_key), eq(channel), eq(locale) | point lookup | renderNotification |

---

## DAL ANOMALIES

### DAL-NOTIFY-001: dalCountUnseenInbox is broken — actor filter missing

**File:** `engines/notifications/src/dal/inbox.read.dal.js`
**Function:** `dalCountUnseenInbox`
**Issue:** The function signature accepts `recipientActorId` and filters `recipients` table in the first query block, but then switches to directly querying `inbox_items` WITHOUT filtering by actor. The comment in the code explicitly acknowledges: "Filter by actor: we need to join through recipients." The query counts ALL unseen inbox_items globally, not just for the given actor.
**Severity:** HIGH (if called directly this function returns wrong data)
**Mitigation:** `countUnread.controller.js` does NOT use this DAL function — the controller does its own correct 2-step query. `dalCountUnseenInbox` appears to be dead code. But it is a public function in a DAL file.
**Action:** Remove `dalCountUnseenInbox` or fix the implementation to match the controller's correct 2-step pattern.

### DAL-NOTIFY-002: rendered.write.dal.js contains both read and write operations

**File:** `engines/notifications/src/dal/rendered.write.dal.js`
**Functions:** `dalUpsertRendered` (write) + `dalGetRenderedByRecipientIds` (read)
**Issue:** A file named `*.write.dal.js` exports a read function. Both `getInbox.controller.js` and `rendered.write.dal.js` contain read queries. Naming convention violation — could be imported by mistake from the wrong DAL file.
**Severity:** LOW (functional, but violates convention)

---

## GETINBOX MULTI-QUERY PATTERN

```
getInboxNotifications({ recipientActorId, cursor, limit, autoMarkSeen })
│
├─ Query 1: dalListInboxRecipients (recipients table, filtered by actor + in_app + delivered)
│     → cursor-based pagination (created_at < cursor)
│
├─ Parallel Queries (Promise.all):
│   ├─ Query 2: fetchEventsByIds (inline — events table, batched by event_id)
│   ├─ Query 3: dalGetRenderedByRecipientIds (rendered table, batched by recipient_id)
│   └─ Query 4: dalGetInboxItemsByRecipientIds (inbox_items table, batched by recipient_id)
│
├─ Map composition (in-memory join)
│
└─ Auto-markSeen: dalMarkInboxSeen (inbox_items UPDATE, batched)
   → invalidateCountUnreadCache(recipientActorId)
   → Emits: INBOX_MARKED_SEEN
```

Total DB queries on getInboxNotifications: 4 (+ 1 conditional markSeen write).

---

## CACHE BEHAVIOR

| Location | Type | TTL | Key | Invalidation |
|----------|------|-----|-----|-------------|
| countUnread | In-memory Map (process-scoped) | 5 seconds | actorId:domain | invalidateCountUnreadCache(actorId) — called by markSeen, markRead, dismiss, archive |
| countUnread inflight dedup | In-memory Map | Duration of request | actorId:domain | Removed on promise settle |

**Risk:** Same process-scope caveat as identity engine — not shared across instances.

---

## DOMAIN EVENTS

| Event | Emitted When |
|-------|-------------|
| EVENT_PUBLISHED | Event row inserted |
| RECIPIENTS_RESOLVED | Expanded recipients counted |
| PREFERENCES_EVALUATED | Preference filter applied |
| RENDERED | Rendered content persisted for recipient |
| DELIVERY_ATTEMPTED | External channel delivery attempt created |
| DELIVERY_SUCCEEDED | Delivery successful |
| DELIVERY_FAILED | Delivery failed (error collected, pipeline continues) |
| INBOX_ITEM_CREATED | in_app inbox item created |
| INBOX_MARKED_SEEN | Items marked seen |
| INBOX_MARKED_READ | Item marked read |
| INBOX_DISMISSED | Item dismissed |
| INBOX_ARCHIVED | Item archived |

---

## DELIVERY CHANNEL STATUS

| Channel | Status | Implementation |
|---------|--------|----------------|
| in_app | IMPLEMENTED | insert_inbox_item RPC + mark recipient delivered |
| email | STUB | Creates delivery_attempt row (queued→sent), NO real provider |
| sms | STUB | Same as email |
| push | STUB | Same as email |
| webhook | STUB | Same as email |

**Note:** External channel delivery_attempt rows are immediately marked "sent" (placeholder). A real provider integration would need a delivery worker that processes these records. This is an incomplete architecture that will silently mark external deliveries as "delivered" with no actual delivery occurring.

---

## VCSM CONSUMER PATTERN

VCSM does NOT use `publishEvent` directly. It uses an app-level adapter:
`apps/VCSM/src/features/notifications/publish.js`

### publishVcsmNotification (single recipient)
- Hardcodes: `sourceDomain: 'vc'`, `recipientDomain: 'vc'`, `deliveryChannel: 'in_app'`
- Self-notification guard: `actorId === recipientActorId → return false` (app layer)
- Fire-and-forget error handling: swallows errors in production, logs in DEV
- Hardcodes `visibility: undefined` (defaults to 'private' in engine)

### publishVcsmNotificationBatch (multiple recipients)
- Same as single but accepts `recipientActorIds[]`
- Filters self-notifications from the array before calling publishEvent

**OBSERVATION:** ALL VCSM notifications are forced to `in_app` via hardcoded `deliveryChannel`. Email/SMS/push are not used in the current VCSM implementation, despite being defined in the engine.

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|------------|------|-----------|-------------------|-------|
| @supabase/supabase-js | external | ENGINE ← DI | YES | injected via configureNotificationsEngine |
| VCSM: features/notifications/setup.js | app config | APP → ENGINE | YES | DI wiring |
| VCSM: features/notifications/publish.js | app adapter | APP → ENGINE | YES | publishEvent consumer |
| VCSM: features/notifications/inbox/ | app consumer | APP → ENGINE | YES | getInboxNotifications, countUnread |
| @hydration | cross-engine via app | APP-LAYER | YES | VCSM resolveActorCard injector calls hydrateAndReturnSummaries |
| engines/identity | cross-engine | NONE | N/A | — |
| engines/booking | cross-engine | NONE (booking calls publishVcsmNotification, not the engine directly) | N/A | — |

---

## SECURITY SURFACE

| Surface | Risk | Note |
|---------|------|------|
| No actor authorization inside engine | MEDIUM | Engine trusts caller to supply correct recipientActorId. No ownership check inside publishEvent or getInboxNotifications. Self-notification prevention is in the app adapter (publish.js), not the engine. |
| No DI freeze guard | MEDIUM | configureNotificationsEngine() merges on every call — rogue re-call can swap supabaseClient |
| External delivery stub silently succeeds | HIGH | email/sms/push/webhook channels create delivery_attempt records and immediately mark them "sent" + recipient "delivered" — callers and UI will see successful delivery for notifications that were never actually sent |
| resolveRecipients injector unchecked | LOW | If injected, output is not validated (same pattern as identity resolveAppContext) |
| Delivery error collection, not abort | LOW | One recipient's render/delivery failure does not abort others — errors array returned but callers may ignore |
| dalCountUnseenInbox broken | HIGH | If called directly, returns wrong count for any actor (counts ALL globally unseen items). Currently dead code — countUnread controller bypasses it. Must be fixed or removed. |

---

## BEHAVIOR CONSISTENCY CHECK — engines/notifications

```
Behavior Consistency Check — engines/notifications
====================================================
BEHAVIOR.md present: NO
Status: MISSING

Check A (Source without behavior): FINDING
  → 4 controllers, 4 services, 10 DAL files exist with no BEHAVIOR.md
  → Severity: P0 (push and inbox are user-facing; delivery correctness critical)

Check B (Behavior without source): SKIPPED — no BEHAVIOR.md
Check C (§13 engine consistency): SKIPPED — no BEHAVIOR.md
Check D (§6 data change consistency): SKIPPED — no BEHAVIOR.md
```

---

## MODULE COMPLETENESS GAPS

| Gap | Severity | Detail | Recommended Owner |
|-----|----------|--------|-------------------|
| External delivery is a stub | CRITICAL | email/sms/push/webhook silently "succeed" — no real delivery | WOLVERINE |
| dalCountUnseenInbox broken/dead | HIGH | Queries all inbox_items globally, ignores actorId filter | WOLVERINE or CARNAGE |
| BEHAVIOR.md missing | CRITICAL | Blue Team blocked; delivery pipeline correctness undocumented | WOLVERINE |
| SECURITY.md missing | HIGH | VENOM/ELEKTRA blocked; actor trust gap undocumented | VENOM after BEHAVIOR |
| No DI freeze guard | MEDIUM | Config mutable post-startup | WOLVERINE |
| No tests | HIGH | Notification pipeline is fire-and-forget — no test coverage anywhere | SPIDER-MAN |
| Self-notification guard in app layer only | MEDIUM | Engine doesn't prevent self-notify — relies on app adapter | WOLVERINE |
| Observability surface very wide | LOW | 8 trace functions exported — trace.service.js scope not documented | LOGAN |

---

## MODULE INDEPENDENCE STATUS

```
MODULE INDEPENDENCE STATUS
Module: engines/notifications
Classification: INDEPENDENT
Reason: Clean DI boundary; no app imports; no cross-engine imports within engine itself.
  notification schema exclusively. Two RPCs for atomic operations (create_event, insert_inbox_item).
  App-layer dependency on hydration engine is in the VCSM setup.js injector — not inside the engine.
Blocking gaps:
  - No BEHAVIOR.md → Blue Team blocked
  - No SECURITY.md → VENOM/ELEKTRA blocked
  - External delivery channels are stubs → functional gap
  - dalCountUnseenInbox is broken dead code → must be fixed or removed
  - No tests → zero confidence in delivery pipeline correctness
```

---

## RECOMMENDED HANDOFFS

- **WOLVERINE** — BEHAVIOR.md intake; fix or remove dalCountUnseenInbox; DI freeze guard; self-notification guard in engine
- **CARNAGE** — DB schema review: fix delivery_attempt placeholder "sent" flow; external channel architecture decision
- **VENOM** — Security review after BEHAVIOR.md: actor trust boundary, delivery stub success masquerade
- **ELEKTRA** — DI freeze guard (ELEK-007 pattern); resolve actor card injector validation
- **SPIDER-MAN** — publishEvent pipeline tests; evaluatePreference cascade tests; getInboxNotifications pagination tests
- **LOKI** — Runtime trace: publish pipeline timing; countUnread cache hit/miss behavior; delivery attempt flow
- **IRONMAN** — Confirm VCSM-only scope; external channel roadmap ownership
- **LOGAN** — BEHAVIOR.md, SECURITY.md, CURRENT_STATUS.md governance artifacts
