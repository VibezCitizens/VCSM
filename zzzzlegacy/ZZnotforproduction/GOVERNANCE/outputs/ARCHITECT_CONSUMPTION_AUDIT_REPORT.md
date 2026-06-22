# ARCHITECT_CONSUMPTION_AUDIT_REPORT

**Ticket:** TICKET-ARCHITECT-CONSUMPTION-AUDIT-0001
**Date:** 2026-06-05
**Type:** READ-ONLY AUDIT — EVIDENCE ONLY
**Scope:** 16 commands + ARCHITECT itself — `.claude/commands/`
**Auditor:** Manual read of every primary and key sub-file

---

## CORRECTION NOTICE

This report replaces an earlier draft that contained 9 classification errors.
Commands with explicit "ARCHITECT Artifact Consumption (Mandatory)" sections in their
primary command files were incorrectly classified as ARCHITECT_REQUIRED (gate-only).
All 16 commands have been re-evaluated against their actual command file text.

---

## Phase 2 Upgrade Notice — 2026-06-05

After Phase 1 audit completion, 4 command upgrades were applied per TICKET-ARCHITECT-CONSUMPTION-AUDIT-0001:

| Command | Change | New Classification |
|---|---|---|
| SPIDER-MAN | Added "ARCHITECT Artifact Consumption — Scope Authority (Mandatory)" block; updated §0.7 to Dual Authority (ARCHITECT = scope authority, BEHAVIOR.md = behavior truth) | ARCHITECT_PARTIAL → ARCHITECT_DRIVEN |
| WinterSoldier | Added "ARCHITECT Artifact Consumption (Mandatory)" section to `00-winter-soldier-gate.md` with direct artifact file names; updated `01-mission-scope.md` to remove "via Falcon" derivation language | ARCHITECT_PARTIAL → ARCHITECT_DRIVEN |
| THOR | Added "ARCHITECT Artifact Consumption (Mandatory — Gate 2)" section to `thor/02-architecture-gate.md` with dependency-map, feature-map, and ARCHITECTURE.md | ARCHITECT_PARTIAL → ARCHITECT_DRIVEN |
| VISION | Added ARCHITECT Mapping Gate (Mandatory Preflight) and ARCHITECT Artifact Consumption (Mandatory — Area 3) with feature-map.md | INDEPENDENT → ARCHITECT_PARTIAL |

All command file edits are surgical (no incidental changes). Report updated in-place.

---

## Definitions

**ARCHITECT_DRIVEN**
Command explicitly names and loads specific ARCHITECT artifact files.
Analysis scope, findings, or output generation is derived from those artifacts.
Command cannot produce quality output if artifacts are empty or missing.

**ARCHITECT_PARTIAL**
Command names and loads ARCHITECT artifacts for some aspects.
Also performs independent source derivation for other aspects.

**ARCHITECT_REQUIRED**
Gate exists and blocks if ARCHITECT report is missing.
Command never names or loads specific ARCHITECT artifact files in its workflow.
Analysis is independently derived from source code inspection.

**INDEPENDENT**
No ARCHITECT gate. No artifact consumption declared anywhere.

---

## Evidence Table

