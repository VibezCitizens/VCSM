---
name: vcsm.contracts-summary-2026-06-08
description: Comprehensive summary of every file in ZZnotforproduction/CONTRACTS/ — all root god-files, all library subfolders, all planning documents, and two governance files
metadata:
  type: contracts-summary
  generated-by: Claude Code
  date: 2026-06-08
  scope: ZZnotforproduction/CONTRACTS/ (complete)
---

# VCSM Contracts — Complete Summary
## All Files — ZZnotforproduction/CONTRACTS/

**Generated:** 2026-06-08
**Coverage:** Every file in CONTRACTS/ root, Agent/, App/VCSM/ (top-level + all 36 feature contracts), Architecture/ (including Quicksilver/), ENGINE/ (root + Engine/ + Capability/), Platform/, Security/, System/, Plans/, plus GLOBAL_COMMAND_STATUS.md and COMMAND_DEPENDENCY_VALIDATION_REPORT.md.

---

## ROOT — Canonical God-Files and Navigation

### INDEX.md
Navigation hub for the entire CONTRACTS/ directory. Maps 10 canonical source files at root level to 5 library subfolders (Agent/, Security/, System/, Architecture/, Plans/). Contains a full machine reading index linking 30+ enforcement points to specific library files, plus a reading-order guide for three question-types: "what must the agent do?", "what security rules apply?", and "what are project boundary rules?". Notes that 4 architecture decisions from CHAT_MIGRATION_PLAN.md should eventually move to engines/chat/ARCHITECTURE.md.

### ANTI_HALLUCINATION_ENGINEERING_CONTRACT.md (278 lines)
God-file defining evidence standards, forbidden investigation behaviors, and integrity reporting. Establishes the three-tier claim system (Confirmed = exact file+code+runtime path; Likely = strong but unverified; Uncertain = insufficient evidence) and the 5-step investigation process (imports, entry points, runtime path, ownership, schema usage). All agent claims about architecture must classify themselves under one of these tiers.

### SENIOR_DEVELOPER_CONTRACT.md (417 lines)
God-file governing execution identity and quality. Defines core identity (understand architecture before editing, truthfulness, no fake confidence), execution discipline (smallest correct change, preserve working systems, full impact awareness, layer respect), and production quality standards (readable/explicit/composable/testable code, naming conventions, security awareness, migration discipline, 8-step working process). Answers 5 product questions before building anything.

### REAL_WORLD_ENGINEERING_OPS_CONTRACT.md (264 lines)
God-file covering operational and product standards. Requires answering 5 product questions before building (solve real user problem, handle mistakes, handle misconfigs, support investigation, recover gracefully). Covers structured logging (never log secrets), metrics/tracing/alerting, reversible DB migrations, staged rollouts, and developer experience standards.

