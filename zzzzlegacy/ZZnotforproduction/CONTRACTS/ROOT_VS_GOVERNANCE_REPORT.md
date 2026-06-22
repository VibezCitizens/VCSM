# Root Contracts — Architecture vs. Governance Report
## Phase 4 — Detect Static Governance Leakage

> **Sources:** 9 files at CONTRACTS/ root
> **Classification key:**
> - **ARCHITECTURE** — structural rule about system design, component ownership, or data flow
> - **GOVERNANCE** — process, quality, or procedural rule (naming conventions, numerical limits, review requirements)
> - **BEHAVIORAL** — rule about how the agent must reason, communicate, or respond (unique to these contracts)
> - **PROJECT-STATE** — recorded migration status, not a rule (CHAT_MIGRATION_PLAN only)

---

## ANTI_HALLUCINATION_ENGINEERING_CONTRACT.md

| Rule | Classification | Notes |
|---|---|---|
| All claims must be in one of three tiers: Confirmed, Likely, Uncertain | BEHAVIORAL | Core epistemic contract — not a structural system rule |
| Confirmed: read the actual code, not inferred | BEHAVIORAL | Evidence standard — agent reasoning rule |
| Likely: reasonable inference but not directly read | BEHAVIORAL | Evidence standard |
| Uncertain: mentioned in conversation or assumed without trace | BEHAVIORAL | Evidence standard |
| Forbidden: "the hook handles it" without reading the hook | BEHAVIORAL | Hallucination prevention |
| Forbidden: stating a file exists without reading it | BEHAVIORAL | Hallucination prevention |
| Forbidden: assuming a function is called without tracing | BEHAVIORAL | Hallucination prevention |
| Forbidden: guessing database schema without reading migrations | BEHAVIORAL | Hallucination prevention |
| Forbidden: claiming a bug is fixed without verifying | BEHAVIORAL | Hallucination prevention |
| Step 1: Trace imports to understand actual dependency graph | BEHAVIORAL | Investigation process |
| Step 2: Identify all entry points | BEHAVIORAL | Investigation process |
| Step 3: Trace the actual runtime path | BEHAVIORAL | Investigation process |
| Step 4: Identify true ownership | BEHAVIORAL | Investigation process |
| Step 5: Trace actual schema usage | BEHAVIORAL | Investigation process |
| Root Cause: never guess; must be traceable to a specific line | BEHAVIORAL | Analysis standard |
| Migration Verification: read the actual migration SQL | BEHAVIORAL | Evidence requirement |
| Dead Code: never assume code is dead without verification | BEHAVIORAL | Evidence requirement |
| Architecture Claims: must trace actual layer dependencies | BEHAVIORAL | Evidence requirement |
| Uncertainty must be stated explicitly in reports | BEHAVIORAL | Communication standard |
| Reporting Format: use Confirmed/Likely/Uncertain labels in reports | GOVERNANCE | Output format specification |
| Engineering Integrity Standard: no invented facts | BEHAVIORAL | Core integrity rule |

**Summary:** 20 BEHAVIORAL, 1 GOVERNANCE. This is entirely a behavioral contract with a single format governance rule.

---

## CHAT_MIGRATION_PLAN.md

| Section | Classification | Notes |
|---|---|---|
| Option A: ActorSource + ActorRef model — locked as target | PROJECT-STATE | Architecture decision record, not a rule to enforce |
| Phase 1 COMPLETE: Wentrex migrated first | PROJECT-STATE | Historical record |
| Phase 2 COMPLETE: actor_source explicit in all tables | PROJECT-STATE | Historical record |
| Phase 3 COMPLETE: Wentrex migration frozen | PROJECT-STATE | Historical record |
| Phase 4 NOT STARTED: VC migration remaining | PROJECT-STATE | Current project state |
| Future extraction boundary: engines/queue | ARCHITECTURE | Structural boundary decision |
| Future extraction boundary: engines/realtime | ARCHITECTURE | Structural boundary decision |
| Non-Negotiable: no multi-tenant tables | ARCHITECTURE | Permanent constraint |
| Non-Negotiable: no shared message tables | ARCHITECTURE | Permanent constraint |
| Non-Negotiable: chat engine owns all schema | ARCHITECTURE | Ownership constraint |

