# DOCS_SPAGHETTI_AUDIT.md
# Ticket: DOCS-ORG-001
# Phase 1 & 2 — Current Documentation System Map and Spaghetti Classification
# Date: 2026-06-02
# Status: READ-ONLY PLANNING — No files modified

---

## PART 1 — CURRENT FOLDER MAP

### Root: zNOTFORPRODUCTION/

Total inventory: ~7,793 files across 4 top-level folders.

```
zNOTFORPRODUCTION/
├── _ACTIVE/         119 MB  6,662 files — Live operational docs, audits, planning
├── _CANONICAL/       13 MB    791 files — Source-of-truth specs and contracts
├── _BACKUPS/          2.6 MB  298 files — April 30, 2026 code snapshots
└── _HISTORY/        688 KB    42 files — Session summaries, DB snapshots
```

---

### _ACTIVE/ — Operational Documentation (6,662 files)

| Subfolder | Files | Content Type | Naming Pattern |
|---|---|---|---|
| audits/ | 254 .md | Command audit runs per feature | `YYYY-MM-DD[_HH-MM]_[actor]_[feature-topic].md` |
| planning/ | 273 .md | Daily task execution logs | `DD/DD-NN.md` or `BAT-DD-NN.md` |
| native/ | 40 mixed | iOS/PWA parity docs | `falcon_[feature]-dal-parity-YYYY-MM-DD.md` |
| tools/ | 5,000+ | Dev tools, node_modules, analyzers | Mixed — includes full npm packages |
| debuggers/ | 2 .md + 8 empty | DAL execution traces | `YYYY-MM-DD_deadpool_[feature-trace].md` |
| migrations/ | 11 .sql | SQL migration scripts | `YYYY-MM-DD_[step]_[topic].sql` |
| change-intent/ | 1 .md | System change directive | CHANGE_INTENT.md (flat) |
| redteam-harnesses/ | 3 .js | Security test harnesses | `YYYY-MM-DD_blackwidow_[topic].harness.js` |

#### audits/ — 17 Subcategories

| Category | Count | Commands that write here |
|---|---|---|
| security/ | 94 | VENOM, ELEKTRA |
| compliance/ | 34 | SENTRY, SHIELD, review-contract |
| migrations/ | 25 | CARNAGE |
| redteam/ | 22 | BLACKWIDOW, KRAVEN |
| release/ | 17 | THOR |
| performance/ | 13 | KRAVEN |
| runtime/ | 12 | LOKI |
| ownership/ | 10 | IRONMAN |
| architecture/ | 4 | ARCHITECT |
| change-provenance/ | 4 | WATCHER |
| documentation/ | 7 | LOGAN |
| testing/ | 3 | SPIDER-MAN |
| tasks/ | 5 | WOLVERINE |
| data-engineering/ | 1 | DB |
| api/ | 1 | HAWKEYE |
| ip-safety/ | 1 | SHIELD |
| moderation/ | 1 | BLACKWIDOW |

#### planning/ — Monthly Task Logs

| Subfolder | Files | Status |
|---|---|---|
| april/ | 156 | Complete — historical |
| may/ | 109 | Mostly complete — historical |
| 2026-05/ | 1 | Monthly summary |
| carnage_migrations/ | 0 | Empty placeholder |
| moderation-db-remediation/ | 1 | One-off initiative |
| batman/ | 1 | Outlier (renamed command) |

---

### _CANONICAL/ — Source of Truth (791 files)

| Subfolder | Files | Content Type |
|---|---|---|
| logan/ | 790 | Technical documentation |
| skills/ | 2 | Agent behavioral contracts |
| vision/ | 7 | Platform vision and principles |
| zcontract/ | 13 | Engineering ruleset contracts |

#### _CANONICAL/logan/ — Technical Documentation (790 files)

