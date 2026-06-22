# MODULE ARCHITECTURE REPORT

**Module:** dashboard
**Application Scope:** apps/VCSM
**Module Type:** Feature Module — VPORT Owner Dashboard (Mega-Module)
**Primary Root:** `apps/VCSM/src/features/dashboard/`
**Independence Status:** DEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

Owns the complete VPORT owner management experience: booking management (calendar, history, quick booking, schedule), team management (invite, accept, remove), lead management, availability rules, service management, portfolio management, settings, QR code generation, and the Flyer Builder / Design Studio. This is the largest single feature module in VCSM — approximately 130+ files across 3 sub-modules.

---

## OWNERSHIP

Dashboard owns: VPORT owner views, booking calendar (owner view), schedule management, team management, leads, availability rules, portfolio item management, vport settings (public details, business card), QR code/flyer generation, and Design Studio (canvas-based flyer editor). Dashboard DEPENDS on booking, portfolio, and reviews engines.

---

## ENTRY POINTS

- `/dashboard` → `VportDashboardScreen.jsx`
- `/dashboard/bookings` → `VportDashboardBookingHistoryScreen.jsx`
- `/dashboard/calendar` → `VportDashboardCalendarScreen.jsx`
- `/dashboard/schedule` → `VportDashboardScheduleScreen.jsx`
- `/dashboard/services` → `VportDashboardServicesScreen.jsx`
- `/dashboard/portfolio` → `VportDashboardPortfolioScreen.jsx`
- `/dashboard/reviews` → `VportDashboardReviewScreen.jsx`
- `/dashboard/team` → `VportDashboardTeamScreen.jsx`
- `/dashboard/leads` → `VportDashboardLeadsScreen.jsx`
- `/dashboard/settings` → `VportSettingsScreen.jsx`
- `/dashboard/flyer` → `VportActorMenuFlyerScreen.jsx`
- `/dashboard/design-studio` → `VportDesignStudioViewScreen.jsx`
- `/dashboard/exchange` → `VportDashboardExchangeScreen.jsx`
- `/dashboard/gas` → `VportDashboardGasScreen.jsx`
- `/dashboard/locksmith` → `VportDashboardLocksmithScreen.jsx`
- `/barber/requests` → `BarberTeamRequestsScreen.jsx`

---

## LAYER MAP

**vport/ sub-module (owner dashboard):**

DAL (read): 15 read DAL files — actorOwners, actorVport, listVportBookingsForProfileDay, vportAvailabilityRules, vportBookingHistory, vportBookingsInRange, vportCities, vportLeads, vportProfile, vportProfileActorAccess, vportResource, vportServices, vportTeam, vportTeamInvite
DAL (write): 11 write DAL files — insertVportBooking, portfolioMediaRecord, updateVportBooking, vportAvailabilityRules, vportLeads, vportProfileActorAccess, vportPublicDetails, vportResource, vportTeam, vportTeamInvite

Controllers: 14 — addPortfolioMediaWithRecord, createOwnerBooking, ensureVportOwnerResource, listVportBookingHistory, loadDaySchedule, manageVportAvailabilityRule, probeVportPortfolio, saveVportPublicDetailsByActorId, updateVportBooking, vportLeads, vportOwnerStats, vportPublicBooking, vportTeam, vportTeamAccess, vportTeamInvite

Hooks: 16 — useAcceptBarbershopInvite, useBarberTeamRequests, useOwnerQuickStats, useSaveVportPublicDetailsByActorId, useVportBookingActions, useVportBookingHistory, useVportBookingOps, useVportEnsureResource, useVportLeads, useVportManageAvailability, useVportNewLeadsCount, useVportOwnerResources, useVportOwnerSchedule, useVportResourceAvailability, useVportTeam, useVportTeamAccess

Models: dashboardVportDetails, vportAvailabilityRule, vportBooking, vportSettingsDraft

Screens: 14 screens + components (BookingCard, OperationalBookingCard, QuickBookingModal, TodayView, calendar components, schedule components, team components)

**flyerBuilder/ sub-module:**

