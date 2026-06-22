# Layer Responsibilities
## Platform Architecture Contract — Apps, Engines, and Shared (Locked)

> **Source:** [platformcontract.md](platformcontract.md)
> **Status:** Locked — no changes without explicit contract revision
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [01-platform-structure.md](01-platform-structure.md)
> **Reads Before:** [03-dependency-rules.md](03-dependency-rules.md)
> **Cross-Links:** [04-engine-architecture.md](04-engine-architecture.md), [05-app-architecture.md](05-app-architecture.md)

---

## Layer Definitions

### Apps Layer

Location:

```
apps/<app-name>
```

Apps represent end-user products.

Examples:

```
apps/vibez-web
apps/wentrex-web
apps/vibez-ios
```

Apps are responsible for:

- routing
- layouts
- branding
- product-specific UI
- feature composition
- policy adapters
- user experience flows

Apps consume engines.

Apps must not depend on other apps.

---

### Engines Layer

Location:

```
engines/<engine-name>
```

Engines provide reusable domain capabilities.

Examples:

```
engines/chat
engines/notifications
engines/search
engines/payments
```

Engines are application-agnostic modules that provide business capabilities.

Examples of responsibilities:

- chat conversations
- notifications
- search indexing
- payment processing
- analytics

Engines must not contain product-specific logic.

Engines are consumed by apps.

---

### Shared Layer

Location:

```
shared/<module-name>
```

Shared modules provide domain-neutral primitives.

Examples:

```
shared/core
shared/ui
shared/utils
```

Shared modules contain:

- types
- utilities
- generic UI primitives
- shared infrastructure helpers

Shared modules must never depend on apps or engines.
