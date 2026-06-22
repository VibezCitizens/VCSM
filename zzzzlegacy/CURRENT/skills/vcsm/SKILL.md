# VCSM Workspace — AI Agent Instruction Contract

This document is the canonical instruction set for AI/code agents operating inside this workspace.
It is not a README. It is not documentation. It is an execution contract.

Read every section before taking any action.

---

## §1 Workspace Overview

This monorepo contains three completely separate products plus shared infrastructure.

| Path | Type | Product |
|---|---|---|
| `apps/VCSM/` | Product | Social marketplace hybrid (Instagram + Airbnb) — actor-based identities, content, chat, booking, storefronts |
| `apps/wentrex/` | Product | Standalone multi-tenant LMS SaaS — fully isolated from VCSM |
| `apps/Traffic/` | Product | Programmatic SEO Next.js 14 static site — no auth, no DB, deep-links into VCSM |
| `apps/WT/` | Transfer workspace | Internal staging only — never deploy, never import from |
| `engines/` | Shared infrastructure | Domain engines (chat, identity, hydration, portfolio, reviews, booking, notifications) |
| `shared/` | Shared infrastructure | Domain-neutral primitives (UI, utils, types) |
| `logan/` | Documentation only | All technical docs. Never contains source code |
| `zNOTFORPRODUCTION/` | Canonical/private | Contracts, skills, planning, debug panels, db snapshots — never ships |

### App Isolation Rules

- Never import from one product app into another. `apps/VCSM` and `apps/wentrex` are fully isolated.
- Never assume a pattern from one app applies to the other.
- Always confirm which app you are working in before making any change. If ambiguous, ask.
- Never move features between apps. Shared logic belongs in `engines/` or `shared/`.
- Both apps have LMS features — they are not the same LMS. Do not conflate them.
- `apps/WT/` is not a product. Never reference it from any production build.

---

## §2 Non-Negotiable Engineering Rules

These rules apply to every task, every session, every change.

### Surgical Changes Only

- Change exactly what was asked. Nothing more.
- Do not refactor surrounding code unless explicitly requested.
- Do not rename variables, reorganize imports, or "clean up" code that was not in scope.
- Do not introduce new abstractions unless the task explicitly requires one.
- Do not move logic unless explicitly asked.
- Do not improve what is not broken.

### Preserve Behavior

- Every change must preserve existing behavior unless the task is explicitly to change it.
- If a change breaks other behavior, stop and report it — do not silently patch around it.

### No Full Rewrites

- Never rewrite a file, feature, or module unless explicitly approved.
- Rewrites require explicit user sign-off with a scope statement.

### Architecture Stability

- Respect existing layer boundaries. Do not collapse layers for convenience.
- Do not introduce new patterns without documenting the deviation and getting approval.
- The architecture contract overrides any inferred convention.

### Trace Before Touching

- Before editing any file, trace the full execution path: UI → Hook → Controller → Model → DAL → DB.
- Understand what calls the file, what the file calls, and what breaks if the file changes.
- Never assume a function is unused without running `grep` across the repo.

### Claim Evidence Rules

All technical statements must be one of:

- **Confirmed** — directly verified in code with file path + line reference
- **Likely** — strong evidence, not fully verified; label it explicitly
- **Uncertain** — not enough evidence; say so and recommend a verification step

Never present guesses as facts. Never invent root causes. Never claim a migration is complete without tracing runtime usage.

---

## §3 Persistent Ticket Workflow

Every task must have a ticket. Open it before analysis begins. Never merge unrelated work into one ticket.

### Ticket Format

```
[TICKET-XXXX] Title

Status: Open | In Progress | Blocked | Complete
Priority: P0 | P1 | P2 | P3
Type: ENG | BUG | TASK | SEC
App: VCSM | Wentrex | Traffic | engines | shared

Goal:
  One sentence. What must be true when this is done?

Context:
  What is the current state? What is broken or missing?

Decisions:
  Choices made during this ticket and why.

Constraints:
  What must not change? What are the boundaries?

Next Action:
  Exact next step.
```

### Continuation Format

When resuming a ticket in a new turn:

```
Continue [TICKET-ID]
```

### Ticket ID Naming

- Engineering tasks: `ENG-XXXX`
- Bugs: `BUG-XXXX`
- General tasks: `TASK-XXXX`
- Security work: `SEC-XXXX`

### Output Reference

All output for a ticket must reference the ticket ID in headings and section summaries.

---

## §4 VCSM Architecture Gate — Mandatory Pre-Work

**Before touching any file inside `apps/VCSM/`, read this file in full:**

```
/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_CANONICAL/zcontract/ARCHITECTURE.md
```

This contract is locked. It overrides any local assumption, prior pattern, or inferred convention.

### Identity — Actor-Based Only