**Summary:** 6 PROJECT-STATE records, 4 ARCHITECTURE decisions embedded in non-negotiables and extraction boundaries.

**Note:** The 4 ARCHITECTURE rules buried in this plan should be surfaced in the `System/` contracts or a dedicated architecture decision record. They currently live only in a status document.

---

## FORBID_PLATFORM_OWNERS_USAGE.md

| Rule | Classification | Notes |
|---|---|---|
| `platform.platform_owners` must never be used in Wentrex or VCSM app domain logic | ARCHITECTURE | Structural boundary — table is forbidden at app level |
| Forbidden consumers list (VCSM/Wentrex DALs, controllers, models, hooks, components) | ARCHITECTURE | Boundary enforcement list |
| Allowed use: platform governance layer only | ARCHITECTURE | Ownership assignment |
| Required alternative: `platform.user_app_access` for role checks | ARCHITECTURE | Required substitute pattern |
| Required alternative: `platform.profiles` for identity | ARCHITECTURE | Required substitute pattern |
| Required alternative: engine adapters for permission checks | ARCHITECTURE | Required substitute pattern |
| Enforcement: any DAL reading this table is in violation | ARCHITECTURE | Enforcement scope |
| Review check grep patterns | GOVERNANCE | Process — grep strings for manual review |
| Final Principle: no app should know about platform ownership structure | ARCHITECTURE | Boundary ownership principle |

**Summary:** 7 ARCHITECTURE, 1 GOVERNANCE.

---

## PROJECT_BOUNDARY_ISOLATION_CONTRACT.md

| Rule | Classification | Notes |
|---|---|---|
| Only touch files explicitly within your declared work scope | ARCHITECTURE | Boundary isolation rule |
| Protected roots: apps/VCSM, apps/wentrex, apps/Traffic, engines/, shared/ | ARCHITECTURE | Canonical root list |
| Cross-boundary modification is a contract violation | ARCHITECTURE | Severity definition |
| Work must not reach into other roots silently | ARCHITECTURE | Implicit coupling prevention |
| Scope labels: VCSM, WENTREX, TRAFFIC, ENGINE-[name], SHARED, combinations | GOVERNANCE | Labeling convention |
| Default assumption: if scope unspecified, treat as VCSM-only | GOVERNANCE | Default rule |
| Engine work requires ENGINE-[name] label | GOVERNANCE | Labeling rule |
| Traffic is independent of VCSM — no shared implementation | ARCHITECTURE | Isolation constraint |
| No silent refactors across roots | ARCHITECTURE | Mutation scope rule |
| Documentation must match declared scope | GOVERNANCE | Process rule |
| Debugging must stay within declared scope | GOVERNANCE | Process rule |
| Database changes confined to declared scope | ARCHITECTURE | Schema ownership rule |
| Planning documents must specify scope label | GOVERNANCE | Process rule |
| Commands must use scope headers | GOVERNANCE | Process rule |
| Violation: restart, declare correct scope, reverse violation | GOVERNANCE | Remediation process |
| Principle: scope is not optional | BEHAVIORAL | Contract posture rule |

**Summary:** 6 ARCHITECTURE, 7 GOVERNANCE, 1 BEHAVIORAL (scope posture). Heavily process-oriented.

---

## REAL_WORLD_ENGINEERING_OPS_CONTRACT.md

