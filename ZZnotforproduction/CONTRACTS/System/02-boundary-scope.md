# Boundary Scope Labels
## Project Boundary Isolation Contract — Allowed Scope Labels and Default Assumption (Locked)

> **Source:** [../PROJECT_BOUNDARY_ISOLATION_CONTRACT.md](../PROJECT_BOUNDARY_ISOLATION_CONTRACT.md)
> **Status:** Locked
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [01-boundary-core.md](01-boundary-core.md)
> **Reads Before:** [03-boundary-enforcement.md](03-boundary-enforcement.md)

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
