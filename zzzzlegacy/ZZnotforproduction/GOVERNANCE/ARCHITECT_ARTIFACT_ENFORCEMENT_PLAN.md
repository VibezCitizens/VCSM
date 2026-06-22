# ARCHITECT Artifact Enforcement Plan

**Ticket:** TICKET-ARCHITECT-ARTIFACT-ENFORCEMENT-0001
**Generated:** 2026-06-05
**Status:** PLANNING — Read-only analysis. No command files modified.
**Scope:** `.claude/commands/` — 11 specialist commands

---

## Executive Summary

The universal ARCHITECT Mapping Gate (`architect/00-architect-mapping-gate.md`) already
exists and applies to all non-ARCHITECT commands. This is the blocking preflight mechanism.

The enforcement gap is not the gate — it is **post-gate artifact consumption**.

Commands pass the ARCHITECT gate, then proceed to re-derive scope, re-map ownership,
re-discover routes, and re-compute blast radius from source files — duplicating all work
ARCHITECT already produced.

This plan targets that gap: replacing independent re-discovery with explicit ARCHITECT
artifact reads in each specialist command's own workflow files.

---

## Current Classification

| Command | Current State | Target State |
|---------|--------------|--------------|
| LOKI | ARCHITECT_PARTIAL | ARCHITECT_DRIVEN |
| KRAVEN | ARCHITECT_PARTIAL | ARCHITECT_DRIVEN |
| CARNAGE | ARCHITECT_BYPASS | ARCHITECT_DRIVEN |
| SPIDER-MAN | ARCHITECT_PARTIAL | ARCHITECT_DRIVEN |
| HAWKEYE | ARCHITECT_BYPASS | ARCHITECT_DRIVEN |
| Sentry | ARCHITECT_PARTIAL | ARCHITECT_DRIVEN |
| Ironman | ARCHITECT_PARTIAL | ARCHITECT_DRIVEN |
| Falcon | ARCHITECT_PARTIAL | ARCHITECT_DRIVEN |
| WinterSoldier | ARCHITECT_PARTIAL | ARCHITECT_DRIVEN |
| AvengersAssemble | ARCHITECT_REQUIRED | ARCHITECT_DRIVEN |
| ELEKTRA | ARCHITECT_PARTIAL | ARCHITECT_DRIVEN |

### Classification Definitions

**ARCHITECT_DRIVEN** — Scope and analysis derived entirely from ARCHITECT artifacts.
No independent repository discovery. Specialist enriches and validates; does not rebuild.

**ARCHITECT_REQUIRED** — ARCHITECT gate enforced. Artifacts referenced. Formal consumption
in some areas but threading is incomplete or implicit.

**ARCHITECT_PARTIAL** — Universal gate exists. Artifacts mentioned informally. Specialist
still performs independent code scanning for scope, modules, routes, or ownership.

**ARCHITECT_BYPASS** — Gate technically applies via `00-architect-mapping-gate.md`
but specialist's own workflow files contain no ARCHITECT artifact consumption.
Scope, inventory, and structure are rebuilt from scratch.

---

## ARCHITECT Artifact Inventory

These are the artifacts ARCHITECT produces, by output location.

### Feature-Level Artifacts

```
ZZnotforproduction/APPS/VCSM/features/[feature]/ARCHITECTURE.md
  - Feature structure and layer hierarchy
  - Module inventory (DAL, MODEL, CONTROLLER, SERVICE, ADAPTER, HOOK, COMPONENT, SCREEN)
  - Engine dependencies
  - Database table ownership
  - Route inventory
  - RPC surface
  - Cross-feature dependency references

ZZnotforproduction/APPS/VCSM/features/[feature]/INDEX.md
  - All files belonging to this feature

ZZnotforproduction/APPS/VCSM/features/[feature]/CURRENT_STATUS.md
  - Last ARCHITECT run date and status
```

### Governance-Level Artifacts

```
ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/ARCHITECT/
  ├── system-map.md                   — high-level system layout
  ├── feature-map.md                  — feature architecture with layers
  ├── dependency-map.md               — cross-module relationships
  ├── engine-consumer-map.md          — engine usage patterns
  ├── database-read-map.md            — DAL methods and read patterns
  ├── traffic-architecture-map.md     — acquisition architecture
  ├── architect-security-surface.json — write surfaces, RPCs, edge functions, security paths
  └── graph-data/
        ├── system.graph.json
        ├── features.graph.json
        ├── routes.graph.json
        ├── bottom-navigation.graph.json
        ├── home-feed.graph.json
        ├── database-reads.graph.json
        ├── dependencies.graph.json
        ├── dead-spaghetti.graph.json
        └── governance-overlays.graph.json   ← specialists write findings HERE
```

---

## Command-by-Command Analysis

---

### 1. LOKI

**Current Discovery Behavior:**

LOKI performs runtime observation: maps which hooks, controllers, DAL methods, and tables
are touched during a trace. Step 4 of `08-runtime-workflow.md` (Map Execution Flow)
independently produces execution flow maps, caller chains, serial vs. parallel
classifications, and N+1 detections without reading ARCHITECT artifacts first.

Scope is declared from `boundary.md` scope labels, not from the ARCHITECT feature-map.
This means LOKI traces against a boundary-defined scope rather than ARCHITECT's confirmed
module inventory. It may trace modules that ARCHITECT has not mapped, or miss modules
ARCHITECT considers in-scope.

**Current ARCHITECT Gate:**

`LOKI.md` (Area 4) references: "Primary upstream: ARCHITECT (architecture assumptions
for runtime drift detection)." This is narrative guidance, not a blocking gate.

