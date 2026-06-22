# Scanner Architecture Audit
**Generated:** 2026-06-06  
**Target:** `/apps/scanner`  
**Against:** `FEATURES_TICKET_PLAN.md` — 10 tickets, Execution Plan order  
**Method:** Full static analysis — all scanner source files read, existing map outputs sampled  

---

## Scanner Architecture Summary

`apps/scanner` is a production-grade, AST-driven source reality engine. It is not a prototype. It has:

- 28 scanner modules
- 8 AST extractors built on Babel parser
- 29 JSON schemas with contracts
- 44 map output files already generated (287 MB total)
- Full call graph, route execution paths, write surface detection, behavior governance, and engine discovery
- A validated dependency map (`dependency-map.json`, 1.0 MB) that already contains 106 confirmed VCSM feature-to-feature dependency edges with per-import file path evidence

**The headline finding:** ARCH-IMPORTMAP-001 as written in the ticket plan is approximately 70% already implemented. The raw dependency data exists, was built by AST parsing, and is already on disk. The remaining 30% is a reshaping and violation-flagging step — not a new scanner.

ARCH-BIDIR-001's data collection phase is 100% complete. 15 bidirectional pairs are already detectable in the existing map — including 6 pairs not identified in the original architecture review. The classification phase (SAFE/FIXABLE-EVENT/FIXABLE-SHARED/DESIGN-DECISION) is still human work.

---

## Existing Scanner Capabilities

### Phase 1 — Scanner Inventory

