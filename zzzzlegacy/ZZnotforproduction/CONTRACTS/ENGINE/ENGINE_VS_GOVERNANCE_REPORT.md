# Engine Contracts — Architecture vs Governance Classification Report
## Phase 4 — Detect Static Governance Leakage

> **Sources:** enginecontract.md, capabilitycontract.md
> **Purpose:** Identify which rules belong in an architecture contract versus a governance/quality contract
> **Status:** Classification only — no rules are removed

---

## Classification Definitions

**ARCHITECTURE** — Rules that define *what the system is*: structural identities, layer boundaries,
ownership, communication patterns, dependency direction. Violating these changes system meaning.

**GOVERNANCE** — Rules that define *how the system must be maintained*: versioning process,
documentation requirements, naming conventions. Violating these degrades predictability
but does not change system identity.

**BORDERLINE** — Rules with both architectural intent and governance enforcement form.
Both classifications apply; the rule stays in the architecture contract.

---

## enginecontract.md — Rule Classification Table

| Rule | Current Section | Architecture or Governance | Recommended Location |
|---|---|---|---|
| Engines must remain application-agnostic, deterministic, and reusable | Preamble | ARCHITECTURE | Engine/01-engine-definition.md |
| Apps consume engines; engines must never depend on apps | Preamble | ARCHITECTURE | Engine/01-engine-definition.md |
| All engines must live inside `/engines/<engine-name>` | Engine Location Rule | ARCHITECTURE | Engine/01-engine-definition.md |
| Each engine is an isolated module | Engine Location Rule | ARCHITECTURE | Engine/01-engine-definition.md |
| Apps may import engines; engines must never import apps | Engine Location Rule | ARCHITECTURE | Engine/01-engine-definition.md |
| Dependency direction: `apps → engines → shared` | Engine Dependency Direction | ARCHITECTURE | Engine/02-engine-responsibilities.md |
| Engines must remain independent of application logic | Engine Dependency Direction | ARCHITECTURE | Engine/02-engine-responsibilities.md |
| Engines own reusable domain logic | Engine Responsibilities | ARCHITECTURE | Engine/02-engine-responsibilities.md |
| Engines must implement domain behavior; must not implement product behavior | Engine Responsibilities | ARCHITECTURE | Engine/02-engine-responsibilities.md |
| Engines must never contain: routing, layouts, navigation, auth providers, branding, app themes, feature flags, app-specific rules | Engine Must Not Contain | ARCHITECTURE | Engine/02-engine-responsibilities.md |
| Engines must be usable by multiple platforms (headless) | Engine Must Be Headless | ARCHITECTURE | Engine/01-engine-definition.md |
| Engines must prioritize domain logic and contracts, not UI | Engine Must Be Headless | ARCHITECTURE | Engine/01-engine-definition.md |
| Engine folder structure: `src/adapters/dal/model/controller/hooks/types/` | Engine Folder Structure | ARCHITECTURE | Engine/03-engine-layer-contracts.md |
| Layer order mandatory: `DAL → Model → Controller → Hooks → Adapters` | Engine Folder Structure | ARCHITECTURE | Engine/03-engine-layer-contracts.md |
| DAL: access database, explicit projections, return raw rows | DAL Contract | ARCHITECTURE | Engine/03-engine-layer-contracts.md |
| DAL must never: enforce permissions, derive domain meaning, call controllers, import hooks or UI | DAL Contract | ARCHITECTURE | Engine/03-engine-layer-contracts.md |
| Models translate database rows into domain objects | Model Contract | ARCHITECTURE | Engine/03-engine-layer-contracts.md |
| Models must never: call database, enforce permissions, contain business rules | Model Contract | ARCHITECTURE | Engine/03-engine-layer-contracts.md |
| Controllers own domain meaning; enforce permissions, membership, idempotency; return domain objects | Controller Contract | ARCHITECTURE | Engine/03-engine-layer-contracts.md |
| Controllers must never: import UI, import routing, depend on app features | Controller Contract | ARCHITECTURE | Engine/03-engine-layer-contracts.md |
| Hooks orchestrate runtime behavior; call controllers; must never access database directly | Hooks Contract | ARCHITECTURE | Engine/03-engine-layer-contracts.md |
| Adapters define the public API of the engine | Adapter Contract | ARCHITECTURE | Engine/04-engine-public-api.md |
| Adapters may export: hooks, public functions, domain types | Adapter Contract | ARCHITECTURE | Engine/04-engine-public-api.md |
| Adapters must never export: DAL, controllers, models | Adapter Contract | ARCHITECTURE | Engine/04-engine-public-api.md |
| Apps must import engines only through adapters | Adapter Contract | ARCHITECTURE | Engine/04-engine-public-api.md |
| Engines must expose a stable public API | Engine Public API | ARCHITECTURE | Engine/04-engine-public-api.md |
| Apps must rely only on this API | Engine Public API | ARCHITECTURE | Engine/04-engine-public-api.md |
| Engines must return explicit permission snapshots | Permission Contract | ARCHITECTURE | Engine/05-engine-permissions-events.md |
| Apps must not compute permissions themselves | Permission Contract | ARCHITECTURE | Engine/05-engine-permissions-events.md |
| Engines must emit domain events | Event Contract | ARCHITECTURE | Engine/05-engine-permissions-events.md |
| Apps may subscribe to these events | Event Contract | ARCHITECTURE | Engine/05-engine-permissions-events.md |
| Engines must maintain backward-compatible APIs | Engine Versioning | GOVERNANCE | Engine/06-engine-isolation-versioning.md |
| Breaking changes must be versioned | Engine Versioning | GOVERNANCE | Engine/06-engine-isolation-versioning.md |
| Apps must not depend on internal engine structure | Engine Versioning | ARCHITECTURE | Engine/06-engine-isolation-versioning.md |
| Engines must be independently testable | Engine Isolation Rule | ARCHITECTURE | Engine/06-engine-isolation-versioning.md |
| An engine must be able to run without any app | Engine Isolation Rule | ARCHITECTURE | Engine/06-engine-isolation-versioning.md |
| If an engine cannot run without an app, the architecture is invalid | Engine Isolation Rule | ARCHITECTURE | Engine/06-engine-isolation-versioning.md |
| Apps provide experiences; Engines provide capabilities; Shared provides primitives | Core Principle | ARCHITECTURE | Engine/06-engine-isolation-versioning.md |

