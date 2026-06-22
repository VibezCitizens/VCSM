# Command Preflight Matrix

**Ticket:** TICKET-SCANNER-COMMAND-PREFLIGHT-0001
**Status:** ACTIVE
**Version:** 1.0
**Created:** 2026-06-02
**Scanner Version:** 1.1.0
**Category Key:** platform-documentation

---

## Purpose

This matrix defines, for every command in the VCSM governance system, which scanner
maps are required before execution, the freshness tier enforced, and whether source
verification is required before emitting findings.

**Scanner maps root:** `apps/scanner/maps/`
**Run scanner:** `cd apps/scanner && npm run scan`

---

## Scanner Requirement Tiers

| Tier | Meaning |
|---|---|
| SCANNER_REQUIRED | Command must have scanner maps before running. Missing or EXPIRED maps block execution. |
| SCANNER_ENHANCED | Scanner improves output quality. STALE maps allowed with warning. |
| SCANNER_NOT_APPLICABLE | Command has no scanner relationship. |

---

## Map Reference Key

| Map ID | File | Contents | Count (2026-06-02) |
|---|---|---|---|
| feature-map | feature-map.json | 69 features across all apps, with app/kind/path/status | 69 features |
| dependency-map | dependency-map.json | Import relationships between features and engines | — |
| route-map | route-map.json | 244 routes with route type, access level, app, file | 244 routes |
| write-surface-map | write-surface-map.json | 478 write surfaces (INSERT/UPDATE/DELETE) with table/schema/owner/layer/file | 478 surfaces |
| test-map | test-map.json | 86 test files with owner/feature/declarations | 86 tests |
| graph | graph.json | Full repo node/edge graph — 9,807 nodes, 12,904 edges | 9,807 nodes |
| engine-candidates | engine-candidates.json | 17 engine candidates with consumers/controllers/dals/rpcs | 17 candidates |
| rpc-map | rpc-map.json | 71 RPCs with schema/feature/caller | 71 RPCs |
| edge-function-map | edge-function-map.json | 45 edge functions with caller/feature/route/source | 45 functions |
| callgraph | callgraph.json | AST-level call graph — 6,578 nodes, 8,690 edges | 6,578 nodes |
| route-execution-map | route-execution-map.json | 244 route execution paths with path/writes/rpcs/edgeFunctions | 244 paths |
| write-execution-map | write-execution-map.json | 478 write execution paths with sourceRoute/controller/dal | 478 paths |
| rpc-execution-map | rpc-execution-map.json | 71 RPC execution paths | 71 paths |
| edge-execution-map | edge-execution-map.json | 45 edge execution paths | 45 paths |
| test-traceability-map | test-traceability-map.json | 86 test traceability records with path/writes/rpcs | 86 records |
| security-path-map | security-path-map.json | 594 security paths with route/access/controller/writes/rpcs | 594 paths |
| engine-execution-map | engine-execution-map.json | 29 engine execution paths with feature/engine/imports/calls | 29 paths |

---

## Full Command Preflight Matrix (29 Commands)