| Module | Purpose | Inputs | Outputs | Status |
|---|---|---|---|---|
| `cli/index.js` | CLI entry point, command routing | CLI args | Triggers runScan or watchScan | Active |
| `core/runScan.js` | Main orchestrator — coordinates all 28 scanners | config, sourceFiles | 44 map JSONs, 9 reports | Active |
| `core/sourceRecords.js` | Per-file AST parse + classification | source files | sourceRecord[] with imports, routes, writes, calls, layer | Active |
| `core/ownership.js` | Path → feature/engine/layer classification | relative path | `{app, kind, owner, feature, layer}` | Active |
| `core/aliases.js` | Alias resolution from jsconfig.json + vite.config | config | alias map | Active |
| `core/config.js` | Scanner configuration | CLI options | `scannerConfig` with roots, output, ignores | Active |
| `core/fs.js` | File system utilities, source file collector | config | file paths | Active |
| `core/metadata.js` | Map wrapping with version/timestamp/confidence | data | wrapped map envelope | Active |
| `parsers/ast/parser.js` | Babel AST parser (JSX + TS + dynamic imports) | source code | AST + walkAst | Active |
| `parsers/ast/importExtractor.js` | Import statement extraction from AST | AST | import[] with kind, path | Active |
| `parsers/ast/callExtractor.js` | Function declaration + call extraction | AST | declarations, imports, calls | Active |
| `parsers/ast/routeExtractor.js` | React Router route extraction | AST | routes with type, access, path | Active |
| `parsers/ast/screenExtractor.js` | Screen component detection | AST | screens with hook deps | Active |
| `parsers/ast/writeExtractor.js` | Supabase writes, RPCs, edge function calls | AST | writes, rpcs, edgeCalls | Active |
| `parsers/ast/reexportExtractor.js` | Barrel re-export extraction | AST | named + wildcard reexports | Active |
| `parsers/ast/testExtractor.js` | Test file + test call detection | AST | isTest, testCalls | Active |
| `parsers/imports.js` | Import resolver (alias, relative, engine) | import path + context | resolved absolute path | Active |
| `resolvers/barrelResolver.js` | Symbol origin tracing through barrel hops | reexportIndex + symbol | origin file (max 6 hops) | Active |
| `scanners/dependencyScanner.js` | Feature-to-feature import mapping | sourceRecords | `dependency-map.json` | Active |
| `scanners/featureScanner.js` | Feature/engine/shared area discovery | config, sourceFiles | `feature-map.json` | Active |
| `scanners/callGraphScanner.js` | Call graph + execution path building | sourceRecords + maps | callgraph, 7 execution maps | Active |
| `scanners/engineDiscoveryScanner.js` | Engine structure, security, consumer mapping | sourceRecords | 6 engine maps | Active |
| `scanners/engineCandidateScanner.js` | Domain-based engine candidate detection | featureMap, dependencyMap | `engine-candidates.json` | Active |
| `scanners/behaviorScanner.js` | Behavior governance from BEHAVIOR/ARCH/SECURITY docs | config, sourceRecords | 7 behavior/governance maps | Active |
| `scanners/governanceGraphScanner.js` | Governance node/edge graph | behavior maps | `governance-graph.json` | Active |
| `scanners/governanceUtils.js` | Governance document discovery utilities | config | governanceDocs | Active |
| `scanners/identityFlowScanner.js` | Identity flow through write surfaces + RPCs | sourceRecords, maps | `identity-flow-map.json` | Active |
| `scanners/writeSurfaceScanner.js` | Supabase write aggregation | sourceRecords | `write-surface-map.json` | Active |
| `scanners/routeScanner.js` | React route → feature mapping | sourceRecords | `route-map.json` | Active |
| `scanners/screenScanner.js` | Screen component → route mapping | sourceRecords | `screen-map.json` | Active |
| `scanners/barrelReexportScanner.js` | Barrel file re-export mapping | sourceRecords, reexportIndex | `reexport-map.json`, `symbol-resolution-map.json` | Active |
| `scanners/deadExportScanner.js` | Unused export detection | sourceRecords, callGraph | `dead-export-map.json` | Active |
| `scanners/documentationDriftScanner.js` | Docs vs. source code drift | sourceRecords, governanceDocs | `documentation-drift-map.json` | Active |
| `scanners/dbPolicyScanner.js` | RLS policy extraction from migrations | config, writeSurfaces | `db-policy-map.json` | Active |
| `scanners/findingScanner.js` | Security/governance finding extraction | governanceDocs | `finding-map.json` | Active |
| `scanners/testScanner.js` | Test file → feature mapping | sourceRecords, featureMap | `test-map.json` | Active |
| `scanners/rpcScanner.js` | RPC call extraction | sourceRecords | `rpc-map.json` | Active |
| `scanners/edgeFunctionScanner.js` | Edge function invocation detection | sourceRecords, writeSurfaceMap | `edge-function-map.json` | Active |
| `scanners/behaviorTestCoverageScanner.js` | Test coverage vs. behavior surface | behaviorSurfaceMap, testMap | `behavior-test-coverage-map.json` | Active |
| `scanners/runtimeCostScanner.js` | Runtime cost analysis | sourceRecords, behaviorSurfaceMap | `runtime-cost-map.json` | Active |
| `scanners/nativeParityScanner.js` | iOS/web parity check | config, behaviorMap | `native-parity-map.json` | Active |
| `scanners/businessImpactScanner.js` | Business impact mapping | behaviorSurfaceMap, findingMap | `business-impact-map.json` | Active |
| `scanners/trafficAppScanner.js` | Traffic app structure + readiness | config, sourceRecords, maps | `traffic-app-map.json` | Active |
| `graph/buildGraph.js` | Unified graph from all scanner outputs | all maps + sourceRecords | `graph.json` | Active |
| `validation/validateMaps.js` | Schema validation of all generated maps | maps | validation results | Active |
| `outputs/writeMaps.js` | Map file writer with envelope metadata | maps | 44 JSON files to `maps/` | Active |
| `outputs/write*.js` (×8) | Report generators per domain | maps | 8 markdown reports | Active |

---

## Governance Capability Matrix

### ARCH-IMPORTMAP-001 — Feature Dependency Mapping

