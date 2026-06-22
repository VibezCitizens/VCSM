# History Relocation Audit

**Date:** 2026-06-02
**Ticket:** TICKET-0007
**Scope:** Documentation only — no source code touched
**Boundary contract enforced:** `zNOTFORPRODUCTION/_CANONICAL/zcontract/PROJECT_BOUNDARY_ISOLATION_CONTRACT.md`
**Scope label:** VCSM (documentation governance only — no protected app root modified)

**Cutoff date:** 2026-05-31

Files dated on or before the cutoff and meeting MOVE_TO_HISTORY criteria are candidates for relocation to `zNOTFORPRODUCTION/HISTORY/`.

---

## Summary

| Category | Count |
|---|---|
| Files Scanned (excl. _CANONICAL, node_modules, .DS_Store) | 1,096 |
| Files Scanned (excl. _BACKUPS) | 798 |
| _BACKUPS files (assessed separately) | 298 |
| KEEP_IN_PLACE | 171 |
| MOVE_TO_HISTORY | 531 |
| NEEDS_REVIEW | 394 |

**Note on _BACKUPS:** The 298 backup files from April 2026 in `_BACKUPS/` are classified NEEDS_REVIEW as a block — they are old enough for archival but may have independent value as restore points. They are listed separately at the end of Section 5.

---

## MOVE_TO_HISTORY

Files are grouped by source folder. All have modification dates ≤ 2026-05-31.
Each group should move as a unit into the target HISTORY path.

