# Runtime Feature Index: dashboard

## Metadata

| Field | Value |
|---|---|
| Feature | dashboard |
| CURRENT Folder | CURRENT/features/dashboard |
| Source Folder | apps/VCSM/src/features/dashboard |
| Generated | 2026-06-04 |
| Scope | VCSM |
| Evidence Mode | Source scan + CURRENT evidence |
| ARCHITECT Ticket | TICKET-DASHBOARD-MODULE-PROMOTION-0002 |

## Dashboard Module Count

| Tier | Modules | Count |
|---|---|---:|
| Tier 1 — Security Critical | flyerBuilder, designStudio, vportOwnerStats, bookings, team, settings, leads | 7 |
| Tier 2 — Operational | portfolio, schedule, gas prices | 3 |
| Tier 3 — Newly Promoted Modules | calendar, exchange, locksmith, reviews, services | 5 |
| Tier 4 — Read Only | qrcode, shared | 2 |

Total dashboard modules: **17**.

## Source Inventory

| Layer | Count | Key Files |
|---:|---:|---|
| Controllers | 26 | checkVportOwnership.controller.js, vportOwnerStats.controller.js, createOwnerBooking.controller.js, vportPublicBooking.controller.js, updateVportBooking.controller.js, settingsCoordinator.controller.js, saveVportPublicDetailsByActorId.controller.js, scheduleBookingCoordinator.controller.js, loadDaySchedule.controller.js, getVportGasPrices.controller.js, submitFuelPriceSuggestion.controller.js, reviewFuelPriceSuggestion.controller.js, publishFuelPriceUpdateAsPost.controller.js, updateStationFuelUnit.controller.js, vportLeads.controller.js, addPortfolioMediaWithRecord.controller.js, probeVportPortfolio.controller.js, vportTeam.controller.js, vportTeamAccess.controller.js, vportTeamInvite.controller.js, flyerEditor.controller.js, designStudio.controller.js, designStudio.load.controller.js, designStudio.pages.controller.js, designStudio.assetsExports.controller.js, designStudio.shared.controller.js |
| DALs | 34 | actorVport.read.dal.js, actorOwners.read.dal.js, vportProfile.read.dal.js, vportResource.read.dal.js, vportAvailabilityRules.read.dal.js, vportBookingsInRange.read.dal.js, vportBookingById.read.dal.js, listVportBookingsForProfileDay.read.dal.js, vportCities.read.dal.js, vportServices.read.dal.js, vportProfileActorAccess.read.dal.js, insertVportBooking.write.dal.js, updateVportBooking.write.dal.js, vportResource.write.dal.js, vportPublicDetails.write.dal.js, vportFuelPrices.read.dal.js, vportFuelPrices.write.dal.js, vportFuelPriceHistory.write.dal.js, vportFuelPricePost.read.dal.js, vportFuelPriceReviews.write.dal.js, vportFuelPriceSubmissions.read.dal.js, vportFuelPriceSubmissions.write.dal.js, vportStationPriceSettings.read.dal.js, vportLeads.read.dal.js, vportLeads.write.dal.js, portfolioMediaRecord.write.dal.js, vportTeam.read.dal.js, vportTeam.write.dal.js, vportTeamInvite.read.dal.js, vportTeamInvite.write.dal.js, flyer.write.dal.js, designStudio.auth.dal.js, designStudio.read.dal.js, designStudio.write.dal.js |
| Hooks | 28 | useVportOwnership.js, useOwnerQuickStats.js, useVportBookingActions.js, useVportBookingOps.js, useQuickBookingModal.js, useVportOwnerSchedule.js, useVportGasPrices.js, useSubmitFuelPriceSuggestion.js, useOwnerPendingSuggestions.js, useSubmitBulkFuelPrices.js, useGasUnitToggle.js, useAfterSubmitSuggestion.js, useUpdateStationFuelUnit.js, useVportLeads.js, useVportNewLeadsCount.js, useVportPortfolioProbe.js, usePortfolioItemSubmit.js, usePortfolioMediaUpload.js, useSaveVportSettings.js, useSaveVportPublicDetailsByActorId.js, useVportTeam.js, useVportTeamAccess.js, useBarberTeamRequests.js, useFlyerEditor.js, useDesignStudio.js, useDesignStudioExports.js, useDesignStudioSceneActions.js, useCanvasInteraction.js |
| Models | 23 | vportBooking.model.js, vportBookingHistoryView.model.js, vportAvailabilityRule.model.js, gasPrices.model.js, vportFuelPrice.model.js, vportFuelPriceSubmission.model.js, vportStationPriceSettings.model.js, gasErrorMessages.js, vportLead.model.js, vportLead.display.model.js, vportDashboardLeadsScreen.model.js, vportSettingsDraft.model.js, vportSettingsValidation.model.js, buildDashboardCards.model.js (x2 — DUPLICATE), dashboardViewByVportType.model.js (x2 — DUPLICATE), dashboardVportDetails.model.js, vportBookingHistoryView.model.js (screens/model/), printableQrSheet.model.js, vportActorMenuFlyerView.model.js, designStudioMapper.model.js, designStudioScene.model.js |
| Screens | 23 | VportDashboardScreen.jsx, VportDashboardBookingHistoryScreen.jsx, VportDashboardCalendarScreen.jsx, VportDashboardExchangeScreen.jsx, VportDashboardGasScreen.jsx, VportGasPricesScreen.jsx, VportGasPricesView.jsx, VportDashboardLeadsScreen.jsx, VportDashboardLeadsFinalScreen.jsx, VportDashboardLeadsView.jsx, VportDashboardLocksmithScreen.jsx, VportDashboardPortfolioScreen.jsx, VportDashboardReviewScreen.jsx, VportDashboardScheduleScreen.jsx, VportSettingsScreen.jsx, VportSettingsFinalScreen.jsx, VportDashboardTeamScreen.jsx, BarberTeamRequestsScreen.jsx, VportActorMenuFlyerScreen.jsx, VportActorMenuFlyerEditorScreen.jsx, VportActorMenuFlyerView.jsx, VportDesignStudioViewScreen.jsx, VportDashboardBookingHistoryView.jsx |
| Components | 79 | flyerBuilder (10+), designStudio (10+), calendar (9), bookingHistory (4), portfolio (4), gasprices (8), leads (0 — screens only), locksmith (1), schedule (7), settings (4), team (3), qrcode (5+), shared (1) |
| Routes | 12 | /actor/:actorId/dashboard, /dashboard/gas, /dashboard/reviews, /dashboard/leads, /dashboard/exchange, /dashboard/calendar, /dashboard/portfolio, /dashboard/locksmith, /dashboard/booking-history, /dashboard/team, /dashboard/schedule, /dashboard/services |
| Tests | 12 | insertVportBooking.write.dal.test.js, vportPublicBooking.controller.test.js, scheduleBookingCoordinator.controller.test.js, settingsCoordinator.controller.test.js, settingsSavingGuard.regression.test.js, vportTeamInvite.controller.test.js, vportLeads.controller.test.js, gasErrorMessages.model.test.js, getVportGasPrices.controller.test.js, submitFuelPriceSuggestion.controller.test.js, vportFuelPriceSubmissions.read.dal.test.js, vportFuelPriceSubmissions.write.dal.test.js |

