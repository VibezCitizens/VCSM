# Engine Definition
## Engine Architecture Contract — What an Engine Is (Locked)

> **Source:** [../enginecontract.md](../enginecontract.md)
> **Status:** Locked
> **Index:** [INDEX.md](INDEX.md)
> **Reads Before:** [02-engine-responsibilities.md](02-engine-responsibilities.md)

---

This contract defines how reusable engines are built and consumed in the platform.

Engines provide shared domain capabilities that can be used by multiple apps without coupling those apps together.

Examples of engines:

- chat
- notifications
- search
- payments
- analytics

Engines must remain application-agnostic, deterministic, and reusable.

Apps consume engines.

Engines must never depend on apps.

---

## Engine Location Rule

All engines must live inside:

```
/engines/<engine-name>
```

Example:

```
engines/chat
engines/notifications
engines/search
```

Each engine is an isolated module.

Apps may import engines.

Engines must never import apps.

---

## Engine Must Be Headless

Engines must be usable by multiple platforms.

Example consumers:

- web apps
- mobile apps
- admin dashboards
- background workers

Therefore engines must prioritize domain logic and contracts, not UI.
