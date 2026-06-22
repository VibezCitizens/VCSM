# ARCHITECT Execution Consumption Audit Report
**Ticket:** TICKET-ARCHITECT-CONSUMPTION-EXECUTION-AUDIT-0002
**Date:** 2026-06-05
**Scope:** All ARCHITECT_DRIVEN commands — artifact declaration vs. execution threading verification

---

## Audit Methodology

For each ARCHITECT_DRIVEN command, the following five-step chain was traced:

1. **Artifact Declared** — Is a specific ARCHITECT artifact named in the command's skill files?
2. **Artifact Loaded** — Is there explicit load/read logic in the workflow steps?
3. **Workflow Step Consuming Artifact** — Does the artifact drive a specific workflow step (scope definition, surface inventory assembly, blast radius calculation, etc.)?
4. **Finding Generation Consuming Artifact** — Are findings derived from artifact content (not re-derived from source)?
5. **Output Generation Consuming Artifact** — Does the output reference artifact-sourced data, paths, or counts?

Resilience questions per command:
- **Empty artifact** → does analysis collapse?
- **Changed artifact** → do findings change?
- **Removed artifact** → can command still complete?

---

## ARCHITECT Output Artifact Registry

| Artifact | Path Pattern | Owner | Consumers |
|----------|-------------|-------|-----------|
| `ARCHITECTURE.md` | `ZZnotforproduction/APPS/VCSM/features/[feature]/ARCHITECTURE.md` | ARCHITECT | All commands (scope/ownership/layer authority) |
| `INDEX.md` | `ZZnotforproduction/APPS/VCSM/features/[feature]/INDEX.md` | ARCHITECT | LOGAN, IRONMAN |
| `CURRENT_STATUS.md §ARCHITECT` | `ZZnotforproduction/APPS/VCSM/features/[feature]/CURRENT_STATUS.md` | ARCHITECT | LOGAN, Dr. Strange |
| `system-map.md` | `ZZnotforproduction/GOVERNANCE/outputs/{Y}/{M}/{D}/ARCHITECT/` | ARCHITECT | AVENGERSASSEMBLE, THOR |
| `feature-map.md` | `ZZnotforproduction/GOVERNANCE/outputs/{Y}/{M}/{D}/ARCHITECT/` | ARCHITECT | HAWKEYE, SPIDER-MAN, KRAVEN, THOR |
| `dependency-map.md` | `ZZnotforproduction/GOVERNANCE/outputs/{Y}/{M}/{D}/ARCHITECT/` | ARCHITECT | CARNAGE, KRAVEN, THOR |
| `engine-consumer-map.md` | `ZZnotforproduction/GOVERNANCE/outputs/{Y}/{M}/{D}/ARCHITECT/` | ARCHITECT | CARNAGE |
| `database-read-map.md` | `ZZnotforproduction/GOVERNANCE/outputs/{Y}/{M}/{D}/ARCHITECT/` | ARCHITECT | CARNAGE, KRAVEN |
| `routes.graph.json` | `ZZnotforproduction/GOVERNANCE/outputs/{Y}/{M}/{D}/ARCHITECT/graph-data/` | ARCHITECT | HAWKEYE |
| `evidence-bundle.json` | `ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{Y}/{M}/{D}/ARCHITECT/` | ARCHITECT V2 | VENOM, BLACKWIDOW, ELEKTRA |
| `architect-security-surface.json` | `ZZnotforproduction/GOVERNANCE/outputs/{Y}/{M}/{D}/ARCHITECT/` | ARCHITECT V2 | VENOM, BLACKWIDOW, ELEKTRA |

---

## Per-Command Consumption Audit

---

### VENOM — Security Sheriff

| Step | Status | Evidence |
|------|--------|----------|
| Artifact Declared | ✅ YES | `evidence-bundle.json`, `architect-security-surface.json` explicitly named in `venom/09-scanner-integration.md` |
| Artifact Loaded | ✅ YES | Explicit Evidence Bundle Gate: locate → verify freshness (≤3d) → load → extract surfaces/chains. Blocks if missing or stale. |
| Workflow Step Consuming | ✅ YES | Surface Inventory Assembly uses `architect-security-surface.json.writeSurfaces/rpcs/edgeFunctions`. CallChain cross-reference uses `evidence-bundle.json.callChains`. |
| Finding Generation Consuming | ✅ YES | Completion principle states: "consumed ARCHITECT evidence-bundle.json before reading any source file." Findings explicitly prohibited if re-derived from source grepping. |
| Output Generation Consuming | ✅ YES | Findings reference callChain entries and surface paths from artifacts. |

