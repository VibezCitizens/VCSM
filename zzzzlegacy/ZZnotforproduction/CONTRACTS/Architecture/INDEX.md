# VCSM Architecture Contract — Index

> **Document Type:** Architecture Contract Index
> **Source Contracts:**
> - [ARCHITECTURE.md](ARCHITECTURE.md) — Locked. Core layer, feature, and structural rules (§1–14).
> - [ARCHITECTURE_GOVERNANCE_CONTRACT.md](../ARCHITECTURE_GOVERNANCE_CONTRACT.md) — Sprint review, feature health metrics, server-state discipline (§15–20).
> **Status:** Locked — this index mirrors the structure of both source contracts
> **Scope:** All code in `apps/VCSM/` and `apps/wentrex/`
> **Intended Readers:** All engineers and commands working in this codebase
> **Change Rule:** Wording changes require contract revision; formatting changes must preserve all meaning

This architecture enforces clear ownership of meaning, authority, and responsibility across the system.

Each layer answers exactly one question and nothing more.

The system is designed to remain:

- modular
- predictable
- scalable
- refactorable
- safe for multiple engineers

---

## Agent Behavioral Rules

This contract defines layer responsibilities, identity rules, and structural constraints.

For the behavioral rules that govern how AI/code agents must operate in this codebase
(ticket workflow, surgical change rules, approval gates, validation requirements,
rejection triggers, and output standards), read the canonical skill files:

- **Execution contract:** `zNOTFORPRODUCTION/_CANONICAL/skills/vcsm/SKILL.md`
- **Contributor quality gate:** `zNOTFORPRODUCTION/_CANONICAL/skills/vcsm-contributor/SKILL.md`

These documents are separate from this contract. This contract defines architecture.
Those documents define how agents must behave while implementing it.

---

## Reading Order

Read these files in order for a full contract orientation. Each file is self-contained
and may also be read in isolation for targeted review.

| Order | File | What It Covers |
|---|---|---|
| 1 | [01-core-principles.md](01-core-principles.md) | System design goals; import path rule; module build order |
| 2 | [02-identity-contract.md](02-identity-contract.md) | Actor identity model (first-class actors, equality, canonical identity, active actor rule, feed participation rule, ownership, void reservation); identity surface rule; owner meaning rule |
| 3 | [03-layer-contracts.md](03-layer-contracts.md) | DAL, Model, Controller, Hook, Component, View Screen, Final Screen, Shared Layer |
| 4 | [04-resolver-contract.md](04-resolver-contract.md) | Resolver DI factory pattern; `setup.js` wiring |
| 5 | [05-feature-boundaries.md](05-feature-boundaries.md) | Feature containment; cross-feature isolation; recommended structure |
| 6 | [06-module-contract.md](06-module-contract.md) | Module ownership; module boundaries; module hierarchy |
| 7 | [07-adapter-contract.md](07-adapter-contract.md) | Adapter public surface; adapter import rule; screen access rule |
| 8 | [08-dependency-rules.md](08-dependency-rules.md) | Dependency direction; feature dependency; circular dependency; DAG principle |
| 9 | [09-ui-ownership.md](09-ui-ownership.md) | UI domain ownership; cross-feature UI access |
| 10 | [10-structural-integrity.md](10-structural-integrity.md) | File size; single responsibility; controller fan-out; folder depth |
| 11 | [11-naming-conventions.md](11-naming-conventions.md) | Layer-encoded file naming conventions |
| 13 | [13-ui-purity-rule.md](13-ui-purity-rule.md) | UI purity — no business logic, validation, or infrastructure in screens or components |
| 14 | [14-styling-ownership-rule.md](14-styling-ownership-rule.md) | Styling ownership — tokens required, no hardcoded values in components or screens |
| 15 | [12-final-principles.md](12-final-principles.md) | System axioms — final architectural principles |

---

## Architecture Governance Contract — Library Files (§15–20)

Source: [ARCHITECTURE_GOVERNANCE_CONTRACT.md](../ARCHITECTURE_GOVERNANCE_CONTRACT.md) · Local enforcement: `.claude/contracts/architecture-governance.md`