## Route / Screen Map

| Route / Screen | Source Path | Public/Auth/Owner | Notes |
|---|---|---|---|
| /actor/:actorId/dashboard | VportDashboardScreen.jsx | OWNER | Main dashboard hub; useVportOwnership gate |
| /actor/:actorId/dashboard/gas | VportDashboardGasScreen.jsx | OWNER | Gas price management + community suggestions |
| /actor/:actorId/dashboard/reviews | VportDashboardReviewScreen.jsx | OWNER | Review management |
| /actor/:actorId/dashboard/leads | VportDashboardLeadsScreen.jsx | OWNER | Business card leads |
| /actor/:actorId/dashboard/exchange | VportDashboardExchangeScreen.jsx | OWNER | Exchange rate management |
| /actor/:actorId/dashboard/calendar | VportDashboardCalendarScreen.jsx | OWNER | Booking availability calendar |
| /actor/:actorId/dashboard/portfolio | VportDashboardPortfolioScreen.jsx | OWNER | Portfolio media management |
| /actor/:actorId/dashboard/locksmith | VportDashboardLocksmithScreen.jsx | OWNER | Locksmith services management |
| /actor/:actorId/dashboard/booking-history | VportDashboardBookingHistoryScreen.jsx | OWNER | Booking history and quick actions |
| /actor/:actorId/dashboard/team | VportDashboardTeamScreen.jsx | OWNER | Team member management |
| /actor/:actorId/dashboard/schedule | VportDashboardScheduleScreen.jsx | OWNER | Day/week schedule view |
| /actor/:actorId/dashboard/services | VportDashboardServicesScreen.jsx | OWNER | Service catalog management |
| Flyer editor | VportActorMenuFlyerEditorScreen.jsx | OWNER | Flyer design editing |
| Design studio | VportDesignStudioViewScreen.jsx | OWNER | Canvas design studio |
| Public booking (no route — modal/widget) | vportPublicBooking.controller.js | PUBLIC (citizen or guest) | Accepts null requestActorId for walk-ins |

## Promoted Adapter Workflow Map