| Capability | Status | Evidence |
|---|---|---|
| Parse imports from source files | **SUPPORTED** | `importExtractor.js` + Babel AST — handles static, dynamic, re-exports, require |
| Build dependency graph | **SUPPORTED** | `dependencyScanner.js` → 106 VCSM Feature→Feature edges in `dependency-map.json` |
| Walk filesystem | **SUPPORTED** | `featureScanner.js` + `collectSourceFiles()` across all scan roots |
| Produce JSON graph output | **SUPPORTED** | `dependency-map.json` (1.0 MB), `graph.json` (8.3 MB), `feature-map.json` — all on disk |
| Analyze cross-feature imports | **SUPPORTED** | `dependencyScanner.js` filters edges where `fromOwner.owner !== toOwner.owner` |
| Identify inbound dependencies per feature | **PARTIALLY_SUPPORTED** | Data exists in the flat `dependencies` array but is not grouped per-feature with explicit `inbound_consumers` |
| Identify outbound dependencies per feature | **PARTIALLY_SUPPORTED** | Same — data is in edge form `(A→B)` not feature-centric `(A: {outbound: [...]})` |
| Flag adapter boundary violations | **PARTIALLY_SUPPORTED** | Each import's `importPath` and `resolvedPath` are stored — violation detection (path contains `/dal/` or `/controller/` instead of `/adapters/`) is computable from existing data but not flagged in output |
| Produce the ticket plan's target JSON schema | **PARTIALLY_SUPPORTED** | Current schema is edge-list; ticket plan requires per-feature `{inbound_consumers, outbound_dependencies, violations, split_candidate}` |
| Split candidate flagging | **PARTIALLY_SUPPORTED** | `feature-map.json` has per-feature `sourceFileCount` and `layerCounts`; `engineCandidateScanner.js` does domain detection but not file-count-threshold split readiness |

**Overall: PARTIAL — raw data exists, reshaping and violation flagging are missing**

---

### ARCH-BIDIR-001 — Bidirectional Dependency Analysis

| Capability | Status | Evidence |
|---|---|---|
| Detect bidirectional feature imports | **SUPPORTED** | `dependency-map.json` already contains all edges; 15 bidirectional VCSM pairs are computable from existing data |
| Enumerate the specific pairs | **SUPPORTED** | All 15 pairs confirmed (see Drift Analysis below) |
| Classify dependency relationships | **NOT_SUPPORTED** | Classification (SAFE/FIXABLE-EVENT/FIXABLE-SHARED/DESIGN-DECISION) is human judgment — no scanner rule enforces it |
| Produce a decision record | **NOT_SUPPORTED** | The scanner is read-only and does not emit governance decisions |

**Overall: DATA_COMPLETE — collection done, classification is still human work**

---

### ARCH-NAMING-001 — Naming Convention Enforcement

| Capability | Status | Evidence |
|---|---|---|
| Inspect folder names | **SUPPORTED** | `featureScanner.js` reads directories; `layerFromPath()` classifies them |
| Normalize inconsistent names | **SUPPORTED** | `layerFromPath()` normalizes `/controller` and `/controllers` → both return `"controller"`. Same for `/screen` and `/screens` |
| Flag naming inconsistencies | **NOT_SUPPORTED** | The normalizer deliberately absorbs both variants — it does not flag that they differ. No rule checks that a feature uses one consistent variant |
| Enforce conventions | **NOT_SUPPORTED** | Scanner is discovery-only; no enforcement layer exists |

**Overall: NOT_SUPPORTED — the scanner absorbs inconsistency rather than reporting it**

---

## Governance Scanner Seed — Rule-by-Rule Assessment

| Rule | Classification | Explanation |
|---|---|---|
| `NO_CROSS_FEATURE_DAL` | **PARTIALLY_SUPPORTED** | Import paths in `dependency-map.json` contain the full resolved path. A file with `/dal/` or `.dal.` in its `importPath` crossed from another feature's DAL is detectable via filter. Not currently flagged as a violation in map output. |
| `NO_UI_TO_DAL` | **PARTIALLY_SUPPORTED** | `layerFromPath()` classifies both the source file (screen/component) and import target (dal). The sourceRecord has `layer` set. Cross-checking source `layer=screen` importing target `layer=dal` is computable from existing data. Not currently computed. |
| `NO_INTERNAL_WITHOUT_ADAPTER` | **PARTIALLY_SUPPORTED** | **Already provable from existing data.** Sampling the current `dependency-map.json` finds 36 import violations where a feature imports another feature's internal paths (`/controller/`, `/dal/`, `/hooks/`, `/model/`) without going through `/adapters/`. Worst pairs: `dashboard→profiles` (11 violations), `profiles→booking` (10 violations), `profiles→dashboard` (4 violations). The data exists — the violation flag does not. |
| `BIDIR_TRACKING` | **PARTIALLY_SUPPORTED** | 15 bidirectional pairs already exist in `dependency-map.json`. The `graph.json` has `DEPENDS_ON` and `IMPORTS` edges from which bidirectionality is computable. No dedicated bidir field in map output. |
| `OWNERSHIP_BOUNDARY` | **SUPPORTED** | `classifyPath()` assigns every file to an owner namespace. `ownership-map.json` records behavioral ownership from BEHAVIOR.md docs. Both are generated. |
| `SPLIT_READINESS` | **PARTIALLY_SUPPORTED** | `feature-map.json` has `sourceFileCount` per feature. Features above threshold (e.g. `profiles: 374`, `dashboard: 258`) are identifiable. `engineCandidateScanner.js` detects domain groupings. No explicit `split_candidate: true` flag per feature in any map. |