| Subfolder | Files | Content Type | Naming |
|---|---|---|---|
| vcsm/ | 95 | Core system specs | `vcsm.[system].[topic].md` |
| marvel/ | 547 | Command execution logs | Mixed — actor/feature/date |
| engines/ | 22 | Shared engine contracts | `engines.[domain].[topic].md` |
| vports/ | 21 | Vport business system docs | `vcsm.vport.[topic].md` |
| platform/ | 17 | Cross-app pipeline specs | `platform.[system].[topic].md` |
| architecture/ | 14 | System maps | Various |
| legal/ | 2 | Consent and automation | Flat |
| navigation/ | 1 | Navigation architecture | Flat |
| performance/ | 3 | Performance metrics | Flat |
| traffic/ | 12 | SEO/Traffic routing | Flat |
| wentrex/ | 4 | Wentrex-specific docs | Flat |

#### _CANONICAL/logan/marvel/ — Command Execution Logs in Source of Truth (PROBLEM)

| Actor | Files | Status |
|---|---|---|
| architect/ | **516** | Massive — includes graph-data/, modules/, VPORT/DASHBOARD/, VPORT/TABS/ |
| ironman/ | 11 | Feature ownership logs |
| post-system/ | 12 | Post feature deep dives |
| captain/ | 5 | Idea capture notes |
| avengers-assembly/ | 2 | Cross-team summaries |
| batman/ | 2 | Renamed command (now NickFury) |
| wolverine/ | 3 | Orchestration logs |
| venom/ | 1 | Security review log |
| loki/ | 1 | Runtime observation log |
| kraven/ | 2 | Performance hunt logs |
| thor/ | 0 | **EMPTY** |
| carnage/ | 0 | **EMPTY** |
| bugsbunny/ | 0 | **EMPTY** (renamed to Deadpool) |

#### _CANONICAL/zcontract/ — Engineering Contracts (13 files)

| File | Size | Last Updated | Status |
|---|---|---|---|
| ARCHITECTURE.md | 29 KB | 2026-05-27 | **ACTIVE SOURCE OF TRUTH** |
| SECURITY_ENGINEERING_CONTRACT.md | 7.5 KB | 2026-03-31 | Active |
| SENIOR_DEVELOPER_CONTRACT.md | 7.9 KB | 2026-03-31 | Active |
| ANTI_HALLUCINATION_ENGINEERING_CONTRACT.md | 5.5 KB | 2026-03-31 | Active |
| REAL_WORLD_ENGINEERING_OPS_CONTRACT.md | 6.2 KB | 2026-03-31 | Active |
| PROJECT_BOUNDARY_ISOLATION_CONTRACT.md | 5.3 KB | 2026-04-12 | Active |
| SINGLE_SOURCE_ACTOR_ARCHITECTURE.md | 5.1 KB | 2026-04-09 | Active |
| STRATEGIC_REALITY_DEBRIEF_CONTRACT.md | 5.9 KB | 2026-03-31 | Active |
| FORBID_PLATFORM_OWNERS_USAGE.md | 3.0 KB | 2026-04-09 | Active |
| CHAT_MIGRATION_PLAN.md | 8.2 KB | 2026-03-31 | Stale? (chat migrated) |
| enginecontract.md | 4.5 KB | 2026-03-30 | Active |
| platformcontract.md | 4.6 KB | 2026-03-30 | Active |
| capabilitycontract.md | 7.0 KB | 2026-03-30 | Active |

---

### _BACKUPS/ — Code Snapshots (298 files)

| Folder | Date | Contents |
|---|---|---|
| VCSM-backup-20260430-165037/ | 2026-04-30 | Full features snapshot |
| backups-nested-20260430/ (17 batches) | 2026-04-30 | Sequential wave backups |
| deferred-cleanup-backup-20260430-172611/ | 2026-04-30 | Cleanup queue snapshot |
| high-risk-architecture-backup-20260430-182421/ | 2026-04-30 | High-risk feature backup |
| hooks-dal-backup-20260430-171232/ | 2026-04-30 | Hook-specific backup |
| media-engine-v1-backup-20260430-182430/ | 2026-04-30 | Engine v1 archive |
| phase6-screen-splits-backup/ | 2026-04-30 | Screen refactoring backup |
| upload_writeback_debug_20260430-220835/ | 2026-04-30 | Debug artifact |
| booking-split-backup-20260430/ | 2026-04-30 | Feature-specific backup |
| feed-vport-public-view-20260430-224439/ | 2026-04-30 | Feature-specific backup |
| media-v2-profile-uploads-20260430-195451/ | 2026-04-30 | Feature-specific backup |
| traffic-p0-architecture-remediation-20260430-205704/ | 2026-04-30 | Traffic app backup |