| Order | File | What It Covers |
|---|---|---|
| 15 | [15-sprint-review-rule.md](15-sprint-review-rule.md) | Bi-weekly architecture review requirement; merge gate for locked contract violations |
| 16 | [16-feature-health-metrics.md](16-feature-health-metrics.md) | 14 measurable health metrics per feature; metric definitions and usage |
| 17 | [17-folder-depth-enforcement.md](17-folder-depth-enforcement.md) | Max 3 directory levels below feature root; extraction rule |
| 18 | [18-react-query-server-state.md](18-react-query-server-state.md) | React Query as standard; forbidden manual useState+useEffect server fetch patterns |
| 19 | [19-ttl-cache-deprecation.md](19-ttl-cache-deprecation.md) | DAL-level TTL caches deprecated; migration to React Query required |
| 20 | [20-zustand-scope.md](20-zustand-scope.md) | Zustand scope: UI-only ephemeral state; server/ownership/permission data forbidden |

---

## Automated Architecture Enforcement Contract — Library Files (§21–24)

Source: [AUTOMATED_ARCHITECTURE_ENFORCEMENT_CONTRACT.md](../AUTOMATED_ARCHITECTURE_ENFORCEMENT_CONTRACT.md) · Local enforcement: `.claude/contracts/automated-architecture-enforcement.md`

| Order | File | What It Covers |
|---|---|---|
| 21 | [21-automated-checks-rule.md](21-automated-checks-rule.md) | Minimum required automated checks — 12 violations that must be caught before human review |
| 22 | [22-eslint-enforcement-rule.md](22-eslint-enforcement-rule.md) | ESLint coverage — import boundaries, layer imports, Supabase, naming, adapter exports |
| 23 | [23-architecture-script-rule.md](23-architecture-script-rule.md) | CI scripts — file size, depth, feature counts, `.select('*')`, React Query, TTL, Zustand |
| 24 | [24-enforcement-philosophy.md](24-enforcement-philosophy.md) | Severity matrix: ERROR/WARNING thresholds; promotion protocol from WARNING to ERROR |

---

## Feature Size Governance Contract — Library Files (§25–29)

Source: [FEATURE_SIZE_GOVERNANCE_CONTRACT.md](../FEATURE_SIZE_GOVERNANCE_CONTRACT.md) · Local enforcement: `.claude/contracts/feature-size-governance.md`

| Order | File | What It Covers |
|---|---|---|
| 25 | [25-mega-feature-prevention-rule.md](25-mega-feature-prevention-rule.md) | Core rule — feature must not grow without architectural review |
| 26 | [26-feature-size-thresholds.md](26-feature-size-thresholds.md) | 6-tier threshold table: healthy/monitor/review/extraction/blocked/critical |
| 27 | [27-feature-review-actions.md](27-feature-review-actions.md) | Required actions at 100/150/200 file thresholds |
| 28 | [28-god-folder-definition.md](28-god-folder-definition.md) | God folder definition and 6 signs; triggers extraction regardless of count |
| 29 | [29-extraction-rule.md](29-extraction-rule.md) | Extraction protocol — when to extract, completion criteria, examples |

---

## Adapter Revision Stamp Contract — Library Files (§30)

Source: [ADAPTER_REVISION_STAMP_CONTRACT.md](../ADAPTER_REVISION_STAMP_CONTRACT.md) · Local enforcement: `.claude/contracts/adapter-revision-stamp.md`

| Order | File | What It Covers |
|---|---|---|
| 30 | [30-adapter-revision-rule.md](30-adapter-revision-rule.md) | @adapter stamp format, all fields, blast radius definitions, requiresDeepReview rule, enforcement severity |

---

## Route Lazy Boundary Contract — Library Files (§31)

Source: [ROUTE_LAZY_BOUNDARY_CONTRACT.md](../ROUTE_LAZY_BOUNDARY_CONTRACT.md)

| Order | File | What It Covers |
|---|---|---|
| 31 | [31-route-lazy-boundary.md](31-route-lazy-boundary.md) | Approved manifest files for React.lazy(), allowed and forbidden import targets, screen surface requirement, enforcement severity |

---

## Internal Feature Self-Import Contract — Library Files (§32)

