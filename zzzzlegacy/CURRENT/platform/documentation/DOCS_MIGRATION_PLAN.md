# DOCS_MIGRATION_PLAN.md
# Ticket: DOCS-ORG-001
# Phase 7 — Safe Migration Blueprint
# Date: 2026-06-02
# Status: READ-ONLY PLANNING — No files moved yet

---

## MIGRATION SUMMARY

| Item | Decision |
|---|---|
| New documentation root | `_DOCS/` at repo root |
| Old system destination | `_LEGACY/zNOTFORPRODUCTION/` (renamed, never updated again) |
| Migration style | Additive — new system is built fresh; old is frozen in place |
| Rollback | Trivially safe — old system is unchanged until Phase 5 (rename) |
| Execution | Phased across multiple sessions — not a single-day operation |

---

## PHASE 0 — PREREQUISITE (Human Decision Required)

**Before any migration work begins, confirm:**

1. The new root name `_DOCS/` is approved (not `docs/`, not `_DOCUMENTATION/`)
2. The legacy name is approved — either `_LEGACY/zNOTFORPRODUCTION/` or `zNOTFORPRODUCTION_LEGACY/`
3. CLAUDE.md will be updated to reference `_DOCS/` as the new documentation home
4. The existing memory entry for `Logan Documentation Location` will be updated
5. The skills files in `_CANONICAL/skills/` will be updated to point commands at their new output locations

**Do not begin Phase 1 until all five are confirmed.**

---

## PHASE 1 — SCAFFOLD NEW SYSTEM (No migrations yet)

**Goal:** Create the empty folder structure and governance contracts. Nothing from zNOTFORPRODUCTION is moved.

**Actions:**
1. Create `_DOCS/` at repo root
2. Create `_DOCS/README.md` — entry point with quick-reference guide
3. Create `_DOCS/DOCS_ARCHITECTURE_CONTRACT.md` — lifecycle rules
4. Create `_DOCS/COMMAND_OUTPUT_CONTRACT.md` — final command rules (from this planning artifact)
5. Create `_DOCS/REGISTRY/` folder with 5 registry files (empty tables, not populated yet)
6. Create `_DOCS/CURRENT/` folder structure — all feature folders, no files inside them yet
7. Create `_DOCS/HISTORY/2026/` with 04/, 05/, 06/ monthly structures
8. Create `_DOCS/LEGACY/` folder (empty placeholder, will receive zNOTFORPRODUCTION later)

**What does NOT happen in Phase 1:**
- No files are moved from zNOTFORPRODUCTION
- No CURRENT files are written yet
- No commands begin writing to _DOCS yet

**Verification:** `find _DOCS -type f | wc -l` should return exactly the governance and contract files created — no content files.

---

## PHASE 2 — SEED HIGH-PRIORITY CURRENT FILES

**Goal:** For the 6 most-audited features, write initial CURRENT files synthesized from the existing canonical and audit record. This proves the system works before migrating everything.

**Features to seed first (in priority order):**

| Priority | Feature | Reason | Files to Create |
|---|---|---|---|
| 1 | booking | Most-audited, open tickets, active work | README.md, SOURCE_MAP.md, CURRENT_STATUS.md, SECURITY.md, ARCHITECTURE.md, OWNERSHIP.md, DEFERRED.md |
| 2 | auth | CRITICAL security surface, full canonical exists | README.md, SOURCE_MAP.md, CURRENT_STATUS.md, SECURITY.md, ARCHITECTURE.md |
| 3 | identity | Actor model core, full canonical exists | README.md, SOURCE_MAP.md, CURRENT_STATUS.md, SECURITY.md |
| 4 | dashboard | Largest owner surface, architect scan exists | README.md, SOURCE_MAP.md, CURRENT_STATUS.md, OWNERSHIP.md |
| 5 | feed | Most command coverage, canonical spec exists | README.md, SOURCE_MAP.md, CURRENT_STATUS.md, SECURITY.md |
| 6 | chat | Full canonical, migration status relevant | README.md, SOURCE_MAP.md, CURRENT_STATUS.md, SECURITY.md |

