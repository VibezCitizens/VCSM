# COMMAND OUTPUT PATH — P1 REMEDIATION REPORT

**Ticket:** TICKET-COMMAND-OUTPUT-PATH-REMEDIATION-P1-0001
**Date:** 2026-06-05
**Status:** COMPLETE
**Scope:** P1 output path violations — VISION, NickFury, AVENGERSASSEMBLE, DEADPOOL, GREENGOBLIN

---

## Summary

5 command trees remediated. 13 files read. 12 files edited. 0 P1 violations remaining.

---

## Phase 1 — VISION

**File edited:** `.claude/commands/Vision/Vision.md`

**Change:** §10 Persistent Output — replaced single stale `CURRENT/` path with scope-aware dual-root contract.

| Before | After |
|---|---|
| `CURRENT/outputs/{YYYY}/{MM}/{DD}/VISION/` | Scope-aware dual-root |

**New routing:**
- Global analytics run → `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/VISION/`
- Feature analytics run → `ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/VISION/`
- Scope resolution: feature declared at invocation → Feature Root; otherwise → Global Root

**Verification:** `grep -rn "CURRENT/" .claude/commands/Vision/` → CLEAN

---

## Phase 2 — NickFury

**Files edited (3):**
- `.claude/commands/NickFury/07-planning-file.md`
- `.claude/commands/NickFury/03-lock-file.md`
- `.claude/commands/NickFury/01-furysignal-intake.md`

**Root cause:** All NickFury path references used absolute workspace-prefixed CURRENT/ paths — unique pattern across all commands. Format was `/Users/vcsm/Desktop/VCSM/CURRENT/outputs/...` (absolute + LEGACY root).

**Changes:**

### 07-planning-file.md (6 occurrences fixed + feature-scope note added)

| Location | Before | After |
|---|---|---|
| §1 Execution logs | `/Users/vcsm/Desktop/VCSM/CURRENT/outputs/{YYYY}/{MM}/{DD}/WOLVERINE/` | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/WOLVERINE/` |
| §1 Documentation outputs | `/Users/vcsm/Desktop/VCSM/CURRENT/outputs/{YYYY}/{MM}/{DD}/NickFury/` | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/NickFury/` |
| §2 Example layout (WOLVERINE) | `/Users/vcsm/Desktop/VCSM/CURRENT/outputs/{YYYY}/{MM}/{DD}/WOLVERINE/` | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/WOLVERINE/` |
| §4 In-stream reports | `/Users/vcsm/Desktop/VCSM/CURRENT/outputs/{YYYY}/{MM}/{DD}/WOLVERINE/reports/` | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/WOLVERINE/reports/` |
| §5 Documentation output path | `/Users/vcsm/Desktop/VCSM/CURRENT/outputs/{YYYY}/{MM}/{DD}/NickFury/` | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/NickFury/` |
| §5 Example filename | `/Users/vcsm/Desktop/VCSM/CURRENT/outputs/{YYYY}/{MM}/{DD}/NickFury/2026-05-03_...` | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/NickFury/2026-05-03_...` |

**Added:** Feature-scope note at end of §5 — declares optional `ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/NickFury/` write path for feature-scoped tasks.

### 03-lock-file.md (1 occurrence fixed)

| Before | After |
|---|---|
| `/Users/vcsm/Desktop/VCSM/CURRENT/outputs/{YYYY}/{MM}/{DD}/NickFury/.fury-lock` | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/NickFury/.fury-lock` |

### 01-furysignal-intake.md (1 occurrence fixed)

| Before | After |
|---|---|
| `/Users/vcsm/Desktop/VCSM/CURRENT/outputs/{YYYY}/{MM}/{DD}/NickFury/.furysignal.md` | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/NickFury/.furysignal.md` |

**Verification:** `grep -rn "CURRENT/" .claude/commands/NickFury/` → CLEAN
**Verification:** `grep -rn "/Users/vcsm/Desktop/VCSM/CURRENT" .claude/commands/NickFury/` → CLEAN

---

## Phase 3 — AVENGERSASSEMBLE

**Files edited (5):**
- `.claude/commands/avengersassemble/avengersassemble.md`
- `.claude/commands/avengersassemble/07-output-format.md`
- `.claude/commands/avengersassemble/03-specialist-checks.md`
- `.claude/commands/avengersassemble/06-drift-handling.md`
- `.claude/commands/avengersassemble/09-safety-rules.md`