---

## Ticket Drift Analysis

### ARCH-IMPORTMAP-001 — PARTIALLY_COMPLETE

**What already exists:**

The `dependencyScanner.js` (70 lines) already does the core work this ticket describes:
- Iterates every source record
- Resolves every import to a file path
- Calls `classifyPath()` on both importer and target
- Filters to cross-ownership edges only
- Groups all imports between two owners into one edge entry
- Records per-import evidence: `file`, `importPath`, `resolvedPath`, `importKind`, `resolved`
- Writes to `dependency-map.json` — already on disk, 1.0 MB, generated 2026-06-05

The `featureScanner.js` builds `feature-map.json` with file counts and layer counts per feature — already on disk.

**What is missing (the 30%):**

1. **Per-feature pivot view.** The current map stores edges as `(A→B)` objects in a flat array. The ticket plan's schema requires a per-feature object: `{feature, inbound_consumers: [...], outbound_dependencies: [...], violations: [...], split_candidate: bool}`. This is a reshape operation on existing data — approximately 40 lines of JavaScript.

2. **Violation flag.** Each import in the edge list has `importPath` and `resolvedPath`. A violation check — does `resolvedPath` contain `/dal/`, `/controller/`, `/hooks/`, or `/model/` without passing through `/adapters/`? — is a string filter. Not currently computed or stored in the output. Sampling already finds 36 violations.

3. **Split candidate flag.** `feature-map.json` has `sourceFileCount`. Features above a threshold (e.g. 100 files) could be automatically flagged. Not currently a field.

**Recommendation:** Do not re-implement from scratch. Add a thin `featureImportMapScanner.js` (~80 lines) that:
- Reads the already-generated `dependency-map.json` and `feature-map.json` as inputs
- Pivots edges into the per-feature format
- Runs the violation filter on each import's `resolvedPath`
- Adds `split_candidate` from `feature-map.json` file counts
- Writes the new `FEATURE_IMPORT_MAP.json` to the ticket's target output path

---

### ARCH-BIDIR-001 — PARTIALLY_COMPLETE (data phase complete)

**What already exists:**

The `dependency-map.json` already contains all data needed to enumerate bidirectional pairs. The analysis is a pure computation:

```
for each pair (A→B), check if (B→A) also exists in dependency-map.dependencies
```

From existing data, **15 bidirectional VCSM pairs already confirmed:**

| Pair | Already in Ticket Plan? | Note |
|---|---|---|
| social ↔ feed | Yes | Identified in architecture review |
| social ↔ notifications | Yes | Identified in architecture review |
| settings ↔ dashboard | Yes | Identified in architecture review |
| settings ↔ vport | Yes | Identified in architecture review |
| profiles ↔ social | Yes | Identified in architecture review |
| auth ↔ legal | **No** | New — not in ticket plan |
| block ↔ feed | **No** | New — not in ticket plan |
| booking ↔ notifications | **No** | New — not in ticket plan |
| dashboard ↔ profiles | **No** | New — not in ticket plan |
| dashboard ↔ public | **No** | New — not in ticket plan |
| feed ↔ post | **No** | New — not in ticket plan |
| notifications ↔ post | **No** | New — not in ticket plan |
| notifications ↔ profiles | **No** | New — not in ticket plan |
| post ↔ profiles | **No** | New — not in ticket plan |
| ads ↔ settings | **No** | New — not in ticket plan |

**The ticket plan identified 5 bidirectional pairs. The scanner data reveals 15.** The 10 additional pairs were not visible without the full import map.