Source: [INTERNAL_FEATURE_SELF_IMPORT_CONTRACT.md](../INTERNAL_FEATURE_SELF_IMPORT_CONTRACT.md)

| Order | File | What It Covers |
|---|---|---|
| 32 | [32-internal-feature-self-import.md](32-internal-feature-self-import.md) | Adapter boundary scope (external only), layer direction rule, inverted import ERROR, cross-feature rule unchanged |

---

## Authentication vs Authorization Separation Contract — Library Files (§33)

Source: [AUTH_AUTHZ_SEPARATION_CONTRACT.md](../AUTH_AUTHZ_SEPARATION_CONTRACT.md)

| Order | File | What It Covers |
|---|---|---|
| 33 | [33-auth-authz-separation.md](33-auth-authz-separation.md) | Auth scope definition, authorization scope definition, structural mixing violations, per-layer enforcement table, ERROR/HIGH severity matrix |

---

## Section Ownership

| Original Section | Library File |
|---|---|
| §1 Global Rules | [01-core-principles.md](01-core-principles.md) |
| §1.0 Actor Identity Model | [02-identity-contract.md](02-identity-contract.md) |
| §1.3 Identity Surface Rule | [02-identity-contract.md](02-identity-contract.md) |
| §1.4 Owner Meaning Rule | [02-identity-contract.md](02-identity-contract.md) |
| §2 Core Layer Contracts | [03-layer-contracts.md](03-layer-contracts.md) |
| §2.8 Resolver Contract | [04-resolver-contract.md](04-resolver-contract.md) |
| §3 Shared Layer Contract | [03-layer-contracts.md](03-layer-contracts.md) |
| §4.1–4.4 Structural Integrity Rules | [10-structural-integrity.md](10-structural-integrity.md) |
| §4.5 File Naming Rule | [11-naming-conventions.md](11-naming-conventions.md) |
| §5.1–5.2 Feature Boundary Rules | [05-feature-boundaries.md](05-feature-boundaries.md) |
| §5.3–5.5 Adapter Rules | [07-adapter-contract.md](07-adapter-contract.md) |
| §5.6 Recommended Feature Structure | [05-feature-boundaries.md](05-feature-boundaries.md) |
| §5.7 Module Contract | [06-module-contract.md](06-module-contract.md) |
| §6 Dependency Rules | [08-dependency-rules.md](08-dependency-rules.md) |
| §7 UI Ownership Rule | [09-ui-ownership.md](09-ui-ownership.md) |
| §8 UI Purity Rule | [13-ui-purity-rule.md](13-ui-purity-rule.md) |
| §9 Styling Ownership Rule | [14-styling-ownership-rule.md](14-styling-ownership-rule.md) |
| §10 Final Architectural Principles | [12-final-principles.md](12-final-principles.md) |

---

## Cross-Links

