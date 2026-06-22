---
title: Scanner Structure Report
status: COMPLETE
generated: 2026-06-04
scanner: apps/scanner v1.1.0
maps-timestamp: 2026-06-05T03:29:11.562Z
---

# SCANNER_STRUCTURE_REPORT

## Scanner Location

```
apps/scanner/
├── src/           # Source — 76 JS files
├── maps/          # Generated outputs — 43 JSON files
├── contracts/     # JSON Schema definitions
├── tests/         # Test fixtures
├── docs/          # Scanner documentation
├── reports/       # Generated reports
└── node_modules/  # @babel/parser dependency
```

## Scanner Areas

| Scanner Area | Purpose | Relevant Outputs | Notes |
|---|---|---|---|
| CLI entrypoint | `src/cli/index.js` — `scan` and `watch` commands | All maps | Root invocation point |
| Core orchestrator | `src/core/runScan.js` — sequences 25+ scanners | All maps | Single pass generates all 43 maps |
| Feature scanner | Discovers features, counts layers, source files | `feature-map.json` | 69 features across all apps |
| Screen scanner | Discovers UI screen components | `screen-map.json` | 368 screens total |
| Route scanner | Extracts Next.js + React Router routes | `route-map.json` | 244 routes |
| Call graph scanner | Builds call dependency graph | `callgraph.json` | 7,268 nodes / 9,510 edges |
| Full dependency graph | All file-level dependencies | `graph.json` | 10,520 nodes / 14,911 edges |
| Behavior scanner | Maps behaviors to feature/module | `behavior-map.json` | 904 behaviors, 95 modules |
| Behavior surface scanner | Links behaviors to routes/screens/hooks/controllers/DALs | `behavior-surface-map.json` | 904 surfaces — 12.8 MB |
| Ownership scanner | Maps code/feature/security/data owners per behavior | `ownership-map.json` | 904 records |
| Test scanner | Discovers and maps test files | `test-map.json` | 249 KB |
| Test coverage scanner | Maps test coverage per behavior | `behavior-test-coverage-map.json` | 23.1 MB — largest coverage map |
| RPC scanner | Maps RPC call definitions and execution | `rpc-map.json`, `rpc-execution-map.json` | |
| Edge function scanner | Discovers Cloudflare edge functions | `edge-function-map.json`, `edge-execution-map.json` | |
| Write surface scanner | Identifies write operations surface | `write-surface-map.json`, `write-execution-map.json` | 311 KB / 567 KB |
| Identity flow scanner | Tracks auth and identity flows | `identity-flow-map.json` | 35.4 MB — second largest |
| Engine discovery scanner | Identifies engine modules | `engine-map.json` | 9 engines |
| Engine execution scanner | Maps engine execution paths | `engine-execution-map.json` | 288 KB |
| DB policy scanner | Analyzes database RLS policies | `db-policy-map.json` | 483 KB |
| Documentation drift scanner | Compares governance docs vs code reality | `documentation-drift-map.json` | 191 KB — critical for ZZ audit |
| Finding scanner | Generates governance findings | `finding-map.json` | 954 KB |
| Business impact scanner | Analyzes business impact per feature | `business-impact-map.json` | 455 KB |
| Governance graph scanner | Full governance relationship graph | `governance-graph.json` | 39.2 MB — largest file |
| Policy map scanner | Governance policy analysis | `policy-map.json` | 7.1 MB / 14,023 policies |
| Dead export scanner | Finds unused exports | `dead-export-map.json` | 792 KB |
| Native parity scanner | Checks PWA/native alignment | `native-parity-map.json` | 400 KB |
| Runtime cost scanner | Analyzes runtime cost by feature | `runtime-cost-map.json` | 1.5 MB |
| Engine candidate scanner | Identifies extraction candidates | `engine-candidates.json` | 300 KB |
| Traffic app scanner | Traffic-specific analysis | `traffic-app-map.json` | 2.5 KB |

## Map Confidence Summary

| Confidence | Maps |
|---|---|
| HIGH | feature-map, screen-map, route-map, callgraph, graph, dependency-map, engine-map |
| MEDIUM | behavior-map, behavior-surface-map, behavior-test-coverage, ownership-map, policy-map |

## Key Counts (All from 2026-06-05T03:29:11 scan)

| Metric | Value |
|---|---|
| Features (all apps) | 69 |
| VCSM features | 39 |
| Screens (all apps) | 368 |
| Routes | 244 |
| Behaviors | 904 |
| Behavior modules | 95 |
| Call graph nodes | 7,268 |
| Dependency graph nodes | 10,520 |
| DB policies | 14,023 |
| Engines | 9 |

## Scanner Config (default paths)

```
scanRoots:  apps/VCSM/src, apps/Traffic/src, engines/, shared/, wentrex/, functions/
docsRoot:   ZZnotforproduction/APPS/VCSM
outputRoot: apps/scanner/maps/
```

## Maps Not Yet Mirrored to ZZnotforproduction/SCANNER/

All 43 maps live at `apps/scanner/maps/`. ZZnotforproduction/SCANNER/maps/ is empty.
Governance snapshots should be periodically copied or linked here for version-controlled audit history.