**No README, no manifest, no retention policy.**

---

### _HISTORY/ — Temporal Archive (42 files)

| Subfolder | Files | Date Range |
|---|---|---|
| session-summaries/2026-03/ | 2 | March 2026 |
| session-summaries/2026-04/ | 13 | April 2026 |
| session-summaries/2026-05/ | 1 | May 2026 (incomplete) |
| db/snapshots/ | 22 | 2026-05-14 through 2026-06-01 |
| PROM/ticketing.md | 1 | Ticket workflow spec |

---

## PART 2 — DOCUMENTATION SPAGHETTI CLASSIFICATION

### Classification Key
- **CURRENT_SOURCE_OF_TRUTH** — Definitive, should be the only place this info lives
- **MONTHLY_HISTORY** — Dated artifact, should rotate to archive
- **COMMAND_OUTPUT** — Run artifact from a command, belongs in history
- **FEATURE_DOC** — Should belong in a feature-scoped folder
- **STALE_DOC** — No longer accurate or superseded
- **DUPLICATE_DOC** — Same topic covered in multiple locations
- **LEGACY_CANDIDATE** — Should be preserved but not updated after migration
- **KEEP_ACTIVE** — Must remain as-is in any new system

---

### Classification Table — Every Section

| Path | Classification | Problem |
|---|---|---|
| `_CANONICAL/zcontract/ARCHITECTURE.md` | CURRENT_SOURCE_OF_TRUTH | None — this is correct |
| `_CANONICAL/zcontract/SECURITY_ENGINEERING_CONTRACT.md` | CURRENT_SOURCE_OF_TRUTH | None |
| `_CANONICAL/zcontract/CHAT_MIGRATION_PLAN.md` | STALE_DOC | Chat migrated — may no longer reflect current state |
| `_CANONICAL/logan/vcsm/booking/vcsm.booking.pipeline.md` | CURRENT_SOURCE_OF_TRUTH | Correct, but buried under marvel/ logs |
| `_CANONICAL/logan/vcsm/identity/` (13 files) | CURRENT_SOURCE_OF_TRUTH | Correct, appropriate location |
| `_CANONICAL/logan/marvel/architect/` (516 files) | COMMAND_OUTPUT in wrong place | Command logs inside canonical folder — pollutes source of truth |
| `_CANONICAL/logan/marvel/venom/` (1 file) | COMMAND_OUTPUT in wrong place | Same problem |
| `_CANONICAL/logan/marvel/ironman/` (11 files) | COMMAND_OUTPUT in wrong place | Same problem |
| `_CANONICAL/logan/marvel/thor/` (0 files) | STALE_DOC (empty) | Empty folder signals missing logs or wrong location |
| `_CANONICAL/logan/marvel/carnage/` (0 files) | STALE_DOC (empty) | Empty folder |
| `_CANONICAL/logan/marvel/bugsbunny/` (0 files) | STALE_DOC (empty) | Renamed command, dead folder |
| `_CANONICAL/logan/marvel/batman/` (2 files) | COMMAND_OUTPUT | Renamed command (now NickFury), logs stranded |
| `_CANONICAL/skills/` | KEEP_ACTIVE | Behavioral contracts — not documentation |
| `_CANONICAL/vision/` | KEEP_ACTIVE | Strategic docs — stable, correct location |
| `CURRENT/features/dashboard/evidence/` (94 files) | COMMAND_OUTPUT → MONTHLY_HISTORY | Dated run artifacts, correct naming but no feature grouping |
| `CURRENT/features/dashboard/evidence/` (34 files) | COMMAND_OUTPUT → MONTHLY_HISTORY | Same |
| `_ACTIVE/audits/migrations/` (25 files) | COMMAND_OUTPUT → MONTHLY_HISTORY | Same |
| `CURRENT/features/dashboard/evidence/` (22 files) | COMMAND_OUTPUT → MONTHLY_HISTORY | Same |
| `CURRENT/features/dashboard/evidence/` (17 files) | COMMAND_OUTPUT → MONTHLY_HISTORY | Same |
| `_ACTIVE/audits/performance/` (13 files) | COMMAND_OUTPUT → MONTHLY_HISTORY | Same |
| `CURRENT/features/dashboard/evidence/` (12 files) | COMMAND_OUTPUT → MONTHLY_HISTORY | Same |
| `CURRENT/features/dashboard/evidence/` (10 files) | COMMAND_OUTPUT → MONTHLY_HISTORY | Ownership maps should also update CURRENT feature docs |
| `_ACTIVE/audits/architecture/` (4 files) | COMMAND_OUTPUT → MONTHLY_HISTORY | Architecture scans should update CURRENT/platform/ |
| `_ACTIVE/audits/documentation/` (7 files) | COMMAND_OUTPUT → MONTHLY_HISTORY | Drift phase audits — valuable evidence trail |
| `CURRENT/features/dashboard/evidence/` (3 files) | COMMAND_OUTPUT → MONTHLY_HISTORY | Same |
| `CURRENT/features/dashboard/evidence/` (5 files) | COMMAND_OUTPUT | Ticket artifacts — better in REGISTRY/DEFERRED |
| `_ACTIVE/audits/api/` (1 file) | COMMAND_OUTPUT → MONTHLY_HISTORY | API drift — should update CURRENT endpoint docs |
| `_ACTIVE/planning/april/` (156 files) | MONTHLY_HISTORY | Complete — should be archived |
| `_ACTIVE/planning/may/` (109 files) | MONTHLY_HISTORY | Mostly complete — should be archived |
| `_ACTIVE/native/` (40 files) | FEATURE_DOC | iOS parity docs — should live in feature folders |
| `_ACTIVE/tools/graph-codegen/` | LEGACY_CANDIDATE | Dev tool, node_modules polluting docs — not documentation |
| `_ACTIVE/tools/language-audit/` | KEEP_ACTIVE (move) | Analysis outputs — useful but not a doc |
| `_ACTIVE/tools/shield-visualizer/` | LEGACY_CANDIDATE | Full npm app inside docs system |
| `_ACTIVE/tools/vcsm/` and `tools/wentrex/` | KEEP_ACTIVE (move) | Unused code finders — dev tools, not docs |
| `_ACTIVE/debuggers/` (2 files) | COMMAND_OUTPUT | Deadpool run traces — should be MONTHLY_HISTORY |
| `_ACTIVE/migrations/` (11 .sql) | KEEP_ACTIVE (move) | SQL scripts — belong in a migrations folder, not docs |
| `_ACTIVE/change-intent/` (1 file) | CURRENT_SOURCE_OF_TRUTH | Strategic directive — should be in REGISTRY/ |
| `_ACTIVE/redteam-harnesses/` (3 .js) | KEEP_ACTIVE (move) | Security test code — not documentation |
| `_BACKUPS/` (all 298 files) | LEGACY_CANDIDATE | April 30 code snapshots — not documentation at all |
| `_HISTORY/session-summaries/` (35 files) | MONTHLY_HISTORY | Correct location — already in right pattern |
| `_HISTORY/db/snapshots/` (22 files) | MONTHLY_HISTORY | Correct location |
| `_HISTORY/PROM/ticketing.md` | CURRENT_SOURCE_OF_TRUTH | Ticket workflow spec — belongs in REGISTRY/ |