**Resilience:**
- **Empty artifact** → COLLAPSE: VENOM BLOCKED (explicit block condition)
- **Changed artifact** → YES: different surfaces and chains = different vulnerabilities analyzed
- **Artifact removed** → HARD BLOCK: `VENOM BLOCKED: ARCHITECT evidence bundle required`

**Classification: `FULL_EXECUTION_CONSUMPTION`**

---

### BLACKWIDOW — Ethical Red Team

| Step | Status | Evidence |
|------|--------|----------|
| Artifact Declared | ✅ YES | `evidence-bundle.json`, `architect-security-surface.json` named in `blackwidow/10-scanner-integration.md` |
| Artifact Loaded | ✅ YES | Evidence Bundle Gate identical to VENOM: locate → freshness check (≤3d) → load `callChains` and `architecture.controllers` as authoritative attack target inventory |
| Workflow Step Consuming | ✅ YES | Attack Surface Inventory Assembly (Step 3): load evidence-bundle.json callChains + securitySensitiveSurfaces. Step 4: build attack surface from architect-security-surface.json. Step 6: LOW confidence surfaces → PRIMARY ATTACK TARGETS via callgraph from artifact. |
| Finding Generation Consuming | ✅ YES | Completion principle: "consumed ARCHITECT evidence-bundle.json before constructing any attack scenario." Prohibited: grepping source to re-discover DAL functions or controllers. |
| Output Generation Consuming | ✅ YES | Attack scenarios trace through callChains from artifact; report references artifact-sourced surface inventory. |

**Resilience:**
- **Empty artifact** → COLLAPSE: BLACKWIDOW BLOCKED
- **Changed artifact** → YES: different attack surface = different scenarios and findings
- **Artifact removed** → HARD BLOCK: `BLACKWIDOW BLOCKED: ARCHITECT evidence bundle required`

**Classification: `FULL_EXECUTION_CONSUMPTION`**

---

### ELEKTRA — Precision Security Scanner

| Step | Status | Evidence |
|------|--------|----------|
| Artifact Declared | ✅ YES | Dual paths: `evidence-bundle.json` (chain candidates), `architect-security-surface.json` (direct verification path, independent of VENOM/BLACKWIDOW chain) |
| Artifact Loaded | ✅ YES | ARCHITECT Output Freshness Check (§3.4, formatted preflight output required). Evidence Bundle Gate (§3.1.1). Explicit load of both artifacts. |
| Workflow Step Consuming | ✅ YES | Vulnerability Surface Inventory Assembly (§4.1): Steps 1–4 extract WRITE SINK / RPC / EDGE FUNCTION inventories from `architect-security-surface.json`. Step 4: callgraph chain pre-computation from artifacts. |
| Finding Generation Consuming | ✅ YES | ARCHITECT_SURFACE_MISS rule (§3.5): if ELEKTRA finds a sink not in `architect-security-surface.json` → flagged as `ARCHITECT_SURFACE_MISS` → routed to ARCHITECT re-run. Artifact completeness is itself a finding category. |
| Output Generation Consuming | ✅ YES | Output includes ARCHITECT Output Check block (Status: PASS/WARN/BLOCK, counts per surface type, generated-at timestamp). Findings list callChain entries from evidence-bundle. |

**Additional:** ELEKTRA is the only command with a **bidirectional** consumption relationship — it not only consumes ARCHITECT artifacts but validates them for completeness and flags gaps back to ARCHITECT (ARCHITECT_SURFACE_MISS).

**Resilience:**
- **Empty artifact** → COLLAPSE: ELEKTRA BLOCKED
- **Changed artifact** → YES: surface inventory changes = different chains analyzed; completeness findings change
- **Artifact removed** → HARD BLOCK: `ELEKTRA BLOCKED: ARCHITECT evidence bundle required`

