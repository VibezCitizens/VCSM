# zNOTFORPRODUCTION Discovery Report

**Ticket:** [TICKET-DOCS-DISCOVERY-0001] Full System Discovery
**Date:** 2026-06-02
**Scope:** zNOTFORPRODUCTION — discovery only
**Status:** Complete — Read-Only Pass
**Constraint:** No files modified, moved, renamed, or deleted

---

## Phase 1 — Top Level Inventory

| Folder / File | Purpose (Observed) | File Count | Last Activity | Notes |
|---|---|---|---|---|
| `CURRENT/` | Active feature governance registry — per-feature status, history indexes, security docs | 82 | 2026-06-02 | Created as part of LOGAN-DOCS-001 / TICKET-0006; authoritative living state layer |
| `HISTORY/` | New canonical command output history archive (no underscore) | 2 | 2026-06-02 | Created by TICKET-0007; intended to receive ~398 files from _ACTIVE; currently only 2 Wolverine run files |
| `LEGACY/` | Empty placeholder shell | 0 | 2026-06-02 | Completely empty — no content, no subdirs; orphaned staging artifact from TICKET-0007 |
| `_ACTIVE/` | Primary working zone — audit outputs, planning, debuggers, migrations, tools, native docs | 6,668 | 2026-06-02 | Bulk inflated by `tools/graph-codegen/node_modules`; actual governance content substantially smaller |
| `_BACKUPS/` | April 30, 2026 restore-point archive — pre-change source snapshots | 298 | 2026-04-30 | 13 backup folders, all from a single sprint day; stale (33+ days); classified for archival in HISTORY_RELOCATION_COVERAGE_AUDIT.md |
| `_CANONICAL/` | Locked reference system — skills, contracts, Logan documentation library, command logs | 810 | 2026-05-27 | Most structurally complete zone; 788 files in logan/, 13 contracts, 2 skill files, 7 vision docs |
| `_HISTORY/` | Original organically-grown history archive — session summaries, DB snapshots, PROM docs, early command logs | 45 | 2026-06-02 | Predates HISTORY/ by ~3 months; mid-transition state; migration to HISTORY/ is the defined next step |
| `HISTORY_RELOCATION_AUDIT.md` | TICKET-0007 Phase 1 audit — documents 531 MOVE_TO_HISTORY, 171 KEEP_IN_PLACE, 423 NEEDS_REVIEW files | 1 file | 2026-06-02 | Working governance doc for open ticket; should move to HISTORY/2026/06/ after ticket execution |
| `HISTORY_RELOCATION_COVERAGE_AUDIT.md` | TICKET-0007 Phase 2 coverage validation — 3 execution blockers, 398 files cleared, 14 feature governance gaps | 1 file | 2026-06-02 | Working governance doc for open ticket; same disposition as above |
| `.DS_Store` | macOS filesystem metadata artifact | 1 file | — | No action; standard system file |

**Total files across all folders:** 7,908

---

## Phase 2 — Documentation System Mapping

| System | Purpose | Active | Authoritative | Duplicate Of | Notes |
|---|---|---|---|---|---|
| `CURRENT/` | Living governance registry — current status of every feature, security tier, open blockers, history indexes | Yes | Yes — single source for "what is the state of X right now" | Nothing | Created 2026-06-02; 13 feature folders + 4 frozen + 2 platform; primary DR. STRANGE input |
| `_CANONICAL/logan/` | Technical reference documentation — architecture maps, engine audits, platform docs, VPORT module governance | Yes | Yes — permanent technical record | Nothing | 788 files; organized by domain using `domain.system.topic.md` convention; logan/README.md is the authoritative index |
| `_CANONICAL/zcontract/` | Engineering contracts — architecture, security, identity, boundary isolation, platform structure | Yes | Yes — locked contracts that must be read before sessions | Nothing | 13 contracts; ARCHITECTURE.md is the primary session gate |
| `_CANONICAL/skills/` | Command execution contracts for VCSM and VCSM-contributor roles | Yes | Yes | Nothing | 2 skill files; vcsm/SKILL.md has 17 sections; vcsm-contributor/SKILL.md has 14 sections |
| `_CANONICAL/vision/` | Product identity documents — mission, manifesto, founder narrative, product philosophy, platform principles | Yes | Yes | Nothing | 7 files; 4 have naming violations (spaces in filenames) |
| `_ACTIVE/audits/` | Command output dump — audit reports produced by all 17 commands after each run | Yes | Yes — operational record, not governance | Nothing | 17 category subfolders; no archiving mechanism; all ages mixed together |
| `_ACTIVE/planning/` | Session planning files — per-day execution plans, approval trackers, TP queue system | Yes | Yes — operational planning | Nothing | Calendar-based (month/day), not sprint-based; TP queues currently empty |
| `_HISTORY/` | Original session archive — session summaries (Mar–May 2026), DB snapshots, PROM docs, early Wolverine logs | Active (mid-transition) | Was authoritative; now being superseded | Being consolidated into HISTORY/ | Contains institutional memory not yet migrated |
| `HISTORY/` | New canonical command history archive — Wolverine run logs, will receive _ACTIVE/ audit artifacts | Active (new) | Designated canonical by TICKET-0007 | _HISTORY/ (partial structural overlap, no content overlap) | Only 2 files as of today; designated destination for ~398 _ACTIVE/ files post-migration |
| `_BACKUPS/` | Restore-point archive from April 30, 2026 | No (archive) | No — snapshot in time | Nothing | 13 folders, all 33+ days old; classified for archival movement |
| `_CANONICAL/logan/marvel/` | Command execution logs — per-command outputs promoted to canonical record (ARCHITECT dominant with 556 files) | Partially active | Partially — ARCHITECT logs are canonical governance | _ACTIVE/audits/ (lower-fidelity version) | 595 files; ARCHITECT/VPORT/ subtree is the governance registry for all VPORT modules |
| Root .md files | Working governance artifacts for TICKET-0007 (open ticket) | Yes (temporary) | No — transitional only | Nothing | Will move to HISTORY/2026/06/ after TICKET-0007 completes |

---

## Phase 3 — Current Governance Analysis