| Command | ARCHITECT Artifact Consumed | Specific File Named | Mandatory | Workflow Uses It | Findings Depend On It | Output Depends On It | Classification |
|---|---|---|---|---|---|---|---|
| VENOM | architect-security-surface.json, evidence-bundle.json, ARCHITECTURE.md, INDEX.md | `ZZnotforproduction/GOVERNANCE/outputs/{date}/ARCHITECT/` | YES — 3-day window, blocks if missing | YES — V2.2–V2.5 surface inventory drives entire review | YES — no surfaces = no findings | YES — Scanner Inputs block, Surface Inventory block | ARCHITECT_DRIVEN |
| BLACKWIDOW | architect-security-surface.json, evidence-bundle.json (callgraph, callChains, securitySensitiveSurfaces) | `ZZnotforproduction/GOVERNANCE/outputs/{date}/ARCHITECT/` | YES — 3-day window, blocks if missing | YES — Area 10 §1–5, attack surface inventory construction | YES — no attack targets = no adversarial findings | YES — Scanner Inputs block, Attack Surface Inventory block | ARCHITECT_DRIVEN |
| ELEKTRA | architect-security-surface.json, evidence-bundle.json (direct path); VENOM + BLACKWIDOW reports (chain path) | `ZZnotforproduction/GOVERNANCE/outputs/{date}/ARCHITECT/` | YES — both direct (3-day) and chain (7-day) gates | YES — Area 10 §4 vulnerability surface inventory; §7 source-to-sink workflow | YES — sink inventory from architect-security-surface.json | YES — Scanner Inputs block, Vulnerability Surface Inventory | ARCHITECT_DRIVEN |
| LOKI | feature-map.md, database-read-map.md | `ZZnotforproduction/GOVERNANCE/outputs/{date}/ARCHITECT/` | YES — observation scope = ARCHITECT module inventory | YES — LOKI observation scope IS ARCHITECT feature-map; duplicate read anchors from database-read-map | YES — scope is bounded by ARCHITECT | YES — observation scope declaration | ARCHITECT_DRIVEN |
| KRAVEN | dependency-map.md, database-read-map.md, feature-map.md | `ZZnotforproduction/GOVERNANCE/outputs/{date}/ARCHITECT/` | YES — "ARCHITECT Artifact Consumption (Mandatory)" section | YES — workload boundary = ARCHITECT DAL/controller inventory | YES — does not independently derive scope | YES — workload boundary block | ARCHITECT_DRIVEN |
| CARNAGE | dependency-map.md, ARCHITECTURE.md (ownership section), engine-consumer-map.md, database-read-map.md | `ZZnotforproduction/GOVERNANCE/outputs/{date}/ARCHITECT/` | YES — "ARCHITECT Artifact Consumption (Mandatory)" section | YES — blast radius = dependency-map; table ownership = ARCHITECTURE.md; hot reads = database-read-map | YES — blast radius assessment depends on ARCHITECT | YES — blast radius, ownership, engine impact sections | ARCHITECT_DRIVEN |
| SPIDER-MAN | ARCHITECTURE.md (feature-level), feature-map.md | `ZZnotforproduction/APPS/VCSM/features/[feature]/ARCHITECTURE.md` | YES — gate + ARCHITECT Artifact Consumption — Scope Authority (Mandatory) section | YES — coverage scope = ARCHITECT module inventory; ARCHITECT is scope authority | YES — any ARCHITECT-confirmed module without coverage = MISSING, regardless of BEHAVIOR.md | YES — Scope Authority block, §0.7 Dual Authority Model | ARCHITECT_DRIVEN |
| HAWKEYE | feature-map.md, routes.graph.json, ARCHITECTURE.md (feature-level) | `ZZnotforproduction/GOVERNANCE/outputs/{date}/ARCHITECT/` | YES — "ARCHITECT Artifact Consumption (Mandatory)" section | YES — endpoint inventory = ARCHITECT feature-map route inventory | YES — endpoints not in ARCHITECT inventory are WATCH findings | YES — ARCHITECT Endpoint Coverage section | ARCHITECT_DRIVEN |
| LOGAN | ARCHITECTURE.md (feature-level) | `ZZnotforproduction/APPS/VCSM/features/[feature]/ARCHITECTURE.md` | YES — Phase D drift comparison requires ARCHITECT baseline | YES — Phase D compares docs vs ARCHITECT baseline; Phase E classifies drift | YES — drift findings depend on ARCHITECT-written ARCHITECTURE.md | YES — drift classification output | ARCHITECT_DRIVEN |
| SENTRY | ARCHITECTURE.md (feature-level), feature-map.md, dependency-map.md | `ZZnotforproduction/GOVERNANCE/outputs/{date}/ARCHITECT/` and feature paths | YES — "ARCHITECT Artifact Consumption (Mandatory)" section | YES — validates compliance against ARCHITECT-confirmed structure; does not re-map layers | YES — cannot classify drift if ARCHITECT baseline is absent | YES — compliance report sections | ARCHITECT_DRIVEN |
| IRONMAN | ARCHITECTURE.md (feature-level), feature-map.md, dependency-map.md, engine-consumer-map.md | `ZZnotforproduction/GOVERNANCE/outputs/{date}/ARCHITECT/` and feature paths | YES — "ARCHITECT Artifact Consumption (Mandatory)" section | YES — code roots/layer maps/engine dependencies derived from ARCHITECT artifacts, not source scanning | YES — ownership map depends on ARCHITECT | YES — OWNERSHIP.md, CURRENT_STATUS.md updates | ARCHITECT_DRIVEN |
| FALCON | feature-map.md, routes.graph.json, ARCHITECTURE.md (feature-level) | `ZZnotforproduction/GOVERNANCE/outputs/{date}/ARCHITECT/` | YES — "ARCHITECT Artifact Consumption (Mandatory)" section | YES — PWA module inventory = ARCHITECT feature-map SCREEN and COMPONENT layers | YES — native parity scope is ARCHITECT-confirmed | YES — native parity scope declaration | ARCHITECT_DRIVEN |
| WinterSoldier | feature-map.md (SCREEN/COMPONENT), routes.graph.json, ARCHITECTURE.md (feature-level) | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/ARCHITECT/` (direct load) | YES — ARCHITECT Artifact Consumption (Mandatory) section added to 00-winter-soldier-gate.md | YES — Android completeness = ARCHITECT feature-map SCREEN layer (loaded directly from ARCHITECT) | YES — scope is directly ARCHITECT-confirmed; Falcon provides parity context, not scope authority | YES — Android module inventory section | ARCHITECT_DRIVEN |
| Vision | feature-map.md | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/ARCHITECT/feature-map.md` | YES — ARCHITECT Mapping Gate (Mandatory Preflight) added; blocks Area 3 if missing/stale | YES — Area 3 (Coverage Matrix) uses feature-map as analytics coverage baseline | PARTIAL — Area 3 coverage gaps depend on ARCHITECT inventory; other areas operate independently | PARTIAL — Area 3 Coverage Matrix completeness | ARCHITECT_PARTIAL |
| THOR | dependency-map.md, feature-map.md, ARCHITECTURE.md (feature-level) + all specialist outputs | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/ARCHITECT/` (Gate 2 direct load) | YES — ARCHITECT Artifact Consumption (Mandatory — Gate 2) section added to 02-architecture-gate.md | YES — Gate 2 architecture evaluation grounded in ARCHITECT-confirmed dependency direction + layer hierarchy | YES — dependency violations + layer violations verified against ARCHITECT artifacts directly | YES — Gate 2 Architecture evaluation block | ARCHITECT_DRIVEN |
| AvengersAssemble | feature-map, dependency-map, database-read-map, engine-consumer-map, architect-security-surface.json, routes.graph.json, ARCHITECTURE.md | Via specialist artifact threading (Area 3 §0) | YES — ARCHITECT must complete first; artifacts threaded to every specialist | YES — Area 3 §0 and §1: artifact inventory confirmed before dispatch | YES — artifacts required to dispatch specialists | YES — ARCHITECT ARTIFACT INVENTORY block | ARCHITECT_PARTIAL |

---

## Per-Command Evidence

### ARCHITECT

ARCHITECT is the cartographer. It produces all artifacts consumed by downstream commands.

**Produces:**
- `feature-map.md` — layer hierarchy, module inventory per feature
- `dependency-map.md` — cross-feature dependency relationships
- `database-read-map.md` — DAL method inventory and read patterns
- `engine-consumer-map.md` — engine consumption patterns
- `routes.graph.json` — full route graph
- `ARCHITECTURE.md` (per feature) — architecture narrative
- `INDEX.md` (per feature) — source inventory
- `CURRENT_STATUS.md` (per feature) — last-run date and status
- `evidence-bundle.json` (V2 scanner-assisted) — complete architecture record including callgraph, callChains, securitySensitiveSurfaces, behaviorIds
- `architect-security-surface.json` (V2 scanner-assisted) — validated write surfaces, RPCs, edge functions, security paths

ARCHITECT is **exempt** from the ARCHITECT Mapping Gate (it produces its own output; cannot require its own output as prerequisite).

---

### VENOM

**Source files read:** `Venom.md`, `venom/VENOM.md`, `venom/03-analysis-workflow.md`, `venom/09-scanner-integration.md`

**Artifacts consumed (V2 flow):**

| Artifact | Location | Used For |
|---|---|---|
| `evidence-bundle.json` | `ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/[date]/ARCHITECT/` | Routes, screens, hooks, controllers, DALs, callChains, securitySensitiveSurfaces — replaces all manual source discovery |
| `architect-security-surface.json` | `ZZnotforproduction/GOVERNANCE/outputs/[date]/ARCHITECT/` | Write surfaces, RPCs, edge functions, security paths, execution paths — primary attack surface inventory |
| `ARCHITECTURE.md` | `ZZnotforproduction/APPS/VCSM/features/[feature]/ARCHITECTURE.md` | Architecture narrative and layer classification |
| `INDEX.md` | `ZZnotforproduction/APPS/VCSM/features/[feature]/INDEX.md` | Current source inventory with file paths |

**Evidence (from `venom/09-scanner-integration.md` V2.1–V2.2):**

> "VENOM does not read raw scanner maps.
> VENOM does not rediscover routes, screens, controllers, or DALs from scratch.
> VENOM consumes the ARCHITECT evidence bundle and security surface output."

> "When evidence-bundle.json is present and fresh:
> - architecture.routes replaces any manual route discovery
> - architecture.controllers replaces any controller grep
> - architecture.dals replaces any DAL discovery
> - callChains provides pre-traced execution paths
> - securitySensitiveSurfaces provides the priority review queue"

**Consumption in workflow (V2.2):**

```
1. WRITE SURFACE INVENTORY (from architect-security-surface.json → securitySurface.writeSurfaces)
2. RPC INVENTORY (from architect-security-surface.json → securitySurface.rpcs)
3. EDGE FUNCTION INVENTORY (from architect-security-surface.json → securitySurface.edgeFunctions)
4. SECURITY PATH INVENTORY (from architect-security-surface.json → securitySurface.securityPaths)
5. EXECUTION PATH CORRELATION (from architect-security-surface.json → securitySurface.executionPaths)
```

**Mandatory:** YES. Freshness window: 3 days. Blocks with `VENOM BLOCKED: ARCHITECT security surface output required` if missing or stale.

**Can VENOM run meaningfully if artifact is empty?**
NO. V2 workflow requires surface inventory from ARCHITECT output. Empty artifact = no surfaces = no findings possible. VENOM V1 (manual flow without scanner integration) degrades to gate-only.

**Completion principle (from `venom/VENOM.md §9`):**
> "consumed ARCHITECT evidence-bundle.json before reading any source file (V2 runs)"
> "included SOURCE READ SUMMARY section with Full Rediscovery Performed = NO (V2 runs)"

**VENOM V1 note:** V1 (pre-scanner, non-V2 flow) only enforces the gate. V1 analysis derives from direct source inspection. V1 is ARCHITECT_REQUIRED. V2 is ARCHITECT_DRIVEN. The V2 flow is the current active flow per scanner integration.

**Classification: ARCHITECT_DRIVEN (V2 flow)**

---

### BLACKWIDOW

**Source files read:** `BlackWidow.md`, `blackwidow/BLACKWIDOW.md`, `blackwidow/00-venom-dependency-gate.md`, `blackwidow/10-scanner-integration.md`

**Artifacts consumed (V2 flow):**

| Artifact | Location | Used For |
|---|---|---|
| `evidence-bundle.json` | `ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/[date]/ARCHITECT/` | callChains (authoritative execution path record), architecture.controllers, securitySensitiveSurfaces (priority attack target queue), behaviorIds |
| `architect-security-surface.json` | `ZZnotforproduction/GOVERNANCE/outputs/[date]/ARCHITECT/` | Security paths, execution paths, callgraph data for attack path construction |

**Evidence (from `blackwidow/10-scanner-integration.md` §1):**

> "BLACKWIDOW does not read raw scanner maps.
> BLACKWIDOW does not rediscover architecture.
> BLACKWIDOW consumes the ARCHITECT evidence bundle, security surface output, and VENOM report."

**Callgraph traversal (§2):**

> "2. CALLGRAPH SCOPE EXTRACTION — Filter nodes by feature owner matching scope; build adjacency list of call edges within scope
> 3. EXECUTION PATH CORRELATION — For each surface: find sourceRoute, controller, dal
> 4. ENTRY POINT IDENTIFICATION — All hook nodes = UI-accessible entry points
> 5. CALLER CHAIN CONSTRUCTION — Traverse callgraph edges BACKWARDS from target dal"

**Mandatory:** YES. Freshness window: 3 days. Blocks with `BLACKWIDOW BLOCKED: ARCHITECT security surface output required`.

**Can BLACKWIDOW run if evidence-bundle.json is empty?**
NO. Attack path construction requires callgraph edges from the evidence bundle. No callgraph = no adversarial path construction = no BYPASSED/BLOCKED findings possible.

**VENOM dependency gate:**
BLACKWIDOW also requires a fresh VENOM report (7-day window). BLACKWIDOW extends VENOM — it does not replace VENOM's trust boundary analysis. This creates a two-gate preflight:
1. ARCHITECT gate (evidence-bundle.json freshness)
2. VENOM dependency gate (VENOM report freshness)

**Classification: ARCHITECT_DRIVEN (V2 flow)**

---

### ELEKTRA

**Source files read:** `ELEKTRA.md`, `elektra/ELEKTRA.md`, `elektra/10-scanner-integration.md`

**Artifacts consumed:**

Two independent consumption paths exist:

**Chain path (§6.5):**
ELEKTRA consumes VENOM + BLACKWIDOW reports. These reports were built from ARCHITECT artifacts. ELEKTRA receives ARCHITECT data transitively.

**Direct path (§6.5 — "Direct ARCHITECT Consumption"):**

> "In addition to the VENOM → BLACKWIDOW chain, ELEKTRA directly consumes `architect-security-surface.json` as an independent verification path (detailed in Area 10 §3)."

> "ELEKTRA validates that `architect-security-surface.json` entries are correct and complete"
> "Any ELEKTRA-confirmed vulnerability on a write surface absent from `architect-security-surface.json` is a `ARCHITECT_SURFACE_MISS`"

| Artifact | Location | Used For |
|---|---|---|
| `evidence-bundle.json` | `ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/[date]/ARCHITECT/` | callChains as chain candidate list; architecture.controllers/.dals with file paths; securitySensitiveSurfaces priority queue |
| `architect-security-surface.json` | `ZZnotforproduction/GOVERNANCE/outputs/[date]/ARCHITECT/` | Sink inventory (write sinks, RPC sinks, edge function sinks); callgraph chain pre-computation |

**Evidence (from `elektra/10-scanner-integration.md` §3.1):**

> "ELEKTRA does not read raw scanner maps.
> ELEKTRA does not rediscover vulnerability surfaces independently.
> ELEKTRA consumes the ARCHITECT evidence bundle, security surface output, VENOM report, and BLACKWIDOW report."

> "When evidence-bundle.json is present and fresh:
> - ELEKTRA must NOT re-scan source to discover entry points
> - ELEKTRA must NOT re-trace call chains already present in evidence-bundle.json callChains"

**Workflow consumption (Area 10 §4 — Callgraph Chain Pre-Computation):**

> "For each write/rpc/edge sink:
> a. Find the sink node in callgraph
> b. Traverse edges BACKWARDS (sink ← controller ← hook ← component)
> c. Identify: source nodes (hooks that accept props or URL params)
> d. Record: parameter names at each hop
> e. Flag: parameters that flow from props/URL (user-controlled) vs session (trusted)"

**Mandatory:** YES — both gate (7-day VENOM+BLACKWIDOW) and direct (3-day evidence bundle). Blocks with `ELEKTRA BLOCKED: ARCHITECT security surface output required`.

**SURFACE_MISS rule:**
If ELEKTRA finds a write path absent from `architect-security-surface.json`, it flags `ARCHITECT_SURFACE_MISS` — confirming ELEKTRA directly validates ARCHITECT completeness, not just consumes it.

**Classification: ARCHITECT_DRIVEN**
*(Two consumption paths: direct `architect-security-surface.json` load + transitive via VENOM+BLACKWIDOW chain)*

---

### LOKI

**Source files read:** `Loki.md`, `loki/LOKI.md`, `loki/01-mission-scope.md`

**Artifacts consumed:**

| Artifact | Location | Used For |
|---|---|---|
| `feature-map.md` | `ZZnotforproduction/GOVERNANCE/outputs/{date}/ARCHITECT/` | Confirmed module inventory (DAL, CONTROLLER, HOOK, COMPONENT, SCREEN) — **defines observation scope** |
| `database-read-map.md` | `ZZnotforproduction/GOVERNANCE/outputs/{date}/ARCHITECT/` | DAL methods and read patterns — **anchors duplicate-read detection** |

**Evidence (from `loki/LOKI.md §4`):**

> "After ARCHITECT gate pass, LOKI consumes:
> - `ARCHITECT feature-map.md` — confirmed module inventory (DAL, CONTROLLER, HOOK, COMPONENT, SCREEN); defines observation scope
> - `ARCHITECT database-read-map.md` — confirmed DAL methods and read patterns; anchors duplicate-read detection
>
> LOKI does not self-construct its observation scope. Observation scope = ARCHITECT-confirmed module and route inventory for the target feature."

**Evidence (from `loki/01-mission-scope.md`):**

> "After ARCHITECT gate pass, load `ARCHITECT feature-map.md` for the target scope. LOKI observation scope = ARCHITECT-confirmed module inventory (DAL, CONTROLLER, HOOK, COMPONENT, SCREEN). Scope from boundary.md defines the application boundary; ARCHITECT feature-map defines the module-level observation target within that boundary."

**Can LOKI operate if artifacts are missing?**
LOKI can still observe runtime behavior. But LOKI cannot determine observation scope (which DALs, controllers, hooks to monitor) without ARCHITECT feature-map. LOKI's duplicate-read detection anchors against ARCHITECT database-read-map — empty map = no anchor = detection scope undefined.

**Note:** The existing pre-correction report misclassified LOKI as ARCHITECT_REQUIRED. The explicit consumption instruction in `loki/LOKI.md §4` and `loki/01-mission-scope.md` contradicts this — both name specific artifact files and state the observation scope IS the ARCHITECT-confirmed inventory.

**Classification: ARCHITECT_DRIVEN**

---

### KRAVEN

**Source files read:** `Kraven.md`, `kraven/KRAVEN.md`

**Artifacts consumed:**

| Artifact | Location | Used For |
|---|---|---|
| `dependency-map.md` | `ZZnotforproduction/GOVERNANCE/outputs/{date}/ARCHITECT/` | Cross-module relationships — defines workload boundary |
| `database-read-map.md` | `ZZnotforproduction/GOVERNANCE/outputs/{date}/ARCHITECT/` | DAL inventory and read patterns — anchors duplicate-read detection |
| `feature-map.md` | `ZZnotforproduction/GOVERNANCE/outputs/{date}/ARCHITECT/` | Layer hierarchy — confirms controller and DAL scope |

**Evidence (from `kraven/KRAVEN.md` — "ARCHITECT Artifact Consumption (Mandatory)"):**

> "After ARCHITECT gate pass, load the following artifacts for the target scope before beginning any performance analysis: [table above]"

> "KRAVEN workload boundary = ARCHITECT confirmed DAL and controller inventory for the target scope."

> "KRAVEN does not independently derive workload scope when a fresh ARCHITECT report exists."

**Specific field consumption (from `kraven/KRAVEN.md`):**

> "Blast radius = ARCHITECT dependency-map entries for the target table."
> "Hot read paths = ARCHITECT database-read-map DAL methods for the target table."

**Can KRAVEN operate if artifacts are missing?**
KRAVEN can fall back to LOKI runtime traces and static inspection. However, per the Mandatory declaration, KRAVEN must not independently derive workload scope when fresh ARCHITECT artifacts exist. The Mandatory section overrides independent derivation as the primary path.

**Note:** The existing pre-correction report misclassified KRAVEN as ARCHITECT_REQUIRED citing "structural assumptions." The `kraven/KRAVEN.md` file has a dedicated "ARCHITECT Artifact Consumption (Mandatory)" section with specific file paths and explicit "must not independently derive" language.

**Classification: ARCHITECT_DRIVEN**

---

### CARNAGE

**Source files read:** `Carnage.md`, `carnage/CARNAGE.md`

**Artifacts consumed:**

| Artifact | Location | Used For |
|---|---|---|
| `dependency-map.md` | `ZZnotforproduction/GOVERNANCE/outputs/{date}/ARCHITECT/` | Cross-feature table consumers — **defines blast radius scope** |
| `ARCHITECTURE.md` (ownership section) | `ZZnotforproduction/APPS/VCSM/features/[feature]/ARCHITECTURE.md` | Which feature owns the target table |
| `engine-consumer-map.md` | `ZZnotforproduction/GOVERNANCE/outputs/{date}/ARCHITECT/` | Which engines consume the target table |
| `database-read-map.md` | `ZZnotforproduction/GOVERNANCE/outputs/{date}/ARCHITECT/` | DAL methods touching the target table |

**Evidence (from `carnage/CARNAGE.md` — "ARCHITECT Artifact Consumption (Mandatory)"):**

> "CARNAGE must not derive blast radius, cross-feature impact, or table ownership from scratch when a fresh ARCHITECT report exists."

> "Blast radius = ARCHITECT dependency-map entries for the target table.
> Table ownership = ARCHITECT ARCHITECTURE.md ownership section for the target feature.
> Engine impact = ARCHITECT engine-consumer-map entries for the target table.
> Hot read paths = ARCHITECT database-read-map DAL methods for the target table."

**Can CARNAGE operate if artifacts are missing?**
CARNAGE can inspect database schema directly. But blast radius assessment requires the dependency-map to find cross-feature consumers. Without it, CARNAGE produces schema-level analysis only — cross-feature impact is undefined. The Mandatory declaration prohibits independent derivation when fresh artifacts exist.

**Note:** The existing pre-correction report misclassified CARNAGE as ARCHITECT_REQUIRED citing schema inspection. The `carnage/CARNAGE.md` has a dedicated "ARCHITECT Artifact Consumption (Mandatory)" section that directly contradicts this.

**Classification: ARCHITECT_DRIVEN**

---

### SPIDER-MAN

**Source files read:** `SPIDER-MAN.md`, `SPIDER-MAN/SPIDER-MAN.md`, `SPIDER-MAN/09-scanner-integration.md`

**Artifacts consumed:**

| Artifact | Location | Used For |
|---|---|---|
| `ARCHITECTURE.md` (feature-level) | `ZZnotforproduction/APPS/VCSM/features/[feature]/ARCHITECTURE.md` | Module inventory as **coverage baseline** |
| `feature-map.md` | `ZZnotforproduction/GOVERNANCE/outputs/{date}/ARCHITECT/` | Confirmed module layers (CONTROLLER, DAL, HOOK, COMPONENT) |

**Evidence (from `SPIDER-MAN/SPIDER-MAN.md` — post-gate section):**

> "When the gate passes, load the following ARCHITECT artifacts before beginning coverage review:
> - `ARCHITECT ARCHITECTURE.md` (feature-level) — module inventory as the coverage baseline
> - `ARCHITECT feature-map.md` — confirmed module layers (CONTROLLER, DAL, HOOK, COMPONENT)
>
> Coverage must be reported against ARCHITECT-confirmed modules. Any ARCHITECT-confirmed controller, DAL method, or hook without test coverage is a MISSING finding."

**Scanner integration (`SPIDER-MAN/09-scanner-integration.md §18`):**

> "ARCHITECT Module Inventory Required First: Before loading scanner maps, ARCHITECT module inventory must be loaded for the target scope (`ARCHITECTURE.md` and `feature-map.md`). Scanner signals augment ARCHITECT coverage — they do not replace ARCHITECT as the module source of truth."

**Dual Authority Model (upgraded 2026-06-05):**
ARCHITECT is the scope authority: ARCHITECT-confirmed module and layer inventory defines which modules MUST have test coverage. BEHAVIOR.md is the behavior truth: defines what behaviors each test must prove. SPIDER-MAN is ARCHITECT_DRIVEN because:
- Coverage scope = ARCHITECT module inventory
- Any ARCHITECT-confirmed controller, DAL method, or hook without coverage = MISSING finding (regardless of whether BEHAVIOR.md names it)
- SPIDER-MAN does not self-discover the module list when a fresh ARCHITECT report exists

**Upgrade applied:** Added "ARCHITECT Artifact Consumption — Scope Authority (Mandatory)" section to `SPIDER-MAN/SPIDER-MAN.md`; updated §0.7 Authority Model to Dual Authority pattern.

**Can SPIDER-MAN operate if ARCHITECT artifacts are missing?**
PARTIAL — MISSING coverage findings are undefined without ARCHITECT module inventory. With ARCHITECT present, full ARCHITECT_DRIVEN scope derivation applies.

**Classification: ARCHITECT_DRIVEN**
*(ARCHITECT is the scope authority for module inventory; BEHAVIOR.md is the behavior truth; dual authority model established in §0.7)*

---

### HAWKEYE

**Source files read:** `HAWKEYE.md`, `hawkeye/HAWKEYE.md`

**Artifacts consumed:**

| Artifact | Location | Used For |
|---|---|---|
| `feature-map.md` | `ZZnotforproduction/GOVERNANCE/outputs/{date}/ARCHITECT/` | Route inventory — **defines which endpoints HAWKEYE must verify** |
| `routes.graph.json` | `ZZnotforproduction/GOVERNANCE/outputs/{date}/ARCHITECT/graph-data/` | Full route graph with ownership context |
| `ARCHITECTURE.md` (feature-level) | `ZZnotforproduction/APPS/VCSM/features/[feature]/ARCHITECTURE.md` | Endpoint ownership per feature |

**Evidence (from `hawkeye/HAWKEYE.md` — "ARCHITECT Artifact Consumption (Mandatory)"):**

> "HAWKEYE verifies endpoint behavior. It does not discover which endpoints exist."

> "Endpoint inventory = ARCHITECT feature-map route inventory for the target scope.
> Endpoint ownership = ARCHITECT ARCHITECTURE.md ownership section.
> Auth verification scope = ARCHITECT confirmed write surfaces (RPC and edge function inventory)."

> "Any endpoint HAWKEYE verifies must appear in the ARCHITECT route inventory.
> Any ARCHITECT-confirmed endpoint left unverified is a WATCH finding (reported in the ARCHITECT Endpoint Coverage section)."

**Can HAWKEYE operate if artifacts are missing?**
NO. HAWKEYE explicitly states it does not discover endpoints — the ARCHITECT route inventory IS the endpoint scope. Without ARCHITECT artifacts, HAWKEYE has no endpoint list to verify against.

**Note:** The existing pre-correction report misclassified HAWKEYE as ARCHITECT_REQUIRED. The `hawkeye/HAWKEYE.md` file has a dedicated "ARCHITECT Artifact Consumption (Mandatory)" section with this explicit language.

**Classification: ARCHITECT_DRIVEN**

---

### LOGAN

**Source files read:** `Logan.md`, `Logan/Logan.md`, `Logan/01-documentation-systems.md`, `Logan/04-engine-audit.md`

**Artifacts consumed:**

| Artifact | Location | Used For |
|---|---|---|
| `ARCHITECTURE.md` (per feature) | `ZZnotforproduction/APPS/VCSM/features/[feature]/ARCHITECTURE.md` | Drift detection baseline — Phase D comparison against current code |

**Evidence (from `Logan/Logan.md §3` — Logan Workflow):**

> "Phase D — Compare Docs vs Code
> Phase E — Report Drift"

LOGAN reads ARCHITECT-produced ARCHITECTURE.md files during Phase D to compare the documented architecture against current implementation code.

**Consumption in workflow:**
LOGAN's drift detection output (Phase E findings) is derived by comparing ARCHITECT's ARCHITECTURE.md against source reality. Drift findings DO depend on ARCHITECT output — if ARCHITECTURE.md was not produced by ARCHITECT, there is no baseline to drift against.

**Independent derivation also present:**
LOGAN also reads Logan system documentation (`zNOTFORPRODUCTION/_CANONICAL/logan/`) directly, not via ARCHITECT artifacts. LOGAN maintains its own documentation scope beyond ARCHITECT-produced files.

**Can LOGAN operate if ARCHITECTURE.md is missing?**
PARTIAL. LOGAN can still enforce documentation standards, prompt provenance, and engine audit governance. But architecture drift detection (Phase D–E) requires ARCHITECT's ARCHITECTURE.md as the baseline.

**Classification: ARCHITECT_DRIVEN** *(drift detection path requires ARCHITECT output as baseline; documentation governance path is partially independent)*

---

### SENTRY

**Source files read:** `Sentry.md`, `Sentry/Sentry.md`

**Artifacts consumed:**

| Artifact | Location | Used For |
|---|---|---|
| `ARCHITECTURE.md` (feature-level) | `ZZnotforproduction/APPS/VCSM/features/[feature]/ARCHITECTURE.md` | Confirmed layer hierarchy — SENTRY verifies compliance against this |
| `feature-map.md` | `ZZnotforproduction/GOVERNANCE/outputs/{date}/ARCHITECT/` | Module and layer inventory for the target scope |
| `dependency-map.md` | `ZZnotforproduction/GOVERNANCE/outputs/{date}/ARCHITECT/` | Cross-boundary dependency relationships for isolation verification |

**Evidence (from `Sentry/Sentry.md` — "ARCHITECT Artifact Consumption (Mandatory)"):**

> "SENTRY validates architecture compliance against ARCHITECT-confirmed structure.
> SENTRY does not re-map layers — ARCHITECT has already confirmed which layers exist.
> SENTRY does not re-scan imports for dependency direction — ARCHITECT dependency-map is the authoritative source."

**Can SENTRY operate if artifacts are missing?**
PARTIAL. SENTRY can check boundary contracts by reading changed files directly. But SENTRY explicitly states it does not re-derive what ARCHITECT has already produced. Without ARCHITECT's layer map and dependency map, SENTRY cannot perform layer compliance verification — only boundary contract checks would remain.

**Note:** The existing pre-correction report misclassified SENTRY as ARCHITECT_REQUIRED citing "reads changed files against contract rules." The `Sentry/Sentry.md` file has a dedicated "ARCHITECT Artifact Consumption (Mandatory)" section with explicit "does not re-map layers" language.

**Classification: ARCHITECT_DRIVEN**

---

### IRONMAN

**Source files read:** `Ironman.md`, `Ironman/Ironman.md`

**Artifacts consumed:**

| Artifact | Location | Used For |
|---|---|---|
| `ARCHITECTURE.md` (feature-level) | `ZZnotforproduction/APPS/VCSM/features/[feature]/ARCHITECTURE.md` | Code roots, layer map, engine dependencies, table ownership |
| `feature-map.md` | `ZZnotforproduction/GOVERNANCE/outputs/{date}/ARCHITECT/` | Module inventory with all layers |
| `dependency-map.md` | `ZZnotforproduction/GOVERNANCE/outputs/{date}/ARCHITECT/` | Cross-feature dependency relationships |
| `engine-consumer-map.md` | `ZZnotforproduction/GOVERNANCE/outputs/{date}/ARCHITECT/` | Engine consumption patterns |

**Evidence (from `Ironman/Ironman.md` — "ARCHITECT Artifact Consumption (Mandatory)"):**

> "IRONMAN enriches and validates ARCHITECT ownership data. It does not rebuild what ARCHITECT has already confirmed."

> "Code roots, layer maps, engine dependencies, and table ownership in Steps 2–5 of the discovery workflow are derived from ARCHITECT artifacts — not from independent file system scanning."

**Can IRONMAN operate if artifacts are missing?**
PARTIAL. IRONMAN could scan source code to discover ownership. But the Mandatory section explicitly prohibits independent derivation when ARCHITECT artifacts exist. Steps 2–5 of the discovery workflow are ARCHITECT-derived.

**Note:** The existing pre-correction report misclassified IRONMAN as ARCHITECT_REQUIRED. The `Ironman/Ironman.md` has a "ARCHITECT Artifact Consumption (Mandatory)" section with explicit "not from independent file system scanning" language.

**Classification: ARCHITECT_DRIVEN**

---

### FALCON

**Source files read:** `Falcon.md`, `Falcon/Falcon.md`

**Artifacts consumed:**

| Artifact | Location | Used For |
|---|---|---|
| `feature-map.md` | `ZZnotforproduction/GOVERNANCE/outputs/{date}/ARCHITECT/` | SCREEN and COMPONENT inventory — **defines native parity scope** |
| `routes.graph.json` | `ZZnotforproduction/GOVERNANCE/outputs/{date}/ARCHITECT/graph-data/` | Full route graph — defines native routing parity scope |
| `ARCHITECTURE.md` (feature-level) | `ZZnotforproduction/APPS/VCSM/features/[feature]/ARCHITECTURE.md` | Feature structure — parity baseline |

**Evidence (from `Falcon/Falcon.md` — "ARCHITECT Artifact Consumption (Mandatory)"):**

> "PWA module inventory = ARCHITECT feature-map SCREEN and COMPONENT layers.
> Native parity scope is ARCHITECT-confirmed, not Falcon-defined."

**Can FALCON operate if artifacts are missing?**
NO. FALCON explicitly states native parity scope is ARCHITECT-confirmed. Without ARCHITECT's feature-map SCREEN/COMPONENT inventory, FALCON has no PWA baseline to compare against. The parity comparison cannot be executed.

**Note:** The existing pre-correction report misclassified FALCON as ARCHITECT_REQUIRED with "no explicit ARCHITECT gate in main command file." The `Falcon/Falcon.md` has a dedicated "ARCHITECT Artifact Consumption (Mandatory)" section.

**Classification: ARCHITECT_DRIVEN**

---

### WINTERSOLDIER

**Source files read:** `WinterSoldier.md`, `WinterSoldier/WinterSoldier.md`, `WinterSoldier/00-winter-soldier-gate.md`, `WinterSoldier/01-mission-scope.md`

**Artifacts consumed (upgraded 2026-06-05):**

| Artifact | Location | Used For | How |
|---|---|---|---|
| `feature-map.md` | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/ARCHITECT/feature-map.md` | SCREEN and COMPONENT inventory — Android parity scope | Direct load |
| `routes.graph.json` | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/ARCHITECT/graph-data/routes.graph.json` | Full PWA route graph — Android routing parity baseline | Direct load |
| `ARCHITECTURE.md` (feature-level) | `ZZnotforproduction/APPS/VCSM/features/[feature]/ARCHITECTURE.md` | Feature structure — parity baseline | Direct load |

**Evidence (from `WinterSoldier/00-winter-soldier-gate.md` — "ARCHITECT Artifact Consumption (Mandatory)"):**

> "These artifacts are loaded directly from ARCHITECT output — not derived from Falcon output.
> Android module completeness = ARCHITECT feature-map SCREEN layer (loaded directly from ARCHITECT).
> Android routing parity = ARCHITECT routes.graph.json (loaded directly from ARCHITECT).
> Winter Soldier does not re-derive the PWA module inventory from Falcon output when fresh ARCHITECT artifacts are available. The canonical source is ARCHITECT."

**Updated scope declaration (from `WinterSoldier/01-mission-scope.md`):**

> "WinterSoldier scope is derived directly from ARCHITECT artifacts. Winter Soldier does not self-define the module inventory. Android completeness is measured against ARCHITECT-confirmed PWA modules (SCREEN layer), loaded directly from ARCHITECT — not re-derived from Falcon output. Falcon provides parity context; ARCHITECT is the canonical scope authority."

**Gate requirements (`WinterSoldier/00-winter-soldier-gate.md`):**

```
WINTERSOLDIER_PREFLIGHT_BLOCK: ARCHITECT_REQUIRED — ARCHITECT report missing
WINTERSOLDIER_PREFLIGHT_BLOCK: FALCON_REQUIRED — Falcon report missing or stale
```

WinterSoldier still requires both ARCHITECT and Falcon. ARCHITECT is now named as the direct scope authority. Falcon provides parity context.

**Can WinterSoldier operate if ARCHITECT artifacts are missing?**
NO. ARCHITECT feature-map SCREEN layer is the Android parity baseline. Without it, Android completeness is undefined.

**Classification: ARCHITECT_DRIVEN**
*(ARCHITECT is the canonical scope authority. feature-map.md, routes.graph.json, and ARCHITECTURE.md are loaded directly — not derived via Falcon. Falcon provides parity context; ARCHITECT defines parity scope.)*

---

### VISION

**Source files read:** `Vision.md`, `Vision/Vision.md`, `Vision/03-coverage-matrix.md`

**Artifacts consumed (upgraded 2026-06-05):**

| Artifact | Location | Used For |
|---|---|---|
| `feature-map.md` | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/ARCHITECT/feature-map.md` | Confirmed feature and module inventory — analytics coverage baseline for Area 3 (Coverage Matrix) |

