# ARCHITECT Artifact Completeness Gate Report
**Ticket:** TICKET-ARCHITECT-ARTIFACT-COMPLETENESS-GATE-0001
**Date:** 2026-06-05
**Scope:** 9 ARCHITECT_DRIVEN commands — completeness gate additions

---

## Objective

Add artifact content validation to every ARCHITECT_DRIVEN command that currently performs only presence + freshness checks. Prevent false-clean reports produced when ARCHITECT artifacts exist but contain empty, thin, or structurally incomplete content.

---

## Files Reviewed

| File | Command |
|------|---------|
| `.claude/commands/thor/02-architecture-gate.md` | THOR |
| `.claude/commands/Sentry/Sentry.md` | SENTRY |
| `.claude/commands/carnage/03-blast-radius-runtime-impact.md` | CARNAGE |
| `.claude/commands/Logan/Logan.md` | LOGAN |
| `.claude/commands/kraven/04-analysis-workflow.md` | KRAVEN |
| `.claude/commands/hawkeye/02-endpoint-trace.md` | HAWKEYE |
| `.claude/commands/Ironman/02-ownership-discovery.md` | IRONMAN |
| `.claude/commands/loki/08-runtime-workflow.md` | LOKI |
| `.claude/commands/SPIDER-MAN/09-scanner-integration.md` | SPIDER-MAN |

---

## Files Updated

All 9 files updated. Summary of changes per command:

---

### THOR — `thor/02-architecture-gate.md`

**Insertion point:** After ARCHITECT Artifact Consumption section, before Gate 2 evaluation begins.

**Completeness checks added:**

| Artifact | Block condition |
|----------|----------------|
| `dependency-map.md` | EMPTY or MISSING (without EXPLICIT_NONE) → `THOR BLOCKED` |
| `feature-map.md` | EMPTY or MISSING (without EXPLICIT_NONE) → `THOR BLOCKED` |
| `ARCHITECTURE.md` | THIN or MISSING → `THOR BLOCKED` |

**Tags introduced:** `ARCHITECT_ARTIFACT_INCOMPLETE: DEPENDENCY_MAP_EMPTY`, `ARCHITECT_ARTIFACT_INCOMPLETE: FEATURE_MAP_EMPTY`, `ARCHITECT_ARTIFACT_INCOMPLETE: ARCHITECTURE_THIN`

**Risk addressed:** Empty `dependency-map.md` previously allowed Gate 2 to pass vacuously — no dependency violations detectable, not zero violations present. This was the highest-risk false-clean path.

---

### SENTRY — `Sentry/Sentry.md`

**Insertion point:** After ARCHITECT Artifact Consumption section, before main compliance review.

**Completeness checks added:**

| Artifact | Block condition |
|----------|----------------|
| `ARCHITECTURE.md` | THIN or MISSING → `SENTRY BLOCKED` |
| `feature-map.md` | EMPTY or MISSING (without EXPLICIT_NONE) → `SENTRY BLOCKED` |
| `dependency-map.md` | EMPTY or MISSING (without EXPLICIT_NONE) → `SENTRY BLOCKED` |

**Tags introduced:** `ARCHITECT_ARTIFACT_INCOMPLETE: ARCHITECTURE_THIN`, `ARCHITECT_ARTIFACT_INCOMPLETE: FEATURE_MAP_EMPTY`, `ARCHITECT_ARTIFACT_INCOMPLETE: DEPENDENCY_MAP_EMPTY`

**EXPLICIT_NONE exception:** `NO_DEPENDENCIES_VERIFIED` written by ARCHITECT is valid — dependency direction check skipped with a note.

---

### CARNAGE — `carnage/03-blast-radius-runtime-impact.md`

**Insertion point:** After "Runtime impact is derived from ARCHITECT artifact evidence", before blast radius computation begins.

**Completeness checks added:**

| Artifact | Block condition |
|----------|----------------|
| `dependency-map.md` | EMPTY or MISSING (without EXPLICIT_NONE) → `CARNAGE BLOCKED` |
| `database-read-map.md` | EMPTY or MISSING (without EXPLICIT_NONE) → `CARNAGE BLOCKED` |
| `engine-consumer-map.md` | EMPTY or MISSING (without EXPLICIT_NONE) → WARN (not hard block) |
| `ARCHITECTURE.md` (ownership section) | THIN or MISSING → WARN |

