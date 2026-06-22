# DR. STRANGE ENTRY — MODERATION

**Category Key:** moderation
**Type:** FEATURE
**CURRENT Path:** features/moderation
**Source Path:** apps/VCSM/src/features/moderation/ + apps/VCSM/src/features/block/
**Last Updated:** 2026-06-02
**Ticket:** TICKET-DRSTRANGE-BACKFILL-P2-0001
**Timestamp:** 2026-06-02T12:18:46

**Area:** Moderation
---

## Feature

Two independent systems sharing the `moderation.*` DB schema: System A handles user-facing report/hide/cover workflows for content flagging, and System B handles actor-to-actor safety relationships via the block graph — both actor-first, with feed block enforcement enforced at dual layers (client TTL cache + DB-level RLS).

## Status

ACTIVE
Security Tier: HIGH

## Governance Score

| Category | Score | Notes |
|---|---|---|
| Files Present | 5/10 files found | README.md, CURRENT_STATUS.md, SECURITY.md, HISTORY_INDEX.md, post-visibility-moderation.md |
| Security | PARTIAL | SECURITY.md exists — 10 open findings (1 CRITICAL, 2 HIGH, 4 MEDIUM, 2 LOW, 1 LOW-MEDIUM); no ELEKTRA scan run |
| Architecture | PARTIAL | ARCHITECT completed 2026-05-10 (embedded in system review); no standalone ARCHITECTURE.md |
| Ownership | 0% | Not assessed |
| Testing | 0% | SPIDER-MAN not run |
| Performance | PARTIAL | KRAVEN completed 2026-05-10 (embedded in system review); no standalone PERFORMANCE.md |
| **DR. STRANGE Readiness** | **~25%** | Core audit done; migrations unconfirmed; multiple docs missing |

## Documentation Coverage

| File | Status |
|---|---|
| README.md | ✓ |
| CURRENT_STATUS.md | ✓ |
| SECURITY.md | ✓ |
| ARCHITECTURE.md | ✗ MISSING |
| OWNERSHIP.md | ✗ MISSING |
| TESTS.md | ✗ MISSING |
| PERFORMANCE.md | ✗ MISSING |
| BLOCKERS.md | ✗ MISSING |
| DEFERRED.md | ✗ MISSING |
| HISTORY_INDEX.md | ✓ |

## Command Coverage

| Command | Status |
|---|---|
| VENOM | COMPLETE — 2026-05-10; 10 findings; embedded in moderation-system-review.md §8 |
| ELEKTRA | NOT RUN |
| BLACKWIDOW | NOT RUN |
| ARCHITECT | COMPLETE — 2026-05-10; embedded in moderation-system-review.md; no standalone ARCHITECTURE.md |
| SENTRY | NOT RUN |
| IRONMAN | NOT RUN |
| SPIDER-MAN | NOT RUN |
| KRAVEN | COMPLETE — 2026-05-10; embedded in moderation-system-review.md §9; no standalone PERFORMANCE.md |
| THOR | NOT RUN |
| CARNAGE | PLAN WRITTEN — 6-batch migration plan; NOT YET APPLIED to live DB |
| DB | COMPLETE — 2026-05-10; full RLS inventory; embedded in moderation-system-review.md §3–5 |
| HAWKEYE | NOT RUN |
| WATCHER | NOT RUN |
| FALCON | NOT RUN |
| WINTER SOLDIER | NOT RUN |
| LOGAN | NOT RUN |
| WOLVERINE | NOT RUN |

## THOR Eligibility

**THOR_BLOCKED** — SECURITY.md has 1 CRITICAL and 2 HIGH open findings, all with migrations written but not applied. CARNAGE Batch 1 (privilege escalation fix) is a hard prerequisite before any other batch and before THOR clearance.

## Security Status

10 open findings from VENOM 2026-05-10 (no ELEKTRA scan run):

