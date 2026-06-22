# Engine Isolation and Versioning
## Engine Architecture Contract — Isolation Rule, Versioning, Core Principle (Locked)

> **Source:** [../enginecontract.md](../enginecontract.md)
> **Status:** Locked
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [05-engine-permissions-events.md](05-engine-permissions-events.md)
> **Cross-Links:** [02-engine-responsibilities.md](02-engine-responsibilities.md) (dependency direction enforces isolation)

---

## Engine Versioning

Engines must maintain backward-compatible APIs.

Breaking changes must be versioned.

Apps must not depend on internal engine structure.

---

## Engine Isolation Rule

Engines must be independently testable.

An engine must be able to run without any app.

If an engine cannot run without an app, the architecture is invalid.

---

## Core Principle

Apps provide experiences.
Engines provide capabilities.
Shared provides primitives.