**Tags introduced:** `ARCHITECT_ARTIFACT_INCOMPLETE: DEPENDENCY_MAP_EMPTY`, `ARCHITECT_ARTIFACT_INCOMPLETE: DATABASE_READ_MAP_EMPTY`

**EXPLICIT_NONE exceptions:** `NO_DEPENDENCIES_VERIFIED`, `NO_DATABASE_READS_VERIFIED`, `NO_ENGINE_CONSUMERS_VERIFIED` — all valid.

---

### LOGAN — `Logan/Logan.md`

**Insertion point:** Workflow Phase A.1 inserted between Phase A (Locate Relevant Docs) and Phase B (Read Documentation).

**Completeness checks added:**

| Artifact | Block condition |
|----------|----------------|
| `ARCHITECTURE.md` | THIN or MISSING → `LOGAN BLOCKED` |
| `CURRENT_STATUS.md §ARCHITECT` | MISSING → `LOGAN PARTIAL` (degraded mode, not hard block) |

**Tags introduced:** `ARCHITECT_ARTIFACT_INCOMPLETE: ARCHITECTURE_THIN`

**Degraded mode:** `LOGAN PARTIAL` is emitted when `CURRENT_STATUS.md §ARCHITECT` is absent — drift detection proceeds but ARCHITECT provenance cannot be confirmed.

---

### KRAVEN — `kraven/04-analysis-workflow.md`

**Insertion point:** Before Step 1 — runs as a mandatory pre-analysis check.

**Completeness checks added:**

| Artifact | Block condition |
|----------|----------------|
| `database-read-map.md` | EMPTY or MISSING (without EXPLICIT_NONE) → `KRAVEN BLOCKED` |
| `feature-map.md` | EMPTY, THIN, or MISSING (without EXPLICIT_NONE) → `KRAVEN BLOCKED` |
| `dependency-map.md` | EMPTY or MISSING (without EXPLICIT_NONE) → WARN |

**Tags introduced:** `ARCHITECT_ARTIFACT_INCOMPLETE: DATABASE_READ_MAP_EMPTY`, `ARCHITECT_ARTIFACT_INCOMPLETE: FEATURE_MAP_EMPTY`

**Risk addressed:** Without `database-read-map.md`, N+1 and duplicate-read detection have no DAL baseline — findings would be scope-free.

---

### HAWKEYE — `hawkeye/02-endpoint-trace.md`

**Insertion point:** After ARCHITECT Route Map Preflight block, before Endpoint Trace Identity section.

**Completeness checks added:**

| Artifact | Block condition |
|----------|----------------|
| `routes.graph.json` | EMPTY or MISSING (without EXPLICIT_NONE) → `HAWKEYE BLOCKED` |
| `feature-map.md` | No route inventory and no EXPLICIT_NONE → `HAWKEYE BLOCKED` |

**Tags introduced:** `ARCHITECT_ARTIFACT_INCOMPLETE: ROUTES_GRAPH_EMPTY`, `ARCHITECT_ARTIFACT_INCOMPLETE: FEATURE_MAP_EMPTY`

**EXPLICIT_NONE exception:** `NO_ROUTES_VERIFIED` written by ARCHITECT is valid — HAWKEYE proceeds with user-provided endpoint list only, with an explicit warning.

---

### IRONMAN — `Ironman/02-ownership-discovery.md`

**Insertion point:** Before Step 1 — as a mandatory preflight for the entire discovery workflow.

**Completeness checks added:**

| Artifact | Block condition |
|----------|----------------|
| `ARCHITECTURE.md` | THIN or MISSING → `IRONMAN BLOCKED` |
| `feature-map.md` | EMPTY, THIN, or MISSING (without EXPLICIT_NONE) → `IRONMAN BLOCKED` |
| `dependency-map.md` | EMPTY or MISSING (without EXPLICIT_NONE) → WARN |

