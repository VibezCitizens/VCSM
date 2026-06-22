# Root Contracts — Navigation Index

> **This directory contains the canonical behavioral, security, and architectural contracts governing this project.**
> All 10 source files remain at this level as canonical god-files. Library subfolders are derived views only.

---

## Subfolders

| Subfolder | Contracts | Concern |
|---|---|---|
| [Agent/](Agent/INDEX.md) | ANTI_HALLUCINATION, SENIOR_DEVELOPER, REAL_WORLD_OPS, STRATEGIC_DEBRIEF, OUTPUT_MINIMIZATION | How the agent must reason, behave, and execute |
| [Security/](Security/INDEX.md) | SECURITY_ENGINEERING, FORBID_PLATFORM_OWNERS | What security rules govern the system |
| [System/](System/INDEX.md) | PROJECT_BOUNDARY_ISOLATION, SINGLE_SOURCE_ACTOR | Repository and codebase structural rules |
| [Architecture/](Architecture/INDEX.md) | ARCHITECTURE (existing, §1–14) + ARCHITECTURE_GOVERNANCE (§15–20) | Feature structure, layer contracts, server-state discipline, sprint review |
| [Plans/](Plans/INDEX.md) | CHAT_MIGRATION_PLAN | Project state documents (not enforcement contracts) |

---

## Canonical Source Files

| File | Lines | Type |
|---|---|---|
| [ANTI_HALLUCINATION_ENGINEERING_CONTRACT.md](ANTI_HALLUCINATION_ENGINEERING_CONTRACT.md) | 278 | Behavioral — evidence and investigation standards |
| [SENIOR_DEVELOPER_CONTRACT.md](SENIOR_DEVELOPER_CONTRACT.md) | 417 | Behavioral — execution quality and discipline |
| [REAL_WORLD_ENGINEERING_OPS_CONTRACT.md](REAL_WORLD_ENGINEERING_OPS_CONTRACT.md) | 264 | Behavioral — operational and product standards |
| [STRATEGIC_REALITY_DEBRIEF_CONTRACT.md](STRATEGIC_REALITY_DEBRIEF_CONTRACT.md) | 276 | Behavioral — strategic analysis methodology |
| [SECURITY_ENGINEERING_CONTRACT.md](SECURITY_ENGINEERING_CONTRACT.md) | 404 | Security — comprehensive security rules |
| [FORBID_PLATFORM_OWNERS_USAGE.md](FORBID_PLATFORM_OWNERS_USAGE.md) | 123 | Security — single-rule table prohibition |
| [PROJECT_BOUNDARY_ISOLATION_CONTRACT.md](PROJECT_BOUNDARY_ISOLATION_CONTRACT.md) | 218 | System — repository boundary isolation |
| [SINGLE_SOURCE_ACTOR_ARCHITECTURE.md](SINGLE_SOURCE_ACTOR_ARCHITECTURE.md) | 196 | System — actor identity ownership model (VCSM) |
| [OUTPUT_MINIMIZATION_CONTRACT.md](OUTPUT_MINIMIZATION_CONTRACT.md) | 95 | Behavioral — write reports to disk, return summary only |
| [ARCHITECTURE_GOVERNANCE_CONTRACT.md](ARCHITECTURE_GOVERNANCE_CONTRACT.md) | — | Architectural — sprint review, feature health metrics, server-state discipline |
| [AUTOMATED_ARCHITECTURE_ENFORCEMENT_CONTRACT.md](AUTOMATED_ARCHITECTURE_ENFORCEMENT_CONTRACT.md) | — | Architectural — automated checks, ESLint rules, CI scripts, severity matrix |
| [FEATURE_SIZE_GOVERNANCE_CONTRACT.md](FEATURE_SIZE_GOVERNANCE_CONTRACT.md) | — | Architectural — feature size thresholds, god-folder prevention, extraction rules |
| [ADAPTER_REVISION_STAMP_CONTRACT.md](ADAPTER_REVISION_STAMP_CONTRACT.md) | — | Architectural — adapter traceability stamp, blast radius, requiresDeepReview |
| [ROUTE_LAZY_BOUNDARY_CONTRACT.md](ROUTE_LAZY_BOUNDARY_CONTRACT.md) | — | Architectural — approved manifest files for React.lazy dynamic imports, forbidden targets |
| [INTERNAL_FEATURE_SELF_IMPORT_CONTRACT.md](INTERNAL_FEATURE_SELF_IMPORT_CONTRACT.md) | — | Architectural — same-feature internal imports allowed when layer direction is respected |
| [AUTH_AUTHZ_SEPARATION_CONTRACT.md](AUTH_AUTHZ_SEPARATION_CONTRACT.md) | — | Architectural/Security — authentication and authorization must never be mixed at feature, controller, DAL, hook, or screen level |
| [CHAT_MIGRATION_PLAN.md](CHAT_MIGRATION_PLAN.md) | 166 | Plan — migration state record, not a rule contract |

