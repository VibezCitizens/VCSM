# Layer Contracts
## VCSM Architecture Contract — §2 Core Layer Contracts + §3 Shared Layer Contract (Locked)

> **Source:** [ARCHITECTURE.md](ARCHITECTURE.md) — Lines 103–115, 194–558
> **Status:** Locked — no changes without explicit contract revision
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [02-identity-contract.md](02-identity-contract.md)
> **Reads Before:** [04-resolver-contract.md](04-resolver-contract.md), [05-feature-boundaries.md](05-feature-boundaries.md)
> **Cross-Links:** [08-dependency-rules.md](08-dependency-rules.md), [10-structural-integrity.md](10-structural-integrity.md), [11-naming-conventions.md](11-naming-conventions.md)

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

---

### DAL Ownership Clarification

The DAL may receive actor-scoped identifiers from its caller and use those identifiers as query filters.

Example:

- `getBookingsByActorId(actorId)`
- `getMessagesForActor(actorId)`
- `getPostsByActor(actorId)`

Using a caller-supplied `actorId` in a query filter is not ownership inference.

Example:

```sql
WHERE actor_id = :actorId
```

This is a data-scoping operation, not an authorization decision.

The controller is responsible for deciding which actorId is valid for the operation.

The DAL is responsible for executing the query using the parameters it was given.

---

### Prohibited DAL Authorization Logic

DAL functions must never independently determine whether an actor is authorized to perform an operation.

The DAL must not:

- evaluate ownership
- evaluate permissions
- query `vc.actor_owners` to make authorization decisions
- infer authority from `userId`
- infer authority from `profileId`
- infer authority from `vportId`
- infer authority from `owner_user_id`

Examples of prohibited behavior:

- "Only return rows if this actor owns the target actor."
- "Check actor_owners before updating."
- "Determine whether access should be granted."

These are controller responsibilities.

---

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

---

### Ownership Decision Responsibility

Controllers are the authoritative decision-makers for ownership and permission checks.

When an operation requires ownership validation:

1. Controller determines the acting actor.
2. Controller evaluates authorization.
3. Controller consults `vc.actor_owners` if ownership must be verified.
4. Controller decides allow or deny.
5. DAL executes the resulting operation.

Ownership decisions originate in controllers and nowhere else.

**Controllers must not:**

- import Supabase directly
- import React or UI
- hold component or UI state
- return raw database rows
- perform routing or navigation

---

### Relationship Between Controller, DAL, and RLS

Ownership enforcement exists at three distinct layers:

**Controller:**
- decides authorization
- evaluates ownership
- determines whether the action may proceed

**DAL:**
- executes scoped queries
- applies caller-provided filters
- does not decide authorization

**RLS:**
- database-level enforcement
- final protection boundary
- blocks unauthorized access even if application logic fails

These layers have different responsibilities.

Controller = decision-maker

DAL = query executor

RLS = final enforcement boundary

---

### Example: Correct Ownership Flow

Correct:

Controller:
- resolves active actorId
- verifies ownership through `vc.actor_owners`

DAL:
- executes: `UPDATE bookings SET ... WHERE actor_id = :actorId`

RLS:
- validates row access

This is valid because the controller made the ownership decision and the DAL merely executed a scoped query.

Incorrect:

DAL:
- reads actor_owners
- determines whether actor is allowed
- decides allow or deny

This violates the layer contract because the DAL became the authorization authority.

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