| Module | Source Path | Adapter Workflow | Local DAL Writes | THOR Classification |
|---|---|---|---|---|
| calendar | `cards/calendar/VportDashboardCalendarScreen.jsx` | booking availability/resource hooks; barbershop/locksmith feed publish adapters | NO | CAUTION |
| exchange | `cards/exchange/VportDashboardExchangeScreen.jsx` | VPORT rates view/editor/save/publish profile adapters | NO | CAUTION |
| locksmith | `cards/locksmith/VportDashboardLocksmithScreen.jsx` | locksmith profile owner/read/publish adapters | NO | CAUTION |
| reviews | `cards/reviews/VportDashboardReviewScreen.jsx` | reviews adapter view with owner/public mode | NO | CAUTION |
| services | `cards/services/VportDashboardServicesScreen.jsx` | VPORT services adapter view/edit workflow | NO | CAUTION |

## Mutation Surface Map

| Surface | Source Path | Write Type | Ownership Gate Known | Risk |
|---|---|---|---|---|
| createOwnerBooking.controller.js | cards/bookings/controller/ | INSERT booking (confirmed) | YES — assertActorOwnsVportActorController | HIGH |
| createVportPublicBookingController | cards/bookings/controller/vportPublicBooking.controller.js | INSERT booking (pending) | YES — user-kind check; past-time guard; service label server-resolved | HIGH |
| updateVportBooking.controller.js | cards/bookings/controller/ | UPDATE booking status | YES — assertActorOwnsVportActorController | HIGH |
| saveVportPublicDetailsByActorId.controller.js | cards/settings/controller/ | UPSERT public_details | YES — assertActorOwnsVportActorController | MEDIUM |
| settingsSaveCoordinator | cards/settings/controller/settingsCoordinator.controller.js | UPSERT (orchestrated) | YES — delegates to saveVportPublicDetailsByActorId | MEDIUM |
| vportLeads.controller.js (write path) | cards/leads/controller/ | UPDATE lead status | YES — assertActorOwnsVportActorController | MEDIUM |
| addPortfolioMediaWithRecord.controller.js | cards/portfolio/controller/ | INSERT portfolio media record | YES — assertActorOwnsVportActorController | MEDIUM |
| publishFuelPriceUpdateAsPost.controller.js | cards/gasprices/controller/ | INSERT fuel price + post | YES — assertActorOwnsVportActorController | MEDIUM |
| reviewFuelPriceSuggestion.controller.js | cards/gasprices/controller/ | UPDATE submission status | YES — assertActorOwnsVportActorController | MEDIUM |
| updateStationFuelUnit.controller.js | cards/gasprices/controller/ | UPDATE station settings | YES — assertActorOwnsVportActorController | MEDIUM |
| submitFuelPriceSuggestion.controller.js | cards/gasprices/controller/ | INSERT submission | YES — authenticated citizen check | MEDIUM |
| vportTeam.controller.js (remove/invite) | cards/team/controller/ | UPDATE/DELETE resource (staff) | YES — assertActorOwnsVportActorController | MEDIUM |
| vportTeamInvite.controller.js (accept/decline) | cards/team/controller/ | UPDATE resource (meta.status) | YES — assertActorOwnsVportActorController (dual-path ELEK-002 hardened) | MEDIUM |
| scheduleBookingCoordinator.controller.js | cards/schedule/controller/ | COORDINATION → INSERT/UPDATE booking | YES — coordinator delegates to booking card (TICKET-0004 resolved) | MEDIUM |
| saveFlyerPublicDetailsCtrl | flyerBuilder/controller/flyerEditor.controller.js | UPDATE flyer details | YES — requireOwnerActorAccess (actor_owners DB) | MEDIUM |
| uploadFlyerImageCtrl | flyerBuilder/controller/flyerEditor.controller.js | STORAGE write + media_assets record | YES — requireOwnerActorAccess | MEDIUM |
| designStudio controllers (write) | flyerBuilder/designStudio/controller/ | INSERT/UPDATE design scene | YES — requireOwnerActorAccess | LOW |
| calendar adapter workflow | cards/calendar/ | Availability/resources write delegation + optional feed publish | YES — delegated to booking/profile adapters; UI gate in dashboard | MEDIUM |
| exchange adapter workflow | cards/exchange/ | Rate save + optional feed publish | YES — delegated to profile adapters; UI gate in dashboard | MEDIUM |
| locksmith adapter workflow | cards/locksmith/ | Service area add/update/delete + feed publish | YES — delegated to profile adapters; UI gate in dashboard | MEDIUM |
| reviews adapter workflow | cards/reviews/ | Review management in owner mode | PARTIAL — dashboard passes mode; reviews adapter owns enforcement | MEDIUM |
| services adapter workflow | cards/services/ | Service catalog owner editing | YES — dashboard gates before `allowOwnerEditing` | MEDIUM |
| portfolioMediaRecord.write.dal.js (direct) | cards/portfolio/dal/ | MEDIA_WRITE — exported via Rule 9 violating index | PARTIAL — exported at card boundary; caller context determines gate | HIGH (Rule 9) |
| vportFuelPrices.write.dal.js (direct) | cards/gasprices/dal/ | WRITE — exported via Rule 9 violating index | PARTIAL — exported at card boundary; no ownership enforcement at DAL | HIGH (Rule 9) |
| vportLeads.write.dal.js (direct) | cards/leads/dal/ | WRITE — exported via Rule 9 violating index | PARTIAL — exported at card boundary; no ownership enforcement at DAL | HIGH (Rule 9) |