| Area | Coverage | Missing Files | Status |
|---|---|---|---|
| auth | PARTIAL — VENOM 3x complete (last 2026-05-23); 14 open findings | DB, LOKI, SPIDER-MAN, CARNAGE not started | PARTIAL |
| block | PARTIAL — CURRENT_STATUS present; limited depth | No OWNERSHIP, PERFORMANCE, ARCHITECTURE docs | PARTIAL |
| chat | PARTIAL — SENTRY/KRAVEN/LOKI/IRONMAN/VENOM complete; CARNAGE partial | THOR, BLACKWIDOW, DB not started | PARTIAL |
| dashboard | COMPLETE — TICKET-0004 resolved; full command coverage; SECURITY.md seeded; remaining debt documented | None identified | COMPLETE |
| feed | PARTIAL — VENOM/SENTRY/KRAVEN/LOKI all complete (2026-05-14) | THOR, IRONMAN, CARNAGE not started | PARTIAL |
| identity | PARTIAL — VENOM/LOKI/IRONMAN/CARNAGE/DB complete (2026-05-18); critical migration `provision_vcsm_identity` missing `auth.uid()` guard deployment status UNKNOWN | SENTRY, SPIDER-MAN, BLACKWIDOW not started | PARTIAL / HIGH-RISK |
| legal | PARTIAL — CURRENT_STATUS present; limited depth | No OWNERSHIP, PERFORMANCE, ARCHITECTURE, SECURITY depth | PARTIAL |
| media | PARTIAL — TICKET-PLATFORM-RLS-001 open; CURRENT_STATUS present | Full command coverage not evidenced | PARTIAL |
| moderation | PARTIAL — CURRENT_STATUS present; limited depth | Full command coverage not evidenced | PARTIAL |
| notifications | PARTIAL — VENOM/LOKI/IRONMAN/KRAVEN complete (2026-05-19); SENTRY pending | THOR, BLACKWIDOW, CARNAGE, DB, FALCON not started | PARTIAL |
| post | PARTIAL — VENOM/SENTRY/review-contract complete (2026-05-19) | KRAVEN, LOKI, THOR, IRONMAN, CARNAGE not started | PARTIAL |
| profiles | PARTIAL — Full command coverage (2026-05-22/23); THOR conditional pass; DR-001 CRITICAL open | DB migration pending staging | PARTIAL / CRITICAL OPEN FINDING |
| social | PARTIAL — CURRENT_STATUS present; limited depth | Full command coverage not evidenced | PARTIAL |
| platform/security | PARTIAL — Cross-platform posture doc (2026-05-10); 7 SECURITY DEFINER release blockers open | No update reflected after 2026-05-10 | PARTIAL / STALE |
| platform/documentation | PARTIAL — Governance state doc present | Full command coverage not evidenced | PARTIAL |
| frozen/learning | FROZEN | N/A | FROZEN — excluded per contract |
| frozen/vgrid | FROZEN | N/A | FROZEN — excluded per contract |
| frozen/wanderex | FROZEN | N/A | FROZEN — excluded per contract |
| frozen/wanders | FROZEN | N/A | FROZEN — excluded per contract |
| booking | MISSING — No CURRENT folder exists | All files absent | CRITICAL GAP — TICKET-BOOKING-RPC-001 open |
| vport | MISSING — No CURRENT folder exists | All files absent | CRITICAL GAP — P0 foundational feature |
| actors | MISSING — No CURRENT folder exists | All files absent | CRITICAL GAP — CRITICAL PLATFORM feature |
| settings | MISSING — No CURRENT folder exists | All files absent | HIGH GAP — 4 controller stacks, security exposure |
| join | MISSING — No CURRENT folder exists | All files absent | MEDIUM GAP — active on current branch |
| public | MISSING — No CURRENT folder exists | All files absent | HIGH GAP — zero-auth surfaces |
| invite | MISSING — No CURRENT folder exists | All files absent | MEDIUM GAP |
| upload | MISSING — No CURRENT folder exists | All files absent | MEDIUM GAP — dual-controller anomaly unresolved |
| explore | MISSING — No CURRENT folder exists | All files absent | LOW GAP |
| onboarding | MISSING — No CURRENT folder exists | All files absent | MEDIUM GAP |
| void | MISSING — No CURRENT folder exists | All files absent | LOW GAP — system-post exclusion constraint undocumented |
| hydration | MISSING — No CURRENT folder exists | All files absent | LOW GAP — PLATFORM feature |
| ads | MISSING — No CURRENT folder exists | All files absent | LOW GAP |
| professional | MISSING — No CURRENT folder exists | All files absent | LOW GAP |
| portfolio | MISSING — No CURRENT folder exists | All files absent | PLACEHOLDER — planned feature |
| reviews | MISSING — No CURRENT folder exists | All files absent | PLACEHOLDER — planned feature |

### DR. STRANGE Readiness Assessment

DR. STRANGE is partially deployable. The command can answer "what is the current state of feature X?" for the 13 features that have CURRENT folders. Quality ranges from rich (dashboard: 10 files, full command coverage, explicit DR. STRANGE block present; profiles, identity, feed: multi-command coverage with open-finding registries) to thin (block, legal, moderation, social: 4 files each with no depth beyond basic status). For 8 features the command can produce a complete, evidence-backed answer: dashboard, profiles, identity, feed, auth (with caveats), notifications, chat, and post. For 5 features (block, legal, media, moderation, social, platform/security) it can produce a structural answer with open ticket references but gap-acknowledged command coverage.

DR. STRANGE has zero anchor for all remaining active features: booking, vport, actors, settings, join, public, invite, upload, explore, onboarding, void, hydration, ads, professional, portfolio, and reviews. These represent the majority of the platform's surface area. The most critical gaps are booking (TICKET-BOOKING-RPC-001 open, customer_actor_id injection and status overpermission confirmed on live DB), vport (P0 foundational feature driving the entire dashboard), and actors (CRITICAL PLATFORM feature with no governance home). Additionally, platform/security has 7 SECURITY DEFINER release blockers that have not been reflected in CURRENT since 2026-05-10 — a 23-day staleness gap on a security-tier document. The identity feature has a VF-01 HIGH finding (`provision_vcsm_identity` missing `auth.uid()` guard) with unknown deployment status. Until CURRENT folders exist for at least booking, vport, actors, and settings, DR. STRANGE cannot function as the platform's feature-state oracle.

---

## Phase 4 — History System Analysis

| Folder | Purpose | Active | Migration Needed | Notes |
|---|---|---|---|---|
| `HISTORY/` | New canonical command history archive — Wolverine run logs and future command artifact destination | Yes | No — this is the destination | Created today (2026-06-02) by TICKET-0007; 2 Wolverine files written; structure: `YEAR/MONTH/commands/[command]/` |
| `_HISTORY/` | Original organically-grown history archive — session summaries, DB snapshots, PROM docs, early command logs | Yes (mid-transition) | Yes — migrate into HISTORY/ | Predates HISTORY/ by ~3 months; 45 files spanning March–June 2026; contains institutional memory that has no equivalent in HISTORY/ |
| `_BACKUPS/` | Restore-point archive from April 30, 2026 sprint | No (archive) | Yes — move to HISTORY/2026/04/backups/ | 298 files, all 33+ days old; 13 folders; 9 cleared for archival, 3 need manifest review, 1 has full manifest |

### Authoritative History Folder Determination

`HISTORY/` (no underscore) is the designated canonical destination, established by TICKET-0007. The evidence is: (1) the `HISTORY_RELOCATION_AUDIT.md` and `HISTORY_RELOCATION_COVERAGE_AUDIT.md` at the zNOTFORPRODUCTION root explicitly name `HISTORY/` as the relocation target for all `_ACTIVE/` audit artifacts; (2) the first two outputs written to `HISTORY/` today are correctly structured Wolverine run files following the `YEAR/MONTH/commands/[command]/` schema; (3) the `_HISTORY/` folder has no corresponding charter document naming it canonical — it grew organically.

`_HISTORY/` holds institutional memory that `HISTORY/` does not yet contain: 14 session summaries (March–May 2026), 18 DB snapshots, and PROM reference documents. These are not duplicated in `HISTORY/`. The correct resolution is a one-time migration of `_HISTORY/` content into `HISTORY/` preserving the sub-tree schema: `session-summaries/` and `db/snapshots/` become peer sections inside `HISTORY/`, `PROM/` maps to `HISTORY/PROM/` or is relocated to `_CANONICAL/` if the documents are reference contracts. The migration has zero content-overlap risk (a `comm -12` check confirmed no filename duplicates across the two trees). After migration is confirmed complete, `_HISTORY/` is safe to remove.

---

## Phase 5 — Command Output Analysis

