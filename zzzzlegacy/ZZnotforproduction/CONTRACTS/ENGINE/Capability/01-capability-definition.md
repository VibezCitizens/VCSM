# Capability Definition
## Capability Contract — What a Capability Is and How to Access One (Locked)

> **Source:** [../capabilitycontract.md](../capabilitycontract.md)
> **Status:** Locked
> **Index:** [INDEX.md](INDEX.md)
> **Reads Before:** [02-engine-communication.md](02-engine-communication.md)
> **Cross-Links:** [../Engine/04-engine-public-api.md](../Engine/04-engine-public-api.md) (adapters = capability surface)

---

This contract defines how reusable engines expose capabilities and how other engines or apps may consume them.

A capability is a stable domain service provided by an engine.

Examples:

- chat
- notifications
- search
- analytics
- payments
- moderation

The goal of this contract is to ensure that engines can collaborate without depending on each other's internals.

---

## Core Rule

Engines may interact only through published capabilities.

Engines must never import another engine's internal files.

Allowed:

```
apps → engine adapters
engines → shared contracts
engines → capability interfaces
```

Forbidden:

```
engines/chat/controller → engines/notifications/controller
engines/search/dal → engines/chat/dal
engines/payments/model → engines/analytics/hooks
```

---

## Capability Definition

A capability is the public surface of an engine.

It may include:

- public functions
- public hooks
- event subscriptions
- event emissions
- typed payload contracts

A capability must be:

- explicit
- versionable
- documented
- app-agnostic

---

## Capability Location Rule

Each engine must expose its public capability surface through:

```
engines/<engine-name>/src/adapters/
```

Only adapters may be consumed externally.

Example:

```
engines/chat/src/adapters/chat.adapter.ts
engines/notifications/src/adapters/notifications.adapter.ts
engines/search/src/adapters/search.adapter.ts
```

---

## Capability Import Rule

Apps and engines may only import another engine through its adapter.

Allowed:

```js
import { sendMessage } from '@/engines/chat'
import { createNotification } from '@/engines/notifications'
```

Forbidden:

```js
import { sendMessageController } from '@/engines/chat/src/controller/sendMessage.controller'
import { notificationDal } from '@/engines/notifications/src/dal/notificationWrites.dal'
```
