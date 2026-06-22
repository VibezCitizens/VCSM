# System Contracts — Index

> **Concern:** Repository boundary isolation and codebase structural rules
> **Source contracts (canonical, untouched):** 2 files at CONTRACTS/ root
> **Library files:** 6 derived files in this folder

---

## Source Contracts

| Source | Lines | Core Concern |
|---|---|---|
| [PROJECT_BOUNDARY_ISOLATION_CONTRACT.md](../PROJECT_BOUNDARY_ISOLATION_CONTRACT.md) | 218 | Strict project boundary isolation across all repository roots |
| [SINGLE_SOURCE_ACTOR_ARCHITECTURE.md](../SINGLE_SOURCE_ACTOR_ARCHITECTURE.md) | 196 | Actor identity ownership model in VCSM |

---

## Library Files — Reading Order

### Project Boundary Isolation (PROJECT_BOUNDARY_ISOLATION_CONTRACT.md)

| # | File | Sections Covered |
|---|---|---|
| 01 | [01-boundary-core.md](01-boundary-core.md) | Purpose, Protected Project Roots, Core Rule, Cross-Boundary Modification Rule |
| 02 | [02-boundary-scope.md](02-boundary-scope.md) | Allowed Scope Labels, Default Assumption |
| 03 | [03-boundary-enforcement.md](03-boundary-enforcement.md) | Engine Rule, Traffic Rule, No Silent Refactors, Documentation Scope, Debugging Scope, Database Rule, Planning Rule, Command Integration, Violation Rule, Command Principle |

### Single-Source Actor Architecture (SINGLE_SOURCE_ACTOR_ARCHITECTURE.md)

| # | File | Sections Covered |
|---|---|---|
| 04 | [04-actor-core-rule.md](04-actor-core-rule.md) | Goal, Core Rule (what must NOT own actor state) |
| 05 | [05-actor-ten-rules.md](05-actor-ten-rules.md) | 10 Architecture Rules (Rules 1–10) |
| 06 | [06-actor-enforcement.md](06-actor-enforcement.md) | Final Principle, Enforcement, Review Check |

---

## Machine Reading Index

| Enforcement Point | Source Contract | Library File |
|---|---|---|
| Only touch files within declared project root | PROJECT_BOUNDARY | [01-boundary-core.md](01-boundary-core.md) |
| Cross-boundary modification forbidden without declared scope | PROJECT_BOUNDARY | [01-boundary-core.md](01-boundary-core.md) |
| Scope label must be declared before execution | PROJECT_BOUNDARY | [02-boundary-scope.md](02-boundary-scope.md) |
| Default assumption: single project boundary only | PROJECT_BOUNDARY | [02-boundary-scope.md](02-boundary-scope.md) |
| Engine changes require ENGINE-[name] scope label | PROJECT_BOUNDARY | [03-boundary-enforcement.md](03-boundary-enforcement.md) |
| No file moves between roots without explicit approval | PROJECT_BOUNDARY | [03-boundary-enforcement.md](03-boundary-enforcement.md) |
| Violation must be reported immediately | PROJECT_BOUNDARY | [03-boundary-enforcement.md](03-boundary-enforcement.md) |
| Only IdentityProvider writes actor state via setIdentity() | SINGLE_SOURCE_ACTOR | [04-actor-core-rule.md](04-actor-core-rule.md) |
| These must NOT own actor state: feed viewer store, useState(actorId), etc. | SINGLE_SOURCE_ACTOR | [04-actor-core-rule.md](04-actor-core-rule.md) |
| All consumers must read from useIdentity() | SINGLE_SOURCE_ACTOR | [05-actor-ten-rules.md](05-actor-ten-rules.md) |
| actorId must be in all actor-dependent query keys | SINGLE_SOURCE_ACTOR | [05-actor-ten-rules.md](05-actor-ten-rules.md) |
| switchActor() must be version-guarded | SINGLE_SOURCE_ACTOR | [05-actor-ten-rules.md](05-actor-ten-rules.md) |
| No feature may store current actor independently | SINGLE_SOURCE_ACTOR | [05-actor-ten-rules.md](05-actor-ten-rules.md) |
| Any independent actor state = contract violation | SINGLE_SOURCE_ACTOR | [06-actor-enforcement.md](06-actor-enforcement.md) |
| Review check grep patterns for useState/useRef/useMemo actor patterns | SINGLE_SOURCE_ACTOR | [06-actor-enforcement.md](06-actor-enforcement.md) |

---

## Cross-Link Graph

```
01-boundary-core.md  ↔  02-boundary-scope.md
  (core rule prerequisite for scope label system)

02-boundary-scope.md  ↔  03-boundary-enforcement.md
  (scope labels govern enforcement decisions)

04-actor-core-rule.md  ↔  05-actor-ten-rules.md
  (core rule is prerequisite for 10 rules)

05-actor-ten-rules.md  ↔  06-actor-enforcement.md
  (10 rules define what review check enforces)

Security/02-auth-authorization.md  ↔  04-actor-core-rule.md
  (authorization layer and actor identity model are related)
```
