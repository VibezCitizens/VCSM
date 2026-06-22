# FINAL_SUMMARY.md
# Ticket: DOCS-ORG-001
# Documentation System Rebuild — Executive Summary
# Date: 2026-06-02
# Status: READ-ONLY PLANNING — No files modified

---

## WHAT IS WRONG TODAY

### The core problem: command-first, not feature-first

The current documentation system organizes output by which command ran it, not by which feature it describes. To answer "what is the current security status of booking?", you must know that VENOM, ELEKTRA, BLACKWIDOW, SENTRY, SHIELD, CARNAGE, THOR, IRONMAN, SPIDER-MAN, LOKI, and KRAVEN have all independently audited booking — then read 35+ files sorted by date and synthesize them mentally. No file answers that question directly.

### Problem list (severity order)

| # | Problem | Severity |
|---|---|---|
| 1 | Command logs live inside the canonical folder (`_CANONICAL/logan/marvel/`) | CRITICAL |
| 2 | No per-feature "current status" file exists for any feature | CRITICAL |
| 3 | 35+ booking files, still no single answer for current booking security posture | HIGH |
| 4 | 17% of features have full documentation; 34 features have gaps or none | HIGH |
| 5 | learning system (175 files) has zero documentation | HIGH |
| 6 | Planning files have no archive path — will reach 1,500+ files/year | HIGH |
| 7 | node_modules (110MB) inside the documentation system | MEDIUM |
| 8 | Commands write to different locations for the same output type | MEDIUM |
| 9 | Deferred items scattered across memory, audit files, and tickets — no registry | MEDIUM |
| 10 | Stale audit files indistinguishable from current ones — no superseded labels | MEDIUM |
| 11 | Empty placeholder folders signal intent with no content (8 empty debuggers) | LOW |
| 12 | Renamed commands (batman→NickFury, bugsbunny→Deadpool) leave orphan folders | LOW |

---

## SHOULD zNOTFORPRODUCTION BECOME LEGACY?

**Yes. Unambiguously.**

zNOTFORPRODUCTION has accumulated 7,793 files across 3+ years of organic growth. The folder has no concept of "current truth" vs "historical artifact" at the feature level. It cannot answer "what is true now" — only "here is every audit that ever ran."

That history is valuable and must be preserved. But it should be frozen, renamed, and linked from the new system as a reference archive, not updated as if it is still the live documentation home.

---

## WHAT SHOULD THE NEW DOCUMENTATION ROOT BE?

```
/Users/vcsm/Desktop/VCSM/_DOCS/
```

Underscore prefix is consistent with zNOTFORPRODUCTION's own internal `_ACTIVE/`, `_CANONICAL/`, `_HISTORY/`, `_BACKUPS/` convention. Uppercase makes it visually distinct from source code directories. Does not trigger GitHub Pages. Does not conflict with any existing folder.

---

## HOW SHOULD EVERY FEATURE GET ISOLATED DOCS?

Each feature gets a folder under `_DOCS/CURRENT/features/[feature]/`.

Files are created on first use, not pre-created as empty shells. The standard set:

| File | When Created | What It Contains |
|---|---|---|
| README.md | First touch | 3-sentence summary |
| SOURCE_MAP.md | First touch | Layer map from code |
| CURRENT_STATUS.md | First touch | What works, what's deferred |
| SECURITY.md | After first VENOM run | Trust boundaries, RLS, ownership |
| ARCHITECTURE.md | After first ARCHITECT run | Data flow, layer diagram |
| OWNERSHIP.md | After first IRONMAN run | Who can write/read, actor assertions |
| TESTS.md | After first SPIDER-MAN run | Coverage status |
| PERFORMANCE.md | After first KRAVEN run | Bottlenecks, query strategies |
| DEFERRED.md | When first deferral occurs | Links to REGISTRY/DEFERRED_ITEMS.md |
| HISTORY_INDEX.md | When HISTORY entries accumulate | Links to evidence, never copies content |

**Rule:** SECURITY.md is the only place current security posture lives. It is not duplicated in AUDIT_STATUS.md, CURRENT_STATUS.md, or HISTORY files.

---

## HOW SHOULD COMMAND OUTPUTS BE ORGANIZED?

Every command has exactly two output targets:

1. **HISTORY artifact** — dated run record, always created, never edited after month closes
2. **CURRENT update** — updates the feature's living source-of-truth file (only if truth changed)

HISTORY artifacts live in: `_DOCS/HISTORY/YYYY/MM/commands/[command]/`

Commands have narrow, specific write permissions to CURRENT files:

| Command | Can Update |
|---|---|
| VENOM / ELEKTRA / BLACKWIDOW | SECURITY.md only |
| CARNAGE | database/rls/ + ARCHITECTURE.md (schema section) |
| THOR | CURRENT_STATUS.md (release section) |
| IRONMAN | OWNERSHIP.md |
| ARCHITECT | ARCHITECTURE.md + SOURCE_MAP.md |
| SPIDER-MAN | TESTS.md |
| KRAVEN | PERFORMANCE.md |
| LOGAN | Any CURRENT file — LOGAN is the gatekeeper |
| All others | HISTORY only |