The universal `00-architect-mapping-gate.md` applies. LOKI must pass the ARCHITECT gate
before execution. But after the gate passes, LOKI does not consume ARCHITECT artifacts —
it proceeds from `boundary.md` scope labels.

**Current ARCHITECT Artifacts Available:**

- `feature-map.md` — confirmed module inventory (DAL, CONTROLLER, HOOK, COMPONENT, SCREEN)
- `dependency-map.md` — cross-module relationships for drift detection
- `database-read-map.md` — confirmed DAL methods and read patterns
- `features.graph.json` and `routes.graph.json` — route and execution-path inventory

**Missing Artifact Consumption:**

- Execution scope must be derived from ARCHITECT feature-map (not boundary.md alone)
- Route inventory must be pre-loaded before tracing begins
- DAL inventory from `database-read-map.md` must anchor duplicate-read detection
- Drift detection in Step 5 must compare observed behavior against ARCHITECT module structure

**Exact Workflow Sections Requiring Modification:**

| File | Section | Change Required |
|------|---------|----------------|
| `loki/01-mission-scope.md` | Scope Declaration | Add: "Scope is derived from ARCHITECT feature-map, not boundary.md alone. After ARCHITECT gate pass, load ARCHITECT feature-map for the target feature." |
| `loki/08-runtime-workflow.md` | Step 1 (Define Observation Target) | Add: "Load ARCHITECT feature-map. Confirm module inventory. Use ARCHITECT confirmed DAL methods as anchor for duplicate-read detection." |
| `loki/08-runtime-workflow.md` | Step 4 (Map Execution Flow) | Add: "Compare observed execution paths against ARCHITECT route inventory. Flag any observed routes absent from ARCHITECT as ARCHITECT_SCOPE_MISS." |
| `loki/LOKI.md` | Area 4 (upstream) | Convert narrative ARCHITECT reference to explicit consumption contract: "After gate pass, consume: ARCHITECT feature-map, ARCHITECT database-read-map." |

**Effort:** Medium (3 file edits, non-breaking additions)

---

### 2. KRAVEN

**Current Discovery Behavior:**

`04-analysis-workflow.md` Step 2 (Gather Runtime Evidence) states: "Use Loki traces and
**architecture inspection** to identify..." The phrase "architecture inspection" is
informal — it implies reading the code, not loading ARCHITECT artifacts.

DAL call analysis, controller fan-out inspection, and bundle/payload growth review are
performed by direct code inspection. KRAVEN's workload boundary (which DALs, which
controllers) is self-defined via the Feature/Route target input, not derived from
ARCHITECT's confirmed DAL inventory.

**Current ARCHITECT Gate:**

`KRAVEN.md` mentions dependency on "Loki runtime traces" and "architecture maps"
informally. No blocking gate in any `kraven/` file beyond the universal
`00-architect-mapping-gate.md`.

**Current ARCHITECT Artifacts Available:**

- `dependency-map.md` — cross-module relationships
- `database-read-map.md` — DAL inventory and read patterns (workload boundary source)
- `feature-map.md` — layer hierarchy for controller/DAL scope
- `features.graph.json` — route inventory

**Missing Artifact Consumption:**

- "architecture inspection" in Step 2 must be replaced with explicit ARCHITECT artifact reads
- DAL inventory from `database-read-map.md` must define KRAVEN's workload boundary
- Duplicate-read detection must anchor against ARCHITECT's confirmed read map (not re-derive)
- N+1 detection scope must match ARCHITECT's confirmed DAL method inventory

**Exact Workflow Sections Requiring Modification:**

| File | Section | Change Required |
|------|---------|----------------|
| `kraven/KRAVEN.md` | Entry (before areas) | Add formal ARCHITECT artifact consumption block after gate pass: "Consume ARCHITECT dependency-map, ARCHITECT database-read-map. These define the workload boundary." |
| `kraven/04-analysis-workflow.md` | Step 2 (Gather Runtime Evidence) | Replace "architecture inspection" with: "ARCHITECT database-read-map (DAL inventory) and ARCHITECT dependency-map. Do not independently derive workload scope." |
| `kraven/01-purpose-scope.md` | Scope Declaration | Add: "KRAVEN workload boundary = ARCHITECT confirmed DAL and controller inventory for the target scope." |
| `kraven/08-payload-fanout-build.md` | DAL call review | Add: "DAL calls to review are those in ARCHITECT database-read-map for the target feature. Do not expand beyond ARCHITECT confirmed surface." |

**Effort:** Low-Medium (3 file edits, minor wording replacement)

---

### 3. CARNAGE

**Current Discovery Behavior:**

CARNAGE inspects schema independently. `05-migration-planning-workflow.md` Step 2
(Inspect Current Structure) performs schema analysis from the database directly.
`03-blast-radius-runtime-impact.md` evaluates "hot read paths" and "booking paths"
from implicit runtime knowledge — no ARCHITECT dependency-map is consulted to determine
which features depend on the target table.

Cross-feature blast radius is the most critical gap: CARNAGE computes migration impact
without loading ARCHITECT's confirmed ownership-map or dependency-map to determine which
features consume the affected table.

**Current ARCHITECT Gate:**

No ARCHITECT gate reference in any `carnage/` file. CARNAGE.md mentions CARNAGE provides
"evidence to SENTRY for architecture boundary review" — CARNAGE is a consumer provider
to SENTRY, not a consumer of ARCHITECT. The universal `00-architect-mapping-gate.md`
applies but CARNAGE's own workflow makes no mention of it.

**Current ARCHITECT Artifacts Available:**

- `dependency-map.md` — which features/modules depend on which tables
- `ownership-map` (ARCHITECTURE.md ownership section) — which feature owns which table
- `engine-consumer-map.md` — which engines consume which tables
- `database-read-map.md` — DAL methods touching the target table