| Command | Output Location | CURRENT Updated | HISTORY Updated | Contract Compliant |
|---|---|---|---|---|
| WOLVERINE | `CURRENT/features/dashboard/evidence/` + `HISTORY/2026/06/commands/wolverine/` + `_HISTORY/2026/06/commands/wolverine/` | Yes — CURRENT/features/ docs updated after planning sessions | Yes — dedicated commands/wolverine folder in both history trees (ambiguous dual-path) | Partial — dual HISTORY path creates routing ambiguity |
| DR.STRANGE | No output files found anywhere | No | No | No — command is unbuilt; zero evidence of any execution |
| LOGAN | `_ACTIVE/audits/documentation/` + `CURRENT/features/dashboard/evidence/` | Yes — CURRENT/platform/documentation/ maintained | No dedicated HISTORY folder | Partial — no HISTORY capture path |
| VENOM | `CURRENT/features/dashboard/evidence/` | No direct update (analysis-only command) | No dedicated HISTORY folder | Partial — no HISTORY promotion mechanism for completed runs |
| ELEKTRA | `CURRENT/features/dashboard/evidence/` | No direct update | No dedicated HISTORY folder | Partial — no HISTORY promotion mechanism |
| BLACKWIDOW | `CURRENT/features/dashboard/evidence/` | No direct update | No dedicated HISTORY folder | Partial — no HISTORY promotion mechanism |
| ARCHITECT | `_ACTIVE/audits/architecture/` + `_CANONICAL/logan/marvel/architect/` (permanent governance) | Yes — per-module governance READMEs in `_CANONICAL/logan/marvel/architect/VPORT/` | Yes — `_CANONICAL/logan/marvel/architect/` is permanent record | Yes — most complete command in the system |
| SPIDER-MAN | `CURRENT/features/dashboard/evidence/` | No direct update | No dedicated HISTORY folder | Partial — no HISTORY capture |
| KRAVEN | `_ACTIVE/audits/performance/` | No direct update | No dedicated HISTORY folder | Partial — no HISTORY capture |
| IRONMAN | `CURRENT/features/dashboard/evidence/` | No direct update | No dedicated HISTORY folder | Partial — no HISTORY capture |
| THOR | `CURRENT/features/dashboard/evidence/` | No direct update (gate decisions only) | No dedicated HISTORY folder | Partial — one file misrouted to security/ |
| CARNAGE | `_ACTIVE/audits/migrations/` | No direct update | No dedicated HISTORY folder | Partial — no HISTORY capture |
| DB | `_HISTORY/db/snapshots/` | No direct update | Yes — `_HISTORY/db/snapshots/` is the canonical sink (18 timestamped entries) | Yes — dedicated sink exists; will need to migrate to `HISTORY/db/snapshots/` |
| WATCHER | `_ACTIVE/audits/change-provenance/` | No direct update | No dedicated HISTORY folder | Partial — no HISTORY capture |
| FALCON | `_ACTIVE/native/` + `CURRENT/features/dashboard/evidence/` | No direct update | No dedicated HISTORY folder | Partial — split output across two locations |
| SENTRY | `CURRENT/features/dashboard/evidence/` | No direct update | No dedicated HISTORY folder | Partial — no HISTORY capture |
| HAWKEYE | `_ACTIVE/audits/api/` | No direct update | No dedicated HISTORY folder | Partial — severely underdeployed (1 confirmed run) |

---

## Phase 6 — Planning System Analysis

Architecture of how planning flows through the system:

```
zNOTFORPRODUCTION/_ACTIVE/planning/
│
├── [MONTH]/                        # Calendar-based organization (april/, may/, 2026-05/)
│   └── [DD]/                       # Day-numbered subfolders (01/, 09/, 12/, 27/)
│       ├── {DD}-01.md              # Sequentially numbered session planning files
│       ├── {DD}-02.md              # Each covers: Task, Execution Plan, Execution Summary
│       ├── {DD}-03.md              # Task Class, Scope, Files Changed, SENTRY gate
│       └── {DD}-approval-tracker.md  # Per-day command gate results table
│                                      # (17 commands tracked: Logan, Deadpool, DB,
│                                      #  ARCHITECT, Venom, Sentry, Loki, Kraven, Carnage,
│                                      #  Ironman, Falcon, WinterSoldier, review-contract,
│                                      #  SHIELD, VISION, AvengersAssemble, THOR)
│
├── batman/                         # NickFury parallel-mission files (pre-rename label)
│   └── may/
│       └── [DD]/
│           └── BAT-{DD}-{NN}.md    # NickFury parallel workstreams
│
├── carnage_migrations/             # SQL migration proposals (standalone)
├── DOCS-ORG-001/                   # Paused docs architecture initiative (do not modify)
├── moderation-db-remediation/      # SQL batch proposals for moderation
│
├── .tp-active.md                   # TP Queue: EMPTY (no in-flight tasks)
├── .tp-backlog.md                  # TP Queue: EMPTY
├── .tp-incoming.md                 # TP Queue: EMPTY
├── .tp-ready.md                    # TP Queue: EMPTY
├── .tp-lock                        # Queue lock file (infrastructure)
└── .batsignal.md                   # NickFury dispatch staging: Traffic app review pending

PLANNING FILE FORMAT (per session):
  # Planning — {Month} / {DD} / Sequence {NN}
  > Task: <short description>
  ## Execution Plan
    Task Class: IMPLEMENTATION | GOVERNANCE | etc.
    Scope: VCSM
    Files changed: N
    SENTRY: Required / N/A
  ## Execution Summary
    ### What was completed
    ### Build result
    ### SENTRY Status: ALIGNED / PENDING
    ### Change Intent Registry
    NOTE OF COMPLETION

TICKET TRACKING (no standalone ticket files):
  - Active tickets live in: ~/.claude/projects/.../memory/MEMORY.md (persistent cross-session)
  - Detailed ticket bodies in: CURRENT/features/dashboard/evidence/memory/ (YAML frontmatter + narrative)
  - Ticket IDs referenced inline in planning files by session sequence number
  - Known open: TICKET-BOOKING-RPC-001, TICKET-PLATFORM-RLS-001, TICKET-FEED-CARDS-002

SPRINT SYSTEM: None — planning is calendar/session-based, not sprint-based.
```

---

## Phase 7 — Audit System Analysis

| Audit Area | Active | Archived | Current Equivalent | Notes |
|---|---|---|---|---|
| `audits/security/` | Yes — 95+ files; latest 2026-05-28 | No — no archiving mechanism | CURRENT/features/*/SECURITY.md | Heaviest-used audit folder; VENOM + ELEKTRA + WOLVERINE + SENTRY all write here; `memory/` subfolder holds ticket persistence files |
| `audits/redteam/` | Yes — 22 files; latest 2026-05-27 | No | No direct CURRENT equivalent | BLACKWIDOW output; adversarial test harness scripts in `_ACTIVE/redteam-harnesses/` |
| `audits/migrations/` | Yes — 23 files; latest 2026-05-28 | No | No CURRENT equivalent | CARNAGE output; SQL migration proposals |
| `audits/release/` | Yes — 18 files; latest 2026-05-28 | No | No CURRENT equivalent | THOR gate decisions; 1 file misrouted to security/ |
| `audits/ownership/` | Yes — 11 files; latest 2026-05-27 | No | No CURRENT equivalent | IRONMAN output |
| `audits/performance/` | Yes — 13 files; latest 2026-06-01 | No | CURRENT/features/*/PERFORMANCE.md (partial) | KRAVEN output |
| `audits/compliance/` | Yes — 24 files; latest 2026-06-01 | No | No CURRENT equivalent | SENTRY + FALCON + LOGAN + REVIEW-CONTRACT output; mixed command routing |
| `audits/testing/` | Yes — 3 files; latest 2026-05-27 | No | No CURRENT equivalent | SPIDER-MAN output; severely underdeployed |
| `audits/change-provenance/` | Yes — 4 files; latest 2026-05-27 | No | No CURRENT equivalent | WATCHER output |
| `audits/api/` | Yes — 1 file; latest 2026-05-26 | No | No CURRENT equivalent | HAWKEYE output; single confirmed run |
| `audits/documentation/` | Yes — 6 files; latest 2026-05-11 | No | CURRENT/platform/documentation/ | LOGAN output |
| `audits/runtime/` | Yes — 11 files; latest 2026-05-28 | No | No CURRENT equivalent | LOKI output |
| `audits/architecture/` | Yes — 4 files; latest 2026-05-27 | No | `_CANONICAL/logan/marvel/architect/` | ARCHITECT dual-writes: `_ACTIVE/audits/architecture/` (ephemeral) + `_CANONICAL/` (permanent) |
| `audits/data-engineering/` | Yes — 1 file; latest 2026-05-27 | No | No CURRENT equivalent | DATAENGINEER output; single confirmed run |
| `audits/ip-safety/` | Yes — 1 file; latest 2026-05-14 | No | No CURRENT equivalent | SHIELD output |
| `audits/moderation/` | Yes — 1 file; latest 2026-05-10 | No | No CURRENT equivalent | Single entry; potentially stale |
| `audits/tasks/` | Yes — 5 files; latest 2026-05-27 | No | No CURRENT equivalent | General task audits; mixed provenance |

