Engine Contract
Engine Architecture Contract (Locked)

This contract defines how reusable engines are built and consumed in the platform.

Engines provide shared domain capabilities that can be used by multiple apps without coupling those apps together.

Examples of engines:

chat
notifications
search
payments
analytics

Engines must remain application-agnostic, deterministic, and reusable.

Apps consume engines.

Engines must never depend on apps.

Engine Location Rule

All engines must live inside:

/engines/<engine-name>

Example:

engines/chat
engines/notifications
engines/search

Each engine is an isolated module.

Apps may import engines.

Engines must never import apps.

Engine Dependency Direction

Dependency direction must always be:

apps → engines → shared

Never:

engines → apps
shared → engines

Engines must remain independent of application logic.

Engine Responsibilities

Engines own reusable domain logic.

Examples for a chat engine:

conversations
members
messages
attachments
receipts
unread counts
permissions

Engines must implement domain behavior but must not implement product behavior.

Engine Must Not Contain

Engines must never contain:

routing
page layouts
app navigation
authentication providers
branding
app UI themes
feature flags from specific apps
business rules specific to a single app

These belong inside apps.

Engine Must Be Headless

Engines must be usable by multiple platforms.

Example consumers:

web apps
mobile apps
admin dashboards
background workers

Therefore engines must prioritize domain logic and contracts, not UI.

Engine Folder Structure

Each engine must follow this internal structure:

src/
  adapters/
  dal/
  model/
  controller/
  hooks/
  types/

Layer order is mandatory:

DAL → Model → Controller → Hooks → Adapters
DAL Contract

Purpose:

DAL is responsible for retrieving and writing data.

DAL files must:

access the database
use explicit column projections
return raw database rows

DAL must never:

enforce permissions
derive domain meaning
call controllers
import hooks or UI
Model Contract

Models translate database rows into domain objects.

Models may:

normalize fields
rename snake_case → camelCase
derive simple flags

Models must never:

call the database
enforce permissions
contain business rules
Controller Contract

Controllers own domain meaning.

Controllers must:

enforce permissions
enforce membership rules
enforce idempotency
coordinate DAL calls
return domain objects

Controllers must never:

import UI
import routing
depend on app features
Hooks Contract

Hooks orchestrate runtime behavior.

Hooks may:

call controllers
manage loading state
subscribe to realtime updates

Hooks must never:

access the database directly
enforce business rules
Adapter Contract

Adapters define the public API of the engine.

Adapters may export:

hooks
public functions
domain types

Adapters must never export:

DAL
controllers
models

Apps must import engines only through adapters.

Example:

import { useInbox } from '@/engines/chat'

Forbidden:

import { sendMessage } from '@/engines/chat/controller/sendMessage.controller'
Engine Public API

Engines must expose a stable public API.

Example for chat:

useInbox
useConversation
useMessages

createConversation
sendMessage
editMessage
deleteMessage
markConversationRead
getUnreadCount

Apps must rely only on this API.

Permission Contract

Engines must return explicit permission snapshots.

Example:

PermissionSnapshot {
  canViewConversation
  canSendMessage
  canEditOwnMessage
  canDeleteOwnMessage
  canManageMembers
  canModerate
}

Apps must not compute permissions themselves.

Event Contract

Engines must emit domain events.

Example:

conversation.created
message.sent
message.edited
message.deleted
conversation.read

Apps may subscribe to these events.

Engine Versioning

Engines must maintain backward-compatible APIs.

Breaking changes must be versioned.

Apps must not depend on internal engine structure.

Engine Isolation Rule

Engines must be independently testable.

An engine must be able to run without any app.

If an engine cannot run without an app, the architecture is invalid.

Example Workspace
VC/
  apps/
    vibez-web/
    wentrex-web/

  engines/
    chat/
    notifications/

  shared/
    core/
    ui/

  contract/
    enginecontract.md
Core Principle
Apps provide experiences.
Engines provide capabilities.
Shared provides primitives.
Result

With this contract you get:

• reusable engines
• clean app boundaries
• safe multi-app architecture
• easier mobile support later
• predictable scaling