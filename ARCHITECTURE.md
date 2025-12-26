Core Layer Contracts (Revised & Locked)

This architecture enforces clear ownership of meaning, authority, and responsibility across layers.
Each layer answers exactly one question and nothing more.

Data Access Layer (DAL) Contract
Purpose

DAL functions are thin database adapters.

They answer one question only:

“What does the database say?”

DAL Rules
DAL files may:

Import Supabase

Call select, insert, update, delete, or rpc

Define explicit column projections

DAL files must:

Return raw database rows exactly as stored

Use explicit column projections (select(col1, col2, …))

Be deterministic for a given input

Reflect only database state, not application meaning

DAL files must not:

Apply business rules or authorization logic

Normalize, rename, or map fields

Derive flags or meaning (isMine, isDeleted, etc.)

Import models, controllers, hooks, or UI

Infer actor intent, ownership, or permissions

🚫 .select('*') Rule (New)

.select('*') is forbidden in production DAL code.
LOCKED DAL STYLE (ACKNOWLEDGED)

Rules we will follow from now on:

Always:

supabase.schema('vc')

.from('table')

.select('explicit,columns')

Use:

.maybeSingle() for single-row reads

.select(...) for lists

Never:

.select('*')

Return derived meaning

Import anything except supabase

Reasoning:

Prevents accidental data leakage when schema evolves

Reduces network payload and memory pressure

Enables Postgres covering indexes

Makes DAL output stable and predictable

Rule:

DAL functions must explicitly select only the columns required by the use-case.

This does not violate the DAL contract — projections are still raw data.

Model Contract
Purpose

Models are pure translators between database shape and domain shape.

They answer one question only:

“What does this data mean to the application?”

Model Rules
Models must:

Be pure functions (no side effects)

Avoid all I/O and network access

Accept raw DAL rows as input

Return domain-safe objects

Apply defaults and normalization

Models may:

Rename fields (snake_case → camelCase)

Derive booleans (isDeleted, hasMedia, isSystem)

Normalize optional or nullable fields

Models must not:

Import Supabase

Perform database access or mutations

Enforce permissions or ownership

Contain business rules

Controller Contract
Purpose

Controllers are use-case boundaries and the sole owners of business meaning.

They answer one complete question:

“Is this action allowed, and what is the correct domain result?”

Controller Rules
Controllers may:

Import Supabase

Call DAL functions

Call Models

Orchestrate multiple DAL calls

Controllers must:

Enforce actor rules, ownership, permissions, and idempotency

Decide which DAL functions to call

Decide which model to apply

Return domain-level results only

Controllers must not:

Import React or UI

Hold component or UI state

Return raw database rows

Perform routing or navigation

Hook Contract
Purpose

Hooks manage UI lifecycle and orchestration timing.

They answer one question only:

“When should this use-case run, and how should the UI respond?”

Hook Rules
Hooks may:

Use React APIs (useState, useEffect, useCallback, etc.)

Hold UI state (loading, error, optimistic updates)

Call controllers

Subscribe to realtime updates

Coordinate multiple controllers

Hooks must:

Treat controller results as authoritative

Expose UI-ready state

Remain deterministic based on inputs

Hooks must not:

Import Supabase

Call DAL functions

Apply business rules

Infer permissions or ownership

Transform domain meaning

Screen Contract (Routing Screens)
Purpose

Screens are routing-level composition boundaries.

They answer one question only:

“Given route + identity, which experience should exist?”

Screen Rules
Screens may:

Read route params and search state

Read global app context (identity, theme)

Perform hard guards (auth required, actor required)

Choose which View Screen to render

Provide layout scaffolding

Screens must:

Be deterministic from route + identity

Treat identity as read-only

Delegate all logic downward

Screens must not:

Import DAL, models, or controllers

Execute business logic

Fetch or mutate data

Interpret domain data

View Screen Contract (Domain Views)
Purpose

View Screens assemble hooks + UI to express one domain experience.

They answer one question only:

“How does this domain experience behave and render?”

View Screen Rules
View Screens may:

Call domain hooks

Coordinate multiple hooks

Compose UI components

Hold view-local UI state (menus, drawers, focus)

View Screens must:

Treat hooks as the only source of domain truth

Remain declarative and predictable

Be testable without routing

View Screens must not:

Import DAL or Supabase

Call controllers directly

Enforce permissions or business rules

Interpret raw database data

Perform navigation side-effects (except UI intents)

Final Architectural Principle (Lock This In)

Security lives in RLS.
Meaning lives in Controllers.
Shape lives in Models.
Timing lives in Hooks.
Composition lives in Screens.
Data access stays dumb, explicit, and boring.