---

## capabilitycontract.md — Rule Classification Table

| Rule | Current Section | Architecture or Governance | Recommended Location |
|---|---|---|---|
| Engines may interact only through published capabilities | Core Rule | ARCHITECTURE | Capability/01-capability-definition.md |
| Engines must never import another engine's internal files | Core Rule | ARCHITECTURE | Capability/01-capability-definition.md |
| A capability is the public surface of an engine | Capability Definition | ARCHITECTURE | Capability/01-capability-definition.md |
| A capability must be: explicit, versionable, documented, app-agnostic | Capability Definition | BORDERLINE | Capability/01-capability-definition.md |
| Each engine exposes its capability through `engines/<engine-name>/src/adapters/` | Capability Location Rule | ARCHITECTURE | Capability/01-capability-definition.md |
| Only adapters may be consumed externally | Capability Location Rule | ARCHITECTURE | Capability/01-capability-definition.md |
| Apps and engines may only import another engine through its adapter | Capability Import Rule | ARCHITECTURE | Capability/01-capability-definition.md |
| Engine-to-engine: two allowed patterns only (capability calls + domain events) | E2E Communication Rule | ARCHITECTURE | Capability/02-engine-communication.md |
| Capability calls: synchronous, direct, low-risk only | E2E Communication Rule | ARCHITECTURE | Capability/02-engine-communication.md |
| Domain events: decoupled, asynchronous, fan-out | E2E Communication Rule | ARCHITECTURE | Capability/02-engine-communication.md |
| Prefer events over direct capability calls when more than one consumer may exist | Preferred Rule | BORDERLINE | Capability/02-engine-communication.md |
| Use direct calls only when: required immediately, synchronous, no fan-out, failure handled inline | Preferred Rule | ARCHITECTURE | Capability/02-engine-communication.md |
| Capabilities must return domain-safe outputs | Capability Output Rule | ARCHITECTURE | Capability/03-capability-contracts.md |
| Capabilities must never return: raw DB rows, DAL objects, internal model artifacts, engine-private flags | Capability Output Rule | ARCHITECTURE | Capability/03-capability-contracts.md |
| Capabilities may return: domain objects, result envelopes, permission snapshots, event confirmations | Capability Output Rule | ARCHITECTURE | Capability/03-capability-contracts.md |
| Capabilities must accept stable domain inputs | Capability Input Rule | ARCHITECTURE | Capability/03-capability-contracts.md |
| Capabilities must not require: UI objects, route objects, framework props, internal DB row types | Capability Input Rule | ARCHITECTURE | Capability/03-capability-contracts.md |
| Every event must have: name, version, timestamp, source, payload | Event Contract Rule | ARCHITECTURE | Capability/04-event-contract.md |
| Standard event envelope schema (`eventName, version, occurredAt, source, payload`) | Event Contract Rule | ARCHITECTURE | Capability/04-event-contract.md |
| Events must use stable domain language; format: `<noun>.<past-tense-action>` | Event Naming Rule | BORDERLINE | Capability/04-event-contract.md |
| Avoid vague event names (`chat.updated`, `data.saved`) | Event Naming Rule | GOVERNANCE | Capability/04-event-contract.md |
| Breaking changes require: version bump, migration notes, explicit update path | Capability Versioning Rule | GOVERNANCE | Capability/04-event-contract.md |
| Engines must not break consuming apps silently | Capability Versioning Rule | ARCHITECTURE | Capability/04-event-contract.md |
| Consume the public capability contract, not replicate internal assumptions | Anti-Corruption Rule | ARCHITECTURE | Capability/05-capability-ownership.md |
| If shape translation is needed, create a translator at the boundary | Anti-Corruption Rule | ARCHITECTURE | Capability/05-capability-ownership.md |
| The engine that owns a capability is the sole authority on that domain | Capability Ownership Rule | ARCHITECTURE | Capability/05-capability-ownership.md |
| No other engine may mutate another engine's domain state except through its published capability | Capability Ownership Rule | ARCHITECTURE | Capability/05-capability-ownership.md |
| A consuming engine must gracefully handle capability failure | Failure Rule | ARCHITECTURE | Capability/05-capability-ownership.md |
| Event subscribers must be retry-safe; publishers must not block core domain unless required | Failure Rule | ARCHITECTURE | Capability/05-capability-ownership.md |
| Each engine should document its public capability surface in one place | Capability Registry Rule | GOVERNANCE | Capability/06-capability-principles.md |
| Engines collaborate through contracts, not assumptions | Platform-Wide Principle | ARCHITECTURE | Capability/06-capability-principles.md |
| Events decouple / Adapters protect / Ownership stays singular | Platform-Wide Principle | ARCHITECTURE | Capability/06-capability-principles.md |