**ARCHITECT gate:** ARCHITECT Mapping Gate (Mandatory Preflight) added to `Vision/Vision.md`.

Blocks Area 3 (Coverage Matrix) if ARCHITECT report is missing, stale (>7 days), or wrong scope. Other scan areas (event taxonomy, funnel analysis, attribution, privacy) may proceed with ARCHITECT_ABSENT noted in report header.

**Evidence (from `Vision/Vision.md` — "ARCHITECT Artifact Consumption (Mandatory — Area 3)"):**

> "Analytics coverage completeness = measured against ARCHITECT-confirmed features.
> Any ARCHITECT-confirmed feature without analytics instrumentation is a coverage gap (Area 3 finding).
> VISION does not self-derive the feature inventory for coverage completeness when a fresh ARCHITECT report exists."

**Can Vision operate without ARCHITECT?**
PARTIAL. Areas 1–2 and 4–10 (event taxonomy, funnel analysis, attribution, native parity, privacy, etc.) operate independently. Area 3 (Coverage Matrix) cannot produce a completeness verdict without ARCHITECT feature inventory.

**Classification: ARCHITECT_PARTIAL**
*(Gate required; feature-map consumed for Area 3 coverage completeness only. Majority of VISION scan areas operate independently. Analytics event discovery, funnel analysis, and attribution do not require ARCHITECT.)*