### STRATEGIC_REALITY_DEBRIEF_CONTRACT.md (276 lines)
God-file defining strategic analysis methodology. Analysis must model real-world behavior not ideal behavior. Includes anti-bias rule, human interaction model (users misuse systems), organizational reality model, and product evolution thinking. Requires 10-item debrief output structure covering platform thinking, market context, and bias detection (engineering/founder's/feature/security/UX bias).

### SECURITY_ENGINEERING_CONTRACT.md (404 lines)
God-file for comprehensive security rules covering all layers. Core philosophy: security is not an afterthought; every feature must have least privilege, strong isolation, safe defaults, explicit trust boundaries, defense in depth, verifiable access control. Covers authentication, authorization, RLS requirements, database security, input validation, API security, secrets management, logging, file uploads, infrastructure, and incident preparedness.

### FORBID_PLATFORM_OWNERS_USAGE.md (123 lines)
Single-rule god-file. Hard prohibition: `platform.platform_owners` must never be used by Wentrex or VCSM in any app-domain logic — including identity resolution, actor hydration, booking, feed, profile, onboarding, access derivation, UI visibility, or feature authorization. Required alternatives are `platform.user_app_access`, `platform.user_app_accounts`, `platform.user_app_actor_links`, and app/domain actor tables like `vc.actors`.

### PROJECT_BOUNDARY_ISOLATION_CONTRACT.md (218 lines)
God-file enforcing strict scope isolation across the 4 protected roots: apps/VCSM, apps/wentrex, apps/Traffic, and engines/. Core rule: work started in one root must stay in that root. Cross-root modification requires explicit scope declaration using one of 13 allowed scope labels (VCSM, WENTREX, TRAFFIC, ENGINE, multi-root combinations, FULL REPO). Violation must be reported immediately.

### SINGLE_SOURCE_ACTOR_ARCHITECTURE.md (196 lines)
God-file defining the actor identity ownership model for VCSM. Single source of truth is `identityContext.identity` via `useIdentity()`. Only IdentityProvider writes actor state. Defines 10 architecture rules including: derived consumers must never persist actor identity, actor-scoped providers must re-key on actorId, all actor-dependent queries must include actorId, switchActor() must be version-guarded, no feature-specific actor reconstruction from localStorage/auth.user/cache.

### OUTPUT_MINIMIZATION_CONTRACT.md (95 lines)
God-file requiring commands to write full reports to disk and return only path+status+counts in chat. 500-token hard limit on chat output. Detail escalation only on explicit user request ("show findings", "show report", "print report", "open report"). Superseded in enforcement by MINIMAL_SCREEN_OUTPUT_CONTRACT.md.

### ARCHITECTURE_GOVERNANCE_CONTRACT.md
God-file covering sprint review requirements, feature health metrics, and server-state discipline. Requires bi-weekly architecture review before merge. Establishes React Query as the standard server-state manager, deprecates uncoordinated DAL-level TTL caches, and restricts Zustand to UI-only ephemeral state. Defines 14 measurable health metrics per feature.

### CHAT_MIGRATION_PLAN.md (166 lines)
Project state document (not an enforcement contract). Tracks the shared chat migration from per-app implementations to `engines/chat`. Phases 1–3 (Wentrex on engine, actor_source columns, freeze Wentrex) are COMPLETE. Phase 4 (VC migration) is NOT STARTED. Contains 4 architecture decisions that should eventually move to engines/chat/ARCHITECTURE.md.

### MINIMAL_SCREEN_OUTPUT_CONTRACT.md
Supersedes OUTPUT_MINIMIZATION_CONTRACT.md. Commands must NOT reprint report contents in chat. Maximum 15 lines of chat output after a report is written. Required format: COMMAND COMPLETE, Status, Report path, Additional Files Updated, Summary Counts, "Open report for full details." Appending SCREEN_OUTPUT_CONTRACT_VIOLATION is required if exceeded.

### ROOT_SECTION_MAP.md
Phase 1 planning document mapping all 9 original root files to 4 subfolders. Classifies 146 rules: 63 ARCHITECTURE, 27 GOVERNANCE, 50 BEHAVIORAL, 6 PROJECT-STATE. Identifies which rules belong in Agent/, Security/, System/, or Architecture/ subfolders.

### ROOT_SPLIT_PLAN.md
Phase 5 migration plan for decomposing 9 root god-files into library subfolders. Maps: Agent/ (10 files), Security/ (6 files), System/ (6 files), Plans/ (1 file). Canonical sources remain untouched. Documents risks: section reference drift (LOW), duplication divergence (MEDIUM), reader confusion (LOW).

### ROOT_VS_GOVERNANCE_REPORT.md
Phase 4 report classifying per-contract rules as ARCHITECTURE vs GOVERNANCE vs BORDERLINE. Provides aggregate counts per contract and identifies 11 governance rule candidates for future extraction. Governance rules are rules that define how the system must be maintained (numerical limits, naming conventions, process requirements).

---

## Agent/ — Behavioral Library (Source: 5 God-Files)

### Agent/INDEX.md
Navigation hub for the Agent/ subfolder. Maps 5 source contracts to 11 library files. Provides reading order by source contract and a machine reading index linking enforcement points to specific library files.

### Agent/01-evidence-standards.md
Evidence tier definitions: Confirmed requires exact file + code + runtime path; Likely is strong but not fully verified; Uncertain means insufficient evidence exists. The agent must never invent technical facts and must classify every architecture claim under one of these tiers.

### Agent/02-forbidden-investigation.md
Defines forbidden behaviors: inventing architecture, assuming ownership from folder names, declaring dead code without tracing all imports, asserting a feature is unused without checking entry points. Specifies the mandatory 5-step investigation process for any architecture claim.

### Agent/03-integrity-reporting.md
Architecture claims require engine setup verification and actual import tracing. Reports must include the Confirmed/Likely/Uncertain classification for each claim. Truth takes precedence over confidence — never project false certainty.

### Agent/04-senior-identity.md
Core identity: act as a premium senior developer. Foundational rules are understand architecture before editing, truthfulness, no fake confidence, architecture-first approach. Never make a change without understanding its full impact.

### Agent/05-senior-execution.md
Execution discipline rules: preserve working systems, make the smallest correct change, maintain full impact awareness across all affected files and layers, respect layer boundaries, never make silent assumptions about how things work.

### Agent/06-senior-quality.md
Production-ready code standards: readable, explicit, composable, testable. Layer-encoded naming conventions. Security awareness in all code. Migration discipline. Defines the 8-step working process from reading to verification.

### Agent/07-product-operations.md
Before building anything, answer 5 product questions about real user problems and operational reality. Systems must handle mistakes, misconfigs, and failures gracefully. Domain ownership and incident preparedness are core operational requirements.

### Agent/08-observability-release.md
Structured logging required (never log secrets). Metrics, tracing, and alerting requirements. Database migrations must be reversible. Staged rollouts required. Developer experience standards covering tooling and local environment quality.

### Agent/09-debrief-models.md
Analysis must model real-world behavior, not ideal behavior. Anti-bias rule prevents false optimism in analysis. Human interaction model: users misuse, misunderstand, and work around systems. Organizational reality model: teams make tradeoffs and carry technical debt.

### Agent/10-debrief-output.md
Platform thinking and market context required in strategic debriefs. Identifies 5 bias types to detect: engineering bias, founder's bias, feature bias, security bias, UX bias. Requires 10-item debrief output structure covering strategic risks, competitive reality, and user behavior modeling.

### Agent/11-output-minimization.md
Commands must write full reports to disk and return only the receipt in chat. Maximum 15 lines of chat output. Forbidden in chat: findings, evidence, code snippets, recommendations, key findings sections, architecture maps, dependency trees. Full content only on explicit user request.

---

## App/VCSM/ — Feature Contract Library

### App/VCSM/README.md
Purpose and update rules for the VCSM feature contract library. Defines 6 contract status values: CLEAN (no violations), VIOLATIONS (active architectural issues), SPLIT_CANDIDATE (oversized, needs decomposition), STUB (placeholder), FROZEN (do not modify), DEPRECATED (removed). Current violation summary: 36 total violations across 4 features (dashboard 23, profiles 18, wanders 8+, wanderex partial).

### App/VCSM/BIDIRECTIONAL_DEPENDENCIES.md
Classifies all 15 bidirectional dependency pairs found in the VCSM codebase. Classifications: 7 LEGITIMATE (architectural coupling), 4 CSS-LEAK (styling imported across boundaries), 2 DAL-VIOLATION (DAL accessed across feature boundaries), 1 GAS-PRICES-SPLIT (system post split needed), 1 SHARED-MODEL-LEAK (model file shared across features). Identifies which pairs become unidirectional after remediation and links to implementation tickets.

### App/VCSM/DEPENDENCY_DAG.md
Full 7-layer Directed Acyclic Graph of VCSM features. Lists 12 confirmed architectural defects (layer violations). Classifies 9 bidirectional cycles as SAFE (legitimate architectural coupling). DAG must remain acyclic; any new cycle is a defect requiring resolution.

### App/VCSM/FEATURE_INDEX.md
Index of all 37 VCSM features with status and dependency ranks. Status breakdown: 18 CLEAN, 4 SPLIT_CANDIDATE, 4 VIOLATIONS, 2 FROZEN, 5 STUB, 1 DEPRECATED. Tracks inbound and outbound dependency counts to identify high-coupling features (profiles: 110 outbound, dashboard: 23 violations).

### App/VCSM/RISK_REGISTER.md
9 active architectural risks. CRITICAL: RISK-001 profiles split (374 files, 18 violations, extraction planned), RISK-002 dashboard split (258 files, 23 violations, extraction planned). HIGH: RISK-003 post modules extraction, RISK-008 DAL ownership mistakes. MEDIUM: RISK-005 settings fan-out, RISK-006 chat realtime coupling, RISK-007 booking state machine, RISK-009 wanders violations. LOW-MONITORED: RISK-004 social/feed/notifications coupling.

### App/VCSM/SHARED_BOUNDARIES.md
Defines what each shared layer folder may contain: shared/types (cross-feature domain types), shared/components (domain-neutral primitives), shared/hooks (domain-neutral hooks), shared/lib (utilities), shared/styles (design tokens, global CSS), shared/config (constants). Forbidden examples for each. App/ layer boundaries: providers, setup, routes, guards only.

### App/VCSM/features/ (36 feature contracts)

Each feature contract is a structured document with: contract status, file count, folder depth, dependencies, dependency violations count, and notes. Summary of notable features:

**actors** — Manages actor CRUD and kind-dispatch. Dependency surface: identity, profiles, vport. Clean except for potential isActorOwner pattern risk flagged by BLACKWIDOW.

**ads** — Ad display and targeting. Stub-level coverage (ARCHITECT + VENOM + BW only).

**analytics** — Event tracking and telemetry. Stub-level coverage.

**auth** — Authentication and session management. ELEKTRA run. Critical bootstrap path; auth-critical surfaces need continued monitoring. Depends on identity, profiles, actors.

**block** — Block/unblock between actors. Clean, low complexity.

**booking** — End-to-end booking state machine. ELEKTRA + LOGAN run. TICKET-BOOKING-RPC-001 DONE (session-bound customer_actor_id, null linkPath). Medium risk (state machine complexity).

**chat** — Messaging feature in VCSM. ELEKTRA run (no LOGAN yet). Depends on engines/chat via resolver pattern.

**dashboard** — CRITICAL, 258 files, 23 violations, SPLIT_CANDIDATE. Only feature with FULL COVERAGE (ARCHITECT + VENOM + BW + ELEKTRA + LOGAN + IRONMAN + HAWKEYE + SPIDER-MAN). Needs extraction into discrete modules.

**debug** — Dev-only debug panels. Located in zNOTFORPRODUCTION/debuggers/, never ships to production. 

**explore** — Discovery browsing. Depends on feed, profiles, social. TICKET-ACTOR-SEARCH-SEC-001 IN PROGRESS (7 app patches done, isUuid + viewerActorId still open).

**feed** — Main content feed. Depends on post, social, profiles. Feed participation is actor-agnostic per identity contract.

**hydration** — Actor hydration and identity bootstrap. ARCHITECT + VENOM + BW only.

**identity** — IdentityProvider and actor switching. LOGAN run. HIGH priority for ELEKTRA. Sole writer of actor truth.

**initiation** — App initialization sequence. ARCHITECT + VENOM + BW only.

**invite** — Invite flow. Recent refactor to product-based system (commit fd09b38). ARCHITECT + VENOM + BW only.

**join** — Onboarding join flow. ARCHITECT + VENOM + BW only.

**legal** — Terms, privacy, legal pages. ARCHITECT + VENOM + BW only.

**media** — Media asset management. TICKET-PLATFORM-RLS-001 OPEN (media_assets {public} policy cleanup deferred). ARCHITECT + VCSM + BW only.

**moderation** — Report and moderation flows. LOGAN run. TICKET-MODERATION-REPORTER-CLEANUP-001 DONE (reporterActorId removed from hook, reporter derived from useIdentity). P0 ELEKTRA priority.

**notifications** — Notification inbox and delivery. LOGAN run. TICKET-ARCH-NOTI-SESSION-001 DONE (session guard in publish.js + DB BEFORE INSERT trigger). P0 ELEKTRA priority.

**onboarding** — Onboarding completion flow. LOGAN run. P0 ELEKTRA priority (kind-branching).

**portfolio** — Provider portfolio management. ARCHITECT + VENOM + BW only.

**post** — Post creation and management. ARCHITECT + VENOM + BW only.

**professional** — Professional service listing. ARCHITECT + VENOM + BW only.

**profiles** — CRITICAL, 374 files, 18 violations, 110 outbound dependencies, SPLIT_CANDIDATE. LOGAN run. P0 ELEKTRA priority (30 write surfaces). Largest feature in codebase.

**public** — Public-facing unauthenticated views. ARCHITECT + VENOM + BW only.

**reviews** — Review and rating system. ARCHITECT + VENOM + BW only.

**settings** — Account and app settings. LOGAN run. HIGH ELEKTRA priority (irreversible writes). Medium fan-out risk.

**shell** — Bottom nav and app shell. TICKET-BOTTOMNAV-SLUG-LEADS-ROUTE-001 IMPLEMENTED. TICKET-BOTTOMNAV-MODULE-REVIEW-001 OPEN (3 adapter boundary violations).

**social** — Follow/unfollow state machine. LOGAN run. HIGH ELEKTRA priority.

**ui** — UI component library. ARCHITECT + VENOM + BW only.

**upload** — File and media upload. LOGAN run. HIGH ELEKTRA priority. TICKET-ARCH-MONITORING-GAPS-001 PARTIAL (captureVcsmError added to upload).

**vgrid** — Virtual grid rendering. FROZEN — do not modify.

**void** — Void realm placeholder. Future 18+ anonymous realm, not yet implemented. System posts always use void:false.

**vport** — VPORT identity and management. LOGAN run. ARCHITECT + VENOM + BW + LOGAN. TICKET-VPORT-BOOKING-FEED-SECURITY-UPDATES referenced in current branch.

**wanderex** — FROZEN — do not modify.

**wanders** — FROZEN — do not modify. Medium risk (violations present).

**Css.md** — [Empty file / stub] — 1 line, no content.

---

## Architecture/ — Architecture Contract Library (Source: ARCHITECTURE.md + ARCHITECTURE_GOVERNANCE_CONTRACT.md)

### Architecture/INDEX.md
Full navigation index for 20 architecture library files (§1–14 from ARCHITECTURE.md, §15–20 from ARCHITECTURE_GOVERNANCE_CONTRACT.md). Contains the Layer Responsibility Summary table (8 rows: DAL / Model / Controller / Hook / Component / View Screen / Final Screen / Resolver — each with "answers", "may", and "must not" columns). Includes 200+ enforcement point machine reading index and full cross-link graph.

### Architecture/ARCHITECTURE_SECTION_MAP.md
Phase 1 planning document classifying all 46 sections of ARCHITECTURE.md (1271 lines) into 14 categories and mapping them to 20 library files. Establishes the rationale for each extraction boundary (e.g., resolver is in its own file because DI factory pattern is architecturally distinct from standard layer stack).

### Architecture/ARCHITECTURE_SPLIT_PLAN.md
Phase 5 migration plan for ARCHITECTURE.md decomposition. Maps 42 sections to 12 library files. Section numbers are preserved verbatim in library files to keep enforcement point references (e.g., §4.1) valid. ARCHITECTURE.md is preserved as canonical; library files are derived views only. Cross-link requirements documented between all related files.

### Architecture/ARCHITECTURE_VS_GOVERNANCE_REPORT.md
Phase 4 rule classification. 30 ARCHITECTURE rules, 4 GOVERNANCE rules, 8 BORDERLINE rules. Governance rules (file size limit, controller fan-out, folder depth, naming conventions) should remain in the architecture contract but may additionally be extracted to a future CONTRACTS/Governance/ directory. Borderline rules have architectural principles enforced via governance-form limits.

### Architecture/01-core-principles.md
System design goals (modular, predictable, scalable, refactorable, safe). Import path rule: all imports must use `@/` paths. Module build order rule (mandatory): DAL → Model → Controller → Hooks → Components → View Screen → Final Screen. These foundational rules apply before reading any layer contract.

### Architecture/02-identity-contract.md
Actor kinds: `user`, `vport` (void reserved for future use). Canonical actorId = `vc.actors.id` only — never auth.users.id or profile IDs. Active actor determines authorship, permissions, dashboard scope, inbox, profile scope. Feed participation is actor-agnostic (feed rules govern, not actor kind). Ownership determined only through `vc.actor_owners` — never inferred from profileId or userId. Identity surface = actorId + kind only. realmId is future-ready infrastructure; current separators are actorId and kind.

### Architecture/03-layer-contracts.md
Full layer responsibility definitions. DAL: thin DB adapter, explicit column projections, raw rows, no business rules, no auth logic, `.select('*')` banned. Model: pure translator, snake_case→camelCase, derives booleans, no I/O, no Supabase. Controller: owns business meaning, enforces permissions/idempotency, calls DAL and Models, no React, no routing, max 5 collaborators. Hook: UI lifecycle, calls controllers, no DAL access. Component: presentational, props-only, no business rules. View Screen: assembles hooks + components, no DAL. Final Screen: route + identity guards, chooses which View Screen to render. Shared Layer: domain-neutral only, no feature imports.

### Architecture/04-resolver-contract.md
DI factory pattern for shared engines. Resolvers live in `resolvers/` subfolder, file names end with `.resolver.js`. Wired only through `setup.js` at app startup. Treated as DAL-equivalent privilege (may query Supabase directly). Must never be imported by components, hooks, screens, or controllers at runtime. Must never be called outside of setup.js DI wiring.

### Architecture/05-feature-boundaries.md
Feature containment rule: all feature logic (DAL, Model, Controller, Hooks, Components, Screens) must live inside the feature folder. Cross-feature boundary rule: no direct imports of internal feature files from outside the feature. Recommended feature structure: adapters/ dal/ model/ controller/ hooks/ components/ screens/ resolvers/ setup.js.

### Architecture/06-module-contract.md
Module = capability boundary inside a feature. Hierarchy: Application → Feature → Module → Behavior → Layer. Module ownership rule: one module answers one capability question. Module boundary rule: modules are internal; cross-feature access still uses adapters. Module dependency rule: one-way inside a feature, no internal module cross-import. Module isolation rule: no duplication of rules or DAL across modules.

### Architecture/07-adapter-contract.md
Adapters are the only cross-feature import surface. May re-export hooks, components, and view screens. Must never export DAL, models, or controllers. Screen-to-feature access rule: screens must import from a feature's adapter — no direct internal imports. All external feature access must go through the adapter.

### Architecture/08-dependency-rules.md
Dependency direction rule: screens → features → shared → core (one-way only). Feature dependency rule: features depend only on shared/core; inter-feature dependency uses adapters. Circular dependency rule: no cycles — extract to shared instead. DAG principle: the system must remain a Directed Acyclic Graph. Approved path aliases: @i18n, @identity, @hydration, @chat, @reviews, @portfolio, @booking, @media, @notifications, @debuggers.

### Architecture/09-ui-ownership.md
UI components belong to the owning feature domain. Cross-feature UI access through adapters only. Shared UI components must be domain-neutral — if a UI component has domain meaning, it belongs inside a feature's adapters, not in shared.

### Architecture/10-structural-integrity.md
File size hard limit: 300 lines. Single responsibility per file. Controller fan-out max: 5 external collaborators. Max folder depth: 3 levels below feature root. Decomposition must follow architectural layer boundaries, not arbitrary grouping.

### Architecture/11-naming-conventions.md
Layer-encoded file naming: `.dal.js` (data access), `.model.js` (domain shape), `.controller.js` (business logic), `use*` (hooks), `.adapter.js` (public surface), `.resolver.js` (DI factory), `.view.jsx` or `ViewScreen.jsx` (view screens), `Screen.jsx` (final screens).

### Architecture/12-final-principles.md
12 system axioms including: Security lives in RLS, Meaning lives in Controllers, Shape lives in Models, Timing lives in Hooks, Composition lives in Screens, Public boundaries live in Adapters, Shared = domain-neutral, Data access = dumb/explicit/boring. Architecture grows horizontally (more features) not vertically (deeper nesting).

### Architecture/13-ui-purity-rule.md
Screens and components must only render state. Forbidden in screens/components: business rules, permission enforcement, Supabase queries, domain validation. Allowed: rendering, layout, controlled inputs, invoking hook handlers, conditional rendering based on state.

### Architecture/14-styling-ownership-rule.md
Design tokens required everywhere. No hardcoded colors, spacing, or z-index values in components or screens. Approved styling locations: shared/styles, shared/theme, shared/tokens, and feature CSS files. Theme change must have one source of truth.

### Architecture/15-sprint-review-rule.md
Every sprint or bi-weekly cycle must include an architecture review before merge. Review scope: new folders, changed boundaries, cross-feature imports, layer violations, adapter exports, file size, depth, server-state patterns. Merge gate: feature is not merge-ready if it violates a locked contract without a documented exception.

### Architecture/16-feature-health-metrics.md
14 required metrics per feature: file count, files >250 lines, files >300 lines, max folder depth, cross-feature import count, direct internal feature imports, adapter export violations, DAL violations, hook-to-DAL violations, UI-to-controller/DAL violations, React Query adoption %, manual server-state hooks, TTL cache count, Zustand store count. ARCHITECT and review-contract commands must track these per feature during full audits.

### Architecture/17-folder-depth-enforcement.md
Maximum folder depth is 3 levels below the feature root. Exceeding 3 levels without extracting a module or new feature is a merge-blocking violation. Violation level: MEDIUM.

### Architecture/18-react-query-server-state.md
React Query is the standard server-state manager. Required for: database reads, RPC reads, mutation lifecycle, cache invalidation, loading/error/retry state, server-derived lists/detail views. Forbidden: new manual `useState + useEffect` server-fetch patterns. Existing manual patterns must be migrated progressively. Violation level for new patterns: MEDIUM.

### Architecture/19-ttl-cache-deprecation.md
Uncoordinated DAL-level TTL caches are deprecated. No new TTL caches without explicit repository owner approval. Migration path: React Query (preferred) or centralized cache ownership. Rationale: TTL caches bypass React Query's cache coordination, create stale-read risks, make cache invalidation unpredictable. Violation level: MEDIUM.

### Architecture/20-zustand-scope.md
Zustand allowed only for UI-only ephemeral state: panel open/closed, active tab, form draft, modal state, temporary row selections. Forbidden Zustand state: server data, ownership truth (actorId, isOwner), permission truth (canEdit, roleFlags), profile data, booking data, notification inbox data, feed data. Violation level: HIGH for Zustand holding server/ownership/permission data.

### Architecture/Quicksilver/INDEX.md
Index for Quicksilver monitoring contracts. Scope: apps/quicksilver/, apps/VCSM/src/services/monitoring/, apps/VCSM/src/app/monitoring/. Two contracts: monitoring ownership model and monitoring ingest Edge Function API reference.

### Architecture/Quicksilver/01-monitoring-ownership.md
Monitoring is a platform concern owned by Quicksilver, not VCSM. VCSM is a monitoring client only — may capture and forward errors, but must not own grouping, fingerprinting, alerting, incident classification, aggregation, storage, reporting, dashboards, or retention. Allowed in VCSM: SDK wrappers, event forwarding, error boundary components, global listeners, client-side PII sanitization. Canonical source: apps/quicksilver/. VCSM/supabase/functions copy is a deployment stub only. Communication between VCSM and Quicksilver must go through HTTP, Edge Functions, RPC, or public APIs — never direct source imports.

### Architecture/Quicksilver/monitoring-ingest-error.md
Full API reference for the `POST /functions/v1/monitoring-ingest-error` Edge Function. Required fields: project_id, environment, severity, message. Optional fields include feature, module, behavior_id, route, controller, operation, user_actor_id (SHA-256 hashed before storage), session_id (SHA-256 hashed). Max payload 64 KB. Fingerprint algorithm: SHA-256 over `project_key | environment | error_name | normalized_message | top_stack_frame`. Persistence via `monitoring_ingest_error_event(p_event)` RPC only. Response codes: 200 OK, 400 INVALID_INPUT, 401 UNAUTHORIZED, 413 PAYLOAD_TOO_LARGE, 501 MONITORING_DB_MISSING, 500 PERSISTENCE_FAILED.

---

## ENGINE/ — Engine and Capability Contract Libraries (Source: enginecontract.md + capabilitycontract.md)

### ENGINE/INDEX.md
Root navigation hub for both engine contracts. Maps enginecontract.md → Engine/ subfolder (how to BUILD an engine) and capabilitycontract.md → Capability/ subfolder (how engines INTERACT). Includes machine reading index with 20 enforcement points, example workspace structure, and core principle: "Apps provide experiences. Engines provide capabilities. Shared provides primitives."

### ENGINE/ENGINE_SECTION_MAP.md
Phase 1 classification of enginecontract.md (295 lines) and capabilitycontract.md (344 lines) into two subfolders. Decision to use two subfolders based on the structural distinction between building an engine and defining how engines interact. Maps every section to a target library file.

### ENGINE/ENGINE_SPLIT_PLAN.md
Phase 5 migration plan. Engine/ subfolder has 6 library files + INDEX. Capability/ subfolder has 6 library files + INDEX. Canonical god-files (enginecontract.md, capabilitycontract.md) remain unchanged as locked authoritative contracts. Cross-link requirements between Engine/04 ↔ Capability/01 and Engine/05 ↔ Capability/04 documented.

### ENGINE/ENGINE_VS_GOVERNANCE_REPORT.md
Classification of engine contract rules. enginecontract.md: 33 ARCHITECTURE, 2 GOVERNANCE (versioning process), 0 BORDERLINE. capabilitycontract.md: 24 ARCHITECTURE, 3 GOVERNANCE (event naming, versioning process, registry documentation), 3 BORDERLINE. All governance rules appropriate in architecture contracts; none need extraction.

### ENGINE/Engine/INDEX.md
Navigation for the Engine/ subfolder. Engines are application-agnostic, deterministic, reusable. Examples: chat, notifications, search, payments, analytics. Apps consume engines; engines must never depend on apps. Reading order: definition → responsibilities → layers → public API → permissions/events → isolation/versioning.

### ENGINE/Engine/01-engine-definition.md
Engine location rule: all engines live in `/engines/<engine-name>`. Each engine is an isolated module. Engines must be headless — usable by web, mobile, admin, and background workers. Engines must prioritize domain logic and contracts, not UI.

### ENGINE/Engine/02-engine-responsibilities.md
Dependency direction: `apps → engines → shared` only. Engines own reusable domain logic (conversations, members, messages, permissions etc. for a chat engine). Engines must never contain: routing, page layouts, app navigation, auth providers, branding, app UI themes, feature flags, or app-specific business rules.

### ENGINE/Engine/03-engine-layer-contracts.md
Engine folder structure: `src/adapters/ dal/ model/ controller/ hooks/ types/`. Layer order mandatory: DAL → Model → Controller → Hooks → Adapters. DAL: explicit projections, raw rows, no permissions, no UI. Model: normalize + rename fields, no DB calls, no permissions. Controller: owns domain meaning, enforces permissions/membership/idempotency, no UI/routing. Hooks: orchestrate runtime, call controllers, no direct DB access.

### ENGINE/Engine/04-engine-public-api.md
Adapter contract: adapters define the engine's public API. May export hooks, public functions, and domain types. Must never export DAL, controllers, or models. Apps must import engines only through adapters. Stable public API examples for a chat engine: useInbox, useConversation, createConversation, sendMessage, etc.

### ENGINE/Engine/05-engine-permissions-events.md
Permission contract: engines must return explicit permission snapshots (e.g., canViewConversation, canSendMessage, canEditOwnMessage). Apps must not compute permissions themselves. Event contract: engines must emit domain events (e.g., conversation.created, message.sent). Apps may subscribe to these events.

### ENGINE/Engine/06-engine-isolation-versioning.md
Engine versioning: backward-compatible APIs required. Breaking changes must be versioned. Apps must not depend on internal engine structure. Engine isolation rule: engines must be independently testable and runnable without any app. If an engine cannot run without an app, the architecture is invalid. Core principle: Apps = experiences, Engines = capabilities, Shared = primitives.

### ENGINE/Capability/INDEX.md
Navigation for the Capability/ subfolder. A capability is a stable domain service provided by an engine. Goal: engines can collaborate without depending on each other's internals. Includes the example engine collaboration map showing chat/notifications/analytics/search event-driven interactions.

### ENGINE/Capability/01-capability-definition.md
Core rule: engines may interact only through published capabilities; engines must never import another engine's internal files. A capability is the public surface of an engine. Capability location rule: each engine exposes its capability through `engines/<engine-name>/src/adapters/`. Capability import rule: apps and engines import only through the adapter — never through internal controller/DAL paths.

### ENGINE/Capability/02-engine-communication.md
Two allowed engine-to-engine communication patterns only: (1) Capability calls — synchronous, direct, low-risk. (2) Domain events — decoupled, asynchronous, fan-out. Preferred rule: use events over direct calls when more than one downstream consumer may exist. Use direct calls only when immediately required, synchronous, no fan-out, and failure handled inline.

### ENGINE/Capability/03-capability-contracts.md
Capability output rule: must return domain-safe outputs (domain objects, result envelopes, permission snapshots, event confirmations). Must never return raw DB rows, DAL objects, internal model artifacts, or engine-private flags. Capability input rule: must accept stable domain inputs (actorId, entityId, typed payloads, domain commands). Must not require UI objects, route objects, framework props, or internal DB row types.

### ENGINE/Capability/04-event-contract.md
Every engine event must have: eventName, version, occurredAt, source, payload. Event naming format: `<noun>.<past-tense-action>` (e.g., message.sent, conversation.created, payment.completed). Avoid vague names (chat.updated, data.saved). Capability versioning rule: breaking changes require version bump, migration notes, and explicit update path. Engines must not break consuming apps silently.

### ENGINE/Capability/05-capability-ownership.md
Anti-corruption rule: consume the public capability contract, not internal assumptions. If shape translation is needed, create a translator at the boundary. Capability ownership rule: the engine that owns a capability is the sole authority on that domain; no other engine may mutate another engine's domain state except through its published capability. Failure rule: consuming engines must gracefully handle capability failure; event subscribers must be retry-safe; publishers must not block core domain unless required.

### ENGINE/Capability/06-capability-principles.md
Capability registry rule: each engine should document its public capability surface in one place (adapter file + optional CAPABILITY.md). Platform-wide principle: "Engines collaborate through contracts, not assumptions. Events decouple. Adapters protect. Ownership stays singular." Example collaboration map: VCSM and Wentrex both consume chat engine; notifications listens to chat events; analytics listens to chat + notifications + payments events — no engine imports another engine's internals.

---

## Platform/ — Platform Architecture Contract Library (Source: platformcontract.md)

### Platform/INDEX.md
Navigation for the Platform contract. Scope: entire platform workspace. Three primary layers: Apps, Engines, Shared. Purpose guarantees: modular architecture, cross-app reuse, safe multi-product development, deterministic dependency flow, compatibility across platforms. Machine reading index with 15 enforcement points. Full cross-link graph between all 6 library files.

### Platform/01-platform-structure.md
All code must live within the platform root structure: `VC/apps/ engines/ shared/ contract/`. No code may exist outside these boundaries. The platform is composed of exactly 3 layers with strict responsibility and dependency direction.

### Platform/02-layer-responsibilities.md
Apps layer (`apps/<app-name>`): routing, layouts, branding, product-specific UI, feature composition, policy adapters, user experience flows. Apps must not depend on other apps. Engines layer (`engines/<engine-name>`): reusable domain capabilities, must not contain product-specific logic. Shared layer (`shared/<module-name>`): domain-neutral primitives (types, utilities, generic UI, infrastructure helpers). Shared must never depend on apps or engines.

### Platform/03-dependency-rules.md
Dependency direction: `apps → engines → shared` only. Platform must remain a DAG. App isolation rule: apps must be fully independent — no cross-app imports. Engine isolation rule: engines must not depend on any specific app — if an engine imports from an app, the architecture is invalid. Shared isolation rule: shared must not contain product logic, engine orchestration, or business rules.

### Platform/04-engine-architecture.md
Every engine must follow the layered architecture defined in enginecontract.md. Layer order: DAL → Model → Controller → Hooks → Adapters. Adapters define the public surface. Apps must consume engines only through adapters.

### Platform/05-app-architecture.md
App internal structure: routes/, screens/, features/, providers/, layouts/, policy/. Apps assemble domain experiences using engines and must never implement engine responsibilities internally. Platform routing rule: routing exists only in apps; engines must never define routes. Platform deployment rule: each app deploys independently; engines are distributed as packages consumed during app builds.

### Platform/06-platform-principles.md
Platform event model: engines may emit domain events; apps may subscribe; apps must not emit engine-level domain events. Platform ownership model: Apps = experiences, Engines = capabilities, Shared = primitives — no layer may assume another layer's responsibility. Platform scaling model: new apps follow same structure; capabilities reused not duplicated. Enforcement rule: any code violating this contract must be refactored; boundaries must remain visible in the filesystem. Platform principle: "Structure prevents chaos. Boundaries enable scale. Capabilities outlive products."

---

## Security/ — Security Contract Library (Source: SECURITY_ENGINEERING_CONTRACT.md + FORBID_PLATFORM_OWNERS_USAGE.md)

### Security/INDEX.md
Navigation for security contracts. Two source contracts: SECURITY_ENGINEERING_CONTRACT.md (404 lines, comprehensive security rules) and FORBID_PLATFORM_OWNERS_USAGE.md (123 lines, single-rule prohibition). Machine reading index with 15 enforcement points. Cross-link graph connecting database security, auth/authorization, and actor identity contracts.

### Security/01-core-principles.md
Security philosophy: security is not an afterthought. Every feature requires least privilege, strong isolation, safe defaults, explicit trust boundaries, defense in depth, and verifiable access control. Four core principles: (1) Least Privilege — minimum permissions for every actor/service/component. (2) Trust Boundaries — validate everything from browsers, mobile clients, query params, request bodies, cookies. (3) Server Authority — server/database always enforces rules; frontend checks are UX only. (4) Defense in Depth — security at API validation, controller, database constraints, RLS, audit logging, and monitoring layers.

### Security/02-auth-authorization.md
Authentication rules: secure password handling, strong session management, secure token usage, no session leakage, no credentials in client code. Never expose service keys, admin tokens, or database secrets. Authorization rules: roles verified in backend; access control in database policies; role escalation must be impossible; permission checks must be explicit. Never assume a user is allowed just because the UI allowed it — always re-verify on the server.

### Security/03-database-data.md
Database must enforce RLS on all user-facing tables, foreign key constraints, input validation, proper indexing, and restricted schemas. Never allow direct access to sensitive tables without RLS. Data protection: HTTPS everywhere, no sensitive data in plaintext, encrypt at rest and in transit, minimize retention. Never store passwords, access tokens, private keys, or secrets in logs or client-visible storage.

### Security/04-input-api-secrets.md
All external inputs must be validated: request bodies, query params, path params, uploaded files, message content, form inputs. Protect against SQL injection, XSS, command injection, path traversal, file upload abuse, malformed JSON. API security: identity verification on authenticated endpoints, rate limits on sensitive endpoints, validation before database access, sanitized error responses (never raw DB errors). Secrets management: never hardcode secrets — use env vars, secret managers, or infrastructure configuration.

### Security/05-logging-code-review.md
Log all security-sensitive actions (login attempts, password changes, permission changes, moderation actions, identity resolution, data deletion). Logs must not expose passwords, tokens, or secrets. Messaging/realtime: users may only access their own conversations; inbox access must be actor-scoped. File uploads: validate MIME type and extension, scan files, store outside execution paths. Remove debug routes and console logs before production. Security review checklist before merge: auth bypass, authorization flaws, IDOR, privilege escalation, injection, missing RLS, exposed secrets.

### Security/06-platform-owners-prohibition.md
Hard rule: `platform.platform_owners` is forbidden in all VCSM and Wentrex app-domain logic. Must not be used by any app controller, DAL, hook, adapter, service, context provider, route guard, feature flag, or UI logic. Forbidden examples: branching on platform_owners for feature access, using platform_owners to bypass identity checks, using platform_owners in booking/admin/business rules. Required alternatives: `platform.user_app_access`, `platform.user_app_accounts`, `vc.actors`, and other app-domain tables. Review check: grep for `platform.platform_owners`, `.from("platform_owners")`, `.from('platform_owners')` in app code and reject if found.

---

## System/ — System Contract Library (Source: PROJECT_BOUNDARY_ISOLATION_CONTRACT.md + SINGLE_SOURCE_ACTOR_ARCHITECTURE.md)

### System/INDEX.md
Navigation for system contracts. Two source contracts: PROJECT_BOUNDARY_ISOLATION_CONTRACT.md (218 lines, repository boundary isolation) and SINGLE_SOURCE_ACTOR_ARCHITECTURE.md (196 lines, actor identity ownership). Machine reading index with 12 enforcement points. Cross-link graph connecting boundary core → scope → enforcement and actor core → ten rules → enforcement.

### System/01-boundary-core.md
Contract enforces strict project-boundary isolation. Protected roots: apps/VCSM, apps/wentrex, apps/Traffic, engines/. Core rule: modifications must remain inside the declared root. Cross-boundary modification forbidden unless: (1) task explicitly states multi-root modification, (2) execution plan declares multi-root scope, or (3) explicit user approval given before changes begin.

### System/02-boundary-scope.md
13 allowed scope labels: VCSM, WENTREX, TRAFFIC, ENGINE, VCSM+ENGINE, WENTREX+ENGINE, TRAFFIC+ENGINE, BOTH APPS, BOTH APPS+ENGINE, VCSM+TRAFFIC, WENTREX+TRAFFIC, VCSM+WENTREX+TRAFFIC, FULL REPO. Default assumption is always single-root isolation. No command may silently expand scope beyond the current project root.

### System/03-boundary-enforcement.md
Engine rule: engine files must not be modified just because an issue appears in an app — requires explicit ENGINE scope declaration. Traffic rule: Traffic is a separate boundary from VCSM and Wentrex. No silent refactors across roots (no file moves, renames, code sharing, refactoring into/out of engines without approval). Documentation and debugging must follow the same boundary as implementation. All commands (Wolverine, Logan, Deadpool, DB, Loki, Kraven, Venom, Carnage, Ironman, Thor, Captain, Session Summary, Contract Reviewer) must obey this contract.

### System/04-actor-core-rule.md
Goal: eliminate actor-switch desync. Single runtime source of truth: `identityContext.identity` via `useIdentity()`. Everything else must be derived, never independently stored. The following must NOT own actor state: feed viewer store, screen-local useState(actorId), memoized actor snapshots that survive switches, route-scoped viewer models, local cache objects, debug stores treated as live state.

### System/05-actor-ten-rules.md
10 architecture rules: (1) Only IdentityProvider writes actor state via setIdentity(). (2) Derived consumers must never persist actor identity — use `const { identity } = useIdentity()` not `useState(identity?.actorId)`. (3) Actor-scoped providers must re-key by actorId. (4) All actor-dependent queries must include actorId in the cache key. (5) switchActor() must be version-guarded to prevent race conditions. (6) Debug stores must subscribe, not own actor state. (7) No feature-specific actor reconstruction from auth.user, localStorage, previous route data, or feed rows. (8) Force actor-bound cleanup on switch (clear pending requests, invalidate caches, reset feature-local state). (9) Development invariant checker to catch engineActorId != identity.actorId divergence. (10) Permanent rule: no feature in VCSM may store "current actor" independently of IdentityProvider.

### System/06-actor-enforcement.md
Final principle: "IdentityProvider owns actor truth. Everything else derives from it. Nothing else stores it as live state." Any new code introducing independent actor state store, actor ref, or actor-scoped local state that does not reset on identity?.actorId change is a contract violation. Review check: grep for useState with actorId initialization, useRef holding actorId, useMemo with empty deps building actor state, any store/context holding actorId independently, query keys omitting actorId for actor-dependent data.

---

## Plans/ — Project State Documents

### Plans/INDEX.md
Plans/ contains historical records and current project state — not enforcement contracts. Currently holds one file: 01-chat-migration.md. Status summary: Phases 1–3 COMPLETE, Phase 4 NOT STARTED. Notes 4 architecture decisions embedded in the plan that need extraction to engines/chat/ARCHITECTURE.md.

### Plans/01-chat-migration.md
Full shared chat migration state document. Long-term target: Option A actor model (`ActorSource = 'learning' | 'vc'`, `ActorRef = { actorSource, actorId }`). Phase 1 (Wentrex on engine) COMPLETE. Phase 2 (explicit actor_source columns on 8 first-wave tables) COMPLETE. Phase 3 (freeze Wentrex, RLS on all 16 chat tables, zero console output, app-local code deleted — communication feature now 9 files) COMPLETE. Phase 4 (VC migration) NOT STARTED. Future extraction boundaries identified: engines/queue (outbox event processing), engines/realtime (Supabase Postgres Changes subscriptions). Non-negotiables: Wentrex is the reference, VC adapts to the frozen shared model, phases 1–3 are frozen.

---

## Governance Files

### ZZnotforproduction/APPS/VCSM/GLOBAL_COMMAND_STATUS.md
Generated 2026-06-05 by DR. STRANGE. Tracks command run coverage across all 37 VCSM features. Platform command coverage summary: ARCHITECT 100% FRESH, VENOM 100% FRESH, BLACKWIDOW 100% FRESH, ELEKTRA 16% (6/37 features), LOGAN 35% (13/37), IRONMAN 3%, HAWKEYE 3%, SPIDER-MAN 3%, LOKI 0% (never), KRAVEN 0% (never), CARNAGE 0% (never), SENTRY 0% (never), THOR 0% (0 features ELIGIBLE). Coverage tiers: 1 feature FULL COVERAGE (dashboard), 8 PARTIAL+BEHAVIOR, 3 PARTIAL+ELEKTRA, 2 PARTIAL+BOTH, 21 SECURITY BASELINE. ELEKTRA P0 queue: moderation, notifications, onboarding, profiles, services. Key gaps: LOKI absence means read amplification and N+1 patterns undetected platform-wide; THOR has never run (platform not release-eligible).

### ZZnotforproduction/GOVERNANCE/outputs/COMMAND_DEPENDENCY_VALIDATION_REPORT.md
Generated 2026-06-05. READ-ONLY AUDIT of 18 commands. Validates claim: "ARCHITECT is the discovery authority. Specialists consume ARCHITECT outputs rather than independently discovering repository structure." Verdict: TRUE. ARCHITECT is the sole discovery authority — no command independently discovers repository structure. 15 of 18 commands have explicit ARCHITECT gates (13 mandatory preflight, 4 inherited via upstream). HAWKEYE implicit via full upstream chain. Vision is ARCHITECT_PARTIAL (depends on LOKI, not ARCHITECT directly). No violations found. Canonical run order: ARCHITECT → Venom → BlackWidow → ELEKTRA → Loki → Kraven → Carnage → Falcon → WinterSoldier → Logan → review-contract → SHIELD → Sentry → PROFESSOR X → AvengersAssemble → THOR.

---

## Master Quick Reference Table

| File | Path | Type | Key Rule / Purpose |
|---|---|---|---|
| INDEX.md | CONTRACTS/ | Navigation | Root hub; 10 god-files → 5 subfolders; machine reading index |
| ANTI_HALLUCINATION_ENGINEERING_CONTRACT.md | CONTRACTS/ | God-file | Confirmed/Likely/Uncertain evidence tiers; 5-step investigation |
| SENIOR_DEVELOPER_CONTRACT.md | CONTRACTS/ | God-file | Smallest correct change; understand architecture before editing |
| REAL_WORLD_ENGINEERING_OPS_CONTRACT.md | CONTRACTS/ | God-file | Answer 5 product questions; operational recovery; structured logging |
| STRATEGIC_REALITY_DEBRIEF_CONTRACT.md | CONTRACTS/ | God-file | 10-item debrief; real-world behavior modeling; bias detection |
| SECURITY_ENGINEERING_CONTRACT.md | CONTRACTS/ | God-file | Defense in depth; RLS required; server authority; least privilege |
| FORBID_PLATFORM_OWNERS_USAGE.md | CONTRACTS/ | God-file | platform.platform_owners forbidden in app code — use platform.user_app_access |
| PROJECT_BOUNDARY_ISOLATION_CONTRACT.md | CONTRACTS/ | God-file | Work stays in declared root; 13 scope labels; explicit approval for cross-root |
| SINGLE_SOURCE_ACTOR_ARCHITECTURE.md | CONTRACTS/ | God-file | useIdentity() is sole actor source; 10 rules against independent actor state |
| OUTPUT_MINIMIZATION_CONTRACT.md | CONTRACTS/ | God-file | Write to disk; return receipt only; superseded by MINIMAL_SCREEN_OUTPUT_CONTRACT |
| ARCHITECTURE_GOVERNANCE_CONTRACT.md | CONTRACTS/ | God-file | React Query standard; TTL deprecated; Zustand UI-only; bi-weekly review |
| CHAT_MIGRATION_PLAN.md | CONTRACTS/ | Plan | Phases 1–3 COMPLETE; Phase 4 (VC) NOT STARTED |
| MINIMAL_SCREEN_OUTPUT_CONTRACT.md | CONTRACTS/ | God-file | Max 15 chat lines; SCREEN_OUTPUT_CONTRACT_VIOLATION if exceeded |
| ROOT_SECTION_MAP.md | CONTRACTS/ | Planning | 146 rules classified; 63 ARCH / 27 GOV / 50 BEHAV / 6 PROJECT-STATE |
| ROOT_SPLIT_PLAN.md | CONTRACTS/ | Planning | Migration plan: 9 root files → Agent/ Security/ System/ Plans/ |
| ROOT_VS_GOVERNANCE_REPORT.md | CONTRACTS/ | Planning | Per-contract ARCH/GOV/BORDERLINE classification; 11 governance leakage candidates |
| Agent/INDEX.md | CONTRACTS/Agent/ | Navigation | 5 source contracts → 11 library files; machine reading index |
| Agent/01-evidence-standards.md | CONTRACTS/Agent/ | Library | Confirmed/Likely/Uncertain definitions |
| Agent/02-forbidden-investigation.md | CONTRACTS/Agent/ | Library | Forbidden behaviors; 5-step investigation |
| Agent/03-integrity-reporting.md | CONTRACTS/Agent/ | Library | Reporting format; truth over confidence |
| Agent/04-senior-identity.md | CONTRACTS/Agent/ | Library | Core senior developer identity |
| Agent/05-senior-execution.md | CONTRACTS/Agent/ | Library | Execution discipline; smallest correct change |
| Agent/06-senior-quality.md | CONTRACTS/Agent/ | Library | Production-ready code; 8-step working process |
| Agent/07-product-operations.md | CONTRACTS/Agent/ | Library | 5 product questions; operational reality |
| Agent/08-observability-release.md | CONTRACTS/Agent/ | Library | Logging; reversible migrations; staged rollouts |
| Agent/09-debrief-models.md | CONTRACTS/Agent/ | Library | Real-world behavior model; anti-bias rule |
| Agent/10-debrief-output.md | CONTRACTS/Agent/ | Library | Platform thinking; 10-item debrief structure |
| Agent/11-output-minimization.md | CONTRACTS/Agent/ | Library | Report to disk; receipt only in chat; 15-line limit |
| App/VCSM/README.md | CONTRACTS/App/VCSM/ | Navigation | Contract status definitions; 36 total violations |
| App/VCSM/BIDIRECTIONAL_DEPENDENCIES.md | CONTRACTS/App/VCSM/ | Analysis | 15 bidir pairs; 7 LEGIT / 4 CSS-LEAK / 2 DAL-VIOLATION / 1 GAS-PRICES / 1 SHARED-MODEL |
| App/VCSM/DEPENDENCY_DAG.md | CONTRACTS/App/VCSM/ | Analysis | 7-layer DAG; 12 defects; 9 SAFE cycles |
| App/VCSM/FEATURE_INDEX.md | CONTRACTS/App/VCSM/ | Index | 37 features; 18 CLEAN / 4 SPLIT / 4 VIOLATIONS / 2 FROZEN / 5 STUB / 1 DEPRECATED |
| App/VCSM/RISK_REGISTER.md | CONTRACTS/App/VCSM/ | Risk | 9 risks; CRITICAL: profiles + dashboard splits |
| App/VCSM/SHARED_BOUNDARIES.md | CONTRACTS/App/VCSM/ | Contract | Shared layer folder contents; forbidden examples |
| App/VCSM/features/Css.md | CONTRACTS/App/VCSM/features/ | Stub | [Empty file / stub] |
| Architecture/INDEX.md | CONTRACTS/Architecture/ | Navigation | 20 library files; layer responsibility summary; 200+ enforcement points |
| Architecture/ARCHITECTURE_SECTION_MAP.md | CONTRACTS/Architecture/ | Planning | Phase 1: 46 sections classified into 14 categories |
| Architecture/ARCHITECTURE_SPLIT_PLAN.md | CONTRACTS/Architecture/ | Planning | Phase 5: sections → 12 library files; section numbers preserved |
| Architecture/ARCHITECTURE_VS_GOVERNANCE_REPORT.md | CONTRACTS/Architecture/ | Planning | 30 ARCH / 4 GOV / 8 BORDERLINE; 4 governance leakage candidates |
| Architecture/01-core-principles.md | CONTRACTS/Architecture/ | Library | @/ import paths; DAL→Model→...→Final Screen build order |
| Architecture/02-identity-contract.md | CONTRACTS/Architecture/ | Library | actorId = vc.actors.id; actor_owners only; feed is actor-agnostic |
| Architecture/03-layer-contracts.md | CONTRACTS/Architecture/ | Library | 8-layer responsibility definitions; .select('*') banned |
| Architecture/04-resolver-contract.md | CONTRACTS/Architecture/ | Library | DI factory; resolvers/ subfolder; setup.js wiring only |
| Architecture/05-feature-boundaries.md | CONTRACTS/Architecture/ | Library | All layers inside feature folder; no direct internal imports |
| Architecture/06-module-contract.md | CONTRACTS/Architecture/ | Library | Application→Feature→Module→Behavior→Layer hierarchy |
| Architecture/07-adapter-contract.md | CONTRACTS/Architecture/ | Library | Adapters = only cross-feature import surface |
| Architecture/08-dependency-rules.md | CONTRACTS/Architecture/ | Library | One-way DAG; @alias approved paths |
| Architecture/09-ui-ownership.md | CONTRACTS/Architecture/ | Library | UI belongs to owning feature; cross-feature via adapters |
| Architecture/10-structural-integrity.md | CONTRACTS/Architecture/ | Library | 300-line hard limit; max 5 controller collaborators |
| Architecture/11-naming-conventions.md | CONTRACTS/Architecture/ | Library | Layer-encoded file naming conventions |
| Architecture/12-final-principles.md | CONTRACTS/Architecture/ | Library | 12 system axioms; grow horizontally not vertically |
| Architecture/13-ui-purity-rule.md | CONTRACTS/Architecture/ | Library | Screens render state only; no business rules in components |
| Architecture/14-styling-ownership-rule.md | CONTRACTS/Architecture/ | Library | Design tokens required; no hardcoded values |
| Architecture/15-sprint-review-rule.md | CONTRACTS/Architecture/ | Library | Bi-weekly review; merge gate for locked contract violations |
| Architecture/16-feature-health-metrics.md | CONTRACTS/Architecture/ | Library | 14 required metrics per feature |
| Architecture/17-folder-depth-enforcement.md | CONTRACTS/Architecture/ | Library | Max 3 levels below feature root; MEDIUM violation |
| Architecture/18-react-query-server-state.md | CONTRACTS/Architecture/ | Library | React Query required; no new useState+useEffect server fetches |
| Architecture/19-ttl-cache-deprecation.md | CONTRACTS/Architecture/ | Library | No new DAL-level TTL caches without approval |
| Architecture/20-zustand-scope.md | CONTRACTS/Architecture/ | Library | Zustand UI-only; server/ownership/permission data = HIGH violation |
| Architecture/Quicksilver/INDEX.md | CONTRACTS/Architecture/Quicksilver/ | Navigation | 2 contracts: monitoring ownership + ingest API |
| Architecture/Quicksilver/01-monitoring-ownership.md | CONTRACTS/Architecture/Quicksilver/ | Library | VCSM = event producer only; Quicksilver owns monitoring logic |
| Architecture/Quicksilver/monitoring-ingest-error.md | CONTRACTS/Architecture/Quicksilver/ | Library | Edge Function API reference; SHA-256 PII hashing; 64KB limit |
| ENGINE/INDEX.md | CONTRACTS/ENGINE/ | Navigation | 2 source contracts; 12 library files; machine reading index |
| ENGINE/ENGINE_SECTION_MAP.md | CONTRACTS/ENGINE/ | Planning | Phase 1: enginecontract.md + capabilitycontract.md classified |
| ENGINE/ENGINE_SPLIT_PLAN.md | CONTRACTS/ENGINE/ | Planning | Phase 5: 2 subfolders; god-files preserved |
| ENGINE/ENGINE_VS_GOVERNANCE_REPORT.md | CONTRACTS/ENGINE/ | Planning | 33+24 ARCH; 2+3 GOV; 0+3 BORDERLINE |
| ENGINE/Engine/INDEX.md | CONTRACTS/ENGINE/Engine/ | Navigation | How to BUILD an engine; 6 library files |
| ENGINE/Engine/01-engine-definition.md | CONTRACTS/ENGINE/Engine/ | Library | /engines/<name> location; headless requirement |
| ENGINE/Engine/02-engine-responsibilities.md | CONTRACTS/ENGINE/Engine/ | Library | apps→engines→shared; no product logic in engines |
| ENGINE/Engine/03-engine-layer-contracts.md | CONTRACTS/ENGINE/Engine/ | Library | DAL/Model/Controller/Hooks layer contracts |
| ENGINE/Engine/04-engine-public-api.md | CONTRACTS/ENGINE/Engine/ | Library | Adapters = public API; no DAL/controller/model exports |
| ENGINE/Engine/05-engine-permissions-events.md | CONTRACTS/ENGINE/Engine/ | Library | Permission snapshots; domain events |
| ENGINE/Engine/06-engine-isolation-versioning.md | CONTRACTS/ENGINE/Engine/ | Library | Independently testable; backward-compatible APIs |
| ENGINE/Capability/INDEX.md | CONTRACTS/ENGINE/Capability/ | Navigation | How engines INTERACT; collaboration map |
| ENGINE/Capability/01-capability-definition.md | CONTRACTS/ENGINE/Capability/ | Library | Core rule: engines interact only through published capabilities |
| ENGINE/Capability/02-engine-communication.md | CONTRACTS/ENGINE/Capability/ | Library | Capability calls + domain events only; prefer events |
| ENGINE/Capability/03-capability-contracts.md | CONTRACTS/ENGINE/Capability/ | Library | Domain-safe outputs; stable domain inputs |
| ENGINE/Capability/04-event-contract.md | CONTRACTS/ENGINE/Capability/ | Library | Event envelope; <noun>.<past-tense-action> naming |
| ENGINE/Capability/05-capability-ownership.md | CONTRACTS/ENGINE/Capability/ | Library | Anti-corruption; sole domain authority; graceful failure |
| ENGINE/Capability/06-capability-principles.md | CONTRACTS/ENGINE/Capability/ | Library | Registry rule; contracts not assumptions |
| Platform/INDEX.md | CONTRACTS/Platform/ | Navigation | 6 library files; 3-layer model; 15 enforcement points |
| Platform/01-platform-structure.md | CONTRACTS/Platform/ | Library | VC/apps/ engines/ shared/ contract/ — no code outside |
| Platform/02-layer-responsibilities.md | CONTRACTS/Platform/ | Library | Apps = experiences; Engines = capabilities; Shared = primitives |
| Platform/03-dependency-rules.md | CONTRACTS/Platform/ | Library | apps→engines→shared DAG; no cross-app imports |
| Platform/04-engine-architecture.md | CONTRACTS/Platform/ | Library | Engine internal layered structure; adapters = public surface |
| Platform/05-app-architecture.md | CONTRACTS/Platform/ | Library | App structure; routing only in apps; independent deployment |
| Platform/06-platform-principles.md | CONTRACTS/Platform/ | Library | Event model; ownership model; scaling model; enforcement rule |
| Security/INDEX.md | CONTRACTS/Security/ | Navigation | 2 source contracts → 6 library files; 15 enforcement points |
| Security/01-core-principles.md | CONTRACTS/Security/ | Library | Least privilege; trust boundaries; server authority; defense in depth |
| Security/02-auth-authorization.md | CONTRACTS/Security/ | Library | No service keys in frontend; server-side authorization; RLS |
| Security/03-database-data.md | CONTRACTS/Security/ | Library | RLS on all user-facing tables; no plaintext secrets |
| Security/04-input-api-secrets.md | CONTRACTS/Security/ | Library | Validate all inputs; rate limits; no hardcoded secrets |
| Security/05-logging-code-review.md | CONTRACTS/Security/ | Library | Log security actions; remove debug routes; pre-merge review |
| Security/06-platform-owners-prohibition.md | CONTRACTS/Security/ | Library | platform.platform_owners forbidden; use user_app_access |
| System/INDEX.md | CONTRACTS/System/ | Navigation | 2 source contracts → 6 library files; 12 enforcement points |
| System/01-boundary-core.md | CONTRACTS/System/ | Library | 4 protected roots; core isolation rule |
| System/02-boundary-scope.md | CONTRACTS/System/ | Library | 13 allowed scope labels; default = single-root |
| System/03-boundary-enforcement.md | CONTRACTS/System/ | Library | Engine rule; no silent refactors; all commands obey |
| System/04-actor-core-rule.md | CONTRACTS/System/ | Library | identityContext.identity = sole actor truth |
| System/05-actor-ten-rules.md | CONTRACTS/System/ | Library | 10 rules preventing independent actor state |
| System/06-actor-enforcement.md | CONTRACTS/System/ | Library | Any independent actor state = contract violation; review greps |
| Plans/INDEX.md | CONTRACTS/Plans/ | Navigation | Historical records; Phases 1–3 COMPLETE |
| Plans/01-chat-migration.md | CONTRACTS/Plans/ | Plan | Full chat migration state; Phase 4 NOT STARTED |
| GLOBAL_COMMAND_STATUS.md | ZZnotforproduction/APPS/VCSM/ | Governance | Platform command coverage; ELEKTRA 16%; THOR never run |
| COMMAND_DEPENDENCY_VALIDATION_REPORT.md | ZZnotforproduction/GOVERNANCE/outputs/ | Governance | ARCHITECT = sole discovery authority; 18 commands audited; 0 violations |