**Source material for seeding:**
- `_CANONICAL/logan/vcsm/[feature]/` — canonical specs (copy content, do not move files)
- `_ACTIVE/audits/` — synthesize security posture from most recent VENOM/ELEKTRA runs
- Memory system — deferred items from TICKET-BOOKING-RPC-001, TICKET-PLATFORM-RLS-001

**Important:** Seeding is synthesis, not copying. CURRENT files are not identical copies of existing docs — they synthesize the current truth from all sources.

**Verification:** A human must review each seeded CURRENT file and confirm it accurately represents the current state of the feature before the file is considered "live."

---

## PHASE 3 — POPULATE REGISTRIES

**Goal:** Fill the REGISTRY files with data derived from existing docs. No files are moved.

**Actions:**
1. **FEATURE_REGISTRY.md** — One row per feature from FEATURE_DOCUMENTATION_INVENTORY.md. Fields: feature, path, tier, security sensitivity, doc coverage, last audit date.
2. **AUDIT_STATUS_REGISTRY.md** — Matrix populated from `_ACTIVE/audits/` — find last run date per feature per command by scanning file dates.
3. **DEFERRED_ITEMS.md** — Populate from memory (TICKET-BOOKING-RPC-001, TICKET-PLATFORM-RLS-001, TICKET-FEED-CARDS-002) and from deferred findings in existing audit files.
4. **BLOCKERS.md** — Populate from memory and open tickets.
5. **COMMAND_REGISTRY.md** — One row per command with last known run date derived from audit file timestamps.

**Verification:** Human reviews each registry for accuracy before it becomes the reference source.

---

## PHASE 4 — REDIRECT COMMANDS TO NEW OUTPUT LOCATIONS

**Goal:** Commands begin writing to `_DOCS/` instead of `zNOTFORPRODUCTION/_ACTIVE/audits/`. Old audit folder receives no new files.

**Actions:**
1. Update `_CANONICAL/skills/vcsm/SKILL.md` — output location rules updated to reference `_DOCS/HISTORY/YYYY/MM/commands/[command]/`
2. Update CLAUDE.md if it references specific output locations (verify first)
3. Update memory entry for `Logan Documentation Location`
4. Test with a low-risk command run (IRONMAN ownership scan on a small feature)
5. Verify output appears in `_DOCS/HISTORY/` and CURRENT file is updated correctly

**What does NOT happen in Phase 4:**
- zNOTFORPRODUCTION is not renamed yet
- Old audit files are not moved yet
- Commands write to BOTH systems is explicitly allowed during transition if needed

**Verification:** Run one command (e.g., IRONMAN on `join`), confirm file appears in `_DOCS/HISTORY/2026/06/commands/ironman/2026-MM-DD_ironman_join-ownership.md` and `_DOCS/CURRENT/features/join/OWNERSHIP.md` is created or updated.

---

## PHASE 5 — ARCHIVE OLD HISTORY INTO _DOCS/HISTORY

**Goal:** Migrate dated audit artifacts from `_ACTIVE/audits/` to their correct month in `_DOCS/HISTORY/`.

**Mapping — old to new:**

