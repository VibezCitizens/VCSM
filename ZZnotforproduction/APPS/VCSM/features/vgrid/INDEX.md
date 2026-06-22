---
name: vcsm.vgrid.index
description: VCSM vgrid feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / vgrid

**Status:** ACTIVE (scaffold only — no implementation)
**Last rebuilt by ARCHITECT:** 2026-06-04
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 0 | No controller files detected by callgraph scanner |
| DAL files | 1 | dal/index.js — empty stub |
| Hooks | 1 | hooks/index.js — empty stub |
| Models | 1 | model/index.js — empty stub |
| Screens | 1 | screens/index.js — empty stub (unknown-screen, LOW confidence) |
| Components | 1 | ui/index.js — empty stub |
| Adapters | 1 | adapters/index.js — empty stub |
| Barrels | 4 | index.js, api/index.js, lib/index.js, usecases/index.js |
| Tests | 0 | No test files detected |
| Routes | 0 | No routes in route-map for this feature |
| Total source files | 10 | All files are empty barrel/stub files |

Note: cg_layerCounts is empty for vgrid — the callgraph scanner resolved no exports or imports in any file. The fm_layerCounts (path-convention-based) are the source of all counts above.

## Write Surface Map

No write surfaces detected by scanner.

All source files are empty stubs. No Supabase queries, RPCs, edge function calls, or table mutations are present in the vgrid feature source.

## Security-Sensitive Surfaces

No high-sensitivity write surfaces in static scan.

No auth, moderation, identity, notification, or financial table writes are present. However, once implementation begins, auth and ownership gates must be defined before any write surfaces are introduced. See ARCHITECTURE.md for pre-implementation VENOM recommendation.

## Engine Dependencies

None detected.

The scanner found no engine imports in any vgrid source file. Engine dependencies must be declared in BEHAVIOR.md before implementation begins.

## Routes

No routes in route-map for this feature.

The single screen stub (`screens/index.js`) is unlinked and carries LOW confidence from the scanner. No navigation path into vgrid exists at runtime.

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT (placeholder — contract not written) |
| SCREENS.md | PRESENT (scanner-generated — 1 unknown-screen, unlinked) |
| ARCHITECTURE.md | PRESENT (this run — 2026-06-04) |
| CURRENT_STATUS.md | PRESENT (this run — 2026-06-04) |
| README.md | PRESENT (placeholder — scanner scaffold) |
