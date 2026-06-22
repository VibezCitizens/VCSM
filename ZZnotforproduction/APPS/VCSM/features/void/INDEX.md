---
name: vcsm.void.index
description: VCSM void feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / void

**Status:** ACTIVE (stub phase — feature not yet implemented)
**Last rebuilt by ARCHITECT:** 2026-06-04
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 0 | No controller files found; usecases/index.js is an empty stub |
| DAL files | 1 | dal/index.js — empty stub (// void DAL (stub) — export {}) |
| Hooks | 1 | hooks/index.js — empty stub |
| Models | 1 | model/index.js — empty stub |
| Screens | 1 | VoidScreen.jsx — functional placeholder screen only |
| Components | 1 | screens/index.js — empty stub (unlinked, LOW confidence per scanner) |
| Adapters | 1 | adapters/index.js — empty stub |
| Barrels | 1 | void.js — empty stub (// void DAL (stub) — export {}) |
| Tests | 0 | No tests exist |
| Routes | 1 | /void — public access, confirmed by SCREENS.md scanner |
| Total source files | 11 | All layers present as scaffolding; only VoidScreen.jsx has real content |

## Write Surface Map

No write surfaces detected by scanner.

The void feature has zero DB write operations in the current source. All DAL, model, and usecase files are empty stubs with no implemented operations.

## Security-Sensitive Surfaces

No high-sensitivity write surfaces in static scan.

However, the `/void` route is registered as **public** (no auth gate) despite the void realm being a planned 18+ anonymous-but-DB-tracked feature. This is a security planning gap: the route must be gated before any real content or user data flows through this module.

## Engine Dependencies

None detected.

Scanner found zero engine imports across all void feature files. No engine wiring exists in the current stub state.

## Routes

| Route | Access | Screen | Confidence |
|---|---|---|---|
| /void | public | VoidScreen.jsx | HIGH |

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT (PLACEHOLDER — no real contract) |
| ARCHITECTURE.md | PRESENT (this run — 2026-06-04) |
| CURRENT_STATUS.md | PRESENT (this run — 2026-06-04) |
| SCREENS.md | PRESENT (scanner-generated) |
| INDEX.md | PRESENT (rebuilt this run — 2026-06-04) |