| Old Location | New Location | Notes |
|---|---|---|
| `CURRENT/features/dashboard/evidence/2026-05-*.md` | `_DOCS/HISTORY/2026/05/commands/venom/` or `commands/elektra/` | Sort by actor prefix in filename |
| `CURRENT/features/dashboard/evidence/2026-05-*.md` | `_DOCS/HISTORY/2026/05/commands/sentry/` | |
| `_ACTIVE/audits/migrations/2026-05-*.md` | `_DOCS/HISTORY/2026/05/commands/carnage/` | |
| `CURRENT/features/dashboard/evidence/2026-05-*.md` | `_DOCS/HISTORY/2026/05/commands/blackwidow/` or `commands/kraven/` | |
| `CURRENT/features/dashboard/evidence/2026-05-*.md` | `_DOCS/HISTORY/2026/05/commands/thor/` | |
| `_ACTIVE/audits/performance/2026-05-*.md` | `_DOCS/HISTORY/2026/05/commands/kraven/` | |
| `CURRENT/features/dashboard/evidence/2026-05-*.md` | `_DOCS/HISTORY/2026/05/commands/loki/` | |
| `CURRENT/features/dashboard/evidence/2026-05-*.md` | `_DOCS/HISTORY/2026/05/commands/ironman/` | |
| `_ACTIVE/audits/architecture/2026-05-*.md` | `_DOCS/HISTORY/2026/05/commands/architect/` | |
| `CURRENT/features/dashboard/evidence/2026-05-*.md` | `_DOCS/HISTORY/2026/05/commands/spiderman/` | |
| `_ACTIVE/planning/may/` | `_DOCS/HISTORY/2026/05/planning/05/` | Daily task logs |
| `_ACTIVE/planning/april/` | `_DOCS/HISTORY/2026/04/planning/04/` | Daily task logs |
| `_HISTORY/session-summaries/2026-04/` | `_DOCS/HISTORY/2026/04/session-summaries/` | Move, not copy |
| `_HISTORY/session-summaries/2026-05/` | `_DOCS/HISTORY/2026/05/session-summaries/` | Move, not copy |
| `_HISTORY/db/snapshots/` | `_DOCS/HISTORY/2026/[month]/commands/db/` | Sort by date prefix |
| `_ACTIVE/debuggers/*.md` | `_DOCS/HISTORY/2026/05/commands/deadpool/` | |
| `_ACTIVE/redteam-harnesses/` | `_DOCS/HISTORY/2026/05/audits/redteam/` | Code artifacts only |
| `_CANONICAL/logan/marvel/architect/` (516 files) | `_DOCS/HISTORY/2026/[month]/commands/architect/` | Biggest move — needs sorting by date |
| `_CANONICAL/logan/marvel/venom/` | `_DOCS/HISTORY/2026/[month]/commands/venom/` | |
| `_CANONICAL/logan/marvel/ironman/` | `_DOCS/HISTORY/2026/[month]/commands/ironman/` | |
| `_CANONICAL/logan/marvel/kraven/` | `_DOCS/HISTORY/2026/[month]/commands/kraven/` | |
| `_CANONICAL/logan/marvel/batman/` | `_DOCS/HISTORY/2026/[month]/commands/nickfury/` | Renamed command |
| `_CANONICAL/logan/marvel/wolverine/` | `_DOCS/HISTORY/2026/[month]/commands/wolverine/` | |
| `_CANONICAL/logan/marvel/captain/` | `_DOCS/HISTORY/2026/[month]/commands/captain/` | |
| `_CANONICAL/logan/marvel/avengers-assembly/` | `_DOCS/HISTORY/2026/[month]/commands/nickfury/` | Cross-team summaries |
| `_ACTIVE/native/native-transfer/` | `_DOCS/CURRENT/native/transfer/` | Native transfer is living docs |

**Execution order:** Smallest folders first to validate the process. Start with `CURRENT/features/dashboard/evidence/` (3 files), then escalate to larger batches.

**Do not move yet:**
- `_CANONICAL/logan/vcsm/` (canonical specs) — Phase 6
- `_CANONICAL/zcontract/` — Phase 6
- `_CANONICAL/vision/` — Phase 6
- `_ACTIVE/migrations/` (.sql files) — Separate decision
- `_ACTIVE/tools/` — Separate decision (node_modules must not be migrated)
- `_BACKUPS/` — Human decision required

---

## PHASE 6 — MIGRATE CANONICAL SPECS TO CURRENT

**Goal:** The authoritative canonical specs in `_CANONICAL/logan/vcsm/` become the seed content for `_DOCS/CURRENT/features/[feature]/ARCHITECTURE.md` and similar files.

**Mapping — canonical to CURRENT:**

