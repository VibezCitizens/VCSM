---
name: vcsm.dashboard.index
description: VCSM dashboard feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / dashboard

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-04
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 75 | Spread across flyerBuilder, vport/controller, and all 12 card sub-systems (bookings, gasprices, leads, portfolio, schedule, settings, team); includes designStudio controllers |
| DAL files | 94 | Read and write DAL split by sub-system; designStudio.write.dal.js covers 12 design table operations; vport/dal/read/ has 10 read DAL files; gasprices, leads, team, portfolio, bookings each have dedicated read/write DAL |
| Hooks | 42 | useVportOwnership, useOwnerQuickStats, useVportBookingActions, useVportGasPrices, useVportTeam, useVportLeads, useVportOwnerSchedule, useDesignStudio, useDesignStudioExports, useDesignStudioSceneActions, usePortfolioItemSubmit, useBarberTeamRequests, and more |
| Models | 76 | buildDashboardCards.model.js, dashboardViewByVportType.model.js, dashboardVportDetails.model.js, gasPrices.model.js, vportBooking.model.js, vportFuelPrice.model.js, vportSettingsDraft.model.js, designStudioMapper.model.js, designStudioScene.model.js, vportAvailabilityRule.model.js, and more |
| Screens | 17 | VportDashboardScreen, VportDashboardBookingHistoryScreen, VportDashboardCalendarScreen, VportDashboardGasScreen, VportDashboardTeamScreen, VportDashboardLeadsScreen, VportDashboardPortfolioScreen, VportDashboardScheduleScreen, VportDashboardServicesScreen, VportDashboardReviewScreen, VportDashboardLocksmithScreen, VportDesignStudioViewScreen, VportActorMenuFlyerScreen, VportActorMenuFlyerEditorScreen, VportSettingsScreen, VportDashboardExchangeScreen, and more |
| Components | 173 | VportDashboardParts, BookingCard, OperationalBookingCard, TodayView, QuickBookingModal, calendar grid components (DayBody, DayHeader, WeeklyAvailabilityGrid), GasPricesPanel, FuelPriceRow, ScheduleGrid, ScheduleLaneElements, TeamMemberCards, AddTeamMemberSheet, PortfolioManagerCard, DesignStudioCanvasStage, CanvasNode, PrintableQrFlyerCard, and many more |
| Adapters | 2 | vport.adapter.js (vport/adapters/), qrcode.adapter.js (qrcode/adapters/) |
| Barrels | 61 | index.js per card sub-module; each of the 12 dashboard cards has a barrel export |
| Tests | 25 | gasprices (7 tests), bookings (3 tests), leads (2 tests), portfolio (2 tests), schedule (1 test), settings (2 tests), team (2 tests), designStudio (2 tests), vport/controller (1 test), qrcode (1 test), shared (1 test), flyerEditor (1 test) |
| Routes | 0 | No routes registered in scanner route-map — routing is handled internally via useNavigate within VportDashboardScreen |
| Total source files | 258 | Across flyerBuilder, qrcode, shared, and vport sub-directories |

## Write Surface Map