**Classification: `FULL_EXECUTION_CONSUMPTION`** (strongest form — bidirectional validation)

---

### HAWKEYE — Endpoint Contract Verifier

| Step | Status | Evidence |
|------|--------|----------|
| Artifact Declared | ✅ YES | `feature-map.md`, `routes.graph.json`, `ARCHITECTURE.md` named in `HAWKEYE.md` and `hawkeye/02-endpoint-trace.md` |
| Artifact Loaded | ✅ YES | Gate passes → artifacts loaded as endpoint inventory authority |
| Workflow Step Consuming | ✅ YES | "Endpoint inventory = ARCHITECT feature-map route inventory for the target scope." Scope of what is verified is entirely artifact-defined. |
| Finding Generation Consuming | ⚠️ PARTIAL | Artifact defines WHICH endpoints must be verified. Findings (contract drift, auth failures, payload mismatches) are generated by independent source analysis of those endpoints — not from artifact content itself. |
| Output Generation Consuming | ✅ YES | Report references source path (`ZZnotforproduction/GOVERNANCE/outputs/.../ARCHITECT/`); endpoint inventory table derived from artifact. |

**Resilience:**
- **Empty artifact** → analysis collapses to empty scope — no endpoints to verify, no findings possible
- **Changed artifact** → YES: different route inventory = different endpoints verified = scope-change-driven finding delta
- **Artifact removed** → BLOCKED at gate

**Note:** The artifact is the **scope authority** for HAWKEYE, not the **finding authority**. Findings are source-driven; the artifact determines what source gets analyzed.

**Classification: `WORKFLOW_CONSUMED`**

---

### SPIDER-MAN — Regression Safety Net

| Step | Status | Evidence |
|------|--------|----------|
| Artifact Declared | ✅ YES | `ARCHITECTURE.md`, `feature-map.md` named in `SPIDER-MAN.md` (lines 70–76) |
| Artifact Loaded | ✅ YES | Gate passes → both artifacts loaded as scope authority |
| Workflow Step Consuming | ✅ YES | "Coverage scope = ARCHITECT-confirmed module and layer inventory." Layer hierarchy from `feature-map.md` determines which layers must be tested. |
| Finding Generation Consuming | ✅ YES | Direct rule (line 76): "Any ARCHITECT-confirmed controller, DAL method, or hook without test coverage is a MISSING finding." The finding EXISTS only if the artifact names the module. The artifact IS the finding source list. |
| Output Generation Consuming | ✅ YES | Report lists ARCHITECT-confirmed modules with coverage status; MISSING findings reference artifact-sourced module names. |

**Resilience:**
- **Empty artifact** → COLLAPSE: no modules in scope → no MISSING findings possible (silent under-reporting risk)
- **Changed artifact** → YES: new modules added → new MISSING findings; modules removed → findings disappear
- **Artifact removed** → BLOCKED at gate

**Classification: `FULL_EXECUTION_CONSUMPTION`**

---

### CARNAGE — Schema Migration Architect

| Step | Status | Evidence |
|------|--------|----------|
| Artifact Declared | ✅ YES | `dependency-map.md`, `ARCHITECTURE.md`, `engine-consumer-map.md`, `database-read-map.md` named in `Carnage.md` |
| Artifact Loaded | ✅ YES | Gate passes → all four artifacts loaded |
| Workflow Step Consuming | ✅ YES | Blast radius = consumers from `dependency-map.md`. Migration owner = feature from `ARCHITECTURE.md`. Engine consumer list from `engine-consumer-map.md`. DAL methods from `database-read-map.md`. |
| Finding Generation Consuming | ✅ YES | Blast radius IS a finding; it comes entirely from `dependency-map.md`. Incomplete migration risk list without artifact = incomplete risk assessment. |
| Output Generation Consuming | ✅ YES | Migration plan lists artifact-sourced consumers, engine dependencies, and DAL touch points. |

**Resilience:**
- **Empty artifact** → incomplete blast radius — migration plan is structurally valid but missing cross-feature impact analysis
- **Changed artifact** → YES: new consumers in dependency-map = higher blast radius = different migration classification
- **Artifact removed** → BLOCKED at gate

