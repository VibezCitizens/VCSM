# TICKET-COMMAND-OUTPUT-CONTRACT-0001
## Command Output Six-Dimension Path Contract Map

**Date:** 2026-06-05  
**Scope:** All `.claude/commands/` definitions + filesystem verification  
**Status:** Complete — READ ONLY. No file modifications made.

---

## Dimension Definitions

| # | Dimension | Meaning |
|---|---|---|
| 1 | **Actual** | Files physically found on disk (filesystem scan) |
| 2 | **Declared** | Output path stated in command definition files |
| 3 | **Referenced** | Path other commands use when reading this command's output |
| 4 | **Read** | What this command reads as input |
| 5 | **Write** | Where this command writes (Write 1 = dated output; Write 2 = in-place domain files) |
| 6 | **Downstream Consumer** | What consuming commands expect to find and where |

---

## Path Notation

- **FEATURE** = `ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/[CMD]/`
- **GOVERNANCE** = `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/[CMD]/`
- **CONTRACTS** = `ZZnotforproduction/CONTRACTS/outputs/{YYYY}/{MM}/{DD}/[CMD]/`
- **LEGACY** = `CURRENT/outputs/{YYYY}/{MM}/{DD}/[CMD]/` (path does NOT exist on disk)
- **WRONG-ROOT** = `zNOTFORPRODUCTION/...` (lowercase root does NOT exist on disk)
- **MALFORMED** = `ZZnotforproduction/outputs/...` (missing GOVERNANCE segment)
- **MISSING-FEATURE** = `ZZnotforproduction/APPS/VCSM/outputs/...` (missing `features/[feature]/`)
- **MISSING-DATE** = `ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/[CMD]/` (no date segment)

---

## Compliance Legend

| Symbol | Meaning |
|---|---|
| ✓ | Path correct and consistent |
| DRIFT | Actual path diverges from declared path |
| LEGACY | Declared path uses `CURRENT/` (non-existent) |
| BROKEN | Declared path resolves to non-existent directory root |
| INTERNAL-CONFLICT | Command's own files contradict each other |
| NO-DECLARE | Command has no output file path declared |
| MISSING | No actual files found on disk |

---

## Full Six-Dimension Map

---

### WOLVERINE

| Dimension | Path | Status |
|---|---|---|
| 1. Actual | `features/dashboard/outputs/2026/06/05/WOLVERINE/` (task approval trackers, planning files) | DRIFT |
| 2. Declared | `GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/WOLVERINE/` (02-planning-system.md, 08-approval-tracker.md) | — |
| 3. Referenced | `GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/WOLVERINE/` (session-summary, Logan 01, Logan 03, Deadpool 04) | — |
| 4. Read | Feature scope files (`features/[feature]/`), queue files at GOVERNANCE path | — |
| 5. Write 1 | Declared: GOVERNANCE; Actual observed: FEATURE (task approval trackers) | DRIFT |
| 5. Write 2 | Queue: `.tp-incoming.md`, `.tp-ready.md`, `.tp-active.md`, `.tp-backlog.md`, `.tp-lock` at GOVERNANCE ✓ | — |
| 5. Write 2 | `GOVERNANCE/.../WOLVERINE/CHANGE_INTENT.md` ✓ (09-change-intent.md) | — |
| 6. Downstream | session-summary, Logan, Deadpool reference GOVERNANCE path — but actual files are at FEATURE | MISMATCH |

**Finding:** Wolverine task-specific output (approval trackers, per-task audit files) is landing at FEATURE scope on disk. Its declared single root (GOVERNANCE) does not capture this. Wolverine legitimately needs DUAL paths: GOVERNANCE for queue/global ledger, FEATURE for per-task output. Neither the declaration nor the consumers reflect this split.

---

### ARCHITECT

| Dimension | Path | Status |
|---|---|---|
| 1. Actual | `GOVERNANCE/outputs/2026/06/05/ARCHITECT/` (global maps) AND `features/[module]/outputs/2026/06/04/ARCHITECT/` (module-scope runs) | DRIFT (partial) |
| 2. Declared | `GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/ARCHITECT/` (01-global-repo-map.md) | — |
| 3. Referenced | `GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/ARCHITECT/` — ALL consuming commands reference GOVERNANCE path | ✓ |
| 4. Read | Source code files across all apps/engines | — |
| 5. Write 1 | GOVERNANCE (global run) + FEATURE (Wolverine module-scope run) | DRIFT (module) |
| 5. Write 2 | `features/[feature]/ARCHITECTURE.md`, `features/[feature]/INDEX.md`, `features/[feature]/CURRENT_STATUS.md` (ARCHITECT.md §7) | ✓ |
| 5. Write 3 | `features/[feature]/outputs/[YYYY]/[MM]/[DD]/ARCHITECT/evidence-bundle.json` (ARCHITECT.md §7 Write 3) | ✓ |
| 6. Downstream | KRAVEN, CARNAGE, IRONMAN, FALCON, SENTRY, LOKI, VENOM, BLACKWIDOW, ELEKTRA, HAWKEYE, WINTERSOLDIER, LOGAN, review-contract — ALL consume from GOVERNANCE path | ✓ GOVERNANCE consumers match declared |

**Finding:** When Wolverine runs ARCHITECT at module scope, output goes to FEATURE path — but consuming commands only know the GOVERNANCE path. Module-scope ARCHITECT runs produce orphaned artifacts no downstream command can locate. Declaration should clarify scope-based routing.

---

### VENOM

