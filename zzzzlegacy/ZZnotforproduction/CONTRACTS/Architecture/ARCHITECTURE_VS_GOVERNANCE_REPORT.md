# Architecture vs Governance Classification Report
## Phase 4 — Detect Static Governance Leakage

> **Source:** ARCHITECTURE.md
> **Purpose:** Identify which rules belong in an architecture contract versus a governance/quality contract
> **Status:** Classification only — no rules are removed; recommended locations are advisory

---

## Classification Definitions

**ARCHITECTURE** — Rules that define *what the system is*: layer responsibilities, ownership
semantics, boundary definitions, dependency direction, structural identity. Violating these
changes the meaning of the system.

**GOVERNANCE** — Rules that define *how the system must be maintained*: numerical limits,
naming conventions, decomposition triggers, process requirements. Violating these degrades
quality and predictability but does not change system identity.

**BORDERLINE** — Rules where the principle is architectural but the enforcement form is
governance (a numeric limit, a naming pattern). Both classifications apply; the rule
should remain in the architecture contract with a note that a governance policy document
may also reference it.

---

## Rule Classification Table

| Rule | Current Section | Architecture or Governance | Recommended Location |
|---|---|---|---|
| Import Path Rule (`@/...`) | §1.1 | ARCHITECTURE | 01-core-principles.md |
| Module Build Order Rule (DAL → Model → Controller → … → Final Screen) | §1.2 | ARCHITECTURE | 01-core-principles.md |
| Identity Surface Rule (`actorId`, `kind` only; no `profileId` or `vportId`) | §1.3 | ARCHITECTURE | 02-identity-contract.md |
| Owner Meaning Rule (owner = actor owner via `actor_owners`) | §1.4 | ARCHITECTURE | 02-identity-contract.md |
| DAL may/must/must-not rules (thin adapter, raw rows, no business rules) | §2.1 | ARCHITECTURE | 03-layer-contracts.md |
| `.select('*')` ban | §2.1 | BORDERLINE | 03-layer-contracts.md (architecture anchor) + governance policy |
| DAL Import Boundary Rule (may only import Supabase, schema constants, low-level utils) | §2.1 | ARCHITECTURE | 03-layer-contracts.md |
| Model may/must/must-not rules (pure translator, no I/O, no Supabase) | §2.2 | ARCHITECTURE | 03-layer-contracts.md |
| Controller may/must/must-not rules (use-case boundary, business meaning, no React) | §2.3 | ARCHITECTURE | 03-layer-contracts.md |
| Hook may/must/must-not rules (UI lifecycle, calls controllers, no DAL) | §2.4 | ARCHITECTURE | 03-layer-contracts.md |
| Component may/must/must-not rules (presentational, props only, no domain logic) | §2.5 | ARCHITECTURE | 03-layer-contracts.md |
| View Screen may/must/must-not rules (assembles hooks + components, no DAL) | §2.6 | ARCHITECTURE | 03-layer-contracts.md |
| Final Screen may/must/must-not rules (routing composition, guards, no business logic) | §2.7 | ARCHITECTURE | 03-layer-contracts.md |
| Resolver may/must/must-not rules (DI factory, startup wiring, no runtime access) | §2.8 | ARCHITECTURE | 04-resolver-contract.md |
| Resolver naming (`resolvers/` sub-folder, `.resolver.js` suffix) | §2.8 | BORDERLINE | 04-resolver-contract.md (architecture anchor) + 11-naming-conventions.md |
| `setup.js` DI Bootstrap File rule | §2.8 | ARCHITECTURE | 04-resolver-contract.md |
| Shared Layer may/must-not rules (domain-neutral only, no feature imports) | §3 | ARCHITECTURE | 03-layer-contracts.md |
| Shared UI Rule (only domain-neutral primitives) | §3 | ARCHITECTURE | 03-layer-contracts.md |
| File Size & Decomposition Rule (300-line maximum) | §4.1 | GOVERNANCE | 10-structural-integrity.md |
| Decomposition must follow architectural layer boundaries (not arbitrary grouping) | §4.1 | BORDERLINE | 10-structural-integrity.md (architecture anchor) |
| Single Responsibility File Rule (one coherent responsibility per file) | §4.2 | BORDERLINE | 10-structural-integrity.md |
| Controller Fan-Out Rule (max 5 external collaborators) | §4.3 | GOVERNANCE | 10-structural-integrity.md |
| Maximum Folder Depth Rule (3 levels below feature root) | §4.4 | GOVERNANCE | 10-structural-integrity.md |
| File Naming Rule (layer-encoded suffixes: `.dal.js`, `.controller.js`, `use*`, etc.) | §4.5 | BORDERLINE | 11-naming-conventions.md (governance anchor); role encoding is architectural |
| Feature Containment Rule (all feature logic lives inside feature folder) | §5.1 | ARCHITECTURE | 05-feature-boundaries.md |
| Cross-Feature Boundary Rule (no direct internal imports across features) | §5.2 | ARCHITECTURE | 05-feature-boundaries.md |
| Adapter Contract (adapters are public surface; re-export only; no logic) | §5.3 | ARCHITECTURE | 07-adapter-contract.md |
| Adapter Import Rule (all external feature access through adapter) | §5.4 | ARCHITECTURE | 07-adapter-contract.md |
| Screen-to-Feature Access Rule (screens must use adapter; no internal imports) | §5.5 | ARCHITECTURE | 07-adapter-contract.md |
| Module Ownership Rule (module answers a single capability question) | §5.7 | ARCHITECTURE | 06-module-contract.md |
| Module Boundary Rule (modules are internal; cross-feature still uses adapter) | §5.7 | ARCHITECTURE | 06-module-contract.md |
| Module Dependency Rule (one-way inside feature; no internal module cross-import) | §5.7 | ARCHITECTURE | 06-module-contract.md |
| Module Structure Rule (physical or declared; `module-map.json` acceptable) | §5.7 | BORDERLINE | 06-module-contract.md |
| Module Isolation Rule (no duplication of rules/DAL across modules) | §5.7 | ARCHITECTURE | 06-module-contract.md |
| Module Documentation Rule (discoverable through governance tooling) | §5.7 | GOVERNANCE | 06-module-contract.md (architecture declares the expectation; governance fulfills it) |
| Module Architectural Principle (Feature → Module → Behavior → Layer hierarchy) | §5.7 | ARCHITECTURE | 06-module-contract.md |
| Dependency Direction Rule (screens → features → shared → core; one-way only) | §6.1 | ARCHITECTURE | 08-dependency-rules.md |
| Feature Dependency Rule (features depend on shared/core only; inter-feature via adapter) | §6.2 | ARCHITECTURE | 08-dependency-rules.md |
| Circular Dependency Rule (no cycles; extract to shared) | §6.3 | ARCHITECTURE | 08-dependency-rules.md |
| DAG Principle (system forms a Directed Acyclic Graph) | §6.4 | ARCHITECTURE | 08-dependency-rules.md |
| UI Ownership Rule (UI belongs to the feature that owns the domain) | §7 | ARCHITECTURE | 09-ui-ownership.md |
| Shared UI Exception (shared UI only if domain-neutral) | §7 | ARCHITECTURE | 09-ui-ownership.md |
| Final Architectural Principles (8 system axioms) | §8 | ARCHITECTURE | 12-final-principles.md |

