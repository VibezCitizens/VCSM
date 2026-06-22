# Engine Architecture Contract — Index

> **Source Contract:** [../enginecontract.md](../enginecontract.md) — Locked. All rules authoritative there.
> **Status:** Locked
> **Index:** [../INDEX.md](../INDEX.md)

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

## Reading Order

| Order | File | What It Covers |
|---|---|---|
| 1 | [01-engine-definition.md](01-engine-definition.md) | What an engine is; location rule; headless requirement |
| 2 | [02-engine-responsibilities.md](02-engine-responsibilities.md) | What engines own; what they must not contain; dependency direction |
| 3 | [03-engine-layer-contracts.md](03-engine-layer-contracts.md) | Folder structure; DAL / Model / Controller / Hooks layer contracts |
| 4 | [04-engine-public-api.md](04-engine-public-api.md) | Adapter contract; public API definition |
| 5 | [05-engine-permissions-events.md](05-engine-permissions-events.md) | Permission contract; event contract |
| 6 | [06-engine-isolation-versioning.md](06-engine-isolation-versioning.md) | Isolation rule; versioning rule; core principle |

---

## Benefits

With this contract you get:

- reusable engines
- clean app boundaries
- safe multi-app architecture
- easier mobile support later
- predictable scaling
