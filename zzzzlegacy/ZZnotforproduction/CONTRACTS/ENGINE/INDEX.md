# Engine Contracts — Root Index

> **Status:** Locked
> **Canonical Sources:** [enginecontract.md](enginecontract.md) · [capabilitycontract.md](capabilitycontract.md)
> **Change Rule:** Wording changes require contract revision; formatting changes must preserve all meaning

This directory contains two distinct contracts governing the engine layer of the platform:

| Contract | Concern | Subfolder |
|---|---|---|
| [enginecontract.md](enginecontract.md) | How to **build** an engine — internal architecture, layer contracts, isolation, public API | [Engine/](Engine/INDEX.md) |
| [capabilitycontract.md](capabilitycontract.md) | How engines **interact** — capability surfaces, E2E communication, event contracts | [Capability/](Capability/INDEX.md) |

Read both. They are complementary, not redundant.

---

## Reading Order

### Full orientation

```
Engine/INDEX.md
  → Engine/01-engine-definition.md
  → Engine/02-engine-responsibilities.md
  → Engine/03-engine-layer-contracts.md
  → Engine/04-engine-public-api.md
  → Engine/05-engine-permissions-events.md
  → Engine/06-engine-isolation-versioning.md

Capability/INDEX.md
  → Capability/01-capability-definition.md
  → Capability/02-engine-communication.md
  → Capability/03-capability-contracts.md
  → Capability/04-event-contract.md
  → Capability/05-capability-ownership.md
  → Capability/06-capability-principles.md
```

### Targeted review

| Question | Go to |
|---|---|
| Can engine A import engine B's DAL? | [Capability/01-capability-definition.md](Capability/01-capability-definition.md) — Core Rule |
| Can engine A call engine B's controller directly? | [Capability/02-engine-communication.md](Capability/02-engine-communication.md) — E2E Communication Rule |
| What can an adapter export? | [Engine/04-engine-public-api.md](Engine/04-engine-public-api.md) — Adapter Contract |
| What must an event envelope contain? | [Capability/04-event-contract.md](Capability/04-event-contract.md) — Event Contract Rule |
| Can an app compute permissions itself? | [Engine/05-engine-permissions-events.md](Engine/05-engine-permissions-events.md) — Permission Contract |
| Can an engine depend on an app? | [Engine/02-engine-responsibilities.md](Engine/02-engine-responsibilities.md) — Dependency Direction |

---

## Machine Reading Index

| Enforcement Point | Source Section | Library File |
|---|---|---|
| Engines live in `/engines/<engine-name>` | Engine Location Rule | [Engine/01-engine-definition.md](Engine/01-engine-definition.md) |
| Apps may import engines; engines must never import apps | Engine Location Rule | [Engine/01-engine-definition.md](Engine/01-engine-definition.md) |
| Dependency direction: `apps → engines → shared` | Engine Dependency Direction | [Engine/02-engine-responsibilities.md](Engine/02-engine-responsibilities.md) |
| Engines must never contain: routing, layouts, navigation, branding, themes, app-specific rules | Engine Must Not Contain | [Engine/02-engine-responsibilities.md](Engine/02-engine-responsibilities.md) |
| Engines must be headless (usable by web, mobile, admin, workers) | Engine Must Be Headless | [Engine/01-engine-definition.md](Engine/01-engine-definition.md) |
| Engine layer order: `DAL → Model → Controller → Hooks → Adapters` | Engine Folder Structure | [Engine/03-engine-layer-contracts.md](Engine/03-engine-layer-contracts.md) |
| DAL: explicit projections, raw rows, no permissions | DAL Contract | [Engine/03-engine-layer-contracts.md](Engine/03-engine-layer-contracts.md) |
| Controllers own domain meaning; enforce permissions + idempotency | Controller Contract | [Engine/03-engine-layer-contracts.md](Engine/03-engine-layer-contracts.md) |
| Adapters must never export DAL / controllers / models | Adapter Contract | [Engine/04-engine-public-api.md](Engine/04-engine-public-api.md) |
| Apps must import engines only through adapters | Adapter Contract | [Engine/04-engine-public-api.md](Engine/04-engine-public-api.md) |
| Engines must return explicit permission snapshots | Permission Contract | [Engine/05-engine-permissions-events.md](Engine/05-engine-permissions-events.md) |
| Apps must not compute permissions themselves | Permission Contract | [Engine/05-engine-permissions-events.md](Engine/05-engine-permissions-events.md) |
| Engines must be independently testable; must run without any app | Engine Isolation Rule | [Engine/06-engine-isolation-versioning.md](Engine/06-engine-isolation-versioning.md) |
| Engines may interact only through published capabilities | Core Rule | [Capability/01-capability-definition.md](Capability/01-capability-definition.md) |
| Engines must never import another engine's internal files | Core Rule | [Capability/01-capability-definition.md](Capability/01-capability-definition.md) |
| Engine capability surface lives in `engines/<name>/src/adapters/` | Capability Location Rule | [Capability/01-capability-definition.md](Capability/01-capability-definition.md) |
| Two allowed E2E patterns: capability calls + domain events | E2E Communication Rule | [Capability/02-engine-communication.md](Capability/02-engine-communication.md) |
| Prefer events when more than one consumer may exist | Preferred Rule | [Capability/02-engine-communication.md](Capability/02-engine-communication.md) |
| Capabilities must never return raw DB rows or internal artifacts | Capability Output Rule | [Capability/03-capability-contracts.md](Capability/03-capability-contracts.md) |
| Capabilities must not require UI objects / route objects / screen props | Capability Input Rule | [Capability/03-capability-contracts.md](Capability/03-capability-contracts.md) |
| Event envelope: `eventName, version, occurredAt, source, payload` | Event Contract Rule | [Capability/04-event-contract.md](Capability/04-event-contract.md) |
| Event naming format: `<noun>.<past-tense-action>` | Event Naming Rule | [Capability/04-event-contract.md](Capability/04-event-contract.md) |
| The engine that owns a capability is the sole authority on that domain | Capability Ownership Rule | [Capability/05-capability-ownership.md](Capability/05-capability-ownership.md) |
| Consuming engine must gracefully handle capability failure | Failure Rule | [Capability/05-capability-ownership.md](Capability/05-capability-ownership.md) |

---

## Example Workspace

```
VC/
  apps/
    vibez-web/
    wentrex-web/

  engines/
    chat/
    notifications/

  shared/
    core/
    ui/

  contract/
    enginecontract.md
```

---

## Core Principles

Apps provide experiences.
Engines provide capabilities.
Shared provides primitives.

Engines collaborate through contracts, not assumptions.
Events decouple.
Adapters protect.
Ownership stays singular.