**Key systemic gap:** No audit has ever been archived or promoted. Files from 2026-05-09 and 2026-05-10 sit alongside files from 2026-06-01 with no age differentiation. As the system matures, the absence of a rotation or archival mechanism will make the audit folders increasingly difficult to navigate. The HISTORY relocation work (TICKET-0007) is intended to address this — completed audits should eventually route to `HISTORY/YEAR/MONTH/audits/` or equivalent.

---

## Phase 8 — File Organization Drift Detection

| Drift ID | Location | Issue | Severity |
|---|---|---|---|
| DRIFT-001 | `zNOTFORPRODUCTION/HISTORY/` and `zNOTFORPRODUCTION/_HISTORY/` | Dual history folders with identical structural schema (`2026/06/commands/wolverine/`) but disjoint content; no documented routing rule for which folder new Wolverine outputs land in | P1 |
| DRIFT-002 | `zNOTFORPRODUCTION/LEGACY/` | Empty directory with no content, no README, no charter document; purpose unknown; orphaned from TICKET-0007 staging | P3 |
| DRIFT-003 | `_CANONICAL/vision/` | Four filenames with spaces: `Founder Narrative.md`, `The Vibez Citizens Manifesto.md`, `Product Philosophy.md`, `Platform Principles.md` — violates CLAUDE.md and SKILL.md naming rules | P2 |
| DRIFT-004 | `_CANONICAL/logan/vcsm.reviews.engine-integration.md` | File placed at `logan/` root instead of `logan/vcsm/` or `logan/vports/`; follows correct naming convention but wrong directory | P3 |
| DRIFT-005 | `_CANONICAL/logan/vcsm/dal/.claude/projects/-Users-vcsm-Desktop-VCSM/memory/feedback_never_write_existing_files.md` | Claude Code tooling artifact (memory file) dropped into the documentation tree; should not exist inside `logan/` | P2 |
| DRIFT-006 | `_CANONICAL/logan/marvel/architect/modules/restoredMap/feedback_ticketing_output_format.md` | Memory/feedback artifact inadvertently placed in an architecture documentation folder; wrong content type for the location | P2 |
| DRIFT-007 | `_CANONICAL/logan/marvel/batman/` | Folder named `batman/` containing NickFury logs; command was renamed `batman` → `nickfury` (2026-05-11); folder name is stale and inconsistent with current command vocabulary | P2 |
| DRIFT-008 | `_CANONICAL/logan/marvel/bugsbunny/` | Empty folder named `bugsbunny/` — command was renamed to `deadpool`; old name is a dead alias with zero files and no redirect marker | P3 |
| DRIFT-009 | `CURRENT/features/dashboard/evidence/` | One THOR file (`2026-05-26_22-12_thor_vport-qr-gas-module.md`) misrouted to `security/` instead of `release/`; minor routing drift | P3 |
| DRIFT-010 | `_CANONICAL/logan/README.md` | Logan README index references old command names (`bugsbunny`, `batman`) and does not reflect the massive `architect/VPORT/` subtree (432 files) that is now the dominant structure in `marvel/` | P2 |
| DRIFT-011 | `_ACTIVE/audits/` | No archiving mechanism exists; audit files from 2026-05-09 sit alongside 2026-06-01 files with no age differentiation or rotation policy | P2 |
| DRIFT-012 | `zNOTFORPRODUCTION/_BACKUPS/` | 13 backup folders from April 30, 2026 — all 33+ days old; no longer needed as restore points; classified for archival in coverage audit but migration has not been executed | P2 |
| DRIFT-013 | `_CANONICAL/skills/` | No Wentrex-specific skill or execution contract exists; `skills/` contains only `vcsm/` and `vcsm-contributor/`; Wentrex work has no behavioral contract equivalent | P2 |
| DRIFT-014 | Multiple `_CANONICAL/logan/marvel/` subdirs missing | Active commands with no `marvel/` execution log folder: `blackwidow/`, `db/`, `elektra/`, `falcon/`, `hawkeye/`, `logan/`, `nickfury/` (logs under `batman/`), `review-contract/`, `session-summary/`, `shield/`, `spider-man/`, `vision/`, `watcher/`, `wintersoldier/`, `cerebro/`, `dataengineer/`, `sentry/` | P2 |
| DRIFT-015 | `_CANONICAL/logan/architecture/`, `logan/engines/`, `logan/traffic/` | Several files use flat or SCREAMING_CASE names (e.g., `cache-audit.md`, `BOOKING_ENGINE_AUDIT_V1.md`, `TRAFFIC_ARCHITECTURE_REVIEW.md`) instead of the `domain.system.topic.md` convention; legacy files predating the naming contract | P3 |
| DRIFT-016 | `CURRENT/` | 20+ active features have no CURRENT folder (booking, vport, actors, settings, join, public, invite, upload, explore, onboarding, void, hydration, ads, professional, portfolio, reviews, and all platform sub-areas); these gaps directly block DR. STRANGE functionality | P0 |
| DRIFT-017 | `CURRENT/platform/security/` | Last meaningful update 2026-05-10; 7 SECURITY DEFINER release blockers documented as open but no subsequent status update exists; 23-day staleness on a security-tier document | P1 |
| DRIFT-018 | `CURRENT/features/identity/` | VF-01 HIGH finding (`provision_vcsm_identity` missing `auth.uid()` guard) recorded with unknown deployment status; no confirmation of whether the fix reached production | P0 |
| DRIFT-019 | `HISTORY/` vs `_HISTORY/` command routing | Both `HISTORY/2026/06/commands/wolverine/` and `_HISTORY/2026/06/commands/wolverine/` are active as of today; no documented rule determines which path new Wolverine files land in going forward | P1 |
| DRIFT-020 | `zNOTFORPRODUCTION/HISTORY_RELOCATION_AUDIT.md` and `HISTORY_RELOCATION_COVERAGE_AUDIT.md` | Two governance documents sitting at the zNOTFORPRODUCTION root rather than inside `CURRENT/features/dashboard/evidence/` or `HISTORY/2026/06/`; minor placement inconsistency while TICKET-0007 is open | P3 |

---

## Phase 9 — Future Organization Plan

Proposed ideal folder hierarchy for zNOTFORPRODUCTION after all cleanup is complete:

