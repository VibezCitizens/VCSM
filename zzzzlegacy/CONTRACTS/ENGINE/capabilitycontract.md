Capability Contract
Capability Contract (Locked)

This contract defines how reusable engines expose capabilities and how other engines or apps may consume them.

A capability is a stable domain service provided by an engine.

Examples:

chat
notifications
search
analytics
payments
moderation

The goal of this contract is to ensure that engines can collaborate without depending on each other’s internals.

Core Rule

Engines may interact only through published capabilities.

Engines must never import another engine’s internal files.

Allowed:

apps → engine adapters
engines → shared contracts
engines → capability interfaces

Forbidden:

engines/chat/controller → engines/notifications/controller
engines/search/dal → engines/chat/dal
engines/payments/model → engines/analytics/hooks
Capability Definition

A capability is the public surface of an engine.

It may include:

public functions
public hooks
event subscriptions
event emissions
typed payload contracts

A capability must be:

explicit
versionable
documented
app-agnostic
Capability Location Rule

Each engine must expose its public capability surface through:

engines/<engine-name>/src/adapters/

Only adapters may be consumed externally.

Example:

engines/chat/src/adapters/chat.adapter.ts
engines/notifications/src/adapters/notifications.adapter.ts
engines/search/src/adapters/search.adapter.ts
Capability Import Rule

Apps and engines may only import another engine through its adapter.

Allowed:

import { sendMessage } from '@/engines/chat'
import { createNotification } from '@/engines/notifications'

Forbidden:

import { sendMessageController } from '@/engines/chat/src/controller/sendMessage.controller'
import { notificationDal } from '@/engines/notifications/src/dal/notificationWrites.dal'
Engine-to-Engine Communication Rule

Engine-to-engine communication must happen in one of only two ways:

1. Capability Calls

One engine consumes another engine’s public adapter.

Use this only for synchronous, direct, low-risk interactions.

Example:

moderation engine asks notifications engine to notify moderators
payments engine asks analytics engine to track purchase completion
2. Domain Events

One engine emits events and other engines subscribe.

Use this for decoupled, asynchronous, fan-out interactions.

Example:

chat emits message.sent
notifications listens and creates a user notification
analytics listens and records engagement
search listens and updates indexing
Preferred Rule

Prefer events over direct engine-to-engine capability calls when more than one downstream consumer may exist.

Reason:
events reduce direct dependency chains.

Use direct capability calls only when:

the interaction is required immediately
the result is needed synchronously
no fan-out is expected
failure must be handled inline
Capability Output Rule

Capabilities must return domain-safe outputs.

Capabilities must never return:

raw DB rows
DAL objects
internal model artifacts
engine-private flags

Capabilities may return:

domain objects
result envelopes
permission snapshots
event confirmations
Capability Input Rule

Capabilities must accept stable domain inputs.

Capabilities must not require:

UI objects
route objects
framework-specific screen props
engine-internal database row types

Capabilities should accept:

actorId
entityId
typed input payloads
domain command objects
Event Contract Rule

Every event emitted by an engine must have:

event name
version
timestamp
source engine
payload

Standard event envelope:

{
  eventName,
  version,
  occurredAt,
  source,
  payload
}

Example:

{
  eventName: "message.sent",
  version: 1,
  occurredAt: "...",
  source: "chat",
  payload: {
    conversationId,
    messageId,
    senderActorId
  }
}
Event Naming Rule

Events must use stable domain language.

Format:

<noun>.<past-tense-action>

Examples:

conversation.created
message.sent
message.edited
message.deleted
notification.created
report.submitted
payment.completed

Avoid vague names like:

chat.updated
message.changed
data.saved
Capability Versioning Rule

Public capability surfaces must be version-safe.

Breaking changes require:

a version bump
migration notes
explicit update path

Engines must not break consuming apps silently.

Anti-Corruption Rule

If one engine needs another engine’s data shape, it must consume the public capability contract, not replicate internal assumptions.

If shape translation is needed, create a translator at the boundary.

This prevents internal coupling.

Notification Example

Correct pattern:

chat engine emits message.sent
notifications engine listens
notifications engine decides whether to create a notification

Wrong pattern:

chat controller directly imports notifications DAL
chat controller inserts notification rows itself

Reason:
chat must not own notification persistence.

Search Example

Correct pattern:

chat engine emits message.sent
search engine listens
search engine updates searchable index

Wrong pattern:

chat DAL writes into search tables

Reason:
chat must not own search indexing logic.

Analytics Example

Correct pattern:

chat emits conversation.read
analytics listens
analytics records event

Wrong pattern:

chat controller imports analytics controller

Reason:
analytics should remain optional and decoupled.

Capability Ownership Rule

The engine that owns a capability is the sole authority on that domain.

Examples:

chat owns message lifecycle
notifications owns notification lifecycle
search owns indexing lifecycle
analytics owns metric/event lifecycle

No other engine may mutate another engine’s domain state directly except through its published capability.

Failure Rule

A consuming engine must gracefully handle capability failure.

If engine A consumes engine B:

engine A must not assume engine B is always available
engine A must handle errors explicitly
engine A must not leak engine B failure details into unrelated layers

For event-driven integrations:

event subscribers must be retry-safe
event publishers must not block core domain completion unless explicitly required
Capability Registry Rule

Each engine should document its public capability surface in one place.

Example:

engines/chat/src/adapters/chat.adapter.ts
engines/notifications/src/adapters/notifications.adapter.ts

And optionally a capability summary file:

engines/chat/CAPABILITY.md
engines/notifications/CAPABILITY.md

This allows apps and other engines to understand what is safe to consume.

Platform-Wide Principle
Engines collaborate through contracts, not assumptions.
Events decouple.
Adapters protect.
Ownership stays singular.
Example Engine Collaboration Map
apps
  ├─ vibez-web → chat
  ├─ vibez-web → notifications
  ├─ wentrex-web → chat
  └─ wentrex-web → search

chat
  ├─ emits message.sent
  ├─ emits conversation.created
  └─ may consume moderation capability

notifications
  └─ listens to chat events

analytics
  └─ listens to chat + notifications + payments events

search
  └─ listens to chat and content events

No engine imports another engine’s internals.