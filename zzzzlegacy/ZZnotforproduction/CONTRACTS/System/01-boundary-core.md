# Boundary Core Rules
## Project Boundary Isolation Contract — Purpose, Protected Roots, Core Rule, Cross-Boundary Modification Rule (Locked)

> **Source:** [../PROJECT_BOUNDARY_ISOLATION_CONTRACT.md](../PROJECT_BOUNDARY_ISOLATION_CONTRACT.md)
> **Status:** Locked
> **Index:** [INDEX.md](INDEX.md)
> **Reads Before:** [02-boundary-scope.md](02-boundary-scope.md)

---

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
