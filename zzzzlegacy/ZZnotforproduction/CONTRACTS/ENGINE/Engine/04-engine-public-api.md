# Engine Public API
## Engine Architecture Contract — Adapter Contract and Public API (Locked)

> **Source:** [../enginecontract.md](../enginecontract.md)
> **Status:** Locked
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [03-engine-layer-contracts.md](03-engine-layer-contracts.md)
> **Reads Before:** [05-engine-permissions-events.md](05-engine-permissions-events.md)
> **Cross-Links:** [../../Capability/01-capability-definition.md](../Capability/01-capability-definition.md) (adapters = capability surface)

---

## Adapter Contract

Adapters define the public API of the engine.

Adapters may export:

- hooks
- public functions
- domain types

Adapters must never export:

- DAL
- controllers
- models

Apps must import engines only through adapters.

Example:

```js
import { useInbox } from '@/engines/chat'
```

Forbidden:

```js
import { sendMessage } from '@/engines/chat/controller/sendMessage.controller'
```

---

## Engine Public API

Engines must expose a stable public API.

Example for chat:

```
useInbox
useConversation
useMessages

createConversation
sendMessage
editMessage
deleteMessage
markConversationRead
getUnreadCount
```

Apps must rely only on this API.