DAL: flyer.read.dal.js, flyer.write.dal.js
Controller: flyerEditor.controller.js
Hooks: useFlyerEditor.js
Models: flyerDraft.model.js, printableQrSheet.model.js, vportActorMenuFlyerView.model.js
Screens: VportActorMenuFlyerEditorScreen.jsx, VportActorMenuFlyerScreen.jsx, VportActorMenuFlyerView.jsx

**designStudio/ sub-module (within flyerBuilder):**

DAL: designStudio.auth.dal.js, designStudio.read.dal.js, designStudio.write.dal.js
Controllers: 5 — designStudio, designStudio.assetsExports, designStudio.load, designStudio.pages, designStudio.shared
Hooks: useDesignStudio.js, useDesignStudioExports.js, useDesignStudioSceneActions.js
Models: designStudioMapper, designStudioScene
Screen: VportDesignStudioViewScreen.jsx
Components: 15+ canvas/sidebar/toolbar components

**qrcode/ sub-module:**

Components: QrCard.jsx, QrCode.jsx, ClassicFlyer.jsx, PosterFlyer.jsx
Adapter: qrcode.adapter.js

**Adapters:**
- `dashboard/adapters/vport/screens/components/VportBackButton.adapter.js`
- `dashboard/adapters/vport/screens/useDesktopBreakpoint.adapter.js`
- `dashboard/vport/adapters/vport.adapter.js`
- `dashboard/qrcode/adapters/qrcode.adapter.js`

**Store:** None (uses booking engine + profile store from state/)

**Engine Consumers:** `@booking` (via booking feature), `@portfolio` (via portfolio feature), `@reviews` (via reviews feature)

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | VPORT owner dashboard clear | — |
| Owner defined | PARTIAL | No IRONMAN record | — |
| Entry points mapped | PASS | 16 screens routed | — |
| Controllers present/delegated | PASS | 20+ controllers | — |
| DAL/repository present/delegated | PARTIAL | 26+ local DALs, but duplicate booking DALs | CRITICAL: duplicates booking feature |
| Models/transformers present | PASS | 7+ models | — |
| Hooks/view models present | PASS | 16+ hooks | — |
| Screens/components present | PASS | 16 screens + 50+ components | — |
| Services/adapters present | PARTIAL | Multiple adapters, inconsistent | — |
| Database objects mapped | PARTIAL | vport schema + vc schema | Booking table ownership ambiguous |
| Authorization path mapped | PARTIAL | Owner checks via actorOwners DAL | No unified auth gate for dashboard |
| Cache/runtime behavior mapped | FAIL | No cache documented | Calendar is read-heavy |
| Error/loading/empty states mapped | PARTIAL | Some UI states | Not systematically confirmed |
| Documentation linked | FAIL | No Logan doc | — |
| Tests/validation noted | FAIL | No tests | — |
| Native parity noted | N/A | — | — |
| Engine dependencies mapped | PARTIAL | booking/portfolio/reviews via setup.js | Engine call chains not documented |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| `booking` feature | feature | dashboard → booking | PARTIAL | Dashboard duplicates booking DAL instead of using adapter |
| `portfolio` feature | feature | dashboard → portfolio | YES | TICKET-DASH-PORTFOLIO-COMPLETE-001 resolved Rule 9, card-level hooks, trace adapter boundary, and media profile-scope coverage |
| `reviews` feature | feature | dashboard → reviews | PARTIAL | Review screen in dashboard |
| `@booking` engine | engine | dashboard → @booking | YES (via feature) | — |
| `@portfolio` engine | engine | dashboard → @portfolio | YES (via feature) | — |
| `@reviews` engine | engine | dashboard → @reviews | YES (via feature) | — |
| vport schema | database | dashboard reads/writes | YES | Primary data source |
| vc schema | database | dashboard reads | YES | Actor ownership |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| VPORT bookings | read/write | dashboard (AND booking!) | Dashboard screens | CRITICAL: dual write ownership |
| Availability rules | read/write | dashboard (AND booking!) | Schedule screens | CRITICAL: duplicate write |
| VPORT team | read/write | dashboard | Team screen | — |
| VPORT leads | read/write | dashboard | Leads screen | — |
| VPORT profile public details | read/write | dashboard (AND settings!) | Settings screen | HIGH: dual write |
| Flyer drafts | read/write | dashboard | FlyerBuilder | — |
| Design studio canvas | read/write | dashboard | DesignStudio | — |
| Portfolio items | write | dashboard | Portfolio screen | Should go through @portfolio engine |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PASS | 16 screens routed | — |
| Loading state | PARTIAL | Some screens have loading | Calendar screen loading unclear |
| Empty state | PARTIAL | TodayView empty, some empty states | Not systematic |
| Error state | FAIL | Not confirmed | — |
| Auth/owner gates | PARTIAL | Controller-level checks | No unified route guard |
| Cache behavior | FAIL | Not documented | Calendar queries are N+1 risk |
| Runtime dependencies | PASS | Engine setup at startup | — |
| Hot paths | HIGH | Calendar/schedule on every dashboard open | N+1 risk on booking queries |