---

## Contract Registry

A machine-readable registry of all contracts, their canonical files, local enforcement paths, and library files is available at:

[contracts-registry.json](contracts-registry.json)

---

## Machine Reading Index

| Enforcement Point | Contract | Library File |
|---|---|---|
| Agent must not invent technical facts | ANTI_HALLUCINATION | [Agent/01-evidence-standards.md](Agent/01-evidence-standards.md) |
| All claims: Confirmed / Likely / Uncertain | ANTI_HALLUCINATION | [Agent/01-evidence-standards.md](Agent/01-evidence-standards.md) |
| Forbidden: claim ownership from folder names | ANTI_HALLUCINATION | [Agent/02-forbidden-investigation.md](Agent/02-forbidden-investigation.md) |
| Required: trace imports before declaring dead code | ANTI_HALLUCINATION | [Agent/02-forbidden-investigation.md](Agent/02-forbidden-investigation.md) |
| Reporting format: include confirmed/likely/uncertain | ANTI_HALLUCINATION | [Agent/03-integrity-reporting.md](Agent/03-integrity-reporting.md) |
| Act as senior engineer; no guessing blindly | SENIOR_DEVELOPER | [Agent/04-senior-identity.md](Agent/04-senior-identity.md) |
| Understand architecture before editing code | SENIOR_DEVELOPER | [Agent/04-senior-identity.md](Agent/04-senior-identity.md) |
| Do not touch working code unnecessarily | SENIOR_DEVELOPER | [Agent/05-senior-execution.md](Agent/05-senior-execution.md) |
| Make smallest correct change only | SENIOR_DEVELOPER | [Agent/05-senior-execution.md](Agent/05-senior-execution.md) |
| Production-ready code only; no messy patches | SENIOR_DEVELOPER | [Agent/06-senior-quality.md](Agent/06-senior-quality.md) |
| Feature must solve real user problem | REAL_WORLD_OPS | [Agent/07-product-operations.md](Agent/07-product-operations.md) |
| System must support operational recovery | REAL_WORLD_OPS | [Agent/07-product-operations.md](Agent/07-product-operations.md) |
| Structured logging required; never log secrets | REAL_WORLD_OPS | [Agent/08-observability-release.md](Agent/08-observability-release.md) |
| Database migrations must be reversible | REAL_WORLD_OPS | [Agent/08-observability-release.md](Agent/08-observability-release.md) |
| Analysis must model real-world behavior, not ideal | STRATEGIC_DEBRIEF | [Agent/09-debrief-models.md](Agent/09-debrief-models.md) |
| Debrief output: 10-item structure required | STRATEGIC_DEBRIEF | [Agent/10-debrief-output.md](Agent/10-debrief-output.md) |
| Least privilege on all actors, services, components | SECURITY_ENGINEERING | [Security/01-core-principles.md](Security/01-core-principles.md) |
| Server enforces all authorization; client is untrusted | SECURITY_ENGINEERING | [Security/01-core-principles.md](Security/01-core-principles.md) |
| RLS required on all user-facing tables | SECURITY_ENGINEERING | [Security/02-auth-authorization.md](Security/02-auth-authorization.md) |
| No .select('*') on sensitive tables | SECURITY_ENGINEERING | [Security/03-database-data.md](Security/03-database-data.md) |
| Validate all external inputs at trust boundary | SECURITY_ENGINEERING | [Security/04-input-api-secrets.md](Security/04-input-api-secrets.md) |
| No secrets in code, logs, or config files | SECURITY_ENGINEERING | [Security/04-input-api-secrets.md](Security/04-input-api-secrets.md) |
| Security review before shipping auth changes | SECURITY_ENGINEERING | [Security/05-logging-code-review.md](Security/05-logging-code-review.md) |
| platform.platform_owners forbidden in app domain logic | FORBID_PLATFORM_OWNERS | [Security/06-platform-owners-prohibition.md](Security/06-platform-owners-prohibition.md) |
| Work must remain within declared project root | PROJECT_BOUNDARY | [System/01-boundary-core.md](System/01-boundary-core.md) |
| Scope label must be declared before any execution | PROJECT_BOUNDARY | [System/02-boundary-scope.md](System/02-boundary-scope.md) |
| Engine changes require explicit ENGINE scope declaration | PROJECT_BOUNDARY | [System/03-boundary-enforcement.md](System/03-boundary-enforcement.md) |
| Only IdentityProvider may write actor state | SINGLE_SOURCE_ACTOR | [System/04-actor-core-rule.md](System/04-actor-core-rule.md) |
| All consumers must read from useIdentity() | SINGLE_SOURCE_ACTOR | [System/04-actor-core-rule.md](System/04-actor-core-rule.md) |
| No feature may store current actor independently | SINGLE_SOURCE_ACTOR | [System/05-actor-ten-rules.md](System/05-actor-ten-rules.md) |
| Commands must write reports to disk, not print them to chat | OUTPUT_MINIMIZATION | [Agent/11-output-minimization.md](Agent/11-output-minimization.md) |
| Chat output hard limit: 500 tokens | OUTPUT_MINIMIZATION | [Agent/11-output-minimization.md](Agent/11-output-minimization.md) |
| Full report content only shown on explicit user request | OUTPUT_MINIMIZATION | [Agent/11-output-minimization.md](Agent/11-output-minimization.md) |
| Architecture review required every sprint/bi-weekly cycle | ARCHITECTURE_GOVERNANCE | [Architecture/15-sprint-review-rule.md](Architecture/15-sprint-review-rule.md) |
| Feature not merge-ready if locked contract violated without exception | ARCHITECTURE_GOVERNANCE | [Architecture/15-sprint-review-rule.md](Architecture/15-sprint-review-rule.md) |
| 14 health metrics must be tracked per feature | ARCHITECTURE_GOVERNANCE | [Architecture/16-feature-health-metrics.md](Architecture/16-feature-health-metrics.md) |
| Max folder depth: 3 levels below feature root | ARCHITECTURE_GOVERNANCE | [Architecture/17-folder-depth-enforcement.md](Architecture/17-folder-depth-enforcement.md) |
| React Query required for all server reads and mutations | ARCHITECTURE_GOVERNANCE | [Architecture/18-react-query-server-state.md](Architecture/18-react-query-server-state.md) |
| No new useState+useEffect server-fetch patterns | ARCHITECTURE_GOVERNANCE | [Architecture/18-react-query-server-state.md](Architecture/18-react-query-server-state.md) |
| No new DAL-level TTL caches without approval | ARCHITECTURE_GOVERNANCE | [Architecture/19-ttl-cache-deprecation.md](Architecture/19-ttl-cache-deprecation.md) |
| Zustand allowed only for UI-only ephemeral state | ARCHITECTURE_GOVERNANCE | [Architecture/20-zustand-scope.md](Architecture/20-zustand-scope.md) |
| Zustand must not store server data, ownership, or permission truth | ARCHITECTURE_GOVERNANCE | [Architecture/20-zustand-scope.md](Architecture/20-zustand-scope.md) |
| Architecture contracts must have automated checks before human review | AUTOMATED_ENFORCEMENT | [Architecture/21-automated-checks-rule.md](Architecture/21-automated-checks-rule.md) |
| ESLint must enforce import boundaries, forbidden layer imports, naming | AUTOMATED_ENFORCEMENT | [Architecture/22-eslint-enforcement-rule.md](Architecture/22-eslint-enforcement-rule.md) |
| Scripts check file size, depth, feature counts, `.select('*')`, React Query | AUTOMATED_ENFORCEMENT | [Architecture/23-architecture-script-rule.md](Architecture/23-architecture-script-rule.md) |
| ERROR: cross-feature imports, Supabase in UI/hooks, `.select('*')`, 300+ lines | AUTOMATED_ENFORCEMENT | [Architecture/24-enforcement-philosophy.md](Architecture/24-enforcement-philosophy.md) |
| WARNING: 250+ lines, 100+ files in feature, TTL cache, manual server hooks | AUTOMATED_ENFORCEMENT | [Architecture/24-enforcement-philosophy.md](Architecture/24-enforcement-philosophy.md) |
| Feature must not grow without architectural review | FEATURE_SIZE_GOVERNANCE | [Architecture/25-mega-feature-prevention-rule.md](Architecture/25-mega-feature-prevention-rule.md) |
| 0–50 healthy · 51–100 monitor · 101–150 review · 151+ extraction · 200+ blocked · 300+ critical | FEATURE_SIZE_GOVERNANCE | [Architecture/26-feature-size-thresholds.md](Architecture/26-feature-size-thresholds.md) |
| At 100 files: health review; at 150: extraction plan; at 200: no new capability | FEATURE_SIZE_GOVERNANCE | [Architecture/27-feature-review-actions.md](Architecture/27-feature-review-actions.md) |
| Feature with 3+ god-folder signs requires immediate extraction plan | FEATURE_SIZE_GOVERNANCE | [Architecture/28-god-folder-definition.md](Architecture/28-god-folder-definition.md) |
| Extraction complete only when new feature has adapter and no circular imports | FEATURE_SIZE_GOVERNANCE | [Architecture/29-extraction-rule.md](Architecture/29-extraction-rule.md) |
| Every adapter file must include @adapter revision stamp | ADAPTER_REVISION_STAMP | [Architecture/30-adapter-revision-rule.md](Architecture/30-adapter-revision-rule.md) |
| @blastRadius critical adapter modified without THOR gate is MERGE_BLOCKED | ADAPTER_REVISION_STAMP | [Architecture/30-adapter-revision-rule.md](Architecture/30-adapter-revision-rule.md) |
| @requiresDeepReview true adapter must not be modified without deep review | ADAPTER_REVISION_STAMP | [Architecture/30-adapter-revision-rule.md](Architecture/30-adapter-revision-rule.md) |
| Dynamic imports only in lazyApp.jsx and lazyPublic.jsx | ROUTE_LAZY_BOUNDARY | [Architecture/31-route-lazy-boundary.md](Architecture/31-route-lazy-boundary.md) |
| Route manifests must never lazy-import DAL, models, hooks, or internal components | ROUTE_LAZY_BOUNDARY | [Architecture/31-route-lazy-boundary.md](Architecture/31-route-lazy-boundary.md) |
| Lazy-imported screen must be on adapter public surface or route surface manifest | ROUTE_LAZY_BOUNDARY | [Architecture/31-route-lazy-boundary.md](Architecture/31-route-lazy-boundary.md) |
| Adapter boundary protects external consumers — same-feature internal imports allowed | INTERNAL_FEATURE_SELF_IMPORT | [Architecture/32-internal-feature-self-import.md](Architecture/32-internal-feature-self-import.md) |
| Internal imports must follow layer direction: screens → hooks → controllers → models → DAL | INTERNAL_FEATURE_SELF_IMPORT | [Architecture/32-internal-feature-self-import.md](Architecture/32-internal-feature-self-import.md) |
| Lower layer importing upper layer within same feature is ERROR | INTERNAL_FEATURE_SELF_IMPORT | [Architecture/32-internal-feature-self-import.md](Architecture/32-internal-feature-self-import.md) |
| Auth and authorization must never be mixed in the same feature, controller, DAL, hook, or screen | AUTH_AUTHZ_SEPARATION | [Architecture/33-auth-authz-separation.md](Architecture/33-auth-authz-separation.md) |
| Auth scope: login, logout, registration, session hydration — must not check ownership or permissions | AUTH_AUTHZ_SEPARATION | [Architecture/33-auth-authz-separation.md](Architecture/33-auth-authz-separation.md) |
| Authorization scope: ownership checks, permission gates — must not call supabase.auth.* or manage sessions | AUTH_AUTHZ_SEPARATION | [Architecture/33-auth-authz-separation.md](Architecture/33-auth-authz-separation.md) |
| Mixed feature containing both auth flow and permission gates is ERROR | AUTH_AUTHZ_SEPARATION | [Architecture/33-auth-authz-separation.md](Architecture/33-auth-authz-separation.md) |

