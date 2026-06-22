# Codex Command Registry

## Source

Built from `.claude/commands` on 2026-06-02.

- Command markdown files found: 31
- Canonical operational commands declared by `.claude/commands/Cerebro.md`: 28
- Extra command-system support files: `Cerebro.md`, `listofcomand.v2.md`, `ticket.md`

## Inventory Summary

| File | Type | Purpose |
|---|---|---|
| `.claude/commands/*.md` | commands | Command definitions, safety contracts, run order, output rules |
| `.claude/projects/-Users-vcsm-Desktop-VCSM/memory/*.md` | memory | Project memory, command state, product distinctions, feedback rules |
| `.claude/settings.json` | settings | Claude workspace settings |
| `.claude/settings.local.json` | settings | Local Claude workspace settings |
| `.claude/skills/*.md` | skills | SHIELD execution and failure-prevention skill notes |

## Command Table

| Command | Purpose | Reads | Writes | CURRENT Domain File | Output Path | Must Run Before | Must Run After |
|---|---|---|---|---|---|---|---|
| ARCHITECT | Repository architecture mapping, layer/import audit, DB read map | Source, contracts, CURRENT | Governance reports and graph outputs | Platform/feature architecture files | `CURRENT/outputs/{YYYY}/{MM}/{DD}/architect/` | SENTRY, VENOM, IRONMAN, LOGAN | DR. STRANGE when feature scoped |
| AvengersAssemble | Full governance alignment before release or milestone | Specialist outputs | Synthesis governance report | Platform release/governance docs | `CURRENT/outputs/{YYYY}/{MM}/{DD}/avengersassemble/` | THOR | ARCHITECT, VENOM, BLACKWIDOW, ELEKTRA, LOGAN, SENTRY |
| BlackWidow | Ethical red-team and adversarial runtime verification | Source, runtime-safe evidence, VENOM/ARCHITECT outputs | Governance findings only | SECURITY.md when command-owned update applies | `CURRENT/outputs/{YYYY}/{MM}/{DD}/blackwidow/` | LOKI, VENOM verification, THOR | ARCHITECT, VENOM |
| CAPTAIN | Next-session idea and order capture | User prompt, active context | Captain log only | Platform documentation planning notes | `CURRENT/outputs/{YYYY}/{MM}/{DD}/captain/` | Optional future work | None |
| Carnage | Database migration architecture and safety planning | DB findings, schema context, VENOM | Governance/migration plans, not unsafe DB writes | Platform security or feature DB blockers | `CURRENT/outputs/{YYYY}/{MM}/{DD}/carnage/` | THOR | DB, VENOM |
| Cerebro | Canonical command registry | Command definitions | Command registry governance | Platform documentation | `CURRENT/outputs/{YYYY}/{MM}/{DD}/cerebro/` | All command registry syncs | None |
| DB | Read-only database review and architecture analysis | Live DB metadata, schema catalogs, DB docs | Governance findings only | Platform security or feature DB status | `CURRENT/outputs/{YYYY}/{MM}/{DD}/db/` | CARNAGE if change needed | DR. STRANGE when feature scoped |
| DataEngineer | Data-access performance, DAL duplication, RPC/view/cache recommendations | DALs, DB maps, runtime/perf evidence | Governance reports only | Platform security/performance or feature architecture | `CURRENT/outputs/{YYYY}/{MM}/{DD}/dataengineer/` | CARNAGE, VENOM, KRAVEN, LOKI, SENTRY, THOR | DB, ARCHITECT, LOKI, KRAVEN |
| Deadpool | Root-cause debugging and forensic investigation | Runtime traces, source, logs | Source only with explicit approval; reports otherwise | Feature CURRENT status when fixes land | `CURRENT/outputs/{YYYY}/{MM}/{DD}/deadpool/` | SENTRY if architecture changed, LOGAN | LOKI |
| Dr.Strange | Feature status oracle and governance router | CURRENT, FEATURE_STATUS, CATEGORY_REGISTRY | Its own output report and index only | Feature routing/status entrypoints | `CURRENT/outputs/{YYYY}/{MM}/{DD}/dr-strange/` | Specialist commands | CURRENT registry lookup |
| ELEKTRA | Precision code-level security scanner and patch advisor | Source, VENOM/BLACKWIDOW evidence | Read-only findings unless later execution ticket | SECURITY.md when command-owned update applies | `CURRENT/outputs/{YYYY}/{MM}/{DD}/elektra/` | DB, CARNAGE, THOR | VENOM, BLACKWIDOW |
| Falcon | iOS parity governance and transfer integrity | PWA/native docs, CURRENT, ARCHITECT/LOGAN | Native governance docs | `CURRENT/platform/native/` | `CURRENT/outputs/{YYYY}/{MM}/{DD}/falcon/` | WINTERSOLDIER, AVENGERSASSEMBLE | ARCHITECT, LOGAN |
| HAWKEYE | Endpoint and API contract verification | Endpoint code, runtime-safe traces, VENOM/LOKI | Governance/runtime verification reports | Platform security or feature SECURITY.md | `CURRENT/outputs/{YYYY}/{MM}/{DD}/hawkeye/` | VENOM, BLACKWIDOW, KRAVEN, THOR | LOKI, VENOM |
| Ironman | Feature ownership and system responsibility mapping | ARCHITECT maps, source ownership boundaries | Ownership reports | OWNERSHIP.md | `CURRENT/outputs/{YYYY}/{MM}/{DD}/ironman/` | AVENGERSASSEMBLE | ARCHITECT |
| Kraven | Performance bottleneck and latency analysis | LOKI traces, source, runtime observations | Performance reports | PERFORMANCE.md | `CURRENT/outputs/{YYYY}/{MM}/{DD}/kraven/` | THOR | LOKI |
| Logan | Documentation review, drift detection, sync, indexes | CURRENT, HISTORY, command outputs, docs | Governance docs and indexes | Platform documentation and feature HISTORY_INDEX/CURRENT refs | `CURRENT/outputs/{YYYY}/{MM}/{DD}/logan/` | AVENGERSASSEMBLE, THOR evidence freshness | ARCHITECT or post-implementation |
| Loki | Runtime truth and execution trace | Runtime logs, traces, observable behavior | Runtime evidence reports | Feature or platform runtime status | `CURRENT/outputs/{YYYY}/{MM}/{DD}/loki/` | KRAVEN, DEADPOOL | None |
| NickFury | Parallel workstream orchestration via FurySignal | Incoming tasks and locks | FurySignal coordination docs | Platform documentation | `CURRENT/outputs/{YYYY}/{MM}/{DD}/nickfury/` | SENTRY if architecture changed | None |
| review-contract | Architecture contract compliance review | Contract files and target files | Review reports only | Platform documentation/security if drift found | `CURRENT/outputs/{YYYY}/{MM}/{DD}/review-contract/` | AVENGERSASSEMBLE | ARCHITECT |
| Sentry | Architecture compliance and boundary enforcement | ARCHITECT maps, changed files, contracts | Compliance reports | ARCHITECTURE.md or platform documentation | `CURRENT/outputs/{YYYY}/{MM}/{DD}/sentry/` | AVENGERSASSEMBLE, THOR | ARCHITECT |
| SHIELD | IP, copyright, patent, license, and governance safety | Source, dependencies, docs, outputs | IP safety reports | Platform documentation/security | `CURRENT/outputs/{YYYY}/{MM}/{DD}/shield/` | THOR if blocking IP risk | None |
| SPIDER-MAN | Regression safety net and test coverage | Source, tests, ARCHITECT/IRONMAN/LOKI outputs | Test coverage reports; tests only by execution ticket | TESTS.md | `CURRENT/outputs/{YYYY}/{MM}/{DD}/spider-man/` | WOLVERINE for test writing, HAWKEYE, VENOM, THOR | ARCHITECT, IRONMAN, LOKI |
| Sentry | Architecture compliance and boundary enforcement | ARCHITECT, contracts, changed files | Governance reports | ARCHITECTURE.md / platform documentation | `CURRENT/outputs/{YYYY}/{MM}/{DD}/sentry/` | THOR | ARCHITECT |
| Thor | Release commander and production gatekeeper | All required specialist evidence | Release gate report only | BLOCKERS.md / release status when owned | `CURRENT/outputs/{YYYY}/{MM}/{DD}/thor/` | None | AVENGERSASSEMBLE |
| Venom | Security, trust boundary, actor governance review | Source, ARCHITECT, CURRENT, security docs | Security reports and owned security updates | SECURITY.md | `CURRENT/outputs/{YYYY}/{MM}/{DD}/venom/` | BLACKWIDOW, ELEKTRA, SENTRY, THOR | ARCHITECT |
| Vision | Analytics intelligence, telemetry, funnels, attribution | Telemetry code, runtime, analytics docs | Analytics governance reports | Platform documentation or feature performance/status | `CURRENT/outputs/{YYYY}/{MM}/{DD}/vision/` | THOR if blocking | LOKI |
| WATCHER | Session change provenance and review routing | Changed files, roots, layers, risk | Provenance reports | Platform documentation / affected feature status | `CURRENT/outputs/{YYYY}/{MM}/{DD}/watcher/` | SENTRY, VENOM, CARNAGE, SPIDER-MAN, LOGAN, THOR | None |
| WinterSoldier | Android parity and runtime stability governance | Native/android transfer evidence | Native governance docs | `CURRENT/platform/native/` | `CURRENT/outputs/{YYYY}/{MM}/{DD}/wintersoldier/` | AVENGERSASSEMBLE | FALCON |
| Wolverine | Main planning, routing, and execution orchestrator | Ticket, CURRENT, source as scoped | Plans, trackers, source only with approval | Affected feature/platform CURRENT files | `CURRENT/outputs/{YYYY}/{MM}/{DD}/wolverine/` | SENTRY if architecture changed, LOGAN post-impl | DR. STRANGE |
| listofcomand.v2 | Command-system onboarding reference | Command registry | Reference docs only | Platform documentation | `CURRENT/outputs/{YYYY}/{MM}/{DD}/logan/` if summarized | None | Cerebro |
| session-summary | End-of-session audit log and context handoff | Current session | Session summary file | Platform documentation/history | `CURRENT/outputs/{YYYY}/{MM}/{DD}/session-summary/` | Future session handoff | None |
| ticket | Persistent engineering ticket workflow | Ticket text and context | Ticket plans/reports | Platform documentation or affected feature | Uses command-specific output path | Command execution | None |

## Write Authority

| Authority | Meaning |
|---|---|
| FULL_WRITABLE | May modify source code only when ticket scope and approval allow it |
| GOVERNANCE_WRITABLE | May create/update governance docs, audits, reports, trackers; never source by default |
| SOURCE_READ_ONLY | Read-only inspection only |
| GOVERNANCE_RUNTIME | Runtime-safe verification and governance reports |