**What is missing:**

The classification step — SAFE / FIXABLE-EVENT / FIXABLE-SHARED / DESIGN-DECISION — is human judgment. The scanner provides evidence (exact files, import paths) but cannot classify intent.

**Recommendation:** ARCH-BIDIR-001's scope changes. Instead of discovering pairs, it now consumes the existing `dependency-map.json`, extracts all 15 pairs automatically, and focuses the human effort purely on classification. Remove the grep-based discovery steps from the ticket — replace with a one-line script against the existing map.

---

### ARCH-NAMING-001 — UNCHANGED

The scanner does not detect naming inconsistencies. `layerFromPath()` normalizes `controller/` and `controllers/` to the same layer string, intentionally. This ticket remains a decision-document task with no scanner involvement. Status: UNCHANGED.

---

### ARCH-STUBS-001 — UNCHANGED

This is a comment-annotation task. The scanner does not assist with comment additions. However, `feature-map.json` confirms which features are structurally thin (actors: 4 files, analytics: 1 file, hydration: 2 files, portfolio: 2 files, reviews: 1 file). The scanner provides supporting evidence for the comments. Status: UNCHANGED.

---

### ARCH-CLEAN-001 — UNCHANGED

Structural cleanup (deleting empty folders, moving misplaced docs). The scanner does not assist with file system mutations. The scanner's `featureScanner.js` does count files per feature — empty folders would have `sourceFileCount: 0` — but this doesn't change the execution of the ticket. Status: UNCHANGED.

---

### ARCH-ANALYTICS-001 — UNCHANGED

A file move with 3 import updates. After the move, re-running the scanner would validate that `features/analytics` no longer appears in the dependency graph. The scanner is useful for post-move validation but does not change the execution. Status: UNCHANGED.

---

### ARCH-ENGINESETUP-001 — SIMPLIFIED

**What already exists:**

The `engineDiscoveryScanner.js` already maps all engines including their setup relationships. `engine-consumer-map.json` tracks which features consume which engines. The 8 `setup.js` files are all resolvable from the existing dependency graph — they would appear as import edges from `VCSM:app` (the app-area) into feature nodes.

`feature-map.json` already identifies `hydration` (2 source files), `portfolio` (2 files), `reviews` (1 file) as thin stub features. The `engine-candidates.json` maps these to their engine domains.

The ticket plan calls for reading all 8 setup.js files manually. The scanner already has:
- Engine identity for all 8 engines
- Which features are thin stubs (hydration, portfolio, reviews)
- Consumer counts per engine

**Recommendation:** The investigative steps of ARCH-ENGINESETUP-001 can be reduced. The startup order and dependency injection reading still requires manual file inspection, but the "classify which stub folders become empty after setup.js moves" step can be answered directly from `feature-map.json`. Status: SIMPLIFIED.

---

### ARCH-DASH-001 — SIMPLIFIED

**What already exists:**

The `dependency-map.json` already contains the full consumer map for dashboard. From the existing data:
- `VCSM:settings` → `VCSM:dashboard` (1 import: `settings/vports/ui/VportsQrModal.jsx` → `dashboard/qrcode/adapters/qrcode.adapter`) — confirmed
- `VCSM:dashboard` → `VCSM:profiles` (11 violation imports — direct into profiles/kinds/vport internals)
- `VCSM:dashboard` → `VCSM:settings` (3 violation imports)
- `VCSM:dashboard` → `VCSM:public` (1 violation import)
- Bidirectional pairs: `dashboard↔profiles`, `dashboard↔public`, `dashboard↔settings`

The ticket step "Map all `@/features/dashboard/...` imports across the codebase" is already done — it's in `dependency-map.json`. The ticket also calls for reading the route config to find dashboard routes — `route-map.json` already maps all routes to their owning features.

**The 11 `dashboard→profiles` adapter boundary violations are a significant finding:** `dashboard` is directly importing `profiles/kinds/vport/controller/services/getVportServices.controller` and `profiles/kinds/vport/dal/services/resolveVportProfileId.dal` — bypassing the adapter boundary. This is both a violation AND confirms that `profiles/kinds/vport` is tightly coupled to dashboard, making the vportProfile extraction (ARCH-VPORTPROFILE-001) more complex than the ticket plan assumed.

