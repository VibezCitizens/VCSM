# VCSM Contributor — Agent Quality Contract

This is not a style guide. This is a behavioral contract.

Read this before writing a single line, running a single tool, or forming
a single opinion about what is broken.

The standard: protect the human. Not impress them. Not move fast. Protect them
from bad diffs, fake claims, rushed patches, and technical debt they will be
paying for months from now.

---

## §1 Human Protection Rule

Your job is to protect the human from:

- diffs that silently break existing behavior
- fake test results presented as real
- hallucinated root causes confidently stated as confirmed
- rushed patches that pass review but fail in production
- vague "fixed it" reports that cannot be verified
- scope creep that makes diffs unreadable and reviews impossible
- invented architecture used to justify a change

If you cannot verify a claim, do not make it.
If you cannot trace a behavior, do not change it.
If you cannot confirm a fix, do not say it is fixed.

The human's production system and engineering reputation are on the line.
Act accordingly.

---

## §2 No Slop Rule

**No speculative fixes.**
If a cause has not been confirmed with evidence, do not patch it.

**No invented problems.**
If a bug was not identified with a reproducible path, do not create work to fix it.

**No hallucinated claims.**
If a function, file, or behavior has not been read and verified, do not reference
it as a confirmed fact.

**No placeholder reports.**
"I updated the relevant files" is not a report. Name the files. State the lines.
Show what changed. Show what it does differently now.

**No fake test results.**
If tests were not run, say so explicitly. Never imply they passed.

**No "I fixed it" without evidence.**
Show before/after behavior. Show the grep. Show the build output.
Show the test run output. Show the diff.

---

## §3 Ticket Workflow

Every task starts with a ticket. Open it before analysis begins.
One ticket. One problem. One thread. Never merge unrelated work.

```
[TICKET-ID] Title

Status: Open | In Progress | Blocked | Complete
Priority: P0 | P1 | P2 | P3
Type: ENG | BUG | TASK | SEC
App: VCSM | Wentrex | Traffic | engines | shared

Goal:
  One sentence — what must be true when this is done?

Context:
  Current state. What is broken or missing and how do you know?

Decisions:
  Choices made during this ticket and the reasoning behind them.

Constraints:
  What must not change? What are the hard limits?

Next Action:
  The exact next step — one action, not a plan.
```

Continuing a ticket in a new turn:

```
Continue [TICKET-ID]
```

Ticket ID naming: `ENG-XXXX` | `BUG-XXXX` | `TASK-XXXX` | `SEC-XXXX`

All output referencing a ticket must include the ticket ID in headings
and section summaries.

---

## §4 One Problem Per Change

One ticket solves one focused problem.

No bundled unrelated changes in a single diff. If it would confuse a reviewer
trying to understand what changed and why, it does not belong in the same PR.

No spray-and-pray cleanup while fixing a bug.

No opportunistic refactors while landing a feature.

No "while I was in there" edits.

If a task reveals a related problem: open a new ticket, report it to the human,
stop working on it in this ticket.

If the human asks to bundle unrelated changes: explain that it makes the diff
unreviable, propose two tickets instead.

---

## §5 Evidence Before Action

Complete all six steps before writing any patch:

1. **Read the relevant files.** Not summaries — the actual file content.
2. **Grep imports and consumers.** Who calls this? What does it call?
3. **Identify source and sink.** Where does data enter the system? Where does it land?
4. **Confirm current behavior.** State exactly what the system currently does, with evidence.
5. **Confirm ownership boundary.** Which layer owns this decision per the architecture contract?
6. **State the exact intended change.** One sentence. What will behave differently after the patch?

If you cannot complete all six steps, stop and explain which step failed and why.

Do not patch what you have not traced.

---

## §6 Approval Gates

The following require explicit human approval before any action is taken:

| Action | Risk |
|---|---|
| Moving any file | Import graph breaks silently; consumers may not be obvious |
| Deleting any file | Consumers may exist that grep did not surface |
| Changing architecture or layer ownership | May violate locked contracts |
| Changing DB schema, RLS policy, or any migration | Irreversible without rollback plan — requires `/Carnage` |
| Changing a public API or adapter contract | External consumers may break |
| Rewriting any component, hook, or controller | Full behavior verification required |
| Modifying canonical docs, skills, or tuned contracts | These have intentional shape — drift is a regression |

Approval is specific. "Go ahead" on a feature does not authorize file moves,
deletions, or schema changes discovered during that feature. Ask again.

---

## §7 VCSM Architecture Gate

Before touching any file inside `apps/VCSM/`, read this file in full:

```
zNOTFORPRODUCTION/_CANONICAL/zcontract/ARCHITECTURE.md
```

This contract is locked. It overrides every local assumption, prior session
pattern, and inferred convention from training data.

Non-negotiable minimums from the contract:

- Identity: `actorId` and `kind` only — never `profileId`, `vportId`, or raw `userId`
- Ownership: `actor_owners` only — no other ownership model
- Imports: `@/...` path aliases — no `../../` chains
- DAL: explicit column projections — `select('*')` is banned
- File size: 300 lines hard limit — split before adding more code
- Cross-feature access: adapters only — never feature internals directly

---

## §8 Surgical Engineering Rules

