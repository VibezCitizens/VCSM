# COMMAND_OUTPUT_CONTRACT_PLAN.md
# Ticket: DOCS-ORG-001
# Phase 5 — Command Output Rules and Write Location Contract
# Date: 2026-06-02
# Status: READ-ONLY PLANNING — No files modified

---

## GOVERNING PRINCIPLE

Every command has exactly two output destinations:

1. **CURRENT update** — when a command changes what is currently true about a feature
2. **HISTORY artifact** — a dated run record proving the command ran and what it found

A command must ALWAYS write a HISTORY artifact.
A command SHOULD update CURRENT only when the feature's truth changes.

The HISTORY artifact links to the CURRENT file it informed.
The CURRENT file links to recent HISTORY entries that are its evidence.

---

## REQUIRED METADATA HEADER

Every output file (both CURRENT updates and HISTORY artifacts) must begin with:

```
---
ticket: [TICKET-ID or DOCS-ORG-001]
command: [COMMAND-NAME]
feature: [feature-name]
date: YYYY-MM-DD
run-by: [session identifier or "auto"]
updates-current: [yes/no — did this run update a CURRENT/ file?]
current-file: [path to CURRENT file updated, or "none"]
supersedes: [path to prior HISTORY file this replaces, or "none"]
status: [COMPLETE | PARTIAL | DEFERRED | BLOCKED]
---
```

---

## REQUIRED STATUS VOCABULARY

All commands use these status terms in findings and CURRENT files:

| Term | Meaning |
|---|---|
| CLEAR | No findings; surface is compliant |
| FINDING | Issue identified, severity to be noted |
| DEFERRED | Finding acknowledged, remediation blocked or intentionally deferred |
| BLOCKED | Cannot complete audit; external dependency prevents it |
| PATCHED | Prior finding is now remediated |
| IN_PROGRESS | Remediation started, not complete |
| NOT_AUDITED | Surface exists but has not been audited by this command |

---

## PER-COMMAND OUTPUT CONTRACT

---

### VENOM (Security Sheriff)

**Responsibility:** Trust boundary review, RLS verification, auth surface audits, data exposure analysis.

| Output Type | Write Location | Naming |
|---|---|---|
| HISTORY artifact | `_DOCS/HISTORY/YYYY/MM/commands/venom/` | `YYYY-MM-DD_venom_[feature].md` |
| CURRENT update | `_DOCS/CURRENT/features/[feature]/SECURITY.md` | Overwrite in place; CHANGELOG entry required |
| Registry update | `_DOCS/REGISTRY/AUDIT_STATUS_REGISTRY.md` | Update VENOM column for feature |

**Can update CURRENT:** YES — SECURITY.md only
**Can create HISTORY:** YES
**Can modify registries:** YES — AUDIT_STATUS_REGISTRY.md only
**Cannot create:** Architecture docs, ownership docs, release gates

**Naming rules:**
- Feature-scoped: `YYYY-MM-DD_venom_[feature-topic].md`
- Multi-feature sweep: `YYYY-MM-DD_venom_[sweep-name].md` with per-feature sections

**Example — booking security run June 2026:**
```
HISTORY: _DOCS/HISTORY/2026/06/commands/venom/2026-06-05_venom_booking.md
CURRENT: _DOCS/CURRENT/features/booking/SECURITY.md (updated)
REGISTRY: AUDIT_STATUS_REGISTRY.md — booking/VENOM = 2026-06-05
```

---

### ELEKTRA (Precision Security Scanner and Patch Advisor)

**Responsibility:** Source-to-sink chain tracing, patch proposals, precise vulnerability classification. Third-tier after VENOM + BLACKWIDOW.

| Output Type | Write Location | Naming |
|---|---|---|
| HISTORY artifact | `_DOCS/HISTORY/YYYY/MM/commands/elektra/` | `YYYY-MM-DD_elektra_[feature].md` |
| CURRENT update | `_DOCS/CURRENT/features/[feature]/SECURITY.md` | Append ELEKTRA section; do not overwrite VENOM findings |
| Patch proposals | `_DOCS/CURRENT/features/[feature]/SECURITY.md` | Listed in "Proposed Patches" section |