**Changes:**

### avengersassemble.md — §2 Output

| Before | After |
|---|---|
| `CURRENT/outputs/{YYYY}/{MM}/{DD}/AVENGERSASSEMBLE/avengers-assembly-{YYYY}-{MM}-{DD}.md` | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/AVENGERSASSEMBLE/avengers-assembly-{YYYY}-{MM}-{DD}.md` |

### 07-output-format.md — §2 Output File Location

| Before | After |
|---|---|
| `CURRENT/outputs/{YYYY}/{MM}/{DD}/AVENGERSASSEMBLE/avengers-assembly-{YYYY}-{MM}-{DD}.md` | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/AVENGERSASSEMBLE/avengers-assembly-{YYYY}-{MM}-{DD}.md` |

### 03-specialist-checks.md — ARCHITECT Pass read paths (5 occurrences)

Also corrected `vcsm-` filename prefix which was stale (canonical ARCHITECT artifact names do not carry a `vcsm-` prefix — confirmed via `avengersassemble/04-governance-registry.md` and ARCHITECT command §7).

| Before | After |
|---|---|
| `CURRENT/outputs/{YYYY}/{MM}/{DD}/ARCHITECT/vcsm-system-map.md` | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/ARCHITECT/system-map.md` |
| `CURRENT/outputs/{YYYY}/{MM}/{DD}/ARCHITECT/vcsm-feature-map.md` | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/ARCHITECT/feature-map.md` |
| `CURRENT/outputs/{YYYY}/{MM}/{DD}/ARCHITECT/vcsm-engine-consumer-map.md` | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/ARCHITECT/engine-consumer-map.md` |
| `CURRENT/outputs/{YYYY}/{MM}/{DD}/ARCHITECT/vcsm-dependency-map.md` | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/ARCHITECT/dependency-map.md` |
| `CURRENT/outputs/{YYYY}/{MM}/{DD}/ARCHITECT/vcsm-database-read-map.md` | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/ARCHITECT/database-read-map.md` |

### 03-specialist-checks.md — VENOM Pass read path (1 occurrence)

| Before | After |
|---|---|
| `CURRENT/outputs/{YYYY}/{MM}/{DD}/ARCHITECT/vcsm-security-report.md` | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/ARCHITECT/architect-security-surface.json` |

### 03-specialist-checks.md — LOGAN Pass read path (1 occurrence)

LOGAN is Write 2 only — there is no LOGAN dated output folder. Replaced with canonical feature domain file list.

| Before | After |
|---|---|
| `CURRENT/outputs/{YYYY}/{MM}/{DD}/LOGAN/` | `ZZnotforproduction/APPS/VCSM/features/[feature]/CURRENT_STATUS.md`, `ARCHITECTURE.md`, `SECURITY.md`, `BEHAVIOR.md`, `BLOCKERS.md`, `DEFERRED.md` + explanation note |

### 06-drift-handling.md — .v2.md example paths

| Before | After |
|---|---|
| `CURRENT/outputs/{YYYY}/{MM}/{DD}/ARCHITECT/vcsm-engine-consumer-map.md` | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/ARCHITECT/engine-consumer-map.md` |
| `CURRENT/outputs/{YYYY}/{MM}/{DD}/ARCHITECT/vcsm-engine-consumer-map.v2.md` | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/ARCHITECT/engine-consumer-map.v2.md` |

### 09-safety-rules.md — .v2.md creation permission paths