```
zNOTFORPRODUCTION/
│
├── _CANONICAL/                     # Locked reference — never modified by command output
│   ├── logan/                      # Technical documentation library
│   │   ├── README.md               # Authoritative index (update to reflect VPORT/ subtree)
│   │   ├── architecture/           # ARCHITECT scan output, system maps
│   │   ├── engines/                # Engine audits + contracts
│   │   ├── legal/                  # Consent system, legal automation
│   │   ├── marvel/                 # Command execution logs (promoted to canonical)
│   │   │   ├── architect/          # VPORT DASHBOARD + TABS governance registry (432 files)
│   │   │   ├── post-system/
│   │   │   ├── ironman/
│   │   │   ├── captain/
│   │   │   ├── wolverine/
│   │   │   ├── nickfury/           # [RENAME from batman/]
│   │   │   ├── deadpool/           # [RENAME from bugsbunny/ + populate]
│   │   │   ├── venom/
│   │   │   ├── loki/
│   │   │   ├── kraven/
│   │   │   ├── blackwidow/         # [CREATE — currently missing]
│   │   │   ├── db/                 # [CREATE — currently missing]
│   │   │   ├── elektra/            # [CREATE — currently missing]
│   │   │   ├── falcon/             # [CREATE — currently missing]
│   │   │   ├── hawkeye/            # [CREATE — currently missing]
│   │   │   ├── logan/              # [CREATE — currently missing]
│   │   │   ├── review-contract/    # [CREATE — currently missing]
│   │   │   ├── session-summary/    # [CREATE — currently missing]
│   │   │   ├── shield/             # [CREATE — currently missing]
│   │   │   ├── spider-man/         # [CREATE — currently missing]
│   │   │   ├── watcher/            # [CREATE — currently missing]
│   │   │   ├── wintersoldier/      # [CREATE — currently missing]
│   │   │   ├── carnage/            # [exists but empty — populate]
│   │   │   └── thor/               # [exists but empty — populate]
│   │   ├── navigation/
│   │   ├── performance/
│   │   ├── platform/
│   │   ├── traffic/
│   │   ├── vcsm/                   # vcsm.reviews.engine-integration.md MOVED HERE
│   │   ├── vports/
│   │   └── wentrex/
│   ├── skills/
│   │   ├── vcsm/SKILL.md
│   │   ├── vcsm-contributor/SKILL.md
│   │   └── wentrex/SKILL.md        # [CREATE — currently missing]
│   ├── vision/
│   │   ├── mission.md
│   │   ├── extractor.md
│   │   ├── founder-narrative.md    # [RENAME — remove spaces]
│   │   ├── vibez-citizens-manifesto.md  # [RENAME — remove spaces]
│   │   ├── product-philosophy.md   # [RENAME — remove spaces]
│   │   ├── platform-principles.md  # [RENAME — remove spaces]
│   │   └── future/review.md
│   └── zcontract/                  # 13 engineering contracts (no changes needed)
│
├── CURRENT/                        # Living governance registry — feature state oracle
│   ├── FEATURE_STATUS.md
│   ├── FROZEN_FEATURE_CONTRACT.md
│   ├── SOURCE_WORKFLOW_INTAKE.md
│   ├── README.md
│   ├── features/
│   │   ├── auth/                   # [exists — 4 files]
│   │   ├── block/                  # [exists — 4 files]
│   │   ├── booking/                # [CREATE — CRITICAL GAP]
│   │   ├── chat/                   # [exists — 5 files]
│   │   ├── dashboard/              # [exists — 10 files, most complete]
│   │   ├── feed/                   # [exists — 5 files]
│   │   ├── identity/               # [exists — 5 files]
│   │   ├── join/                   # [CREATE — active branch]
│   │   ├── legal/                  # [exists — 4 files]
│   │   ├── media/                  # [exists — 5 files]
│   │   ├── moderation/             # [exists — 4 files]
│   │   ├── notifications/          # [exists — 5 files]
│   │   ├── onboarding/             # [CREATE]
│   │   ├── post/                   # [exists — 4 files]
│   │   ├── profiles/               # [exists — 5 files]
│   │   ├── public/                 # [CREATE — zero-auth, HIGH priority]
│   │   ├── settings/               # [CREATE — HIGH priority]
│   │   ├── social/                 # [exists — 4 files]
│   │   └── vport/                  # [CREATE — P0]
│   ├── frozen/                     # [exists — 4 freeze records, no changes]
│   └── platform/
│       ├── actors/                 # [CREATE]
│       ├── documentation/          # [exists — 3 files]
│       ├── hydration/              # [CREATE]
│       ├── media/                  # [CREATE]
│       ├── security/               # [exists — 3 files, update staleness]
│       └── upload/                 # [CREATE]
│
├── HISTORY/                        # Single canonical archive (post-migration)
│   ├── 2026/
│   │   ├── 04/
│   │   │   └── backups/            # [MOVE from _BACKUPS/ — 13 folders after review]
│   │   ├── 05/                     # [MOVE from _HISTORY/session-summaries/2026-05/]
│   │   └── 06/
│   │       ├── commands/
│   │       │   └── wolverine/      # [current 2 files + merge from _HISTORY/]
│   │       └── audits/             # [MOVE relocated _ACTIVE/ audit files here]
│   ├── session-summaries/          # [MOVE from _HISTORY/session-summaries/]
│   │   ├── 2026-03/
│   │   ├── 2026-04/
│   │   └── 2026-05/
│   ├── db/
│   │   └── snapshots/              # [MOVE from _HISTORY/db/snapshots/]
│   └── PROM/                       # [MOVE from _HISTORY/PROM/ — or to _CANONICAL/]
│
├── _ACTIVE/                        # Working zone — command output, planning, tools
│   ├── audits/                     # 17 categories — no changes to structure
│   │   └── [17 category folders]/
│   ├── change-intent/
│   ├── debuggers/
│   ├── migrations/
│   ├── native/
│   ├── planning/
│   ├── redteam-harnesses/
│   └── tools/
│
│   [DELETED: _HISTORY/ — after migration to HISTORY/ confirmed complete]
│   [DELETED: _BACKUPS/ — after move to HISTORY/2026/04/backups/ confirmed complete]
│   [DELETED: LEGACY/ — empty folder, safe to remove]
```

**Rationale for each proposed change:**

1. Rename `_CANONICAL/logan/marvel/batman/` to `nickfury/` — command renamed on 2026-05-11; folder name is a stale alias that creates confusion in command attribution.
2. Rename `_CANONICAL/logan/marvel/bugsbunny/` to `deadpool/` — same rename event; currently empty, so this is a clean rename with no content risk.
3. Create missing `marvel/` folders for 18 active commands — these commands have no log destination, making their canonical record invisible in the governance system.
4. Create `_CANONICAL/skills/wentrex/SKILL.md` — Wentrex is an active app with no behavioral execution contract.
5. Rename 4 vision files to remove spaces — naming rule violation; risk-free rename with no content changes.
6. Move `vcsm.reviews.engine-integration.md` from `logan/` root to `logan/vcsm/` — follows correct naming convention already; wrong directory is the only issue.
7. Remove stale `.claude/` artifact from `logan/vcsm/dal/` — tooling artifact polluting the documentation tree.
8. Remove `feedback_ticketing_output_format.md` from `architect/modules/restoredMap/` — memory artifact in the wrong location.
9. Migrate `_HISTORY/` content into `HISTORY/` — eliminates dual-system ambiguity; confirmed zero content overlap.
10. Move `_BACKUPS/` content to `HISTORY/2026/04/backups/` — restore points are 33+ days stale and no longer needed in the working zone; must be preserved, not deleted.
11. Delete `LEGACY/` — empty, no purpose.
12. Create CURRENT folders for 8 missing high-priority features — booking, vport, actors, settings, join, public, identity migration confirmation, platform/security update.
13. Update `_CANONICAL/logan/README.md` — stale command names and does not index the 432-file `architect/VPORT/` subtree.
14. Move root governance audit files to `HISTORY/2026/06/` after TICKET-0007 closes.

---

## Phase 10 — Executive Report

### 10.1 Complete System Map

The `zNOTFORPRODUCTION` directory is a 7,908-file private workspace divided into six active zones and three stale/transitional zones. The six active zones are: (1) `_CANONICAL/` — the locked reference layer containing engineering contracts, skill definitions, Logan technical documentation, and the ARCHITECT VPORT governance registry; (2) `CURRENT/` — the living feature state oracle created in June 2026 to anchor DR. STRANGE and cross-session governance; (3) `_ACTIVE/` — the working output zone where all 17 commands deposit audit files and where session planning lives; (4) `HISTORY/` — the newly designated canonical archive receiving command run artifacts; (5) `_HISTORY/` — the original session archive holding three months of institutional memory pending migration; and (6) `_ACTIVE/planning/` — the calendar-based planning system. The three stale/transitional zones are: `_BACKUPS/` (April 30 restore points, 33+ days old), `LEGACY/` (empty placeholder), and the root-level governance audit files (working documents for TICKET-0007).

