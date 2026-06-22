# PROJECT BOUNDARY ISOLATION CONTRACT

## Purpose

This contract enforces strict project-boundary isolation across the VCSM repository.

Its purpose is to prevent accidental cross-project modifications, reduce architectural drift, and ensure that work remains scoped to the intended application or engine boundary.

This contract is always active when working anywhere inside the repository.

---

## Protected Project Roots

The repository contains the following protected roots:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM`
- `/Users/vcsm/Desktop/VCSM/apps/wentrex`
- `/Users/vcsm/Desktop/VCSM/apps/Traffic`
- `/Users/vcsm/Desktop/VCSM/engines`

Each root is treated as an independent project boundary.

---

## Core Rule

When work begins inside one project root, modifications must remain داخل that same root.

Default rule:

- Work started in `apps/VCSM` → modify only `apps/VCSM/**`
- Work started in `apps/wentrex` → modify only `apps/wentrex/**`
- Work started in `apps/Traffic` → modify only `apps/Traffic/**`
- Work started in `engines` → modify only `engines/**`

No mixing is allowed by default.

---

## Cross-Boundary Modification Rule

Cross-project modification is forbidden unless one of the following is true:

1. The task explicitly states that more than one root must be modified
2. The execution plan clearly declares the multi-root scope
3. Explicit user approval is given before changes begin

If a task would require touching files in more than one protected root, execution must stop and the expanded scope must be declared before proceeding.

---

## Allowed Scope Labels

Every planning or execution flow must declare one of these scope labels:

- VCSM
- WENTREX
- TRAFFIC
- ENGINE
- VCSM + ENGINE
- WENTREX + ENGINE
- TRAFFIC + ENGINE
- BOTH APPS
- BOTH APPS + ENGINE
- VCSM + TRAFFIC
- WENTREX + TRAFFIC
- VCSM + WENTREX + TRAFFIC
- FULL REPO

If the scope is not declared, assume single-root isolation by default.

---

## Default Assumption

The default assumption is always:

**single project boundary only**

No command, agent, or workflow may silently expand scope beyond the current project root.

---

## Engine Rule

`/Users/vcsm/Desktop/VCSM/engines` is a protected shared root.

Engine files must not be modified just because an issue appears inside an app.

If a fix requires engine changes, the scope must explicitly change to:

- `VCSM + ENGINE`
- `WENTREX + ENGINE`
- `TRAFFIC + ENGINE`

Engine work must never be disguised as app-only work.

---

## Traffic Rule

`/Users/vcsm/Desktop/VCSM/apps/Traffic` is a separate project boundary.

Traffic must not be treated as part of VCSM or Wentrex.

Traffic work must remain isolated unless explicit multi-root approval is given.

---

## No Silent Refactors Across Roots

The following actions are forbidden across protected roots unless explicitly requested and approved:

- moving files between roots
- renaming files across roots
- sharing code by copying between roots
- refactoring app code into engines
- refactoring engine code into apps
- reorganizing folder structures across roots

Cross-root restructuring always requires explicit approval.

---

## Documentation Scope Rule

Documentation review and updates must follow the same project boundary.

If implementation scope is:

- VCSM → only VCSM-relevant docs
- WENTREX → only Wentrex-relevant docs
- TRAFFIC → only Traffic-relevant docs
- ENGINE → only engine-relevant docs

Documentation must not silently expand beyond implementation scope.

---

## Debugging Scope Rule

Debugging must follow the same boundary rules.

If a bug is observed in one project root, debugging must begin there.

If investigation proves the root cause exists in another protected root, the expanded scope must be declared before modifications occur.

---

## Database Rule

Database inspection may occur in read-only mode when needed.

However, database review does not grant permission to cross project roots in code modifications.

Code boundary isolation remains in force even when multiple projects depend on shared database objects.

---

## Planning Rule

Every execution plan must explicitly state:

- the project root being modified
- the application scope
- whether any protected root outside the current one will be touched

If more than one protected root would be modified, the plan must stop and request approval before execution.

---

## Command Integration Rule

All command systems must obey this contract, including but not limited to:

- Wolverine
- Logan
- BugsBunny
- DB
- Loki
- Kraven
- Venom
- Carnage
- Ironman
- Thor
- Captain
- Session Summary
- Contract Reviewer

No command may override this contract silently.

---

## Violation Rule

The following are considered contract violations:

- modifying files in a second protected root without declared scope
- making engine changes during app-only work
- touching Traffic while working on VCSM or Wentrex without approval
- touching Wentrex while working on VCSM without approval
- touching VCSM while working on Traffic without approval
- expanding documentation scope without implementation scope expansion

Any such violation must be reported immediately.

---

## Command Principle

This repository is a multi-project system with protected boundaries.

Discipline requires that work remain scoped to the intended project.

Isolation is the default.
Scope expansion must be explicit.
Cross-root change must never happen silently.