---

### THOR

**Source files read:** `Thor.md`, `thor/THOR.md`, `thor/01-release-scope.md`, `thor/02-architecture-gate.md`, `thor/03-security-gate.md`

**Artifacts consumed:**

| Artifact | Location | Used For |
|---|---|---|
| ARCHITECT signal (Gate 1) | RELEASE SIGNAL INVENTORY | ARCHITECT output is one of many required signal inputs |
| All specialist outputs | Respective output paths | Gates 2–9 rely on upstream specialist findings |

**Evidence (from `thor/THOR.md`):**

> "Primary upstream: VENOM, CARNAGE, KRAVEN, LOKI, HAWKEYE, FALCON, ARCHITECT, LOGAN, IRONMAN, DR. STRANGE, SPIDER-MAN (THOR consumes all their outputs as release signals)."

**Gate 1 (Release Scope + Signal Inventory) — `thor/01-release-scope.md`:**

THOR must list ARCHITECT as a signal in the RELEASE SIGNAL INVENTORY table and assess its status (PRESENT / MISSING / STALE / OUT OF SCOPE). Missing ARCHITECT does not automatically block release but THOR must explain the risk.

**Gate 2 direct artifact load (upgraded 2026-06-05):**
THOR Gate 2 (`thor/02-architecture-gate.md`) now declares an "ARCHITECT Artifact Consumption (Mandatory — Gate 2)" section with three named files loaded before the architecture evaluation:

| Artifact | Path | Used For |
|---|---|---|
| `dependency-map.md` | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/ARCHITECT/dependency-map.md` | Cross-feature dependency direction — confirms no direction violations |
| `feature-map.md` | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/ARCHITECT/feature-map.md` | Layer hierarchy per feature — confirms layer responsibilities |
| `ARCHITECTURE.md` (feature-level) | `ZZnotforproduction/APPS/VCSM/features/[feature]/ARCHITECTURE.md` | Architecture narrative and layer classification — compliance baseline |

> "Gate 2 architecture evaluation is grounded in ARCHITECT-confirmed structure.
> THOR does not re-derive layer maps or dependency direction from source code — ARCHITECT is the authoritative source.
> Any violation identified in Gate 2 must be traceable to a discrepancy between ARCHITECT-confirmed structure and actual implementation."

**THOR's ARCHITECT dependency (updated):**
Gate 2 now explicitly names and loads ARCHITECT artifact files. Dependency violations and layer compliance in Gate 2 are verified against ARCHITECT-confirmed structure, not re-derived.

**Can THOR operate if ARCHITECT is missing?**
PARTIAL for Gate 2 (architecture evaluation undefined without ARCHITECT baseline). Other gates (security, migration, performance, etc.) continue via specialist signal inputs.