**Tags introduced:** `ARCHITECT_ARTIFACT_INCOMPLETE: ARCHITECTURE_THIN`, `ARCHITECT_ARTIFACT_INCOMPLETE: FEATURE_MAP_EMPTY`

**EXPLICIT_NONE exception:** `NO_DEPENDENCIES_VERIFIED` is valid — Step 4 proceeds with a note.

---

### LOKI — `loki/08-runtime-workflow.md`

**Insertion point:** Inside Step 1, after artifact loading statements, before the required output block.

**Completeness checks added:**

| Artifact | Block condition |
|----------|----------------|
| `feature-map.md` | EMPTY, THIN, or MISSING (without EXPLICIT_NONE) → `LOKI BLOCKED` |
| `database-read-map.md` | EMPTY or MISSING (without EXPLICIT_NONE) → `LOKI PARTIAL` (degraded, not hard block) |

**Tags introduced:** `ARCHITECT_ARTIFACT_INCOMPLETE: FEATURE_MAP_EMPTY`, `ARCHITECT_ARTIFACT_INCOMPLETE: DATABASE_READ_MAP_EMPTY`

**Degraded mode:** `LOKI PARTIAL` is emitted for empty `database-read-map.md` — Step 5 duplicate-read detection proceeds as INFERRED evidence only. This matches LOKI's design intent (runtime observation can proceed without a DAL map, but with reduced confidence).

---

### SPIDER-MAN — `SPIDER-MAN/09-scanner-integration.md`

**Insertion point:** After "ARCHITECT Module Inventory Required First" section, before scanner map loading.

**Completeness checks added:**

| Artifact | Block condition |
|----------|----------------|
| `feature-map.md` | EMPTY, THIN, or MISSING (without EXPLICIT_NONE) → `SPIDER-MAN BLOCKED` |
| `ARCHITECTURE.md` | THIN or MISSING → `SPIDER-MAN BLOCKED` |
| `BEHAVIOR.md` | MISSING → `SPIDER-MAN PARTIAL` (degraded — coverage capped at SOURCE_COVERED) |

**Tags introduced:** `ARCHITECT_ARTIFACT_INCOMPLETE: FEATURE_MAP_EMPTY`, `ARCHITECT_ARTIFACT_INCOMPLETE: ARCHITECTURE_THIN`

**Degraded mode:** `SPIDER-MAN PARTIAL` is emitted when `BEHAVIOR.md` is MISSING — BEHAVIOR_COVERED tier is unavailable but SOURCE_COVERED coverage analysis proceeds.

---

## Completeness Checks Added — Full Matrix

| Command | dependency-map | feature-map | database-read-map | ARCHITECTURE.md | routes.graph.json | engine-consumer-map | BEHAVIOR.md | CURRENT_STATUS §ARCHITECT |
|---------|:--------------:|:-----------:|:-----------------:|:---------------:|:-----------------:|:-------------------:|:-----------:|:-------------------------:|
| THOR | BLOCK | BLOCK | — | BLOCK | — | — | — | — |
| SENTRY | BLOCK | BLOCK | — | BLOCK | — | — | — | — |
| CARNAGE | BLOCK | — | BLOCK | WARN | — | WARN | — | — |
| LOGAN | — | — | — | BLOCK | — | — | — | PARTIAL |
| KRAVEN | WARN | BLOCK | BLOCK | — | — | — | — | — |
| HAWKEYE | — | BLOCK | — | — | BLOCK | — | — | — |
| IRONMAN | WARN | BLOCK | — | BLOCK | — | — | — | — |
| LOKI | — | BLOCK | PARTIAL | — | — | — | — | — |
| SPIDER-MAN | — | BLOCK | — | BLOCK | — | — | PARTIAL | — |

BLOCK = hard block, command halts
PARTIAL = degraded mode, command continues with explicit warning
WARN = soft warning in output table
— = artifact not consumed by this command

---

## Block Conditions Added

