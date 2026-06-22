# Platform Principles
## Platform Architecture Contract — Events, Ownership, Scaling, Enforcement (Locked)

> **Source:** [platformcontract.md](platformcontract.md)
> **Status:** Locked — no changes without explicit contract revision
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [05-app-architecture.md](05-app-architecture.md)
> **Cross-Links:** [01-platform-structure.md](01-platform-structure.md), [03-dependency-rules.md](03-dependency-rules.md), [04-engine-architecture.md](04-engine-architecture.md)

---

## Platform Event Model

Engines may emit domain events.

Examples:

```
message.sent
conversation.created
notification.created
payment.completed
```

Apps may subscribe to engine events.

Apps must not emit engine-level domain events.

---

## Platform Ownership Model

Responsibility separation:

```
Apps    → experiences
Engines → capabilities
Shared  → primitives
```

No layer may assume responsibility of another layer.

---

## Platform Scaling Model

New apps must follow the same structure.

Example:

```
apps/
  vibez-web
  wentrex-web
  vibez-ios
  vibez-admin

engines/
  chat
  notifications
  search
  payments
```

This ensures capabilities are reused rather than duplicated.

---

## Enforcement Rule

Any code violating this contract must be refactored.

Architectural boundaries must remain visible in the filesystem.

A developer should understand the entire system by reading the directory tree.

---

## Platform Principle

- Structure prevents chaos.
- Boundaries enable scale.
- Capabilities outlive products.