**Recommendation:** ARCH-DASH-001 can consume the existing `dependency-map.json` instead of running grep commands. The planning work is simplified but the 11 boundary violations are a new finding that must be incorporated into the split plan. Status: SIMPLIFIED.

---

### ARCH-POSTMOD-001 — UNCHANGED

The postModules investigation requires reading `PostCard.view.jsx` and the individual module files to understand the injection pattern. The scanner's call graph (`callgraph.json`, 7.2 MB) does contain function call edges, but the postModules analysis requires understanding the conditional rendering logic inside PostCard, which is beyond what the current call graph provides. Status: UNCHANGED.

---

### ARCH-VPORTPROFILE-001 — SIMPLIFIED (new findings change scope)

**What already exists:**

`dependency-map.json` proves that `dashboard` is importing `profiles/kinds/vport` internals (11 violations). This is a critical architectural finding that the ticket plan did not have. It means:

1. The dashboard split (ARCH-DASH-001) and the vportProfile extraction (ARCH-VPORTPROFILE-001) are **sequentially dependent beyond what the ticket plan stated** — dashboard must stop importing profiles internals BEFORE or DURING the vportProfile extraction, or the split will leave broken imports.

2. The `profiles→booking` violation (10 imports directly into booking internals) is a new finding from the scanner. The ticket plan noted that `profiles/kinds/vport/screens/booking/` exists but didn't know the imports were bypassing the booking adapter.

3. `identity-flow-map.json` maps identity flows through the profiles and dashboard surfaces — this is direct input for the extraction plan.

**Recommendation:** ARCH-VPORTPROFILE-001's planning scope expands: it must now account for the 11 dashboard→profiles boundary violations and 10 profiles→booking violations as part of the extraction plan. The existing scanner maps provide the consumer list — the ticket no longer needs grep-based discovery. Status: SIMPLIFIED (scope is clearer, blocker list grows).

---

## Duplicate Work

**Duplicate Work**

**Ticket:** ARCH-IMPORTMAP-001  
**Reason:** The scanner already builds a feature dependency graph with AST-resolved imports, per-import file evidence, and cross-feature filtering.  
**Existing Implementation:** `scanners/dependencyScanner.js` + `maps/dependency-map.json` (generated 2026-06-05, 380 total dependency edges, 106 VCSM Feature→Feature)  
**Recommendation:** Do not re-implement. Add `featureImportMapScanner.js` as a post-processor that reads `dependency-map.json` and pivots it to the per-feature format. Estimated effort: ~80 lines.

---

**Duplicate Work**

**Ticket:** ARCH-BIDIR-001 (data phase only)  
**Reason:** All 15 bidirectional pairs are already computable from `dependency-map.json`. The manual grep-based discovery in the ticket is redundant.  
**Existing Implementation:** `maps/dependency-map.json` — 15 bidir pairs confirmed via Python analysis of existing file.  
**Recommendation:** Replace the discovery steps in ARCH-BIDIR-001 with a one-script pass on the existing map. Focus all ticket effort on classification.

---

**Duplicate Work**

**Ticket:** ARCH-ENGINESETUP-001 (stub classification step)  
**Reason:** `feature-map.json` already identifies thin stub features by file count. `engine-candidates.json` maps them to engine domains.  
**Existing Implementation:** `maps/feature-map.json` (hydration: 2 files, portfolio: 2 files, reviews: 1 file) + `maps/engine-candidates.json`  
**Recommendation:** Remove the manual file-count inspection step from ARCH-ENGINESETUP-001. Read directly from the existing map.

---

**Duplicate Work**

**Ticket:** ARCH-DASH-001 (consumer map step)  
**Reason:** All dashboard consumers are already in `dependency-map.json`. Route registration is in `route-map.json`.  
**Existing Implementation:** `maps/dependency-map.json` — settings→dashboard (1 import), dashboard→profiles (11 violations), dashboard→settings (3 violations), dashboard→public (1 violation).  
**Recommendation:** Replace the grep commands in ARCH-DASH-001 Step 1 with a query against existing maps.

---

**Duplicate Work**