- Canonical identity fields: `actorId` and `kind` (`'user'` | `'vport'`)
- Never scope behavior by `profileId`, `vportId`, or raw `userId`
- Never expose `profileId` or `vportId` through `useIdentity()` or any public hook/controller surface
- "Owner" always means Actor Owner, verified through `actor_owners`. No other ownership model exists.

### Additional Hard Rules

- All new cross-folder imports must use `@/...` path aliases — never `../../` chains
- `select('*')` is banned in all DAL files — always use explicit column lists
- Files must stay under 300 lines — split before continuing if exceeded
- One feature must never import directly from another feature's internals — use adapters

---

## §5 Layer Rules

### Mandatory Build Order

Always build in this order. Never skip layers. Never work backwards.

```
DAL → Model → Controller → Hook → Components → View Screen → Final Screen
```

### Layer Contracts

| Layer | Answers | May | Must NOT |
|---|---|---|---|
| **DAL** | What does the database say? | Call Supabase; use explicit column projections | Apply business rules; normalize fields; import models/controllers/hooks/screens |
| **Model** | What does this data mean to the app? | Rename fields; derive booleans; normalize nullables | Import Supabase; enforce permissions; contain business rules |
| **Controller** | Is this action allowed and what is the correct domain result? | Call DAL; call Models; call other controllers (justified only) | Import Supabase directly; import React/UI; return raw DB rows; perform routing |
| **Hook** | When should this run and how should the UI respond? | Use React APIs; hold UI state; call controllers; subscribe to realtime | Import Supabase; call DAL; apply business rules; infer ownership or permissions |
| **Component** | How does this UI piece render given props and local UI state? | Receive props/callbacks; use local UI state; render layout | Import Supabase/DAL; call controllers; contain business or permissions logic |
| **View Screen** | How does this domain experience behave and render? | Call domain hooks; compose components; hold view-local UI state | Import DAL/Supabase; call controllers directly; enforce permissions |
| **Final Screen** | Given route and identity, which experience should exist? | Read route params; read global context; perform hard guards; choose View Screen | Import DAL/models/controllers; execute business logic; fetch or mutate data |
| **Resolver** | What VCSM-specific data does this shared engine need? | Import Supabase; query via explicit columns; return factory closures | Be imported outside `setup.js`; apply business rules; contain UI logic |

### File Naming Conventions

- DAL files: end with `.dal.js`
- Model files: end with `.model.js`
- Controller files: end with `.controller.js`
- Hook files: begin with `use`
- Adapter files: end with `.adapter.js`
- Resolver files: end with `.resolver.js`, live in `resolvers/` subfolder
- View Screens: end with `.view.jsx` or `ViewScreen.jsx`
- Final Screens: end with `Screen.jsx`

The role of a file must be obvious from its name alone.

### File Size

- Hard limit: 300 lines
- Target: 80–200 lines
- Files at 250+ lines must be reviewed for decomposition before adding more code
- Decompose along architectural boundaries, not arbitrary grouping

### Controller Fan-Out Limit

A controller may call at most 5 external modules (DAL files, models, utilities, other controllers). If more are required, decompose the use-case.

### Maximum Folder Depth

Feature modules must not exceed 3 directory levels below the feature root. Architecture must be visible from the filesystem without opening files.

---

## §6 Source Ownership

| Path | Owns | Cannot |
|---|---|---|
| `apps/VCSM/` | VCSM product code — all features, screens, hooks, controllers, DALs, components | Import from `apps/wentrex/` or `apps/Traffic/` |
| `apps/wentrex/` | Wentrex LMS product code — fully isolated | Import from `apps/VCSM/` |
| `apps/Traffic/` | Next.js SEO site — mock data only, no auth, no DB | Import from engines, shared, or other apps |
| `apps/WT/` | Transfer workspace — experimental only | Be imported by any other app; be deployed |
| `engines/` | Reusable domain engines | Import from any `apps/` directory |
| `shared/` | Domain-neutral UI and utilities | Import from features; contain domain logic |
| `logan/` | Documentation only | Contain source code |
| `zNOTFORPRODUCTION/` | Contracts, skills, planning, debuggers, DB snapshots | Ship to production |

### Dependency Direction

```
apps/VCSM     ──┐
                ├──→ engines/ ──→ shared/
apps/wentrex  ──┘
```

Apps never depend on each other. Ever.

---

## §7 File Movement Rules

- Never move a file unless explicitly requested.
- Never reorganize a folder without a written plan reviewed by the user.
- Every file move requires a full import graph audit before executing.
- Before deleting any file: grep the symbol and filename across the full repo and confirm zero consumers.
- Never create `README.md` files unless explicitly approved. The only approved README is `logan/README.md`.
- Never create `.md` files inside `apps/`, `engines/`, `shared/`, or `src/` — all documentation belongs in `logan/`.
- All filenames must have valid extensions and no spaces.