**Classification: `WORKFLOW_CONSUMED`** (blast radius finding is artifact-driven, but the migration plan itself — DDL, RLS, rollback strategy — is schema-analysis driven)

---

### KRAVEN — Performance Analyst

| Step | Status | Evidence |
|------|--------|----------|
| Artifact Declared | ✅ YES | `dependency-map.md`, `database-read-map.md`, `feature-map.md` named in `Kraven.md` |
| Artifact Loaded | ✅ YES | Gate passes → artifacts loaded |
| Workflow Step Consuming | ✅ YES | DAL inventory from `database-read-map.md` defines which DAL methods are analyzed for N+1, over-fetch, duplicate read. Layer hierarchy from `feature-map.md` confirms scope. |
| Finding Generation Consuming | ⚠️ PARTIAL | Artifact defines WHICH DALs are analyzed. Performance findings (N+1 patterns, payload size, missing index) are generated by source analysis of those DALs — not from artifact content itself. |
| Output Generation Consuming | ✅ YES | Report references artifact-sourced DAL inventory; performance findings list artifact-named DAL methods. |

**Resilience:**
- **Empty artifact** → analysis collapses to undetermined scope — no DAL inventory → no findings possible
- **Changed artifact** → YES: new DALs in scope = new performance findings
- **Artifact removed** → BLOCKED at gate

**Classification: `WORKFLOW_CONSUMED`**

---

### LOGAN — Documentation Authority

| Step | Status | Evidence |
|------|--------|----------|
| Artifact Declared | ✅ YES | `ARCHITECTURE.md` (documentation truth source), `CURRENT_STATUS.md §ARCHITECT` named in `Logan.md` |
| Artifact Loaded | ✅ YES | Gate passes → artifacts loaded |
| Workflow Step Consuming | ✅ YES | Architecture state from `ARCHITECTURE.md` is the baseline against which documentation drift is detected. |
| Finding Generation Consuming | ✅ YES | Documentation drift = discrepancy between documentation and `ARCHITECTURE.md` content. Drift findings are direct artifact-vs-docs comparisons. |
| Output Generation Consuming | ✅ YES | Drift report cites artifact content as the authoritative baseline. |

**Resilience:**
- **Empty artifact** → no baseline → no drift detectable (false clean report risk)
- **Changed artifact** → YES: architecture changes = drift findings change
- **Artifact removed** → BLOCKED at gate

**Classification: `WORKFLOW_CONSUMED`** (findings are documentation-vs-artifact comparison; both sides needed)

---

### IRONMAN — Ownership Mapper

| Step | Status | Evidence |
|------|--------|----------|
| Artifact Declared | ✅ YES | `ARCHITECTURE.md` ownership section named in `Ironman.md` |
| Artifact Loaded | ✅ YES | Gate passes → artifact loaded |
| Workflow Step Consuming | ✅ YES | Feature ownership boundaries from `ARCHITECTURE.md` drive ownership assignment |
| Finding Generation Consuming | ✅ YES | Ownership gaps = modules in `ARCHITECTURE.md` without declared owner |
| Output Generation Consuming | ✅ YES | Ownership report derived from artifact content |

**Resilience:**
- **Empty artifact** → ownership map is empty — cannot assign ownership
- **Changed artifact** → YES: new modules → new ownership assignments or gaps
- **Artifact removed** → BLOCKED at gate

**Classification: `WORKFLOW_CONSUMED`**

---

### THOR — Release Gate

| Step | Status | Evidence |
|------|--------|----------|
| Artifact Declared | ✅ YES | `dependency-map.md`, `feature-map.md`, `ARCHITECTURE.md` named in `thor/02-architecture-gate.md` |
| Artifact Loaded | ✅ YES | Architecture Gate (§2) loads all three artifacts before gate evaluation |
| Workflow Step Consuming | ✅ YES | Dependency direction violations checked against `dependency-map.md`. Layer responsibility violations checked against `feature-map.md`. Architecture compliance baseline from `ARCHITECTURE.md`. |
| Finding Generation Consuming | ✅ YES | Gate FAIL = artifact content states X, code violates X. Gate findings are direct artifact-vs-code comparisons. |
| Output Generation Consuming | ✅ YES | Release gate output cites artifact paths and specific violations. |