| Command | Tier | Required Maps | Freshness | Source Verification Required |
|---|---|---|---|---|
| **WOLVERINE** | SCANNER_ENHANCED | feature-map, dependency-map | 7 days | For scope classification only |
| **ARCHITECT** | SCANNER_REQUIRED | feature-map, dependency-map, route-map, graph, callgraph, engine-candidates | 7 days | Before any architecture violation finding |
| **VENOM** | SCANNER_REQUIRED | write-surface-map, security-path-map, rpc-map, edge-function-map, route-map, write-execution-map, rpc-execution-map, edge-execution-map | 3 days | Before every security finding |
| **BLACKWIDOW** | SCANNER_REQUIRED | security-path-map, callgraph, write-execution-map, rpc-execution-map, edge-execution-map, route-map | 3 days | Before every exploitability claim |
| **ELEKTRA** | SCANNER_REQUIRED | callgraph, write-execution-map, security-path-map, rpc-map | 3 days | Every source→sink chain must be source-verified |
| **SPIDER-MAN** | SCANNER_REQUIRED | test-map, test-traceability-map, write-execution-map, write-surface-map | 7 days | Coverage claims require source verification |
| **HAWKEYE** | SCANNER_REQUIRED | route-map, edge-function-map, rpc-map, route-execution-map, security-path-map | 3 days | Auth enforcement requires source verification |
| **DR. STRANGE** | SCANNER_ENHANCED | feature-map, dependency-map, engine-candidates | 7 days | Feature existence trusted; governance gaps require CURRENT check |
| **THOR** | SCANNER_REQUIRED | ALL 17 maps | 1 day (release scope) | All release blocker findings require source verification |
| **AVENGERSASSEMBLE** | SCANNER_REQUIRED | ALL 17 maps (via specialists) | 1 day | Inherits from all specialist commands |
| **CARNAGE** | SCANNER_ENHANCED | write-surface-map, rpc-map, engine-candidates | 7 days | Migration safety requires DB inspection |
| **DATAENGINEER** | SCANNER_REQUIRED | write-surface-map, dependency-map, callgraph, rpc-map, engine-candidates, route-execution-map | 7 days | N+1 detection requires source verification |
| **IRONMAN** | SCANNER_ENHANCED | feature-map, dependency-map, write-surface-map | 7 days | Ownership boundaries require source inspection |
| **SENTRY** | SCANNER_ENHANCED | dependency-map, engine-execution-map, feature-map | 7 days | Boundary violations require source verification |
| **LOKI** | SCANNER_ENHANCED | route-map, callgraph | 7 days | Runtime evidence supersedes scanner evidence |
| **KRAVEN** | SCANNER_ENHANCED | route-execution-map, callgraph, engine-execution-map | 7 days | Bottleneck claims require source verification |
| **WATCHER** | SCANNER_ENHANCED | feature-map, write-surface-map | 7 days | File classification trusted; risk requires source |
| **PROFESSOR X** | SCANNER_ENHANCED | callgraph, write-execution-map, test-traceability-map, engine-execution-map | 7 days | Implementation evidence requires source verification |
| **FALCON** | SCANNER_ENHANCED | route-map, feature-map | 7 days | Route existence trusted; parity gaps require native file inspection |
| **WINTERSOLDIER** | SCANNER_ENHANCED | route-map, feature-map | 7 days | Same as FALCON |
| **VISION** | SCANNER_ENHANCED | route-execution-map, edge-function-map | 7 days | Event surface trusted; instrumentation gaps require source verification |
| **DEADPOOL** | SCANNER_ENHANCED | callgraph, write-execution-map, route-execution-map | 7 days | Root cause requires source inspection |
| **DB** | SCANNER_ENHANCED | write-surface-map, rpc-map | 7 days | Surface count trusted; schema state requires DB inspection |
| **LOGAN** | SCANNER_ENHANCED | feature-map | 7 days | Feature existence trusted; documentation gaps require CURRENT check |
| **NICKFURY** | SCANNER_ENHANCED | feature-map, dependency-map | 7 days | Feature scope trusted for workstream isolation |
| **review-contract** | SCANNER_ENHANCED | dependency-map, engine-execution-map, feature-map | 7 days | Boundary violations require source verification |
| **SHIELD** | SCANNER_NOT_APPLICABLE | None | N/A | IP governance is doc-level |
| **CAPTAIN** | SCANNER_NOT_APPLICABLE | None | N/A | Ideas capture — no scanner relationship |
| **session-summary** | SCANNER_NOT_APPLICABLE | None | N/A | Audit log — no scanner relationship |

---

## SCANNER_REQUIRED Commands — Detailed Map Assignments

### ARCHITECT
Maps: feature-map, dependency-map, route-map, graph, callgraph, engine-candidates

| Map | Used For |
|---|---|
| feature-map | Feature discovery — which features exist, their app, kind, path |
| dependency-map | Import relationship graph — cross-feature and cross-engine imports |
| route-map | Route tree — all routes with access type and owning feature |
| graph | Full node/edge map — structural analysis, dead code detection |
| callgraph | AST-level call chains — symbol-to-symbol execution paths |
| engine-candidates | Reusable domain detection — engine boundary mapping |

### VENOM
Maps: write-surface-map, security-path-map, rpc-map, edge-function-map, route-map, write-execution-map, rpc-execution-map, edge-execution-map