### 10.2 Documentation Architecture

Documentation is split between two permanent homes. `_CANONICAL/logan/` holds technical reference documentation: 788 files organized by domain (`architecture/`, `engines/`, `vcsm/`, `vports/`, `platform/`, `traffic/`, `wentrex/`) with canonical naming convention `domain.system.topic.md`. The dominant subtree is `logan/marvel/architect/VPORT/` with 432 files covering per-module governance for every VPORT Dashboard module and tab type. This is the most complete governance registry in the repo. `_CANONICAL/zcontract/` holds 13 locked engineering contracts that must be read at session start. `_CANONICAL/skills/` holds the execution contracts governing Claude behavior during VCSM and contributor sessions. `_CANONICAL/vision/` holds product identity documents. The system is well-structured at the top level but has naming drift in `logan/marvel/` (stale command folder names), filename violations in `vision/`, and a missing Wentrex skill contract.

### 10.3 Governance Architecture

Governance is layered across three systems that serve different timescales. `CURRENT/` is the per-feature living state layer — it answers "what is the current status of feature X?" and is the primary DR. STRANGE input. It currently covers 13 of the platform's active features with quality ranging from complete (dashboard) to thin (block, legal, social). Twelve or more active features have no CURRENT anchor at all, including the highest-risk features (booking, vport, actors, settings). `_CANONICAL/` is the locked reference layer — it does not change based on session output; it is the ground truth for contracts, skills, and architectural decisions. `_ACTIVE/audits/` is the operational layer — it accumulates session-by-session command outputs that may eventually be promoted to CURRENT or HISTORY. The three layers must not be conflated: CURRENT is "what is true now," _CANONICAL is "what is always true," and _ACTIVE/audits/ is "what was observed in session X."

### 10.4 History Architecture

History is currently split across two systems in a mid-transition state. `_HISTORY/` is the original archive (March–June 2026) holding session summaries, DB snapshots, and PROM documents — the institutional memory of the project. `HISTORY/` is the new designated canonical archive created by TICKET-0007 to receive command artifacts relocated from `_ACTIVE/`. Both use the same `YEAR/MONTH/commands/wolverine/` path schema but hold disjoint content (zero filename overlap confirmed). The correct resolution is a one-time migration of `_HISTORY/` content into `HISTORY/`, followed by decommissioning `_HISTORY/`. No archival mechanism exists for the 17 audit categories in `_ACTIVE/audits/` — completed audits accumulate indefinitely without rotation. This is the primary long-term gap in the history architecture.

### 10.5 Audit Architecture

The audit system consists of 17 category folders under `_ACTIVE/audits/`. Each folder maps to one or more commands: `security/` (VENOM, ELEKTRA), `redteam/` (BLACKWIDOW), `migrations/` (CARNAGE), `release/` (THOR), `ownership/` (IRONMAN), `performance/` (KRAVEN), `testing/` (SPIDER-MAN), `compliance/` (SENTRY, FALCON, LOGAN, REVIEW-CONTRACT), `change-provenance/` (WATCHER), `api/` (HAWKEYE), `documentation/` (LOGAN), `runtime/` (LOKI), `architecture/` (ARCHITECT), `data-engineering/` (DATAENGINEER). The naming convention is `YYYY-MM-DD[_HH-MM]_commandname_topic.md`. Files from 2026-05-09 coexist with 2026-06-01 files in the same folders with no age differentiation. No audit has ever been archived. ARCHITECT is the only command that writes to two destinations (`_ACTIVE/audits/architecture/` for ephemeral output and `_CANONICAL/logan/marvel/architect/` for permanent governance). DB is the only other command with a dedicated permanent sink (`_HISTORY/db/snapshots/`, soon `HISTORY/db/snapshots/`).

### 10.6 Planning Architecture

Planning is calendar-based, organized by month and day, not by sprint or epic. Each working day produces sequentially numbered planning files (`DD-01.md`, `DD-02.md`, etc.) covering execution plan, files changed, SENTRY gate result, and completion summary. A per-day approval tracker records gate decisions for all 17 commands. A TP Queue system (four dot-files: `.tp-active`, `.tp-backlog`, `.tp-incoming`, `.tp-ready`) provides an in-flight task queue but is currently empty. A `.batsignal` file holds a pending NickFury work order (Traffic deep review). Tickets are not standalone files — they live as memory entries in the Claude Code memory system and as YAML-frontmatter files in `CURRENT/features/dashboard/evidence/memory/`. There are no sprint directories; the unit of planning is the session, not the sprint.

### 10.7 Command Architecture

All 17 commands route output to `_ACTIVE/audits/[category]/` as their primary sink. CURRENT is updated selectively by WOLVERINE and LOGAN after planning or documentation sessions. HISTORY captures only WOLVERINE run logs (via `commands/wolverine/` folder) and DB snapshots (via `_HISTORY/db/snapshots/`). All other 15 commands accumulate in `_ACTIVE/audits/` indefinitely with no promotion mechanism. ARCHITECT is the system's most complete command — it dual-writes to `_ACTIVE/` (ephemeral) and `_CANONICAL/logan/marvel/architect/` (permanent governance). DR. STRANGE is the only completely unbuilt command — zero execution files exist anywhere in the filesystem. HAWKEYE is the most underdeployed active command with one confirmed run. The absence of HISTORY capture paths for 15 of 17 commands is the single largest architectural gap in the command system.

### 10.8 Key Drift Findings

The most critical drift issues in order of severity:

**P0:** DRIFT-016 (20+ active features have no CURRENT folder, directly blocking DR. STRANGE for the majority of the platform surface area). DRIFT-018 (identity VF-01 HIGH finding — `provision_vcsm_identity` missing `auth.uid()` guard — deployment status unknown; unresolved security finding with no closed-loop confirmation).

**P1:** DRIFT-001 / DRIFT-019 (dual HISTORY paths — `HISTORY/` and `_HISTORY/` both active with identical structural schemas and no routing rule). DRIFT-017 (platform/security CURRENT document 23 days stale with 7 SECURITY DEFINER release blockers still open as of last entry).

**P2:** DRIFT-003 (4 vision files with spaces in names — naming rule violation). DRIFT-005 (tooling artifact in documentation tree). DRIFT-006 (memory artifact in architecture documentation folder). DRIFT-007 (stale `batman/` folder name for NickFury logs). DRIFT-010 (Logan README outdated — wrong command names, missing 432-file VPORT subtree from index). DRIFT-011 (no audit archiving mechanism — indefinite accumulation). DRIFT-012 (`_BACKUPS/` 33+ days stale). DRIFT-013 (no Wentrex skill contract). DRIFT-014 (18 active commands missing `marvel/` log folders).

### 10.9 Duplication Findings

There are three duplication findings, none involving content duplication (no file is duplicated), but all involving structural duplication that creates routing ambiguity.

1. **History system dual-path:** `HISTORY/2026/06/commands/wolverine/` and `_HISTORY/2026/06/commands/wolverine/` both exist and both received Wolverine run files on the same day (2026-06-02). Zero content overlap but identical schemas — a routing ambiguity that will grow worse with each new session.

2. **ARCHITECT dual-write:** ARCHITECT writes to both `_ACTIVE/audits/architecture/` (4 files, ephemeral) and `_CANONICAL/logan/marvel/architect/` (556 files, permanent). This is intentional and correct — not a problem — but it means that `_ACTIVE/audits/architecture/` is a lower-fidelity staging area while the canonical record is in `_CANONICAL/`. Commands reading audit history may find incomplete picture if they only check `_ACTIVE/`.

