# Dependency Rules
## Platform Architecture Contract — Dependency Direction and Isolation (Locked)

> **Source:** [platformcontract.md](platformcontract.md)
> **Status:** Locked — no changes without explicit contract revision
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [02-layer-responsibilities.md](02-layer-responsibilities.md)
> **Cross-Links:** [04-engine-architecture.md](04-engine-architecture.md), [06-platform-principles.md](06-platform-principles.md)

---

## Dependency Direction Rule

Dependencies must always flow downward.

Allowed:

```
apps → engines → shared
```

Forbidden:

```
engines → apps
shared → engines
apps → apps
```

The platform must remain a Directed Acyclic Graph (DAG).

---

## Isolation Rules

### App Isolation Rule

Apps must be fully independent.

An app must never import code from another app.

Forbidden:

```
apps/wentrex → apps/vibez
```

Shared capabilities must be extracted into engines.

### Engine Isolation Rule

Engines must be reusable.

An engine must not depend on any specific app.

If an engine imports from an app, the architecture is invalid.

### Shared Isolation Rule

Shared modules must remain domain-neutral.

Shared modules must not contain:

- product logic
- engine orchestration
- business rules

If shared logic becomes domain-specific, it belongs in an engine.