**Missing Artifact Consumption:**

- ARCHITECT preflight is completely absent in CARNAGE's own files
- Blast radius must derive from ARCHITECT dependency-map (table consumers), not implicit knowledge
- Table ownership must be resolved from ARCHITECT ARCHITECTURE.md before safety classification
- Engine impact must be resolved from ARCHITECT engine-consumer-map

**Exact Workflow Sections Requiring Modification:**

| File | Section | Change Required |
|------|---------|----------------|
| `carnage/CARNAGE.md` | Entry (before areas) | Add: "After ARCHITECT gate pass, load: ARCHITECT dependency-map, ARCHITECT ownership-map (ARCHITECTURE.md), ARCHITECT engine-consumer-map. These define blast radius scope." |
| `carnage/03-blast-radius-runtime-impact.md` | Hot read paths / runtime areas | Replace implicit knowledge with: "Hot read paths = DAL methods in ARCHITECT database-read-map touching the target table. Cross-feature consumers = dependency-map entries for this table." |
| `carnage/05-migration-planning-workflow.md` | Step 2 (Inspect Current Structure) | Add first sub-step: "2a. Load ARCHITECT ownership-map for target table. Confirm which feature owns the table and which features consume it via ARCHITECT dependency-map. Proceed with schema inspection." |
| `carnage/08-boundary-dependency-graph.md` | (if exists) Dependency graph | Derive dependency graph from ARCHITECT dependency-map, not from re-scanning imports |

**Effort:** Medium (3-4 file edits, workflow additions at Step 2 entry point)

**Classification Note:** CARNAGE is the most severe ARCHITECT_BYPASS case. Blast radius
computed without dependency-map risks incomplete cross-feature impact analysis.

---

### 4. SPIDER-MAN

**Current Discovery Behavior:**

§0 (Behavior Dependency Gate) in `SPIDER-MAN/SPIDER-MAN.md` mentions "ARCHITECT report
for same scope" as a gate requirement alongside BEHAVIOR.md. However:

1. No `SPIDERMAN_PREFLIGHT_BLOCK: ARCHITECT_REQUIRED` blocking code exists for a missing
   ARCHITECT report specifically.
2. `01-mission-scope.md` begins coverage analysis from test files and behavior entries —
   not from ARCHITECT module inventory.
3. `07-report-format.md` does not require a "Coverage vs. ARCHITECT Module Inventory"
   section, so coverage gaps against ARCHITECT-confirmed modules are not reported.

**Current ARCHITECT Gate:**

§0 references ARCHITECT but only as a narrative requirement alongside BEHAVIOR.md.
The gate implementation has blocking codes for BEHAVIOR.md failures
(`SPIDERMAN_PREFLIGHT_BLOCK: BEHAVIOR_REQUIRED`, `BEHAVIOR_EMPTY`, etc.)
but no equivalent blocking code for ARCHITECT failures.

**Current ARCHITECT Artifacts Available:**

- `ARCHITECTURE.md` (feature-level) — module inventory with all layers
- `feature-map.md` — module and route inventory
- `modules/[module]/ARCHITECTURE.md` — module-level architecture

**Missing Artifact Consumption:**

- §0 gate needs `SPIDERMAN_PREFLIGHT_BLOCK: ARCHITECT_REQUIRED` as a first-class blocking code
- Coverage reporting must be anchored to ARCHITECT module inventory — every ARCHITECT-confirmed
  controller, DAL method, and hook must appear in the test coverage matrix
- `07-report-format.md` needs "ARCHITECT Module Coverage" section in the report structure

**Exact Workflow Sections Requiring Modification:**

| File | Section | Change Required |
|------|---------|----------------|
| `SPIDER-MAN/SPIDER-MAN.md` | §0 Gate | Add blocking code: `SPIDERMAN_PREFLIGHT_BLOCK: ARCHITECT_REQUIRED` for missing ARCHITECT report. ARCHITECT gate must match scope exactly, same freshness window (7 days). |
| `SPIDER-MAN/01-mission-scope.md` | Coverage Analysis Entry | Add: "Load ARCHITECT module inventory for the target scope. Coverage must be reported against ARCHITECT-confirmed modules. Any ARCHITECT-confirmed controller or DAL method without test coverage is a MISSING finding." |
| `SPIDER-MAN/07-report-format.md` | Report Sections | Add required section: "§ ARCHITECT Module Coverage: For each ARCHITECT-confirmed module layer (CONTROLLER, DAL, HOOK, COMPONENT), report: COVERED / PARTIAL / UNCOVERED." |
| `SPIDER-MAN/09-scanner-integration.md` | Scanner Preflight | Add: "ARCHITECT module inventory must be loaded before scanner signals are applied. Scanner signals augment ARCHITECT coverage — they do not replace it as the module source of truth." |

**Effort:** Medium (4 file edits, §0 gate expansion is the critical change)

---

### 5. HAWKEYE

**Current Discovery Behavior:**

HAWKEYE independently identifies which endpoints to verify. `02-endpoint-trace.md`
captures endpoint, method, auth state, and actor context without reading ARCHITECT's
route-map. The endpoint inventory is self-constructed by HAWKEYE at runtime.

HAWKEYE writes findings to `governance-overlays.graph.json` (produced by ARCHITECT)
but never reads ARCHITECT artifacts as input. This is the cleanest ARCHITECT_BYPASS
pattern — HAWKEYE contributes to ARCHITECT's graph but takes nothing from it.

**Current ARCHITECT Gate:**

None in any `hawkeye/` file. The universal `00-architect-mapping-gate.md` applies but
HAWKEYE's own workflow files contain zero ARCHITECT artifact references.