3. **Auth feature location:** Auth is documented under `CURRENT/features/auth/` (a feature-domain classification) but could also be argued to belong under `CURRENT/platform/auth/` (a platform-layer classification). The CURRENT/platform/ folder has a `security/` section but no `auth/` section — this ambiguity means auth governance is split between two different organizational philosophies without a clear rule resolving which takes precedence.

### 10.10 Future-State Recommendation

The ideal end state for `zNOTFORPRODUCTION` is a four-zone system with clear purpose boundaries and single canonical sinks:

Zone 1 — `_CANONICAL/`: Locked reference. Contracts, skills, Logan documentation, ARCHITECT governance registry. Never modified by session output. Updated only by deliberate Logan documentation passes.

Zone 2 — `CURRENT/`: Living governance. Per-feature status, open findings, history indexes. Updated by WOLVERINE and LOGAN after verified execution passes. Complete coverage of all active features.

Zone 3 — `HISTORY/`: Single canonical archive. All command run logs, session summaries, DB snapshots, and completed audit records. Date-tree structured. `_HISTORY/` merged in. `_BACKUPS/` moved to `HISTORY/2026/04/backups/`. Rotation mechanism established so `_ACTIVE/audits/` files over 90 days old are promoted here.

Zone 4 — `_ACTIVE/`: Working zone only. Active session outputs, planning files, debuggers, tools, migrations in progress. Cleared of stale content after each major sprint. No permanent storage.

This eliminates `_HISTORY/`, `LEGACY/`, and `_BACKUPS/` as independent top-level folders. It consolidates all history into one addressable tree. It provides clear routing rules: new command output goes to `_ACTIVE/audits/`; promoted or completed output goes to `HISTORY/`; permanent governance goes to `_CANONICAL/`; feature state goes to `CURRENT/`.

### 10.11 Relocation Recommendations (High-Level Only)

| Source | Destination | Priority | Notes |
|---|---|---|---|
| `_HISTORY/session-summaries/` | `HISTORY/session-summaries/` | P1 | Direct move, preserves YYYY-MM/ structure |
| `_HISTORY/db/snapshots/` | `HISTORY/db/snapshots/` | P1 | Direct move, 18 timestamped files |
| `_HISTORY/2026/06/commands/wolverine/` | Merge into `HISTORY/2026/06/commands/wolverine/` | P1 | Zero overlap confirmed; safe merge |
| `_HISTORY/PROM/` | `HISTORY/PROM/` or `_CANONICAL/` | P2 | Depends on whether PROM docs are reference contracts (canonical) or session artifacts (history) |
| `_BACKUPS/` (9 cleared folders) | `HISTORY/2026/04/backups/` | P2 | Human confirmation first; do not delete |
| `_BACKUPS/` (3 review-required folders) | `HISTORY/2026/04/backups/` | P2 | Requires manifest spot-check before moving |
| `LEGACY/` | Delete | P3 | Empty; no content to preserve |
| Root `.md` files (2) | `HISTORY/2026/06/` | P3 | After TICKET-0007 execution completes |
| `_CANONICAL/logan/marvel/batman/` | Rename to `nickfury/` | P2 | Content preserved; directory rename only |
| `_CANONICAL/logan/marvel/bugsbunny/` | Rename to `deadpool/` | P3 | Empty; safe rename |
| `_CANONICAL/logan/vcsm.reviews.engine-integration.md` | `_CANONICAL/logan/vcsm/` | P3 | Move within same parent tree |
| `_CANONICAL/logan/vcsm/dal/.claude/` (tooling artifact) | Delete | P2 | Machine-generated artifact; no content value |
| `_CANONICAL/logan/marvel/architect/modules/restoredMap/feedback_ticketing_output_format.md` | Delete or move to memory | P2 | Feedback artifact in wrong location |
| Vision files (4 with spaces) | Rename in-place (remove spaces) | P2 | Content preserved; filename only |
| `CURRENT/features/dashboard/evidence/2026-05-26_22-12_thor_vport-qr-gas-module.md` | `CURRENT/features/dashboard/evidence/` | P3 | Misrouted THOR file |

### 10.12 Risk Assessment

| Risk | Severity | Probability | Impact |
|---|---|---|---|
| Identity VF-01 finding (`provision_vcsm_identity` missing `auth.uid()` guard) may already be in production without the fix applied | CRITICAL | Medium | Authentication bypass possible; actor identity could be spoofed in edge cases |
| `TICKET-BOOKING-RPC-001` open: customer_actor_id injection and booking status overpermission confirmed on live DB; no CURRENT anchor means this finding has no governance home and could be forgotten | CRITICAL | High | Unauthorized booking state mutations possible in production |
| Dual HISTORY system routing ambiguity: new Wolverine session writes to `_HISTORY/` when it should route to `HISTORY/`, causing institutional record to fragment across two locations | HIGH | High | Historical record becomes unreliable; DR. STRANGE reads incomplete history |
| 7 SECURITY DEFINER release blockers in `platform/security/` have no status update since 2026-05-10; these may be resolved but are still marked open in the governance system | HIGH | Medium | Release gating may block on already-resolved findings; or unresolved findings may ship unnoticed |
| CURRENT governance coverage gap for vport (P0 feature): no CURRENT folder means DR. STRANGE cannot answer state questions for the platform's most fundamental feature | HIGH | Certain (already true) | Governance blindspot on highest-dependency feature |
| Stale `_BACKUPS/` with missing manifests (3 folders): `phase6-screen-splits-backup` has no manifest and original file paths are unknown; if original source files were deleted, these are the only copies | MEDIUM | Low | Potential data loss if source files needed for reference |
| HISTORY migration from `_HISTORY/` not yet executed: institutional memory (session summaries, DB snapshots) is stranded in a folder being superseded; if `_HISTORY/` is accidentally deleted before migration, 3 months of records are lost | MEDIUM | Low | Loss of historical context; DB audit evidence trail severed |
| No audit archiving mechanism: `_ACTIVE/audits/` will grow unboundedly; as file count increases, command output discovery becomes slower and less reliable | MEDIUM | Certain (time-based) | Degraded command effectiveness over time |
| Wentrex has no execution skill contract: Wentrex work proceeds without a behavioral contract equivalent to `vcsm/SKILL.md`, increasing risk of cross-app contamination or contract violations | MEDIUM | Medium | Inconsistent engineering quality on Wentrex sessions |
| Stale `.claude/` artifact in documentation tree: tooling-generated memory file inside `logan/vcsm/dal/`; could be overwritten or cause confusion in Logan documentation passes | LOW | Low | Minor documentation pollution |

### 10.13 Suggested Cleanup Tickets

```
[TICKET-DOCS-CLEANUP-001] Create CURRENT folders for CRITICAL missing features
Priority: P0
Type: TASK
Scope: Create CURRENT/features/ folders for: booking, vport, actors, settings
  Each folder needs: README.md, CURRENT_STATUS.md, HISTORY_INDEX.md, SECURITY.md
  Booking must reference TICKET-BOOKING-RPC-001 explicitly
  Vport must reference P0 classification and open ARCHITECT governance
Rationale: These 4 features are CRITICAL/P0/HIGH tier with no DR. STRANGE anchor; booking has a live security finding with customer_actor_id injection confirmed; vport is the foundational feature
Depends On: Nothing — can begin immediately
```

```
[TICKET-DOCS-CLEANUP-002] Resolve identity VF-01 deployment status
Priority: P0
Type: SEC
Scope: Confirm whether provision_vcsm_identity auth.uid() guard fix is deployed to production
  Update CURRENT/features/identity/SECURITY.md with confirmed deployment status
  If not deployed: escalate to active security sprint immediately
Rationale: VF-01 HIGH finding with unknown production status is an open security liability
Depends On: DB access to confirm RPC definition on live Supabase
```