---

## Summary

### enginecontract.md

| Classification | Count |
|---|---|
| ARCHITECTURE | 33 |
| GOVERNANCE | 2 |
| BORDERLINE | 0 |

### capabilitycontract.md

| Classification | Count |
|---|---|
| ARCHITECTURE | 24 |
| GOVERNANCE | 3 |
| BORDERLINE | 3 |

---

## Governance Rules Analysis

### enginecontract.md

| Rule | Why Governance | Note |
|---|---|---|
| Engines must maintain backward-compatible APIs | Process obligation, not a structural definition | The structural invariant is "apps must not depend on internal engine structure" (ARCHITECTURE) |
| Breaking changes must be versioned | Process requirement — implies a release workflow | Appropriate in the contract as an expectation on engine maintainers |

### capabilitycontract.md

| Rule | Why Governance | Note |
|---|---|---|
| Avoid vague event names | Quality guidance, not a binary structural rule | The naming format rule (`<noun>.<past-tense-action>`) is borderline; this guidance is governance |
| Breaking changes require version bump + migration notes + update path | Process requirements | Appropriate in contract as expectation on capability maintainers |
| Each engine should document its public capability surface | Documentation requirement | "Should" (not "must") signals governance guidance, not architectural law |

**Recommendation:** All governance rules are appropriate in the architecture contracts.
None need extraction to a separate governance policy.

---

## Borderline Rules Analysis

**"A capability must be: explicit, versionable, documented, app-agnostic" (capabilitycontract.md)**
Three of the four properties (explicit, versionable, app-agnostic) are architectural.
"Documented" is governance. The rule is classified BORDERLINE and stays in the contract as-is.

**"Prefer events over direct capability calls when more than one consumer may exist" (capabilitycontract.md)**
This is a design preference with an architectural rationale (reduce direct dependency chains).
It is guidance, not a hard rule. It stays in the contract as a stated preference.

**"Events must use stable domain language; format: `<noun>.<past-tense-action>`" (capabilitycontract.md)**
The stability requirement is architectural (event contracts must not change arbitrarily).
The naming format is governance (it could be enforced by a linter). Both are appropriate here.
