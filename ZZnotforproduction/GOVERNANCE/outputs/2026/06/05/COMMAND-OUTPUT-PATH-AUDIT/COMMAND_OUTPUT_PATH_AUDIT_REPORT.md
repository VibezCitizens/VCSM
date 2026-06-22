# Command Output Path Audit
**Ticket:** TICKET-COMMAND-OUTPUT-PATH-AUDIT-0001
**Date:** 2026-06-05
**Scope:** All commands in `.claude/commands/`
**Authority:** READ ONLY — No files modified

---

## Summary

| Command | Declared Output Root | Scope-Aware? | Classification | Notes |
|---|---|---|---|---|
| WOLVERINE | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/WOLVERINE/` | YES — global orchestrator | OUTPUT_COMPLIANT | Global scope correct for orchestrator; but feature-specific plans lack feature routing |
| ARCHITECT | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/ARCHITECT/` | YES — global repo map | OUTPUT_COMPLIANT | Repo-wide scope; global path appropriate |
| VENOM | `ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/Venom/` | YES | OUTPUT_COMPLIANT | Correct feature-scope path |
| BLACKWIDOW | `ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/BlackWidow/` | YES | OUTPUT_COMPLIANT | Correct feature-scope path |
| ELEKTRA | `ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/ELEKTRA/` | YES | OUTPUT_COMPLIANT | Correct feature-scope path |
| SENTRY | `ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/Sentry/` | YES | OUTPUT_COMPLIANT | Correct feature-scope path |
| IRONMAN | `ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/IRONMAN/` | YES | OUTPUT_COMPLIANT | Correct feature-scope path |
| SPIDER-MAN | `ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/SPIDER-MAN/` | YES | OUTPUT_COMPLIANT | Correct feature-scope path |
| KRAVEN | `ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/KRAVEN/` | YES | OUTPUT_COMPLIANT | Correct feature-scope path |
| THOR | `ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/Thor/` | YES | OUTPUT_COMPLIANT | Correct feature-scope path |
| WATCHER | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/WATCHER/` | YES — session/global | OUTPUT_COMPLIANT | Change detection is session-scoped; global path correct |
| CARNAGE | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/Carnage/` | PARTIAL | OUTPUT_PARTIAL | Migration plans are feature-targeted but path is global; Write 2 does update feature folder |
| HAWKEYE | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/HAWKEYE/` | NO — verifies feature APIs | OUTPUT_DRIFT | Feature-level endpoint audits written to global governance path |
| LOKI | `CURRENT/outputs/{YYYY}/{MM}/{DD}/Loki/` | NO — LEGACY PATH | OUTPUT_DRIFT | Uses old `CURRENT/` root; should be feature-scoped |
| VISION | `CURRENT/outputs/{YYYY}/{MM}/{DD}/VISION/` | NO — LEGACY PATH | OUTPUT_DRIFT | Uses old `CURRENT/` root |
| AVENGERSASSEMBLE | `CURRENT/outputs/{YYYY}/{MM}/{DD}/AVENGERSASSEMBLE/` | NO — LEGACY PATH | OUTPUT_DRIFT | Uses old `CURRENT/` root; should be `ZZnotforproduction/GOVERNANCE/` |
| NickFury | `CURRENT/outputs/{YYYY}/{MM}/{DD}/WOLVERINE/` and `CURRENT/outputs/{YYYY}/{MM}/{DD}/NickFury/` | NO — LEGACY PATH | OUTPUT_DRIFT | Uses old `CURRENT/` root for both planning and doc outputs |
| CAPTAIN | `CURRENT/outputs/{YYYY}/{MM}/{DD}/CAPTAIN/` | NO — LEGACY PATH | OUTPUT_DRIFT | Uses old `CURRENT/` root |
| ProfessorX | `CURRENT/outputs/YYYY/MM/DD/ProfessorX/` | NO — LEGACY PATH | OUTPUT_DRIFT | Uses old `CURRENT/` root |
| SHIELD | `zNOTFORPRODUCTION/CURRENT/outputs/{YYYY}/{MM}/{DD}/SHIELD/` | NO — WRONG ROOT | OUTPUT_DRIFT | Uses legacy `zNOTFORPRODUCTION/CURRENT/` root (both wrong casing AND legacy) |
| DR. STRANGE | Contradictory: §16.1 = `CURRENT/outputs/...`; §16.6 write boundary = `ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/dr-strange/` | CONTRADICTORY | OUTPUT_DRIFT | Primary path spec uses legacy CURRENT/; write boundary spec uses correct ZZnotforproduction path; two rules conflict |
| GREENGOBLIN | `ZZnotforproduction/APPS/VCSM/outputs/{YYYY}/{MM}/{DD}/GREENGOBLIN/` | NO — missing `features/[feature]/` | OUTPUT_DRIFT | Correct root but missing feature folder segment |
| review-contract | `ZZnotforproduction/APPS/VCSM/outputs/{YYYY}/{MM}/{DD}/review-contract/` | NO — missing `features/[feature]/` | OUTPUT_DRIFT | Correct root but missing feature folder segment; inconsistent with SENTRY which declares same path but with features/[feature]/ |
| DB | `ZZnotforproduction/outputs/{YYYY}/{MM}/{DD}/DB/` | NO — missing `GOVERNANCE/` | OUTPUT_DRIFT | Root path is malformed; missing `GOVERNANCE/` segment |
| DataEngineer | `ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/DataEngineer/` | PARTIAL | OUTPUT_PARTIAL | Correct root but missing date path segment `{YYYY}/{MM}/{DD}/`; reports undated |
| Logan | No standalone audit output path declared | N/A | OUTPUT_UNKNOWN | Logan updates canonical docs in-place; no separate audit trail output path defined |
| Deadpool | No persistent file output declared | N/A | OUTPUT_UNKNOWN | Resolution summary is screen-only output; no audit file written |
| WinterSoldier | No explicit output path found in any sub-file | N/A | OUTPUT_UNKNOWN | Mission scope and release gate sub-files contain no persistent output path |
| Falcon | No explicit output path found in any sub-file | N/A | OUTPUT_UNKNOWN | Safety output sub-file (09) contains format spec only, no output path |
| ticket | No persistent output (in-chat thread only) | N/A | OUTPUT_UNKNOWN | By design — tickets are in-conversation, no file written |
| session-summary | `zNOTFORPRODUCTION/_HISTORY/session-summaries/YYYY-MM/` | N/A — session-scoped | OUTPUT_COMPLIANT | Special scope: session-level, not feature-level; correct by design per DR. STRANGE §10.3 |

---

## Wolverine Special Finding

### 1. The Specific Out-of-Feature-Scope Write

Wolverine does not write any file to the wrong path — it consistently writes to the GOVERNANCE scope. The "outside feature folder" issue the ticket references is that **Wolverine writes feature-specific planning documents (approval trackers, master audit files, planning files) into the GOVERNANCE root** rather than into the target feature's output folder.

Example: if Wolverine orchestrates a VENOM + SENTRY + SPIDER-MAN sprint against `booking`, all orchestration artifacts live at:

```
ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/WOLVERINE/
  DD-approval-tracker.md        ← describes booking feature specifically
  YYYY-MM-DD_booking-sprint.audit.md   ← booking audit, in GOVERNANCE
  CHANGE_INTENT.md              ← global (correct)
  .tp-lock / .tp-active / .tp-ready   ← global queue (correct)