| Rule | Classification | Notes |
|---|---|---|
| Product decisions must be reality-grounded, not theoretically ideal | BEHAVIORAL | Reasoning posture |
| Feature flags are not free; they add cognitive overhead | BEHAVIORAL | Product reality rule |
| Backwards compatibility is not always the right choice | BEHAVIORAL | Engineering judgment rule |
| Operational reality: services fail, infrastructure has limits | BEHAVIORAL | Operational posture |
| Understand actual production traffic shape before recommending changes | BEHAVIORAL | Evidence-based reasoning |
| Observability contract: structured logging required | ARCHITECTURE | System design rule |
| Logging must include: operation name, actor context, result | GOVERNANCE | Logging format rule |
| Never log PII | ARCHITECTURE | Security constraint |
| Metrics: use counters, gauges, histograms — not logs | GOVERNANCE | Observability pattern rule |
| Tracing: distributed context propagation | ARCHITECTURE | System capability rule |
| Alerting: route to correct owner, not catch-all | GOVERNANCE | Process rule |
| Release discipline: production gates required | GOVERNANCE | Release process rule |
| Feature flags required for risky changes | GOVERNANCE | Risk management process |
| Staged rollout before full release | GOVERNANCE | Release process rule |
| DX: local setup must work without cloud dependencies | ARCHITECTURE | Developer experience constraint |
| DX: test databases must be seeded predictably | ARCHITECTURE | Development environment rule |
| DX: hot reload must not break application state | ARCHITECTURE | Developer environment constraint |
| Platform evolution: changes must not assume greenfield | BEHAVIORAL | Operational posture |
| Domain ownership: each domain has one team | ARCHITECTURE | Ownership model |
| Incident preparedness: runbooks must exist before shipping | GOVERNANCE | Pre-ship requirement |
| Engineering culture: psychological safety required | BEHAVIORAL | Culture principle |

**Summary:** 8 BEHAVIORAL, 6 ARCHITECTURE, 7 GOVERNANCE. Mixed contract with strong operational flavor.

---

## SECURITY_ENGINEERING_CONTRACT.md

| Rule | Classification | Notes |
|---|---|---|
| Least Privilege: every component requests only what it needs | ARCHITECTURE | Core security principle |
| Trust Boundaries: every input validated before use | ARCHITECTURE | Core security principle |
| Server Authority: server is authoritative; client is untrusted | ARCHITECTURE | Trust model |
| Defense in Depth: multiple independent security layers | ARCHITECTURE | Defense strategy |
| Authentication: never store passwords in plaintext | ARCHITECTURE | Hard constraint |
| Authentication: session tokens must expire | ARCHITECTURE | Session security |
| Authentication: MFA enforced for sensitive operations | ARCHITECTURE | Access control rule |
| Authorization: all access must be explicitly granted | ARCHITECTURE | Authorization model |
| Authorization: RLS must be configured for all user-facing tables | ARCHITECTURE | Database security rule |
| Authorization: no client-side authorization decisions | ARCHITECTURE | Trust boundary rule |
| Database: no raw SQL with user input | ARCHITECTURE | Injection prevention |
| Database: no .select('*') on sensitive tables | ARCHITECTURE | Data minimization rule |
| Database: migrations must be reviewed for RLS | GOVERNANCE | Review process rule |
| Data protection: encrypt PII at rest | ARCHITECTURE | Encryption requirement |
| Data protection: never expose internal IDs in public URLs | ARCHITECTURE | Information exposure rule |
| Input validation: validate at every trust boundary | ARCHITECTURE | Validation requirement |
| Input validation: schema validation on all external inputs | ARCHITECTURE | Input handling rule |
| Input validation: file upload type/size validation | ARCHITECTURE | Upload security |
| API security: rate limiting required | ARCHITECTURE | API protection |
| API security: CORS configured correctly | ARCHITECTURE | Cross-origin security |
| Secrets management: no secrets in code | ARCHITECTURE | Secrets handling rule |
| Secrets management: no secrets in logs | ARCHITECTURE | Information leakage rule |
| Logging: never log tokens or passwords | ARCHITECTURE | Log hygiene |
| Logging: audit log for security-sensitive operations | ARCHITECTURE | Audit requirement |
| Messaging security: validate message sender | ARCHITECTURE | Identity validation |
| File upload: validate before processing | ARCHITECTURE | Upload security |
| Third-party: isolate in adapter layer | ARCHITECTURE | Dependency boundary |
| Infrastructure: HTTPS only | ARCHITECTURE | Transport security |
| Code security: no eval() with user data | ARCHITECTURE | Code injection prevention |
| Security review: required before shipping auth changes | GOVERNANCE | Process requirement |
| Security review: required before new RLS policies | GOVERNANCE | Process requirement |
| Incident preparedness: incident response plan required | GOVERNANCE | Process requirement |
| What Must Never Happen list | ARCHITECTURE | Hard prohibitions |

