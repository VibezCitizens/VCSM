# Root Contracts — Section Map
## Phase 1 — Read and Classify

> **Sources:** 9 files at CONTRACTS/ root
> **Generated for:** Contract library decomposition planning

---

## Structural Decision

Four subfolders are warranted based on contract concern:

| Subfolder | Files | Concern |
|---|---|---|
| `Agent/` | ANTI_HALLUCINATION, SENIOR_DEVELOPER, REAL_WORLD_OPS, STRATEGIC_DEBRIEF | How the agent must reason, behave, and execute |
| `Security/` | SECURITY_ENGINEERING, FORBID_PLATFORM_OWNERS | What security rules govern the system |
| `System/` | PROJECT_BOUNDARY_ISOLATION, SINGLE_SOURCE_ACTOR | Structural and boundary contracts for the repository |
| `Plans/` | CHAT_MIGRATION_PLAN | Project state documents (not behavioral contracts) |

---

## ANTI_HALLUCINATION_ENGINEERING_CONTRACT.md

| Section | Lines | Category | Suggested File |
|---|---|---|---|
| Preamble — purpose, what it eliminates | 1–15 | agent-behavior | Agent/01-evidence-standards.md |
| Core Principle — evidence types | 17–34 | agent-behavior | Agent/01-evidence-standards.md |
| Evidence Classification — Confirmed / Likely / Uncertain | 38–77 | agent-behavior | Agent/01-evidence-standards.md |
| Forbidden Behaviors | 80–92 | agent-behavior | Agent/02-forbidden-investigation.md |
| Required Investigation Process (5 steps) | 96–153 | agent-behavior | Agent/02-forbidden-investigation.md |
| Root Cause Analysis Rule | 157–165 | agent-behavior | Agent/02-forbidden-investigation.md |
| Migration Verification Rule | 169–178 | agent-behavior | Agent/02-forbidden-investigation.md |
| Dead Code Verification Rule | 182–196 | agent-behavior | Agent/02-forbidden-investigation.md |
| Architecture Claims Rule | 199–213 | agent-behavior | Agent/03-integrity-reporting.md |
| Uncertainty Honesty Rule | 216–227 | agent-behavior | Agent/03-integrity-reporting.md |
| Reporting Format | 230–238 | agent-behavior | Agent/03-integrity-reporting.md |
| Engineering Integrity Standard | 242–250 | agent-behavior | Agent/03-integrity-reporting.md |
| Command Behavior | 254–266 | agent-behavior | Agent/03-integrity-reporting.md |
| Expected Outcome | 269–278 | agent-behavior | Agent/03-integrity-reporting.md |

---

## CHAT_MIGRATION_PLAN.md

| Section | Lines | Category | Suggested File |
|---|---|---|---|
| Locked Target (Option A identity model) | 1–19 | project-plan | Plans/01-chat-migration.md |
| Code Structure Ownership | 22–30 | project-plan | Plans/01-chat-migration.md |
| Current Status table | 31–50 | project-plan | Plans/01-chat-migration.md |
| Phase 1 — Wentrex First (COMPLETE) | 52–62 | project-plan | Plans/01-chat-migration.md |
| Phase 2 — Explicit actor_source (COMPLETE) | 63–90 | project-plan | Plans/01-chat-migration.md |
| Phase 3 — Freeze Wentrex (COMPLETE) | 91–109 | project-plan | Plans/01-chat-migration.md |
| Phase 4 — VC Migration Last | 111–128 | project-plan | Plans/01-chat-migration.md |
| Future Extraction Boundaries (queue, realtime) | 129–154 | project-plan | Plans/01-chat-migration.md |
| Non-Negotiables | 159–166 | project-plan | Plans/01-chat-migration.md |

> **Note:** CHAT_MIGRATION_PLAN.md is a project state document, not a behavioral contract. It records completed migration phases and deferred scope. It is placed in Plans/ as-is with no further decomposition.

---