```

The approval tracker and master audit file are entirely feature-scoped in content but live in the global governance path.

### 2. The Rule That Caused It

`wolverine/02-planning-system.md` §6 declares:

```
WOLVERINE uses the planning root:
ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/WOLVERINE/
```

This is a single universal root with no feature-scope variant. All files — global or feature-specific — write to this same path.

### 3. What Wolverine Should Write Where

| File Type | Current Path | Correct Path |
|---|---|---|
| Global planning file (`DD-NN.md`) | `GOVERNANCE/.../WOLVERINE/` | Keep in GOVERNANCE — correct |
| Queue files (`.tp-*`) | `GOVERNANCE/.../WOLVERINE/` | Keep in GOVERNANCE — correct |
| Lock file (`.tp-lock`) | `GOVERNANCE/.../WOLVERINE/` | Keep in GOVERNANCE — correct |
| CHANGE_INTENT.md | `GOVERNANCE/.../WOLVERINE/` | Keep in GOVERNANCE — correct (cross-feature ledger) |
| Approval tracker (feature-specific) | `GOVERNANCE/.../WOLVERINE/` | **Should be in `features/[feature]/outputs/{YYYY}/{MM}/{DD}/WOLVERINE/`** |
| Master audit file (feature-specific) | `GOVERNANCE/.../WOLVERINE/` | **Should be in `features/[feature]/outputs/{YYYY}/{MM}/{DD}/WOLVERINE/`** |

### 4. Recommendation

Wolverine should support a **dual-root model**:

```
Feature output (when task targets a named feature):
ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/WOLVERINE/
  approval-tracker.md
  YYYY-MM-DD_<task-slug>.audit.md