```
03-layer-contracts.md
  ↔ 05-feature-boundaries.md   (feature containment depends on layer ownership)
  ↔ 08-dependency-rules.md     (dependency direction enforces layer hierarchy)
  ↔ 10-structural-integrity.md (decomposition must follow layer boundaries)

05-feature-boundaries.md
  ↔ 06-module-contract.md      (modules are internal boundaries of features)
  ↔ 07-adapter-contract.md     (adapters are the public surface of features)
  ↔ 08-dependency-rules.md     (feature dependency rules follow from feature isolation)

06-module-contract.md
  ↔ 05-feature-boundaries.md   (modules live inside features)
  ↔ 08-dependency-rules.md     (module dependency rules follow DAG principle)

07-adapter-contract.md
  ↔ 05-feature-boundaries.md   (adapters enforce feature boundaries)
  ↔ 09-ui-ownership.md         (UI access across features must go through adapters)

09-ui-ownership.md
  ↔ 07-adapter-contract.md     (cross-feature UI must go through adapters)
  ↔ 13-ui-purity-rule.md       (UI ownership pairs with UI purity)

13-ui-purity-rule.md
  ↔ 03-layer-contracts.md      (purity rule enforces the layer ownership defined there)
  ↔ 09-ui-ownership.md         (UI purity pairs with UI ownership)
  ↔ 14-styling-ownership-rule.md (purity and styling rules are companion constraints on the UI layer)

14-styling-ownership-rule.md
  ↔ 13-ui-purity-rule.md       (styling ownership pairs with UI purity)
  ↔ 03-layer-contracts.md      (component contract forbids hardcoded design values)
  ↔ 12-final-principles.md     (composition lives in Screens; shape lives in Models)

08-dependency-rules.md
  ↔ 03-layer-contracts.md      (layer contracts define what may depend on what)
  ↔ 05-feature-boundaries.md   (cross-feature dependency uses adapters)
  ↔ 06-module-contract.md      (module dependency rules)

02-identity-contract.md
  ↔ 03-layer-contracts.md      (controller and hook layers consume identity)
  ↔ 04-resolver-contract.md    (resolver injects identity into engines)

04-resolver-contract.md
  ↔ 03-layer-contracts.md      (resolver is DAL-equivalent in privilege)
  ↔ 11-naming-conventions.md   (resolver naming conventions)

11-naming-conventions.md
  ↔ 03-layer-contracts.md      (naming encodes layer role)
  ↔ 04-resolver-contract.md    (resolver naming)
  ↔ 12-final-principles.md     (role of a file should be obvious from its name)

12-final-principles.md
  ↔ 01-core-principles.md      (foundational rules)
  ↔ 03-layer-contracts.md      (meaning lives in controllers, shape lives in models, etc.)
  ↔ 08-dependency-rules.md     (architecture grows horizontally, not vertically)
```

---

## Machine Reading Index

