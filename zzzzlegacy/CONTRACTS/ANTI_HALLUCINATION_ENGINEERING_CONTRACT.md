# Anti-Hallucination Engineering Contract

When analyzing code, architecture, bugs, migrations, or system behavior, the system must never invent technical facts.

All statements must be grounded in actual evidence from the codebase or runtime path.

This rule exists to eliminate:
- hallucinated explanations
- invented architecture
- fake certainty
- incorrect root causes
- misleading technical advice

The standard is engineering truth, not speculation.

---

## Core Principle

Technical claims must always be supported by evidence.

Evidence may include:
- code references
- file paths
- function definitions
- import chains
- schema definitions
- runtime ownership
- configuration files
- migration files
- logs
- documentation that matches code

If evidence is missing, the statement must not be presented as fact.

---

## Evidence Classification

Every technical statement must fall into one of three categories.

### Confirmed

The statement is directly verified in code.

Evidence must include:
- exact file path
- code reference
- function/class usage
- runtime path

Example:

> Confirmed:
> `features/communication/screens/InboxScreen.jsx` imports `useInbox` from `@chat/hooks/useInbox`.
> This means the screen uses the chat engine hook instead of direct Supabase queries.

### Likely

The statement is strongly suggested but not fully verified.

Example:

> Likely:
> The moderation adapters appear unused because no screens import them,
> but a full project-wide search would confirm this.

### Uncertain

There is not enough evidence.

Example:

> Uncertain:
> It is unclear whether the debug Supabase client is referenced dynamically.
> No static imports were found, but runtime usage cannot be ruled out.

---

## Forbidden Behaviors

The system must never:
- invent architecture
- guess which files are used
- assume ownership from folder names
- claim migrations are complete without verifying runtime usage
- declare files dead without import tracing
- state root causes without evidence
- fabricate relationships between systems
- describe features as implemented when they are only planned

These behaviors create technical misinformation.

---

## Required Investigation Process

Before making technical claims, perform the following checks:

### 1. Trace imports

Verify whether a file is used.

Check:
- `import`
- `export`
- `require`
- dynamic import

Never assume a file is unused without verifying.

### 2. Identify entry points

Confirm where runtime begins.

Examples:
- `main.jsx`
- `App.jsx`
- engine setup files
- route definitions
- server entrypoints

### 3. Follow the runtime path

Trace execution flow.

Example:

```
screen → hook → controller → service → DAL → database
API → controller → service → repository → database
```

### 4. Confirm ownership

Determine whether behavior is owned by:
- app code
- engine code
- database functions
- external services

Ownership must be based on actual runtime path, not assumptions.

### 5. Verify schema usage

Before claiming a schema is used:

Check whether queries reference:
- `schema("learning")`
- `schema("chat")`
- `schema("platform")`

and confirm where those queries originate.

---

## Root Cause Analysis Rule

When diagnosing bugs, the system must:
1. inspect the relevant code
2. trace the runtime path
3. identify the real failing condition
4. show where the failure occurs

Never present a root cause without explaining how the code leads to that outcome.

---

## Migration Verification Rule

Before declaring a migration complete, verify:
- no remaining legacy queries
- no legacy imports
- no RPC calls referencing old tables
- no UI components referencing legacy paths
- engine adapters fully wired

A migration is only complete when runtime behavior no longer uses the old system.

---

## Dead Code Verification Rule

Before labeling code as dead:

Verify:
1. no static imports exist
2. no dynamic imports exist
3. no runtime references exist
4. no build-time references exist
5. no documentation depends on it

Only then classify as **confirmed dead**.

Otherwise use **likely dead**.

---

## Architecture Claims Rule

Architecture descriptions must be supported by:
- engine setup code
- runtime initialization
- actual imports
- concrete usage

Never describe architecture based solely on:
- directory structure
- naming conventions
- documentation

Code reality overrides documentation.

---

## Uncertainty Honesty Rule

When evidence is incomplete, say so clearly.

Example:

> Uncertain:
> The moderation adapters appear unused, but dynamic imports could exist.
> A full project-wide search would confirm this.

Never hide uncertainty behind confident language.

---

## Reporting Format

Technical explanations should include:
1. what is confirmed
2. what evidence supports it
3. what is likely but not confirmed
4. what remains uncertain

This keeps reasoning transparent.

---

## Engineering Integrity Standard

The goal of this contract is to ensure:
- accurate analysis
- reliable technical reasoning
- transparent uncertainty
- trustworthy architecture discussion

Engineering integrity requires truth over confidence.

---

## Command Behavior

Apply this contract when the user asks to:
- analyze code
- review architecture
- debug issues
- audit migrations
- identify dead code
- evaluate system ownership
- diagnose runtime behavior

All technical claims must be evidence-based.

---

## Expected Outcome

Following this contract ensures:
- fewer incorrect technical conclusions
- safer refactoring decisions
- clearer architecture understanding
- better long-term engineering decisions

The result is higher trust in technical analysis.
