# Test Coverage — vportOwnerStats

Last Updated: 2026-06-04
SPIDER-MAN Last Run: 2026-06-04
Release Safety: CLEAN

---

## Test File

`apps/VCSM/src/features/dashboard/vport/controller/__tests__/vportOwnerStats.controller.test.js`

Run:
```
npx vitest run src/features/dashboard/vport/controller/__tests__/vportOwnerStats.controller.test.js
```

Result: **10 / 10 passing**

---

## Test Inventory

| # | Test Name | TESTREQ | BEH-ID | Status |
|---|---|---|---|---|
| 1 | requires actorId before ownership or stats reads | TESTREQ-DASH-vportOwnerStats-001 | BEH-DASH-vportOwnerStats-304 | ✅ PASSING |
| 2 | requires callerActorId | TESTREQ-DASH-vportOwnerStats-002 | BEH-DASH-vportOwnerStats-304 | ✅ PASSING |
| 3 | rejects unauthorized callers before any stats DAL read | TESTREQ-DASH-vportOwnerStats-003 | BEH-DASH-vportOwnerStats-301/302/303 | ✅ PASSING |
| 4 | reads stats only after ownership is verified | TESTREQ-DASH-vportOwnerStats-004/006 | BEH-DASH-vportOwnerStats-001 | ✅ PASSING |
| 5 | returns zero booking counts without booking DAL calls when no resources exist | TESTREQ-DASH-vportOwnerStats-005 | BEH-DASH-vportOwnerStats-002 | ✅ PASSING |
| 6 | surfaces staff DAL failures instead of silently degrading to zero | TESTREQ-DASH-vportOwnerStats-009 | BEH-DASH-vportOwnerStats-309 | ✅ PASSING |
| 7 | keeps the vportOwnerStats controller path free of writes, RPCs, and edge calls | TESTREQ-DASH-vportOwnerStats-010 | BEH-DASH-vportOwnerStats-308 | ✅ PASSING |
| 8 | keeps dashboard/vport production files from importing vportOwnerStats test internals | TESTREQ-DASH-vportOwnerStats-010 | BEH-DASH-vportOwnerStats-310 | ✅ PASSING |
| 9 | throws when VPORT profile is inactive (is_active: false) | TESTREQ-BW-vportOwnerStats-001 | BW-VPORTOS-001 / ELEK-2026-06-04-001 | ✅ PASSING (added 2026-06-04) |
| 10 | throws when VPORT profile is soft-deleted (is_deleted: true) | TESTREQ-BW-vportOwnerStats-001 | BW-VPORTOS-001 / ELEK-2026-06-04-001 | ✅ PASSING (added 2026-06-04) |

---

## Security Findings Coverage

| Finding | Severity | Patch | Regression Test | Status |
|---|---|---|---|---|
| VEN-DASH-001 — callerActorId not bound | HIGH | PATCHED | Test #3 | HARDENED |
| ELEK-003 — same | HIGH | PATCHED | Test #3 | HARDENED |
| BLOCK-DASH-005 — ownership before reads | P0 | PATCHED | Test #3, #4 | HARDENED |
| VEN-VPORTOS-001 — booking PII over-fetch | MEDIUM | PATCHED (SELECT "id") | Static scan test #7 | HARDENED |
| VEN-VPORTOS-002 / ELEK-2026-06-04-001 / BW-VPORTOS-001 — lifecycle bypass | LOW | PATCHED | Tests #9, #10 | HARDENED |
| ELEK-2026-06-04-002 — DAL over-fetch | INFO | PATCHED | Static scan test #7 | HARDENED |

---

## Coverage Gaps (Non-Blocking)

| Gap | Type | Severity | Notes |
|---|---|---|---|
| useOwnerQuickStats.js — hook loading lifecycle | HOOK | LOW | finally block + cancelled flag; simple logic, low risk |
| listVportBookingsForProfileDay — DB-level cancelled filter | INTEGRATION | INFO | Requires real DB; mock tests cannot prove `.not("status","in",...)` DB behavior |