---

## Planning Documents

| File | Purpose |
|---|---|
| [ROOT_SECTION_MAP.md](ROOT_SECTION_MAP.md) | Phase 1 — all 10 files mapped and classified |
| [ROOT_VS_GOVERNANCE_REPORT.md](ROOT_VS_GOVERNANCE_REPORT.md) | Phase 4 — architecture vs governance classification |
| [ROOT_SPLIT_PLAN.md](ROOT_SPLIT_PLAN.md) | Phase 5 — migration plan and output structure |

---

## Reading Order

### Start here if asking: "What must the agent do?"
1. [Agent/04-senior-identity.md](Agent/04-senior-identity.md) — core identity and truthfulness
2. [Agent/01-evidence-standards.md](Agent/01-evidence-standards.md) — evidence classification
3. [Agent/02-forbidden-investigation.md](Agent/02-forbidden-investigation.md) — forbidden behaviors
4. [Agent/05-senior-execution.md](Agent/05-senior-execution.md) — execution discipline

### Start here if asking: "What security rules apply?"
1. [Security/01-core-principles.md](Security/01-core-principles.md) — philosophy and core principles
2. [Security/02-auth-authorization.md](Security/02-auth-authorization.md) — authentication and authorization
3. [Security/03-database-data.md](Security/03-database-data.md) — database and data protection

### Start here if asking: "What are the project boundary rules?"
1. [System/01-boundary-core.md](System/01-boundary-core.md) — what the boundaries are
2. [System/02-boundary-scope.md](System/02-boundary-scope.md) — how to declare scope
3. [System/03-boundary-enforcement.md](System/03-boundary-enforcement.md) — enforcement rules

---

## Architecture Gap Note

[Plans/01-chat-migration.md](Plans/01-chat-migration.md) contains 4 ARCHITECTURE decisions (chat engine owns schema, no shared tables, no multi-tenant tables, future extraction boundaries) that currently live only in a plan document. These must be transferred to a dedicated `engines/chat/ARCHITECTURE.md` contract when chat engine contracts are formally authored.