| Current Path (Group) | File Count | Destination Path | Reason |
|---|---|---|---|
| `_ACTIVE/planning/april/01/` | 4 | `HISTORY/2026/04/planning/april/01/` | Historical session planning — April 1, 2026 |
| `_ACTIVE/planning/april/04/` | 1 | `HISTORY/2026/04/planning/april/04/` | Historical session planning — April 4 |
| `_ACTIVE/planning/april/05/` | 18 | `HISTORY/2026/04/planning/april/05/` | Historical session planning — April 5 |
| `_ACTIVE/planning/april/06/` | 3 | `HISTORY/2026/04/planning/april/06/` | Historical session planning — April 6 |
| `_ACTIVE/planning/april/09/` | 23 | `HISTORY/2026/04/planning/april/09/` | Historical session planning — April 9 |
| `_ACTIVE/planning/april/10/` | 6 | `HISTORY/2026/04/planning/april/10/` | Historical session planning — April 10 |
| `_ACTIVE/planning/april/12/` | 34 | `HISTORY/2026/04/planning/april/12/` | Historical session planning — April 12 |
| `_ACTIVE/planning/april/13/` | 5 | `HISTORY/2026/04/planning/april/13/` | Historical session planning — April 13 |
| `_ACTIVE/planning/april/16/` | 9 | `HISTORY/2026/04/planning/april/16/` | Historical session planning — April 16 |
| `_ACTIVE/planning/april/18/` | 4 | `HISTORY/2026/04/planning/april/18/` | Historical session planning — April 18 |
| `_ACTIVE/planning/april/19/` | 16 | `HISTORY/2026/04/planning/april/19/` | Historical session planning — April 19-20 |
| `_ACTIVE/planning/april/20/` | 4 | `HISTORY/2026/04/planning/april/20/` | Historical session planning — April 20 |
| `_ACTIVE/planning/april/25/` | 1 | `HISTORY/2026/04/planning/april/25/` | Historical session planning — April 25 |
| `_ACTIVE/planning/april/26/` | 3 | `HISTORY/2026/04/planning/april/26/` | Historical session planning — April 26 |
| `_ACTIVE/planning/april/30/` | 25 | `HISTORY/2026/04/planning/april/30/` | Historical session planning — April 30 batch (includes batch8 manifest) |
| `_ACTIVE/planning/batman/may/03/` | 1 | `HISTORY/2026/05/planning/batman/` | Batman-era (now NickFury) planning — command renamed 2026-05-11 |
| `_ACTIVE/planning/may/02/` | 2 | `HISTORY/2026/05/planning/may/02/` | Historical session planning — May 2 |
| `_ACTIVE/planning/may/03/` | 21 | `HISTORY/2026/05/planning/may/03/` | Historical session planning — May 3 |
| `_ACTIVE/planning/may/04/` | 1 | `HISTORY/2026/05/planning/may/04/` | Historical session planning — May 4 |
| `_ACTIVE/planning/may/09/` | 21 | `HISTORY/2026/05/planning/may/09/` | Historical session planning — May 9 |
| `_ACTIVE/planning/may/10/` | 9 | `HISTORY/2026/05/planning/may/10/` | Historical session planning — May 10 |
| `_ACTIVE/planning/may/11/` | 2 | `HISTORY/2026/05/planning/may/11/` | Historical session planning — May 11 |
| `_ACTIVE/planning/may/12/` | 1 | `HISTORY/2026/05/planning/may/12/` | Historical session planning — May 12 |
| `_ACTIVE/planning/may/14/` | 4 | `HISTORY/2026/05/planning/may/14/` | Historical session planning — May 14 |
| `_ACTIVE/planning/may/18/` | 3 | `HISTORY/2026/05/planning/may/18/` | Historical session planning — May 18 |
| `_ACTIVE/planning/may/19/` | 1 | `HISTORY/2026/05/planning/may/19/` | Historical session planning — May 19 |
| `_ACTIVE/planning/may/24/` | 3 | `HISTORY/2026/05/planning/may/24/` | Historical session planning — May 24 |
| `_ACTIVE/planning/may/25/` | 3 | `HISTORY/2026/05/planning/may/25/` | Historical session planning — May 25-26 |
| `_ACTIVE/planning/may/26/` | 12 | `HISTORY/2026/05/planning/may/26/` | Historical session planning — May 26 |
| `_ACTIVE/planning/may/27/` | 22 | `HISTORY/2026/05/planning/may/27/` | Historical session planning — May 27 |
| `_ACTIVE/planning/2026-05/11/` | 1 | `HISTORY/2026/05/planning/` | Historical planning — cerebro venom fix plan |
| `_ACTIVE/audits/api/` | 2 | `HISTORY/2026/05/audits/api/` | Completed HAWKEYE endpoint audit reports |
| `_ACTIVE/audits/architecture/` | 4 | `HISTORY/2026/05/audits/architecture/` | Completed ARCHITECT audit reports (May 2026) |
| `_ACTIVE/audits/change-provenance/` | 4 | `HISTORY/2026/05/audits/change-provenance/` | Completed WATCHER change provenance reports |
| `CURRENT/features/dashboard/evidence/` | 31 | `HISTORY/2026/05/audits/compliance/` | Completed SENTRY/REVIEW-CONTRACT compliance reports |
| `_ACTIVE/audits/data-engineering/` | 1 | `HISTORY/2026/05/audits/data-engineering/` | Completed DataEngineer audit report |
| `_ACTIVE/audits/documentation/` | 6 | `HISTORY/2026/05/audits/documentation/` | Completed LOGAN documentation audit reports (May 11) |
| `_ACTIVE/audits/ip-safety/` | 1 | `HISTORY/2026/05/audits/ip-safety/` | Completed SHIELD IP safety report |
| `_ACTIVE/audits/migrations/` | 17 | `HISTORY/2026/05/audits/migrations/` | Completed CARNAGE migration audit reports |
| `_ACTIVE/audits/moderation/` | 1 | `HISTORY/2026/05/audits/moderation/` | Completed moderation system review (May 10) |
| `CURRENT/features/dashboard/evidence/` | 8 | `HISTORY/2026/05/audits/ownership/` | Completed IRONMAN ownership audit reports |
| `_ACTIVE/audits/performance/` | 9 | `HISTORY/2026/05/audits/performance/` | Completed KRAVEN performance audit reports |
| `CURRENT/features/dashboard/evidence/` | 22 | `HISTORY/2026/05/audits/redteam/` | Completed BLACKWIDOW adversarial reports |
| `CURRENT/features/dashboard/evidence/` | 13 | `HISTORY/2026/05/audits/release/` | Completed THOR release gate reports |
| `CURRENT/features/dashboard/evidence/` | 8 | `HISTORY/2026/05/audits/runtime/` | Completed LOKI runtime trace reports |
| `CURRENT/features/dashboard/evidence/` (excl. memory/) | 66 | `HISTORY/2026/05/audits/security/` | Completed VENOM/ELEKTRA security audit reports |
| `CURRENT/features/dashboard/evidence/` | 4 | `HISTORY/2026/05/audits/tasks/` | Completed audit task trackers |
| `CURRENT/features/dashboard/evidence/` | 2 | `HISTORY/2026/05/audits/testing/` | Completed SPIDER-MAN test coverage reports |
| `_ACTIVE/native/falcon_chat_dal_parity_2026-05-14.md` | 1 | `HISTORY/2026/05/commands/falcon/` | Completed Falcon parity report — May 14 |
| `_ACTIVE/native/falcon_feed-dal-parity-2026-05-14.md` | 1 | `HISTORY/2026/05/commands/falcon/` | Completed Falcon parity report — May 14 |
| `_ACTIVE/tools/language-audit/*.json` (9 files) | 9 | `HISTORY/2026/05/tools/language-audit/` | Generated JSON snapshots from May 2026 code analysis — static data, not tooling |