**Current ARCHITECT Artifacts Available:**

- `feature-map.md` — route inventory (all routes and their ownership)
- `ARCHITECTURE.md` — endpoint inventory per feature
- `routes.graph.json` — full route graph
- `ownership-map` (ARCHITECTURE.md) — which feature owns which endpoint

**Missing Artifact Consumption:**

- Endpoint inventory must derive from ARCHITECT route-map, not self-discovery
- `02-endpoint-trace.md` trace initialization must load ARCHITECT route-map before listing endpoints
- Ownership context for each endpoint must come from ARCHITECT ownership section
- `08-report-format.md` must include a "Coverage vs. ARCHITECT Endpoint Inventory" section

**Exact Workflow Sections Requiring Modification:**

| File | Section | Change Required |
|------|---------|----------------|
| `hawkeye/HAWKEYE.md` | Entry (before areas) | Add formal ARCHITECT artifact consumption block: "After ARCHITECT gate pass, load: ARCHITECT feature-map (route inventory), ARCHITECT ARCHITECTURE.md (endpoint ownership). These define the endpoint verification scope." |
| `hawkeye/02-endpoint-trace.md` | Trace Initialization | Replace independent endpoint identification with: "Endpoints to verify are drawn from ARCHITECT route-map for the target scope. HAWKEYE verifies behavior — it does not discover which endpoints exist." |
| `hawkeye/08-report-format.md` | Required Sections | Add section: "§ ARCHITECT Endpoint Coverage: List all ARCHITECT-confirmed endpoints for this scope. Mark each: VERIFIED / UNVERIFIED / SKIPPED. Any unverified endpoint is a WATCH finding." |
| `hawkeye/05-auth-verification.md` | (if exists) Auth scope | Auth verification scope = ARCHITECT confirmed write surfaces (from feature-map RPC/edge function inventory). Do not expand beyond this. |

**Effort:** Medium-High (4 file edits; endpoint discovery paradigm shift is architecturally significant)

**Classification Note:** HAWKEYE is the most severe ARCHITECT_BYPASS for endpoint verification.
Self-constructed endpoint inventory risks silently missing routes ARCHITECT confirmed.

---

### 6. SENTRY

**Current Discovery Behavior:**

SENTRY verifies layer compliance against the boundary contract
(`zNOTFORPRODUCTION/_CANONICAL/zcontract/PROJECT_BOUNDARY_ISOLATION_CONTRACT.md`).
It inspects code layers independently to confirm responsibility alignment. Layer
verification in `02-layer-verification.md` identifies code behavior from source files.

`10-visualizer-integration.md` specifies that SENTRY findings are reflected as overlay
nodes in `governance-overlays.graph.json` (produced by ARCHITECT) — SENTRY writes to
ARCHITECT's graph but does not read ARCHITECT's architecture inventory before reviewing.

**Current ARCHITECT Gate:**

No formal gate in any `Sentry/` file. Universal `00-architect-mapping-gate.md` applies.

**Current ARCHITECT Artifacts Available:**

- `ARCHITECTURE.md` (feature-level) — confirmed layer hierarchy (what layers exist, their responsibilities)
- `dependency-map.md` — cross-module relationships (boundary validation source)
- `feature-map.md` — boundary and module inventory

**Missing Artifact Consumption:**

- Layer verification should load ARCHITECT feature-map to know which layers ARCHITECT confirmed
  exist for this feature — SENTRY then verifies compliance, not discovers structure
- Cross-boundary dependency review must anchor on ARCHITECT dependency-map, not re-scan imports
- `01-mission-scope.md` must add ARCHITECT architecture inventory as required input

**Exact Workflow Sections Requiring Modification:**

| File | Section | Change Required |
|------|---------|----------------|
| `Sentry/Sentry.md` | Entry (before areas) | Add: "After ARCHITECT gate pass, load: ARCHITECT feature-map, ARCHITECT dependency-map. These define the layer structure SENTRY verifies against. SENTRY validates — it does not re-map layers." |
| `Sentry/01-mission-scope.md` | Mission Entry | Add required input: "ARCHITECT ARCHITECTURE.md for the target scope. Layer verification is performed against ARCHITECT's confirmed layer hierarchy." |
| `Sentry/02-layer-verification.md` | Layer identification | Add: "Layers verified = layers confirmed in ARCHITECT feature-map. If ARCHITECT confirms a layer exists, SENTRY verifies its responsibility alignment. If SENTRY observes a layer ARCHITECT did not confirm, flag as ARCHITECT_SCOPE_MISS." |
| `Sentry/04-isolation-parity.md` | Engine isolation review | Add: "Engine consumers = ARCHITECT engine-consumer-map entries for this scope. SENTRY verifies isolation — it does not re-discover which engines are consumed." |

**Effort:** Low-Medium (4 file edits, primarily clarifying what SENTRY validates vs. what ARCHITECT maps)

---

### 7. Ironman

**Current Discovery Behavior:**

`02-ownership-discovery.md` contains a 7-step ownership discovery workflow. Steps 2-5
perform independent repository re-discovery:

- **Step 2: Identify Code Roots** — scans file system for feature roots
- **Step 3: Identify Layer Map** — independently maps DAL/Controller/Hook/Component/Screen layers
- **Step 4: Identify External Dependencies** — independently identifies engine and cross-feature dependencies
- **Step 5: Identify Data Ownership** — independently identifies which tables belong to this feature

All four steps duplicate ARCHITECT work. ARCHITECT has already produced this information
in `ARCHITECTURE.md` (feature-level) and `feature-map.md`. IRONMAN rebuilds it.

**Current ARCHITECT Gate:**

