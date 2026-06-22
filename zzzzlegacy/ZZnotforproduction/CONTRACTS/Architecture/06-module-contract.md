# Module Contract
## VCSM Architecture Contract — §5.7 Module Contract (Locked)

> **Source:** [ARCHITECTURE.md](ARCHITECTURE.md) — Lines 954–1103
> **Status:** Locked — no changes without explicit contract revision
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [05-feature-boundaries.md](05-feature-boundaries.md)
> **Cross-Links:** [08-dependency-rules.md](08-dependency-rules.md)

---

## §5.7 Module Contract (Locked)

> Purpose: Modules are capability boundaries inside a feature. They answer one question only: Which coherent business capability does this part of the feature own?

### Definition

A Feature owns a business domain.

A Module owns a separable capability within that domain.

A Behavior owns a single user or system action within a module.

Architecture hierarchy:

txt Application   → Feature       → Module           → Behavior               → Layer 

Example:

txt Feature: chat    Module: messages     → send message     → edit message     → delete message    Module: presence     → show typing     → show online status 

---

### Module Ownership Rule

Each module must have a clearly defined responsibility.

A module must answer a single capability question.

Examples:

txt chat/messages → owns message lifecycle  chat/presence → owns realtime presence  booking/availability → owns availability calculations  booking/reservations → owns reservation workflows 

A module must not own unrelated responsibilities.

---

### Module Boundary Rule

Modules are internal boundaries of a feature.

Modules may collaborate with other modules in the same feature.

Modules must not expose internal implementation details outside the feature.

Cross-feature access must still occur through the feature's adapter boundary.

Modules must not become independent features unless ownership and responsibility justify extraction.

---

### Module Dependency Rule

Dependency direction inside a feature must remain one-way.

Allowed:

txt Module A   → Shared Utility  Module A   → Module Adapter  Module A   → Shared Engine 

Forbidden:

txt Module A   → Module B internal DAL  Module A   → Module B controller  Module A   → Module B hook 

If module-to-module communication is required, it must occur through:

txt module adapter controller contract shared feature service approved engine boundary 

---

### Module Structure Rule

Modules may be physical or declared.

Physical module:

txt src/features/<feature>/modules/<module>/ 

Declared module:

txt module-map.json 

A module does not require a specific folder structure if ownership and boundaries are clearly declared.

Modules may contain:

txt dal/ model/ controller/ hooks/ components/ screens/ resolvers/ tests/ BEHAVIOR.md 

Modules are not required to contain every layer.

A module may delegate responsibility through approved architectural boundaries.

---

### Module Isolation Rule

A module owns its:

- behaviors
- controllers
- data contracts
- tests
- documentation

A module must not duplicate:

- another module's business rules
- another module's DAL logic
- another module's ownership rules
- another module's behavior definitions

If multiple modules require the same capability, the capability must be extracted into:

txt shared/ engine/ approved feature service 

---

### Module Documentation Rule

Every module should be discoverable through governance tooling.

Modules should declare:

- module name
- owning feature
- purpose
- owner
- behaviors
- dependencies
- public module surface

Modules may be documented through:

txt BEHAVIOR.md module-map.json ARCHITECT reports governance maps 

---

### Module Architectural Principle

Features define domains.

Modules define capabilities.

Behaviors define actions.

Layers implement behaviors.

Ownership must become more specific as the hierarchy moves downward.

txt Feature   → What domain exists?  Module   → What capability exists?  Behavior   → What action exists?  Layer   → How is the action implemented? 