**Classification: ARCHITECT_DRIVEN**
*(Gate 2 directly names and loads dependency-map.md, feature-map.md, and ARCHITECTURE.md before architecture compliance evaluation. ARCHITECT is no longer only an aggregation-level signal for Gate 2.)*

---

### AVENGERSASSEMBLE

**Source files read:** `AvengersAssemble.md`, `avengersassemble/avengersassemble.md`, `avengersassemble/02-run-order.md`, `avengersassemble/03-specialist-checks.md`

**Artifacts consumed (via orchestration):**

| Artifact | Used By (via threading) |
|---|---|
| `feature-map.md` | IRONMAN, LOKI, HAWKEYE, KRAVEN, SENTRY, FALCON, WINTERSOLDIER |
| `dependency-map.md` | IRONMAN, KRAVEN, CARNAGE, SENTRY |
| `database-read-map.md` | LOKI, KRAVEN, CARNAGE |
| `engine-consumer-map.md` | IRONMAN, CARNAGE, SENTRY |
| `architect-security-surface.json` | VENOM, ELEKTRA |
| `routes.graph.json` | HAWKEYE, FALCON |
| `ARCHITECTURE.md` (feature-level) | IRONMAN, HAWKEYE, SPIDER-MAN, SENTRY, FALCON |