| Dimension | Path | Status |
|---|---|---|
| 1. Actual | `features/[feature]/outputs/2026/06/04/Venom/` (40 files confirmed on disk) | ✓ |
| 2. Declared | `features/[feature]/outputs/{YYYY}/{MM}/{DD}/Venom/` (07-output-persistence.md) | ✓ |
| 3. Referenced | BLACKWIDOW reads prior VENOM reports at feature path; ELEKTRA reads at feature path | ✓ |
| 4. Read | Source code; `GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/ARCHITECT/architect-security-surface.json` | — |
| 5. Write 1 | `features/[feature]/outputs/{YYYY}/{MM}/{DD}/Venom/` | ✓ |
| 5. Write 2 | `features/[feature]/SECURITY.md` — owns `## VENOM STATUS` section | ✓ |
| 6. Downstream | BLACKWIDOW, ELEKTRA, AVENGERSASSEMBLE — all expect feature-scoped path | ✓ |

---

### BLACKWIDOW

| Dimension | Path | Status |
|---|---|---|
| 1. Actual | `features/[feature]/outputs/2026/06/04/BlackWidow/` (40 files confirmed on disk) | ✓ |
| 2. Declared | `features/[feature]/outputs/{YYYY}/{MM}/{DD}/BlackWidow/` (08-persistent-output.md) | ✓ |
| 3. Referenced | ELEKTRA reads prior BLACKWIDOW reports at feature path | ✓ |
| 4. Read | Source code; VENOM reports at feature path | — |
| 5. Write 1 | `features/[feature]/outputs/{YYYY}/{MM}/{DD}/BlackWidow/` | ✓ |
| 5. Write 2 | `features/[feature]/SECURITY.md` — owns `## BLACKWIDOW STATUS` section | ✓ |
| 6. Downstream | ELEKTRA, AVENGERSASSEMBLE — expect feature-scoped path | ✓ |

---

### ELEKTRA

| Dimension | Path | Status |
|---|---|---|
| 1. Actual | `features/[feature]/outputs/2026/06/04/ELEKTRA/` (11 files confirmed on disk) | ✓ |
| 2. Declared | `features/[feature]/outputs/{YYYY}/{MM}/{DD}/ELEKTRA/` (ELEKTRA.md §15) | ✓ |
| 3. Referenced | No command declared to read ELEKTRA output (terminal security command) | N/A |
| 4. Read | Source code; VENOM reports; BLACKWIDOW reports; `GOVERNANCE/.../ARCHITECT/architect-security-surface.json` | — |
| 5. Write 1 | `features/[feature]/outputs/{YYYY}/{MM}/{DD}/ELEKTRA/` | ✓ |
| 5. Write 2 | `features/[feature]/SECURITY.md` — owns `## ELEKTRA STATUS` section | ✓ |
| 6. Downstream | None declared; AVENGERSASSEMBLE may check for presence | ✓ |

---

### LOKI

| Dimension | Path | Status |
|---|---|---|
| 1. Actual | `features/[feature]/outputs/2026/06/04/Loki/` (1 file confirmed on disk) | DRIFT |
| 2. Declared | `CURRENT/outputs/{YYYY}/{MM}/{DD}/Loki/` (08-runtime-workflow.md §18) — `CURRENT/` directory does NOT exist | LEGACY |
| 3. Referenced | KRAVEN references Loki runtime traces (no explicit path in KRAVEN); avengersassemble/04 references LOKI | UNKNOWN |
| 4. Read | `GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/ARCHITECT/feature-map.md`; `GOVERNANCE/.../ARCHITECT/database-read-map.md` | — |
| 5. Write 1 | Declared: LEGACY CURRENT/ (broken); Actual: FEATURE path | DRIFT |
| 5. Write 2 | None declared (analysis-only command) | — |
| 6. Downstream | KRAVEN expects Loki traces — but no path specified; if KRAVEN looks at LEGACY path it finds nothing | MISMATCH |

**Finding:** LOKI declared path is broken. Files land at feature-scoped path by actual runtime behavior. KRAVEN's consumption path is unspecified — downstream coordination is implicit and fragile.

---

### HAWKEYE

| Dimension | Path | Status |
|---|---|---|
| 1. Actual | `features/[feature]/outputs/2026/06/04/HAWKEYE/` (1 file confirmed on disk) | DRIFT |
| 2. Declared | `GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/HAWKEYE/` (09-persistent-output.md) | — |
| 3. Referenced | AVENGERSASSEMBLE governance registry lists HAWKEYE; THOR reads for endpoint gate | MISMATCH |
| 4. Read | `GOVERNANCE/.../ARCHITECT/feature-map.md`; `GOVERNANCE/.../ARCHITECT/routes.graph.json`; `features/[feature]/ARCHITECTURE.md` | — |
| 5. Write 1 | Declared: GOVERNANCE; Actual: FEATURE | DRIFT |
| 5. Write 2 | None declared | — |
| 6. Downstream | THOR, AVENGERSASSEMBLE look for HAWKEYE reports — if they follow GOVERNANCE declared path they miss actual files | MISMATCH |

**Finding:** HAWKEYE declares global governance scope but writes to feature scope in practice. THOR integration cannot reliably locate HAWKEYE reports without path correction.

---

### DR. STRANGE

