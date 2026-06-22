# Engine Contracts — Section Map
## Phase 1 — Read and Classify

> **Sources:** enginecontract.md (295 lines), capabilitycontract.md (344 lines)
> **Generated for:** Contract library decomposition planning
> **Decision:** Two subfolders — `Engine/` and `Capability/` — because the contracts govern distinct concerns

---

## Decision: Subfolder vs Flat

**Two subfolders are warranted.**

| Contract | Concern | Subfolder |
|---|---|---|
| `enginecontract.md` | How to BUILD an engine — internal architecture, layer contracts, isolation | `Engine/` |
| `capabilitycontract.md` | How engines INTERACT — capability surfaces, E2E communication, events | `Capability/` |

The contracts are already separated. Subfolders make the distinction visible in the filesystem
and keep each library independently navigable.

---

## enginecontract.md — Section Map

| Section | Lines | Category | Suggested File |
|---|---|---|---|
| Document header, purpose, examples, core rules (agnostic, deterministic, reusable) | 1–21 | engine-definition | Engine/01-engine-definition.md |
| Engine Location Rule | 22–38 | engine-definition | Engine/01-engine-definition.md |
| Engine Dependency Direction | 40–51 | dependency-rules | Engine/02-engine-responsibilities.md |
| Engine Responsibilities (what engines own) | 53–67 | responsibility | Engine/02-engine-responsibilities.md |
| Engine Must Not Contain | 69–81 | responsibility | Engine/02-engine-responsibilities.md |
| Engine Must Be Headless | 84–95 | engine-definition | Engine/01-engine-definition.md |
| Engine Folder Structure (layer order, mandatory) | 97–111 | structural | Engine/03-engine-layer-contracts.md |
| DAL Contract | 112–129 | layer-contracts | Engine/03-engine-layer-contracts.md |
| Model Contract | 130–145 | layer-contracts | Engine/03-engine-layer-contracts.md |
| Controller Contract | 146–161 | layer-contracts | Engine/03-engine-layer-contracts.md |
| Hooks Contract | 162–175 | layer-contracts | Engine/03-engine-layer-contracts.md |
| Adapter Contract | 176–200 | adapter-contract | Engine/04-engine-public-api.md |
| Engine Public API | 201–218 | adapter-contract | Engine/04-engine-public-api.md |
| Permission Contract | 220–235 | permissions | Engine/05-engine-permissions-events.md |
| Event Contract | 237–249 | events | Engine/05-engine-permissions-events.md |
| Engine Versioning | 251–257 | versioning | Engine/06-engine-isolation-versioning.md |
| Engine Isolation Rule | 259–265 | isolation | Engine/06-engine-isolation-versioning.md |
| Example Workspace | 266–282 | meta | Engine/INDEX.md |
| Core Principle | 283–286 | principle | Engine/06-engine-isolation-versioning.md |
| Result (benefits) | 287–295 | meta | Engine/INDEX.md |

---

## capabilitycontract.md — Section Map

| Section | Lines | Category | Suggested File |
|---|---|---|---|
| Document header, purpose, core rule | 1–35 | capability-definition | Capability/01-capability-definition.md |
| Capability Definition | 36–53 | capability-definition | Capability/01-capability-definition.md |
| Capability Location Rule | 54–65 | capability-definition | Capability/01-capability-definition.md |
| Capability Import Rule | 67–79 | capability-definition | Capability/01-capability-definition.md |
| Engine-to-Engine Communication Rule (capability calls + domain events) | 80–106 | communication | Capability/02-engine-communication.md |
| Preferred Rule (events > direct calls) | 107–118 | communication | Capability/02-engine-communication.md |
| Capability Output Rule | 119–135 | contracts | Capability/03-capability-contracts.md |
| Capability Input Rule | 137–151 | contracts | Capability/03-capability-contracts.md |
| Event Contract Rule (event envelope schema) | 153–185 | events | Capability/04-event-contract.md |
| Event Naming Rule | 186–207 | events | Capability/04-event-contract.md |
| Capability Versioning Rule | 209–219 | versioning | Capability/04-event-contract.md |
| Anti-Corruption Rule | 221–226 | ownership | Capability/05-capability-ownership.md |
| Notification Example | 228–243 | examples | Capability/05-capability-ownership.md |
| Search Example | 244–258 | examples | Capability/05-capability-ownership.md |
| Analytics Example | 259–273 | examples | Capability/05-capability-ownership.md |
| Capability Ownership Rule | 275–287 | ownership | Capability/05-capability-ownership.md |
| Failure Rule | 288–301 | resilience | Capability/05-capability-ownership.md |
| Capability Registry Rule | 303–316 | governance | Capability/06-capability-principles.md |
| Platform-Wide Principle | 318–322 | principle | Capability/06-capability-principles.md |
| Example Engine Collaboration Map | 323–344 | meta | Capability/06-capability-principles.md |

---

## Category Summary

### enginecontract.md

| Category | Section Count | Target File |
|---|---|---|
| engine-definition | 3 | Engine/01-engine-definition.md |
| dependency-rules + responsibility | 3 | Engine/02-engine-responsibilities.md |
| structural + layer-contracts | 5 | Engine/03-engine-layer-contracts.md |
| adapter-contract | 2 | Engine/04-engine-public-api.md |
| permissions + events | 2 | Engine/05-engine-permissions-events.md |
| versioning + isolation + principle | 3 | Engine/06-engine-isolation-versioning.md |
| meta | 2 | Engine/INDEX.md |

### capabilitycontract.md

| Category | Section Count | Target File |
|---|---|---|
| capability-definition | 4 | Capability/01-capability-definition.md |
| communication | 2 | Capability/02-engine-communication.md |
| contracts | 2 | Capability/03-capability-contracts.md |
| events + versioning | 3 | Capability/04-event-contract.md |
| ownership + resilience + examples | 5 | Capability/05-capability-ownership.md |
| governance + principle + meta | 3 | Capability/06-capability-principles.md |

---

## Extraction Notes

- Engine Versioning is co-located with Engine Isolation Rule in 06-engine-isolation-versioning.md because both govern how engines protect their consumers and maintain independent operation.
- The Capability Versioning Rule is co-located with the Event Contract in 04-event-contract.md because event versioning and capability versioning are closely coupled — both protect consuming engines from silent breaking changes.
- The Anti-Corruption Rule, Ownership Rule, and Failure Rule are co-located in 05-capability-ownership.md because all three define the responsibility and resilience obligations of engine boundaries.
- The three Correct/Wrong pattern examples (Notification, Search, Analytics) stay in 05-capability-ownership.md because they illustrate the Anti-Corruption and Ownership rules directly.
- The Example Workspace and Result sections of enginecontract.md are meta content — they belong in Engine/INDEX.md, not in any rule file.
- The Example Engine Collaboration Map stays in 06-capability-principles.md as it illustrates the platform-wide principle.
