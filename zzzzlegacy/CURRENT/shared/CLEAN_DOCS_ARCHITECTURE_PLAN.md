# CLEAN_DOCS_ARCHITECTURE_PLAN.md
# Ticket: DOCS-ORG-001
# Phase 4 — Proposed Clean Documentation Architecture
# Date: 2026-06-02
# Status: READ-ONLY PLANNING — No files created yet

---

## PROPOSED DOCUMENTATION ROOT

```
/Users/vcsm/Desktop/VCSM/_DOCS/
```

**Why `_DOCS/` and not `docs/`:**
- The underscore prefix follows the existing convention (`_ACTIVE`, `_CANONICAL`, `_HISTORY`, `_BACKUPS`) — consistent with how zNOTFORPRODUCTION is organized internally
- The uppercase makes it visually distinct from source code directories
- Sorting by name places it near the top of the repo root alongside other `_` prefixed folders
- It is not `docs/` (lowercase) which is a GitHub convention that triggers GitHub Pages deployment

**Why a separate root instead of restructuring zNOTFORPRODUCTION:**
- zNOTFORPRODUCTION has deep historical context and links from memory, CLAUDE.md, and tickets
- Moving it to legacy preserves its integrity while the new system is clean from day 1
- No risk of partially-migrated state contaminating either the old or new system

---

## FULL FOLDER STRUCTURE

```
_DOCS/
│
├── README.md                                   # Entry point — how to use this system
├── DOCS_ARCHITECTURE_CONTRACT.md               # Rules: what goes where, naming, lifecycle
├── COMMAND_OUTPUT_CONTRACT.md                  # Per-command write rules (see artifact 4)
│
├── CURRENT/                                    # Living source of truth — one per feature
│   │
│   ├── features/
│   │   ├── actors/
│   │   ├── ads/
│   │   ├── auth/
│   │   ├── block/
│   │   ├── booking/
│   │   ├── chat/
│   │   ├── dashboard/
│   │   ├── explore/
│   │   ├── feed/
│   │   ├── hydration/
│   │   ├── identity/
│   │   ├── invite/
│   │   ├── join/
│   │   ├── learning/
│   │   ├── legal/
│   │   ├── media/
│   │   ├── moderation/
│   │   ├── notifications/
│   │   ├── onboarding/
│   │   ├── portfolio/
│   │   ├── post/
│   │   ├── professional/
│   │   ├── profiles/
│   │   ├── public/
│   │   ├── reviews/
│   │   ├── settings/
│   │   ├── social/
│   │   ├── upload/
│   │   ├── vgrid/
│   │   ├── void/
│   │   ├── vport/
│   │   └── wanders/
│   │
│   ├── platform/
│   │   ├── routing/
│   │   ├── services/
│   │   ├── state/
│   │   ├── bootstrap/
│   │   ├── realtime/
│   │   ├── i18n/
│   │   └── performance/
│   │
│   ├── database/
│   │   ├── schema/
│   │   ├── rls/
│   │   ├── functions/
│   │   └── migrations/
│   │
│   ├── security/
│   │   ├── trust-model/
│   │   ├── rls-status/
│   │   └── audit-summary/
│   │
│   ├── native/
│   │   ├── parity/
│   │   └── transfer/
│   │
│   └── releases/
│       └── RELEASE_STATUS.md
│
├── HISTORY/
│   └── 2026/
│       ├── 04/
│       │   ├── commands/
│       │   │   ├── architect/
│       │   │   ├── venom/
│       │   │   ├── elektra/
│       │   │   ├── blackwidow/
│       │   │   ├── carnage/
│       │   │   ├── thor/
│       │   │   ├── ironman/
│       │   │   ├── loki/
│       │   │   ├── kraven/
│       │   │   ├── spiderman/
│       │   │   ├── hawkeye/
│       │   │   ├── watcher/
│       │   │   ├── db/
│       │   │   ├── deadpool/
│       │   │   ├── sentry/
│       │   │   ├── shield/
│       │   │   └── wolverine/
│       │   ├── audits/
│       │   ├── migrations/
│       │   ├── planning/
│       │   └── session-summaries/
│       ├── 05/
│       │   ├── commands/
│       │   ├── audits/
│       │   ├── migrations/
│       │   ├── planning/
│       │   └── session-summaries/
│       └── 06/
│           ├── commands/
│           ├── audits/
│           ├── migrations/
│           ├── planning/
│           └── session-summaries/
│
├── LEGACY/
│   └── zNOTFORPRODUCTION/        # Symlink or renamed copy — never updated
│
└── REGISTRY/
    ├── FEATURE_REGISTRY.md        # All features, status, doc coverage
    ├── COMMAND_REGISTRY.md        # All commands, output rules, last run
    ├── AUDIT_STATUS_REGISTRY.md   # Per-feature audit status by command
    ├── DEFERRED_ITEMS.md          # All open deferred findings
    ├── BLOCKERS.md                # All active blockers
    └── RELEASE_TRACKER.md         # Feature readiness gate status
```