---

## DEAD CODE / SPAGHETTI SIGNALS

| Signal | Evidence | Risk | Recommended Handoff |
|---|---|---|---|
| Duplicate booking DALs | `dal/write/insertVportBooking.write.dal.js` + `updateVportBooking.write.dal.js` | CRITICAL | SENTRY |
| Duplicate availability DAL | `dal/write/vportAvailabilityRules.write.dal.js` | CRITICAL | SENTRY |
| `VportDashboardExchangeScreen.jsx` | Purpose unclear from name alone | MEDIUM | IRONMAN |
| `PortfolioBugsBunnyPanel.jsx` in dashboard | Debug panel in production screen | MEDIUM | IRONMAN |
| flyerDraft.model.js in `flyerBuilder/dal/` | Model file inside DAL folder | HIGH — layer violation | SENTRY |
| `vportAboutDetails.model.js` in settings/profile/ui/ | Model inside UI folder | HIGH — layer violation (also in settings) | SENTRY |
| Design Studio inside flyerBuilder inside dashboard | 3 levels of nesting — approaching max depth | MEDIUM | IRONMAN |
| Mega-module size (~130 files) | Largest module by far | HIGH — maintainability risk | IRONMAN |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | — | MISSING |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | KRAVEN | MISSING |
| Migration audit | CARNAGE | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | @booking, @portfolio | PARTIAL — portfolio dashboard path covered 2026-06-04 |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Resolve duplicate booking DAL with booking feature | CRITICAL | Two features write the same booking tables | SENTRY |
| Resolve duplicate availability DAL | CRITICAL | Availability ownership unclear | SENTRY |
| Unified dashboard auth gate | HIGH | Owner identity not centrally enforced at route level | VENOM |
| Calendar query N+1 audit | HIGH | Day view + booking + resource = repeated queries | KRAVEN |
| Move flyerDraft.model.js out of dal/ | HIGH | Model in DAL folder = layer violation | SENTRY |
| Logan documentation | HIGH | Largest module, no docs | LOGAN |
| Module decomposition plan | HIGH | 130+ files violates maintainability contract | IRONMAN |

---

## MODULE BOUNDARY WARNINGS

**MODULE BOUNDARY WARNING**
Location: `dashboard/vport/dal/write/insertVportBooking.write.dal.js`
Module: dashboard
Current dependency: Dashboard writes directly to booking tables
Expected boundary: All booking writes via `booking.adapter.js` controllers
Risk: CRITICAL
Suggested correction: dashboard/vport controllers call booking controllers via adapter

**MODULE BOUNDARY WARNING**
Location: `dashboard/flyerBuilder/dal/flyerDraft.model.js`
Module: dashboard
Current dependency: Model file inside DAL folder
Expected boundary: Models in `model/` subfolder
Risk: HIGH — layer confusion
Suggested correction: Move to `flyerBuilder/model/flyerDraft.model.js`

---

## FINAL MODULE STATUS: MOSTLY COMPLETE (but CRITICAL boundary violations)

## RECOMMENDED HANDOFFS:
- SENTRY (boundary: duplicate DAL ownership — booking/availability)
- KRAVEN (performance: calendar N+1 audit)
- IRONMAN (ownership: module decomposition plan, Exchange screen purpose)
- VENOM (security: unified dashboard auth gate)
- CARNAGE (schema: vport booking table ownership)
- LOGAN (documentation: dashboard architecture)
