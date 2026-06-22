# Architecture Section Map
## Phase 1 — Read and Classify

> **Source:** ARCHITECTURE.md (1271 lines)
> **Generated for:** Contract library decomposition planning
> **Rule:** Do not modify ARCHITECTURE.md until ARCHITECTURE_SPLIT_PLAN.md is approved

---

| Section | Current Location | Category | Suggested File |
|---|---|---|---|
| Document metadata (type, readers, scope, status, change rule) | Lines 1–8 | global-rules | 01-core-principles.md |
| System design goals (modular, predictable, scalable, refactorable, safe) | Lines 9–20 | architectural-principles | 01-core-principles.md |
| Agent Behavioral Rules (SKILL.md references) | Lines 23–36 | global-rules | INDEX.md |
| Table of Contents | Lines 39–76 | meta | INDEX.md |
| Machine Reading Index | Lines 79–99 | meta | INDEX.md |
| Layer Responsibility Summary table | Lines 103–115 | layer-contracts | 03-layer-contracts.md |
| §1.1 Import Path Rule | Lines 119–133 | global-rules | 01-core-principles.md |
| §1.2 Module Build Order Rule | Lines 136–153 | global-rules | 01-core-principles.md |
| §1.3 Identity Surface Rule | Lines 156–178 | identity-rules | 02-identity-contract.md |
| §1.4 Owner Meaning Rule | Lines 180–190 | identity-rules | 02-identity-contract.md |
| §2.1 Data Access Layer (DAL) Contract | Lines 194–280 | layer-contracts | 03-layer-contracts.md |
| §2.2 Model Contract | Lines 283–309 | layer-contracts | 03-layer-contracts.md |
| §2.3 Controller Contract | Lines 312–338 | layer-contracts | 03-layer-contracts.md |
| §2.4 Hook Contract | Lines 341–367 | layer-contracts | 03-layer-contracts.md |
| §2.5 Component Contract | Lines 370–398 | layer-contracts | 03-layer-contracts.md |
| §2.6 View Screen Contract | Lines 401–428 | layer-contracts | 03-layer-contracts.md |
| §2.7 Final Screen Contract | Lines 431–457 | layer-contracts | 03-layer-contracts.md |
| §2.8 Resolver Contract | Lines 459–513 | resolver-rules | 04-resolver-contract.md |
| §3 Shared Layer Contract | Lines 516–558 | layer-contracts | 03-layer-contracts.md |
| §4 Structural Integrity Rules preamble | Lines 560–565 | structural-integrity-rules | 10-structural-integrity.md |
| §4.1 File Size & Decomposition Rule | Lines 566–663 | structural-integrity-rules | 10-structural-integrity.md |
| §4.2 Single Responsibility File Rule | Lines 666–701 | structural-integrity-rules | 10-structural-integrity.md |
| §4.3 Controller Fan-Out Rule | Lines 703–720 | structural-integrity-rules | 10-structural-integrity.md |
| §4.4 Maximum Folder Depth Rule | Lines 722–762 | structural-integrity-rules | 10-structural-integrity.md |
| §4.5 File Naming Rule | Lines 764–784 | naming-rules | 11-naming-conventions.md |
| §5.1 Feature Containment Rule | Lines 789–816 | feature-boundary-rules | 05-feature-boundaries.md |
| §5.2 Cross-Feature Boundary Rule | Lines 819–837 | feature-boundary-rules | 05-feature-boundaries.md |
| §5.3 Adapter Contract | Lines 840–879 | adapter-rules | 07-adapter-contract.md |
| §5.4 Adapter Import Rule | Lines 882–899 | adapter-rules | 07-adapter-contract.md |
| §5.5 Screen-to-Feature Access Rule | Lines 901–919 | adapter-rules | 07-adapter-contract.md |
| §5.6 Recommended Feature Structure | Lines 922–952 | feature-boundary-rules | 05-feature-boundaries.md |
| §5.7 Module Contract — Architecture Hierarchy Definition | Lines 954–973 | module-rules | 06-module-contract.md |
| §5.7 Module Ownership Rule | Lines 975–986 | module-rules | 06-module-contract.md |
| §5.7 Module Boundary Rule | Lines 988–1001 | module-rules | 06-module-contract.md |
| §5.7 Module Dependency Rule | Lines 1003–1019 | module-rules | 06-module-contract.md |
| §5.7 Module Structure Rule | Lines 1021–1044 | module-rules | 06-module-contract.md |
| §5.7 Module Isolation Rule | Lines 1046–1067 | module-rules | 06-module-contract.md |
| §5.7 Module Documentation Rule | Lines 1069–1086 | module-rules | 06-module-contract.md |
| §5.7 Module Architectural Principle | Lines 1088–1103 | module-rules | 06-module-contract.md |
| §6.1 Dependency Direction Rule | Lines 1106–1134 | dependency-rules | 08-dependency-rules.md |
| §6.2 Feature Dependency Rule | Lines 1136–1144 | dependency-rules | 08-dependency-rules.md |
| §6.3 Circular Dependency Rule | Lines 1148–1167 | dependency-rules | 08-dependency-rules.md |
| §6.4 DAG Principle | Lines 1170–1177 | dependency-rules | 08-dependency-rules.md |
| §7 UI Ownership Rule | Lines 1180–1255 | ui-ownership-rules | 09-ui-ownership.md |
| §8 UI Purity Rule | New addition — 2026-06-05 | ui-purity-rules | 13-ui-purity-rule.md |
| §9 Styling Ownership Rule | New addition — 2026-06-05 | styling-ownership-rules | 14-styling-ownership-rule.md |
| §10 Final Architectural Principles | Lines 1257–1271 | architectural-principles | 12-final-principles.md |