**Ticket:** ARCH-VPORTPROFILE-001 (consumer discovery step)  
**Reason:** All consumers of `profiles/kinds/vport` are already in `dependency-map.json`.  
**Existing Implementation:** `maps/dependency-map.json` — dashboard→profiles violations with exact file paths already recorded.  
**Recommendation:** Replace Step 1 of ARCH-VPORTPROFILE-001 with a filtered read of the dependency map.

---

## Partial Work

**Partial Work**

**Ticket:** ARCH-IMPORTMAP-001  
**Current State:** Raw dependency edges exist (106 VCSM Feature→Feature). Per-import file paths, resolved paths, and feature owners are recorded.  
**Missing Pieces:** (1) Per-feature pivot format (`inbound_consumers`, `outbound_dependencies`). (2) Explicit `violations` array (36 currently detectable). (3) `split_candidate` flag. (4) Output to ticket's target path `FEATURE_IMPORT_MAP.json`.  
**Recommendation:** Add `featureImportMapScanner.js` as a post-processing step in `runScan.js`. It reads `dependencyMap` and `featureMap` (already in memory during scan) and writes the additional format.

---

**Partial Work**

**Ticket:** ARCH-BIDIR-001  
**Current State:** 15 bidirectional pairs computable from existing data. Per-import evidence (exact files, import paths) is already in each dependency edge.  
**Missing Pieces:** Classification step (SAFE/FIXABLE-EVENT/FIXABLE-SHARED/DESIGN-DECISION). Decision record document.  
**Recommendation:** Open the ticket immediately — the discovery phase is done. The classification phase is the actual work.

---

**Partial Work (governance rules)**

**Ticket:** ARCH-IMPORTMAP-001 (Governance Scanner Seed)  
**Current State:** Raw data exists for 5 of 6 governance rules. `NO_INTERNAL_WITHOUT_ADAPTER` already has 36 confirmed violations in current data.  
**Missing Pieces:** No violations field in map output. No CI integration. No enforcement mechanism.  
**Recommendation:** Add violation detection to `featureImportMapScanner.js`. CI integration is a separate future ticket.

---

## Missing Work

**Missing Work**

**Ticket:** ARCH-NAMING-001  
**Required Components:** A naming convention decision document and a governance record. No scanner component can produce this — it is a human decision. The scanner confirms the inconsistency exists (both `controller/` and `controllers/` are normalized by `layerFromPath()`) but cannot make the decision.

---

**Missing Work**

**Ticket:** ARCH-STUBS-001  
**Required Components:** Comment annotations in 5 specific files. No scanner capability covers this.

---

**Missing Work**

**Ticket:** ARCH-CLEAN-001  
**Required Components:** Empty folder deletion. Docs file relocation. No scanner capability covers this.

---

**Missing Work**

**Ticket:** ARCH-ANALYTICS-001  
**Required Components:** File move + 3 import updates. No scanner capability covers execution — but the scanner's post-move re-run can validate that `features/analytics` is gone from the dependency graph.

---

**Missing Work**

**Ticket:** ARCH-POSTMOD-001  
**Required Components:** Reading `PostCard.view.jsx` to confirm the hardcoded static import pattern for 8 modules. Designing a registry/injection pattern. The call graph exists but does not expose the conditional rendering logic at this level of detail.

---

## Governance Readiness

### Import Map Readiness

**Classification: PARTIAL**

The scanner already generates the raw data. The per-feature format (`inbound_consumers`, `outbound_dependencies`, `violations`) is missing from output but is computable from existing data. A `featureImportMapScanner.js` post-processor (~80 lines) closes this gap. Once added, the scanner would emit the exact JSON schema specified in the Governance Scanner Seed section of the ticket plan on every run.

---

### Mission Control Readiness

**Classification: PARTIAL**

The scanner already produces 44 structured JSON maps covering features, routes, write surfaces, call graphs, behaviors, engines, identity flows, test coverage, business impact, and governance graphs. These are sufficient data feeds for a governance dashboard.

What is missing: no dashboard consumer has been built. The maps are files on disk, not API-served data. The `writeGovernanceIntelligenceReport.js` produces a markdown report that is the closest current artifact to a dashboard-readable format.

---

### CI Readiness

**Classification: PARTIAL**