## Security-Sensitive Surface Map

| Surface | Source Path | Sensitivity | Evidence |
|---|---|---|---|
| createVportPublicBookingController | cards/bookings/controller/vportPublicBooking.controller.js | HIGH | VPD-V-019: customer_actor_id always set from requestActorId; VPD-V-020: linkPath=null to prevent raw UUID in notifications |
| insertVportBooking.write.dal.js | cards/bookings/dal/ | HIGH | WRITE_COLS whitelist enforced; 23505 slot-collision guard; no caller-injectable columns |
| vportTeamInvite.controller.js (declineTeamRequestController) | cards/team/controller/ | HIGH | ELEK-002 hardened: dual-path ownership; string equality alone rejected; DB assertActorOwnsVportActorController required on barber path |
| acceptBarbershopInviteController | cards/team/controller/ | HIGH | VPD-V-008: callerActorId required; invite state validated (pending_acceptance only) before ownership check |
| saveVportPublicDetailsByActorId.controller.js | cards/settings/controller/ | MEDIUM | Ownership verified before profile read; requestActorId mandatory |
| requireOwnerActorAccess (designStudio.shared.controller.js) | flyerBuilder/designStudio/controller/ | MEDIUM | actor_owners DB lookup via auth userId; not booking adapter path |
| gasprices/index.js | cards/gasprices/ | HIGH | Rule 9 violation — write DALs exported at card boundary; no ownership gate at DAL layer |
| leads/index.js | cards/leads/ | HIGH | Rule 9 violation — write DALs exported at card boundary |
| portfolio/index.js | cards/portfolio/ | MEDIUM | Rule 9 violation — write DAL exported at card boundary |
| useQuickBookingModal.js | cards/bookings/hooks/ | MEDIUM | Bypasses profiles adapter — imports profiles controller directly |
| useVportOwnership.js | vport/hooks/ | LOW | UI convenience only — explicitly documents it is NOT the security boundary |

## Open Tickets / Deferred Items

| Item | Status | Priority |
|---|---|---|
| TICKET-BOOKING-RPC-001 — typed state-machine RPC migration | OPEN / DB-BLOCKED | P1 |
| DEFER-DASH-001 — useVportOwnerSchedule.js hook split | OPEN | P1 |
| Rule 9 remediation — gasprices/leads/portfolio card indexes | OPEN — needs SENTRY | P1 |
| Adapter boundary violation — useQuickBookingModal profiles import | OPEN | P2 |
| Adapter boundary violation — useVportPortfolioProbe portfolio/setup import | OPEN | P2 |
| Duplicate model files (buildDashboardCards, dashboardViewByVportType) | OPEN | P2 |
| Full VENOM+ELEKTRA pass — settings post TICKET-0009 | PENDING | P1 |
| Flyer builder VENOM reclassification | PENDING | P2 |
| IRONMAN formal ownership audit | NOT RUN | P2 |
| SPIDER-MAN full test coverage pass | NOT RUN | P2 |
| KRAVEN performance audit | NOT RUN | P3 |

## Runtime Risk Summary

Dashboard is the largest owner-facing feature in VCSM (242+ files, 26 controllers, 34 DALs, 28 hooks, 23 models, 79 components, 12 tests). All dashboard routes are OWNER-protected. The Architecture Contract (TICKET-0004) and coordinator pattern are established. Primary active risks are: (1) Rule 9 drift in 3 card indexes exposing write DALs without ownership enforcement; (2) DEFER-DASH-001 — overloaded schedule hook; (3) TICKET-BOOKING-RPC-001 DB-blocked booking mutation hardening; (4) two adapter boundary violations bypassing feature contracts. Security posture is strong at controller level but has gaps at public card index boundaries.

## Recommended Next Command

SENTRY — Fix Rule 9 violations in gasprices/index.js, leads/index.js, and portfolio/index.js (P1). Then VENOM full pass on settings card post TICKET-0009.
