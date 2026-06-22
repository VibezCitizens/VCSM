# Root Contracts — Split Plan
## Phase 5 — Build Final Migration Plan

> **Sources:** 9 files at CONTRACTS/ root
> **Goal:** Decompose 9 root-level contract files into a modular, navigable contract library using four subfolders

---

## Output Structure

```
CONTRACTS/
├── INDEX.md                                    ← root navigation hub (new)
├── ROOT_SECTION_MAP.md                         ← planning doc (new, this phase)
├── ROOT_VS_GOVERNANCE_REPORT.md                ← planning doc (new, this phase)
├── ROOT_SPLIT_PLAN.md                          ← this file (new, this phase)
│
├── ANTI_HALLUCINATION_ENGINEERING_CONTRACT.md  ← canonical god-file (untouched)
├── CHAT_MIGRATION_PLAN.md                      ← canonical source (untouched)
├── FORBID_PLATFORM_OWNERS_USAGE.md             ← canonical god-file (untouched)
├── PROJECT_BOUNDARY_ISOLATION_CONTRACT.md      ← canonical god-file (untouched)
├── REAL_WORLD_ENGINEERING_OPS_CONTRACT.md      ← canonical god-file (untouched)
├── SECURITY_ENGINEERING_CONTRACT.md            ← canonical god-file (untouched)
├── SENIOR_DEVELOPER_CONTRACT.md               ← canonical god-file (untouched)
├── SINGLE_SOURCE_ACTOR_ARCHITECTURE.md         ← canonical god-file (untouched)
├── STRATEGIC_REALITY_DEBRIEF_CONTRACT.md       ← canonical god-file (untouched)
│
├── Agent/
│   ├── INDEX.md
│   ├── 01-evidence-standards.md               ← from ANTI_HALLUCINATION
│   ├── 02-forbidden-investigation.md           ← from ANTI_HALLUCINATION
│   ├── 03-integrity-reporting.md               ← from ANTI_HALLUCINATION
│   ├── 04-senior-identity.md                   ← from SENIOR_DEVELOPER
│   ├── 05-senior-execution.md                  ← from SENIOR_DEVELOPER
│   ├── 06-senior-quality.md                    ← from SENIOR_DEVELOPER
│   ├── 07-product-operations.md                ← from REAL_WORLD_OPS
│   ├── 08-observability-release.md             ← from REAL_WORLD_OPS
│   ├── 09-debrief-models.md                    ← from STRATEGIC_DEBRIEF
│   └── 10-debrief-output.md                    ← from STRATEGIC_DEBRIEF
│
├── Security/
│   ├── INDEX.md
│   ├── 01-core-principles.md                   ← from SECURITY_ENGINEERING
│   ├── 02-auth-authorization.md                ← from SECURITY_ENGINEERING
│   ├── 03-database-data.md                     ← from SECURITY_ENGINEERING
│   ├── 04-input-api-secrets.md                 ← from SECURITY_ENGINEERING
│   ├── 05-logging-code-review.md               ← from SECURITY_ENGINEERING
│   └── 06-platform-owners-prohibition.md       ← from FORBID_PLATFORM_OWNERS
│
├── System/
│   ├── INDEX.md
│   ├── 01-boundary-core.md                     ← from PROJECT_BOUNDARY
│   ├── 02-boundary-scope.md                    ← from PROJECT_BOUNDARY
│   ├── 03-boundary-enforcement.md              ← from PROJECT_BOUNDARY
│   ├── 04-actor-core-rule.md                   ← from SINGLE_SOURCE_ACTOR
│   ├── 05-actor-ten-rules.md                   ← from SINGLE_SOURCE_ACTOR
│   └── 06-actor-enforcement.md                 ← from SINGLE_SOURCE_ACTOR
│
└── Plans/
    ├── INDEX.md
    └── 01-chat-migration.md                    ← from CHAT_MIGRATION_PLAN
```

---

## Subfolder Decision Rationale

### Agent/
**Contains:** ANTI_HALLUCINATION, SENIOR_DEVELOPER, REAL_WORLD_OPS, STRATEGIC_DEBRIEF

These four contracts all govern the same concern: how the agent must reason, communicate, and behave while working. They share vocabulary (evidence, uncertainty, real-world grounding, minimal change) and are the primary contracts a reader needs to understand what the agent is required to do. Grouping them makes that intent visible from the directory tree.

**10 library files** from 4 sources. Source files remain at CONTRACTS/ root.

---

### Security/
**Contains:** SECURITY_ENGINEERING, FORBID_PLATFORM_OWNERS

Both contracts govern security boundaries and constraints. SECURITY_ENGINEERING is comprehensive (404 lines) and benefits from domain-based decomposition. FORBID_PLATFORM_OWNERS is a single-rule prohibition that is too focused for further decomposition — it maps 1:1 to Security/06-platform-owners-prohibition.md.

**6 library files** from 2 sources. Source files remain at CONTRACTS/ root.

---

### System/
**Contains:** PROJECT_BOUNDARY_ISOLATION, SINGLE_SOURCE_ACTOR