**Summary:** 26 ARCHITECTURE, 5 GOVERNANCE. Heavily architectural contract — most rules are structural constraints, not process rules.

---

## SENIOR_DEVELOPER_CONTRACT.md

| Rule | Classification | Notes |
|---|---|---|
| Core Identity: tell the truth about what you know | BEHAVIORAL | Core agent identity |
| Truthfulness Rule: never fabricate | BEHAVIORAL | Integrity constraint |
| No Fake Confidence Rule: admit uncertainty | BEHAVIORAL | Epistemological rule |
| Architecture First Rule: understand architecture before proposing | BEHAVIORAL | Reasoning posture |
| Preserve Working Systems Rule: do not touch working code | BEHAVIORAL | Surgical change rule |
| Minimal Necessary Change Rule: smallest change that solves the problem | BEHAVIORAL | Scope constraint |
| Full Impact Awareness Rule: trace full call chain before claiming impact | BEHAVIORAL | Analysis requirement |
| Layer Respect Rule: honor architectural boundaries | ARCHITECTURE | Layer contract |
| Senior Quality Rule: production-ready code only | GOVERNANCE | Quality standard |
| Naming and Structure Rule: follow existing conventions | GOVERNANCE | Naming convention |
| Security and Safety Rule: consider security in every change | ARCHITECTURE | Security posture |
| Database and Schema Rule: migrations are permanent | ARCHITECTURE | Migration discipline |
| Migration Discipline Rule: reversible migrations required | ARCHITECTURE | Migration constraint |
| Documentation Truth Rule: documentation must reflect reality | GOVERNANCE | Documentation standard |
| Testing Rule: test behavior, not implementation | GOVERNANCE | Testing philosophy |
| No Silent Assumption Rule: state all assumptions | BEHAVIORAL | Communication standard |
| Reporting Rule: report what is confirmed | BEHAVIORAL | Output standard |
| Premium Senior Behavior Standard: always explain trade-offs | BEHAVIORAL | Behavioral standard |
| What to Never Do list | BEHAVIORAL | Prohibited behaviors |
| Expected Working Process | BEHAVIORAL | Process description |

**Summary:** 10 BEHAVIORAL, 4 ARCHITECTURE, 5 GOVERNANCE. Primarily a behavioral contract with embedded architectural principles.

---

## SINGLE_SOURCE_ACTOR_ARCHITECTURE.md

| Rule | Classification | Notes |
|---|---|---|
| Only `IdentityProvider` may write actor state (via `setIdentity()`) | ARCHITECTURE | Ownership invariant |
| All consumers must read from `useIdentity()` | ARCHITECTURE | Access pattern rule |
| Re-key all actor-scoped providers on actor switch | ARCHITECTURE | Provider isolation rule |
| Include `actorId` in all query keys | ARCHITECTURE | Query key convention |
| Version-guarded `switchActor()` | ARCHITECTURE | Version safety rule |
| Debug stores must subscribe to IdentityProvider, not own actor state | ARCHITECTURE | Debug pattern rule |
| No feature-specific actor reconstruction | ARCHITECTURE | Duplication prohibition |
| Cleanup on switch | ARCHITECTURE | Resource management rule |
| `useActorConsistencyCheck` invariant enforcement | ARCHITECTURE | Runtime enforcement hook |
| Permanent rule: no independent actor stores may exist | ARCHITECTURE | Architectural invariant |

**Summary:** 10 ARCHITECTURE. Entirely architectural — no governance or behavioral rules.

---

## STRATEGIC_REALITY_DEBRIEF_CONTRACT.md