| Enforcement Point | Original Section | Library File |
|---|---|---|
| Import path format (`@/...`) | §1.1 Import Path Rule | [01-core-principles.md](01-core-principles.md) |
| Layer build order | §1.2 Module Build Order Rule | [01-core-principles.md](01-core-principles.md) |
| Actor kinds: `user`, `vport` (void reserved) | §1.0 Actor Identity Model | [02-identity-contract.md](02-identity-contract.md) |
| `actorId` = `vc.actors.id` only | §1.0 Canonical Identity | [02-identity-contract.md](02-identity-contract.md) |
| Active actor determines authorship/permissions/dashboard/inbox/profile scope | §1.0 Active Actor Rule | [02-identity-contract.md](02-identity-contract.md) |
| Active actor does NOT determine feed membership — feed rules govern that | §1.0 Feed Participation Rule | [02-identity-contract.md](02-identity-contract.md) |
| Citizen and VPORT may both publish into the same public feed | §1.0 Feed Participation Rule | [02-identity-contract.md](02-identity-contract.md) |
| Ownership via `vc.actor_owners`; never inferred from profileId/userId | §1.0 Ownership Rule | [02-identity-contract.md](02-identity-contract.md) |
| Citizen and VPORT share the same public realm — `realmId` is not the current separator | §1.0 Current Realm State | [02-identity-contract.md](02-identity-contract.md) |
| `realmId` is future-ready infrastructure; current separators are `actorId` and `kind` | §1.0 Current Realm State | [02-identity-contract.md](02-identity-contract.md) |
| Identity fields (`actorId`, `kind` only) | §1.3 Identity Surface Rule | [02-identity-contract.md](02-identity-contract.md) |
| Owner = Actor Owner via `actor_owners` | §1.4 Owner Meaning Rule | [02-identity-contract.md](02-identity-contract.md) |
| `.select('*')` ban | §2.1 DAL Contract | [03-layer-contracts.md](03-layer-contracts.md) |
| File size limit (300 lines) | §4.1 File Size & Decomposition Rule | [10-structural-integrity.md](10-structural-integrity.md) |
| Single responsibility per file | §4.2 Single Responsibility File Rule | [10-structural-integrity.md](10-structural-integrity.md) |
| Controller max 5 collaborators | §4.3 Controller Fan-Out Rule | [10-structural-integrity.md](10-structural-integrity.md) |
| Max folder depth (3 levels below feature root) | §4.4 Maximum Folder Depth Rule | [10-structural-integrity.md](10-structural-integrity.md) |
| File naming conventions | §4.5 File Naming Rule | [11-naming-conventions.md](11-naming-conventions.md) |
| Feature internal isolation | §5.1 Feature Containment Rule | [05-feature-boundaries.md](05-feature-boundaries.md) |
| Cross-feature access via adapters only | §5.2 Cross-Feature Boundary Rule | [05-feature-boundaries.md](05-feature-boundaries.md) |
| Adapter as public surface | §5.3 Adapter Contract | [07-adapter-contract.md](07-adapter-contract.md) |
| Dependency direction (one-way) | §6.1 Dependency Direction Rule | [08-dependency-rules.md](08-dependency-rules.md) |
| No circular dependencies | §6.3 Circular Dependency Rule | [08-dependency-rules.md](08-dependency-rules.md) |
| UI ownership stays in feature | §7 UI Ownership Rule | [09-ui-ownership.md](09-ui-ownership.md) |
| No business logic / validation / DB access in screens or components | §8 UI Purity Rule | [13-ui-purity-rule.md](13-ui-purity-rule.md) |
| No hardcoded colors / spacing / z-index — tokens required | §9 Styling Ownership Rule | [14-styling-ownership-rule.md](14-styling-ownership-rule.md) |
| Resolver layer naming (`.resolver.js`, `resolvers/` folder) | §2.8 Resolver Contract | [04-resolver-contract.md](04-resolver-contract.md) |
| Architecture review required every sprint/bi-weekly cycle | §15 Governance | [15-sprint-review-rule.md](15-sprint-review-rule.md) |
| Feature not merge-ready if locked contract violated without exception | §15 Governance | [15-sprint-review-rule.md](15-sprint-review-rule.md) |
| 14 health metrics tracked per feature | §16 Governance | [16-feature-health-metrics.md](16-feature-health-metrics.md) |
| Max folder depth: 3 levels below feature root | §17 Governance | [17-folder-depth-enforcement.md](17-folder-depth-enforcement.md) |
| React Query required for all server state | §18 Governance | [18-react-query-server-state.md](18-react-query-server-state.md) |
| No new useState+useEffect server-fetch patterns | §18 Governance | [18-react-query-server-state.md](18-react-query-server-state.md) |
| No new DAL-level TTL caches without approval | §19 Governance | [19-ttl-cache-deprecation.md](19-ttl-cache-deprecation.md) |
| Zustand allowed only for UI-only ephemeral state | §20 Governance | [20-zustand-scope.md](20-zustand-scope.md) |
| Zustand must not store server data, ownership, or permission truth | §20 Governance | [20-zustand-scope.md](20-zustand-scope.md) |
| Automated checks required before human review | §21 Enforcement | [21-automated-checks-rule.md](21-automated-checks-rule.md) |
| ESLint must enforce import boundaries, forbidden layers, Supabase access, naming | §22 Enforcement | [22-eslint-enforcement-rule.md](22-eslint-enforcement-rule.md) |
| Scripts check file size, depth, feature counts, React Query adoption, TTL, Zustand | §23 Enforcement | [23-architecture-script-rule.md](23-architecture-script-rule.md) |
| ERROR: cross-feature imports, `.select('*')`, Supabase in UI/hooks, 300+ lines | §24 Enforcement | [24-enforcement-philosophy.md](24-enforcement-philosophy.md) |
| Feature must not grow without architectural review | §25 Size Governance | [25-mega-feature-prevention-rule.md](25-mega-feature-prevention-rule.md) |
| File count thresholds: 100 review, 150 extraction, 200 blocked, 300 critical | §26 Size Governance | [26-feature-size-thresholds.md](26-feature-size-thresholds.md) |
| Required actions at 100, 150, and 200 file thresholds | §27 Size Governance | [27-feature-review-actions.md](27-feature-review-actions.md) |
| Feature with 3+ god-folder signs requires immediate extraction plan | §28 Size Governance | [28-god-folder-definition.md](28-god-folder-definition.md) |
| Extraction complete only when new feature has adapter and no circular imports | §29 Size Governance | [29-extraction-rule.md](29-extraction-rule.md) |
| Every adapter file must include @adapter revision stamp | §30 Adapter Stamp | [30-adapter-revision-rule.md](30-adapter-revision-rule.md) |
| @blastRadius critical adapter modified without THOR gate is MERGE_BLOCKED | §30 Adapter Stamp | [30-adapter-revision-rule.md](30-adapter-revision-rule.md) |
| @requiresDeepReview true adapter must not be modified without deep review | §30 Adapter Stamp | [30-adapter-revision-rule.md](30-adapter-revision-rule.md) |
| Dynamic imports via React.lazy() only in lazyApp.jsx and lazyPublic.jsx | §31 Route Lazy Boundary | [31-route-lazy-boundary.md](31-route-lazy-boundary.md) |
| Manifest must never lazy-import DAL, models, hooks, controllers, or internal components | §31 Route Lazy Boundary | [31-route-lazy-boundary.md](31-route-lazy-boundary.md) |
| Lazy-imported screen must be on adapter public surface or route surface manifest | §31 Route Lazy Boundary | [31-route-lazy-boundary.md](31-route-lazy-boundary.md) |
| Adapter boundary applies to external consumers only — same-feature internal imports allowed | §32 Self-Import | [32-internal-feature-self-import.md](32-internal-feature-self-import.md) |
| Internal imports must follow layer direction: screens → hooks → controllers → models → DAL | §32 Self-Import | [32-internal-feature-self-import.md](32-internal-feature-self-import.md) |
| Lower layer importing upper layer within same feature is ERROR | §32 Self-Import | [32-internal-feature-self-import.md](32-internal-feature-self-import.md) |
| Auth and authorization must never be mixed in the same feature, controller, DAL, hook, or screen | §33 Auth/Authz Separation | [33-auth-authz-separation.md](33-auth-authz-separation.md) |
| Auth scope: login/logout/registration/session — must not check ownership or permissions | §33 Auth/Authz Separation | [33-auth-authz-separation.md](33-auth-authz-separation.md) |
| Authorization scope: ownership/permission gates — must not call supabase.auth.* or manage sessions | §33 Auth/Authz Separation | [33-auth-authz-separation.md](33-auth-authz-separation.md) |
| Mixed feature containing both auth flow and permission gates is ERROR | §33 Auth/Authz Separation | [33-auth-authz-separation.md](33-auth-authz-separation.md) |