**MOVE_TO_HISTORY total: 531 files**

---

## KEEP_IN_PLACE

| Path | Reason |
|---|---|
| `CURRENT/**` (14 files) | Explicitly protected — active feature status and frozen feature contracts |
| `HISTORY/**` (1 file) | Already in canonical history |
| `_HISTORY/**` (41 files) | Already in history area — session summaries, DB snapshots, PROM docs |
| `_ACTIVE/debuggers/**` (51 files) | Active dev-only debug panels and tools — code files (.js/.jsx), not documentation artifacts. Lifecycle governed by debugger architecture contract. |
| `_ACTIVE/redteam-harnesses/**` (3 files) | Active adversarial test harnesses (.js) — not documentation. Created 2026-05-27, part of current security work. |
| `CURRENT/features/dashboard/evidence/memory/ticket_booking_rpc_001.md` | Active deferred ticket reference — TICKET-BOOKING-RPC-001 is OPEN |
| `CURRENT/features/dashboard/evidence/memory/ticket_platform_rls_001.md` | Active deferred ticket reference — TICKET-PLATFORM-RLS-001 is OPEN |
| `_ACTIVE/change-intent/CHANGE_INTENT.md` | Active governance document — tracks in-flight change intent |
| `_ACTIVE/planning/DOCS-ORG-001/**` (6 files) | Paused feature project (per project memory 2026-06-02) — not completed/historical, not active. Paused state must be preserved as-is. |
| `_ACTIVE/tools/graph-codegen/**` (23 files, excl. node_modules) | Active dev tool with maintained source (src/, package.json). Used to generate DAL dependency graphs. |
| `_ACTIVE/tools/language-audit/generate-visible-ui-language.mjs` | Active script that generates the language audit JSON snapshots — the tool, not the data |
| `_CANONICAL/**` | Excluded from scan per contract — never moves |

**KEEP_IN_PLACE total: 171 files** (plus _CANONICAL, which is out of scope)

---

## NEEDS_REVIEW

Items requiring a human decision before any move can be authorized.

| Path | File Count | Reason |
|---|---|---|
| `_ACTIVE/migrations/*.sql` (13 files) | 13 | SQL migration files from May 2026. Unclear whether these were applied to the database or are still pending proposals. Applied migrations → HISTORY. Pending → KEEP. Requires DB audit confirmation before moving. |
| `_ACTIVE/planning/carnage_migrations/**` | 5 | SQL migration proposals (consent immutability, age verification, reviews RLS). Unclear if applied or superseded. Requires CARNAGE/DB cross-reference before moving. |
| `_ACTIVE/planning/moderation-db-remediation/**` | 7 | Moderation remediation plan + 6 SQL proposal batches (May 10). Unknown whether these SQL proposals were applied. If applied → HISTORY. If still pending → KEEP. |
| `_ACTIVE/planning/` (dot-files: `.batsignal.md`, `.tp-active.md`, `.tp-backlog.md`, `.tp-incoming.md`, `.tp-ready.md`, `.tp-lock`) | 6 | Hidden task-pipeline state files. May be tool metadata that should be deleted rather than moved. Unclear if any tooling still references these. |
| `_ACTIVE/native/**` (39 files, excl. falcon reports) | 39 | Native app transfer documentation (ROADTRIP.md, module specs, command center docs). Created May 2026. Unclear whether this is: (a) completed research ready for HISTORY, (b) reference material for ongoing native work, or (c) superseded by a native app decision. Requires FALCON/owner confirmation. |
| `_ACTIVE/tools/vcsm/**` (4 files) | 4 | Unused-import finder scripts + config (April 2026). `.unimportedrc.json`, `find-unused.js/cjs`, `VCSM_Feature_Button_Test_Matrix.xlsx`. May be superceded or still used as a dev utility. |
| `_ACTIVE/tools/wentrex/**` (4 files) | 4 | Same as above for Wentrex. Both duplicates of the vcsm/ tool set. Likely redundant. |
| `_ACTIVE/tools/shield-visualizer/**` (47 files) | 47 | Unknown lifecycle. Not seen in any audit or planning docs. Requires investigation to determine if active, deprecated, or stale. |
| `_BACKUPS/**` (13 backup folders, 298 files total) | 298 | All backups from April 30, 2026. Oldest are 33+ days old as of 2026-06-02. Likely safe to archive to HISTORY, but destructive to delete. Recommend: move to `HISTORY/2026/04/backups/` after spot-checking one backup folder. Do NOT delete — only move. |

