# Engine Responsibilities
## Engine Architecture Contract — What Engines Own and Must Not Contain (Locked)

> **Source:** [../enginecontract.md](../enginecontract.md)
> **Status:** Locked
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [01-engine-definition.md](01-engine-definition.md)
> **Reads Before:** [03-engine-layer-contracts.md](03-engine-layer-contracts.md)
> **Cross-Links:** [06-engine-isolation-versioning.md](06-engine-isolation-versioning.md)

---

## Engine Dependency Direction

Dependency direction must always be:

```
apps → engines → shared
```

Never:

```
engines → apps
shared → engines
```

Engines must remain independent of application logic.

---

## Engine Responsibilities

Engines own reusable domain logic.

Examples for a chat engine:

- conversations
- members
- messages
- attachments
- receipts
- unread counts
- permissions

Engines must implement domain behavior but must not implement product behavior.

---

## Engine Must Not Contain

Engines must never contain:

- routing
- page layouts
- app navigation
- authentication providers
- branding
- app UI themes
- feature flags from specific apps
- business rules specific to a single app

These belong inside apps.
