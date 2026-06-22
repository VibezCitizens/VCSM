# AUTOMATED ARCHITECTURE ENFORCEMENT CONTRACT (Locked)

> **Status:** Locked
> **Type:** Architectural — automated enforcement tooling discipline
> **Library:** [Architecture/21-automated-checks-rule.md](Architecture/21-automated-checks-rule.md) · [Architecture/22-eslint-enforcement-rule.md](Architecture/22-eslint-enforcement-rule.md) · [Architecture/23-architecture-script-rule.md](Architecture/23-architecture-script-rule.md) · [Architecture/24-enforcement-philosophy.md](Architecture/24-enforcement-philosophy.md)
> **Applies To:** All features in `apps/VCSM/` and `apps/wentrex/` — all commands and CI tooling

---

## Purpose

Architecture contracts without automated enforcement are guidelines, not contracts.

This contract defines the minimum automated checks that must be in place to support the architecture governance process and protect human review time from catching obvious violations.

Automated checks are not a replacement for architecture review — they are the prerequisite layer that ensures architecture review can focus on judgment, not mechanics.

---

## Lightweight Automated Checks Rule

The architecture contracts must be supported by automated checks.

Automation should catch obvious violations before human review.

**Minimum required checks:**

| Check | Description |
|---|---|
| Feature boundary violations | Cross-feature internal imports that bypass the adapter |
| Direct cross-feature internal imports | Any import reaching into another feature's non-adapter files |
| Adapter export violations | Features exporting non-adapter symbols to external consumers |
| DAL importing models/controllers/hooks/UI | DAL must not import application layers above it |
| Hooks importing DAL or Supabase | Hooks must call controllers, not DAL or Supabase directly |
| Screens/components importing DAL, controllers, or Supabase | UI layer must not bypass the hook layer |
| `.select('*')` in DAL/resolver files | Explicit column projection required in all queries |
| Files over 300 lines | Hard size limit — single responsibility violation |
| Feature folder depth over 3 levels | Exceeds max nesting rule |
| Forbidden relative `../../` import chains | Cross-directory relative imports indicate boundary leakage |
| Zustand used for server truth | Zustand scope limited to UI-only ephemeral state |
| Manual `useState + useEffect` server-fetch patterns | React Query required for server state |

---

## ESLint Enforcement Rule

Use ESLint rules where possible to enforce:

- import boundaries
- forbidden layer imports (DAL→model/controller/hook/UI; hook→DAL/Supabase; UI→DAL/controller/Supabase)
- forbidden Supabase imports outside DAL, resolvers, and approved auth adapters
- forbidden cross-feature internal imports
- file naming conventions (layer-encoded filenames)
- forbidden adapter exports (non-adapter symbols exported from feature roots)

ESLint is preferred for import-related rules because it runs at edit time and provides immediate feedback to the developer.

---

## Architecture Script Rule

Use scripts where ESLint is insufficient.

Architecture scripts may check:

- file size (lines over 250, over 300)
- folder depth (levels below feature root)
- feature file counts (per threshold in Feature Size Governance Contract)
- layer naming compliance
- `.select('*')` usage
- React Query adoption metrics
- TTL cache usage
- Zustand store usage patterns

Scripts run in CI or pre-merge and produce actionable reports.

---

## Enforcement Philosophy

Automated checks must start as warnings.

Once stable, critical rules must become merge-blocking errors.

**Required severity matrix:**

| Rule | Severity |
|---|---|
| Cross-feature internal imports | ERROR |
| Supabase imported in UI/hooks/models | ERROR |
| `.select('*')` in DAL or resolver | ERROR |
| Files over 300 lines | ERROR |
| Files over 250 lines | WARNING |
| Feature folder over 100 files | WARNING |
| TTL cache usage | WARNING |
| Manual server-state hooks (useState+useEffect) | WARNING |

**Principle:**

Automation does not replace architecture review.

Automation protects architecture review from wasting time on obvious violations.

---

## Cross-Links

- [Architecture/07-adapter-contract.md](Architecture/07-adapter-contract.md) — adapter as public surface (drives boundary checks)
- [Architecture/03-layer-contracts.md](Architecture/03-layer-contracts.md) — layer rules that checks enforce
- [Architecture/15-sprint-review-rule.md](Architecture/15-sprint-review-rule.md) — human review that automation supports
- [Architecture/17-folder-depth-enforcement.md](Architecture/17-folder-depth-enforcement.md) — folder depth rule automated here
- [Architecture/18-react-query-server-state.md](Architecture/18-react-query-server-state.md) — server-state rule automated here
- [Architecture/20-zustand-scope.md](Architecture/20-zustand-scope.md) — Zustand scope rule automated here