Both contracts govern structural rules for the repository and codebase. PROJECT_BOUNDARY defines where work may reach. SINGLE_SOURCE_ACTOR defines the identity ownership model for VCSM. Neither is a behavioral contract for the agent; both define hard constraints on system structure and change scope.

**6 library files** from 2 sources. Source files remain at CONTRACTS/ root.

---

### Plans/
**Contains:** CHAT_MIGRATION_PLAN

CHAT_MIGRATION_PLAN.md is a project state document recording a multi-phase migration, not a behavioral or structural contract. It cannot be meaningfully decomposed into rules. It is placed in Plans/ to signal its nature: a historical record with current project status, not an enforcement contract.

**1 library file** from 1 source. Source file remains at CONTRACTS/ root.

---

## Migration Steps

### Step 1 — Create subfolders
Create Agent/, Security/, System/, Plans/ directories.

### Step 2 — Write subfolder INDEX files
Each subfolder gets an INDEX.md with:
- Source file list
- Library file reading order
- Machine Reading Index (enforcement points → original section → library file)
- Cross-link graph

### Step 3 — Write library files
Extract sections from canonical god-files into numbered library files.
- Navigation header (source, status, reads-before, reads-after, cross-links)
- Verbatim content — no wording changes, no rule rewrites
- No rules may be lost

### Step 4 — Write root INDEX.md
Root index references all 4 subfolders with:
- Purpose of each subfolder
- Machine Reading Index for all contracts
- Emergency escalation order

### Step 5 — Verify completeness
Verify: count of sections in SECTION_MAP equals number of sections present across all library files. Zero rules may be omitted.

---

## Canonical God-File Preservation Policy

All 9 source files remain at CONTRACTS/ root, untouched, as authoritative sources. Library files are derived views only. If source and library file ever conflict, the source file is correct.

The root INDEX.md links to both the canonical god-files and the library subfolder INDEX files so readers can choose their access mode:
- Speed-read: start at subfolder INDEX
- Deep read: read canonical god-file directly
- Enforcement trace: use Machine Reading Index in root INDEX.md

---

## Cross-Link Requirements

| From | To | Link Reason |
|---|---|---|
| Agent/01-evidence-standards.md | Agent/04-senior-identity.md | Both define Truthfulness/Uncertainty standards |
| Agent/02-forbidden-investigation.md | Agent/05-senior-execution.md | Both govern analysis scope and investigation requirements |
| Agent/04-senior-identity.md | Agent/09-debrief-models.md | Both govern analysis posture and anti-bias requirement |
| Agent/07-product-operations.md | Agent/08-observability-release.md | Same source contract, sequential reading |
| Security/01-core-principles.md | Security/02-auth-authorization.md | Defense in depth applies to auth layer |
| Security/02-auth-authorization.md | System/04-actor-core-rule.md | Authorization and actor identity model are related |
| Security/03-database-data.md | Security/06-platform-owners-prohibition.md | Both govern database access restrictions |
| System/01-boundary-core.md | System/02-boundary-scope.md | Core rule + scope labels are read in sequence |
| System/04-actor-core-rule.md | System/05-actor-ten-rules.md | Core rule is prerequisite for 10 rules |

---

## Risks

**Risk 1: CHAT_MIGRATION_PLAN embedded architecture rules.**
The Plans/ document contains 4 ARCHITECTURE rules (chat engine owns schema, no shared tables, no multi-tenant tables, future extraction boundaries). These are not enforced from Plans/ — they must be re-stated in a dedicated architecture contract when the chat engine contract is written. Until then, readers relying only on Agent/Security/System contracts will miss these rules.

**Mitigation:** Root INDEX.md contains a note calling out this gap. A follow-up task should extract these rules to a dedicated chat engine architecture contract.

**Risk 2: SENIOR_DEVELOPER and ANTI_HALLUCINATION overlap.**
Both contracts contain truthfulness and evidence standards. Readers may encounter the same principle twice. This is intentional — each contract covers it from a different angle (ANTI_HALLUCINATION focuses on technical evidence standards; SENIOR_DEVELOPER covers professional integrity). Cross-links between Agent/01 and Agent/04 make the relationship visible.

**Risk 3: GOVERNANCE rules embedded in architecture contracts.**
27 governance rules are embedded across behavioral and architectural contracts. These rules (naming conventions, review requirements, output formats) may need future extraction into a dedicated governance contract. The ROOT_VS_GOVERNANCE_REPORT.md identifies all 11 candidates.

---

## Implementation Checklist

- [x] Section maps written for all 9 files
- [x] Architecture/Governance classification complete
- [x] Subfolder decision documented
- [x] Agent/ INDEX.md written
- [x] Agent/ 01–10 library files written
- [x] Security/ INDEX.md written
- [x] Security/ 01–06 library files written
- [x] System/ INDEX.md written
- [x] System/ 01–06 library files written
- [x] Plans/ INDEX.md written
- [x] Plans/ 01 library file written
- [x] Root INDEX.md written
- [x] Completeness verification — all sections present in library files