| Map | Used For |
|---|---|
| write-surface-map | All INSERT/UPDATE/DELETE surfaces — primary attack surface inventory |
| security-path-map | Route→controller→writes chains with access classification |
| rpc-map | All RPC calls with schema — privilege escalation surface |
| edge-function-map | All edge functions — external mutation surface |
| route-map | Route access classification — public vs protected |
| write-execution-map | Write surface caller chains — ownership enforcement context |
| rpc-execution-map | RPC caller chains — RPC ownership enforcement context |
| edge-execution-map | Edge function caller chains — edge auth context |

### BLACKWIDOW
Maps: security-path-map, callgraph, write-execution-map, rpc-execution-map, edge-execution-map, route-map

| Map | Used For |
|---|---|
| security-path-map | Primary attack surface list — all write paths with access type |
| callgraph | Call chain traversal — finds alternative paths to write surfaces |
| write-execution-map | Write execution paths — target for ownership bypass attacks |
| rpc-execution-map | RPC execution paths — target for privilege escalation attacks |
| edge-execution-map | Edge execution paths — target for auth bypass attacks |
| route-map | Route access classification — entry point for attack scenarios |

### ELEKTRA
Maps: callgraph, write-execution-map, security-path-map, rpc-map

| Map | Used For |
|---|---|
| callgraph | Source→sink chain construction — primary input for ELEKTRA analysis |
| write-execution-map | Write execution paths — sink identification |
| security-path-map | Security path inventory — pre-computed source→write chains |
| rpc-map | RPC surface — identifies privileged operations as sinks |

### SPIDER-MAN
Maps: test-map, test-traceability-map, write-execution-map, write-surface-map

| Map | Used For |
|---|---|
| test-map | Test file inventory — which files have test declarations |
| test-traceability-map | Test→write surface traceability — which tests cover which mutations |
| write-execution-map | Write execution paths — unprotected write surfaces = missing tests |
| write-surface-map | Total write surface — baseline for coverage gap analysis |

### HAWKEYE
Maps: route-map, edge-function-map, rpc-map, route-execution-map, security-path-map

| Map | Used For |
|---|---|
| route-map | Full route inventory — all endpoints to verify |
| edge-function-map | Edge function inventory — all external endpoints |
| rpc-map | RPC inventory — all backend operations |
| route-execution-map | Route execution paths — response structure and side effects |
| security-path-map | Route access classification — auth enforcement surface |

### THOR
Maps: ALL 17

| Map | Used For |
|---|---|
| feature-map | Feature scope — all features in release scope |
| write-surface-map | Write surface audit — confirms all mutations are governance-reviewed |
| security-path-map | Security coverage — confirms all paths have VENOM/BLACKWIDOW coverage |
| test-map | Test coverage — confirms test baseline |
| test-traceability-map | Test traceability — confirms §9 invariant test coverage |
| callgraph | Source integrity — no unexpected call chains in release scope |
| (all others) | Release scope completeness |

### DATAENGINEER
Maps: write-surface-map, dependency-map, callgraph, rpc-map, engine-candidates, route-execution-map

| Map | Used For |
|---|---|
| write-surface-map | All write surfaces — DAL pattern audit |
| dependency-map | Cross-feature imports — N+1 detection context |
| callgraph | Call chains to writes — N+1 detection (multiple reads in one chain) |
| rpc-map | RPC surface — RPC vs direct write analysis |
| engine-candidates | Engine extraction candidates — recommends DAL consolidation |
| route-execution-map | Route→write chains — read amplification detection |

---

## Preflight Block Conditions

A command run must be blocked (not warned) when:

1. Command tier = SCANNER_REQUIRED and any required map is EXPIRED
2. Command tier = SCANNER_REQUIRED and any required map does not exist
3. THOR release scope and any map is STALE (1-day window is strict)

A command run must warn (not block) when:

1. Command tier = SCANNER_ENHANCED and any map is STALE
2. Command tier = SCANNER_REQUIRED and any map is STALE (but not EXPIRED)
3. Scanner `scannerVersion` in map header does not match current scanner version

---

*Generated: 2026-06-02 | Ticket: TICKET-SCANNER-COMMAND-PREFLIGHT-0001*