- **SEC-001 — CRITICAL — OPEN:** Broken moderation authorization gate — `can_manage_domain('vc')` returns TRUE for every authenticated user, exposing all moderator-scoped RLS policies. CARNAGE Batch 1 migration written, NOT APPLIED.
- **SEC-002 — HIGH — OPEN:** Silent audit trail disablement — module-level session flag permanently disables `report_events` INSERT after first RLS denial. Session flag still in code. CARNAGE Batch 2 migration written, NOT APPLIED.
- **SEC-003 — HIGH — OPEN:** No dedicated moderation role table — access is gated on `learning.platform_admins`; `moderation.moderators` table never created; app-layer DAL also broken (UUID type mismatch — always returns false).
- **SEC-004 — MEDIUM — OPEN:** No FORCE ROW LEVEL SECURITY on moderation tables. CARNAGE Batch 5 migration written — deployment order constraint: NEVER before Batch 1.
- **SEC-005 — MEDIUM — OPEN:** Block side effects partially client-side — `vc.friend_ranks` cleanup in empty try/catch; unidirectional follow deactivation only. CARNAGE Batch 4 migration written, NOT APPLIED.
- **SEC-006 — MEDIUM — OPEN:** No `moderation_report_events_insert_self` policy for reporters — reporter audit trail never written.
- **SEC-007 — LOW-MEDIUM — OPEN:** Duplicate RLS policies on `moderation.blocks` and `moderation.block_events` — 6 functionally equivalent duplicates.
- **SEC-008 — MEDIUM — OPEN:** `actions.expires_at` not enforced — no DB trigger, cron, or app enforcement; temporary moderation actions never expire.
- **SEC-009 — LOW — OPEN:** `chat.moderation_actions` legacy table — RLS status unconfirmed; table may be publicly readable.
- **SEC-010 — LOW — OPEN:** No bidirectional follow cleanup on block — covered by CARNAGE Batch 4.

## Architecture Status

PARTIAL — ARCHITECT completed 2026-05-10 (multi-agent combined audit). Full system map, schema, flow, controller/DAL inventory documented in `_ACTIVE/audits/moderation/2026-05-10_00-00_moderation-system-review.md`. No standalone ARCHITECTURE.md file. Run ARCHITECT to produce a dedicated file.

## Ownership Status

UNKNOWN — OWNERSHIP.md not found. Run IRONMAN.

## Testing Status

UNKNOWN — TESTS.md not found. SPIDER-MAN has never run.

## Performance Status

PARTIAL — KRAVEN completed 2026-05-10 (embedded in moderation-system-review.md §9). No standalone PERFORMANCE.md. Run KRAVEN to produce a dedicated file.

## Open Blockers

None recorded in BLOCKERS.md (file missing). Active blockers inferred from SECURITY.md and CURRENT_STATUS.md:

- CARNAGE Batch 1 (SEC-001 fix) must ship before Batches 3, 4, 5 — hard deployment order constraint.
- CARNAGE Batch 5 (FORCE RLS) must NEVER apply before Batch 1 is confirmed in production.
- `assertModerationAccess.dal.js` UUID type mismatch — critical app-layer bug must ship with Batch 1.
- SEC-002 session flag still in code — must be removed after Batch 2 applied.

## Deferred Items

None recorded in DEFERRED.md (file missing). From existing docs:
- Moderator admin dashboard — no dashboard exists; all moderator actions are admin-only via direct DB.
- Group chat block filter — RLS on `chat.messages` covers direct messages only; group chats not covered (noted in CURRENT_STATUS.md).
- ELEKTRA, SENTRY, SPIDER-MAN, FALCON reports — none exist for this feature.

## Latest Ticket

None found in docs. Audit work from 2026-05-10 was conducted under the Dashboard Security Sprint (see HISTORY_INDEX).

## Recommended Next Ticket

Open **TICKET-MODERATION-CARNAGE-001**: Apply CARNAGE Batch 1 migration (`20260510070000_fix_moderation_can_manage_domain.sql`) + ship app-layer `assertModerationAccess.dal.js` UUID fix — SEC-001 CRITICAL is an active privilege escalation on the live DB.

## Recommended Next Command

CARNAGE (apply Batch 1) — then ELEKTRA to scan source→sink chains that VENOM did not trace.

## DR. STRANGE Read Order

1. DR_STRANGE.md (this file)
2. CURRENT_STATUS.md [✓]
3. SECURITY.md [✓]
4. ARCHITECTURE.md [✗ MISSING — use _ACTIVE/audits/moderation/2026-05-10_00-00_moderation-system-review.md §2–7 as substitute]
5. OWNERSHIP.md [✗ MISSING]
6. BLOCKERS.md [✗ MISSING]
7. DEFERRED.md [✗ MISSING]
8. HISTORY_INDEX.md [✓]

---
*DR_STRANGE.md generated: 2026-06-02 | Ticket: TICKET-DRSTRANGE-BACKFILL-P2-0001 | Timestamp: 2026-06-02T06:00:00*

<!-- DRSTRANGE_COMMAND_MATRIX_START -->
## Command Coverage Matrix

Feature: moderation
Applicable Commands: 17
Coverage Score: 5.5 / 17
Coverage %: 32%
Last Refresh: 2026-06-02 (TICKET-DRSTRANGE-MATRIX-REFRESH-0001)