| Rule | Classification | Notes |
|---|---|---|
| Analysis must model real-world user behavior, not ideal behavior | BEHAVIORAL | Analysis posture |
| Anti-Bias Rule: remove confirmation bias from analysis | BEHAVIORAL | Analysis quality rule |
| Human interaction model: users are goal-driven, not feature-driven | BEHAVIORAL | Mental model |
| Organizational reality: constraints exist and must be modeled | BEHAVIORAL | Modeling requirement |
| Product evolution thinking: features have lifecycle costs | BEHAVIORAL | Product reasoning |
| Platform thinking: identify network effects and leverage points | BEHAVIORAL | Strategic analysis |
| Real market context: consider competitive and timing context | BEHAVIORAL | Market modeling |
| Operational reality: consider deployment and operational costs | BEHAVIORAL | Operational modeling |
| Bias detection: name the biases in the analysis | BEHAVIORAL | Self-correction requirement |
| Strategic risk: identify survivability risks | BEHAVIORAL | Risk analysis requirement |
| Product evolution: identify growth opportunities | BEHAVIORAL | Opportunity analysis |
| Debrief output structure: 10-item structured output | GOVERNANCE | Output format specification |
| Tone: direct, candid, not optimistic by default | BEHAVIORAL | Communication standard |

**Summary:** 11 BEHAVIORAL, 1 GOVERNANCE (output format). Entirely behavioral contract for strategic analysis quality.

---

## Aggregate Classification Summary

| Contract | ARCHITECTURE | GOVERNANCE | BEHAVIORAL | PROJECT-STATE |
|---|---|---|---|---|
| ANTI_HALLUCINATION | 0 | 1 | 20 | 0 |
| CHAT_MIGRATION_PLAN | 4 | 0 | 0 | 6 |
| FORBID_PLATFORM_OWNERS | 7 | 1 | 0 | 0 |
| PROJECT_BOUNDARY | 6 | 7 | 1 | 0 |
| REAL_WORLD_OPS | 6 | 7 | 8 | 0 |
| SECURITY_ENGINEERING | 26 | 5 | 0 | 0 |
| SENIOR_DEVELOPER | 4 | 5 | 10 | 0 |
| SINGLE_SOURCE_ACTOR | 10 | 0 | 0 | 0 |
| STRATEGIC_DEBRIEF | 0 | 1 | 11 | 0 |
| **TOTAL** | **63** | **27** | **50** | **6** |

---

## Governance Leakage Assessment

**Low governance leakage risk:** ANTI_HALLUCINATION, SINGLE_SOURCE_ACTOR, STRATEGIC_DEBRIEF, FORBID_PLATFORM_OWNERS
→ These contracts are predominantly architectural or behavioral. Few process rules to leak.

**Medium governance leakage risk:** REAL_WORLD_OPS, PROJECT_BOUNDARY, SECURITY_ENGINEERING, SENIOR_DEVELOPER
→ These contain 5–7 governance rules embedded among architecture rules. Process rules (logging format, review requirements, naming conventions) should be extracted to a governance register when one exists.

**Special case:** CHAT_MIGRATION_PLAN
→ Contains 4 embedded architecture decisions that should be extracted into permanent contracts. The 6 PROJECT-STATE records are not rules — they are historical records and should be treated as read-only.

---

## Key Governance Rules Identified (Candidates for Extraction)

| Rule | Source File | Current Location |
|---|---|---|
| Reporting format: Confirmed/Likely/Uncertain labels | ANTI_HALLUCINATION | Section: Reporting Format |
| Scope labels: VCSM / WENTREX / TRAFFIC / ENGINE-[name] | PROJECT_BOUNDARY | Section: Allowed Scope Labels |
| Documentation must match declared scope | PROJECT_BOUNDARY | Section: Documentation Scope Rule |
| Commands must use scope headers | PROJECT_BOUNDARY | Section: Command Integration Rule |
| Logging format: operation name + actor context + result | REAL_WORLD_OPS | Section: Observability Contract |
| Release: staged rollout required | REAL_WORLD_OPS | Section: Release Discipline |
| Security review required before auth changes | SECURITY_ENGINEERING | Section: Security Review Requirements |
| Migrations must be reviewed for RLS | SECURITY_ENGINEERING | Section: Database Security |
| Naming: follow existing conventions | SENIOR_DEVELOPER | Section: Naming and Structure Rule |
| Test: behavior not implementation | SENIOR_DEVELOPER | Section: Testing Rule |
| Debrief output: 10-item structure | STRATEGIC_DEBRIEF | Section: Debrief Output Structure |
