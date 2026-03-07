VCSM Architecture Contract (Locked)

This architecture enforces clear ownership of meaning, authority, and responsibility across the system.

Each layer answers exactly one question and nothing more.

The system is designed to remain:

modular

predictable

scalable

refactorable

safe for multiple engineers

Global Rules (Locked)
1) Import Path Rule

All new imports must use:

@/...

Relative imports like the following are forbidden in new modules:

../../..
2) Module Build Order Rule

All future modules must be built in this order:

DAL

Model

Controller

Hooks

Components

View Screen

Final Screen

This order is mandatory.

A layer must not be built before the layer below it is defined.

3) Identity Surface Rule

The identity object returned by useIdentity() is actor-first only.

It may contain:

identity.actorId

identity.kind

It must never expose:

profileId

vportId

identity.actorId is the only canonical ID used by the app to scope data.

identity.kind is the only canonical discriminator:

'user' | 'vport'

Any profile or vport lookup must remain internal to the provider and must not be exposed.

4) Owner Meaning Rule

In this system, Owner means Actor Owner.

The authoritative ownership model is actor-based because all meaningful domain entities are tied to vc.actors.

Ownership semantics must follow actor_owners.

Core Layer Contracts (Locked)
Data Access Layer (DAL) Contract
Purpose

DAL functions are thin database adapters.

They answer one question only:

What does the database say?

DAL Rules

DAL files may:

import Supabase

call select, insert, update, delete, or rpc

define explicit column projections

DAL files must:

return raw database rows exactly as stored

use explicit column projections

be deterministic for a given input

reflect only database state, not application meaning

DAL files must not:

apply business rules

apply authorization logic

normalize, rename, or map fields

derive flags or meaning such as isMine, isDeleted, hasAccess

import models, controllers, hooks, components, or screens

infer actor intent, ownership, or permissions

Locked DAL Style

Always use:

supabase.schema('vc')
.from('table')
.select('explicit,columns')

Use:

.maybeSingle() for single-row reads

.select(...) for lists

Never use:

.select('*')
.select('*') Rule

.select('*') is forbidden in production DAL code.

DAL functions must explicitly select only the columns required by the use-case.

This does not violate the DAL contract. Projections are still raw data.

Reasoning

This rule:

prevents accidental data leakage as schema evolves

reduces payload size and memory pressure

enables better index usage

keeps DAL output stable and predictable

ensures DAL is the only layer that talks to the database

Model Contract
Purpose

Models are pure translators between database shape and domain shape.

They answer one question only:

What does this data mean to the application?

Model Rules

Models must:

be pure functions

have no side effects

avoid all I/O and network access

accept raw DAL rows as input

return domain-safe objects

apply defaults and normalization

Models may:

rename fields (snake_case → camelCase)

derive booleans such as isDeleted, hasMedia, isSystem

normalize optional or nullable fields

Models must not:

import Supabase

perform database access or mutations

enforce permissions or ownership

contain business rules

Controller Contract
Purpose

Controllers are use-case boundaries and the sole owners of business meaning.

They answer one complete question:

Is this action allowed, and what is the correct domain result?

Controller Rules

Controllers may:

call DAL functions

call Models

call other controllers only when explicitly justified

Controllers must:

enforce actor rules

enforce ownership

enforce permissions

enforce idempotency

decide which DAL functions to call

decide which model to apply

return domain-level results only

Controllers must not:

import Supabase directly

import React or UI

hold component or UI state

return raw database rows

perform routing or navigation

Hook Contract
Purpose

Hooks manage UI lifecycle and orchestration timing.

They answer one question only:

When should this use-case run, and how should the UI respond?

Hook Rules

Hooks may:

use React APIs such as useState, useEffect, useCallback

hold UI state such as loading, error, optimistic updates

call controllers

subscribe to realtime updates

coordinate multiple controllers

Hooks must:

treat controller results as authoritative

expose UI-ready state

remain deterministic based on inputs

Hooks must not:

import Supabase

call DAL functions

apply business rules

infer permissions or ownership

transform domain meaning

Hooks should treat controller outputs as final domain truth.

Component Contract
Purpose

Components are reusable UI building blocks.

They answer one question only:

How does this UI piece render given props and local UI state?

Component Rules

Components may:

receive data and callbacks via props

use local UI state such as open/close, input text, and animations

render styling and layout

emit user intents such as onSubmit, onApprove, onReject

Components must:

be reusable and presentational by default

remain predictable from props and local UI state

avoid owning domain truth

Components may manage ephemeral UI state only.

Components must not:

import Supabase

import DAL

call controllers directly

contain business rules

contain permissions logic

persist or derive domain state

Controllers are called by hooks or view screens, not by components.

View Screen Contract
Purpose

View Screens assemble hooks and components to express one domain experience.

They answer one question only:

How does this domain experience behave and render?

View Screen Rules

View Screens may:

call domain hooks

coordinate multiple hooks

compose UI components

hold view-local UI state such as menus, drawers, and focus state

View Screens must:

treat hooks as the only source of domain truth

remain declarative and predictable

be testable without routing

View Screens must not:

import DAL

import Supabase

call controllers directly

enforce permissions or business rules

interpret raw database data

perform navigation side-effects except emitting UI intents upward

Final Screen Contract
Purpose

Final Screens are routing-level composition boundaries.

They answer one question only:

Given route and identity, which experience should exist?

Final Screen Rules

Final Screens may:

read route params and search state

read global app context such as identity and theme

perform hard guards such as auth required or actor required

choose which View Screen to render

provide layout scaffolding

Final Screens must:

be deterministic from route and identity

treat identity as read-only

delegate all logic downward

Final Screens must not:

import DAL

import models

import controllers

execute business logic

fetch or mutate data

interpret domain data

Shared Layer Contract (Locked)
Purpose

The shared layer exists for domain-neutral reuse.

It provides stable primitives and generic helpers that do not belong to any feature.

Shared Layer May Contain

domain-neutral UI primitives

generic utilities

formatting helpers

parsing helpers

infrastructure-agnostic helpers

Shared Layer Must Not Contain

feature rules

feature ownership logic

domain-specific orchestration

feature-specific business language

imports from feature modules

Shared UI Rule

Shared UI must remain purely presentational and domain-neutral.

Examples of valid shared UI:

Button

Input

Modal

Card

Avatar

Tabs

Spinner

Examples of forbidden shared UI:

MessageComposer.jsx

PostCard.jsx

ExploreFeed.jsx

If UI contains domain meaning, it belongs inside its feature.

Structural Integrity Rules (Locked)

These rules prevent architectural drift, god files, and cross-feature coupling.

They apply to all code in the system.

File Size & Decomposition Rule
Purpose

Prevent god files and enforce maintainable module boundaries.

Large files accumulate responsibilities, hide architectural violations, and make reasoning difficult.

Maximum File Size Rule

A source file must not exceed 300 lines of code.

When a file approaches 300 lines, it must be decomposed into smaller files according to architectural layer responsibilities.

This applies to:

DAL files

Models

Controllers

Hooks

Components

View Screens

Final Screens

What Counts as a Line

The following count:

executable code

function declarations

imports

exports

JSX

types

utility helpers

The following do not count:

blank lines

documentation comment blocks

Required Action

When a file reaches 300 lines, it must be split.

The split must follow architectural boundaries, not arbitrary grouping.

Acceptable Decompositions

Controller decomposition:

messageController.js
→ sendMessage.controller.js
→ editMessage.controller.js
→ deleteMessage.controller.js

DAL decomposition:

message.dal.js
→ messageReads.dal.js
→ messageWrites.dal.js

Hook decomposition:

useMessages.js
→ useMessageList.js
→ useSendMessage.js

Component decomposition:

PostCard.jsx
→ PostHeader.jsx
→ PostBody.jsx
→ PostActions.jsx
Forbidden Workarounds

The following are forbidden:

collapsing multiple responsibilities into one file

creating deeply nested functions inside a single file

hiding logic inside anonymous closures

moving code into large inline utilities inside the same file

Recommended File Size

Most files should naturally stay between:

80 — 200 lines

Files approaching 250 lines should be reviewed for decomposition.

Single Responsibility File Rule
Purpose

Prevent files from accumulating multiple responsibilities even under 300 lines.

Rule

Each file must represent one coherent responsibility.

Each file should answer one focused question.

Good examples:

sendMessage.controller.js
→ Can this actor send a message?
getConversationMessages.dal.js
→ What messages exist for this conversation?
useMessageList.js
→ When and how should message lists load?

Bad example:

message.controller.js
→ sending
→ deleting
→ editing
→ moderating
→ notifications

If multiple use-cases exist in a domain, they must be separate files.

Controller Fan-Out Rule
Purpose

Prevent controllers from becoming orchestration monsters.

Rule

A controller may call at most 5 external modules.

External modules include:

DAL files

Models

other controllers

utilities

If a controller requires more than 5 collaborators, the use-case must be decomposed.

Maximum Folder Depth Rule
Purpose

Prevent deeply nested directory structures that hide architecture.

Rule

Feature modules must not exceed 3 directory levels below the feature root.

Depth is measured relative to the feature root.

Example:

src/features/messages

is depth 0.

Allowed:

src/features/messages/controller/sendMessage.controller.js

Not allowed:

src/features/messages/domain/controller/internal/sendMessage.controller.js
Reasoning

Deep nesting:

hides architectural intent

increases cognitive load

slows navigation

Architecture should be visible directly from the filesystem.

File Naming Rule
Purpose

Keep the filesystem readable and role-driven.

Rule

Files must follow these naming conventions:

DAL files end with .dal.js

Model files end with .model.js

Controller files end with .controller.js

Hook files begin with use

Adapter files end with .adapter.js

View screens end with .view.jsx or ViewScreen.jsx

Final screens end with Screen.jsx

The role of a file should be obvious from its name alone.

Feature Boundary Rules (Locked)
Feature Containment Rule
Purpose

Ensure every feature owns its logic inside its own folder.

Rule

All files belonging to a feature must live inside that feature’s folder.

Each feature must contain its own:

adapters

DAL