| Command | Status | Last Run | Evidence | Next Action |
|---|---|---|---|---|
| ARCHITECT | COMPLETE | 2026-06-02 | CURRENT/features/moderation/ARCHITECTURE.md | — |
| VENOM | COMPLETE | 2026-05-10 | CURRENT/features/moderation/SECURITY.md (1 CRITICAL, 2 HIGH, 4 MEDIUM, 2 LOW open) | SEC-001 CRITICAL (privilege escalation) blocks THOR — apply CARNAGE Batch 1 |
| ELEKTRA | NOT RUN | NEVER | No ELEK- findings in SECURITY.md | Run ELEKTRA — source-to-sink chain scan on broken auth gate pending |
| BLACKWIDOW | NOT RUN | NEVER | No BW- findings in SECURITY.md | Run BLACKWIDOW — adversarial runtime verification pending |
| SENTRY | NOT RUN | NEVER | No SENTRY evidence in CURRENT_STATUS.md or HISTORY_INDEX.md | Run SENTRY — compliance/architecture review pending |
| IRONMAN | NOT RUN | NEVER | OWNERSHIP.md missing from CURRENT/features/moderation/ | Run IRONMAN — ownership matrix not established |
| SPIDER-MAN | NOT RUN | NEVER | TESTS.md missing; no automated test coverage confirmed | Run SPIDER-MAN — no test coverage for any moderation path |
| KRAVEN | COMPLETE | 2026-05-10 | HISTORY_INDEX.md (embedded in moderation-system-review.md §9) | Produce standalone PERFORMANCE.md from embedded findings |
| THOR | NOT RUN | NEVER | No THOR release gate evidence | THOR_BLOCKED by SEC-001 CRITICAL — do not attempt until Batch 1 applied |
| CARNAGE | PARTIAL | 2026-05-10 | CURRENT_STATUS.md (6-batch plan written; NO migrations applied to live DB) | Apply Batch 1 immediately (SEC-001 fix); follow strict deployment order |
| DB | COMPLETE | 2026-05-10 | HISTORY_INDEX.md (full RLS inventory; embedded in moderation-system-review.md §3–5) | Confirm vc.friend_ranks SELECT USING(true) and chat.moderation_actions RLS status |
| HAWKEYE | NOT RUN | NEVER | No HAWKEYE evidence in CURRENT_STATUS.md | Run HAWKEYE — API contract verification pending |
| WATCHER | NOT RUN | NEVER | No WATCHER evidence in CURRENT_STATUS.md | Run WATCHER — change provenance tracking pending |
| FALCON | NOT RUN | NEVER | No FALCON evidence in CURRENT_STATUS.md | Run FALCON — iOS native parity verification pending |
| WINTER SOLDIER | N/A | — | No Android app | — |
| LOGAN | PARTIAL | 2026-06-02 | README.md present in CURRENT/features/moderation/ | Produce BLOCKERS.md and DEFERRED.md; align README with ARCHITECTURE.md |
| WOLVERINE | NOT RUN | NEVER | No WOLVERINE ticket evidence in HISTORY_INDEX.md | Run WOLVERINE — open TICKET-MODERATION-CARNAGE-001 to drive Batch 1 delivery |
| DR. STRANGE | PARTIAL | 2026-06-02 | This matrix refresh run | Matrix updated; full re-run pending |

## Command Coverage Summary

| Metric | Value |
|---|---|
| Applicable Commands | 17 |
| Complete | 4 |
| Partial | 3 |
| Not Run | 10 |
| Blocked | 0 |
| Coverage % | 32% |

## THOR Eligibility

- THOR Status: THOR_BLOCKED
- Blocking Reasons: SEC-001 CRITICAL open — can_manage_domain privilege escalation exposes all moderation RLS policies to every authenticated user; CARNAGE Batch 1 migration written but NOT APPLIED to live DB
- Caution Items: SEC-002 and SEC-003 HIGH open; CARNAGE plan not applied; SPIDER-MAN NOT RUN; IRONMAN NOT RUN; WOLVERINE NOT RUN
- Required Before THOR: Apply CARNAGE Batch 1 (20260510070000_fix_moderation_can_manage_domain.sql) + app-layer assertModerationAccess.dal.js UUID fix; run VENOM re-audit to confirm CRITICAL resolved; run ARCHITECT full pass; run WOLVERINE
- Coverage %: 32%
- Last DR. STRANGE Refresh: 2026-06-02T00:00:00
- Category Key: moderation
<!-- DRSTRANGE_COMMAND_MATRIX_END -->