## FORBID_PLATFORM_OWNERS_USAGE.md

| Section | Lines | Category | Suggested File |
|---|---|---|---|
| Rule Name / Status / Scope | 1–6 | security-prohibition | Security/06-platform-owners-prohibition.md |
| Core Rule | 8–11 | security-prohibition | Security/06-platform-owners-prohibition.md |
| Forbidden Table | 13–19 | security-prohibition | Security/06-platform-owners-prohibition.md |
| Must NOT Be Used By (full list) | 21–38 | security-prohibition | Security/06-platform-owners-prohibition.md |
| Allowed Use | 40–50 | security-prohibition | Security/06-platform-owners-prohibition.md |
| Not an Input To (full list) | 52–64 | security-prohibition | Security/06-platform-owners-prohibition.md |
| Required Alternatives | 66–80 | security-prohibition | Security/06-platform-owners-prohibition.md |
| Explicit Prohibition + Forbidden Examples | 82–96 | security-prohibition | Security/06-platform-owners-prohibition.md |
| Enforcement | 99–101 | security-prohibition | Security/06-platform-owners-prohibition.md |
| Review Check (grep patterns) | 103–116 | security-prohibition | Security/06-platform-owners-prohibition.md |
| Final Principle | 118–122 | security-prohibition | Security/06-platform-owners-prohibition.md |

> **Note:** FORBID_PLATFORM_OWNERS_USAGE.md is a single-rule contract focused enough to remain a single library file.

---

## PROJECT_BOUNDARY_ISOLATION_CONTRACT.md

| Section | Lines | Category | Suggested File |
|---|---|---|---|
| Purpose | 1–9 | boundary-rule | System/01-boundary-core.md |
| Protected Project Roots | 11–22 | boundary-rule | System/01-boundary-core.md |
| Core Rule | 24–38 | boundary-rule | System/01-boundary-core.md |
| Cross-Boundary Modification Rule | 40–50 | boundary-rule | System/01-boundary-core.md |
| Allowed Scope Labels | 52–70 | boundary-rule | System/02-boundary-scope.md |
| Default Assumption | 72–79 | boundary-rule | System/02-boundary-scope.md |
| Engine Rule | 85–97 | boundary-rule | System/03-boundary-enforcement.md |
| Traffic Rule | 100–106 | boundary-rule | System/03-boundary-enforcement.md |
| No Silent Refactors Across Roots | 108–122 | boundary-rule | System/03-boundary-enforcement.md |
| Documentation Scope Rule | 124–136 | boundary-rule | System/03-boundary-enforcement.md |
| Debugging Scope Rule | 138–148 | boundary-rule | System/03-boundary-enforcement.md |
| Database Rule | 150–157 | boundary-rule | System/03-boundary-enforcement.md |
| Planning Rule | 159–169 | boundary-rule | System/03-boundary-enforcement.md |
| Command Integration Rule | 171–191 | boundary-rule | System/03-boundary-enforcement.md |
| Violation Rule | 193–207 | boundary-rule | System/03-boundary-enforcement.md |
| Command Principle | 209–218 | boundary-rule | System/03-boundary-enforcement.md |

---

## REAL_WORLD_ENGINEERING_OPS_CONTRACT.md

| Section | Lines | Category | Suggested File |
|---|---|---|---|
| Preamble + supplements list | 1–16 | ops-contract | Agent/07-product-operations.md |
| 1. Product Decision Contract | 17–37 | ops-contract | Agent/07-product-operations.md |
| 2. Operational Reality Contract | 39–65 | ops-contract | Agent/07-product-operations.md |
| Domain Ownership | 188–200 | ops-contract | Agent/07-product-operations.md |
| Incident Preparedness | 202–219 | ops-contract | Agent/07-product-operations.md |
| 3. Observability Contract | 67–118 | ops-contract | Agent/08-observability-release.md |
| 4. Release Discipline Contract | 120–140 | ops-contract | Agent/08-observability-release.md |
| 5. Developer Experience Contract | 142–166 | ops-contract | Agent/08-observability-release.md |
| Platform Evolution Awareness | 168–185 | ops-contract | Agent/08-observability-release.md |
| Engineering Culture Principles | 221–233 | ops-contract | Agent/08-observability-release.md |
| Command Behavior | 235–251 | ops-contract | Agent/08-observability-release.md |
| Expected Outcome | 253–264 | ops-contract | Agent/08-observability-release.md |