The scanner has:
- `validateMaps.js` — validates all 44 maps against their schemas
- `validateEngineMaps.js` — engine-specific validation
- `validateGovernanceMaps.js` — governance validation
- `writeValidationReport.js` — writes `scanner-validation-report.md`

What is missing:
1. No GitHub Actions / CI workflow file in `apps/scanner/`
2. No exit code on validation failure (the CLI does not `process.exit(1)` on constraint violations)
3. No violation-count threshold that would block a build
4. The governance rules (`NO_INTERNAL_WITHOUT_ADAPTER`, etc.) are not yet encoded as validation checks

To make the scanner CI-ready: add a `--fail-on-violations` CLI flag that reads the `violations` array (once added) and exits non-zero if count > 0.

---

## Recommended Ticket Adjustments

| Ticket | Original Classification | Adjusted Classification | Reason |
|---|---|---|---|
| ARCH-IMPORTMAP-001 | READY (from scratch) | **SIMPLIFIED** | 70% done by scanner. Add featureImportMapScanner.js post-processor only. |
| ARCH-BIDIR-001 | BLOCKED_BY_IMPORTMAP | **READY NOW** | Data already in dependency-map.json. 15 pairs confirmed. Start classification immediately. |
| ARCH-NAMING-001 | READY | **UNCHANGED** | No scanner coverage. Decision-only task. |
| ARCH-STUBS-001 | READY | **UNCHANGED** | No scanner coverage. Comment-only task. |
| ARCH-CLEAN-001 | READY | **UNCHANGED** | No scanner coverage. Structural task. |
| ARCH-ANALYTICS-001 | READY | **UNCHANGED** | Scanner useful for post-move validation only. |
| ARCH-ENGINESETUP-001 | READY | **SIMPLIFIED** | feature-map.json and engine-candidates.json provide stub classification. Remove manual file-count steps. |
| ARCH-DASH-001 | BLOCKED_BY_IMPORTMAP | **PARTIALLY_COMPLETE** | dependency-map.json has all consumers. 11 boundary violations are a new finding. Ticket scope expands to include violation remediation plan. |
| ARCH-POSTMOD-001 | BLOCKED_BY_IMPORTMAP | **UNCHANGED** | Call graph insufficient. Still requires manual PostCard.view.jsx inspection. |
| ARCH-VPORTPROFILE-001 | BLOCKED_BY_IMPORTMAP_AND_DASH_PLAN | **SCOPE_EXPANDED** | Scanner reveals dashboard→profiles (11 violations) and profiles→booking (10 violations) as new blockers not in original ticket scope. |

---

## Final Recommendation

**Run the scanner first. Treat the existing maps as ground truth.**

The `dependency-map.json` generated on 2026-06-05 is the import map that ARCH-IMPORTMAP-001 was going to build from scratch. It is already built. The correct next action is:

**1. Unblock ARCH-BIDIR-001 immediately.** The 15 bidirectional pairs are in the existing map. The ticket plan's blocker (`BLOCKED_BY_IMPORTMAP`) was based on not knowing the scanner existed. ARCH-BIDIR-001 can start now — skip the data collection phase and start the classification phase directly. The 10 additional pairs not in the original architecture review must be added to the decision record.

**2. Scope ARCH-IMPORTMAP-001 correctly.** It is no longer a "generate from scratch" ticket. It is a "add featureImportMapScanner.js to the existing scanner" ticket. Estimated scope: ~80 lines of JavaScript, one new output file, added to `runScan.js`. This can be done in one session.

**3. Treat the 36 adapter boundary violations as a new finding.** `dashboard→profiles` (11) and `profiles→booking` (10) were not in the original architecture review. These violations must be resolved as part of or before ARCH-DASH-001 and ARCH-VPORTPROFILE-001. The tickets' scope must expand.

**4. Do not rebuild what the scanner already provides.** The scanner's infrastructure (AST parsing, alias resolution, path classification, output contracts, validation schemas) is production-quality and should be the foundation for all governance tooling. Every proposed rule in the Governance Scanner Seed section can be encoded as a post-processing step on existing scanner outputs — not as new infrastructure.

The architectural drift between `apps/scanner` and `FEATURES_TICKET_PLAN.md` is significant but correctable in two sessions: one to add the featureImportMapScanner.js post-processor, one to run the bidir classification against the now-complete data.