**Resilience:**
- **Empty artifact** → architecture gate passes vacuously — NO violations detectable (false release clearance risk)
- **Changed artifact** → YES: dependency direction changes = violations appear/disappear
- **Artifact removed** → BLOCKED at architecture gate

**Classification: `WORKFLOW_CONSUMED`**

---

### DEADPOOL — Bug Tracer

| Step | Status | Evidence |
|------|--------|----------|
| Artifact Declared | ✅ YES | `ARCHITECTURE.md` named in `Deadpool.md` for scope bounding |
| Artifact Loaded | ✅ YES | Gate passes → artifact loaded |
| Workflow Step Consuming | ⚠️ PARTIAL | `ARCHITECTURE.md` bounds the investigation scope (which files/layers to investigate). Investigation itself is source-code analysis. |
| Finding Generation Consuming | ❌ NO | Bug trace findings are source-analysis driven. The artifact constrains scope but does not generate findings. |
| Output Generation Consuming | ⚠️ PARTIAL | Report may reference artifact for scope context but findings are source-derived. |

**Resilience:**
- **Empty artifact** → scope becomes unbounded — investigation proceeds but without ARCHITECT boundary constraints. Analysis does NOT collapse.
- **Changed artifact** → scope narrows/widens but bug findings may not change (bug exists regardless of scope document)
- **Artifact removed** → BLOCKED at gate (cannot bypass gate)

**Classification: `PARTIAL_EXECUTION`**

---

### SENTRY — Boundary Enforcement

| Step | Status | Evidence |
|------|--------|----------|
| Artifact Declared | ✅ YES | `ARCHITECTURE.md` boundary definitions named in `Sentry.md` |
| Artifact Loaded | ✅ YES | Gate passes → artifact loaded |
| Workflow Step Consuming | ✅ YES | Boundary compliance checks against `ARCHITECTURE.md` boundary definitions |
| Finding Generation Consuming | ✅ YES | Boundary violations = code crosses boundaries defined in `ARCHITECTURE.md` |
| Output Generation Consuming | ✅ YES | Report cites artifact-defined boundaries violated |

**Resilience:**
- **Empty artifact** → no boundaries defined → no violations detectable (false clean report)
- **Changed artifact** → YES: boundary changes → violation findings change
- **Artifact removed** → BLOCKED at gate

**Classification: `WORKFLOW_CONSUMED`**

---

### Dr. Strange — Feature Status Oracle

| Step | Status | Evidence |
|------|--------|----------|
| Artifact Declared | ✅ YES | `ARCHITECTURE.md`, `CURRENT_STATUS.md §ARCHITECT` named |
| Artifact Loaded | ✅ YES | Gate passes → artifacts loaded |
| Workflow Step Consuming | ⚠️ PARTIAL | Architecture state informs feature status assessment and command routing recommendations |
| Finding Generation Consuming | ❌ NO | Dr. Strange generates status assessments and routing recommendations — not findings in the security/compliance sense. Artifact informs status but status logic is separate. |
| Output Generation Consuming | ⚠️ PARTIAL | Feature status board may reference ARCHITECT last-run date from `CURRENT_STATUS.md §ARCHITECT` |

**Resilience:**
- **Empty artifact** → status assessment proceeds with reduced context; does NOT collapse
- **Changed artifact** → status may update but routing logic is separate
- **Artifact removed** → BLOCKED at gate

**Classification: `PARTIAL_EXECUTION`**

---

### GREENGOBLIN — Evidence Classifier

| Step | Status | Evidence |
|------|--------|----------|
| Artifact Declared | ✅ YES | `ARCHITECTURE.md` for evidence scope |
| Artifact Loaded | ✅ YES | Gate passes → artifact loaded |
| Workflow Step Consuming | ⚠️ PARTIAL | ARCHITECT scope bounds evidence collection for anti-hallucination verification |
| Finding Generation Consuming | ⚠️ PARTIAL | Claim validation work is independent; ARCHITECT sets scope of what claims are in-scope |
| Output Generation Consuming | ⚠️ PARTIAL | Report may reference artifact for scope context |