**NEEDS_REVIEW total: 423 files** (125 excl. _BACKUPS + 298 _BACKUPS)

---

## Proposed Folder Structure

The following HISTORY folders must be created before any moves execute. Existing folders are marked.

```
HISTORY/
└── 2026/
    ├── 04/                              ← NEW
    │   ├── planning/
    │   │   └── april/
    │   │       ├── 01/
    │   │       ├── 04/
    │   │       ├── 05/
    │   │       ├── 06/
    │   │       ├── 09/
    │   │       ├── 10/
    │   │       ├── 12/
    │   │       ├── 13/
    │   │       ├── 16/
    │   │       ├── 18/
    │   │       ├── 19/
    │   │       ├── 20/
    │   │       ├── 25/
    │   │       ├── 26/
    │   │       └── 30/
    │   └── backups/                     ← NEW (if NEEDS_REVIEW/backups approved)
    ├── 05/                              ← NEW
    │   ├── audits/
    │   │   ├── api/
    │   │   ├── architecture/
    │   │   ├── change-provenance/
    │   │   ├── compliance/
    │   │   ├── data-engineering/
    │   │   ├── documentation/
    │   │   ├── ip-safety/
    │   │   ├── migrations/
    │   │   ├── moderation/
    │   │   ├── ownership/
    │   │   ├── performance/
    │   │   ├── redteam/
    │   │   ├── release/
    │   │   ├── runtime/
    │   │   ├── security/
    │   │   ├── tasks/
    │   │   └── testing/
    │   ├── commands/
    │   │   └── falcon/
    │   ├── planning/
    │   │   ├── batman/
    │   │   └── may/
    │   │       ├── 02/  03/  04/  09/  10/
    │   │       ├── 11/  12/  14/  18/  19/
    │   │       ├── 24/  25/  26/  27/
    │   └── tools/
    │       └── language-audit/
    └── 06/
        └── commands/
            └── wolverine/               ← EXISTS (1 file)
```

**New folders to create: 41**

---

## Risk Assessment

The following files appear active or structurally important and must NOT be moved automatically:

| File / Group | Risk Level | Why It Must Stay |
|---|---|---|
| `CURRENT/FEATURE_STATUS.md` | HIGH | Active feature gate registry. Moving breaks all feature freeze lookups. |
| `CURRENT/FROZEN_FEATURE_CONTRACT.md` | HIGH | Active freeze contract. Moving breaks governance enforcement. |
| `CURRENT/features/dashboard/evidence/memory/ticket_booking_rpc_001.md` | HIGH | Open ticket BOOKING-RPC-001 — customer_actor_id injection vulnerability, unresolved. |
| `CURRENT/features/dashboard/evidence/memory/ticket_platform_rls_001.md` | HIGH | Open ticket PLATFORM-RLS-001 — media_assets public policy cleanup, unresolved. |
| `_ACTIVE/change-intent/CHANGE_INTENT.md` | MEDIUM | Active in-flight change intent tracker. Moving without updating any consumers would lose context. |
| `_ACTIVE/planning/DOCS-ORG-001/**` | MEDIUM | Paused project (not complete, not historical). Moving it to HISTORY would incorrectly mark it closed. |
| `_ACTIVE/migrations/*.sql` | MEDIUM | If any of these are still pending (not yet applied to the DB), moving them would make them inaccessible to migration execution flows. |
| `_ACTIVE/planning/carnage_migrations/**` | MEDIUM | Same risk as above — SQL proposals may be pending. |
| `_ACTIVE/planning/moderation-db-remediation/**` | MEDIUM | Same risk — SQL batches may be pending. |
| `_ACTIVE/tools/graph-codegen/**` | LOW | Active tool, but unlikely to be referenced by path. Moving would break any scripts that call it from its current location. |
| `_ACTIVE/native/**` (non-falcon) | LOW | If native work is still in progress, moving reference docs would break the native sync workflow. Requires FALCON confirmation before any move. |
| `_BACKUPS/**` | LOW | Do not delete — only move if approved. Backups may be the only restore point for April 2026 app state. |

---

## Confirmation

- No files were moved.
- No files were deleted.
- No files were renamed.
- No source code was touched (`apps/VCSM`, `apps/wentrex`, `apps/Traffic`, `engines` were not accessed).
- Only this audit document was created.

---

HISTORY RELOCATION PLAN READY FOR APPROVAL