---

## STANDARD FILES PER FEATURE FOLDER

Every feature folder under `CURRENT/features/[feature]/` contains the same file set. Files are created on first use — not pre-created as empty shells.

### Required on First Touch
```
README.md               # 3-sentence summary: what it is, who uses it, security sensitivity
SOURCE_MAP.md           # Layer map: every DAL, model, controller, hook, screen (derive from code)
CURRENT_STATUS.md       # One-page current truth: what works, what's deferred, last updated
```

### Added After First Audit
```
AUDIT_STATUS.md         # Per-command audit coverage table: when last run, findings count, status
SECURITY.md             # Current security posture: trust boundaries, ownership assertions, RLS status
OWNERSHIP.md            # Who can write, who can read, assertActorOwns pattern usage
ARCHITECTURE.md         # Feature architecture: layer diagram, data flow, external dependencies
```

### Added After Audit Finds Complexity
```
PERFORMANCE.md          # Known bottlenecks, query strategies, caching patterns
TESTS.md                # Test coverage status, test paths, untested surfaces
TRIAD.md                # Combined view: source of truth for security + ownership + architecture
```

### Lifecycle Tracking
```
DEFERRED.md             # Items deferred from audits (linked to REGISTRY/DEFERRED_ITEMS.md)
BLOCKERS.md             # Active blockers (linked to REGISTRY/BLOCKERS.md)
CHANGELOG.md            # Human-readable change log: what changed and when
HISTORY_INDEX.md        # Index of all HISTORY/ entries for this feature (links, not copies)
```

### Rule: No Duplicate Content
`SECURITY.md` is the ONLY place the current security posture of a feature lives.
`AUDIT_STATUS.md` links to historical evidence in `HISTORY/` — it does not repeat findings.
`CHANGELOG.md` links to session summaries — it does not reproduce them.

---

## MONTHLY HISTORY STRUCTURE

Each month gets its own folder under `HISTORY/YYYY/MM/`.

```
HISTORY/2026/06/
├── commands/
│   ├── venom/
│   │   ├── 2026-06-02_venom_booking-rpc-hardening.md
│   │   └── 2026-06-15_venom_identity-session-audit.md
│   ├── carnage/
│   │   └── 2026-06-05_carnage_booking-rpc-migration.md
│   └── thor/
│       └── 2026-06-05_thor_booking-rpc-release-gate.md
├── audits/
│   ├── 2026-06-02_AUDIT_SUMMARY.md        # Monthly audit index
│   └── redteam/
│       └── 2026-06-10_blackwidow_booking-state-machine.harness.js
├── migrations/
│   └── 2026-06-05_booking-state-machine-rpc.sql
├── planning/
│   └── 06/                                # Daily task logs
│       ├── 06-01.md
│       └── 06-02.md
└── session-summaries/
    └── 2026-06-02_booking-rpc-sprint.md
```

