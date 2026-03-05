Core Layer Contracts (Revised & Locked) — Updated

This architecture enforces clear ownership of meaning, authority, and responsibility across layers.
Each layer answers exactly one question and nothing more.

Global Rules (New & Locked)

1) Import Path Rule

Always build imports using @/...

Never use relative paths like ../../.. in new modules.

2) Module Build Order (New & Locked)
For all future modules we build in this order:

DAL

Model

Controller

Hooks

Components

View Screen

Final Screen

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

Import models, controllers, hooks, components, or screens

Infer actor intent, ownership, or permissions

🚫 .select('*') Rule (Locked)

.select('*') is forbidden in production DAL code.

Locked DAL Style (Acknowledged)

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

Import anything except Supabase

Reasoning:

Prevents accidental data leakage when schema evolves

Reduces network payload and memory pressure

Enables Postgres covering indexes

Makes DAL output stable and predictable and only File to call database

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




Call Models

May never Import DAtabase 

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

_____________________Hook Contract
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

_____________________Component Contract (New)
Purpose

Components are reusable UI building blocks.

They answer one question only:
“How does this UI piece render given props/state?”

Component Rules

Components may:

Receive data and callbacks via props

Use local UI state (open/close, input text, animations)

Render styling and layout

Emit user intents (onSubmit, onApprove, onReject)

Components must:

Be reusable and presentational by default

Remain predictable from props + local UI state

Avoid owning domain truth (that lives in hooks/controllers)

Components must not:

Import Supabase or DAL

Call controllers directly (controllers are called by hooks / view screens)

Contain business rules or permissions logic

View Screen Contract (Domain Views)
Purpose

View Screens assemble hooks + components to express one domain experience.

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

Final Screen Contract (Routing Screens) — Updated Naming
Purpose

Final Screens are routing-level composition boundaries.

They answer one question only:
“Given route + identity, which experience should exist?”

Final Screen Rules

Final Screens may:

Read route params and search state

Read global app context (identity, theme)

Perform hard guards (auth required, actor required)

Choose which View Screen to render

Provide layout scaffolding

Final Screens must:

Be deterministic from route + identity

Treat identity as read-only

Delegate all logic downward

Final Screens must not:

Import DAL, models, or controllers

Execute business logic

Fetch or mutate data

Interpret domain data

Final Architectural Principle (Locked)

Security lives in RLS.

Meaning lives in Controllers.

Shape lives in Models.

Timing lives in Hooks.

Composition lives in Screens.

Data access stays dumb, explicit, and boring.

className="
  w-full px-4 py-2 pr-10
  rounded-2xl bg-neutral-900 text-white
  border border-purple-700
  focus:ring-2 focus:ring-purple-500
"

ocked Rule: Identity MUST NOT expose profileId or vportId
✅ Identity Surface Contract (LOCKED)

The identity object returned by useIdentity() may never contain:

profileId

vportId

Identity is actor-first only:

identity.actorId is the only canonical ID used by the app to scope data.

identity.kind is the only canonical discriminator ('user' | 'vport').

Any profile/vport lookup stays internal to the provider (hydration only), not exposed.

✅ Enforcement

The provider must never return profileId / vportId.

Optional: runtime assertion warns if these ever reappear.

Correct Meaning of “Owner” in Your System
Owner = Actor Owner

Because:

Everything meaningful in your domain (posts, chats, follows, vports, moderation, etc.) is tied to vc.actors

actor_owners