**Can update CURRENT:** YES — SECURITY.md, patch proposals only. ELEKTRA never applies patches itself.
**Can create HISTORY:** YES
**Cannot write:** ARCHITECTURE.md, OWNERSHIP.md, PERFORMANCE.md

---

### BLACKWIDOW (Ethical Red Team)

**Responsibility:** Adversarial runtime verification, attack scenario execution, security test harnesses.

| Output Type | Write Location | Naming |
|---|---|---|
| HISTORY artifact (report) | `_DOCS/HISTORY/YYYY/MM/commands/blackwidow/` | `YYYY-MM-DD_blackwidow_[feature-scenario].md` |
| Harness file (.js) | `_DOCS/HISTORY/YYYY/MM/audits/redteam/` | `YYYY-MM-DD_blackwidow_[scenario].harness.js` |
| CURRENT update | `_DOCS/CURRENT/features/[feature]/SECURITY.md` | Append "Red Team Findings" section |

**Can update CURRENT:** YES — SECURITY.md only, "Red Team" section
**Harness code:** HISTORY only — never in CURRENT/
**Cannot write:** ARCHITECTURE.md, OWNERSHIP.md, PERFORMANCE.md, any release gate

---

### CARNAGE (Database Migration Architect)

**Responsibility:** Migration design, RLS policies, schema changes, migration execution tracking.

| Output Type | Write Location | Naming |
|---|---|---|
| HISTORY artifact | `_DOCS/HISTORY/YYYY/MM/commands/carnage/` | `YYYY-MM-DD_carnage_[feature-migration].md` |
| SQL script | `_DOCS/HISTORY/YYYY/MM/migrations/` | `YYYY-MM-DD_[step]_[topic].sql` |
| CURRENT update | `_DOCS/CURRENT/database/rls/[feature].md` | Overwrite; RLS status per table |
| CURRENT update | `_DOCS/CURRENT/features/[feature]/ARCHITECTURE.md` | Update schema section only |

**Can update CURRENT:** YES — database/rls/ and feature ARCHITECTURE.md schema section only
**SQL scripts:** HISTORY only — `HISTORY/YYYY/MM/migrations/`
**Cannot write:** SECURITY.md (owns schema truth, not security posture), OWNERSHIP.md, PERFORMANCE.md

---

### THOR (Release Commander)

**Responsibility:** Feature release gates, readiness checks, deployment checklists.

| Output Type | Write Location | Naming |
|---|---|---|
| HISTORY artifact | `_DOCS/HISTORY/YYYY/MM/commands/thor/` | `YYYY-MM-DD_thor_[feature]-release-gate.md` |
| CURRENT update | `_DOCS/CURRENT/features/[feature]/CURRENT_STATUS.md` | Update "Release Status" section |
| Registry update | `_DOCS/REGISTRY/RELEASE_TRACKER.md` | Update feature row |

