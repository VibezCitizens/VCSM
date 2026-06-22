# TESTS — Dashboard Gasprices Module

**SPIDER-MAN Last Run:** 2026-06-05
**Release Safety:** WATCH
**Mode:** SECURITY_WARFARE_SIMULATION

---

## Existing Test Files

| Test File | Controller / DAL | Coverage | Status |
|---|---|---|---|
| `submitFuelPriceSuggestion.controller.test.js` | submitFuelPriceSuggestionController | citizen submission path, price validation | PASS |
| `gasprices.spiderman.test.js` | Screen / view composition | Component rendering only — no security coverage | INFO |
| `vportFuelPriceSubmissions.write.dal.test.js` | vportFuelPriceSubmissionsDAL | Write path, field validation | PASS (partial) |

## Missing Test Files (SPIDER-MAN 2026-06-05)

| Priority | Test File to Create | Covers | Finding |
|---|---|---|---|
| P0 | `__tests__/reviewFuelPriceSuggestion.controller.test.js` | VENOM-WS-002: VPORT-kind mutation gate bypass, owner vs non-owner | SPM-2026-06-05-001 |
| P0 | `__tests__/publishFuelPriceUpdateAsPost.controller.test.js` | ELEK-005 + BW-NEW-001: user-kind + VPORT-kind bypass, non-owner rejection | SPM-2026-06-05-002 |
| P1 | Add to `vportFuelPriceSubmissions.write.dal.test.js` | VENOM-WS-003: concurrent approve — DB no status precondition allows double-approval | SPM-2026-06-05-005 |

## Security Invariants Protected

| Invariant | Test | Status |
|---|---|---|
| ALLOWED_FUEL_KEYS gating on approve | reviewFuelPriceSuggestion (partial) | PARTIAL |
| Price Number.isFinite + >= 0 | submitFuelPriceSuggestion.controller.test.js | PROTECTED |
| ALLOWED_UNITS gating on updateStationFuelUnit | NOT TESTED | MISSING |
| VENOM-WS-002: VPORT-kind mutation gate | NOT PROTECTED — test needed | MISSING |
| VENOM-WS-003: TOCTOU double-approval | NOT PROTECTED — test needed | MISSING |
| BW-NEW-001 / ELEK-005: publishFuelPriceUpdateAsPost ownership bypass | NOT PROTECTED — test needed | MISSING |

## Open Findings Affecting This Module

| Finding | Severity | Status |
|---|---|---|
| VENOM-WS-002 | MEDIUM | Open — 4 controllers use checkVportOwnershipController as mutation gate |
| VENOM-WS-003 | LOW | Open — updateFuelPriceSubmissionStatusDAL no DB status precondition |
| BW-NEW-001 | MEDIUM | Open — publishFuelPriceUpdateAsPost degenerate self-check (VPORT-kind) |
| ELEK-2026-06-05-005 | MEDIUM | Open — publishFuelPriceUpdateAsPost user-kind bypass |

## Report

Full SPIDER-MAN report: `ZZnotforproduction/GOVERNANCE/outputs/2026/06/05/SPIDER-MAN/spiderman-report.md`
