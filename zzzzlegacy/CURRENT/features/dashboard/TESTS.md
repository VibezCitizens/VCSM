# dashboard — TESTS.md
# Last Updated: 2026-06-04
# Ticket: TICKET-DASH-GAS-SOURCE-COMPLETE-001
# Coverage Status: PARTIAL — SPIDER-MAN not yet run
# Status: CURRENT SOURCE OF TRUTH

Test coverage status for the dashboard feature.
Full dashboard SPIDER-MAN coverage audit has not run. Tier 4 qrcode/shared, vportOwnerStats, portfolio, and gas source-side focused SPIDER-MAN coverage is complete.

---

## Coverage Summary

| Area | Status | Evidence |
|---|---|---|
| scheduleBookingCoordinator.controller.js | ✓ TESTED | 3 delegation tests passing — TICKET-0004 |
| Tier 4 qrcode | ✓ TESTED | 8 focused SPIDER-MAN tests passing — `qrcode.spiderman.test.js` |
| Tier 4 shared | ✓ TESTED | 5 focused SPIDER-MAN tests passing — `shared.spiderman.test.js` |
| vportOwnerStats | ✓ TESTED | 8 focused SPIDER-MAN/controller tests passing — `vportOwnerStats.controller.test.js` |
| portfolio | ✓ TESTED | 8 focused SPIDER-MAN/Rule 9 tests passing — `portfolio.index.rule9.test.js`, `portfolio.spiderman.test.js` |
| gas prices | ✓ TESTED FOR SOURCE | 57 focused tests passing — gas controller/DAL/model tests plus `gasprices.spiderman.test.js`; live DB RLS verification still external |
| useVportOwnerSchedule.js | ✗ NOT TESTED | Hook split deferred — no dedicated tests yet |
| Bookings card public index | ✗ UNKNOWN | SPIDER-MAN not run |
| Promoted modules: calendar/exchange/locksmith/reviews/services | ✗ NOT TESTED | TICKET-DASHBOARD-MODULE-PROMOTION-0002 promoted these modules; no dashboard-local tests found |
| All other cards | ✗ UNKNOWN | SPIDER-MAN not run |
| Dashboard-level integration | ✗ UNKNOWN | SPIDER-MAN not run |

---

## Known Tests

### qrcode.spiderman.test.js

**Location:** `apps/VCSM/src/features/dashboard/qrcode/__tests__/qrcode.spiderman.test.js`
**Status:** 8 tests passing (verified 2026-06-04)
**Evidence:** `npx vitest run src/features/dashboard/qrcode/__tests__/qrcode.spiderman.test.js src/features/dashboard/shared/__tests__/shared.spiderman.test.js`

Tests verify:
- QR URL builders reject null, empty, whitespace-only, and raw UUID slug inputs ✓
- Safe slugs are encoded into menu, reviews, business-card, and short display URLs ✓
- `QrCode` returns null for empty values ✓
- Public menu/reviews QR views remain gated by `isQrSafeSlug` ✓
- Flyer print/body rendering remains gated by `isQrSafeSlug` ✓
- Settings business-card QR modal copy/open actions are bound to the safe built URL ✓
- `dashboard/qrcode` remains free of DAL/controller/RPC/write/Supabase access ✓
- External consumers import through `qrcode.adapter.js` instead of component internals ✓

### shared.spiderman.test.js

**Location:** `apps/VCSM/src/features/dashboard/shared/__tests__/shared.spiderman.test.js`
**Status:** 5 tests passing (verified 2026-06-04)
**Evidence:** `npx vitest run src/features/dashboard/qrcode/__tests__/qrcode.spiderman.test.js src/features/dashboard/shared/__tests__/shared.spiderman.test.js`

Tests verify:
- `VportBackButton` renders an accessible button with `aria-label="Back"` ✓
- Desktop mode renders visible `Back` text ✓
- Click activation invokes the caller callback once ✓
- `BackButton.jsx` stays free of routing, data, auth, and ownership logic ✓
- `dashboard/shared` stays free of hooks/controllers/DAL/Supabase/RPC/edge access ✓

### scheduleBookingCoordinator.controller.test.js

**Location:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/schedule/controller/`
**Status:** 3 tests passing (confirmed in TICKET-0004 verification)
**Evidence:** `HISTORY/2026/06/commands/wolverine/2026-06-02_wolverine_dashboard-ticket-0004.md`

Tests verify:
- `createScheduleBooking` delegates to `createOwnerBookingController` ✓
- `updateScheduleBookingStatus` delegates to `updateBookingStatusController` ✓
- `rescheduleScheduleBooking` delegates to `rescheduleBookingController` ✓

---

### vportOwnerStats.controller.test.js

**Location:** `apps/VCSM/src/features/dashboard/vport/controller/__tests__/vportOwnerStats.controller.test.js`
**Status:** 8 tests passing (verified 2026-06-04)
**Evidence:** `npx vitest run src/features/dashboard/vport/controller/__tests__/vportOwnerStats.controller.test.js`

Tests verify:
- Missing `actorId` rejects before ownership or stats reads ✓
- Missing `callerActorId` rejects before stats reads ✓
- Non-owner caller is rejected before profile/resource/staff/booking reads ✓
- Verified owner gets today, upcoming, and active barber counts ✓
- No resources returns zero booking counts without booking DAL calls ✓
- Active barber count only includes active linked staff rows ✓
- Staff DAL failures throw instead of silently degrading to zero ✓
- Controller/hook/DAL path remains free of writes, RPCs, and edge calls ✓

---

### portfolio.index.rule9.test.js + portfolio.spiderman.test.js

**Location:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/__tests__/`
**Status:** 8 tests passing (verified 2026-06-04)
**Evidence:** `npx vitest run src/features/dashboard/vport/dashboard/cards/portfolio/__tests__/portfolio.index.rule9.test.js src/features/dashboard/vport/dashboard/cards/portfolio/__tests__/portfolio.spiderman.test.js`