**Resilience:**
- **Empty artifact** → scope becomes undetermined; claim validation can still proceed
- **Changed artifact** → scope changes; validation may cover different claims
- **Artifact removed** → BLOCKED at gate

**Classification: `PARTIAL_EXECUTION`**

---

### WOLVERINE — Task Planner

| Step | Status | Evidence |
|------|--------|----------|
| Artifact Declared | ✅ YES | `ARCHITECTURE.md` for module boundaries |
| Artifact Loaded | ✅ YES | Gate passes → artifact loaded |
| Workflow Step Consuming | ⚠️ PARTIAL | Module boundaries from `ARCHITECTURE.md` inform task decomposition and scope constraints |
| Finding Generation Consuming | ❌ NO | WOLVERINE produces plans, not findings |
| Output Generation Consuming | ⚠️ PARTIAL | Plans may reference module boundary constraints from artifact |

**Resilience:**
- **Empty artifact** → plan proceeds without boundary constraints; does NOT collapse
- **Changed artifact** → scope constraints may change; plan structure adjusts
- **Artifact removed** → BLOCKED at gate

**Classification: `PARTIAL_EXECUTION`**

---

### LOKI — Runtime Tracer

| Step | Status | Evidence |
|------|--------|----------|
| Artifact Declared | ✅ YES | ARCHITECT gate declared; specific area 4+ artifacts TBD |
| Artifact Loaded | ✅ YES | Gate passes → artifacts loaded (areas 4+) |
| Workflow Step Consuming | ⚠️ PARTIAL | Varies by investigation area — early areas (1–3) may be gate-only; later areas consume feature maps |
| Finding Generation Consuming | ⚠️ PARTIAL | Runtime traces are live observation; ARCHITECT provides scope context |
| Output Generation Consuming | ⚠️ PARTIAL | Findings reference artifact for module context |

**Resilience:** Insufficient detail in skill files to determine full collapse behavior per area.

**Classification: `PARTIAL_EXECUTION`** (insufficient evidence for WORKFLOW_CONSUMED determination)

---

### AVENGERSASSEMBLE — Parallel Orchestrator

| Step | Status | Evidence |
|------|--------|----------|
| Artifact Declared | ✅ YES | ARCHITECT freshness required for ALL downstream specialists |
| Artifact Loaded | ✅ YES | Orchestrator verifies ARCHITECT freshness before spawning specialists |
| Workflow Step Consuming | ✅ YES | Specialists cannot execute if ARCHITECT stale — cascades ARCHITECT freshness requirement to all spawned commands |
| Finding Generation Consuming | ⚠️ INDIRECT | AVENGERSASSEMBLE aggregates specialist findings; artifact is consumed by specialists, not directly by orchestrator |
| Output Generation Consuming | ✅ YES | Aggregate report includes ARCHITECT metadata for all specialist runs |

**Classification: `WORKFLOW_CONSUMED`** (orchestrator-level; artifact freshness gates specialist dispatch)

---

## Summary Classification Table

| Command | Declared | Loaded | Workflow | Findings | Output | Classification |
|---------|----------|--------|----------|----------|--------|----------------|
| **VENOM** | ✅ | ✅ | ✅ | ✅ | ✅ | `FULL_EXECUTION_CONSUMPTION` |
| **BLACKWIDOW** | ✅ | ✅ | ✅ | ✅ | ✅ | `FULL_EXECUTION_CONSUMPTION` |
| **ELEKTRA** | ✅ | ✅ | ✅ | ✅ | ✅ | `FULL_EXECUTION_CONSUMPTION` |
| **SPIDER-MAN** | ✅ | ✅ | ✅ | ✅ | ✅ | `FULL_EXECUTION_CONSUMPTION` |
| **HAWKEYE** | ✅ | ✅ | ✅ | ⚠️ | ✅ | `WORKFLOW_CONSUMED` |
| **CARNAGE** | ✅ | ✅ | ✅ | ✅ | ✅ | `WORKFLOW_CONSUMED` |
| **KRAVEN** | ✅ | ✅ | ✅ | ⚠️ | ✅ | `WORKFLOW_CONSUMED` |
| **LOGAN** | ✅ | ✅ | ✅ | ✅ | ✅ | `WORKFLOW_CONSUMED` |
| **IRONMAN** | ✅ | ✅ | ✅ | ✅ | ✅ | `WORKFLOW_CONSUMED` |
| **THOR** | ✅ | ✅ | ✅ | ✅ | ✅ | `WORKFLOW_CONSUMED` |
| **SENTRY** | ✅ | ✅ | ✅ | ✅ | ✅ | `WORKFLOW_CONSUMED` |
| **AVENGERSASSEMBLE** | ✅ | ✅ | ✅ | ⚠️ | ✅ | `WORKFLOW_CONSUMED` |
| **DEADPOOL** | ✅ | ✅ | ⚠️ | ❌ | ⚠️ | `PARTIAL_EXECUTION` |
| **Dr. Strange** | ✅ | ✅ | ⚠️ | ❌ | ⚠️ | `PARTIAL_EXECUTION` |
| **GREENGOBLIN** | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | `PARTIAL_EXECUTION` |
| **WOLVERINE** | ✅ | ✅ | ⚠️ | ❌ | ⚠️ | `PARTIAL_EXECUTION` |
| **LOKI** | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | `PARTIAL_EXECUTION` |