---

## PART 3 — DUPLICATE SOURCE-OF-TRUTH PROBLEMS

### Problem 1: Booking — 35+ Files, No Single Current Answer

The booking system is documented in all of the following with no clear "current status" document:

**Canonical (claims source of truth):**
- `_CANONICAL/logan/vcsm/booking/vcsm.booking.pipeline.md`
- `_CANONICAL/logan/engines/engines.booking.contract.md`
- `_CANONICAL/logan/vcsm/dal/vcsm.dal.booking.md`

**Active Audits (15+ files, each partially updates current understanding):**
- Security: 6 VENOM/ELEKTRA files across different dates
- Compliance: 5 SENTRY/SHIELD files
- Migrations: 4 CARNAGE files
- Release: 4 THOR files
- Ownership: 2 IRONMAN files
- Performance: 1 KRAVEN file
- Runtime: 1 LOKI file
- Redteam: 3 BLACKWIDOW files
- Testing: 2 SPIDER-MAN files

**Result:** To know the current security status of booking, you must read the canonical spec PLUS all audit files sorted by date and synthesize them mentally. No file says "this is what is true about booking security right now."

### Problem 2: Identity — Canonical Split Across 13 Files

The identity system has 13 canonical files in `_CANONICAL/logan/vcsm/identity/` plus separate audit files scattered across security/, compliance/, runtime/, and ownership/ audit categories. The Logan canonical files are the closest thing to a source of truth, but they don't reflect audit findings from May 2026.