`10-governance-integration.md` references ARCHITECT relationship ("IRONMAN is the
ownership governance authority"). No formal blocking gate. ARCHITECT runs before IRONMAN
in AVENGERSASSEMBLE sequence but no formal artifact consumption in IRONMAN's own files.

**Current ARCHITECT Artifacts Available:**

- `ARCHITECTURE.md` (feature-level) — code roots, layer map, engine dependencies, table ownership
- `feature-map.md` — module inventory with all layers
- `ownership-map` entries in ARCHITECTURE.md — ownership data IRONMAN is meant to enrich

**Missing Artifact Consumption:**

- Steps 2-5 of `02-ownership-discovery.md` must be replaced with ARCHITECT artifact consumption
- IRONMAN's role is to ENRICH and VALIDATE ARCHITECT ownership data, not re-derive it
- `10-governance-integration.md` must explicitly state: "IRONMAN consumes ARCHITECT ownership-map.
  IRONMAN enriches it. IRONMAN does not rebuild it."

**Exact Workflow Sections Requiring Modification:**

| File | Section | Change Required |
|------|---------|----------------|
| `Ironman/Ironman.md` | Entry (before areas) | Add: "After ARCHITECT gate pass, load: ARCHITECT ARCHITECTURE.md (code roots, layer map, engine deps, table ownership). Steps 2-5 of ownership discovery derive from this artifact." |
| `Ironman/02-ownership-discovery.md` | Step 2 (Identify Code Roots) | Replace: "Scan file system for feature roots" → "Load code roots from ARCHITECT ARCHITECTURE.md. Code roots are ARCHITECT-confirmed." |
| `Ironman/02-ownership-discovery.md` | Step 3 (Identify Layer Map) | Replace: "Independently map DAL/Controller/Hook/Component/Screen layers" → "Load layer map from ARCHITECT feature-map. IRONMAN verifies ownership, not structure." |
| `Ironman/02-ownership-discovery.md` | Step 4 (Identify External Dependencies) | Replace: "Independently identify engine and cross-feature dependencies" → "Load from ARCHITECT dependency-map and engine-consumer-map." |
| `Ironman/02-ownership-discovery.md` | Step 5 (Identify Data Ownership) | Replace: "Independently identify table ownership" → "Load from ARCHITECT ARCHITECTURE.md ownership section. Flag discrepancies as IRONMAN_OWNERSHIP_CONFLICT." |
| `Ironman/10-governance-integration.md` | ARCHITECT relationship | Update: "IRONMAN consumes ARCHITECT ownership-map. IRONMAN enriches with boundary risk and ambiguity classification. IRONMAN does not rebuild what ARCHITECT confirmed." |

**Effort:** High (5-6 file edits; Steps 2-5 are a paradigm shift — from discovery to validation)

**This is the highest-impact change in the enforcement plan.**

---

### 8. Falcon

**Current Discovery Behavior:**

Falcon governs PWA → Native iOS parity. Module completeness matrix in
`05-module-completeness.md` is self-defined — the list of modules to review is
determined by Falcon, not derived from ARCHITECT's confirmed SCREEN/COMPONENT inventory.

`01-mission-scope.md` defines PWA behavior blueprint from implicit knowledge, not from
a pre-loaded ARCHITECT feature-map. Feature scope is self-declared.

`09-safety-output.md` references ARCHITECT context in "Native Governance Links" output
but only as a link to be cited in the report, not as an input to be consumed before analysis.

**Current ARCHITECT Gate:**

No formal gate in `Falcon/` files beyond universal `00-architect-mapping-gate.md`.
`Falcon.md` references ARCHITECT via governance overlays output only.

**Current ARCHITECT Artifacts Available:**

- `feature-map.md` — SCREEN and COMPONENT layer inventory (defines native parity scope)
- `routes.graph.json` — route inventory (native routing parity source)
- `ARCHITECTURE.md` (feature-level) — feature structure for parity baseline

**Missing Artifact Consumption:**

- Module completeness matrix in `05-module-completeness.md` must derive module list from
  ARCHITECT SCREEN/COMPONENT inventory, not self-define it
- `01-mission-scope.md` must load ARCHITECT feature-map before defining PWA blueprint
- Route parity scope must derive from ARCHITECT routes.graph.json

**Exact Workflow Sections Requiring Modification:**

| File | Section | Change Required |
|------|---------|----------------|
| `Falcon/Falcon.md` | Entry (before areas) | Add: "After ARCHITECT gate pass, load: ARCHITECT feature-map, ARCHITECT routes.graph.json. These define the PWA parity scope for native review." |
| `Falcon/01-mission-scope.md` | PWA Blueprint | Add: "PWA module inventory = ARCHITECT feature-map SCREEN and COMPONENT layers. Native parity scope is ARCHITECT-confirmed, not Falcon-defined." |
| `Falcon/05-module-completeness.md` | Module Completeness Matrix | Replace: self-defined module list → "Modules = ARCHITECT feature-map SCREEN layer for the target scope. Any ARCHITECT-confirmed screen not present in native is a MISSING finding." |
| `Falcon/08-release-gate.md` | Native Governance Links | Expand: "ARCHITECT artifacts consumed:" section listing which artifacts were loaded, confirming artifact-driven scope. |

**Effort:** Medium (4 file edits, module list derivation is the key change)

---

### 9. WinterSoldier

**Current Discovery Behavior:**

WinterSoldier governs PWA → Android parity. Depends on Falcon outputs (strong gate in
`00-winter-soldier-gate.md`). Android completeness matrix in `10-completeness-matrix.md`
is self-defined — same gap as Falcon's module completeness.

`00-winter-soldier-gate.md` loads the boundary contract and checks for Falcon report
but does not reference ARCHITECT artifacts directly. If Falcon has already consumed ARCHITECT
correctly, WinterSoldier should inherit ARCHITECT scope via Falcon. But this inheritance
is not formalized.

**Current ARCHITECT Gate:**

Falcon gate is strong. Direct ARCHITECT gate is absent from `WinterSoldier/` files.
The assumption is ARCHITECT → Falcon → WinterSoldier (transitively ARCHITECT-driven)
but the transitivity is implicit.

**Current ARCHITECT Artifacts Available:**

- Falcon outputs (should contain ARCHITECT-derived feature scope if Falcon is fixed)
- `feature-map.md` — SCREEN/COMPONENT inventory (same as Falcon's scope)
- `ARCHITECTURE.md` (feature-level) — feature structure

**Missing Artifact Consumption:**

- `00-winter-soldier-gate.md` should explicitly require ARCHITECT report for same scope
  alongside Falcon report (not just transitively)
- `10-completeness-matrix.md` module list must derive from ARCHITECT (via Falcon confirmed scope)
- Formal statement: "WinterSoldier scope = Falcon scope = ARCHITECT scope"

**Exact Workflow Sections Requiring Modification:**

| File | Section | Change Required |
|------|---------|----------------|
| `WinterSoldier/00-winter-soldier-gate.md` | Gate Requirements | Add: "ARCHITECT report for same scope required. WinterSoldier scope = Falcon scope = ARCHITECT scope. All three must align." Add blocking code: `WINTERSOLDIER_PREFLIGHT_BLOCK: ARCHITECT_REQUIRED` |
| `WinterSoldier/10-completeness-matrix.md` | Android Module Completeness Matrix | Add: "Modules = ARCHITECT feature-map SCREEN layer (confirmed via Falcon scope alignment). Android completeness is measured against ARCHITECT-confirmed PWA modules." |
| `WinterSoldier/01-mission-scope.md` | Scope Declaration | Add: "WinterSoldier scope is derived from ARCHITECT feature-map via Falcon scope alignment. Do not self-define the module inventory." |

**Effort:** Low-Medium (3 file edits; simpler than Falcon because Falcon gate is already strong)

---

### 10. AvengersAssemble

**Current Discovery Behavior:**

AvengersAssemble is read-only and runs ARCHITECT first (#1 in the 15-specialist sequence).
This means ARCHITECT artifacts are available after step 1. However, `10-workflow-execution.md`
does not explicitly thread ARCHITECT artifacts to subsequent specialists.

Each subsequent specialist relies on the universal `00-architect-mapping-gate.md` to find
the ARCHITECT report independently. There is no formal artifact-passing mechanism.
`04-governance-registry.md` tracks specialist report status but not ARCHITECT artifact availability.

**Current ARCHITECT Gate:**

ARCHITECT runs first in sequence — strongest upstream coverage of any command in scope.
All specialists run after ARCHITECT. But artifact threading is implicit, not contractual.

**Missing Artifact Consumption:**

- `10-workflow-execution.md` must add explicit ARCHITECT artifact inventory step after step 1
- `04-governance-registry.md` must track ARCHITECT artifact availability alongside specialist statuses
- `03-specialist-checks.md` must state that each specialist must consume its required ARCHITECT artifacts

**Exact Workflow Sections Requiring Modification:**

| File | Section | Change Required |
|------|---------|----------------|
| `avengersassemble/10-workflow-execution.md` | After Step 1 (ARCHITECT) | Add: "After ARCHITECT completes, record artifact inventory: feature-map location, dependency-map location, architect-security-surface.json location. All subsequent specialists consume artifacts from these paths." |
| `avengersassemble/04-governance-registry.md` | Registry Columns | Add column: "ARCHITECT Artifacts Consumed" per specialist entry. Required artifacts per specialist derived from this plan. |
| `avengersassemble/03-specialist-checks.md` | Per-specialist check | Add per-specialist: "Required ARCHITECT Artifacts: [from this plan]. Confirm consumed before marking specialist COMPLETE." |

**Effort:** Low-Medium (3 file edits, primarily documentation of what already implicitly happens)

---

### 11. ELEKTRA

**Current Discovery Behavior:**

ELEKTRA is a precision security scanner. Its upstream gate (§6.5) requires VENOM and
BLACKWIDOW reports. The chain `ARCHITECT → VENOM → BLACKWIDOW → ELEKTRA` means ARCHITECT
artifacts flow to ELEKTRA transitively through the chain.

However, `architect-security-surface.json` is the only ARCHITECT artifact specifically
designed for security commands — it contains validated write surfaces, RPCs, edge functions,
and security paths. ELEKTRA does not directly consume this artifact; it receives security
surface information filtered through VENOM and BLACKWIDOW analysis.

**Current ARCHITECT Gate:**

Chain: `ARCHITECT → VENOM → BLACKWIDOW → ELEKTRA` (from `architect/00-architect-mapping-gate.md`).
ELEKTRA's §6.5 gate blocks on missing VENOM or BLACKWIDOW reports.
No direct ARCHITECT artifact consumption in `elektra/` files.

**Evaluation — Direct vs. Chain Consumption:**

The ticket requests evaluation of:

```
Option A (current): ARCHITECT → VENOM → BLACKWIDOW → ELEKTRA

Option B (proposed addition):
  Chain:  ARCHITECT → VENOM → BLACKWIDOW → ELEKTRA
  Direct: ARCHITECT → ELEKTRA (for independent verification)
```

**Assessment:**

Option B (adding direct ARCHITECT consumption) is recommended for independent verification.

Rationale:
- VENOM and BLACKWIDOW may filter or downgrade findings that ELEKTRA would confirm
- `architect-security-surface.json` contains the complete write surface inventory
- ELEKTRA's precision scanning can validate architect-security-surface.json entries
  independently of VENOM/BLACKWIDOW opinions
- This creates a cross-check: ELEKTRA confirms architect-security-surface.json is complete
  and consistent with its own source-to-sink analysis

**Exact Workflow Sections Requiring Modification:**

| File | Section | Change Required |
|------|---------|----------------|
| `elektra/ELEKTRA.md` | §6.5 (Upstream Dependency Gate) | Add: "ELEKTRA also consumes architect-security-surface.json directly. This is an independent verification path. ELEKTRA validates that architect-security-surface.json entries are correct and complete, independent of VENOM/BLACKWIDOW opinion." |
| `elektra/ELEKTRA.md` | Security Surface Loading | Add step: "Before scanning, load architect-security-surface.json. Cross-check ELEKTRA source-to-sink findings against this inventory. Any ELEKTRA-confirmed vulnerability absent from architect-security-surface.json is a SURFACE_MISS — flag for ARCHITECT to add." |
| `elektra/10-scanner-integration.md` | Scanner Preflight | Add: "If architect-security-surface.json is available (from ARCHITECT gate pass), load it. Scanner signals must be cross-referenced against this surface. A scanner-confirmed write path not in architect-security-surface.json is a SURFACE_MISS." |

**Effort:** Low (3 file edits, additive change to existing upstream gate)

---

## Required ARCHITECT Artifacts per Command

| Command | Required ARCHITECT Artifacts |
|---------|------------------------------|
| LOKI | feature-map.md, database-read-map.md |
| KRAVEN | dependency-map.md, database-read-map.md |
| CARNAGE | dependency-map.md, ownership-map (ARCHITECTURE.md), engine-consumer-map.md |
| SPIDER-MAN | ARCHITECTURE.md (feature-level), feature-map.md |
| HAWKEYE | feature-map.md (route inventory), routes.graph.json |
| Sentry | ARCHITECTURE.md (feature-level), dependency-map.md, feature-map.md |
| Ironman | ARCHITECTURE.md (feature-level), feature-map.md, dependency-map.md, engine-consumer-map.md |
| Falcon | feature-map.md, routes.graph.json |
| WinterSoldier | feature-map.md (via Falcon), ARCHITECT scope confirmation |
| AvengersAssemble | All: feature-map.md, dependency-map.md, architect-security-surface.json (threaded to specialists) |
| ELEKTRA | architect-security-surface.json (direct) + VENOM + BLACKWIDOW (chain) |

---

## Files Requiring Edits — Master List

| # | File | Edits Required |
|---|------|---------------|
| 1 | `loki/01-mission-scope.md` | ARCHITECT feature-map scope declaration |
| 2 | `loki/08-runtime-workflow.md` | Step 1: load ARCHITECT feature-map; Step 4: compare against route inventory |
| 3 | `loki/LOKI.md` | Convert narrative ARCHITECT reference to consumption contract |
| 4 | `kraven/KRAVEN.md` | Add ARCHITECT artifact consumption block |
| 5 | `kraven/04-analysis-workflow.md` | Replace "architecture inspection" with explicit ARCHITECT artifact reads |
| 6 | `kraven/01-purpose-scope.md` | Scope = ARCHITECT DAL/controller inventory |
| 7 | `kraven/08-payload-fanout-build.md` | DAL calls from ARCHITECT database-read-map only |
| 8 | `carnage/CARNAGE.md` | Add ARCHITECT artifact consumption block (highest priority) |
| 9 | `carnage/03-blast-radius-runtime-impact.md` | Replace implicit runtime knowledge with ARCHITECT dependency-map |
| 10 | `carnage/05-migration-planning-workflow.md` | Step 2: add ARCHITECT ownership-map load as Step 2a |
| 11 | `SPIDER-MAN/SPIDER-MAN.md` | §0: add SPIDERMAN_PREFLIGHT_BLOCK: ARCHITECT_REQUIRED |
| 12 | `SPIDER-MAN/01-mission-scope.md` | ARCHITECT module inventory as required input |
| 13 | `SPIDER-MAN/07-report-format.md` | Add ARCHITECT Module Coverage section |
| 14 | `SPIDER-MAN/09-scanner-integration.md` | Cross-reference scanner signals against ARCHITECT inventory |
| 15 | `hawkeye/HAWKEYE.md` | Add ARCHITECT artifact consumption block (highest priority) |
| 16 | `hawkeye/02-endpoint-trace.md` | Endpoints from ARCHITECT route-map, not self-discovered |
| 17 | `hawkeye/08-report-format.md` | Add ARCHITECT Endpoint Coverage section |
| 18 | `Sentry/Sentry.md` | Add ARCHITECT artifact consumption block |
| 19 | `Sentry/01-mission-scope.md` | ARCHITECT ARCHITECTURE.md as required input |
| 20 | `Sentry/02-layer-verification.md` | Layers verified = ARCHITECT confirmed layers |
| 21 | `Sentry/04-isolation-parity.md` | Engine consumers from ARCHITECT engine-consumer-map |
| 22 | `Ironman/Ironman.md` | Add ARCHITECT artifact consumption block |
| 23 | `Ironman/02-ownership-discovery.md` | Steps 2-5: replace independent discovery with ARCHITECT consumption |
| 24 | `Ironman/10-governance-integration.md` | Explicit "consumes ARCHITECT ownership-map" statement |
| 25 | `Falcon/Falcon.md` | Add ARCHITECT artifact consumption block |
| 26 | `Falcon/01-mission-scope.md` | PWA blueprint from ARCHITECT feature-map |
| 27 | `Falcon/05-module-completeness.md` | Module list from ARCHITECT SCREEN layer |
| 28 | `Falcon/08-release-gate.md` | Add ARCHITECT artifacts consumed section |
| 29 | `WinterSoldier/00-winter-soldier-gate.md` | Add ARCHITECT gate + WINTERSOLDIER_PREFLIGHT_BLOCK: ARCHITECT_REQUIRED |
| 30 | `WinterSoldier/10-completeness-matrix.md` | Modules from ARCHITECT SCREEN layer via Falcon |
| 31 | `WinterSoldier/01-mission-scope.md` | Scope = ARCHITECT scope via Falcon |
| 32 | `avengersassemble/10-workflow-execution.md` | Artifact inventory step after ARCHITECT completes |
| 33 | `avengersassemble/04-governance-registry.md` | Add ARCHITECT artifacts consumed column |
| 34 | `avengersassemble/03-specialist-checks.md` | Per-specialist required ARCHITECT artifacts |
| 35 | `elektra/ELEKTRA.md` | §6.5: add direct architect-security-surface.json consumption |
| 36 | `elektra/10-scanner-integration.md` | Cross-reference scanner signals against architect-security-surface.json |

**Total files requiring edits: 36**

---

## Estimated Implementation Effort

| Command | Effort | Files | Complexity |
|---------|--------|-------|-----------|
| LOKI | Medium | 3 | Additive scope declaration and artifact load |
| KRAVEN | Low-Medium | 3-4 | Wording replacement ("architecture inspection" → explicit) |
| CARNAGE | Medium | 3-4 | Workflow addition at Step 2 entry; blast radius source change |
| SPIDER-MAN | Medium | 4 | §0 gate expansion is critical; report format addition |
| HAWKEYE | Medium-High | 3-4 | Paradigm shift — endpoint discovery model changes |
| Sentry | Low-Medium | 4 | Primarily clarification of validate-vs-discover distinction |
| Ironman | High | 5-6 | Steps 2-5 replacement is the largest single workflow change |
| Falcon | Medium | 4 | Module list derivation is the key change |
| WinterSoldier | Low-Medium | 3 | Gate addition; simpler because Falcon gate already strong |
| AvengersAssemble | Low-Medium | 3 | Artifact threading documentation |
| ELEKTRA | Low | 2-3 | Additive direct path; chain intact |

**Total estimated effort:** 38-47 file sections across 36 files

---

## Migration Order

Ordered by dependency, blast-radius risk, and enforcement gap severity.

### Phase 1 — Critical Bypasses (Highest Gap Severity)

**Priority: P0 — Implement First**

1. **CARNAGE** — No ARCHITECT gate reference in own files. Blast radius computed without
   dependency-map. Cross-feature migration impact is blind. Migration decisions without
   ARCHITECT ownership-map are the highest safety risk.

2. **HAWKEYE** — Endpoint inventory fully self-constructed. Routes confirmed by ARCHITECT
   are silently skipped if HAWKEYE self-selects a different endpoint list. Security-critical
   endpoints may be unverified.

### Phase 2 — Ownership and Coverage Accuracy

**Priority: P1 — Implement Before Next Release Gate**

3. **Ironman** — Steps 2-5 rebuild ARCHITECT work. Ownership ambiguity analysis is based
   on re-scanned structure, not ARCHITECT confirmed structure. Divergence is possible.
   Largest single workflow change.

4. **SPIDER-MAN** — §0 mentions ARCHITECT but has no blocking code for missing ARCHITECT
   report. Coverage gaps against ARCHITECT modules go unreported.

### Phase 3 — Runtime and Security Enrichment

**Priority: P1-P2**

5. **LOKI** — Scope from boundary.md may diverge from ARCHITECT scope. Execution-path
   inventory not anchored to ARCHITECT confirmed DAL methods. Drift detection less precise.

6. **ELEKTRA** — Add direct architect-security-surface.json consumption as independent
   verification path. Low effort, high value for security surface completeness.

### Phase 4 — Analysis and Compliance Commands

**Priority: P2**

7. **KRAVEN** — Replace "architecture inspection" with explicit ARCHITECT artifact reads.
   Low effort. Workload boundary formalization.

8. **Sentry** — Clarify validate-vs-discover distinction. Layer list anchored to ARCHITECT.
   Low effort.

### Phase 5 — Parity and Coordination Commands

**Priority: P2-P3**

9. **Falcon** — Module list from ARCHITECT SCREEN layer. Moderate effort.

10. **WinterSoldier** — Gate addition + module list derivation via Falcon. Simpler because
    Falcon gate already strong.

11. **AvengersAssemble** — Artifact threading documentation. Low effort. Largely formalizes
    what already implicitly happens.

---

## Invariant — Post-Implementation

After all 36 files are updated:

1. No specialist command may self-discover scope when an ARCHITECT report exists.
2. Every command's workflow entry point must include an explicit ARCHITECT artifact load
   step after gate pass.
3. Module inventories (LOKI, KRAVEN, HAWKEYE, SPIDER-MAN, Sentry, Ironman, Falcon,
   WinterSoldier) must derive from ARCHITECT feature-map.
4. Blast radius (CARNAGE) must derive from ARCHITECT dependency-map.
5. Ownership (Ironman) must derive from ARCHITECT ARCHITECTURE.md.
6. Endpoint inventory (HAWKEYE) must derive from ARCHITECT routes.graph.json.
7. ELEKTRA must consume architect-security-surface.json directly in addition to
   the VENOM + BLACKWIDOW chain.
8. AvengersAssemble must explicitly thread ARCHITECT artifact paths to all specialists
   after step 1 completes.

---

*End of ARCHITECT_ARTIFACT_ENFORCEMENT_PLAN.md*