```
[TICKET-DOCS-CLEANUP-003] Merge _HISTORY into HISTORY and decommission _HISTORY
Priority: P1
Type: TASK
Scope: Move _HISTORY/session-summaries/ to HISTORY/session-summaries/
  Move _HISTORY/db/snapshots/ to HISTORY/db/snapshots/
  Merge _HISTORY/2026/06/commands/wolverine/ files into HISTORY/2026/06/commands/wolverine/
  Evaluate _HISTORY/PROM/ — move to HISTORY/PROM/ or _CANONICAL/ based on document type
  Confirm zero content overlap before deletion (comm -12 already confirms this)
  Delete _HISTORY/ after migration confirmed
Rationale: Eliminates dual-system ambiguity; consolidates institutional memory into single canonical archive
Depends On: TICKET-0007 execution (ensures HISTORY/ structure is stable before merging)
```

```
[TICKET-DOCS-CLEANUP-004] Update CURRENT/platform/security/ staleness
Priority: P1
Type: SEC
Scope: Review 7 SECURITY DEFINER release blockers documented in platform/security/CURRENT_STATUS.md
  Confirm current status of each blocker against live DB and codebase
  Update CURRENT_STATUS.md with confirmed resolved/open status for each
  Date-stamp the update
Rationale: 23-day staleness on a security-tier governance document with release blockers marked open is a liability; commands reading this document will make incorrect gating decisions
Depends On: DB access; VENOM or ELEKTRA run on platform/security scope
```

```
[TICKET-DOCS-CLEANUP-005] Archive _BACKUPS to HISTORY and delete LEGACY
Priority: P2
Type: TASK
Scope: Move 9 cleared _BACKUPS folders to HISTORY/2026/04/backups/ (per HISTORY_RELOCATION_COVERAGE_AUDIT.md classification)
  Perform manifest spot-check on 3 review-required folders before moving:
    phase6-screen-splits-backup (no manifest — identify original source paths)
    backups-nested-20260430 (complex nested structure — verify no unique source files)
    high-risk-architecture-backup-20260430-182421 (has manifest — verify files in live repo)
  Move all 3 after spot-check confirms
  Delete LEGACY/ (empty — no content)
Rationale: _BACKUPS/ is 33+ days stale and consuming 298 files in the working zone; LEGACY/ is an empty orphan
Depends On: Human approval per HISTORY_RELOCATION_COVERAGE_AUDIT.md classification
```

```
[TICKET-DOCS-CLEANUP-006] Create missing CURRENT folders for remaining active features
Priority: P2
Type: TASK
Scope: Create CURRENT/features/ folders for: join, public, settings, invite, upload, explore, onboarding, void, hydration, ads, professional
  Create CURRENT/platform/ folders for: actors, upload, media, hydration
  Minimum viable content: README.md + CURRENT_STATUS.md + HISTORY_INDEX.md per folder
Rationale: These features have no DR. STRANGE anchor; governance is effectively blind for 11+ active features
Depends On: TICKET-DOCS-CLEANUP-001 (establishes the pattern)
```

```
[TICKET-DOCS-CLEANUP-007] Rename stale command folders in _CANONICAL/logan/marvel
Priority: P2
Type: TASK
Scope: Rename _CANONICAL/logan/marvel/batman/ to nickfury/
  Rename _CANONICAL/logan/marvel/bugsbunny/ to deadpool/
  Update _CANONICAL/logan/README.md to: reflect correct command names, add marvel/nickfury and marvel/deadpool entries, add the architect/VPORT/ subtree to the index
Rationale: batman/ and bugsbunny/ are stale aliases from before the 2026-05-11 rename; the README is also missing 432 files from its own index
Depends On: Nothing
```

```
[TICKET-DOCS-CLEANUP-008] Fix naming violations in _CANONICAL/vision
Priority: P2
Type: TASK
Scope: Rename 4 files in _CANONICAL/vision/ to remove spaces:
  "Founder Narrative.md" -> founder-narrative.md
  "The Vibez Citizens Manifesto.md" -> vibez-citizens-manifesto.md
  "Product Philosophy.md" -> product-philosophy.md
  "Platform Principles.md" -> platform-principles.md
Rationale: Spaces in filenames violate the naming rule in CLAUDE.md and SKILL.md
Depends On: Nothing — content unchanged, filename only
```

```
[TICKET-DOCS-CLEANUP-009] Remove tooling artifacts from documentation tree
Priority: P2
Type: TASK
Scope: Delete _CANONICAL/logan/vcsm/dal/.claude/ (entire directory — tooling artifact)
  Delete _CANONICAL/logan/marvel/architect/modules/restoredMap/feedback_ticketing_output_format.md (memory artifact)
  Move _CANONICAL/logan/vcsm.reviews.engine-integration.md to _CANONICAL/logan/vcsm/ (misplaced file — content unchanged)
Rationale: Machine-generated tooling files and memory artifacts pollute the documentation tree; misplaced file is in wrong directory
Depends On: Nothing
```

```
[TICKET-DOCS-CLEANUP-010] Create missing marvel command log folders
Priority: P2
Type: TASK
Scope: Create empty stub folders in _CANONICAL/logan/marvel/ for all active commands with no log folder:
  blackwidow/, db/, elektra/, falcon/, hawkeye/, logan/, review-contract/,
  session-summary/, shield/, spider-man/, watcher/, wintersoldier/,
  cerebro/, dataengineer/, sentry/
  Each stub folder: add a single README.md documenting the command name, output convention, and link to skill contract
Rationale: 18 of 21 active commands have no canonical log destination; command attribution is invisible in the governance system for 85% of commands
Depends On: TICKET-DOCS-CLEANUP-007 (rename batman/ and bugsbunny/ first)
```

```
[TICKET-DOCS-CLEANUP-011] Create Wentrex skill contract
Priority: P2
Type: TASK
Scope: Create _CANONICAL/skills/wentrex/SKILL.md — Wentrex execution contract
  Equivalent in scope to vcsm/SKILL.md (17 sections)
  Must cover: Wentrex architecture, LMS-specific layer rules, app isolation contract,
  ticket workflow, security routing, build/test discipline, never-ship list
Rationale: Wentrex is an active product with no behavioral execution contract; vcsm/SKILL.md governs VCSM sessions but has no Wentrex equivalent; risk of cross-app contamination and inconsistent quality
Depends On: Review of apps/wentrex/CLAUDE.md for existing rules
```

```
[TICKET-DOCS-CLEANUP-012] Establish audit archival rotation policy
Priority: P2
Type: TASK
Scope: Define a rotation policy for _ACTIVE/audits/ — recommendation: files older than 90 days move to HISTORY/YEAR/MONTH/audits/[category]/
  Implement the first rotation pass: identify all audit files from before 2026-03-03 (90 days ago from 2026-06-02)
  Move them to the appropriate HISTORY/ path
  Document the rotation policy in _ACTIVE/audits/README.md (create if absent)
Rationale: _ACTIVE/audits/ has no archiving mechanism; all 17 categories are growing unboundedly; older audits create noise that reduces command output findability
Depends On: TICKET-DOCS-CLEANUP-003 (HISTORY/ must be fully established before promotion target is stable)
```

```
[TICKET-DOCS-CLEANUP-013] Close TICKET-0007 and move root governance files
Priority: P3
Type: TASK
Scope: After TICKET-0007 execution is complete (all 398 files relocated):
  Move HISTORY_RELOCATION_AUDIT.md to HISTORY/2026/06/
  Move HISTORY_RELOCATION_COVERAGE_AUDIT.md to HISTORY/2026/06/
Rationale: These working documents belong in the history archive once the work they describe is done; leaving them at the zNOTFORPRODUCTION root is a minor placement inconsistency
Depends On: TICKET-0007 execution complete; HISTORY/ fully established (TICKET-DOCS-CLEANUP-003)
```

---

*Report generated: 2026-06-02 | Scope: read-only discovery pass | No files were modified, moved, renamed, or deleted during this discovery.*
