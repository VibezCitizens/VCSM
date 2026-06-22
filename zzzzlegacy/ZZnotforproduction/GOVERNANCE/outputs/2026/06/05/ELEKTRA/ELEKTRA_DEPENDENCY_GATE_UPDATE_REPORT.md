# ELEKTRA Dependency Gate Update Report

**Date:** 2026-06-05
**Command:** ELEKTRA
**Update Type:** Governance — Upstream Dependency Gate Added
**Status:** SUCCESS

---

## Files Updated

| File | Change |
|---|---|
| `.claude/commands/ELEKTRA.md` | Added upstream dependency gate notice and §0 row to routing table |
| `.claude/commands/elektra/ELEKTRA.md` | Added §6.5 Upstream Dependency Gate section; updated §7 Scan Workflow (Step 0); updated §12 relationship table; updated §16 Completion Principle |

---

## Dependency Gate Added

### Location
`elektra/ELEKTRA.md` — Section 6.5: Upstream Dependency Gate — MANDATORY PREFLIGHT

### Gate Requirements

| Upstream | Required | Freshness Window | Scope Match |
|---|---|---|---|
| VENOM | YES | 7 days | Must match requested feature/module |
| BLACKWIDOW | YES | 7 days | Must match requested feature/module |

### Preflight Check Sequence (8 steps)
1. Identify requested scope (app, feature, module)
2. Locate latest VENOM report for that scope
3. Locate latest BLACKWIDOW report for that scope
4. Verify both reports have Status: SUCCESS
5. Verify both reports are within the 7-day freshness window
6. Verify both reports match the requested scope exactly
7. If any check fails → emit ELEKTRA BLOCKED and stop
8. If all checks pass → emit ELEKTRA PREFLIGHT PASS and proceed to §7

---

## VENOM Requirement Confirmed

- VENOM report is now a hard prerequisite before any ELEKTRA scan
- Block code when missing: `ELEKTRA_PREFLIGHT_BLOCK: VENOM_REQUIRED`
- Block code for stale VENOM: `ELEKTRA_PREFLIGHT_BLOCK: UPSTREAM_REPORT_STALE`
- Block code for wrong scope: `ELEKTRA_PREFLIGHT_BLOCK: UPSTREAM_SCOPE_MISMATCH`
- §12 relationship table updated: VENOM marked **UPSTREAM PREREQUISITE (§6.5)**

---

## BLACKWIDOW Requirement Confirmed

- BLACKWIDOW report is now a hard prerequisite before any ELEKTRA scan
- Block code when missing: `ELEKTRA_PREFLIGHT_BLOCK: BLACKWIDOW_REQUIRED`
- Block code when both missing: `ELEKTRA_PREFLIGHT_BLOCK: VENOM_AND_BLACKWIDOW_REQUIRED`
- Block code for stale BLACKWIDOW: `ELEKTRA_PREFLIGHT_BLOCK: UPSTREAM_REPORT_STALE`
- §12 relationship table updated: BLACKWIDOW marked **UPSTREAM PREREQUISITE (§6.5)**
- BLACKWIDOW confirmation still required to escalate any finding to CRITICAL (unchanged)

---

## Stale Report Rule Added

- Freshness window: **7 days**
- If either VENOM or BLACKWIDOW report is older than 7 days → BLOCKED
- Block code: `ELEKTRA_PREFLIGHT_BLOCK: UPSTREAM_REPORT_STALE`
- Applies to both upstream reports independently

---

## Scope Match Rule Added

- Reports must match the requested scope exactly (app + feature + module)
- Mismatched scopes are rejected even if reports are fresh and have SUCCESS status
- Example: `VENOM booking + BLACKWIDOW chat ≠ ELEKTRA chat/inbox` → BLOCKED
- Block code: `ELEKTRA_PREFLIGHT_BLOCK: UPSTREAM_SCOPE_MISMATCH`

---

## Minimal Screen Output Preserved

- MINIMAL_SCREEN_OUTPUT_CONTRACT remains in force for post-gate scan execution
- §6.5 specifies: after preflight pass, obey MINIMAL_SCREEN_OUTPUT_CONTRACT — print completion receipt and report path only
- Blocked output is brief and structured (5-line max)
- No partial analysis is emitted when blocked

---

## Scan Workflow Updated

§7 Scan Workflow now opens with **Step 0 — Run Upstream Dependency Gate** before Step 1 (Declare Target). Step 1's ELEKTRA SCAN TARGET block now includes fields for upstream VENOM and BLACKWIDOW report paths.

---

## Completion Principle Updated

§16 Global completion criteria now lists two new required checks (at the top of the list):
- verified upstream dependency gate: VENOM report present, fresh, matching scope
- verified upstream dependency gate: BLACKWIDOW report present, fresh, matching scope

---

## Behavior-Change Check

```
ELEKTRA behavior changed:            YES
  — ELEKTRA is now blocked unless current VENOM and BLACKWIDOW
    reports exist for the same scope before any scan begins.

Security verification behavior changed: NO
  — Chain requirement, finding format, severity model, patch
    advisory format, SECURITY.md protocol, THOR gate integration,
    SHIELD ethical boundary, and all scan areas are unchanged.
```

---

## Block Code Reference

| Condition | Block Code |
|---|---|
| VENOM report missing | `ELEKTRA_PREFLIGHT_BLOCK: VENOM_REQUIRED` |
| BLACKWIDOW report missing | `ELEKTRA_PREFLIGHT_BLOCK: BLACKWIDOW_REQUIRED` |
| Both reports missing | `ELEKTRA_PREFLIGHT_BLOCK: VENOM_AND_BLACKWIDOW_REQUIRED` |
| Either report older than 7 days | `ELEKTRA_PREFLIGHT_BLOCK: UPSTREAM_REPORT_STALE` |
| Either report scope does not match | `ELEKTRA_PREFLIGHT_BLOCK: UPSTREAM_SCOPE_MISMATCH` |

---

## Routing Table Update

`ELEKTRA.md` (entrypoint) routing table now includes row `0` — Upstream Dependency Gate — pointing to `elektra/ELEKTRA.md §6.5`. This ensures the gate is visible from the entrypoint before any area file is loaded.