---

## §8 Adapter and Boundary Rules

### Cross-Feature Access

A feature may not import another feature's internal files — DAL, models, controllers, hooks, components, screens, or internal utilities.

All cross-feature access must go through that feature's adapter:

```js
// Allowed
import { OnboardingCardsView } from '@/features/onboarding/adapters/onboarding.adapter';

// Forbidden
import { useOnboardingCards } from '@/features/onboarding/hooks/useOnboardingCards';
```

### Adapter Contract

Adapters are the public boundary of a feature. They:

- Re-export selected hooks, components, and view screens only
- Must remain thin and declarative — re-export boundaries only
- Must never export DAL, models, or controllers
- Must never contain business rules, DB logic, or orchestration

### DAL Export Rule

DAL functions must not be exported through public adapter barrels unless explicitly approved for a specific use-case. DAL is internal to its feature.

### Security Note on Hooks

Hooks must never infer ownership or security from UI state. Ownership is always verified by the Controller layer through `actor_owners`. A hook that assumes ownership based on local state is an authorization bypass.

---

## §9 Security Workflow — Command Reference

Use the correct command for the correct security concern. Do not combine them.

| Command | Purpose | When to Use |
|---|---|---|
| `/Venom` | Security sheriff — trust boundary review | First pass on any new feature or write path. Checks auth, RLS, session trust, data exposure |
| `/BlackWidow` | Ethical red team — adversarial runtime verification | After `/Venom`. Attacks the system from an adversarial perspective. Verifies defenses hold under abuse cases |
| `/ELEKTRA` | Precision security scanner and patch advisor | Targeted scan for a specific vulnerability class. Traces source→sink chains. Proposes patches — never applies them |
| `/Carnage` | Database migration architect | Any schema change, table creation, RLS policy addition, or index modification |
| `/Thor` | Release commander | Before any production push. Validates readiness, changelog, and deployment gates |
| `/SPIDER-MAN` | Regression safety net and test coverage | After any significant change. Validates existing behavior is preserved. Identifies coverage gaps |
| `/Logan` | Documentation review and drift detection | After any architecture change. Ensures Logan docs match current implementation |

### Security Baseline Rules (always apply)

- Ownership is always verified server-side through `actor_owners` — never trust client-supplied actor context
- Never use `select('*')` — data minimization is a security property, not just a style rule
- Never expose raw UUIDs in public-facing URLs — always use human-readable slugs
- Never trust browser input, query params, request bodies, or localStorage without server-side validation
- RLS enforces access control at the database layer — controllers must still validate ownership before writes
- Notification links and QR codes must use signed or slug-based paths, never raw record IDs

---

## §10 Build and Test Discipline

Every implementation return must include all of the following.

### Implementation Return Format

```
[TICKET-ID] — Implementation Complete

Files Changed:
  - path/to/file.js — what changed and why

Behavior Changed:
  - Before: [exact previous behavior]
  - After: [exact new behavior]
  - Unchanged: [what was explicitly preserved]

Grep Checks:
  - grep "oldFunctionName" → [result]
  - grep "importedSymbol" → [consumers confirmed / none found]

Tests Run:
  - [test file] → [passed / failed / skipped]
  - If no tests were run: state this explicitly

Build Result:
  - [passed / failed / not run — state which and why]

Remaining TODOs:
  - [open items, known gaps, or follow-up tickets needed]
```

### Honesty Rules

- Never claim tests passed unless they were actually executed and the output was observed.
- Never claim a build succeeded unless the build output was checked.
- Never claim "no consumers found" unless `grep` was run and the result was shown.
- Never hide a blocker. If something cannot be completed, state it and explain why.
- Never expand scope without asking. If the task reveals a related issue, report it — do not fix it silently.

---

## §11 Documentation — Logan Rules

- All technical documentation lives in `logan/` — never inside `apps/`, `engines/`, `shared/`, or `src/`.
- Logan files follow the naming convention: `domain.system.topic.md`
- Full index: `logan/README.md` (the only approved README in the repo)
- Never modify source code during a documentation audit unless explicitly approved.
- Security reviews that produce findings must be covered in Logan before the ticket closes.
- Module docs must track the source cards and modules they describe.
- If a Logan doc conflicts with the current implementation, flag the drift — do not silently update the doc to match incorrect code.

---

## §12 Dashboard and Feed Module Rules

These rules apply to any controller or feature that publishes to the VPORT feed.

### Ownership Gate

Dashboard-to-feed publish controllers must enforce actor ownership before calling `createSystemPost`. No exception. Ownership is verified through `actor_owners` using the caller's `actorId`.

### Publish Result Shape

All publish controllers must return a structured result:

```js
{ published: boolean, status: string, reason: string, postId: string | null }
```

Never return a raw Supabase row from a publish path. Never return a boolean alone.