**Can update CURRENT:** YES — CURRENT_STATUS.md release section only
**Can create HISTORY:** YES
**Cannot write:** SECURITY.md, ARCHITECTURE.md, OWNERSHIP.md (THOR verifies, doesn't define)

---

### IRONMAN (Feature Ownership Mapping)

**Responsibility:** Actor/feature ownership, team accountability, ownership assertion patterns.

| Output Type | Write Location | Naming |
|---|---|---|
| HISTORY artifact | `_DOCS/HISTORY/YYYY/MM/commands/ironman/` | `YYYY-MM-DD_ironman_[feature]-ownership.md` |
| CURRENT update | `_DOCS/CURRENT/features/[feature]/OWNERSHIP.md` | Overwrite |

**Can update CURRENT:** YES — OWNERSHIP.md only
**Cannot write:** SECURITY.md, ARCHITECTURE.md, PERFORMANCE.md, release gates

---

### ARCHITECT (Repository Architecture Mapping)

**Responsibility:** Codebase topology scans, dependency maps, system architecture generation, code graph analysis.

| Output Type | Write Location | Naming |
|---|---|---|
| HISTORY artifact | `_DOCS/HISTORY/YYYY/MM/commands/architect/` | `YYYY-MM-DD_architect_[scope].md` |
| CURRENT update | `_DOCS/CURRENT/features/[feature]/ARCHITECTURE.md` | Overwrite or merge |
| CURRENT update | `_DOCS/CURRENT/platform/` | Platform-level architecture docs |
| CURRENT update | `_DOCS/CURRENT/features/[feature]/SOURCE_MAP.md` | Overwrite with latest layer map |

**Can update CURRENT:** YES — ARCHITECTURE.md, SOURCE_MAP.md, platform/ docs
**Cannot write:** SECURITY.md, OWNERSHIP.md, PERFORMANCE.md, release gates

**Special rule:** The 516 files currently in `_CANONICAL/logan/marvel/architect/` are HISTORY artifacts that were never archived. They should not live in canonical. On migration, they move to `HISTORY/2026/[month]/commands/architect/`.

---

### SPIDER-MAN (Regression Safety Net)

**Responsibility:** Test coverage audits, regression analysis, test gap identification.

| Output Type | Write Location | Naming |
|---|---|---|
| HISTORY artifact | `_DOCS/HISTORY/YYYY/MM/commands/spiderman/` | `YYYY-MM-DD_spiderman_[feature].md` |
| CURRENT update | `_DOCS/CURRENT/features/[feature]/TESTS.md` | Overwrite with latest coverage |

**Can update CURRENT:** YES — TESTS.md only
**Cannot write:** SECURITY.md, ARCHITECTURE.md, OWNERSHIP.md, release gates

---

### KRAVEN (Performance Hunter)

**Responsibility:** Query performance, bottleneck analysis, mutation cost analysis.

| Output Type | Write Location | Naming |
|---|---|---|
| HISTORY artifact | `_DOCS/HISTORY/YYYY/MM/commands/kraven/` | `YYYY-MM-DD_kraven_[feature]-[topic].md` |
| CURRENT update | `_DOCS/CURRENT/features/[feature]/PERFORMANCE.md` | Overwrite |

**Can update CURRENT:** YES — PERFORMANCE.md only

---

### LOKI (Runtime Observability)

**Responsibility:** Request tracing, execution path observation, runtime behavior documentation.

| Output Type | Write Location | Naming |
|---|---|---|
| HISTORY artifact | `_DOCS/HISTORY/YYYY/MM/commands/loki/` | `YYYY-MM-DD_loki_[feature]-runtime-trace.md` |
| CURRENT update | `_DOCS/CURRENT/features/[feature]/ARCHITECTURE.md` | Append "Runtime Trace" section |

**Can update CURRENT:** YES — ARCHITECTURE.md runtime section only

---

### DEADPOOL (Root Cause Debug)

**Responsibility:** Debug trace execution, root cause identification for specific bugs.

| Output Type | Write Location | Naming |
|---|---|---|
| HISTORY artifact | `_DOCS/HISTORY/YYYY/MM/commands/deadpool/` | `YYYY-MM-DD_deadpool_[feature]-[issue].md` |
| CURRENT update | None — debugging is always historical | N/A |

**Can update CURRENT:** NO — Debugging artifacts are inherently historical
**Cannot write any CURRENT file**

---

### LOGAN (Documentation Review)

**Responsibility:** Documentation drift detection, canonical spec maintenance, sync verification.

| Output Type | Write Location | Naming |
|---|---|---|
| HISTORY artifact | `_DOCS/HISTORY/YYYY/MM/commands/wolverine/` | Wait — see note below |
| CURRENT update | `_DOCS/CURRENT/features/[feature]/` | Any file where drift is found |
| CURRENT update | `_DOCS/CURRENT/features/[feature]/CURRENT_STATUS.md` | Update "Last Reviewed" timestamp |

**Special rule:** LOGAN is the ONLY command whose primary job is to maintain CURRENT files. Its HISTORY artifacts are drift evidence reports. All other commands produce run artifacts that Logan reviews and synthesizes.

**Can update CURRENT:** YES — any CURRENT file
**LOGAN is the gatekeeper of CURRENT/**

---

### DB (Database Analyst)

**Responsibility:** Schema snapshots, RLS audits, data correctness verification.

| Output Type | Write Location | Naming |
|---|---|---|
| HISTORY artifact | `_DOCS/HISTORY/YYYY/MM/commands/db/` | `YYYY-MM-DD_db_[topic].md` |
| CURRENT update | `_DOCS/CURRENT/database/schema/` | Schema-level current docs |
| CURRENT update | `_DOCS/CURRENT/database/rls/` | RLS current status (shared with CARNAGE) |

**Can update CURRENT:** YES — database/ section only
**Cannot write:** feature-level docs

---

### HAWKEYE (API Contract Verification)

**Responsibility:** Endpoint drift detection, API contract compliance, route audits.

| Output Type | Write Location | Naming |
|---|---|---|
| HISTORY artifact | `_DOCS/HISTORY/YYYY/MM/commands/hawkeye/` | `YYYY-MM-DD_hawkeye_[feature]-endpoints.md` |
| CURRENT update | `_DOCS/CURRENT/features/[feature]/ARCHITECTURE.md` | Append "API Surface" section |

**Can update CURRENT:** YES — ARCHITECTURE.md API section only

---

### WATCHER (Change Provenance)

**Responsibility:** Change tracking, approval audit trails, session provenance.

| Output Type | Write Location | Naming |
|---|---|---|
| HISTORY artifact | `_DOCS/HISTORY/YYYY/MM/commands/watcher/` | `YYYY-MM-DD_watcher_[scope].md` |
| CURRENT update | None — provenance is always historical | N/A |

**Can update CURRENT:** NO — WATCHER records what happened, does not define current state

---

### SENTRY (Compliance Gate)

**Responsibility:** Contract compliance review, boundary enforcement, gate verification.

| Output Type | Write Location | Naming |
|---|---|---|
| HISTORY artifact | `_DOCS/HISTORY/YYYY/MM/commands/sentry/` | `YYYY-MM-DD_sentry_[feature].md` |
| CURRENT update | `_DOCS/CURRENT/features/[feature]/AUDIT_STATUS.md` | Update compliance gate row |

**Can update CURRENT:** YES — AUDIT_STATUS.md compliance column only

---

### WOLVERINE (Planning Orchestrator)

**Responsibility:** Session planning, task routing, execution orchestration.

| Output Type | Write Location | Naming |
|---|---|---|
| Planning artifact | `_DOCS/HISTORY/YYYY/MM/planning/MM/` | `MM-NN.md` (day-sequence numbering) |
| CURRENT update | None — planning is always historical | N/A |
| Registry update | `_DOCS/REGISTRY/` | Only when ticket status changes |

**Can update CURRENT:** NO — WOLVERINE orchestrates; it does not define feature truth

---

### FALCON (iOS Parity Governance)

**Responsibility:** PWA-to-native parity tracking, iOS feature transfer documentation.

| Output Type | Write Location | Naming |
|---|---|---|
| HISTORY artifact | `_DOCS/HISTORY/YYYY/MM/commands/falcon/` | `YYYY-MM-DD_falcon_[feature]-parity.md` |
| CURRENT update | `_DOCS/CURRENT/native/parity/[feature].md` | Overwrite |

**Can update CURRENT:** YES — native/parity/ only

---

### CAPTAIN (Idea Capture)

**Responsibility:** Next-session order capture, future ideas, strategic notes.

| Output Type | Write Location | Naming |
|---|---|---|
| Idea artifact | `_DOCS/HISTORY/YYYY/MM/commands/captain/` | `YYYY-MM-DD_captain_[topic].md` |
| CURRENT update | None | N/A |

**Can update CURRENT:** NO — ideas are future possibilities, not current truth

---

### NICK FURY (Parallel Build Orchestrator, formerly Batman)

**Responsibility:** Isolated side-mission orchestration, parallel execution coordination.

| Output Type | Write Location | Naming |
|---|---|---|
| Mission summary | `_DOCS/HISTORY/YYYY/MM/commands/nickfury/` | `YYYY-MM-DD_nickfury_[mission].md` |
| CURRENT update | Delegates to constituent commands | N/A |

**Can update CURRENT:** NO — NICK FURY coordinates; constituent commands update CURRENT

---

### SESSION-SUMMARY (End-of-Session Audit Log)

**Responsibility:** Session change provenance, decision documentation, sprint summaries.

| Output Type | Write Location | Naming |
|---|---|---|
| Session summary | `_DOCS/HISTORY/YYYY/MM/session-summaries/` | `YYYY-MM-DD[_HH-MM]_[topic].md` |
| CURRENT update | None | N/A |

**Can update CURRENT:** NO — session summaries are evidence, not truth

---

## COMMAND × CURRENT WRITE PERMISSION MATRIX

| Command | SECURITY.md | ARCHITECTURE.md | OWNERSHIP.md | PERFORMANCE.md | TESTS.md | CURRENT_STATUS.md | database/ | native/ |
|---|---|---|---|---|---|---|---|---|
| VENOM | YES | NO | NO | NO | NO | NO | NO | NO |
| ELEKTRA | YES | NO | NO | NO | NO | NO | NO | NO |
| BLACKWIDOW | YES | NO | NO | NO | NO | NO | NO | NO |
| CARNAGE | NO | YES (schema) | NO | NO | NO | NO | YES | NO |
| THOR | NO | NO | NO | NO | NO | YES | NO | NO |
| IRONMAN | NO | NO | YES | NO | NO | NO | NO | NO |
| ARCHITECT | NO | YES | NO | NO | NO | NO | NO | NO |
| SPIDER-MAN | NO | NO | NO | NO | YES | NO | NO | NO |
| KRAVEN | NO | NO | NO | YES | NO | NO | NO | NO |
| LOKI | NO | YES (runtime) | NO | NO | NO | NO | NO | NO |
| DEADPOOL | NO | NO | NO | NO | NO | NO | NO | NO |
| LOGAN | YES | YES | YES | YES | YES | YES | YES | YES |
| DB | NO | NO | NO | NO | NO | NO | YES | NO |
| HAWKEYE | NO | YES (API) | NO | NO | NO | NO | NO | NO |
| WATCHER | NO | NO | NO | NO | NO | NO | NO | NO |
| SENTRY | NO | NO | NO | NO | NO | NO | NO | NO |
| WOLVERINE | NO | NO | NO | NO | NO | NO | NO | NO |
| FALCON | NO | NO | NO | NO | NO | NO | NO | YES |
| CAPTAIN | NO | NO | NO | NO | NO | NO | NO | NO |
| NICK FURY | NO | NO | NO | NO | NO | NO | NO | NO |

**LOGAN is the only command with write permission to all CURRENT files.**
**All other commands have narrow, domain-specific write permissions.**

---

## ENFORCEMENT RULES

1. A command that writes to CURRENT must add a `HISTORY_INDEX.md` entry in the feature folder pointing to its HISTORY artifact.
2. A command run must set `updates-current: yes` in its HISTORY artifact header if it touched a CURRENT file.
3. If a finding is deferred, it must appear in both the HISTORY artifact AND `REGISTRY/DEFERRED_ITEMS.md`.
4. CURRENT files must have a `Last Updated: YYYY-MM-DD` header line.
5. HISTORY files are immutable after the month closes. If a correction is needed, a new HISTORY file supersedes the old one (with `supersedes:` header pointer).