| Dimension | Path | Status |
|---|---|---|
| 1. Actual | `features/[feature]/outputs/{YYYY}/{MM}/{DD}/dr-strange/` (7 files confirmed on disk) | ✓ (matches §16.6) |
| 2. Declared §16.1 | `CURRENT/outputs/YYYY/MM/DD/dr-strange/` — CURRENT/ does NOT exist | INTERNAL-CONFLICT |
| 2. Declared §16.6 | `ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/dr-strange/` | ✓ |
| 3. Referenced | THOR reads from `features/[feature]/outputs/[most-recent-date]/dr-strange/` (thor/01-release-scope.md) | ✓ |
| 3. Referenced | WOLVERINE references dr-strange outputs when building task context | ✓ |
| 4. Read | `GOVERNANCE/FEATURE_STATUS.md`; feature domain files (`CURRENT_STATUS.md`, `SECURITY.md`, etc.) | — |
| 5. Write 1 | `features/[feature]/outputs/{YYYY}/{MM}/{DD}/dr-strange/` (operative: §16.6) | ✓ |
| 5. Write 2 | None (status oracle — read-only analysis, no domain file mutations) | — |
| 6. Downstream | THOR ✓; WOLVERINE ✓ — both reference feature-scoped path and match actual | ✓ |

**Finding:** §16.6 (write boundary) is correct and matches actual. §16.1, §16.2, §16.3, §16.5 in `08-output-formats.md` and all of `07-output-routing-contract.md` retain the stale `CURRENT/` path. The command works correctly but its specification is internally contradicted.

---

### IRONMAN

| Dimension | Path | Status |
|---|---|---|
| 1. Actual | `features/dashboard/outputs/2026/06/05/IRONMAN/` (1 file confirmed on disk) | ✓ |
| 2. Declared | `features/[feature]/outputs/{YYYY}/{MM}/{DD}/IRONMAN/` (Ironman.md §3) | ✓ |
| 3. Referenced | WOLVERINE/01-routing.md §5.15 explicitly references feature-scoped IRONMAN path | ✓ |
| 3. Referenced | AVENGERSASSEMBLE reads ARCHITECTURE.md (Write 2 domain file, not Write 1) | ✓ |
| 4. Read | `GOVERNANCE/.../ARCHITECT/ARCHITECTURE.md`; `GOVERNANCE/.../ARCHITECT/feature-map.md`; `GOVERNANCE/.../ARCHITECT/dependency-map.md`; `GOVERNANCE/.../ARCHITECT/engine-consumer-map.md` | — |
| 5. Write 1 | `features/[feature]/outputs/{YYYY}/{MM}/{DD}/IRONMAN/` | ✓ |
| 5. Write 2 | `features/[feature]/OWNERSHIP.md` (full replacement); `features/[feature]/CURRENT_STATUS.md` | ✓ |
| 6. Downstream | WOLVERINE, AVENGERSASSEMBLE — expect feature-scoped path | ✓ |

---

### SPIDER-MAN

| Dimension | Path | Status |
|---|---|---|
| 1. Actual | `features/[feature]/outputs/2026/06/04/SPIDER-MAN/` (1 file confirmed on disk) | ✓ |
| 2. Declared | `features/[feature]/outputs/{YYYY}/{MM}/{DD}/SPIDER-MAN/` (SPIDER-MAN.md) | ✓ |
| 3. Referenced | THOR reads for behavior/test gate; AVENGERSASSEMBLE governance registry | ✓ |
| 4. Read | `GOVERNANCE/.../ARCHITECT/feature-map.md`; `features/[feature]/BEHAVIOR.md`; test files | — |
| 5. Write 1 | `features/[feature]/outputs/{YYYY}/{MM}/{DD}/SPIDER-MAN/` | ✓ |
| 5. Write 2 | `features/[feature]/TESTS.md`; `features/[feature]/CURRENT_STATUS.md` | ✓ |
| 6. Downstream | THOR, AVENGERSASSEMBLE — expect feature-scoped path | ✓ |

---

### KRAVEN

| Dimension | Path | Status |
|---|---|---|
| 1. Actual | `features/[feature]/outputs/2026/06/04/KRAVEN/` (1 file confirmed on disk) | ✓ |
| 2. Declared | `features/[feature]/outputs/{YYYY}/{MM}/{DD}/KRAVEN/` (06-cache-output.md §12) | ✓ |
| 3. Referenced | THOR reads for performance gate; AVENGERSASSEMBLE governance registry | ✓ |
| 4. Read | `GOVERNANCE/.../ARCHITECT/dependency-map.md`; `GOVERNANCE/.../ARCHITECT/database-read-map.md`; `GOVERNANCE/.../ARCHITECT/feature-map.md`; LOKI traces (path implicit) | — |
| 5. Write 1 | `features/[feature]/outputs/{YYYY}/{MM}/{DD}/KRAVEN/` | ✓ |
| 5. Write 2 | `features/[feature]/PERFORMANCE.md`; `features/[feature]/CURRENT_STATUS.md` (10-enhanced-formats-completion.md) | ✓ |
| 6. Downstream | THOR, AVENGERSASSEMBLE — expect feature-scoped path | ✓ |

---

### THOR

| Dimension | Path | Status |
|---|---|---|
| 1. Actual | `features/[feature]/outputs/2026/06/04/Thor/` (1 file confirmed on disk) | ✓ |
| 2. Declared | `features/[feature]/outputs/{YYYY}/{MM}/{DD}/Thor/` (THOR.md §7) | ✓ |
| 3. Referenced | AVENGERSASSEMBLE aggregates THOR results (no explicit path in AVENGERSASSEMBLE) | ✓ |
| 4. Read | `features/[feature]/outputs/[most-recent-date]/dr-strange/` (thor/01-release-scope.md); all specialist outputs at feature path; `GOVERNANCE/FEATURE_STATUS.md`; feature domain files | — |
| 5. Write 1 | `features/[feature]/outputs/{YYYY}/{MM}/{DD}/Thor/` | ✓ |
| 5. Write 2 | `features/[feature]/CURRENT_STATUS.md`; `features/[feature]/BLOCKERS.md`; `features/[feature]/DEFERRED.md` | ✓ |
| 6. Downstream | AVENGERSASSEMBLE — expects feature-scoped path | ✓ |

