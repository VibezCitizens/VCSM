# ARCHITECT — RLS Assumption Map
Generated: 2026-06-05
Branch: vport-booking-feed-security-updates

---

## DAL Method → RLS Analysis

| DAL Method | Table | Auth Layer | App-Layer Check | Risk |
|---|---|---|---|---|
| insertVportBookingDAL | bookings | vportClient (RLS) | Controller: resource active, actor kind, time future | COVERED |
| updateVportBookingDAL | bookings | vportClient (RLS) | Controller: assertActorOwnsVportActor + terminal check | COVERED |
| listVportBookingsForProfileDayDAL | bookings | vportClient (RLS) | Controller: assertActorOwnsVportActor (caller verified) | COVERED |
| getVportResourceByIdDAL | resources | vportClient (RLS) | No app-layer auth — read used for availability | READ-ONLY / ACCEPTABLE |
| listVportResourcesByProfileIdDAL | resources | vportClient (RLS) | No app-layer auth — public listing | READ-ONLY / ACCEPTABLE |
| listVportAvailabilityRulesByResourceIdDAL | availability_rules | vportClient (RLS) — named import | No app-layer auth | READ-ONLY — IMPORT DISCREPANCY |
| listVportAvailabilityRulesByResourceIdsDAL | availability_rules | vportClient (RLS) — named import | No app-layer auth | READ-ONLY — IMPORT DISCREPANCY |
| fetchFuelPriceSubmissionByIdDAL | fuel_price_submissions | vportClient (RLS) | Controller: checkVportOwnershipController before write | COVERED |
| upsertVportFuelPriceDAL | fuel_prices | vportClient (RLS) | Controller: ownership verified before call | COVERED |
| createVportFuelPriceHistoryDAL | fuel_price_history | vportClient (RLS) | Controller: ownership verified before call | COVERED |

---

## Key Findings

### F-ARCH-001: Import Discrepancy in vportAvailabilityRules
- File: apps/VCSM/src/features/dashboard/vport/dal/read/vportAvailabilityRules.read.dal.js
- Issue: Uses `import { vport as vportSchema }` (named export) vs all other DALs using `import vportSchema from "..."` (default export)
- Impact: Must verify `vportClient` module exports `vport` as named export AND default. If only default is exported, this DAL uses `undefined` as client.
- Severity: HIGH if clients differ; MEDIUM if they alias the same instance.

### F-ARCH-002: guest booking customer_actor_id = null
- When `requestActorId` is null (guest booking), `customer_actor_id` is null.
- In `updateBookingStatusController`, `isCustomer` = `null && ...` = `false`.
- Non-customer path triggers owner verification via `assertActorOwnsVportActorController`.
- No bypass: attacker still must pass ownership check.
- Risk: ACCEPTABLE — terminal/auth gates hold.

### F-ARCH-003: checkVportOwnershipController VPORT-kind self-shortcut
- `checkVportOwnershipController` allows a VPORT-kind actor to see its own dashboard.
- Flagged as navigation/visibility gate ONLY.
- `assertActorOwnsVportActorController` (used for mutations) unconditionally rejects VPORT-kind actors (ELEK-004 patch).
- Risk: MEDIUM — requires VENOM verification that mutation paths never route through `checkVportOwnershipController` without a subsequent kind check.