| Tag | Meaning | Commands Enforcing |
|-----|---------|-------------------|
| `ARCHITECT_ARTIFACT_INCOMPLETE: DEPENDENCY_MAP_EMPTY` | dependency-map.md has no edges and no EXPLICIT_NONE | THOR, SENTRY, CARNAGE |
| `ARCHITECT_ARTIFACT_INCOMPLETE: FEATURE_MAP_EMPTY` | feature-map.md has no module inventory and no EXPLICIT_NONE | THOR, SENTRY, KRAVEN, HAWKEYE, IRONMAN, LOKI, SPIDER-MAN |
| `ARCHITECT_ARTIFACT_INCOMPLETE: DATABASE_READ_MAP_EMPTY` | database-read-map.md has no DAL entries and no EXPLICIT_NONE | CARNAGE, KRAVEN, LOKI |
| `ARCHITECT_ARTIFACT_INCOMPLETE: ARCHITECTURE_THIN` | ARCHITECTURE.md exists but is missing required sections | THOR, SENTRY, IRONMAN, SPIDER-MAN, LOGAN |
| `ARCHITECT_ARTIFACT_INCOMPLETE: ROUTES_GRAPH_EMPTY` | routes.graph.json has no route nodes and no EXPLICIT_NONE | HAWKEYE |
| `ARCHITECT_EXPLICIT_NONE` | ARCHITECT explicitly stated nothing found (valid zero-result) | All commands (exception path) |

---

## Commands Still Partial

| Command | Why Partial | Risk |
|---------|-------------|------|
| **LOKI** | `database-read-map.md` triggers PARTIAL (not BLOCK) — runtime observation can proceed without a DAL baseline | Duplicate-read detection in Step 5 is INFERRED evidence only; findings require source verification before HIGH severity |
| **LOGAN** | `CURRENT_STATUS.md §ARCHITECT` triggers PARTIAL — drift detection proceeds but without ARCHITECT provenance | Drift findings lack evidence linkage; acceptable since CURRENT_STATUS is metadata, not the primary baseline |
| **SPIDER-MAN** | `BEHAVIOR.md` MISSING triggers PARTIAL — coverage analysis proceeds at SOURCE_COVERED tier only | Cannot emit BEHAVIOR_COVERED findings until BEHAVIOR.md is created; this is expected during early feature development |
| **CARNAGE** | `engine-consumer-map.md` is WARN (not BLOCK) — blast radius proceeds without engine consumer data | Engine consumer blast radius is unknown; migration plan may understate impact for engine-touching tables |

---

## Remaining Risks

### 1. Content Quality is Not Validated (by Design)

These checks validate that artifacts are non-empty and contain required sections — they do not validate that the content is correct or accurate. A `feature-map.md` that lists one module where 20 exist will pass the completeness check. Full content correctness requires ARCHITECT re-run, not completeness gates.

**This is acceptable.** The gates protect against the most dangerous case (empty = false-clean reports). Partial content produces partial findings rather than false-clean ones.

### 2. EXPLICIT_NONE Must Be Written by ARCHITECT

The `ARCHITECT_EXPLICIT_NONE` exception requires that the explicit-none statement was written by ARCHITECT during a run. If a developer manually creates an artifact file with placeholder content but not the explicit-none marker, the completeness gate will block as if it were EMPTY. This is the correct behavior — only ARCHITECT-authored explicit-none statements are valid.

### 3. CARNAGE engine-consumer-map is WARN Only

`engine-consumer-map.md` absent does not block CARNAGE. Migration blast radius may understate engine impact. This is a deliberate tradeoff — engine consumers are typically discovered via dependency-map (which IS a hard block). The warn flag surfaces the gap without halting migrations where the engine-consumer-map simply hasn't been generated yet.

### 4. Completeness Gate Does Not Apply to V2 Security Commands

VENOM, BLACKWIDOW, and ELEKTRA already have hard blocks on `evidence-bundle.json` and `architect-security-surface.json`. These blocks are content-aware (they check `generatedAt` and file structure via their Evidence Bundle Gate). Adding duplicate completeness checks to those commands was out of scope for this ticket — they are already the most defensively wired commands in the system.

---

*Report generated: 2026-06-05*
*Ticket: TICKET-ARCHITECT-ARTIFACT-COMPLETENESS-GATE-0001*
*Files updated: 9*