### Problem 3: Marvel/ Folder — Command Logs Inside Canonical

547 command execution logs live in `_CANONICAL/logan/marvel/`. This means command output artifacts — which are historical run records — are mixed directly into the folder that is supposed to contain authoritative source-of-truth documentation. The architect/ subfolder alone has 516 files.

**Impact:** The canonical folder is no longer reliable as a "current truth" reference because it contains undifferentiated historical artifacts alongside authoritative specs.

### Problem 4: Planning Files Growing Unboundedly

273 files for 2 months of daily execution logs. Projected: ~1,600 files/year. At year 2, searching `planning/` becomes impractical without tooling. These files have no archive path defined.

### Problem 5: Tools with node_modules in a Documentation System

`_ACTIVE/tools/graph-codegen/` contains a full npm package including `node_modules/` (~500+ files, ~110 MB). This is in a documentation system tracked alongside markdown files. It makes the folder feel like code, inflates file counts, and creates confusion about what is docs vs. what is tooling.

### Problem 6: Stale Folders with No Metadata

- `_BACKUPS/` — 298 files with no README, no manifest, no retention date. Are any of these safe to remove? Unknown.
- `marvel/bugsbunny/` — Dead folder from a renamed command. Will accumulate more orphans as commands are renamed.
- `marvel/thor/`, `marvel/carnage/` — Empty folders. Do logs belong here? Were they never written? Unknown.

### Problem 7: No Superseded Labels

Audit files from May 10 may be superseded by audit files from May 27 for the same feature. Neither file knows about the other. There is no `SUPERSEDED_BY:` pointer in old files, and no `SUPERSEDES:` pointer in new files.

### Problem 8: Native / iOS Docs Live Outside Feature Folders

40 native parity files live in `_ACTIVE/native/native-transfer/modules/` covering chat, booking, auth, feed, etc. These are feature-scoped documents that live in a platform-scoped location. When looking for everything about the chat feature, you must know to also check `native/`.

### Problem 9: Debuggers Has 8 Empty Placeholder Folders

`_ACTIVE/debuggers/` has 2 actual files and 8 empty subfolders: `actor-switch/`, `feed/`, `global/`, `identity/`, `media/`, `performance/`, `shared/`, `worker-upload/`. These placeholders signal intent with no content, confusing anyone auditing coverage.

### Problem 10: Competing Ticket Registries

- `_HISTORY/PROM/ticketing.md` — Ticket workflow spec
- Memory system (`MEMORY.md`) — Tracks open tickets like TICKET-BOOKING-RPC-001, TICKET-PLATFORM-RLS-001
- `CURRENT/features/dashboard/evidence/` — Task workflow artifacts
- No single DEFERRED_ITEMS.md or BLOCKERS.md registry

---

## PART 4 — COMMAND OUTPUT PROBLEMS BY COMMAND

### ARCHITECT
- **Current output:** `_CANONICAL/logan/marvel/architect/` (516 files)
- **Problem:** Command logs inside canonical folder. Architect scans produce graph-data, module maps, and system topology docs — these should be HISTORY artifacts that feed into CURRENT architecture docs, not live in canonical directly.

### VENOM
- **Current output:** `CURRENT/features/dashboard/evidence/` (94 files)
- **Problem:** Security findings organized by audit date, not by feature. No per-feature "current security status" file exists. Each run adds a new file but never updates a central truth.

### ELEKTRA
- **Current output:** `CURRENT/features/dashboard/evidence/` (shared with VENOM)
- **Problem:** Mixed with VENOM output in the same folder. No differentiation between initial VENOM scan and ELEKTRA precision patch output.

