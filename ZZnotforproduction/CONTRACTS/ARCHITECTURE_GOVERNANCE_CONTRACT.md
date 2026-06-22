# ARCHITECTURE GOVERNANCE CONTRACT (Locked)

> **Status:** Locked
> **Type:** Architectural — sprint review and server-state discipline
> **Library:** [Architecture/15-sprint-review-rule.md](Architecture/15-sprint-review-rule.md) · [Architecture/16-feature-health-metrics.md](Architecture/16-feature-health-metrics.md) · [Architecture/17-folder-depth-enforcement.md](Architecture/17-folder-depth-enforcement.md) · [Architecture/18-react-query-server-state.md](Architecture/18-react-query-server-state.md) · [Architecture/19-ttl-cache-deprecation.md](Architecture/19-ttl-cache-deprecation.md) · [Architecture/20-zustand-scope.md](Architecture/20-zustand-scope.md)
> **Applies To:** All features in `apps/VCSM/` and `apps/wentrex/` — all commands

---

## Purpose

Architecture drift is invisible until it compounds.

This contract enforces two things:

1. **Regular architectural review** — every sprint cycle must include a structured review of feature health before merge.
2. **Server-state discipline** — React Query is the standard. TTL caches and unscoped Zustand stores are deprecated.

---

## Part 1 — Architecture Governance

### Regular Architecture Review Rule

Every sprint or bi-weekly cycle must include an architecture review before merge.

Review scope must cover:

- new feature folders
- changed feature boundaries
- cross-feature imports
- layer violations
- adapter exports
- file size violations
- module depth violations
- server-state patterns

**A feature is not merge-ready if it violates locked contracts unless an explicit contract exception is documented.**

---

### Feature Health Metrics Rule

Each feature must be measurable. Track the following metrics:

| Metric | Description |
|---|---|
| File count per feature | Total files inside the feature folder |
| Files over 250 lines | Count of files approaching size limit |
| Files over 300 lines | Count of files violating the 300-line hard limit |
| Max folder depth | Deepest nesting level below feature root |
| Cross-feature import count | How many imports cross feature boundaries |
| Direct internal feature imports | Imports that bypass the adapter |
| Adapter export violations | Features exporting non-adapter symbols |
| DAL Supabase/auth violations | DAL files importing auth or other anti-patterns |
| Hook-to-DAL violations | Hooks that call DAL directly instead of controllers |
| UI-to-controller/DAL violations | Screens or components calling controllers or DAL directly |
| React Query adoption percentage | Percentage of server reads using React Query |
| Manual server-state hooks count | Hooks using useState + useEffect for server fetches |
| TTL cache count | DAL-level TTL caches (deprecated) |
| Zustand store count | Zustand stores (must be UI-only; server data is a violation) |

Metrics must be reviewed regularly and used to prioritize architecture cleanup.

---

### Folder Depth Enforcement Rule

Feature folders must respect the max-depth rule.

**Rule:** Do not deepen nesting beyond 3 directory levels below the feature root.

If a feature needs deeper nesting, extract a module or new feature instead.

Deepening beyond this limit without extraction is a merge-blocking violation.

---

## Part 2 — Server State Contract

### React Query Server-State Rule

React Query is the standard server-state manager.

**Use React Query for:**

- database reads
- RPC reads
- mutation lifecycle
- cache invalidation
- loading/error/retry state
- server-derived lists and detail views

**Forbidden:** Do not introduce new manual `useState + useEffect` server-fetch patterns.

Existing manual patterns must be migrated progressively.

---

### TTL Cache Deprecation Rule

Uncoordinated TTL caches are deprecated.

**Rule:** Do not add new DAL-level TTL caches unless explicitly approved.

Existing TTL caches must be migrated to React Query or centralized cache ownership over time.

A new TTL cache introduced without explicit approval is a contract violation.

---

### Zustand Scope Rule

Zustand is allowed only for UI-only ephemeral state.

**Allowed Zustand state:**

- open/closed panels
- active tab
- draft UI state
- modal state
- temporary selection state

**Forbidden Zustand state:**

- server data
- ownership truth
- permission truth
- profile data
- booking data
- notification inbox data
- feed data

Server truth belongs in React Query or the database.

Storing server data in Zustand is a contract violation.

---

## Enforcement

All commands that review architecture, quality, or release readiness must enforce these rules.

| Rule | Violation Severity |
|---|---|
| Feature not reviewed at sprint/bi-weekly cycle | HIGH |
| Feature violates locked contracts without documented exception | MERGE_BLOCKED |
| File over 300 lines | HIGH |
| Folder depth exceeds 3 levels below feature root | MEDIUM |
| Cross-feature import bypassing adapter | HIGH |
| Hook calling DAL directly | HIGH |
| New useState + useEffect server-fetch pattern introduced | MEDIUM |
| New TTL cache without approval | MEDIUM |
| Zustand storing server data | HIGH |

---

## Cross-Links

This contract cross-links with:

- [Architecture/10-structural-integrity.md](Architecture/10-structural-integrity.md) — file size, folder depth, single responsibility
- [Architecture/05-feature-boundaries.md](Architecture/05-feature-boundaries.md) — feature containment rules
- [Architecture/07-adapter-contract.md](Architecture/07-adapter-contract.md) — adapter as public surface
- [Architecture/03-layer-contracts.md](Architecture/03-layer-contracts.md) — DAL, Hook, Controller layer rules
- [System/05-actor-ten-rules.md](System/05-actor-ten-rules.md) — actorId must be in React Query keys