Global output (always, regardless of feature scope):
ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/WOLVERINE/
  DD-NN.md           ← planning file (daily sequence)
  .tp-lock / .tp-*   ← queue and lock
  CHANGE_INTENT.md   ← cross-session intent ledger
```

Cross-feature or scope-unknown tasks continue to write everything to GOVERNANCE.

---

## Output Drift Findings

---

### DRIFT-001

```
Command:        LOKI
Declared Path:  CURRENT/outputs/{YYYY}/{MM}/{DD}/Loki/
Expected Path:  ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/Loki/
Scope:          Feature (runtime trace is feature-specific)
Risk:           Reports written to legacy CURRENT/ root that no longer exists; reports are unlocatable under new ZZnotforproduction/ structure
Recommended Fix: Update loki/08-runtime-workflow.md §18 to use ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/Loki/
```

---

### DRIFT-002

```
Command:        VISION
Declared Path:  CURRENT/outputs/{YYYY}/{MM}/{DD}/VISION/
Expected Path:  ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/VISION/
              OR ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/VISION/
Scope:          Ambiguous — analytics can be cross-feature (global) or feature-specific
Risk:           Reports written to legacy root; lost under new structure
Recommended Fix: Update Vision/Vision.md §10 to use ZZnotforproduction/GOVERNANCE/outputs/ for full-platform analytics runs; feature-scoped path for feature-targeted runs
```

---

### DRIFT-003

```
Command:        AVENGERSASSEMBLE
Declared Path:  CURRENT/outputs/{YYYY}/{MM}/{DD}/AVENGERSASSEMBLE/
Expected Path:  ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/AVENGERSASSEMBLE/
Scope:          Global pre-release assembly — correctly governance-scoped, wrong root
Risk:           Reports written to legacy CURRENT/ root
Recommended Fix: Update avengersassemble/07-output-format.md §2 to use ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/AVENGERSASSEMBLE/
```

---

### DRIFT-004

```
Command:        NickFury
Declared Paths: CURRENT/outputs/{YYYY}/{MM}/{DD}/WOLVERINE/ (planning)
                CURRENT/outputs/{YYYY}/{MM}/{DD}/NickFury/ (docs)
Expected Paths: ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/WOLVERINE/ (planning)
                ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/NickFury/ (docs)
