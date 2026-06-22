# ARCHITECT Dashboard Module Wave Report
**Ticket:** TICKET-ARCHITECT-DASHBOARD-MODULE-WAVE-0001
**Date:** 2026-06-05
**Command:** ARCHITECT V2
**Scanner Version:** 1.1.0

---

## ARCHITECT SCANNER PREFLIGHT

Scanner Version: 1.1.0
Maps Root: apps/scanner/maps/
Freshness Window: 7 days

| Map | Generated At | Age | Freshness | Status |
|---|---|---|---|---|
| feature-map | 2026-06-04 20:29 | ~24h | FRESH | PASS |
| dependency-map | 2026-06-04 20:29 | ~24h | FRESH | PASS |
| route-map | 2026-06-04 20:29 | ~24h | FRESH | PASS |
| graph | 2026-06-04 20:29 | ~24h | FRESH | PASS |
| callgraph | 2026-06-04 20:29 | ~24h | FRESH | PASS |
| write-surface-map | 2026-06-04 20:29 | ~24h | FRESH | PASS |
| rpc-map | 2026-06-04 20:29 | ~24h | FRESH | PASS |

Overall Preflight: PASS

---

## Scope

Application: VCSM
Feature Root: apps/VCSM/src/features/dashboard/
Modules Audited: 17

---

## Route Access Classification — [SOURCE_VERIFIED] Correction

Scanner route-map marks all dashboard routes as `access: public`.
Source verification of `apps/VCSM/src/app/routes/protected/app.routes.jsx` confirms:
- All dashboard routes are nested inside `protectedAppRoutes()` with `OwnerOnlyDashboardGuard`
- Route-map `access=public` is INCORRECT for dashboard routes — these are PROTECTED/OWNER-GATED
- [SOURCE_VERIFIED]: Dashboard routes require authenticated session AND VPORT ownership

---

## Module Status Matrix

| Module | Type | Independence | Completeness | BEHAVIOR.md | Tests | Priority |
|---|---|---|---|---|---|---|
| bookings | card | MOSTLY INDEPENDENT | MOSTLY COMPLETE | MISSING | 3 files | P1 |
| calendar | card | DEPENDENT | INCOMPLETE | MISSING | 0 | P1 |
| exchange | card | DEPENDENT | INCOMPLETE | MISSING | 0 | P0 |
| locksmith | card (VPORT-type-specific) | DEPENDENT | INCOMPLETE | MISSING | 0 | P0 |
| gasprices | card (gas station) | MOSTLY INDEPENDENT | MOSTLY COMPLETE | MISSING | 7 files | P1 |
| portfolio | card | MOSTLY INDEPENDENT | MOSTLY COMPLETE | MISSING | 2 files | P1 |
| reviews | card | DEPENDENT | INCOMPLETE | MISSING | 0 | P0 |
| services | card | DEPENDENT | INCOMPLETE | MISSING | 0 | P0 |
| settings | card | MOSTLY INDEPENDENT | MOSTLY COMPLETE | MISSING | 2 files | P1 |
| schedule | card | MOSTLY INDEPENDENT | MOSTLY COMPLETE | MISSING | 1 file | P1 |
| team | card | MOSTLY INDEPENDENT | MOSTLY COMPLETE | MISSING | 2 files | P1 |
| vport | root orchestrator | MOSTLY INDEPENDENT | MOSTLY COMPLETE | MISSING | 1 file | P1 |
| vportOwnerStats | sub-module | DEPENDENT | INCOMPLETE | MISSING | 1 file | P1 |
| designStudio | sub-module | DEPENDENT | MOSTLY COMPLETE | MISSING | 2 files | P1 |
| flyerBuilder | top-level | MOSTLY INDEPENDENT | MOSTLY COMPLETE | MISSING | 2 files | P1 |
| qrcode | top-level | INDEPENDENT | MOSTLY COMPLETE | MISSING | 1 file | P2 |
| shared | shared library | INDEPENDENT | INCOMPLETE | MISSING | 1 file | P3 |

---

## Cross-Module Findings Summary

### [SOURCE_VERIFIED] Critical Findings