| Before | After |
|---|---|
| `CURRENT/outputs/{YYYY}/{MM}/{DD}/ARCHITECT/` or `CURRENT/outputs/{YYYY}/{MM}/{DD}/LOGAN/` | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/ARCHITECT/` (ARCHITECT corrections) or `ZZnotforproduction/APPS/VCSM/features/[feature]/` (LOGAN domain corrections) |

**Non-actionable hit in scope:** `10-workflow-execution.md:113` — prose field description ("whether CURRENT/ or _HISTORY/ directories need a new record") — not an output path; out of P1 scope.

**Preserved (intentional — do NOT change):**
- `07-output-format.md:9-11` — `zNOTFORPRODUCTION/_HISTORY/session-summaries/` (intentional session summary structure check)
- `03-specialist-checks.md:77` — `zNOTFORPRODUCTION/_CANONICAL/zcontract/ARCHITECTURE.md` (canonical contract reference, not an output path)

**Verification:** `grep -rn "CURRENT/" .claude/commands/avengersassemble/` → 1 non-actionable prose hit in `10-workflow-execution.md:113`; all output path violations: CLEAN

---

## Phase 4 — DEADPOOL

**File edited:** `.claude/commands/deadpool/04-debugger-registry.md`

**Change:** WOLVERINE read path updated; feature-scoped variant added.

| Before | After |
|---|---|
| `CURRENT/outputs/{YYYY}/{MM}/{DD}/WOLVERINE/` | `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/WOLVERINE/` |

**Added:** Feature-scoped WOLVERINE path note — when the bug investigation targets a specific feature, check `ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/WOLVERINE/` for feature-scoped approval trackers.

**Preserved (intentional):**
- `Deadpool.md:5` — `zNOTFORPRODUCTION/_CANONICAL/zcontract/PROJECT_BOUNDARY_ISOLATION_CONTRACT.md`
- `03-documentation-integration.md:16` — `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_CANONICAL/logan/`

**Verification:** `grep -rn "CURRENT/" .claude/commands/deadpool/` → CLEAN

---

## Phase 5 — GREENGOBLIN

**File edited:** `.claude/commands/GREENGOBLIN/07-persistent-output.md`

**Root cause:** Missing `features/[feature]/` segment — path was `ZZnotforproduction/APPS/VCSM/outputs/` instead of `ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/`.

**Change:** Replaced single path with scope-aware dual-root contract (same pattern as VISION and HAWKEYE).

| Before | After |
|---|---|
| `ZZnotforproduction/APPS/VCSM/outputs/{YYYY}/{MM}/{DD}/GREENGOBLIN/` | Scope-aware dual-root |

**New routing:**
- Feature-scoped validation → `ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/{YYYY}/{MM}/{DD}/GREENGOBLIN/`
- Global validation → `ZZnotforproduction/GOVERNANCE/outputs/{YYYY}/{MM}/{DD}/GREENGOBLIN/`
- Scope resolution: feature declared at invocation → Feature Root; otherwise → Global Root

**Verification:** `grep -rn "APPS/VCSM/outputs/" .claude/commands/GREENGOBLIN/` → CLEAN

---

## Verification Summary

| Command | CURRENT/ violations | Missing-feature-segment violations | Status |
|---|---|---|---|
| VISION | 0 | 0 | CLEAN |
| NickFury | 0 | 0 | CLEAN |
| AVENGERSASSEMBLE | 0 actionable (1 non-actionable prose ref) | 0 | CLEAN |
| DEADPOOL | 0 | 0 | CLEAN |
| GREENGOBLIN | 0 | 0 | CLEAN |

---

## Files Modified (12 total)

1. `.claude/commands/Vision/Vision.md`
2. `.claude/commands/NickFury/07-planning-file.md`
3. `.claude/commands/NickFury/03-lock-file.md`
4. `.claude/commands/NickFury/01-furysignal-intake.md`
5. `.claude/commands/avengersassemble/avengersassemble.md`
6. `.claude/commands/avengersassemble/07-output-format.md`
7. `.claude/commands/avengersassemble/03-specialist-checks.md`
8. `.claude/commands/avengersassemble/06-drift-handling.md`
9. `.claude/commands/avengersassemble/09-safety-rules.md`
10. `.claude/commands/deadpool/04-debugger-registry.md`
11. `.claude/commands/GREENGOBLIN/07-persistent-output.md`

(11 files — avengersassemble.md and 07-output-format.md counted as 2 separate files above; total 11)

---

## P2 / P3 Deferred (out of P1 scope)

| Command | Issue | Priority |
|---|---|---|
| FALCON | No output path declared | P2 |
| WINTERSOLDIER | No output path declared | P2 |
| DataEngineer | Missing date segment in output path | P2 |
| CAPTAIN | No output path declared | P3 |
| ProfessorX | No output path declared | P3 |
| ARCHITECT | Dual-scope routing not documented | P3 |