| Operation | Schema | Table | Function |
|---|---|---|---|
| upsert | vport | profile_public_details | saveFlyerPublicDetails |
| delete | (default) | design_render_jobs | dalDeleteDesignRenderJobsByPageId |
| delete | (default) | design_exports | dalDeleteDesignExportsByPageId |
| delete | (default) | design_page_versions | dalDeleteDesignPageVersionsByPageId |
| delete | (default) | design_pages | dalDeleteDesignPageById |
| insert | (default) | design_documents | dalCreateDesignDocument |
| insert | (default) | design_pages | dalCreateDesignPage |
| insert | (default) | design_page_versions | dalCreateDesignPageVersion |
| insert | (default) | design_assets | dalCreateDesignAsset |
| insert | (default) | design_exports | dalCreateDesignExport |
| insert | (default) | design_render_jobs | dalCreateDesignRenderJob |
| update | (default) | design_documents | dalTouchDesignDocument |
| update | (default) | design_pages | dalUpdateDesignPageCurrentVersion |
| update | (default) | design_pages | dalClearDesignPageCurrentVersion |
| update | (default) | bookings | updateVportBookingDAL |
| insert | (default) | resources | insertVportResourceDAL |
| insert | (default) | bookings | insertVportBookingDAL |
| insert | (default) | fuel_price_history | createVportFuelPriceHistoryDAL |
| insert | (default) | fuel_price_submission_reviews | createFuelPriceSubmissionReviewDAL |
| update | (default) | fuel_price_submissions | updateFuelPriceSubmissionStatusDAL |
| update | (default) | fuel_price_submission_reviews | markFuelPriceSubmissionReviewAppliedDAL |
| update | (default) | fuel_prices | updateFuelPriceUnitForActorDAL |
| upsert | (default) | fuel_prices | upsertVportFuelPriceDAL |
| insert | (default) | fuel_price_submissions | createFuelPriceSubmissionDAL |
| delete | (default) | business_card_leads | deleteVportBusinessCardLeadDAL |
| update | (default) | business_card_leads | markVportBusinessCardLeadContactedDAL |
| update | (default) | portfolio_media | updatePortfolioMediaAssetIdDAL |
| upsert | vport | profile_public_details | upsertVportPublicDetailsDAL |
| delete | (default) | resources | deleteTeamMemberByIdDAL |
| insert | (default) | resources | insertTeamMemberDAL |
| insert | (default) | resources | insertLinkedTeamMemberDAL |
| update | (default) | resources | updateTeamMemberRoleDAL |
| update | (default) | resources | setTeamMemberActiveDAL |
| delete | (default) | resources | deleteTeamResourceDAL |
| insert | (default) | resources | insertTeamRequestDAL |
| update | (default) | resources | acceptTeamRequestDAL |
| update | (default) | resources | declineTeamRequestDAL |
| update | (default) | resources | acceptTeamInviteByActorDAL |

## Security-Sensitive Surfaces

The following write surfaces touch auth-adjacent, financial, or platform-critical tables:

- **bookings (UPDATE)** — `updateVportBookingDAL`: booking state mutations (confirmed/cancelled/completed/no_show). Protected by VPD-V-021 terminal state guard and `assertActorOwnsVportActorController`. Customer cancellation path also validated.
- **bookings (INSERT)** — `insertVportBookingDAL`: new booking creation from dashboard. Must validate ownership and resource availability.
- **resources (INSERT/UPDATE/DELETE)** — Team member CRUD. Team members can be linked actors with platform identity; incorrect writes affect scheduling and availability resolution.
- **vport.profile_public_details (UPSERT x2)** — `saveFlyerPublicDetails` and `upsertVportPublicDetailsDAL`: Public VPORT details including directory visibility. Incorrect writes affect public discoverability.
- **fuel_price_submissions / fuel_price_submission_reviews** — Crowd-sourced price data flow. Review/apply path can update official prices visible to all users.
- **business_card_leads** — Deletion and status mutation of customer-submitted leads.

## Engine Dependencies

- availability
- booking
- hydration
- identity
- lead
- media
- menu
- notification
- portfolio
- profile
- qr
- review

## Routes

No routes registered in route-map scanner for this feature. All navigation from the dashboard shell is imperative (useNavigate calls inside VportDashboardScreen). Route registration is presumed to be in the main VCSM router file, which was not covered by the route-map scanner for this feature.

Known navigable paths (from source, not scanner):
- `/actor/:actorId/dashboard`
- `/actor/:actorId/dashboard/booking-history`
- `/actor/:actorId/dashboard/calendar`
- `/actor/:actorId/dashboard/gas`
- `/actor/:actorId/dashboard/team`
- `/actor/:actorId/dashboard/leads`
- `/actor/:actorId/dashboard/portfolio`
- `/actor/:actorId/dashboard/locksmith`
- `/actor/:actorId/dashboard/exchange`
- `/actor/:actorId/dashboard/services`
- `/actor/:actorId/dashboard/reviews`
- `/actor/:actorId/dashboard/schedule`
- `/actor/:actorId/menu/flyer`
- `/actor/:actorId/menu/flyer/edit`
- `/actor/:actorId/menu/qr`
- `/actor/:actorId/settings` (delegated to settings feature)

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT (PLACEHOLDER — content is a stub, no real contract) |
| ARCHITECTURE.md | PRESENT (this run — 2026-06-04) |
| CURRENT_STATUS.md | PRESENT (this run — 2026-06-04) |
| SCREENS.md | PRESENT |