1. **Route access classification incorrect in scanner** — dashboard routes are PROTECTED (OwnerOnlyDashboardGuard), not public as scanner reports
2. **vport/model/ duplicated at vport/screens/model/** — buildDashboardCards.model.js and dashboardViewByVportType.model.js exist in two locations (drift risk)

### [SOURCE_VERIFIED] High Findings

3. **Cross-module DAL imports** — bookings, schedule, team, gasprices all import vport DAL directly (boundary violation; should go through adapter)
4. **gasprices owner update path** — explicit actor_owners check unverified in submitOwnerFuelPriceUpdate.controller
5. **portfolio ownership assert** — explicit ownership check unverified in addPortfolioMediaWithRecord.controller
6. **gasprices: direct import from profiles feature DAL** — resolveVportProfileId imported directly (boundary violation)

### [SOURCE_VERIFIED] Medium Findings

7. **BEHAVIOR.md missing from all 17 modules** — no behavioral contracts exist anywhere in the dashboard module tree
8. **designStudio design_* table schema=None** — tables not in named schema in write-surface-map; CARNAGE audit needed
9. **Thin shell cards** (calendar, exchange, reviews, services, locksmith) — 5 cards are pure shells with no documentation of delegation
10. **N+1 risk on vport dashboard load** — multiple parallel queries on screen open

### [SCANNER_LEAD] Low-Confidence Signals

11. **flyerBuilder routes not in route-map** — flyer editor screens not surfaced by route scanner
12. **settings route not in route-map** — settings screen not confirmed in scanner output
13. **designStudio entry route** — no independent route confirmed

---

## Callgraph Layer Counts (All Modules)

| Module | component | controller | dal | hook | model | screen | adapter |
|---|---|---|---|---|---|---|---|
| bookings | — | 7 | 2 | 3 | 3 | — | — |
| calendar | — | — | — | — | — | — | — |
| exchange | — | — | — | — | — | — | — |
| gasprices | 10 | 9 | 18 | 7 | 11 | 4 | — |
| locksmith | 5 | — | — | — | — | — | — |
| portfolio | 3 | 2 | 1 | 3 | — | — | — |
| reviews | — | — | — | — | — | — | — |
| services | — | — | — | — | — | — | — |
| settings | 5 | 5 | 1 | 3 | 11 | — | — |
| schedule | 25 | 4 | — | 3 | 1 | — | — |
| team | 11 | 22 | 16 | 4 | — | — | — |
| vport | 67 | 1 | 24 | 5 | 21 | 4 | — |
| vportOwnerStats | — | 5 | — | — | — | — | — |
| designStudio | 29 | 12 | 26 | 11 | 18 | 5 | — |
| flyerBuilder | 9 | 2 | 1 | 1 | 7 | 4 | — |
| qrcode | 8 | — | — | — | — | — | 1 |
| shared | 1 | — | — | — | — | — | — |

---

## Write Surfaces in Scope

| Table | Schema | Operation | Module |
|---|---|---|---|
| bookings | — | UPDATE | vport/bookings |
| bookings | — | INSERT | bookings |
| resources | — | INSERT/UPDATE/DELETE | vport/team |
| fuel_prices | — | UPDATE/UPSERT | gasprices |
| fuel_price_history | — | INSERT | gasprices |
| fuel_price_submissions | — | INSERT | gasprices |
| fuel_price_submission_reviews | — | INSERT/UPDATE | gasprices |
| portfolio_media | — | UPDATE | portfolio |
| profile_public_details | vport | UPSERT | settings/flyerBuilder |
| design_documents | — | INSERT/UPDATE/DELETE | designStudio |
| design_pages | — | INSERT/UPDATE/DELETE | designStudio |
| design_page_versions | — | INSERT/DELETE | designStudio |
| design_assets | — | INSERT | designStudio |
| design_exports | — | INSERT/DELETE | designStudio |
| design_render_jobs | — | INSERT/DELETE | designStudio |
| business_card_leads | — | UPDATE/DELETE | leads (not in scope) |

---

## Handoff Recommendations

| Command | Modules | Reason |
|---|---|---|
| VENOM | gasprices, portfolio | Ownership assert verification needed |
| SENTRY | bookings, schedule, team, gasprices, vport | Cross-module DAL boundary violations |
| LOGAN | ALL 17 modules | BEHAVIOR.md missing everywhere |
| CARNAGE | designStudio, flyerBuilder | design_* table schema=None |
| LOKI | gasprices, schedule, vport, flyerBuilder | Cache/runtime hot paths |
| KRAVEN | vport, schedule, designStudio | N+1 and canvas write frequency |
| IRONMAN | exchange, reviews, services, locksmith, team | Data source identification + model gaps |
| HAWKEYE | settings, flyerBuilder, designStudio | Route gaps in scanner output |
| SPIDER-MAN | calendar, exchange, locksmith, reviews, services | Zero test coverage |

---

## Source Verification Summary

| Module | Files Read | Confidence |
|---|---|---|
| bookings | 4 | HIGH |
| gasprices | 2 | HIGH |
| team | 2 | HIGH |
| designStudio | 2 | HIGH |
| vport (routes) | 1 | HIGH |
| All others | 0 (file inventory verified) | MEDIUM |

Total source files validated: 11

---

## Output Files

| Module | ARCHITECTURE.md | Evidence Bundle |
|---|---|---|
| bookings | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/bookings/ARCHITECTURE.md | outputs/2026/06/05/ARCHITECT/evidence-bundle.md |
| calendar | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/calendar/ARCHITECTURE.md | — |
| exchange | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/exchange/ARCHITECTURE.md | — |
| locksmith | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/locksmith/ARCHITECTURE.md | — |
| gasprices | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/gasprices/ARCHITECTURE.md | — |
| portfolio | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/portfolio/ARCHITECTURE.md | — |
| reviews | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/reviews/ARCHITECTURE.md | — |
| services | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/services/ARCHITECTURE.md | — |
| settings | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/settings/ARCHITECTURE.md | — |
| schedule | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/schedule/ARCHITECTURE.md | — |
| team | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/team/ARCHITECTURE.md | — |
| vport | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/vport/ARCHITECTURE.md | — |
| vportOwnerStats | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/vportOwnerStats/ARCHITECTURE.md | — |
| designStudio | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/designStudio/ARCHITECTURE.md | — |
| flyerBuilder | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/flyerBuilder/ARCHITECTURE.md | — |
| qrcode | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/qrcode/ARCHITECTURE.md | — |
| shared | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/shared/ARCHITECTURE.md | — |