Tests verify:
- Portfolio public card index exports no DALs/controllers ✓
- Submit/upload hooks live in card-level `hooks/`, not nested component hooks ✓
- Portfolio trace diagnostics use `features/portfolio/adapters/portfolioTrace.adapter.js` ✓
- Dashboard owner gate blocks before manager workflows render ✓
- Media asset backfill requires `callerProfileId` and scopes `.eq('profile_id', callerProfileId)` ✓
- `addPortfolioMediaWithRecord` passes portfolio media profile scope into the write DAL ✓

---

### gasprices focused tests

**Location:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/gasprices/__tests__/`
**Status:** 57 tests passing (verified 2026-06-04)
**Evidence:** `npx vitest run src/features/dashboard/vport/dashboard/cards/gasprices/__tests__`

Tests verify:
- Gas public card index exports no DAL internals ✓
- Final screen owns route/identity/ownership gate and delegates hook wiring to `VportDashboardGasView` ✓
- Gas cache invalidation is centralized through `FuelPriceCacheService` ✓
- Owner price update rejects non-owners before official writes/cache invalidation ✓
- Citizen suggestions validate actor, fuel key, numeric price, duplicates, and profile resolution ✓
- Submission DAL omits deprecated evidence payload and writes expected fields ✓
- Read DAL cache behavior and error message normalization are covered ✓

Live DB RLS/check-constraint verification for `GAS-RLS-001` remains outside this source test suite.

---

---

## BLACKWIDOW Test Findings (TICKET-DASH-BLACKWIDOW-001)

BLACKWIDOW adversarial pass found zero exploitable paths against the settings card trust chain.
One test-relevant behavioral finding was identified:

### BW-SETTINGS-001 — Double-submit in useSaveVportSettings

**Finding:** `useSaveVportSettings.onSave` has no `if (saving) return;` guard at the top of the callback. A user double-tapping the save button can dispatch two concurrent controller calls.

**Security impact:** None — both calls carry identical authorized `callerActorId`; PostgreSQL UPSERT serializes at the row lock level; result is idempotent.

**Test recommendation:** Add a regression test that verifies `onSave` does not fire a second controller call when `saving === true`. This is a UX correctness test, not a security test.

**Suggested test location:** `cards/settings/__tests__/useSaveVportSettings.hook.test.js`

---

## Pending Tests (Updated)

| Area | Why Pending | When to Add |
|---|---|---|
| useScheduleData.js | Not yet created — hook split deferred | After DEFER-DASH-001 completes |
| useScheduleModals.js | Not yet created | After DEFER-DASH-001 completes |
| useScheduleBookingOps.js | Not yet created | After DEFER-DASH-001 completes |
| settingsCoordinator.controller.js | EXISTS (TICKET-0009) — 0 tests written | SPIDER-MAN required — priority target |
| useSaveVportSettings — saving guard | BLACKWIDOW found double-submit gap (BW-SETTINGS-001) | SPIDER-MAN + TICKET-DASH-BOOKINGS-RULE9 sprint |
| calendar module | Adapter-backed availability/resource writes and optional feed publish need dashboard integration tests | SPIDER-MAN module promotion suite |
| exchange module | Rate save/publish adapter workflow needs dashboard gating test | SPIDER-MAN module promotion suite |
| locksmith module | Service area add/update/delete adapter workflow needs dashboard gating test | SPIDER-MAN module promotion suite |
| reviews module | Owner/public mode handoff to reviews adapter needs regression coverage | SPIDER-MAN module promotion suite |
| services module | `allowOwnerEditing` must remain behind owner gate | SPIDER-MAN module promotion suite |
| Full regression suite | SPIDER-MAN not run | BLACKWIDOW cleared settings — SPIDER-MAN can now run |

---

## SPIDER-MAN Status

**PARTIAL.** Tier 4 qrcode/shared, vportOwnerStats, portfolio, and gas source-side focused SPIDER-MAN coverage is complete. Full regression safety audit is still pending for the remaining dashboard modules, and gas still needs live DB RLS/check-constraint verification before THOR CLEAR.

TICKET-DASH-VENOM-001 and TICKET-DASH-BLACKWIDOW-001 are both COMPLETE. SPIDER-MAN can now run on the settings card. Priority targets:
1. `settingsCoordinator.controller.js` — 0 tests, owns full validation + delegation path
2. `useSaveVportSettings` — double-submit saving guard (BW-SETTINGS-001)
3. Coordinator delegation under null/invalid actorId conditions
4. Promoted modules calendar/exchange/locksmith/reviews/services — dashboard owner gates and adapter workflow handoff