---

## Summary

| Classification | Rule Count |
|---|---|
| ARCHITECTURE | 30 |
| GOVERNANCE | 4 |
| BORDERLINE | 8 |

---

## Governance Rules That Should Also Live in a Governance Policy Document

These rules currently live in the architecture contract. They have a legitimate home there
(as architectural constraints), but they are also appropriate candidates for a separate
governance/quality policy that tooling can enforce independently.

| Rule | Numeric Limit | Governance Policy File (suggested) |
|---|---|---|
| File Size & Decomposition Rule | 300 lines maximum | `CONTRACTS/Governance/file-size-policy.md` |
| Controller Fan-Out Rule | 5 collaborators maximum | `CONTRACTS/Governance/controller-policy.md` |
| Maximum Folder Depth Rule | 3 levels below feature root | `CONTRACTS/Governance/folder-depth-policy.md` |
| File Naming Rule | Layer-encoded suffix conventions | `CONTRACTS/Governance/naming-policy.md` |

These are governance leakages in the sense that they are numerical policies, not
structural definitions. However, they do not violate the architecture contract by
being present here. They should remain in the architecture contract as architectural
expectations, and may additionally be copied to a governance policy document for
tooling enforcement.

**Recommendation:** Do not remove them from the architecture contract. Extract copies
to a future `CONTRACTS/Governance/` directory if governance tooling needs to reference
them independently.

---

## Borderline Rules — Analysis

**`.select('*')` ban (§2.1)**
The prohibition on wildcard column selection is an operational safety rule (prevents
data leakage, reduces payload, stabilizes projections). It is stated inside the DAL
architectural contract because it is a direct consequence of the DAL's role (raw rows,
explicit projections). It is an architecture anchor. However, it could also be enforced
via a lint rule or code review policy. Recommended: keep in architecture contract;
optionally reference in governance policy.

**File Naming Rule (§4.5)**
Naming conventions encode layer identity. A file named `foo.controller.js` communicates
its architectural role without opening it. This is an architectural principle (§8: "The
role of a file should be obvious from its name"). However, specific extension conventions
are governance-level details. Recommended: keep in 11-naming-conventions.md; cross-link
to §8 Final Principles.

**Single Responsibility File Rule (§4.2)**
The principle (one coherent responsibility per file) is architectural. The enforcement
form (comparing against 300-line budget) is governance. Recommended: keep in
10-structural-integrity.md alongside §4.1.

**Decomposition must follow architectural layer boundaries (§4.1)**
This constraint on *how* to decompose is architectural — it prevents decomposition that
violates layer contracts. Recommended: keep in 10-structural-integrity.md with explicit
cross-link to 03-layer-contracts.md.