### Month Rollover Rule
- On the 1st of each month: new `HISTORY/YYYY/MM/` folder is created
- No CURRENT/ files are moved to HISTORY/
- CURRENT/ files are updated in place — they always reflect latest truth
- HISTORY/ files are write-once — a file in `HISTORY/2026/05/` is never edited after June 1
- Command runs from a prior month that were not yet archived: move to the month they were run

---

## CONTRACTS FOLDER

`_DOCS/` does not replace `zNOTFORPRODUCTION/_CANONICAL/zcontract/`. The engineering contracts live there and are referenced by CLAUDE.md. They should be promoted to a top-level location but that is a separate decision.

For now: `_DOCS/DOCS_ARCHITECTURE_CONTRACT.md` governs the documentation system itself. The engineering contracts (ARCHITECTURE.md, SECURITY_ENGINEERING_CONTRACT.md, etc.) remain in their current location.

---

## REGISTRY DESIGN

### FEATURE_REGISTRY.md

One row per feature. Updated by any command that changes a feature's status.

```
| Feature | Path | Tier | Security | Doc Coverage | Last Audit | Last Updated |
| auth | features/auth/ | 1 | CRITICAL | FULL | 2026-05-27 | 2026-06-01 |
| booking | features/booking/ | 1 | CRITICAL | FULL | 2026-05-27 | 2026-06-01 |
...
```

### COMMAND_REGISTRY.md

One row per command. Updated by WOLVERINE or session summary.

```
| Command | Last Run | Output Location | Features Touched | Status |
| VENOM | 2026-05-27 | CURRENT/features/booking/SECURITY.md | booking, join, qr | COMPLETE |
...
```

### AUDIT_STATUS_REGISTRY.md

Matrix: feature × command. Shows last audit date per feature per command.

```
| Feature | VENOM | ELEKTRA | CARNAGE | THOR | IRONMAN | SPIDER-MAN | BLACKWIDOW |
| auth | 2026-05-10 | 2026-05-10 | - | 2026-05-27 | 2026-05-14 | 2026-05-26 | 2026-05-27 |
| booking | 2026-05-27 | 2026-05-27 | 2026-05-27 | 2026-05-27 | 2026-05-18 | 2026-05-27 | 2026-05-27 |
| settings | - | - | - | - | - | - | - |
...
```

### DEFERRED_ITEMS.md

Every deferred finding from every audit. One row per item.

```
| ID | Feature | Command | Finding | Deferred On | Reason | Resolve By |
| DEFER-001 | booking | VENOM | customer_actor_id injection | 2026-05-14 | DB-blocked | TBD |
...
```

### BLOCKERS.md

Active blockers preventing feature completion or audit closure.

```
| ID | Feature | Type | Description | Opened | Owner |
| BLOCK-001 | booking | DB | Broad INSERT/UPDATE must become typed RPCs | 2026-05-14 | - |
...
```

---

## WHAT DOES NOT CHANGE

The following remain exactly where they are — the new system does not absorb them:

| Asset | Location | Reason |
|---|---|---|
| Engineering contracts (zcontract/) | `zNOTFORPRODUCTION/_CANONICAL/zcontract/` | Referenced by CLAUDE.md, deep links in audit files |
| Behavioral contracts (skills/) | `zNOTFORPRODUCTION/_CANONICAL/skills/` | Referenced by CLAUDE.md |
| Vision documents (vision/) | `zNOTFORPRODUCTION/_CANONICAL/vision/` | Stable, not documentation artifacts |
| SQL migration scripts | Current location or `CURRENT/database/migrations/` | Developer tooling, not docs |
| Redteam harnesses (.js) | `HISTORY/YYYY/MM/audits/redteam/` | Code artifacts, not documentation |
| node_modules in tools/ | Remove from docs system entirely | Not documentation |