Scope:          Global parallel orchestrator — governance scope correct, root wrong
Risk:           All NickFury planning and doc files unlocatable under new structure
Recommended Fix: Update NickFury/07-planning-file.md §1 to use ZZnotforproduction/GOVERNANCE/outputs/
```

---

### DRIFT-005

```
Command:        CAPTAIN
Declared Path:  CURRENT/outputs/{YYYY}/{MM}/{DD}/CAPTAIN/
Expected Path:  ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/CAPTAIN/
Scope:          Session/global idea capture — correctly governance-scoped, wrong root
Risk:           Captain logs written to legacy root; session continuity broken
Recommended Fix: Update captain/captain.md to use ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/CAPTAIN/
```

---

### DRIFT-006

```
Command:        ProfessorX
Declared Path:  CURRENT/outputs/YYYY/MM/DD/ProfessorX/
Expected Path:  ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/ProfessorX/
Scope:          Feature behavior compliance — feature-scoped
Risk:           Behavior compliance reports written to legacy root; unlocatable
Recommended Fix: Update ProfessorX/ProfessorX.md and ProfessorX/07-output-format.md to use ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/ProfessorX/
```

---

### DRIFT-007

```
Command:        SHIELD
Declared Path:  zNOTFORPRODUCTION/CURRENT/outputs/{YYYY}/{MM}/{DD}/SHIELD/
Expected Path:  ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/SHIELD/
Scope:          IP/license review — global scope; governance path appropriate
Risk:           WRONG ROOT — uses legacy lowercase zNOTFORPRODUCTION/CURRENT/ path (both root name and CURRENT/ are wrong)
Recommended Fix: Update Shield/08-report-format.md §18 to use ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/SHIELD/
```

---

### DRIFT-008

```
Command:        DR. STRANGE
Declared Path (§16.1):         CURRENT/outputs/YYYY/MM/DD/dr-strange/
Write Boundary (§16.6):        ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/dr-strange/
Expected Path:                 ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/dr-strange/
Scope:                         Feature status oracle — feature-scoped
Risk:           INTERNAL CONTRADICTION — §16.1 specifies legacy CURRENT/ path; §16.6 specifies correct ZZnotforproduction path.
                Runtime behavior is ambiguous; model may follow §16.1 (wrong) over §16.6 (correct).
                DR. STRANGE output reference inside its own report (§16.3 Output file field) also uses CURRENT/ path.
Recommended Fix: Update dr.strange/08-output-formats.md §16.1, §16.2, §16.3 Output file field, and §16.5 INDEX.md path to all use
                 ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/dr-strange/
                 Remove the CURRENT/ reference entirely from DR. STRANGE.
```

---

### DRIFT-009

```
Command:        GREENGOBLIN
Declared Path:  ZZnotforproduction/APPS/VCSM/outputs/{YYYY}/{MM}/{DD}/GREENGOBLIN/
Expected Path:  ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/GREENGOBLIN/
                OR ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/GREENGOBLIN/
Scope:          Evidence/claim validation — can be feature-scoped when validating a command's feature output
Risk:           Missing features/[feature]/ segment makes path ambiguous; reports written to app-level folder
Recommended Fix: Update GREENGOBLIN/07-persistent-output.md §1 to use
                 ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/GREENGOBLIN/ for feature-scoped runs
                 ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/GREENGOBLIN/ for global validation runs
```

---

### DRIFT-010

```
Command:        review-contract
Declared Path:  ZZnotforproduction/APPS/VCSM/outputs/{YYYY}/{MM}/{DD}/review-contract/
Expected Path:  ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/review-contract/
Scope:          Architecture contract compliance — feature-scoped
Risk:           Missing features/[feature]/ segment; also CONTRADICTS SENTRY which declares "review-contract shares this output path" pointing to the SENTRY feature path
               SENTRY path = ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/Sentry/
               review-contract path = ZZnotforproduction/APPS/VCSM/outputs/{YYYY}/{MM}/{DD}/review-contract/
               These are DIFFERENT directories — cross-file sharing rule in SENTRY is broken.
Recommended Fix: Update review-contract/10-persistent-output.md to use
                 ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/review-contract/
                 This aligns with SENTRY's declared shared path and satisfies the feature-scope contract.
```

---

### DRIFT-011

```
Command:        DB
Declared Path:  ZZnotforproduction/outputs/{YYYY}/{MM}/{DD}/DB/
Expected Path:  ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/DB/
Scope:          Database analysis — global/governance (cross-feature DB queries)
Risk:           MALFORMED ROOT — missing GOVERNANCE/ segment; path resolves to repo root folder
               ZZnotforproduction/outputs/ does not exist; reports would be written to wrong directory
Recommended Fix: Update DB/06-persistent-output.md to use ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/DB/
```

---

### DRIFT-012

```
Command:        HAWKEYE
Declared Path:  ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/HAWKEYE/
Expected Path:  ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/HAWKEYE/
Scope:          Endpoint/API contract verification — feature-scoped when targeting a specific feature's endpoints
Risk:           Feature-specific API audits are written to global governance path; not co-located with other feature governance files
Note:           HAWKEYE may legitimately be global when auditing cross-feature or platform-wide endpoints.
                Classification depends on invocation scope. Consider a dual-root model (same as WOLVERINE recommendation).