---

## Category Summary

| Category | Section Count | Target File |
|---|---|---|
| global-rules | 4 | 01-core-principles.md + INDEX.md |
| identity-rules | 2 | 02-identity-contract.md |
| layer-contracts | 10 | 03-layer-contracts.md |
| resolver-rules | 1 | 04-resolver-contract.md |
| feature-boundary-rules | 3 | 05-feature-boundaries.md |
| module-rules | 8 | 06-module-contract.md |
| adapter-rules | 3 | 07-adapter-contract.md |
| dependency-rules | 4 | 08-dependency-rules.md |
| ui-ownership-rules | 1 | 09-ui-ownership.md |
| ui-purity-rules | 1 | 13-ui-purity-rule.md |
| styling-ownership-rules | 1 | 14-styling-ownership-rule.md |
| structural-integrity-rules | 5 | 10-structural-integrity.md |
| naming-rules | 1 | 11-naming-conventions.md |
| architectural-principles | 2 | 12-final-principles.md |
| meta | 3 | INDEX.md |

---

## Extraction Notes

- §5.3–5.5 (Adapter Contract, Adapter Import Rule, Screen-to-Feature Access Rule) appear physically inside §5 (Feature Boundary Rules) but represent a distinct adapter boundary contract. They are extracted to 07-adapter-contract.md.
- §5.7 (Module Contract) also appears physically inside §5 but owns a separate architectural concept. It is extracted to 06-module-contract.md.
- §2.8 (Resolver Contract) appears physically inside §2 (Core Layer Contracts) but represents a DI pattern distinct from the standard layer stack. It is extracted to 04-resolver-contract.md.
- §3 (Shared Layer Contract) is a companion to §2 (Core Layer Contracts) and remains in 03-layer-contracts.md.
- The Machine Reading Index and Table of Contents are meta-navigation tools, not architectural rules. They belong in INDEX.md.
- The Agent Behavioral Rules section contains only cross-references to SKILL.md files. It belongs in INDEX.md, not in any rule file.
