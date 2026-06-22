# VCSM Architecture Contract (Locked)

> **Document Type:** Architecture Contract
> **Intended Readers:** All engineers working in `apps/VCSM/`
> **Scope:** All code in `apps/VCSM/`
> **Status:** Locked — no changes without explicit contract revision
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

## Table of Contents

1. [Global Rules (Locked)](#1-global-rules-locked)
   - 1.1 [Import Path Rule](#11-import-path-rule)
   - 1.2 [Module Build Order Rule](#12-module-build-order-rule)
   - 1.3 [Identity Surface Rule](#13-identity-surface-rule)
   - 1.4 [Owner Meaning Rule](#14-owner-meaning-rule)
2. [Core Layer Contracts (Locked)](#2-core-layer-contracts-locked)
   - 2.1 [Data Access Layer (DAL) Contract](#21-data-access-layer-dal-contract)
   - 2.2 [Model Contract](#22-model-contract)
   - 2.3 [Controller Contract](#23-controller-contract)
   - 2.4 [Hook Contract](#24-hook-contract)
   - 2.5 [Component Contract](#25-component-contract)
   - 2.6 [View Screen Contract](#26-view-screen-contract)
   - 2.7 [Final Screen Contract](#27-final-screen-contract)
   - 2.8 [Resolver Contract](#28-resolver-contract)
3. [Shared Layer Contract (Locked)](#3-shared-layer-contract-locked)
4. [Structural Integrity Rules (Locked)](#4-structural-integrity-rules-locked)
   - 4.1 [File Size & Decomposition Rule](#41-file-size--decomposition-rule)
   - 4.2 [Single Responsibility File Rule](#42-single-responsibility-file-rule)
   - 4.3 [Controller Fan-Out Rule](#43-controller-fan-out-rule)
   - 4.4 [Maximum Folder Depth Rule](#44-maximum-folder-depth-rule)
   - 4.5 [File Naming Rule](#45-file-naming-rule)
5. [Feature Boundary Rules (Locked)](#5-feature-boundary-rules-locked)
   - 5.1 [Feature Containment Rule](#51-feature-containment-rule)
   - 5.2 [Cross-Feature Boundary Rule](#52-cross-feature-boundary-rule)
   - 5.3 [Adapter Contract](#53-adapter-contract)
   - 5.4 [Adapter Import Rule](#54-adapter-import-rule)
   - 5.5 [Screen-to-Feature Access Rule](#55-screen-to-feature-access-rule)
   - 5.6 [Recommended Feature Structure](#56-recommended-feature-structure)
6. [Dependency Rules (Locked)](#6-dependency-rules-locked)
   - 6.1 [Dependency Direction Rule](#61-dependency-direction-rule)
   - 6.2 [Feature Dependency Rule](#62-feature-dependency-rule)
   - 6.3 [Circular Dependency Rule](#63-circular-dependency-rule)
   - 6.4 [DAG Principle](#64-dag-principle)
7. [UI Ownership Rule (Locked)](#7-ui-ownership-rule-locked)
8. [Final Architectural Principles (Locked)](#8-final-architectural-principles-locked)

---

## Machine Reading Index

| Enforcement Point | Section |
|---|---|
| Import path format (`@/...`) | [§1.1 Import Path Rule](#11-import-path-rule) |
| Layer build order | [§1.2 Module Build Order Rule](#12-module-build-order-rule) |
| Identity fields (`actorId`, `kind` only) | [§1.3 Identity Surface Rule](#13-identity-surface-rule) |
| Owner = Actor Owner via `actor_owners` | [§1.4 Owner Meaning Rule](#14-owner-meaning-rule) |
| `.select('*')` ban | [§2.1 DAL Contract](#21-data-access-layer-dal-contract) |
| File size limit (300 lines) | [§4.1 File Size & Decomposition Rule](#41-file-size--decomposition-rule) |
| Single responsibility per file | [§4.2 Single Responsibility File Rule](#42-single-responsibility-file-rule) |
| Controller max 5 collaborators | [§4.3 Controller Fan-Out Rule](#43-controller-fan-out-rule) |
| Max folder depth (3 levels below feature root) | [§4.4 Maximum Folder Depth Rule](#44-maximum-folder-depth-rule) |
| File naming conventions | [§4.5 File Naming Rule](#45-file-naming-rule) |
| Feature internal isolation | [§5.1 Feature Containment Rule](#51-feature-containment-rule) |
| Cross-feature access via adapters only | [§5.2 Cross-Feature Boundary Rule](#52-cross-feature-boundary-rule) |
| Adapter as public surface | [§5.3 Adapter Contract](#53-adapter-contract) |
| Dependency direction (one-way) | [§6.1 Dependency Direction Rule](#61-dependency-direction-rule) |
| No circular dependencies | [§6.3 Circular Dependency Rule](#63-circular-dependency-rule) |
| UI ownership stays in feature | [§7 UI Ownership Rule](#7-ui-ownership-rule-locked) |
| Resolver layer naming (`.resolver.js`, `resolvers/` folder) | [§2.8 Resolver Contract](#28-resolver-contract) |

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

---

## §1 Global Rules (Locked)

### 1.1 Import Path Rule

All new imports must use:

```
@/...
```

Relative imports like the following are forbidden in new modules:

```
../../..
```

---

### 1.2 Module Build Order Rule

All future modules must be built in this order:

```
DAL
Model
Controller
Hooks
Components
View Screen
Final Screen
```

This order is mandatory.

A layer must not be built before the layer below it is defined.

---

### 1.3 Identity Surface Rule

The identity object returned by `useIdentity()` is actor-first only.

It may contain:

- `identity.actorId`
- `identity.kind`

It must never expose:

- `profileId`
- `vportId`

`identity.actorId` is the only canonical ID used by the app to scope data.

`identity.kind` is the only canonical discriminator:

```
'user' | 'vport'
```

Any profile or vport lookup must remain internal to the provider and must not be exposed.

---

### 1.4 Owner Meaning Rule

In this system, Owner means Actor Owner.

The authoritative ownership model is actor-based because all meaningful domain entities are tied to `vc.actors`.

Ownership semantics must follow `actor_owners`.

---

## §2 Core Layer Contracts (Locked)

### 2.1 Data Access Layer (DAL) Contract

> **Purpose:** DAL functions are thin database adapters. They answer one question only: *What does the database say?*

**DAL files may:**

- import Supabase
- call select, insert, update, delete, or rpc
- define explicit column projections

**DAL files must:**

- return raw database rows exactly as stored
- use explicit column projections
- be deterministic for a given input
- reflect only database state, not application meaning

**DAL files must not:**

- apply business rules
- apply authorization logic
- normalize, rename, or map fields
- derive flags or meaning such as `isMine`, `isDeleted`, `hasAccess`
- import models, controllers, hooks, components, or screens
- infer actor intent, ownership, or permissions


**DAL Import Boundary Rule**

DAL files may only import:

- Supabase client helpers
- schema/table constants
- generic low-level query utilities

DAL files must not import:

- models
- controllers
- hooks
- components
- screens
- feature adapters
- domain services

DAL output must remain raw database rows.

**Locked DAL Style**

Always use:

```js
supabase.schema('vc')
  .from('table')
  .select('explicit,columns')
```

Use:

- `.maybeSingle()` for single-row reads
- `.select(...)` for lists

Never use:

```js
.select('*')
```

**`.select('*')` Rule**

`.select('*')` is forbidden in production DAL code.

DAL functions must explicitly select only the columns required by the use-case.

This does not violate the DAL contract. Projections are still raw data.

**Reasoning**

This rule:

- prevents accidental data leakage as schema evolves
- reduces payload size and memory pressure
- enables better index usage
- keeps DAL output stable and predictable
- ensures DAL is the only layer that talks to the database

---

### 2.2 Model Contract

> **Purpose:** Models are pure translators between database shape and domain shape. They answer one question only: *What does this data mean to the application?*

**Models must:**

- be pure functions
- have no side effects
- avoid all I/O and network access
- accept raw DAL rows as input
- return domain-safe objects
- apply defaults and normalization

**Models may:**

- rename fields (snake_case → camelCase)
- derive booleans such as `isDeleted`, `hasMedia`, `isSystem`
- normalize optional or nullable fields

**Models must not:**

- import Supabase
- perform database access or mutations
- enforce permissions or ownership
- contain business rules

---

### 2.3 Controller Contract

> **Purpose:** Controllers are use-case boundaries and the sole owners of business meaning. They answer one complete question: *Is this action allowed, and what is the correct domain result?*

**Controllers may:**

- call DAL functions
- call Models
- call other controllers only when explicitly justified

**Controllers must:**

- enforce actor rules
- enforce ownership
- enforce permissions
- enforce idempotency
- decide which DAL functions to call
- decide which model to apply
- return domain-level results only

**Controllers must not:**

- import Supabase directly
- import React or UI
- hold component or UI state
- return raw database rows
- perform routing or navigation

---

### 2.4 Hook Contract

> **Purpose:** Hooks manage UI lifecycle and orchestration timing. They answer one question only: *When should this use-case run, and how should the UI respond?*

**Hooks may:**

- use React APIs such as `useState`, `useEffect`, `useCallback`
- hold UI state such as loading, error, optimistic updates
- call controllers
- subscribe to realtime updates
- coordinate multiple controllers

**Hooks must:**

- treat controller results as authoritative
- expose UI-ready state
- remain deterministic based on inputs

**Hooks must not:**

- import Supabase
- call DAL functions
- apply business rules
- infer permissions or ownership
- transform domain meaning

Hooks should treat controller outputs as final domain truth.

---

### 2.5 Component Contract

> **Purpose:** Components are reusable UI building blocks. They answer one question only: *How does this UI piece render given props and local UI state?*

**Components may:**

- receive data and callbacks via props
- use local UI state such as open/close, input text, and animations
- render styling and layout
- emit user intents such as `onSubmit`, `onApprove`, `onReject`

**Components must:**

- be reusable and presentational by default
- remain predictable from props and local UI state
- avoid owning domain truth

Components may manage ephemeral UI state only.

**Components must not:**

- import Supabase
- import DAL
- call controllers directly
- contain business rules
- contain permissions logic
- persist or derive domain state

Controllers are called by hooks or view screens, not by components.

---

### 2.6 View Screen Contract

> **Purpose:** View Screens assemble hooks and components to express one domain experience. They answer one question only: *How does this domain experience behave and render?*

**View Screens may:**

- call domain hooks
- coordinate multiple hooks
- compose UI components
- hold view-local UI state such as menus, drawers, and focus state

**View Screens must:**

- treat hooks as the only source of domain truth
- remain declarative and predictable
- be testable without routing

**View Screens must not:**

- import DAL
- import Supabase
- call controllers directly
- enforce permissions or business rules
- interpret raw database data
- perform navigation side-effects except emitting UI intents upward

---

### 2.7 Final Screen Contract

> **Purpose:** Final Screens are routing-level composition boundaries. They answer one question only: *Given route and identity, which experience should exist?*

**Final Screens may:**

- read route params and search state
- read global app context such as identity and theme
- perform hard guards such as auth required or actor required
- choose which View Screen to render
- provide layout scaffolding

**Final Screens must:**

- be deterministic from route and identity
- treat identity as read-only
- delegate all logic downward

**Final Screens must not:**

- import DAL
- import models
- import controllers
- execute business logic
- fetch or mutate data
- interpret domain data

---

### 2.8 Resolver Contract

> **Purpose:** Resolvers are DI factory layers. They create injectable closures that are passed to shared engine `configure*()` functions at app startup. They answer one question only: *What VCSM-specific data does this shared engine need to perform its job?*

**When to use a Resolver**

A Resolver is only required when a feature needs to inject VCSM-specific data access behavior into a shared engine (e.g. `engines/identity/`). Most features do not need a Resolver.

**Resolvers may:**

- import Supabase
- query Supabase directly using explicit column projections (initialized-DAL pattern — supabase client is captured once at factory call time via closure)
- return factory functions that are passed to engine `configure*()` calls
- export multiple factory functions for different engine configuration needs

**Resolvers must:**

- live in a `resolvers/` sub-folder inside the feature root
- end with `.resolver.js`
- be wired exclusively through `setup.js` at app startup
- use explicit column projections (`.select('*')` is forbidden)
- be treated as DAL-equivalent in terms of privilege and review scope

**Resolvers must not:**

- be imported by components, hooks, screens, or controllers at runtime
- be called directly outside of `setup.js` DI wiring
- apply business rules, ownership logic, or domain transforms
- export functions that accept arbitrary caller-supplied supabase clients (dead export risk)
- contain UI logic

**Resolver naming**

```
features/<feature>/resolvers/<name>.resolver.js
```

Example:

```
features/identity/resolvers/vcsmIdentity.resolver.js
```

**Relationship to DAL**

A Resolver performs Supabase access like a DAL, but it is not a DAL file:

- A DAL is called at runtime by a controller or hook
- A Resolver is called at startup by `setup.js` to configure an engine; its returned closure is called by the engine at runtime
- A DAL uses the shared singleton Supabase client; a Resolver captures the client at factory creation time

**`setup.js` — DI Bootstrap File**

Each feature that uses a Resolver must have a `setup.js` file at the feature root. `setup.js` is the only file that calls Resolver factories and passes them to engine `configure*()` functions. It must be called once at app startup (e.g. `main.jsx`) before any components render.

---

## §3 Shared Layer Contract (Locked)

> **Purpose:** The shared layer exists for domain-neutral reuse. It provides stable primitives and generic helpers that do not belong to any feature.

**Shared Layer May Contain**

- domain-neutral UI primitives
- generic utilities
- formatting helpers
- parsing helpers
- infrastructure-agnostic helpers

**Shared Layer Must Not Contain**

- feature rules
- feature ownership logic
- domain-specific orchestration
- feature-specific business language
- imports from feature modules

**Shared UI Rule**

Shared UI must remain purely presentational and domain-neutral.

Examples of valid shared UI:

- `Button`
- `Input`
- `Modal`
- `Card`
- `Avatar`
- `Tabs`
- `Spinner`

Examples of forbidden shared UI:

- `MessageComposer.jsx`
- `PostCard.jsx`
- `ExploreFeed.jsx`

If UI contains domain meaning, it belongs inside its feature.

---

## §4 Structural Integrity Rules (Locked)

These rules prevent architectural drift, god files, and cross-feature coupling.

They apply to all code in the system.

### 4.1 File Size & Decomposition Rule

> **Purpose:** Prevent god files and enforce maintainable module boundaries. Large files accumulate responsibilities, hide architectural violations, and make reasoning difficult.

**Maximum File Size Rule**

A source file must not exceed 300 lines of code.

When a file approaches 300 lines, it must be decomposed into smaller files according to architectural layer responsibilities.

This applies to:

- DAL files
- Models
- Controllers
- Hooks
- Components
- View Screens
- Final Screens

**What Counts as a Line**

The following count:

- executable code
- function declarations
- imports
- exports
- JSX
- types
- utility helpers

The following do not count:

- blank lines
- documentation comment blocks

**Required Action**

When a file reaches 300 lines, it must be split.

The split must follow architectural boundaries, not arbitrary grouping.

**Acceptable Decompositions**

Controller decomposition:

```
messageController.js
→ sendMessage.controller.js
→ editMessage.controller.js
→ deleteMessage.controller.js
```

DAL decomposition:

```
message.dal.js
→ messageReads.dal.js
→ messageWrites.dal.js
```

Hook decomposition:

```
useMessages.js
→ useMessageList.js
→ useSendMessage.js
```

Component decomposition:

```
PostCard.jsx
→ PostHeader.jsx
→ PostBody.jsx
→ PostActions.jsx
```

**Forbidden Workarounds**

The following are forbidden:

- collapsing multiple responsibilities into one file
- creating deeply nested functions inside a single file
- hiding logic inside anonymous closures
- moving code into large inline utilities inside the same file

**Recommended File Size**

Most files should naturally stay between:

```
80 — 200 lines
```

Files approaching 250 lines should be reviewed for decomposition.

---

### 4.2 Single Responsibility File Rule

> **Purpose:** Prevent files from accumulating multiple responsibilities even under 300 lines.

**Rule**

Each file must represent one coherent responsibility.

Each file should answer one focused question.

Good examples:

```
sendMessage.controller.js
→ Can this actor send a message?

getConversationMessages.dal.js
→ What messages exist for this conversation?

useMessageList.js
→ When and how should message lists load?
```

Bad example:

```
message.controller.js
→ sending
→ deleting
→ editing
→ moderating
→ notifications
```

If multiple use-cases exist in a domain, they must be separate files.

---

### 4.3 Controller Fan-Out Rule

> **Purpose:** Prevent controllers from becoming orchestration monsters.

**Rule**

A controller may call at most 5 external modules.

External modules include:

- DAL files
- Models
- other controllers
- utilities

If a controller requires more than 5 collaborators, the use-case must be decomposed.

---

### 4.4 Maximum Folder Depth Rule

> **Purpose:** Prevent deeply nested directory structures that hide architecture.

**Rule**

Feature modules must not exceed 3 directory levels below the feature root.

Depth is measured relative to the feature root.

Example:

```
src/features/messages
```

is depth 0.

Allowed:

```
src/features/messages/controller/sendMessage.controller.js
```

Not allowed:

```
src/features/messages/domain/controller/internal/sendMessage.controller.js
```

**Reasoning**

Deep nesting:

- hides architectural intent
- increases cognitive load
- slows navigation

Architecture should be visible directly from the filesystem.

---

### 4.5 File Naming Rule

> **Purpose:** Keep the filesystem readable and role-driven.

**Rule**

Files must follow these naming conventions:

- DAL files end with `.dal.js`
- Model files end with `.model.js`
- Controller files end with `.controller.js`
- Hook files begin with `use`
- Adapter files end with `.adapter.js`
- Resolver files end with `.resolver.js` and live in a `resolvers/` sub-folder
- View screens end with `.view.jsx` or `ViewScreen.jsx`
- Final screens end with `Screen.jsx`

The role of a file should be obvious from its name alone.

---

## §5 Feature Boundary Rules (Locked)

### 5.1 Feature Containment Rule

> **Purpose:** Ensure every feature owns its logic inside its own folder.

**Rule**

All files belonging to a feature must live inside that feature's folder.

Each feature must contain its own:

- adapters
- DAL
- model
- controller
- hooks
- components
- screens

Feature logic must not be placed in unrelated shared folders unless it is truly generic and domain-neutral.

Forbidden examples:

```
src/shared/messages/sendMessage.controller.js
src/lib/explore/useExploreFeed.js
src/components/onboarding/OnboardingCard.jsx
```

If logic belongs to a feature, it must live in that feature.

---

### 5.2 Cross-Feature Boundary Rule

> **Purpose:** Prevent features from importing each other's internals.

**Rule**

A feature may not import another feature's internal files, including:

- DAL
- models
- controllers
- hooks
- components
- screens
- internal utilities

Direct cross-feature imports are forbidden.

---

### 5.3 Adapter Contract

> **Purpose:** Adapters are the public boundary of a feature. They answer one question only: *What is the safe public surface this feature exposes?*

**Adapters may:**

- re-export selected hooks
- re-export selected components
- re-export selected view screens

**Adapters must:**

- be the only cross-feature import surface
- expose only intentionally public APIs
- hide internal folder structure from consumers
- remain thin and declarative
- act as re-export boundaries only

**Adapters must not:**

- import Supabase
- contain DAL logic
- contain business rules
- replace controllers
- replace hooks
- become orchestration layers
- compose domain behavior

**Adapters may export only:**

- hooks
- components
- view screens

**Adapters must never export:**

- DAL
- models
- controllers

---

### 5.4 Adapter Import Rule

Any code outside a feature must import the feature through its adapter.

Allowed:

```js
import { OnboardingCardsView } from '@/features/onboarding/adapters/onboarding.adapter';
```

Forbidden:

```js
import { useOnboardingCards } from '@/features/onboarding/hooks/useOnboardingCards';
import { onboardingController } from '@/features/onboarding/controller/onboardingController';
```

---

### 5.5 Screen-to-Feature Access Rule

Final Screens and View Screens must never import another feature's internal files.

They must only import other features through adapters.

Allowed:

```js
import { ExploreViewScreen } from '@/features/explore/adapters/explore.adapter';
import { OnboardingCardsView } from '@/features/onboarding/adapters/onboarding.adapter';
```

Forbidden:

```js
import { ExploreView } from '@/features/explore/ui/ExploreView';
import { useOnboardingCards } from '@/features/onboarding/hooks/useOnboardingCards';
```

---

### 5.6 Recommended Feature Structure

```
src/features/<feature>/
  adapters/
    <feature>.adapter.js
  dal/
  model/
  controller/
  hooks/
  components/
  screens/
  resolvers/          (optional — only for features that inject DI into a shared engine)
  setup.js            (optional — only present when resolvers/ exists)
```

Example:

```
src/features/messages/
  adapters/
    messages.adapter.js
  dal/
  model/
  controller/
  hooks/
  components/
  screens/
```

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

---
## §6 Dependency Rules (Locked)

### 6.1 Dependency Direction Rule

> **Purpose:** Prevent circular dependencies and preserve architectural clarity.

**Rule**

Dependencies must always flow in one direction.

Modules may only depend on modules below them in the architecture hierarchy.

Modules must never depend on modules above them.

**Allowed Dependency Flow**

```
screens
↓
features
↓
shared
↓
core
```

Higher layers may depend on lower layers.

Lower layers must never depend on higher layers.

---

### 6.2 Feature Dependency Rule

Features may depend on:

- shared utilities
- shared UI components
- core infrastructure

Features may not depend directly on other features unless through that feature's adapter boundary.

---

### 6.3 Circular Dependency Rule

Dependency cycles are forbidden.

Forbidden example:

```
explore → messages
messages → notifications
notifications → explore
```

If a cycle appears, the shared logic must be extracted into:

```
src/shared/
```

Both features may depend on shared modules, but shared modules must never depend on features.

---

### 6.4 DAG Principle

The system must form a Directed Acyclic Graph (DAG) of dependencies.

Dependencies always flow in one direction.

No cycles are allowed.

---

## §7 UI Ownership Rule (Locked)

> **Purpose:** Prevent UI spaghetti and tangled rendering dependencies. UI must remain owned by the feature that defines the domain experience.

**Rule**

UI components belong to the feature that owns the domain behavior.

Components must not be imported directly across feature boundaries.

If another feature needs UI from a feature, it must access it through that feature's adapter.

**Allowed UI Imports**

Inside the same feature, components may import each other freely.

Example:

```
src/features/messages/components/MessageComposer.jsx
```

may import:

```
src/features/messages/components/MessageInput.jsx
src/features/messages/components/MessageToolbar.jsx
```

**Forbidden UI Imports**

A feature must never import another feature's internal UI.

Forbidden:

```
src/features/explore/components/ExploreFeed.jsx
imports
src/features/messages/components/MessageComposer.jsx
```

or

```
src/features/profile/components/ProfileHeader.jsx
imports
src/features/explore/components/ExploreCard.jsx
```

**Correct Access Pattern**

Allowed:

```js
import { MessageComposer } from '@/features/messages/adapters/messages.adapter';
```

Forbidden:

```js
import MessageComposer from '@/features/messages/components/MessageComposer';
```

**Shared UI Exception**

Shared UI may exist only if it is domain-neutral.

Example:

```
src/shared/ui/
```

Shared UI must not contain domain meaning.

---

## §8 Final Architectural Principles (Locked)

- Security lives in RLS.
- Meaning lives in Controllers.
- Shape lives in Models.
- Timing lives in Hooks.
- Composition lives in Screens.
- Public feature boundaries live in Adapters.
- Shared remains domain-neutral.
- Data access stays dumb, explicit, and boring.
- Architecture must grow horizontally, not vertically.
- The role of a file should be obvious from its name.
- The role of a module should be obvious from its folder.
- A developer should understand the system by reading the filesystem without opening files.