**Evidence (from `avengersassemble/03-specialist-checks.md §0`):**

> "ARCHITECT must complete before any other specialist begins. After ARCHITECT completes, confirm artifact availability and include artifact paths in each subsequent specialist's prompt. Specialists must NOT be dispatched without confirmed ARCHITECT artifact paths."

**Area 1 — ARCHITECT Pass check:**
AvengersAssemble reads ARCHITECT output files to verify alignment before dispatching specialists.

> "Read:
> - `CURRENT/outputs/{date}/ARCHITECT/vcsm-system-map.md`
> - `CURRENT/outputs/{date}/ARCHITECT/vcsm-feature-map.md`
> - `CURRENT/outputs/{date}/ARCHITECT/vcsm-engine-consumer-map.md`
> - `CURRENT/outputs/{date}/ARCHITECT/vcsm-dependency-map.md`
> - `CURRENT/outputs/{date}/ARCHITECT/vcsm-database-read-map.md`"

**Can AvengersAssemble operate if ARCHITECT is missing?**
NO. AvengersAssemble's rule is absolute: specialists are not dispatched without confirmed ARCHITECT artifact paths. The entire assembly is blocked.

**Classification: ARCHITECT_PARTIAL**
*(AVENGERSASSEMBLE reads ARCHITECT artifacts in its own pass (§1) and threads them to specialists. However, it is primarily an orchestration layer — the actual artifact consumption happens within each specialist's own workflow. AVENGERSASSEMBLE is the broker, not the consumer.)*

---

## Special Investigation Results

### 1. VENOM — Detailed Answer

**What exact ARCHITECT artifacts are loaded?**
- `evidence-bundle.json` (freshness: 3 days, blocks if missing)
- `architect-security-surface.json` (freshness: 3 days, blocks if missing)
- `ARCHITECTURE.md` (per feature)
- `INDEX.md` (per feature)

**Which findings depend on them?**
ALL findings in V2 flow. Surface inventory (V2.2) is built entirely from `architect-security-surface.json`. Finding provenance tags ([SOURCE_VERIFIED] / [SCANNER_LEAD]) are assigned only after ARCHITECT-derived surfaces are identified. No ARCHITECT output = no surface inventory = no findings.

**Can VENOM run meaningfully if ARCHITECT output is empty?**
NO (V2 flow). VENOM V1 (manual scan without scanner integration) can run independently but produces a less complete analysis. V2 explicitly prohibits independent source discovery when evidence-bundle.json is present and fresh.

---

### 2. BLACKWIDOW — Detailed Answer

**What exact VENOM artifacts are consumed?**
VENOM report file (path from VENOM dependency gate, freshness 7 days). BLACKWIDOW consumes VENOM findings as its attack surface input — it attacks what VENOM found.

**What exact ARCHITECT artifacts are inherited?**
- `architect-security-surface.json` — consumed directly (not via VENOM)
- `evidence-bundle.json` (callgraph, callChains) — consumed directly for attack path construction

BLACKWIDOW has PARALLEL artifact consumption: it loads ARCHITECT artifacts directly AND consumes VENOM output. It does not receive ARCHITECT data via VENOM.

---

### 3. ELEKTRA — Detailed Answer

**Does ELEKTRA consume ARCHITECT directly?**
YES — explicitly documented in `elektra/ELEKTRA.md §6.5`:

> "Direct ARCHITECT Consumption (Independent Verification Path)"
> "Dependency paths:
>   Chain:  ARCHITECT → VENOM → BLACKWIDOW → ELEKTRA  (trust-boundary + adversarial context)
>   Direct: ARCHITECT → ELEKTRA                         (surface completeness verification)"

**Or only through VENOM and BLACKWIDOW?**
NO — both paths are active. Direct path uses `architect-security-surface.json` for independent verification. Chain path uses VENOM + BLACKWIDOW context.

---

### 4. THOR — Detailed Answer

**Which specialist outputs are mandatory?**
From `thor/01-release-scope.md`:
ALL specialists listed in the RELEASE SIGNAL INVENTORY. MISSING signals require risk explanation. Hard blockers from VENOM (CRITICAL findings), CARNAGE (BLOCKED status), SENTRY (CONTRACT VIOLATION), and DR.STRANGE (for CRITICAL/HIGH tier features) are automatic BLOCKED decisions.

**Which ARCHITECT outputs influence release decisions?**
Gate 2 (Architecture Gate) evaluates dependency violations, layer violations, and cross-feature boundary issues based on ARCHITECT system mapping. THOR does not re-run ARCHITECT scans — it evaluates whether ARCHITECT confirms no violations. ARCHITECT MISSING in Gate 1 is a CAUTION item in the Risk Acceptance Register.

---

## Artifact Flow Map

```
ARCHITECT
│
│ Produces:
│   feature-map.md ─────────────────────── LOKI, KRAVEN, SENTRY, IRONMAN, HAWKEYE, FALCON,
│                                           SPIDER-MAN (scope authority), WINTERSOLDIER (direct),
│                                           THOR (Gate 2 direct), VISION (Area 3),
│                                           AVENGERSASSEMBLE (threads to all)
│
│   dependency-map.md ───────────────────── KRAVEN, CARNAGE, SENTRY, IRONMAN,
│                                           THOR (Gate 2 direct),
│                                           AVENGERSASSEMBLE (threads to above)
│
│   database-read-map.md ────────────────── LOKI, KRAVEN, CARNAGE,
│                                           AVENGERSASSEMBLE (threads to above)
│
│   engine-consumer-map.md ─────────────── IRONMAN, CARNAGE, SENTRY,
│                                           AVENGERSASSEMBLE (threads to above)
│
│   architect-security-surface.json ──────── VENOM (V2), BLACKWIDOW (V2), ELEKTRA (direct),
│                                            AVENGERSASSEMBLE (threads to VENOM, ELEKTRA)
│
│   evidence-bundle.json (V2 scanner) ─────── VENOM (V2), BLACKWIDOW (V2), ELEKTRA (V2)
│
│   ARCHITECTURE.md (per feature) ──────── LOKI (indirect), CARNAGE, SENTRY, IRONMAN,
│                                           HAWKEYE, FALCON, SPIDER-MAN, LOGAN,
│                                           WINTERSOLDIER (direct), THOR (Gate 2 direct)
│
│   routes.graph.json ──────────────────── HAWKEYE, FALCON,
│                                           AVENGERSASSEMBLE (threads to above)
│
│   INDEX.md (per feature) ─────────────── VENOM (V2)
│
└── CURRENT_STATUS.md (per feature) ────── Written by all commands; read by THOR, DR.STRANGE
```

---

## Final Verdict

### 1. Truly ARCHITECT_DRIVEN Commands (14)

Commands that explicitly name ARCHITECT artifact files and use them in their analysis workflow:

| Command | Primary Artifacts | Impact if Empty |
|---|---|---|
| VENOM (V2) | architect-security-surface.json, evidence-bundle.json | No surface inventory → no findings |
| BLACKWIDOW (V2) | architect-security-surface.json, evidence-bundle.json (callgraph) | No attack targets → no adversarial findings |
| ELEKTRA | architect-security-surface.json, evidence-bundle.json (direct + chain) | No sink inventory → no source-to-sink chains |
| LOKI | feature-map.md, database-read-map.md | Undefined observation scope |
| KRAVEN | dependency-map.md, database-read-map.md, feature-map.md | Undefined workload boundary |
| CARNAGE | dependency-map.md, ARCHITECTURE.md, engine-consumer-map.md, database-read-map.md | Blast radius undefined |
| HAWKEYE | feature-map.md, routes.graph.json, ARCHITECTURE.md | No endpoint inventory → cannot verify |
| SENTRY | ARCHITECTURE.md, feature-map.md, dependency-map.md | No layer baseline → cannot verify compliance |
| IRONMAN | ARCHITECTURE.md, feature-map.md, dependency-map.md, engine-consumer-map.md | Steps 2–5 blocked |
| FALCON | feature-map.md, routes.graph.json, ARCHITECTURE.md | No PWA baseline → parity undefined |
| LOGAN | ARCHITECTURE.md (per feature) | No drift detection baseline |
| SPIDER-MAN ↑ | ARCHITECTURE.md + feature-map.md (scope authority) | MISSING coverage findings undefined (no module inventory) |
| WinterSoldier ↑ | feature-map.md (SCREEN), routes.graph.json, ARCHITECTURE.md (direct load) | Android completeness baseline undefined |
| THOR ↑ | dependency-map.md, feature-map.md, ARCHITECTURE.md (Gate 2 direct load) | Gate 2 architecture evaluation ungrounded |

↑ Upgraded 2026-06-05 from ARCHITECT_PARTIAL.

### 2. ARCHITECT_PARTIAL Commands (2)

Commands that use ARCHITECT artifacts for some aspects but retain independent derivation for others:

| Command | ARCHITECT Dependency | Independent Derivation |
|---|---|---|
| VISION ↑ | feature-map.md (Area 3 Coverage Matrix baseline) | All other scan areas: event taxonomy, funnel analysis, attribution, privacy, native parity |
| AvengersAssemble | Reads ARCHITECT artifacts in §1 check; threads to specialists | Orchestration logic is independent |

↑ Upgraded 2026-06-05 from INDEPENDENT.

### 3. INDEPENDENT Commands (0)

No commands remain fully independent. All 16 commands either gate on ARCHITECT, directly consume ARCHITECT artifacts, or both.

### 4. Governance System Classification

**ARCHITECT_DRIVEN system — near-full artifact-based consumption with partial-derivation edges.**

Phase 2 upgraded breakdown:
| Layer | Coverage | Commands |
|---|---|---|
| ARCHITECT_DRIVEN | ~87.5% (14/16) | VENOM, BLACKWIDOW, ELEKTRA, LOKI, KRAVEN, CARNAGE, HAWKEYE, SENTRY, IRONMAN, FALCON, LOGAN, SPIDER-MAN, WinterSoldier, THOR |
| ARCHITECT_PARTIAL | ~12.5% (2/16) | VISION (Area 3 only), AvengersAssemble (orchestration broker) |
| INDEPENDENT | 0% (0/16) | — |

Phase 1 audit (pre-upgrade): DRIVEN=11, PARTIAL=4, INDEPENDENT=1.
Phase 2 upgrades (2026-06-05): +3 DRIVEN (SPIDER-MAN, WinterSoldier, THOR), +1 PARTIAL (VISION, from INDEPENDENT).

### 5. Remaining Gap — What Would Make the System Fully ARCHITECT_DRIVEN

Two commands remain ARCHITECT_PARTIAL:

| Command | Gap | Path to ARCHITECT_DRIVEN |
|---|---|---|
| VISION | Area 3 only; Areas 1–2 and 4–10 operate independently | Anchor all scan areas to ARCHITECT — event taxonomy scope from feature-map, funnel scope from routes.graph.json |
| AvengersAssemble | Orchestration broker — threads artifacts but does not independently consume them | Promote §1 ARCHITECT Pass from verification check to mandatory artifact consumption block; validate all artifact contents before threading |

---

## Summary: Corrections vs. Pre-Existing Report

| Command | Pre-Correction Classification | Corrected Classification | Reason |
|---|---|---|---|
| LOKI | ARCHITECT_REQUIRED | ARCHITECT_DRIVEN | `loki/LOKI.md §4` explicitly loads feature-map and database-read-map; observation scope = ARCHITECT-confirmed module inventory |
| KRAVEN | ARCHITECT_REQUIRED | ARCHITECT_DRIVEN | `kraven/KRAVEN.md` has "ARCHITECT Artifact Consumption (Mandatory)" section with named files; prohibits independent scope derivation |
| CARNAGE | ARCHITECT_REQUIRED | ARCHITECT_DRIVEN | `carnage/CARNAGE.md` has "ARCHITECT Artifact Consumption (Mandatory)" section; blast radius = ARCHITECT dependency-map entries |
| SPIDER-MAN | ARCHITECT_REQUIRED | ARCHITECT_PARTIAL | `SPIDER-MAN/SPIDER-MAN.md` explicitly loads ARCHITECTURE.md and feature-map post-gate; coverage baseline = ARCHITECT-confirmed modules |
| HAWKEYE | ARCHITECT_REQUIRED | ARCHITECT_DRIVEN | `hawkeye/HAWKEYE.md` has "ARCHITECT Artifact Consumption (Mandatory)"; endpoint inventory = ARCHITECT route inventory (does not discover endpoints independently) |
| SENTRY | ARCHITECT_REQUIRED | ARCHITECT_DRIVEN | `Sentry/Sentry.md` has "ARCHITECT Artifact Consumption (Mandatory)"; does not re-map layers; uses ARCHITECT dependency-map as authoritative source |
| IRONMAN | ARCHITECT_REQUIRED | ARCHITECT_DRIVEN | `Ironman/Ironman.md` has "ARCHITECT Artifact Consumption (Mandatory)"; Steps 2–5 derived from ARCHITECT artifacts, not file system scanning |
| FALCON | ARCHITECT_REQUIRED (implied) | ARCHITECT_DRIVEN | `Falcon/Falcon.md` has "ARCHITECT Artifact Consumption (Mandatory)"; native parity scope is ARCHITECT-confirmed, not Falcon-defined |
| ELEKTRA | ARCHITECT_REQUIRED (indirect) | ARCHITECT_DRIVEN | `elektra/ELEKTRA.md §6.5` declares a direct ARCHITECT consumption path independent of VENOM+BLACKWIDOW chain |

---

*Phase 1 audit generated: 2026-06-05 — READ-ONLY classification of 16 commands*
*Phase 2 upgrades applied: 2026-06-05 — SPIDER-MAN, WinterSoldier, THOR, VISION upgraded; command files modified*
*Ticket: TICKET-ARCHITECT-CONSUMPTION-AUDIT-0001*
*Status: COMPLETE — Phase 2 upgrades applied*
*Evidence source: `.claude/commands/` — all primary command files and key sub-files read*