---

## SECURITY_ENGINEERING_CONTRACT.md

| Section | Lines | Category | Suggested File |
|---|---|---|---|
| Preamble (purpose, production-grade) | 1–7 | security | Security/01-core-principles.md |
| Security Philosophy | 9–23 | security | Security/01-core-principles.md |
| Core Security Principles (Least Privilege, Trust Boundaries, Server Authority, Defense in Depth) | 25–81 | security | Security/01-core-principles.md |
| Authentication Security | 84–100 | security | Security/02-auth-authorization.md |
| Authorization Security | 102–118 | security | Security/02-auth-authorization.md |
| Database Security | 120–143 | security | Security/03-database-data.md |
| Data Protection | 145–163 | security | Security/03-database-data.md |
| Input Validation | 165–188 | security | Security/04-input-api-secrets.md |
| API Security | 190–200 | security | Security/04-input-api-secrets.md |
| Secrets Management | 202–218 | security | Security/04-input-api-secrets.md |
| Logging and Auditing | 220–239 | security | Security/05-logging-code-review.md |
| Messaging and Realtime Security | 242–251 | security | Security/05-logging-code-review.md |
| File Upload Security | 253–267 | security | Security/05-logging-code-review.md |
| Third-Party Integration Security | 270–286 | security | Security/05-logging-code-review.md |
| Infrastructure Security | 288–297 | security | Security/05-logging-code-review.md |
| Code Security | 299–315 | security | Security/05-logging-code-review.md |
| Security Review Requirements | 317–332 | security | Security/05-logging-code-review.md |
| Incident Preparedness | 334–341 | security | Security/05-logging-code-review.md |
| Expected Workflow for Secure Development | 343–356 | security | Security/05-logging-code-review.md |
| What Must Never Happen | 358–369 | security | Security/05-logging-code-review.md |
| Command Behavior | 371–389 | security | Security/05-logging-code-review.md |
| Expected Security Standard | 391–404 | security | Security/05-logging-code-review.md |

---

## SENIOR_DEVELOPER_CONTRACT.md

| Section | Lines | Category | Suggested File |
|---|---|---|---|
| Preamble — standard definition | 1–22 | agent-behavior | Agent/04-senior-identity.md |
| Core Identity | 24–38 | agent-behavior | Agent/04-senior-identity.md |
| Truthfulness Rule | 40–56 | agent-behavior | Agent/04-senior-identity.md |
| No Fake Confidence Rule | 58–79 | agent-behavior | Agent/04-senior-identity.md |
| Architecture First Rule | 81–102 | agent-behavior | Agent/04-senior-identity.md |
| Preserve Working Systems Rule | 104–120 | agent-behavior | Agent/05-senior-execution.md |
| Minimal Necessary Change Rule | 122–135 | agent-behavior | Agent/05-senior-execution.md |
| Full Impact Awareness Rule | 137–151 | agent-behavior | Agent/05-senior-execution.md |
| Layer Respect Rule | 153–168 | agent-behavior | Agent/05-senior-execution.md |
| No Silent Assumption Rule | 305–318 | agent-behavior | Agent/05-senior-execution.md |
| Senior Quality Rule | 171–192 | agent-behavior | Agent/06-senior-quality.md |
| Naming and Structure Rule | 194–210 | agent-behavior | Agent/06-senior-quality.md |
| Security and Safety Rule | 212–232 | agent-behavior | Agent/06-senior-quality.md |
| Database and Schema Rule | 234–251 | agent-behavior | Agent/06-senior-quality.md |
| Migration Discipline Rule | 253–271 | agent-behavior | Agent/06-senior-quality.md |
| Documentation Truth Rule | 273–283 | agent-behavior | Agent/06-senior-quality.md |
| Testing Rule | 285–302 | agent-behavior | Agent/06-senior-quality.md |
| Reporting Rule | 320–332 | agent-behavior | Agent/06-senior-quality.md |
| Premium Senior Behavior Standard | 334–365 | agent-behavior | Agent/06-senior-quality.md |
| What to Never Do | 367–382 | agent-behavior | Agent/06-senior-quality.md |
| Expected Working Process | 384–396 | agent-behavior | Agent/06-senior-quality.md |
| Command Behavior | 398–416 | agent-behavior | Agent/06-senior-quality.md |