| Old Location | New Location | File in CURRENT |
|---|---|---|
| `_CANONICAL/logan/vcsm/booking/` | `_DOCS/CURRENT/features/booking/` | ARCHITECTURE.md |
| `_CANONICAL/logan/vcsm/identity/` | `_DOCS/CURRENT/features/identity/` and `features/auth/` | ARCHITECTURE.md |
| `_CANONICAL/logan/vcsm/chat/` | `_DOCS/CURRENT/features/chat/` | ARCHITECTURE.md |
| `_CANONICAL/logan/vcsm/feed/` | `_DOCS/CURRENT/features/feed/` | ARCHITECTURE.md |
| `_CANONICAL/logan/vcsm/notifications/` | `_DOCS/CURRENT/features/notifications/` | ARCHITECTURE.md |
| `_CANONICAL/logan/vcsm/social/` | `_DOCS/CURRENT/features/social/` | ARCHITECTURE.md |
| `_CANONICAL/logan/vcsm/moderation/` | `_DOCS/CURRENT/features/moderation/` | ARCHITECTURE.md |
| `_CANONICAL/logan/vcsm/wanders/` | `_DOCS/CURRENT/features/wanders/` | ARCHITECTURE.md |
| `_CANONICAL/logan/vcsm/explore/` | `_DOCS/CURRENT/features/explore/` | ARCHITECTURE.md |
| `_CANONICAL/logan/vcsm/upload/` | `_DOCS/CURRENT/features/upload/` | ARCHITECTURE.md |
| `_CANONICAL/logan/vcsm/runtime/` | `_DOCS/CURRENT/platform/` | Multiple files |
| `_CANONICAL/logan/engines/` | `_DOCS/CURRENT/platform/` | Engine contracts |
| `_CANONICAL/logan/vports/` | `_DOCS/CURRENT/features/vport/` | ARCHITECTURE.md |
| `_CANONICAL/logan/platform/` | `_DOCS/CURRENT/platform/` | Platform docs |
| `_CANONICAL/logan/architecture/` | `_DOCS/CURRENT/platform/` | System maps |
| `_CANONICAL/logan/traffic/` | Leave — Traffic is separate product | N/A |
| `_CANONICAL/logan/wentrex/` | Leave — Wentrex is separate product | N/A |
| `_CANONICAL/zcontract/` | Leave in place; link from `_DOCS/README.md` | N/A |
| `_CANONICAL/vision/` | Leave in place; link from `_DOCS/README.md` | N/A |

**Important:** Canonical specs are not deleted — they become LEGACY candidates. The new CURRENT files are synthesized from them but are not identical copies. Once a CURRENT file exists, the old canonical file is marked `SUPERSEDED_BY: _DOCS/CURRENT/features/[feature]/ARCHITECTURE.md` in its header.

---

## PHASE 7 — FREEZE AND RENAME zNOTFORPRODUCTION

**Goal:** The old system becomes legacy. No new files are ever written to it again.

**Actions:**
1. Add `LEGACY_NOTICE.md` to root of zNOTFORPRODUCTION: "This system is frozen as of [date]. All new documentation goes to `_DOCS/`. This folder is preserved for historical reference only."
2. Update CLAUDE.md to reference `_DOCS/` as the documentation home
3. Update memory entry `Logan Documentation Location`
4. Update `_CANONICAL/skills/vcsm/SKILL.md` to point all output rules at `_DOCS/`
5. Rename folder: `zNOTFORPRODUCTION` → `zNOTFORPRODUCTION_LEGACY` (or move to `_LEGACY/zNOTFORPRODUCTION/`)
6. Confirm CLAUDE.md, memory, and skills all reference the new root

**This is the only irreversible step in the migration.**

---

## WHAT BECOMES LEGACY (Never Updated Again)

| Asset | Fate |
|---|---|
| `_ACTIVE/audits/` | HISTORY — dated audit artifacts, immutable |
| `_ACTIVE/planning/april/` and `planning/may/` | HISTORY — daily task logs, immutable |
| `_CANONICAL/logan/marvel/` | HISTORY — command execution logs, immutable |
| `_BACKUPS/` | LEGACY — April 30 code snapshots, immutable |
| `_HISTORY/session-summaries/` | HISTORY — session summaries, immutable |

## WHAT REMAINS ACTIVE AND UPDATED

