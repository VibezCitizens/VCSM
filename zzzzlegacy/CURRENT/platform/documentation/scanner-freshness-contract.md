# Scanner Freshness Contract

**Ticket:** TICKET-SCANNER-COMMAND-PREFLIGHT-0001
**Status:** ACTIVE
**Version:** 1.0
**Created:** 2026-06-02
**Category Key:** platform-documentation

---

## Purpose

Defines when scanner maps are considered FRESH, STALE, or EXPIRED for each
command, and what action each state requires.

Scanner maps embed a `generatedAt` ISO 8601 timestamp in their root metadata.
All freshness calculations are relative to this timestamp.

---

## Freshness States

| State | Meaning | Command Action |
|---|---|---|
| FRESH | Within the command's freshness window | Full trust. Proceed. |
| STALE | Past freshness window, within 2× the window | Proceed with warning. All findings require source verification. Scanner used as guidance only. |
| EXPIRED | Past 2× the freshness window | Block. Do not proceed. Require scanner regeneration. |

---

## How To Regenerate

```bash
cd /Users/vcsm/Desktop/VCSM/apps/scanner
npm run scan
```

All 17 maps are regenerated in a single pass (~2.4 seconds as of v1.1.0).

---

## Per-Command Freshness Windows

### Tier A — Release Scope (1 day)

Applied when command operates on a live release scope.

| Command | Window | STALE After | EXPIRED After | Notes |
|---|---|---|---|---|
| THOR (release scope) | 1 day | 1 day | 2 days | Strict. STALE = FAIL for P0 features. |
| AVENGERSASSEMBLE | 1 day | 1 day | 2 days | Inherits THOR's window for ceremony runs. |

Rationale: Release decisions cannot be made on data older than 24 hours.
Code changes between scanner runs could introduce or remove critical surfaces.

### Tier B — Security Review (3 days)

Applied to all security-focused commands.

| Command | Window | STALE After | EXPIRED After | Notes |
|---|---|---|---|---|
| VENOM | 3 days | 3 days | 7 days | STALE means findings are leads, not confirmed. |
| BLACKWIDOW | 3 days | 3 days | 7 days | Attack scenarios may miss surfaces added after scan. |
| ELEKTRA | 3 days | 3 days | 7 days | Source→sink chains may be incomplete. |
| HAWKEYE | 3 days | 3 days | 7 days | New routes since last scan would be invisible. |

Rationale: Security surfaces change with every write-path modification. A 3-day
window limits exposure from post-scan code changes. Beyond 7 days, finding accuracy
drops below acceptable confidence for security governance.

### Tier C — General Governance (7 days)

Applied to all structural, documentation, and planning commands.

| Command | Window | STALE After | EXPIRED After | Notes |
|---|---|---|---|---|
| ARCHITECT | 7 days | 7 days | 14 days | Structural analysis tolerates weekly cadence. |
| SPIDER-MAN | 7 days | 7 days | 14 days | Test coverage gaps tolerate weekly refresh. |
| DR. STRANGE | 7 days | 7 days | 14 days | Feature existence is stable. |
| DATAENGINEER | 7 days | 7 days | 14 days | DAL patterns are stable week-to-week. |
| IRONMAN | 7 days | 7 days | 14 days | Ownership mapping is stable. |
| SENTRY | 7 days | 7 days | 14 days | Boundary enforcement is stable. |
| CARNAGE | 7 days | 7 days | 14 days | Migration scope uses write-surface as context. |
| KRAVEN | 7 days | 7 days | 14 days | Performance surface changes with new routes. |
| LOKI | 7 days | 7 days | 14 days | Scanner is context; runtime data is primary. |
| WATCHER | 7 days | 7 days | 14 days | Feature classification for current diff. |
| PROFESSOR X | 7 days | 7 days | 14 days | Behavioral compliance is spec-anchored. |
| FALCON | 7 days | 7 days | 14 days | Route existence is stable. |
| WINTERSOLDIER | 7 days | 7 days | 14 days | Same as FALCON. |
| VISION | 7 days | 7 days | 14 days | Analytics surface is stable. |
| DEADPOOL | 7 days | 7 days | 14 days | Scanner provides context for trace. |
| DB | 7 days | 7 days | 14 days | Surface count as context; schema from DB. |
| LOGAN | 7 days | 7 days | 14 days | Feature existence is stable. |
| NICKFURY | 7 days | 7 days | 14 days | Workstream scope is stable. |
| review-contract | 7 days | 7 days | 14 days | Dependency structure is stable. |
| WOLVERINE | 7 days | 7 days | 14 days | Scope classification is stable. |

### Tier D — No Scanner (N/A)

| Command | Notes |
|---|---|
| SHIELD | IP governance — no scanner maps consumed |
| CAPTAIN | Ideas capture — no scanner maps consumed |
| session-summary | Audit log — no scanner maps consumed |

---

## Freshness Calculation Protocol

```
For each required map:
  1. Read map root: { "generatedAt": "YYYY-MM-DDTHH:MM:SS.mssZ" }
  2. Calculate age = now - generatedAt (in hours)
  3. Compare to window and 2× window:

     age <= window_hours      → FRESH
     age <= window_hours × 2  → STALE
     age > window_hours × 2   → EXPIRED

  4. Take the worst state across all required maps for this command.
  5. Apply action per state.
```

### Action Matrix

| State | SCANNER_REQUIRED | SCANNER_ENHANCED |
|---|---|---|
| FRESH | PREFLIGHT_PASS — proceed | PREFLIGHT_PASS — proceed |
| STALE | PREFLIGHT_WARN — proceed; all findings require source verification | PREFLIGHT_WARN — proceed; scanner used as guidance only |
| EXPIRED | PREFLIGHT_BLOCK — do not run until scanner is regenerated | PREFLIGHT_WARN — proceed with explicit warning; findings are low confidence |

### Special Case — THOR Release Scope

For THOR runs scoped to an active release:
- STALE = treated as PREFLIGHT_FAIL for P0 features (blocked)
- STALE = treated as PREFLIGHT_CAUTION for P1/P2 features (warned, logged)
- EXPIRED = PREFLIGHT_BLOCK for all release scopes

---

## Multi-Map Freshness

When a command requires multiple maps, freshness is evaluated per-map and the
overall preflight state is the worst state across all required maps.

Example: VENOM requires 8 maps. If 7 are FRESH and 1 is STALE → overall STALE.
If any required map is EXPIRED → overall EXPIRED regardless of other maps.

---

## Freshness Header Block

Every command output that consumed scanner maps must include a Freshness Block:

```
Scanner Freshness Status
========================
Command tier: [SCANNER_REQUIRED / SCANNER_ENHANCED]
Freshness window: [N days]
Maps evaluated: [N]

| Map | Generated At | Age | State |
|---|---|---|---|
| feature-map | 2026-06-02T23:07:18Z | 4h | FRESH |
| write-surface-map | 2026-06-02T23:07:18Z | 4h | FRESH |
| ...

Overall preflight state: FRESH / STALE / EXPIRED
Action taken: PASSED / WARNED / BLOCKED
```

---

## Scanner Version Mismatch Warning

If the `scannerVersion` field in any map does not match the current scanner
package.json version:

- Emit: `PREFLIGHT_WARN: SCANNER_VERSION_MISMATCH — map generated by [old-version], current is [new-version]`
- Do not block — version mismatches may add fields but rarely remove them
- All findings require source verification when version mismatch is detected

---

*Generated: 2026-06-02 | Ticket: TICKET-SCANNER-COMMAND-PREFLIGHT-0001*