**Legend:** ✅ = yes / ⚠️ = partial / ❌ = no

---

## Count by Classification

| Classification | Count | Commands |
|----------------|-------|----------|
| `FULL_EXECUTION_CONSUMPTION` | 4 | VENOM, BLACKWIDOW, ELEKTRA, SPIDER-MAN |
| `WORKFLOW_CONSUMED` | 8 | HAWKEYE, CARNAGE, KRAVEN, LOGAN, IRONMAN, THOR, SENTRY, AVENGERSASSEMBLE |
| `PARTIAL_EXECUTION` | 5 | DEADPOOL, Dr. Strange, GREENGOBLIN, WOLVERINE, LOKI |
| `DECLARED_ONLY` | 0 | — |

---

## Resilience Summary

### If Artifact Content is Empty

| Classification | Behavior |
|----------------|----------|
| `FULL_EXECUTION_CONSUMPTION` | **HARD BLOCK** — VENOM/BLACKWIDOW/ELEKTRA emit explicit blocked status. SPIDER-MAN produces empty MISSING set (silent under-reporting). |
| `WORKFLOW_CONSUMED` | **SCOPE COLLAPSE** — command proceeds but with empty scope. All findings disappear. THOR passes architecture gate vacuously (false release clearance). |
| `PARTIAL_EXECUTION` | **REDUCED CONTEXT** — command proceeds without boundary constraints. Analysis is unconstrained but not blocked. |

**Critical risk: Silent under-reporting.** Empty artifacts do not BLOCK most `WORKFLOW_CONSUMED` commands. THOR, SENTRY, CARNAGE, and LOGAN all pass with false-clean reports if artifacts are empty. Only V2 security commands (VENOM, BLACKWIDOW, ELEKTRA) have hard blocks on empty artifacts.

---

### If Artifact Content Changes

All commands are **finding-change-sensitive** to artifact content:
- Scope-based consumers (HAWKEYE, SPIDER-MAN, CARNAGE, KRAVEN): different scope → different findings covered
- Baseline consumers (LOGAN, SENTRY, THOR): different baseline → different violations detected
- Surface consumers (VENOM, BLACKWIDOW, ELEKTRA): different surfaces → different vulnerabilities analyzed

**No command is immune to artifact content changes.** A manipulated or incorrect ARCHITECT artifact cascades incorrect findings to all downstream commands.

---

### If Artifact is Removed

All 17 ARCHITECT_DRIVEN commands are **BLOCKED at gate** if the artifact is removed:
- V2 security commands: blocked by explicit Evidence Bundle Gate check
- All others: blocked by `00-architect-mapping-gate.md` mandatory preflight

No command in the audit can complete without a valid ARCHITECT artifact (within freshness window).

---

## Key Observations