| Asset | Action |
|---|---|
| `_CANONICAL/zcontract/ARCHITECTURE.md` | Keep active; link from `_DOCS/README.md` |
| `_CANONICAL/skills/vcsm/SKILL.md` | Update to point output at `_DOCS/` |
| `_CANONICAL/vision/` | Keep active; unchanged |

## WHAT REQUIRES HUMAN DECISION BEFORE MIGRATION

| Item | Decision Required |
|---|---|
| `_ACTIVE/tools/` — node_modules | Delete node_modules? Move tools to dev repo? |
| `_BACKUPS/` (298 files) | Confirm all April 30 backups are safe to leave as archival. Is there a retention date? |
| `_ACTIVE/migrations/` (.sql) | Move to `_DOCS/HISTORY/` or keep in `zNOTFORPRODUCTION`? SQL is not documentation. |
| `_CANONICAL/logan/traffic/` | Stays with Traffic docs or moves to `apps/Traffic/`? |
| `_CANONICAL/logan/wentrex/` | Stays with Wentrex docs or moves to `apps/wentrex/`? |
| `CHAT_MIGRATION_PLAN.md` in zcontract/ | Still accurate? Migrate to CURRENT or mark stale? |
| `_HISTORY/PROM/ticketing.md` | Move to `_DOCS/REGISTRY/` or keep in HISTORY? |
| marvel/ empty folders (thor, carnage, bugsbunny) | Delete or mark deprecated? |

---

## RISKS

| Risk | Severity | Mitigation |
|---|---|---|
| Commands write to old location by habit | HIGH | Update SKILL.md in Phase 4 before Phase 5; confirm in CLAUDE.md |
| Canonical files become stale if CURRENT not seeded before commands stop writing there | HIGH | Seed CURRENT for top 6 features before Phase 4 redirect |
| 516 architect files require date-sorting to land in correct HISTORY month | MEDIUM | Script the sort: `find ... -name "*.md" -newer [month-boundary]` |
| Links in existing audit files pointing to old canonical locations break | LOW | Old files are HISTORY — they are read-only artifacts, broken links are acceptable |
| Migration takes multiple sessions, state gets confused mid-migration | MEDIUM | Registry tracks migration phase; each phase has a clear done-state |
| zNOTFORPRODUCTION rename breaks any hardcoded paths in CLAUDE.md or memory | HIGH | Audit all references before Phase 7 rename |

---

## ROLLBACK PLAN

**Phase 1–4:** Zero risk. New system is additive. zNOTFORPRODUCTION is untouched. Rollback = delete `_DOCS/` folder.

**Phase 5 (archive old history):** Moderate risk. Files are moved, not deleted. Rollback = move files back from `_DOCS/HISTORY/` to their original `_ACTIVE/audits/` or `_CANONICAL/logan/marvel/` locations. Git history preserves all moves.

**Phase 6 (migrate canonical specs):** Moderate risk. Original files are marked superseded but not deleted. Rollback = remove SUPERSEDED_BY header from original files, delete new CURRENT files. Done in git — single revert.

**Phase 7 (freeze and rename):** This is the commitment point. Before executing: ensure Phases 1–6 are complete and verified. Rollback of the rename requires: rename folder back, update CLAUDE.md, update memory, update SKILL.md. All reversible but disruptive. **Do not execute Phase 7 until everything else is stable.**

---

## MIGRATION TIMELINE ESTIMATE

| Phase | Effort | Sessions |
|---|---|---|
| Phase 0 — Prerequisites | Human decisions | 1 discussion |
| Phase 1 — Scaffold | Low | 1 session |
| Phase 2 — Seed 6 features | Medium | 2 sessions |
| Phase 3 — Populate registries | Medium | 1 session |
| Phase 4 — Redirect commands | High | 1 session (SKILL.md update + test) |
| Phase 5 — Archive old history | High | 3–4 sessions (254 audits + 273 planning + 547 marvel files) |
| Phase 6 — Migrate canonical | Medium | 2 sessions |
| Phase 7 — Freeze and rename | Low | 1 session |
| **Total** | | **~12 sessions** |
