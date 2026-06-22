# Platform Architecture Contract — Index

> **Document Type:** Architecture Contract Index
> **Source Contract:** [platformcontract.md](platformcontract.md) — Locked. All rules authoritative there.
> **Status:** Locked — this index mirrors the structure of platformcontract.md
> **Scope:** Entire platform workspace (`VC/`)
> **Change Rule:** Wording changes require contract revision; formatting changes must preserve all meaning

This contract defines the structural rules for the entire platform workspace.

The platform is composed of three primary layers:

- Apps
- Engines
- Shared

Each layer has a strict responsibility and dependency direction.

The purpose of this contract is to guarantee:

- modular architecture
- cross-app reuse
- safe multi-product development
- deterministic dependency flow
- compatibility across web and mobile platforms

---

## Reading Order

Read these files in order for a full contract orientation. Each file is self-contained
and may also be read in isolation for targeted review.

| Order | File | What It Covers |
|---|---|---|
| 1 | [01-platform-structure.md](01-platform-structure.md) | Root directory structure; three-layer model; contract guarantees |
| 2 | [02-layer-responsibilities.md](02-layer-responsibilities.md) | Apps, Engines, and Shared — what each layer owns and must not own |
| 3 | [03-dependency-rules.md](03-dependency-rules.md) | Dependency direction; DAG principle; app/engine/shared isolation rules |
| 4 | [04-engine-architecture.md](04-engine-architecture.md) | Engine internal layered structure; adapter surface; layer order |
| 5 | [05-app-architecture.md](05-app-architecture.md) | App internal structure; routing rule; deployment rule |
| 6 | [06-platform-principles.md](06-platform-principles.md) | Event model; ownership model; scaling model; enforcement rule; platform principle |

---

## Section Ownership

| Section | Library File |
|---|---|
| Platform purpose and guarantees | [01-platform-structure.md](01-platform-structure.md) |
| Platform root directory structure | [01-platform-structure.md](01-platform-structure.md) |
| Apps Layer definition and responsibilities | [02-layer-responsibilities.md](02-layer-responsibilities.md) |
| Engines Layer definition and responsibilities | [02-layer-responsibilities.md](02-layer-responsibilities.md) |
| Shared Layer definition and responsibilities | [02-layer-responsibilities.md](02-layer-responsibilities.md) |
| Dependency Direction Rule | [03-dependency-rules.md](03-dependency-rules.md) |
| App Isolation Rule | [03-dependency-rules.md](03-dependency-rules.md) |
| Engine Isolation Rule | [03-dependency-rules.md](03-dependency-rules.md) |
| Shared Isolation Rule | [03-dependency-rules.md](03-dependency-rules.md) |
| Engine Internal Architecture | [04-engine-architecture.md](04-engine-architecture.md) |
| App Architecture | [05-app-architecture.md](05-app-architecture.md) |
| Platform Routing Rule | [05-app-architecture.md](05-app-architecture.md) |
| Platform Deployment Rule | [05-app-architecture.md](05-app-architecture.md) |
| Platform Event Model | [06-platform-principles.md](06-platform-principles.md) |
| Platform Ownership Model | [06-platform-principles.md](06-platform-principles.md) |
| Platform Scaling Model | [06-platform-principles.md](06-platform-principles.md) |
| Enforcement Rule | [06-platform-principles.md](06-platform-principles.md) |
| Platform Principle | [06-platform-principles.md](06-platform-principles.md) |

---

## Cross-Links

```
01-platform-structure.md
  ↔ 02-layer-responsibilities.md  (structure defines where layers live; responsibilities define what they do)
  ↔ 03-dependency-rules.md        (structure defines the three layers; rules govern how they interact)

02-layer-responsibilities.md
  ↔ 03-dependency-rules.md        (layer constraints inform isolation rules)
  ↔ 04-engine-architecture.md     (engine layer definition + engine internal architecture)
  ↔ 05-app-architecture.md        (app layer definition + app internal structure)

03-dependency-rules.md
  ↔ 02-layer-responsibilities.md  (isolation rules derive from layer responsibility definitions)
  ↔ 04-engine-architecture.md     (engine isolation + engine adapter surface)
  ↔ 06-platform-principles.md     (DAG principle is restated in platform principles)

04-engine-architecture.md
  ↔ 02-layer-responsibilities.md  (engine layer definition)
  ↔ 05-app-architecture.md        (apps consume engines through adapters)

05-app-architecture.md
  ↔ 02-layer-responsibilities.md  (app layer definition)
  ↔ 04-engine-architecture.md     (apps consume engines only through adapters)
  ↔ 06-platform-principles.md     (deployment is part of the platform ownership + scaling model)

06-platform-principles.md
  ↔ 01-platform-structure.md      (scaling model references root structure)
  ↔ 03-dependency-rules.md        (DAG principle)
  ↔ 04-engine-architecture.md     (event model — engines emit, apps subscribe)
```

---

## Machine Reading Index

| Enforcement Point | Section | Library File |
|---|---|---|
| Root directory structure (`VC/apps/engines/shared/contract/`) | Platform Structure | [01-platform-structure.md](01-platform-structure.md) |
| Apps must not depend on other apps | Apps Layer | [02-layer-responsibilities.md](02-layer-responsibilities.md) |
| Engines must not contain product-specific logic | Engines Layer | [02-layer-responsibilities.md](02-layer-responsibilities.md) |
| Shared must never depend on apps or engines | Shared Layer | [02-layer-responsibilities.md](02-layer-responsibilities.md) |
| Dependency direction (`apps → engines → shared`) | Dependency Direction Rule | [03-dependency-rules.md](03-dependency-rules.md) |
| Platform DAG requirement | Dependency Direction Rule | [03-dependency-rules.md](03-dependency-rules.md) |
| No cross-app imports | App Isolation Rule | [03-dependency-rules.md](03-dependency-rules.md) |
| Engine must not import from any app | Engine Isolation Rule | [03-dependency-rules.md](03-dependency-rules.md) |
| Shared must not contain product logic / business rules | Shared Isolation Rule | [03-dependency-rules.md](03-dependency-rules.md) |
| Engine layer order (`DAL → Model → Controller → Hooks → Adapters`) | Engine Internal Architecture | [04-engine-architecture.md](04-engine-architecture.md) |
| Apps consume engines only through adapters | Engine Internal Architecture | [04-engine-architecture.md](04-engine-architecture.md) |
| Routing exists only in apps | Platform Routing Rule | [05-app-architecture.md](05-app-architecture.md) |
| Engines must never define routes | Platform Routing Rule | [05-app-architecture.md](05-app-architecture.md) |
| Each app deploys independently | Platform Deployment Rule | [05-app-architecture.md](05-app-architecture.md) |
| Engines are not deployed as standalone applications | Platform Deployment Rule | [05-app-architecture.md](05-app-architecture.md) |
| Apps must not emit engine-level domain events | Platform Event Model | [06-platform-principles.md](06-platform-principles.md) |
| No layer may assume responsibility of another layer | Platform Ownership Model | [06-platform-principles.md](06-platform-principles.md) |
| Any code violating this contract must be refactored | Enforcement Rule | [06-platform-principles.md](06-platform-principles.md) |