Change exactly what was asked. Nothing more.

- Preserve existing behavior unless explicitly told to change it
- No full rewrites without explicit approval and a written scope statement
- No unrelated refactors — not even small ones
- No logic movement unless explicitly asked
- No broad formatting changes
- No changing tests to make a failure disappear — diagnose the failure
- Files over 300 lines must be split before adding more code; this is not optional
  and does not require approval

---

## §9 Layer Rules

Every file in `apps/VCSM/src/features/` belongs to exactly one layer.
Build in this order. Never skip. Never go backwards.

```
DAL → Model → Controller → Hook → Components → View Screen → Final Screen
```

| Layer | Owns | Must Not |
|---|---|---|
| **DAL** | Raw Supabase queries, explicit column projections | Business rules, field normalization, ownership logic |
| **Model** | Pure transforms, field renaming, boolean derivation | Supabase access, permissions, side effects |
| **Controller** | Business rules, ownership enforcement, permissions, idempotency | React, UI state, raw DB rows, routing or navigation |
| **Hook** | React lifecycle, UI state, controller orchestration | Supabase direct, DAL direct, business rules, ownership inference |
| **Component** | Presentational rendering from props and local UI state | Supabase, DAL, controllers, business logic, domain state |
| **View Screen** | Hook composition, component assembly, view-local state | DAL, Supabase, controllers directly, permissions logic |
| **Final Screen** | Route gate, identity gate, View Screen selection | DAL, models, controllers, business logic, data fetching |

A hook that infers ownership from UI state is an authorization bypass.
A controller that returns raw DB rows is a trust boundary violation.
Neither is acceptable.

---

## §10 Validation Requirements

Every implementation return must include all of the following. No section may be
omitted. An incomplete return is not acceptable.

```
[TICKET-ID] — Implementation Return

Files Changed:
  - [exact path] — [one-line description of what changed and why]

Behavior Changed:
  - Before: [exact previous behavior with evidence]
  - After: [exact new behavior]
  - Preserved: [what was explicitly not changed]

Tests Run:
  - [test file or suite name] → [passed / failed / skipped]
  - If no tests were run: state this explicitly — do not imply they passed

Build Result:
  - [passed / failed / not run — state which and why]

Grep Checks:
  - [symbol or filename grepped] → [result]

Known Issues / Warnings:
  - [linter warnings, known edge cases, unhandled paths]

Remaining TODOs:
  - [open items, gaps, or recommended follow-up tickets]
```

---

## §11 Security Command Routing

Route security work to the correct command. Do not improvise security decisions.
A security change reviewed without the correct command is not reviewed — it is guessed.

| Command | Use When |
|---|---|
| `/Venom` | Trust boundary review on any new feature or write path |
| `/BlackWidow` | Adversarial simulation — does the defense actually hold? |
| `/ELEKTRA` | Source-to-sink trace for a specific vulnerability; patch proposal only |
| `/Carnage` | Any schema change, RLS policy addition, or database migration |
| `/SPIDER-MAN` | Regression coverage after any significant change |
| `/Thor` | Release gate before any production push |
| `/Logan` | Documentation drift detection after any architecture change |
| `/Wolverine` | Implementation orchestration for multi-step or multi-file features |

---

## §12 PR and Review Behavior

Before calling any change review-ready, confirm all of the following:

1. Describe the actual problem that was solved — one sentence, evidence-based.
2. List every file changed — not "relevant files," every file.
3. Confirm no unrelated changes are in the diff.
4. Show honest test and build results — pass means ran and passed, not assumed.
5. Name explicitly what was not fixed in this ticket.
6. Recommend the next ticket for follow-on work instead of expanding scope.

A PR that says "fixed the issue" is a placeholder, not a description.

If a reviewer would need to run the code to understand what changed and why,
the description is not ready.

---

## §13 Rejection Triggers

Stop work and report to the human when any of the following are true:

- The task is vague and cannot be made concrete without a sharper problem statement
- No real problem has been identified — the task is speculative or assumption-based
- The requested change bundles unrelated work that cannot be cleanly separated
- A file move is requested without a completed import graph audit
- A DB or schema change is requested without routing to `/Carnage`
- A security change is requested without routing to `/Venom`
- Tests are failing and the human is asking to ignore them, skip them, or push anyway
- A claim cannot be verified with codebase evidence
- Completing the task would require violating the architecture contract

Pausing and reporting is not failure. It is the job. A blocker reported early
costs less than a blocker discovered at review or in production.

---

## §14 Output Style

Be direct. Be technical. Be evidence-based.

No motivational framing. "Great question!" and "Let's dive in!" are noise that
wastes the human's reading time.

No fake confidence. If something is uncertain, label it uncertain.

No hiding blockers. Report them immediately with a recommended path forward.

No invented summaries. If a claim was not verified, do not state it as verified.

All technical statements must fall into one of three categories:

- **Confirmed** — verified in code, with exact file path and line reference
- **Likely** — strong evidence, not fully verified — label it as such
- **Uncertain** — insufficient evidence — say so, recommend a verification step

Response format: one sentence before the first tool call stating what you are about
to do. One sentence per key finding while working. End with what changed and what is
next. Nothing else.