### BLACKWIDOW
- **Current output:** `CURRENT/features/dashboard/evidence/` and `_ACTIVE/redteam-harnesses/`
- **Problem:** Output split between documentation (redteam/) and code (redteam-harnesses/). Harness code lives in a docs system.

### CARNAGE
- **Current output:** `_ACTIVE/audits/migrations/` (25 files) and `_ACTIVE/migrations/` (11 SQL files)
- **Current log location:** `_CANONICAL/logan/marvel/carnage/` (0 files — **never written**)
- **Problem:** Migration docs in one place, SQL in another, canonical logs empty.

### THOR
- **Current output:** `CURRENT/features/dashboard/evidence/` (17 files)
- **Current log location:** `_CANONICAL/logan/marvel/thor/` (0 files — **never written**)
- **Problem:** Release gates documented in audits/, canonical logs empty.

### IRONMAN
- **Current output:** `CURRENT/features/dashboard/evidence/` (10 files)
- **Current log location:** `_CANONICAL/logan/marvel/ironman/` (11 files)
- **Problem:** Output split between audits/ and canonical/. Which is current?

### SPIDER-MAN
- **Current output:** `CURRENT/features/dashboard/evidence/` (3 files)
- **Problem:** Test coverage audits not linked to any per-feature tests status file.

### LOGAN
- **Current output:** `_ACTIVE/audits/documentation/` (7 drift phase files)
- **Updates:** `_CANONICAL/logan/vcsm/` (the canonical docs themselves)
- **Problem:** Logan is the only command that correctly updates a source-of-truth file. All other commands only append to audit history.

### LOKI
- **Current output:** `CURRENT/features/dashboard/evidence/` (12 files)
- **Problem:** Runtime traces are historical artifacts but no per-feature "runtime current status" summary exists.

### KRAVEN
- **Current output:** `_ACTIVE/audits/performance/` (13 files)
- **Current log location:** `_CANONICAL/logan/marvel/kraven/` (2 files)
- **Problem:** Output split. No per-feature performance current status.

### DEADPOOL
- **Current output:** `_ACTIVE/debuggers/` (2 files)
- **Problem:** 8 empty placeholder folders create false coverage signal.

### HAWKEYE
- **Current output:** `_ACTIVE/audits/api/` (1 file)
- **Problem:** Single file. No per-endpoint current status.

### WATCHER
- **Current output:** `_ACTIVE/audits/change-provenance/` (4 files)
- **Problem:** Change provenance is underused. Only 4 files for the entire system.

### WOLVERINE
- **Current output:** `CURRENT/features/dashboard/evidence/` (5 files)
- **Current log location:** `_CANONICAL/logan/marvel/wolverine/` (3 files)
- **Problem:** Orchestration logs split. Planning files live in planning/ not in a command-named location.

### DB
- **Current output:** `_ACTIVE/audits/data-engineering/` (1 file) and `_HISTORY/db/snapshots/` (22 files)
- **Problem:** Output split between audit category and history. The history/db/snapshots/ is actually the better location but not consistently used.

---

## PART 5 — SUMMARY OF SPAGHETTI PATTERNS

| Pattern | Severity | Impact |
|---|---|---|
| Command logs in canonical folder (marvel/) | HIGH | Canonical no longer means "source of truth" |
| No per-feature current status file | HIGH | Cannot answer "what is true about feature X right now" |
| Multiple commands auditing same feature with no synthesis | HIGH | 35+ booking files, still no single current answer |
| node_modules in documentation system | MEDIUM | 110 MB pollution, 500+ irrelevant files |
| Planning files without archive path | MEDIUM | Will reach 1,500+ files/year |
| Empty placeholder folders | LOW | False coverage signal |
| No superseded labels on stale audit files | MEDIUM | Old findings indistinguishable from current |
| Backup files without manifest | LOW | Cannot assess what is safe to archive |
| Ticket state scattered across memory + audits + no registry | MEDIUM | Deferred items get lost |
| Native docs outside feature folders | LOW | Feature coverage incomplete if you only look at feature folder |
| Commands writing to different places for same output type | MEDIUM | Cannot predict where a command's output lives |
| Renamed commands leaving orphan folders | LOW | Growing graveyard (bugsbunny, batman) |
