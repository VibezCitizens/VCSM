# Platform vs Governance Classification Report
## Phase 4 — Detect Static Governance Leakage

> **Source:** platformcontract.md
> **Purpose:** Identify which rules belong in an architecture contract versus a governance/quality contract
> **Status:** Classification only — no rules are removed; recommended locations are advisory

---

## Classification Definitions

**ARCHITECTURE** — Rules that define *what the system is*: layer identities, ownership boundaries,
dependency direction, structural composition. Violating these changes the meaning of the system.

**GOVERNANCE** — Rules that define *how the system must be maintained*: enforcement triggers,
process requirements, quality expectations. Violating these degrades consistency and
predictability but does not change system identity.

**BORDERLINE** — Rules where the principle is architectural but the enforcement form is
governance (a process requirement, a pattern rule). Both classifications apply; the rule
should remain in the architecture contract.

---

## Rule Classification Table

| Rule | Current Section | Architecture or Governance | Recommended Location |
|---|---|---|---|
| All code must live within `VC/apps/engines/shared/contract/` | Platform Structure | ARCHITECTURE | 01-platform-structure.md |
| Three-layer model (Apps / Engines / Shared) | Layer Definitions | ARCHITECTURE | 01-platform-structure.md |
| Apps represent end-user products | Apps Layer | ARCHITECTURE | 02-layer-responsibilities.md |
| Apps are responsible for: routing, layouts, branding, UI, features, policy, UX | Apps Layer | ARCHITECTURE | 02-layer-responsibilities.md |
| Apps consume engines | Apps Layer | ARCHITECTURE | 02-layer-responsibilities.md |
| Apps must not depend on other apps | Apps Layer | ARCHITECTURE | 02-layer-responsibilities.md |
| Engines provide reusable domain capabilities | Engines Layer | ARCHITECTURE | 02-layer-responsibilities.md |
| Engines are application-agnostic | Engines Layer | ARCHITECTURE | 02-layer-responsibilities.md |
| Engines must not contain product-specific logic | Engines Layer | ARCHITECTURE | 02-layer-responsibilities.md |
| Engines are consumed by apps | Engines Layer | ARCHITECTURE | 02-layer-responsibilities.md |
| Shared modules provide domain-neutral primitives | Shared Layer | ARCHITECTURE | 02-layer-responsibilities.md |
| Shared modules must never depend on apps or engines | Shared Layer | ARCHITECTURE | 02-layer-responsibilities.md |
| Dependencies must always flow downward (`apps → engines → shared`) | Dependency Direction Rule | ARCHITECTURE | 03-dependency-rules.md |
| Platform must remain a DAG | Dependency Direction Rule | ARCHITECTURE | 03-dependency-rules.md |
| An app must never import code from another app | App Isolation Rule | ARCHITECTURE | 03-dependency-rules.md |
| Shared capabilities must be extracted into engines | App Isolation Rule | BORDERLINE | 03-dependency-rules.md (architecture anchor) |
| An engine must not depend on any specific app | Engine Isolation Rule | ARCHITECTURE | 03-dependency-rules.md |
| If an engine imports from an app, the architecture is invalid | Engine Isolation Rule | ARCHITECTURE | 03-dependency-rules.md |
| Shared modules must not contain product logic / engine orchestration / business rules | Shared Isolation Rule | ARCHITECTURE | 03-dependency-rules.md |
| If shared logic becomes domain-specific, it belongs in an engine | Shared Isolation Rule | BORDERLINE | 03-dependency-rules.md (architecture anchor) |
| Every engine must follow the layered architecture in `enginecontract.md` | Engine Internal Architecture | ARCHITECTURE | 04-engine-architecture.md |
| Engine layer order: `DAL → Model → Controller → Hooks → Adapters` | Engine Internal Architecture | ARCHITECTURE | 04-engine-architecture.md |
| Adapters define the public surface | Engine Internal Architecture | ARCHITECTURE | 04-engine-architecture.md |
| Apps must consume engines only through adapters | Engine Internal Architecture | ARCHITECTURE | 04-engine-architecture.md |
| Apps assemble domain experiences using engines | App Architecture | ARCHITECTURE | 05-app-architecture.md |
| Apps must never implement engine responsibilities internally | App Architecture | ARCHITECTURE | 05-app-architecture.md |
| Routing exists only in apps | Platform Routing Rule | ARCHITECTURE | 05-app-architecture.md |
| Engines must never define routes | Platform Routing Rule | ARCHITECTURE | 05-app-architecture.md |
| Apps mount engine screens or hooks inside their own routing structure | Platform Routing Rule | ARCHITECTURE | 05-app-architecture.md |
| Each app deploys independently | Platform Deployment Rule | ARCHITECTURE | 05-app-architecture.md |
| Engines are distributed as packages; not deployed as standalone applications | Platform Deployment Rule | ARCHITECTURE | 05-app-architecture.md |
| Engines may emit domain events | Platform Event Model | ARCHITECTURE | 06-platform-principles.md |
| Apps may subscribe to engine events | Platform Event Model | ARCHITECTURE | 06-platform-principles.md |
| Apps must not emit engine-level domain events | Platform Event Model | ARCHITECTURE | 06-platform-principles.md |
| No layer may assume responsibility of another layer | Platform Ownership Model | ARCHITECTURE | 06-platform-principles.md |
| New apps must follow the same structure | Platform Scaling Model | GOVERNANCE | 06-platform-principles.md |
| This ensures capabilities are reused rather than duplicated | Platform Scaling Model | GOVERNANCE | 06-platform-principles.md |
| Any code violating this contract must be refactored | Enforcement Rule | GOVERNANCE | 06-platform-principles.md |
| Architectural boundaries must remain visible in the filesystem | Enforcement Rule | BORDERLINE | 06-platform-principles.md (architecture anchor) |
| A developer should understand the entire system by reading the directory tree | Enforcement Rule | BORDERLINE | 06-platform-principles.md (architecture anchor) |
| Structure prevents chaos / Boundaries enable scale / Capabilities outlive products | Platform Principle | ARCHITECTURE | 06-platform-principles.md |