---

## SINGLE_SOURCE_ACTOR_ARCHITECTURE.md

| Section | Lines | Category | Suggested File |
|---|---|---|---|
| Rule Name / Status / Scope / Source of truth | 1–6 | identity-architecture | System/04-actor-core-rule.md |
| Goal | 8–11 | identity-architecture | System/04-actor-core-rule.md |
| Core Rule (what must NOT own actor state) | 13–33 | identity-architecture | System/04-actor-core-rule.md |
| Rules 1–5 (Identity Provider is only writer through version-guard) | 35–105 | identity-architecture | System/05-actor-ten-rules.md |
| Rules 6–10 (debug stores through permanent architectural rule) | 107–173 | identity-architecture | System/05-actor-ten-rules.md |
| Final Principle | 177–181 | identity-architecture | System/06-actor-enforcement.md |
| Enforcement | 183–187 | identity-architecture | System/06-actor-enforcement.md |
| Review Check | 189–196 | identity-architecture | System/06-actor-enforcement.md |

---

## STRATEGIC_REALITY_DEBRIEF_CONTRACT.md

| Section | Lines | Category | Suggested File |
|---|---|---|---|
| Preamble (analysis goals, beyond code) | 1–15 | agent-behavior | Agent/09-debrief-models.md |
| Core Principle | 17–30 | agent-behavior | Agent/09-debrief-models.md |
| Anti-Bias Rule | 32–52 | agent-behavior | Agent/09-debrief-models.md |
| Real Human Interaction Model | 54–70 | agent-behavior | Agent/09-debrief-models.md |
| Organizational Reality Model | 72–92 | agent-behavior | Agent/09-debrief-models.md |
| Product Evolution Thinking | 94–112 | agent-behavior | Agent/09-debrief-models.md |
| Platform Thinking | 114–130 | agent-behavior | Agent/10-debrief-output.md |
| Real Market Context | 132–145 | agent-behavior | Agent/10-debrief-output.md |
| Operational Reality | 147–162 | agent-behavior | Agent/10-debrief-output.md |
| Bias Detection | 164–187 | agent-behavior | Agent/10-debrief-output.md |
| Strategic Risk Identification | 189–200 | agent-behavior | Agent/10-debrief-output.md |
| Product Evolution Opportunities | 202–215 | agent-behavior | Agent/10-debrief-output.md |
| Debrief Output Structure | 217–231 | agent-behavior | Agent/10-debrief-output.md |
| Tone and Approach | 233–245 | agent-behavior | Agent/10-debrief-output.md |
| Command Behavior | 247–263 | agent-behavior | Agent/10-debrief-output.md |
| Expected Outcome | 265–276 | agent-behavior | Agent/10-debrief-output.md |

---

## Category Summary

| Category | File Count | Section Count | Subfolder |
|---|---|---|---|
| agent-behavior | 4 | 46 | Agent/ |
| security | 2 | 22 | Security/ |
| boundary-rule | 1 | 16 | System/ |
| identity-architecture | 1 | 8 | System/ |
| project-plan | 1 | 9 | Plans/ |