model

controller

hooks

components

screens

Feature logic must not be placed in unrelated shared folders unless it is truly generic and domain-neutral.

Forbidden examples:

src/shared/messages/sendMessage.controller.js
src/lib/explore/useExploreFeed.js
src/components/onboarding/OnboardingCard.jsx

If logic belongs to a feature, it must live in that feature.

Cross-Feature Boundary Rule
Purpose

Prevent features from importing each other’s internals.

Rule

A feature may not import another feature’s internal files, including:

DAL

models

controllers

hooks

components

screens

internal utilities

Direct cross-feature imports are forbidden.

Adapter Contract
Purpose

Adapters are the public boundary of a feature.

They answer one question only:

What is the safe public surface this feature exposes?

Adapter Rules

Adapters may:

re-export selected hooks

re-export selected components

re-export selected view screens

Adapters must:

be the only cross-feature import surface

expose only intentionally public APIs

hide internal folder structure from consumers

remain thin and declarative

act as re-export boundaries only

Adapters must not:

import Supabase

contain DAL logic

contain business rules

replace controllers

replace hooks

become orchestration layers

compose domain behavior

Adapters may export only:

hooks

components

view screens

Adapters must never export:

DAL

models

controllers

Adapter Import Rule

Any code outside a feature must import the feature through its adapter.

Allowed:

import { OnboardingCardsView } from '@/features/onboarding/adapters/onboarding.adapter';

Forbidden:

import { useOnboardingCards } from '@/features/onboarding/hooks/useOnboardingCards';
import { onboardingController } from '@/features/onboarding/controller/onboardingController';
Screen-to-Feature Access Rule

Final Screens and View Screens must never import another feature’s internal files.

They must only import other features through adapters.

Allowed:

import { ExploreViewScreen } from '@/features/explore/adapters/explore.adapter';
import { OnboardingCardsView } from '@/features/onboarding/adapters/onboarding.adapter';

Forbidden:

import { ExploreView } from '@/features/explore/ui/ExploreView';
import { useOnboardingCards } from '@/features/onboarding/hooks/useOnboardingCards';
Recommended Feature Structure
src/features/<feature>/
  adapters/
    <feature>.adapter.js
  dal/
  model/
  controller/
  hooks/
  components/
  screens/

Example:

src/features/messages/
  adapters/
    messages.adapter.js
  dal/
  model/
  controller/
  hooks/
  components/
  screens/
Dependency Rules (Locked)
Dependency Direction Rule
Purpose

Prevent circular dependencies and preserve architectural clarity.

Rule

Dependencies must always flow in one direction.

Modules may only depend on modules below them in the architecture hierarchy.

Modules must never depend on modules above them.

Allowed Dependency Flow
screens
↓
features
↓
shared
↓
core

Higher layers may depend on lower layers.

Lower layers must never depend on higher layers.

Feature Dependency Rule

Features may depend on:

shared utilities

shared UI components

core infrastructure

Features may not depend directly on other features unless through that feature’s adapter boundary.

Circular Dependency Rule

Dependency cycles are forbidden.

Forbidden example:

explore → messages
messages → notifications
notifications → explore

If a cycle appears, the shared logic must be extracted into:

src/shared/

Both features may depend on shared modules, but shared modules must never depend on features.

DAG Principle

The system must form a Directed Acyclic Graph (DAG) of dependencies.

Dependencies always flow in one direction.

No cycles are allowed.

UI Ownership Rule (Locked)
Purpose

Prevent UI spaghetti and tangled rendering dependencies.

UI must remain owned by the feature that defines the domain experience.

Rule

UI components belong to the feature that owns the domain behavior.

Components must not be imported directly across feature boundaries.

If another feature needs UI from a feature, it must access it through that feature’s adapter.

Allowed UI Imports

Inside the same feature, components may import each other freely.

Example:

src/features/messages/components/MessageComposer.jsx

may import:

src/features/messages/components/MessageInput.jsx
src/features/messages/components/MessageToolbar.jsx
Forbidden UI Imports

A feature must never import another feature’s internal UI.

Forbidden:

src/features/explore/components/ExploreFeed.jsx
imports
src/features/messages/components/MessageComposer.jsx

or

src/features/profile/components/ProfileHeader.jsx
imports
src/features/explore/components/ExploreCard.jsx
Correct Access Pattern

Allowed:

import { MessageComposer } from '@/features/messages/adapters/messages.adapter';

Forbidden:

import MessageComposer from '@/features/messages/components/MessageComposer';
Shared UI Exception

Shared UI may exist only if it is domain-neutral.

Example:

src/shared/ui/

Shared UI must not contain domain meaning.

Final Architectural Principles (Locked)

Security lives in RLS.

Meaning lives in Controllers.

Shape lives in Models.

Timing lives in Hooks.

Composition lives in Screens.

Public feature boundaries live in Adapters.

Shared remains domain-neutral.

Data access stays dumb, explicit, and boring.

Architecture must grow horizontally, not vertically.

The role of a file should be obvious from its name.

The role of a module should be obvious from its folder.

A developer should understand the system by reading the filesystem without opening files.