### 1. FULL_EXECUTION_CONSUMPTION Commands Have Hard Defensive Gates
VENOM, BLACKWIDOW, and ELEKTRA (V2 Scanner commands) are the most robustly wired. They:
- Block on missing OR stale artifacts (3-day window)
- Prohibit re-deriving surfaces/chains from source
- Require explicit freshness checks with formatted output
- Surface gaps back to ARCHITECT (ELEKTRA's ARCHITECT_SURFACE_MISS rule)

### 2. WORKFLOW_CONSUMED Commands Have a Soft Failure Mode
Commands like THOR, SENTRY, CARNAGE, and LOGAN pass the gate check but do not enforce content completeness. An ARCHITECT run that produced structurally valid but content-thin artifacts (empty dependency-map, minimal ARCHITECTURE.md) would:
- Pass the gate (report exists, SUCCESS, ≤7 days)
- Cause finding sets to shrink silently (no warnings)
- Risk false-clean THOR release gates

### 3. PARTIAL_EXECUTION Commands Use Artifact for Scope Context Only
DEADPOOL, WOLVERINE, Dr. Strange use the artifact as a boundary hint, not a finding driver. If these commands were run without ARCHITECT (gate removed), their analysis would be less precise but functionally complete. The gate provides governance — these commands would NOT naturally collapse.

### 4. DECLARED_ONLY: Zero Instances
Every command that declares an ARCHITECT artifact at minimum loads and uses it in a workflow step. There are no cases of declaration without any downstream use. This is a strong finding — the dependency graph is not cosmetic.

### 5. SPIDER-MAN is the Only Non-Security Command with FULL_EXECUTION_CONSUMPTION
SPIDER-MAN's finding definition (MISSING = ARCHITECT-confirmed module without test) makes findings fundamentally artifact-content-dependent. This is structurally stronger than HAWKEYE or KRAVEN, which use the artifact for scope but generate findings from independent source analysis.

---

## Dependency Chain Summary

```
Security chain:     ARCHITECT → VENOM → BLACKWIDOW → ELEKTRA → THOR
                    [FULL]      [FULL]   [FULL]        [FULL]    [WORKFLOW]

Runtime chain:      ARCHITECT → LOKI → KRAVEN → THOR
                    [PARTIAL]          [WORKFLOW] [WORKFLOW]

Migration chain:    ARCHITECT → CARNAGE → THOR
                    [WORKFLOW]            [WORKFLOW]

Ownership chain:    ARCHITECT → IRONMAN → THOR
                    [WORKFLOW]            [WORKFLOW]

Documentation chain: ARCHITECT → LOGAN
                     [WORKFLOW]

Evidence chain:     ARCHITECT → GREENGOBLIN
                    [PARTIAL]

Test coverage chain: ARCHITECT → SPIDER-MAN → THOR
                     [FULL]                   [WORKFLOW]

Endpoint chain:     ARCHITECT → HAWKEYE → THOR
                    [WORKFLOW]            [WORKFLOW]

Routing chain:      ARCHITECT → Dr. Strange
                    [PARTIAL]

Release gate:       ARCHITECT → [all upstream] → THOR
                    [WORKFLOW]
```

---

## Recommendations

**R1 — Content Completeness Check for WORKFLOW_CONSUMED Commands**
THOR, SENTRY, CARNAGE should validate that key sections of consumed artifacts are non-empty before proceeding. An empty `dependency-map.md` should warn or block, not silently produce a clean report.

**R2 — Standardize V2 Freshness Window**
V2 security commands use 3-day freshness; gate uses 7-day freshness. Consider aligning to a single window or explicitly documenting why security commands have a tighter window.

**R3 — LOKI Artifact Consumption Specification**
LOKI's per-area artifact consumption is underspecified in skill files. Areas 4+ reference artifacts but the binding is implicit. A formal §scanner-integration section (matching VENOM/BLACKWIDOW/ELEKTRA pattern) would upgrade LOKI from PARTIAL_EXECUTION to WORKFLOW_CONSUMED.

**R4 — DEADPOOL / WOLVERINE Scope Collapse Documentation**
These commands proceed without ARCHITECT boundary constraints if the artifact is thin. This is acceptable by design (bug investigation and task planning should not be blocked by stale architecture docs), but should be explicitly noted in skill files so future contributors understand the intentional degraded-mode behavior.

---

*Report generated: 2026-06-05*
*Ticket: TICKET-ARCHITECT-CONSUMPTION-EXECUTION-AUDIT-0002*
*Scope: 17 ARCHITECT_DRIVEN commands*