---

### SENTRY

| Dimension | Path | Status |
|---|---|---|
| 1. Actual | No standalone SENTRY files found on disk (runs via Wolverine append mode) | MISSING |
| 2. Declared | `features/[feature]/outputs/{YYYY}/{MM}/{DD}/Sentry/` (09-persistent-output.md) | ✓ |
| 3. Referenced | SENTRY §09 claims "review-contract shares this output path" — review-contract §10 contradicts this | CONFLICT |
| 4. Read | `GOVERNANCE/.../ARCHITECT/ARCHITECTURE.md`; `GOVERNANCE/.../ARCHITECT/feature-map.md`; `GOVERNANCE/.../ARCHITECT/dependency-map.md`; `features/[feature]/ARCHITECTURE.md` | — |
| 5. Write 1 | `features/[feature]/outputs/{YYYY}/{MM}/{DD}/Sentry/` (declared) | — |
| 5. Write 2 | `features/[feature]/CURRENT_STATUS.md` | ✓ |
| 6. Downstream | WOLVERINE reads SENTRY findings to inform task context | ✓ |

---

### CARNAGE

| Dimension | Path | Status |
|---|---|---|
| 1. Actual | No CARNAGE files found on disk | MISSING |
| 2. Declared | `GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/Carnage/` (CARNAGE.md §8) | ✓ |
| 3. Referenced | AVENGERSASSEMBLE, THOR read for migration gate | ✓ GOVERNANCE |
| 4. Read | `GOVERNANCE/.../ARCHITECT/dependency-map.md`; `GOVERNANCE/.../ARCHITECT/ARCHITECTURE.md`; `GOVERNANCE/.../ARCHITECT/engine-consumer-map.md` | — |
| 5. Write 1 | `GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/Carnage/` | ✓ |
| 5. Write 2 | `features/[feature]/CURRENT_STATUS.md` (## CARNAGE Migration Status); `features/[feature]/BLOCKERS.md` | ✓ |
| 6. Downstream | THOR, AVENGERSASSEMBLE — reference GOVERNANCE path | ✓ |

---

### REVIEW-CONTRACT

| Dimension | Path | Status |
|---|---|---|
| 1. Actual | `features/[feature]/outputs/2026/06/04/review-contract/` (1 file confirmed on disk) | DRIFT |
| 2. Declared | `ZZnotforproduction/APPS/VCSM/outputs/{YYYY}/{MM}/{DD}/review-contract/` (10-persistent-output.md) — MISSING-FEATURE segment | BROKEN |
| 3. Referenced | AVENGERSASSEMBLE governance registry lists review-contract (no explicit read path) | UNKNOWN |
| 3. Referenced | SENTRY §09 claims review-contract shares Sentry's feature-scoped path — contradicts own declaration | CONFLICT |
| 4. Read | Architecture contracts; `features/[feature]/ARCHITECTURE.md` | — |
| 5. Write 1 | Declared: APPS/VCSM/outputs/ (broken, non-existent); Actual: FEATURE path | DRIFT |
| 5. Write 2 | None declared | — |
| 6. Downstream | AVENGERSASSEMBLE — no confirmed path; THOR reads architecture compliance | UNRESOLVED |

**Finding:** review-contract's declared path resolves to a non-existent directory (`ZZnotforproduction/APPS/VCSM/outputs/` does not exist on disk). Actual files are at feature-scoped path. SENTRY claims they share a path; review-contract's own declaration disagrees. Both declarations are wrong.

---

### WATCHER

| Dimension | Path | Status |
|---|---|---|
| 1. Actual | No WATCHER files found on disk | MISSING |
| 2. Declared | `GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/WATCHER/` (06-output-format.md §13) | ✓ |
| 3. Referenced | WOLVERINE reads `CHANGE_INTENT.md` at GOVERNANCE path | ✓ |
| 4. Read | Git status/diff; `GOVERNANCE/.../WOLVERINE/CHANGE_INTENT.md` | — |
| 5. Write 1 | `GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/WATCHER/` | ✓ |
| 5. Write 2 | Appends to `CHANGE_INTENT.md` at GOVERNANCE path | ✓ |
| 6. Downstream | WOLVERINE reads CHANGE_INTENT — expects GOVERNANCE path | ✓ |

---

### GREENGOBLIN

| Dimension | Path | Status |
|---|---|---|
| 1. Actual | No GREENGOBLIN files found on disk | MISSING |
| 2. Declared | `ZZnotforproduction/APPS/VCSM/outputs/{YYYY}/{MM}/{DD}/GREENGOBLIN/` (07-persistent-output.md §1) — MISSING-FEATURE segment | BROKEN |
| 3. Referenced | No command declared to read GREENGOBLIN output | N/A |
| 4. Read | Various command output files to verify claims (anti-hallucination) | — |
| 5. Write 1 | Declared: APPS/VCSM/outputs/ (broken, non-existent); should be FEATURE or GOVERNANCE | BROKEN |
| 5. Write 2 | None declared | — |
| 6. Downstream | None | N/A |

---

### DB

| Dimension | Path | Status |
|---|---|---|
| 1. Actual | No DB files found on disk | MISSING |
| 2. Declared | `ZZnotforproduction/outputs/{YYYY}/{MM}/{DD}/DB/` (06-persistent-output.md) — MALFORMED (missing GOVERNANCE/) | BROKEN |
| 3. Referenced | CARNAGE reads DB schema for migration analysis (no DB output path specified) | — |
| 4. Read | Live DB schema, RLS policies, migration files | — |
| 5. Write 1 | Declared: MALFORMED path (does not exist); should be `GOVERNANCE/outputs/...` | BROKEN |
| 5. Write 2 | None declared | — |
| 6. Downstream | CARNAGE implicitly reads DB findings — no formal consumption path declared | UNRESOLVED |

---

### SHIELD

| Dimension | Path | Status |
|---|---|---|
| 1. Actual | No SHIELD files found on disk | MISSING |
| 2. Declared | `zNOTFORPRODUCTION/CURRENT/outputs/{YYYY}/{MM}/{DD}/SHIELD/` (08-report-format.md §18) — WRONG-ROOT (lowercase z) AND LEGACY CURRENT/ | BROKEN |
| 3. Referenced | No command declared to read SHIELD output | N/A |
| 4. Read | Security reports from all VENOM/BLACKWIDOW/ELEKTRA outputs | — |
| 5. Write 1 | Declared: WRONG-ROOT + LEGACY (completely broken path); should be GOVERNANCE or FEATURE | BROKEN |
| 5. Write 2 | None declared | — |
| 6. Downstream | None | N/A |

---

### VISION

| Dimension | Path | Status |
|---|---|---|
| 1. Actual | No VISION files found on disk | MISSING |
| 2. Declared | `CURRENT/outputs/{YYYY}/{MM}/{DD}/VISION/` (Vision.md §10) — LEGACY | LEGACY |
| 3. Referenced | WOLVERINE/01-routing.md §5.19 references `GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/VISION/` with `cyborg_` prefix — CONTRADICTS Vision.md | CONFLICT |
| 4. Read | Analytics data, funnel metrics | — |
| 5. Write 1 | Declared: LEGACY CURRENT/ (doesn't exist); Wolverine routing assumes GOVERNANCE | LEGACY |
| 5. Write 2 | None declared | — |
| 6. Downstream | Wolverine reads VISION at GOVERNANCE path — but VISION writes nowhere that exists | MISMATCH |

---

### AVENGERSASSEMBLE

| Dimension | Path | Status |
|---|---|---|
| 1. Actual | No AVENGERSASSEMBLE files found on disk | MISSING |
| 2. Declared | `CURRENT/outputs/{YYYY}/{MM}/{DD}/AVENGERSASSEMBLE/` (07-output-format.md §2) — LEGACY | LEGACY |
| 3. Referenced | No command declared to read AVENGERSASSEMBLE output | N/A |
| 4. Read | All 15 specialist outputs (ARCHITECT, IRONMAN, VENOM, BLACKWIDOW, ELEKTRA, SENTRY, LOKI, HAWKEYE, KRAVEN, CARNAGE, FALCON, WINTERSOLDIER, LOGAN, review-contract, SHIELD) | — |
| 5. Write 1 | Declared: LEGACY (doesn't exist); should be GOVERNANCE (cross-feature synthesis) | LEGACY |
| 5. Write 2 | None declared | — |
| 6. Downstream | Terminal command — no declared consumer | N/A |

---

### NICKCFURY

| Dimension | Path | Status |
|---|---|---|
| 1. Actual | No NickFury files found on disk | MISSING |
| 2. Declared | Planning: `CURRENT/outputs/{YYYY}/{MM}/{DD}/WOLVERINE/`; Docs: `CURRENT/outputs/{YYYY}/{MM}/{DD}/NickFury/` (07-planning-file.md §1) — BOTH LEGACY | LEGACY |
| 3. Referenced | No command declared to read NickFury output | N/A |
| 4. Read | Planning files from Wolverine (GOVERNANCE path) | — |
| 5. Write 1 | Declared: LEGACY (both paths don't exist); should be GOVERNANCE (parallel orchestrator context) | LEGACY |
| 5. Write 2 | None declared | — |
| 6. Downstream | None | N/A |

---

### CAPTAIN

| Dimension | Path | Status |
|---|---|---|
| 1. Actual | No CAPTAIN files found on disk | MISSING |
| 2. Declared | `CURRENT/outputs/{YYYY}/{MM}/{DD}/CAPTAIN/` (captain.md) — LEGACY | LEGACY |
| 3. Referenced | No command declared to read CAPTAIN output | N/A |
| 4. Read | Session context — idea capture only | — |
| 5. Write 1 | Declared: LEGACY; should be GOVERNANCE (cross-session ideas) | LEGACY |
| 5. Write 2 | None declared | — |
| 6. Downstream | None | N/A |

---

### PROFESSORX

| Dimension | Path | Status |
|---|---|---|
| 1. Actual | No ProfessorX files found on disk | MISSING |
| 2. Declared | `CURRENT/outputs/YYYY/MM/DD/ProfessorX/` (ProfessorX.md) — LEGACY | LEGACY |
| 3. Referenced | No command declared to read ProfessorX output | N/A |
| 4. Read | Unknown | — |
| 5. Write 1 | Declared: LEGACY | LEGACY |
| 5. Write 2 | None declared | — |
| 6. Downstream | None | N/A |

---

### DATA ENGINEER

| Dimension | Path | Status |
|---|---|---|
| 1. Actual | No DataEngineer files found on disk | MISSING |
| 2. Declared | `ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/DataEngineer/` (05-routing-authority.md §9) — MISSING-DATE segment | BROKEN |
| 3. Referenced | No command declared to read DataEngineer output | N/A |
| 4. Read | DB schema, analytics pipelines | — |
| 5. Write 1 | Declared: correct root but missing `{YYYY}/{MM}/{DD}/` date segment | BROKEN |
| 5. Write 2 | None declared | — |
| 6. Downstream | None | N/A |

---

### FALCON

| Dimension | Path | Status |
|---|---|---|
| 1. Actual | No Falcon files found on disk | MISSING |
| 2. Declared | No explicit file output path found in Falcon.md or 09-safety-output.md (output = screen format only) | NO-DECLARE |
| 3. Referenced | AVENGERSASSEMBLE governance registry lists FALCON; WINTERSOLDIER handoff via Falcon | — |
| 4. Read | `GOVERNANCE/.../ARCHITECT/feature-map.md`; `GOVERNANCE/.../ARCHITECT/routes.graph.json`; `features/[feature]/ARCHITECTURE.md` (Falcon.md §ARCHITECT consumption) | — |
| 5. Write 1 | No file output path declared — report is screen text | NO-DECLARE |
| 5. Write 2 | None declared | — |
| 6. Downstream | WINTERSOLDIER reads Falcon parity context (10-wintersoldier-handoff.md); no file path specified | UNRESOLVED |

---

### WINTERSOLDIER

| Dimension | Path | Status |
|---|---|---|
| 1. Actual | No WinterSoldier files found on disk | MISSING |
| 2. Declared | No explicit file output path found in WinterSoldier.md or sub-files | NO-DECLARE |
| 3. Referenced | AVENGERSASSEMBLE governance registry lists WINTER SOLDIER (via Falcon) | — |
| 4. Read | `GOVERNANCE/.../ARCHITECT/feature-map.md`; `GOVERNANCE/.../ARCHITECT/routes.graph.json`; `features/[feature]/ARCHITECTURE.md` (00-winter-soldier-gate.md) | — |
| 5. Write 1 | No file output path declared | NO-DECLARE |
| 5. Write 2 | None declared | — |
| 6. Downstream | AVENGERSASSEMBLE — no confirmed path | UNRESOLVED |

---

### LOGAN

| Dimension | Path | Status |
|---|---|---|
| 1. Actual | No Logan standalone output files found on disk | MISSING |
| 2. Declared | No standalone dated output path declared (Logan is a Write 2-only command) | NO-DECLARE |
| 3. Referenced | AVENGERSASSEMBLE governance registry lists LOGAN; ARCHITECT artifacts consumed | — |
| 4. Read | `GOVERNANCE/.../WOLVERINE/` (planning files); `features/[feature]/` domain files; `ZZnotforproduction/APPS/VCSM/FEATURE_DOCUMENTATION_INDEX.md` (10-completion-criteria.md) | — |
| 5. Write 1 | None — Logan does not produce dated output files | NO-DECLARE |
| 5. Write 2 | `features/[feature]/INDEX.md` (rebuilds per feature); `ZZnotforproduction/APPS/VCSM/FEATURE_DOCUMENTATION_INDEX.md` (rebuilds global index) | ✓ |
| 6. Downstream | AVENGERSASSEMBLE reads ARCHITECTURE.md from `features/[feature]/` — Logan maintains this | ✓ |

---

### DEADPOOL

| Dimension | Path | Status |
|---|---|---|
| 1. Actual | No Deadpool output files found on disk | MISSING |
| 2. Declared | No file output path declared (07-approval-output.md — output is screen text `BUG RESOLUTION SUMMARY` only) | NO-DECLARE |
| 3. Referenced | No command declared to read Deadpool output | N/A |
| 4. Read | Source code; `CURRENT/outputs/{YYYY}/{MM}/{DD}/WOLVERINE/` planning context (04-debugger-registry.md) — LEGACY read path | LEGACY (read) |
| 5. Write 1 | No file output — screen only | NO-DECLARE |
| 5. Write 2 | None declared | — |
| 6. Downstream | None | N/A |

**Finding:** Deadpool reads Wolverine planning files at a LEGACY CURRENT/ path that doesn't exist on disk. Deadpool should be updated to read from `GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/WOLVERINE/`.

---

### SESSION-SUMMARY

| Dimension | Path | Status |
|---|---|---|
| 1. Actual | Files exist at `zNOTFORPRODUCTION/_HISTORY/session-summaries/YYYY-MM/` (session-summary.md §2) | — |
| 2. Declared | `zNOTFORPRODUCTION/_HISTORY/session-summaries/YYYY-MM/` — lowercase z root (not ZZnotforproduction) | SPECIAL CASE |
| 3. Referenced | No command declared to read session-summary output | N/A |
| 4. Read | Full session context | — |
| 5. Write 1 | `zNOTFORPRODUCTION/_HISTORY/session-summaries/YYYY-MM/` | — |
| 5. Write 2 | None | — |
| 6. Downstream | None | N/A |

**Note:** session-summary uses a distinct `zNOTFORPRODUCTION/` root (lowercase z) that is different from both the legacy `zNOTFORPRODUCTION/` (also lowercase, pre-migration) and the new `ZZnotforproduction/` (uppercase). This appears to be an intentional separate history storage path — but needs verification whether `zNOTFORPRODUCTION/_HISTORY/` actually exists or also belongs under `ZZnotforproduction/`.

---

### DR. STRANGE (routing-contract sub-file)

| Dimension | Path | Status |
|---|---|---|
| 07-output-routing-contract.md §10.1 | ALL path examples use `CURRENT/outputs/YYYY/MM/DD/[COMMAND]/` pattern | LEGACY (stale) |
| Impact | This file is the routing specification — any command that references it for path guidance gets stale CURRENT/ paths | HIGH IMPACT |

---

## Summary Tables

### Actual vs Declared Divergence (DRIFT Cases)

| Command | Declared | Actual on Disk | Gap |
|---|---|---|---|
| WOLVERINE | GOVERNANCE | FEATURE (task files) | Dual-root split undeclared |
| ARCHITECT | GOVERNANCE only | GOVERNANCE + FEATURE (module runs) | Module-scope runs orphaned |
| HAWKEYE | GOVERNANCE | FEATURE | Full path inversion |
| LOKI | LEGACY CURRENT/ | FEATURE | Declaration broken |
| DR. STRANGE §16.1 | LEGACY CURRENT/ | FEATURE | Internal contradiction |
| review-contract | APPS/VCSM/outputs/ (broken) | FEATURE | Declaration broken + missing segment |

### Broken Declarations (No Valid Output Directory Exists)

| Command | Declared Path | Issue |
|---|---|---|
| LOKI | `CURRENT/outputs/...` | CURRENT/ does not exist |
| VISION | `CURRENT/outputs/...` | CURRENT/ does not exist |
| NickFury | `CURRENT/outputs/...` | CURRENT/ does not exist |
| CAPTAIN | `CURRENT/outputs/...` | CURRENT/ does not exist |
| ProfessorX | `CURRENT/outputs/...` | CURRENT/ does not exist |
| AVENGERSASSEMBLE | `CURRENT/outputs/...` | CURRENT/ does not exist |
| SHIELD | `zNOTFORPRODUCTION/CURRENT/outputs/...` | Wrong root AND CURRENT/ doesn't exist |
| DB | `ZZnotforproduction/outputs/...` | Missing GOVERNANCE/ segment |
| GREENGOBLIN | `ZZnotforproduction/APPS/VCSM/outputs/...` | Missing `features/[feature]/` |
| review-contract | `ZZnotforproduction/APPS/VCSM/outputs/...` | Missing `features/[feature]/` |
| DataEngineer | `ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/DataEngineer/` | Missing date segment |

### Commands With No Declared Output File Path

| Command | Notes |
|---|---|
| DEADPOOL | Screen output only (`BUG RESOLUTION SUMMARY`); reads WOLVERINE plans from LEGACY path |
| FALCON | Screen output only; no persistent file path declared |
| WINTERSOLDIER | Screen output only; no persistent file path declared |
| LOGAN | Write 2 only (INDEX.md, FEATURE_DOCUMENTATION_INDEX.md); no dated output file |

### Downstream Consumer vs Actual Path Mismatches

| Consumer | Reads From | Actual Write Path | Match? |
|---|---|---|---|
| KRAVEN reads LOKI | Implicit / not declared | FEATURE path | UNRESOLVED |
| THOR reads HAWKEYE | Not explicitly declared | FEATURE (actual), GOVERNANCE (declared) | RISK |
| AVENGERSASSEMBLE reads HAWKEYE | GOVERNANCE (governance registry) | FEATURE (actual) | MISMATCH |
| WOLVERINE routing reads VISION | GOVERNANCE/outputs/.../VISION/ (routing.md §5.19) | LEGACY declared / no files exist | MISMATCH |
| DEADPOOL reads WOLVERINE | LEGACY CURRENT/ (04-debugger-registry.md) | GOVERNANCE (actual) | MISMATCH |
| DR. STRANGE §07 routing spec | CURRENT/outputs/... | FEATURE (actual per §16.6) | INTERNAL CONFLICT |

---

## Critical Findings

### CF-001: CURRENT/ Path Does Not Exist — 7 Commands Broken
`CURRENT/` directory does not exist at the repo root. Seven commands (LOKI, VISION, NickFury, CAPTAIN, ProfessorX, AVENGERSASSEMBLE, SHIELD) write to this non-existent path. Their Write 1 output is silently dropped. SHIELD has double failure (wrong lowercase root).

### CF-002: Wolverine Dual-Root Split Is Undeclared
Wolverine legitimately writes to two different root paths: GOVERNANCE (queue files, CHANGE_INTENT.md) and FEATURE (per-task approval trackers, task audit files). Neither its declaration nor its consumers formally acknowledge the feature-scoped output. The feature-scoped outputs are the most task-relevant files — but the declaration points only to GOVERNANCE.

### CF-003: DR. STRANGE §16.1 vs §16.6 Internal Contradiction
`08-output-formats.md` §16.1 and `07-output-routing-contract.md` use LEGACY `CURRENT/` paths. `08-output-formats.md` §16.6 (write boundary) is correct. Any command referencing the routing contract file for path guidance gets the wrong path. The routing contract file (§07) needs full replacement with ZZnotforproduction paths.

### CF-004: HAWKEYE Governance vs Feature Inversion
HAWKEYE declares GOVERNANCE scope but every actual output file is at FEATURE scope. THOR's release gate reads HAWKEYE output — if THOR follows the declared GOVERNANCE path it finds nothing. The actual files exist; the declared path is where no file has ever been written.

### CF-005: review-contract / SENTRY Declaration Conflict
review-contract declares `APPS/VCSM/outputs/` (broken — directory doesn't exist). SENTRY §09 says review-contract shares SENTRY's feature-scoped path — contradicts review-contract's own declaration. Actual files are at feature-scoped path. Two different wrong declarations; one correct actual path.

### CF-006: ARCHITECT Module-Scope Runs Are Orphaned
When Wolverine runs ARCHITECT at module scope (not global), output goes to FEATURE path. All downstream consumers (KRAVEN, CARNAGE, IRONMAN, FALCON, etc.) only know the GOVERNANCE path. Module-scope ARCHITECT artifacts are unreachable by any consuming command.

### CF-007: DB Path Is Malformed — Missing GOVERNANCE Segment
DB's declared path `ZZnotforproduction/outputs/{YYYY}/{MM}/{DD}/DB/` is missing the `GOVERNANCE/` segment. The directory `ZZnotforproduction/outputs/` does not exist and DB reports have nowhere to land.

### CF-008: Falcon and WinterSoldier Have No Write 1 Path
Neither FALCON nor WINTERSOLDIER declare a file output path. AVENGERSASSEMBLE lists them in the governance evidence registry, implying it expects to read their reports — but no path exists to read from.

### CF-009: DEADPOOL Reads WOLVERINE From Stale Legacy Path
`deadpool/04-debugger-registry.md` references Wolverine planning at `CURRENT/outputs/{YYYY}/{MM}/{DD}/WOLVERINE/` — a non-existent path. Deadpool cannot locate Wolverine context for bug investigation.

### CF-010: VISION Write Path Conflict Between Files
`Vision.md §10` declares LEGACY `CURRENT/` path. `wolverine/01-routing.md §5.19` declares correct GOVERNANCE path with `cyborg_` prefix. VISION's actual behavior is unknown (no files on disk). Wolverine expects VISION at GOVERNANCE; VISION declares LEGACY.

---

## Compliance Summary

| Status | Count | Commands |
|---|---|---|
| ✓ COMPLIANT | 7 | VENOM, BLACKWIDOW, ELEKTRA, IRONMAN, SPIDER-MAN, KRAVEN, THOR |
| GOVERNANCE-CORRECT | 2 | ARCHITECT (global), CARNAGE, WATCHER |
| DRIFT (actual ≠ declared) | 4 | WOLVERINE, HAWKEYE, LOKI, review-contract |
| INTERNAL-CONFLICT | 1 | DR. STRANGE |
| LEGACY (broken path) | 7 | VISION, NickFury, CAPTAIN, ProfessorX, AVENGERSASSEMBLE, SHIELD, DR. STRANGE §16.1 |
| BROKEN (wrong path structure) | 4 | DB, GREENGOBLIN, review-contract, DataEngineer |
| NO-DECLARE | 4 | DEADPOOL, FALCON, WINTERSOLDIER, LOGAN |
| SPECIAL-CASE | 1 | session-summary |
| MISSING (no files yet) | 8 | CARNAGE, WATCHER, GREENGOBLIN, DB, SHIELD, NickFury, CAPTAIN, ProfessorX |

---

## Recommended Fix Priority

| Priority | Command | Fix |
|---|---|---|
| P0 | DR. STRANGE §07, §16.1 | Replace all CURRENT/ references with `features/[feature]/outputs/{YYYY}/{MM}/{DD}/dr-strange/` |
| P0 | WOLVERINE | Declare dual-root: GOVERNANCE for queue/ledger, FEATURE for task approval/audit files |
| P0 | DB | Add GOVERNANCE/ segment: `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/DB/` |
| P0 | SHIELD | Replace with `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/SHIELD/` |
| P0 | HAWKEYE | Update declaration to FEATURE scope: `features/[feature]/outputs/{YYYY}/{MM}/{DD}/HAWKEYE/` |
| P0 | LOKI | Update declaration to FEATURE scope: `features/[feature]/outputs/{YYYY}/{MM}/{DD}/Loki/` |
| P0 | review-contract | Add missing `features/[feature]/`: `features/[feature]/outputs/{YYYY}/{MM}/{DD}/review-contract/` |
| P1 | VISION | Update Vision.md §10 to `GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/VISION/` (match routing.md) |
| P1 | NickFury | Update to `GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/NickFury/` |
| P1 | AVENGERSASSEMBLE | Update to `GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/AVENGERSASSEMBLE/` |
| P1 | DEADPOOL | Update 04-debugger-registry.md WOLVERINE read path to GOVERNANCE |
| P1 | GREENGOBLIN | Add `features/[feature]/`: `features/[feature]/outputs/{YYYY}/{MM}/{DD}/GREENGOBLIN/` |
| P2 | FALCON | Add explicit file output path declaration + sub-file |
| P2 | WINTERSOLDIER | Add explicit file output path declaration + sub-file |
| P2 | DataEngineer | Add date segment: `features/[feature]/outputs/{YYYY}/{MM}/{DD}/DataEngineer/` |
| P2 | CAPTAIN | Update to `GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/CAPTAIN/` |
| P2 | ProfessorX | Update to `GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/ProfessorX/` |
| P3 | ARCHITECT | Add documentation for dual-scope routing (GOVERNANCE global vs FEATURE module) |
| P3 | SENTRY | Remove "review-contract shares this path" claim from §09; paths differ |

---

*Report generated for TICKET-COMMAND-OUTPUT-CONTRACT-0001 | 2026-06-05 | Read-Only, No Files Modified*
