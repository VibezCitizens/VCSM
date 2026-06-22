---
name: vcsm.ui.index
description: VCSM ui feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / ui

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-04
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 0 | None — pure presentational module |
| DAL files | 0 | None — no data access |
| Hooks | 0 | None — stateless primitives |
| Models | 0 | None — no domain data |
| Screens | 0 | None — library module, not routed |
| Components | 5 | 5 named exports from ModernPrimitives.jsx (fm: 1 file; cg: 5 resolved exports) |
| Adapters | 0 | None — missing; boundary violation risk |
| Barrels | 0 | None — no index.js export barrel |
| Tests | 0 | No tests detected by scanner |
| Routes | 0 | No routes in route-map for this feature |
| Total source files | 2 | ModernPrimitives.jsx + module-modern.css (scanner reports 1 — likely counts .jsx only) |

## Write Surface Map

No write surfaces detected by scanner.

## Security-Sensitive Surfaces

No high-sensitivity write surfaces in static scan. This module has no data access layer and performs no DB operations.

## Engine Dependencies

None detected. Scanner confirms engines: [].

## Routes

No routes in route-map for this feature. This is a library/primitive module — it is imported, not routed.

## Physical File Listing

| File | Layer | Description |
|---|---|---|
| apps/VCSM/src/features/ui/modern/ModernPrimitives.jsx | component | 5 exported React primitives: ModernPage, ModernContainer, ModernShell, ModernTopBar, ModernButton |
| apps/VCSM/src/features/ui/modern/module-modern.css | style | CSS utility classes using --vc-* custom property tokens |

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT — PLACEHOLDER (no real content, needs authoring) |
| ARCHITECTURE.md | PRESENT (this run — 2026-06-04) |
| CURRENT_STATUS.md | PRESENT (this run — 2026-06-04) |