---

## Layer Responsibility Summary

| Layer | Answers | May | Must Not |
|---|---|---|---|
| **DAL** | What does the database say? | import Supabase; call select/insert/update/delete/rpc; define explicit column projections | apply business rules; apply authorization logic; normalize, rename, or map fields; derive flags or meaning; import models, controllers, hooks, components, or screens |
| **Model** | What does this data mean to the application? | rename fields (snake_case → camelCase); derive booleans; normalize optional or nullable fields | import Supabase; perform database access or mutations; enforce permissions or ownership; contain business rules |
| **Controller** | Is this action allowed, and what is the correct domain result? | call DAL functions; call Models; call other controllers only when explicitly justified | import Supabase directly; import React or UI; hold component or UI state; return raw database rows; perform routing or navigation |
| **Hook** | When should this use-case run, and how should the UI respond? | use React APIs; hold UI state; call controllers; subscribe to realtime updates; coordinate multiple controllers | import Supabase; call DAL functions; apply business rules; infer permissions or ownership; transform domain meaning |
| **Component** | How does this UI piece render given props and local UI state? | receive data and callbacks via props; use local UI state; render styling and layout; emit user intents | import Supabase; import DAL; call controllers directly; contain business rules; contain permissions logic; persist or derive domain state |
| **View Screen** | How does this domain experience behave and render? | call domain hooks; coordinate multiple hooks; compose UI components; hold view-local UI state | import DAL; import Supabase; call controllers directly; enforce permissions or business rules; interpret raw database data |
| **Final Screen** | Given route and identity, which experience should exist? | read route params and search state; read global app context; perform hard guards; choose which View Screen to render; provide layout scaffolding | import DAL; import models; import controllers; execute business logic; fetch or mutate data; interpret domain data |
| **Resolver** | What VCSM-specific data does this shared engine need to do its job? | import Supabase; query Supabase directly (initialized-DAL pattern); return injectable factory closures | be imported by components, hooks, screens, or controllers; be called directly at runtime outside of `setup.js` DI wiring; apply business rules; contain UI logic |