Recommended Fix: Add feature-scope output mode:
                 - Feature run: ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/HAWKEYE/
                 - Global run:  ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/HAWKEYE/
```

---

### DRIFT-013

```
Command:        DR. STRANGE (§07 output routing contract)
Declared Path:  CURRENT/outputs/YYYY/MM/DD/[COMMAND]/ (for primary output of ALL commands)
Expected Path:  (varies per command)
Scope:          DR. STRANGE §07 documents the output routing contract for all commands
Risk:           DR. STRANGE §07 uses the old CURRENT/ path in its Examples section and §10.1 / §12 documentation.
               These are the paths DR. STRANGE checks when detecting contract violations — if it's checking CURRENT/ paths,
               it will miss violations in the correct ZZnotforproduction/ structure.
Recommended Fix: Update dr.strange/07-output-routing-contract.md §10.1, §10.2, §12 examples to reference
                 ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/[COMMAND]/ as the canonical primary output path.
```

---

## Legacy Path Findings

All commands using `CURRENT/` as a root are referencing the pre-migration path. The migration was completed on 2026-06-04 (see memory: Docs Root Migration). The new root is `ZZnotforproduction/`.

| Command | Legacy Path Used |
|---|---|
| LOKI | `CURRENT/outputs/{YYYY}/{MM}/{DD}/Loki/` |
| VISION | `CURRENT/outputs/{YYYY}/{MM}/{DD}/VISION/` |
| AVENGERSASSEMBLE | `CURRENT/outputs/{YYYY}/{MM}/{DD}/AVENGERSASSEMBLE/` |
| NickFury | `CURRENT/outputs/{YYYY}/{MM}/{DD}/WOLVERINE/` and `/NickFury/` |
| CAPTAIN | `CURRENT/outputs/{YYYY}/{MM}/{DD}/CAPTAIN/` |
| ProfessorX | `CURRENT/outputs/YYYY/MM/DD/ProfessorX/` |
| SHIELD | `zNOTFORPRODUCTION/CURRENT/outputs/{YYYY}/{MM}/{DD}/SHIELD/` |
| DR. STRANGE | `CURRENT/outputs/YYYY/MM/DD/dr-strange/` in §16.1 and §07 |

These 8 commands all reference a `CURRENT/` root that was superseded by the 2026-06-04 docs root migration. None of their output paths are reachable under the current `ZZnotforproduction/` structure.

---

## Missing Output Rule Findings

| Command | Finding |
|---|---|
| Logan | No persistent audit output path declared. Logan updates canonical docs in-place but produces no standalone dated audit report. If Logan ever needs to produce a review audit, there is no declared output path. |
| Deadpool | No persistent output path declared. The BUG RESOLUTION SUMMARY is screen-only. No audit file is written. |
| Falcon | No persistent output path found in any sub-file. The safety output sub-file (09) specifies the report FORMAT only. |
| WinterSoldier | No persistent output path found in any sub-file (0–11 reviewed). Output path is OUTPUT_UNKNOWN. |
| DataEngineer | Path declared but missing the date segment: `ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/DataEngineer/` — should be `features/[feature]/outputs/{YYYY}/{MM}/{DD}/DataEngineer/`. Without date segmentation, multiple reports overwrite each other. |

---

## Recommended Output Contract

```
OUTPUT PATH RESOLUTION RULE

If scope = feature:
  write under:
  ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/[COMMAND]/

If scope = module:
  write under:
  ZZnotforproduction/APPS/VCSM/features/[feature]/modules/[module]/outputs/{YYYY}/{MM}/{DD}/[COMMAND]/

If scope = engine:
  write under:
  ZZnotforproduction/ENGINES/[engine]/outputs/{YYYY}/{MM}/{DD}/[COMMAND]/

If scope = global/governance:
  write under:
  ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/[COMMAND]/

If scope = contract/system-wide audit:
  write under:
  ZZnotforproduction/CONTRACTS/outputs/{YYYY}/{MM}/{DD}/[COMMAND]/