---

## Summary

| Classification | Rule Count |
|---|---|
| ARCHITECTURE | 31 |
| GOVERNANCE | 3 |
| BORDERLINE | 5 |

---

## Governance Rules Analysis

This contract has very few pure governance rules. All three are statements of process
expectation rather than structural definition.

| Rule | Why Governance | Note |
|---|---|---|
| New apps must follow the same structure | Prescribes a process for future work, not a structural invariant | The structural invariant is already captured by the layer definitions |
| Capabilities are reused rather than duplicated | Quality intent; consequence of correct architecture, not the architecture itself | Enforced by the engine model |
| Any code violating this contract must be refactored | Enforcement process rule | Does not define structure |

**Recommendation:** All three governance rules are appropriate in the architecture contract
as they reinforce the intent. No extraction is required. They do not need a separate
governance policy document.

---

## Borderline Rules Analysis

**"Shared capabilities must be extracted into engines"**
This is the architectural consequence of the App Isolation Rule (no cross-app imports).
It is stated as a corrective directive but it is structurally required by the layer model.
Remains in 03-dependency-rules.md as architecture.

**"If shared logic becomes domain-specific, it belongs in an engine"**
Same pattern — stated as a corrective directive but is a structural consequence of the
Shared Layer definition. Remains in 03-dependency-rules.md as architecture.

**"Architectural boundaries must remain visible in the filesystem"**
Both a structural principle (architecture) and an enforcement guideline (governance).
Primary home is 06-platform-principles.md alongside the Enforcement Rule.

**"A developer should understand the entire system by reading the directory tree"**
An architectural principle stated as a human-readability goal. Mirrors the same
principle in the ARCHITECTURE.md contract (§8 Final Architectural Principles).
Remains in 06-platform-principles.md.