### Feed Payload Standards

- Structured feed payloads are preferred over text parsing.
- Legacy text parsing is allowed as a fallback for existing consumers — do not remove it without a migration plan.
- Old feed posts must remain backward compatible. Never change a feed payload shape without confirming that all consumers handle both shapes.

### Exchange and Rate Validation

- Any controller that publishes exchange or pricing data must validate rate format and bounds before writing.
- Never publish a feed post with unvalidated numeric data from a client request.

---

## §13 Output Style — Agent Behavior Contract

### Start With the Ticket

Every response on an active task must reference the ticket ID. Do not begin with a summary — begin with the ticket.

### State Exact Scope

Before making any change, state exactly:
1. What file(s) will be changed
2. What behavior will change
3. What will remain unchanged

If the scope is unclear, ask. Do not assume.

### Avoid Broad Plans When Asked for a Patch

If the user asks for a patch, deliver a patch. Do not respond with a full system redesign. Reserve planning mode for tasks that explicitly require it.

### Never Claim Success Without Evidence

- Do not say "tests pass" unless you ran them and observed the output.
- Do not say "build succeeded" unless you checked the build output.
- Do not say "no consumers found" unless you ran `grep` and showed the result.

### Never Hide Blockers

If something cannot be done within the constraints of the contracts, state it clearly. Propose a path forward. Do not silently work around a contract violation.

### Ask Before Expanding Scope

If a task reveals a related issue, file a new ticket and report it. Do not fix adjacent issues silently. Scope creep is an architectural risk.

---

## §14 Technology Stack Constraints (VCSM)

- **Language:** JavaScript (ES Modules) — TypeScript is banned. Zero `.ts` / `.tsx` files.
- **UI:** React 19 + Vite
- **Styling:** UnoCSS + CSS custom properties (`--vc-*` tokens). No hardcoded Tailwind blue/slate/indigo/neutral classes.
- **State:** Zustand
- **Routing:** React Router DOM
- **Database:** Supabase (PostgreSQL + Auth + Realtime)
- **Config:** `jsconfig.json` — never `tsconfig.json`

### Banned in VCSM

- `.ts` / `.tsx` files
- `tsconfig.json`
- CSS-in-JS (styled-components, emotion)
- Sass / SCSS / Less
- Redux / MobX
- Next.js / Remix
- GraphQL

---

## §15 Spatial and UI Rules

### Avatar Rule

Avatars must be square with rounded corners. Never circular.

| Size | Class |
|---|---|
| Large (64px+) | `rounded-2xl` |
| Medium/Small (24–56px) | `rounded-lg` |
| Tiny (<24px) | `rounded-md` |

`rounded-full` is banned for avatars. Always use `object-cover` + `border border-white/12` + `onError` fallback to `/avatar.jpg`.

### iOS Stacking Context

Never render `position: fixed` modals inside a parent that has `backdrop-filter`, `transform`, `filter`, or `overflow: hidden` with `border-radius`. Always render modals as fragment siblings, not children of styled card containers.

### UI Copy Rules

- Never use arrow symbols (→ ← ↑ ↓) in any UI copy, buttons, or links.
- Use official platform vocabulary: Citizen, Vport, District, Vibe, Spark, Vox, Thread, Citizen Central.

### Debug Output Rule

Never use `console.log` for debug output. All debug output must render on screen and be dev-only — never reach production. All debuggers live in `zNOTFORPRODUCTION/debuggers/[feature]/` with the standard 4-file structure.

---

## §16 Files That Must Never Ship to Production

| Directory | Reason |
|---|---|
| `.claude/` | Claude Code tooling config |
| `planning/` | Session planning files |
| `logan/` | System documentation |
| `session-summaries/` | Conversation logs |
| `db_snapshot/` | Schema snapshots and seeds |
| `debuggers/` | Dev-only debug panels |
| `apps/WT/` | Transfer workspace — not a product |
| `zNOTFORPRODUCTION/` | Canonical private contracts and skills |

---

## §17 Contract References

All locked contracts live in `zNOTFORPRODUCTION/_CANONICAL/zcontract/`.

| Contract | Governs |
|---|---|
| `ARCHITECTURE.md` | Layer contracts, identity, build order, adapter rules — read before every VCSM session |
| `SECURITY_ENGINEERING_CONTRACT.md` | Auth, database, infrastructure security |
| `SENIOR_DEVELOPER_CONTRACT.md` | Execution quality, truthfulness, claim evidence |
| `ANTI_HALLUCINATION_ENGINEERING_CONTRACT.md` | Claim verification, evidence classification |
| `REAL_WORLD_ENGINEERING_OPS_CONTRACT.md` | Operational engineering standards |
| `STRATEGIC_REALITY_DEBRIEF_CONTRACT.md` | Product analysis standards |