A command may only write outside the resolved scope when:
  1. explicitly declared global/system scope in the command definition
  2. the boundary contract allows it
  3. the output report names the cross-scope write

Scope Resolution Rules:
  - Commands that target a named feature → feature scope
  - Commands that map the full repo → governance scope
  - Commands that govern multiple features simultaneously → governance scope
  - Commands that audit session-level changes (not feature-specific) → governance scope
  - Commands that audit per-feature security, architecture, ownership, performance, behavior → feature scope
```

---

## Commands Requiring Update

| Priority | Command | Required Change |
|---|---|---|
| P0 | DB | Fix malformed root: `ZZnotforproduction/outputs/` → `ZZnotforproduction/GOVERNANCE/outputs/` |
| P0 | DR. STRANGE | Resolve internal contradiction between §16.1 (CURRENT/) and §16.6 (ZZnotforproduction/); standardize on §16.6 path throughout §16.1, §16.2, §16.3, §16.5, and §07 examples |
| P0 | SHIELD | Fix wrong root: `zNOTFORPRODUCTION/CURRENT/` → `ZZnotforproduction/GOVERNANCE/` |
| P1 | LOKI | Migrate from `CURRENT/` to `ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/Loki/` |
| P1 | VISION | Migrate from `CURRENT/` to `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/VISION/` (or feature-scoped variant) |
| P1 | AVENGERSASSEMBLE | Migrate from `CURRENT/` to `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/AVENGERSASSEMBLE/` |
| P1 | NickFury | Migrate from `CURRENT/` to `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/` for both planning and doc paths |
| P1 | CAPTAIN | Migrate from `CURRENT/` to `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/CAPTAIN/` |
| P1 | ProfessorX | Migrate from `CURRENT/` to `ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/ProfessorX/` |
| P1 | review-contract | Fix missing `features/[feature]/` segment; align with SENTRY shared-path declaration |
| P1 | GREENGOBLIN | Fix missing `features/[feature]/` segment; add dual-root mode (feature vs global) |
| P2 | HAWKEYE | Add feature-scope output mode for feature-targeted endpoint audits |
| P2 | DataEngineer | Add date segment `{YYYY}/{MM}/{DD}/` to output path to prevent report overwrites |
| P2 | WOLVERINE | Add feature-scope routing for approval trackers and master audit files when task targets a named feature |
| P2 | CARNAGE | Evaluate moving primary output to feature scope; currently GOVERNANCE but migration plans are feature-targeted |
| P3 | Falcon | Declare a persistent output path for Falcon parity reports |
| P3 | WinterSoldier | Declare a persistent output path for WinterSoldier release reports |
| P3 | Logan | Declare a persistent audit output path if Logan review reports should be independently traceable |
| P3 | Deadpool | Evaluate whether BUG RESOLUTION SUMMARY should write a file (currently screen-only) |

---

## Count Summary

```
OUTPUT_COMPLIANT:   11 commands
OUTPUT_PARTIAL:      2 commands (DataEngineer, CARNAGE)
OUTPUT_DRIFT:       13 commands (HAWKEYE, LOKI, VISION, AVENGERSASSEMBLE, NickFury, CAPTAIN, ProfessorX,
                                  SHIELD, DR. STRANGE, GREENGOBLIN, review-contract, DB, DR.STRANGE §07)
OUTPUT_UNKNOWN:      5 commands (WinterSoldier, Falcon, Logan, Deadpool, ticket)
```

P0 Fixes Required: 3 (DB root malformed, SHIELD wrong root, DR. STRANGE internal contradiction)
P1 Fixes Required: 8 (all legacy CURRENT/ path commands plus review-contract and GREENGOBLIN)
P2 Fixes Required: 5 (HAWKEYE, DataEngineer, WOLVERINE, CARNAGE evaluation, DR. STRANGE §07)
P3 Fixes Required: 4 (missing output paths for Falcon, WinterSoldier, Logan, Deadpool)

---

## Evidence Sources

All findings derived from reading command definition files under `.claude/commands/` only.
No source code modified. No governance files modified.