**The critical shift:** Commands no longer create free-floating audit files that accumulate. Every command run either updates a known CURRENT file or adds to a known HISTORY folder. No more ad-hoc file creation.

---

## HOW SHOULD MONTHLY HISTORY WORK?

History is organized by month: `_DOCS/HISTORY/YYYY/MM/`

On the 1st of each month:
- A new month folder is created
- All new command runs go into the new month
- Prior month's files are frozen — never edited again
- CURRENT/ files are NOT moved to history — they stay in place and are updated in-place

CURRENT/ files always reflect the latest truth.
HISTORY/ files always preserve the evidence trail.

A CURRENT file links to its recent HISTORY entries in `HISTORY_INDEX.md`. A HISTORY file links to the CURRENT file it informed in its metadata header. The two systems are linked but never conflated.

---

## WHAT IS THE ONE SOURCE OF TRUTH PER FEATURE?

`_DOCS/CURRENT/features/[feature]/SECURITY.md` — for security posture
`_DOCS/CURRENT/features/[feature]/ARCHITECTURE.md` — for system architecture
`_DOCS/CURRENT/features/[feature]/OWNERSHIP.md` — for ownership rules
`_DOCS/CURRENT/features/[feature]/CURRENT_STATUS.md` — for release and operational status

No other file claims current truth about a feature. All other files are historical evidence.

---

## WHAT REGISTRIES SHOULD EXIST?

| Registry | Purpose | Who Updates |
|---|---|---|
| FEATURE_REGISTRY.md | All features, doc coverage, security tier | Any command that changes status |
| COMMAND_REGISTRY.md | All commands, last run, output location | WOLVERINE or session-summary |
| AUDIT_STATUS_REGISTRY.md | Feature × Command matrix, last audit date | Each command on completion |
| DEFERRED_ITEMS.md | All open deferred findings | Command that defers + LOGAN review |
| BLOCKERS.md | Active blockers | Ticket workflow |
| RELEASE_TRACKER.md | Feature readiness gate status | THOR |

The registries replace scattered memory entries and ad-hoc ticket tracking for documentation state.

---

## WHAT SHOULD BE MIGRATED FIRST?

**Phase 1 — Scaffold (first):** Create `_DOCS/` folder structure and governance contracts. Nothing from zNOTFORPRODUCTION is touched.

**Phase 2 — Seed 6 features (second):** Write CURRENT files for booking, auth, identity, dashboard, feed, and chat. These are the highest-impact features with the most existing canonical material.

**Phase 3 — Registries (third):** Populate the 6 registry files from existing docs. This is the first time the "full picture" becomes visible in one place.

**After Phase 3:** Redirect commands to write to `_DOCS/`. Only then do the historical archives and canonical migrations happen.

---

## WHAT SHOULD NOT BE MOVED YET?

| Asset | Reason |
|---|---|
| `_CANONICAL/zcontract/` | Deeply referenced by CLAUDE.md and all audit files — safe to link, unsafe to move until CURRENT is stable |
| `_CANONICAL/skills/` | Active behavioral contracts — update to point at new locations, but don't move files |
| `_ACTIVE/tools/` | Contains node_modules — needs separate cleanup decision before migration |
| `_BACKUPS/` | Human retention decision required |
| `_ACTIVE/migrations/` (.sql) | SQL scripts are not documentation — separate decision |
| `_CANONICAL/logan/traffic/` | Belongs to Traffic product — keep with that product |
| `_CANONICAL/logan/wentrex/` | Belongs to Wentrex product — keep with that product |

---

## HUMAN DECISIONS REQUIRED BEFORE MIGRATION BEGINS

| # | Decision | Options |
|---|---|---|
| 1 | Confirm new root name | `_DOCS/` (recommended) or alternative |
| 2 | Confirm legacy folder name | `zNOTFORPRODUCTION_LEGACY/` or `_LEGACY/zNOTFORPRODUCTION/` |
| 3 | What happens to `_ACTIVE/tools/node_modules`? | Delete + gitignore; move tools to separate repo; keep as-is |
| 4 | Are the April 30, 2026 _BACKUPS safe to leave as archival? | Yes — confirm retention permanently; or set a deletion date |
| 5 | Where do SQL migration scripts live in new system? | `_DOCS/HISTORY/YYYY/MM/migrations/` or a dedicated `migrations/` folder outside docs |
| 6 | Is `CHAT_MIGRATION_PLAN.md` in zcontract/ still accurate? | If not, update before marking superseded |
| 7 | Should Traffic and Wentrex canonical docs move into their respective app directories? | Yes / No |
| 8 | Approve the 12-session migration estimate and commit to completing all phases | Go / No-go |

---

## CLOSING STATEMENT

The current system proves the value of documentation discipline — contracts, audit trails, multi-actor cross-validation, and drift detection are all in place. The problem is not discipline; it is topology. Outputs are organized by who produced them, not by what they describe.

The new system is the same discipline with a different organizing principle: **every feature owns its truth**. Commands contribute to features. History preserves evidence. Registries surface the aggregate view.

The migration is safe, additive, and reversible until the final rename step. The greatest risk is not starting — because without a CURRENT/ file per feature, every new audit adds a 36th booking file rather than updating the one source of truth that already answers the question.

Start with Phase 1. The scaffold costs one session and commits to nothing.
