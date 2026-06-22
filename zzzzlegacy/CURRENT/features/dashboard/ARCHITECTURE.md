---
# dashboard — ARCHITECTURE.md
# Last Updated: 2026-06-04
# Status: CURRENT SOURCE OF TRUTH — updated by TICKET-DASHBOARD-MODULE-PROMOTION-0002
# Ticket: TICKET-DASHBOARD-MODULE-PROMOTION-0002

## Feature Overview

The dashboard feature is the owner-only VPORT management surface in VCSM. It is organized as a card system where each card is a vertically-isolated module with its own controller, DAL, hooks, model, screen, and component layers. Access to every dashboard route requires ownership verification via `assertActorOwnsVportActorController` through the booking adapter. The feature also contains two major sub-systems: `flyerBuilder` (flyer design and print) and `qrcode` (QR generation and display). Additionally, there is a public booking surface (`vportPublicBooking.controller.js`) within the bookings card that allows unauthenticated or authenticated citizens to book appointments.

**Source Path:** apps/VCSM/src/features/dashboard/
**Engine Path:** None — feature-only (cross-feature deps via adapters only — see Cross-Feature Dependencies)

---

## Dashboard Module Rule

If a dashboard card has any hook, controller, DAL, write path, ownership gate, engine dependency, adapter workflow, security finding, data mutation, or user workflow, the card is governed as a first-class dashboard module.

TICKET-DASHBOARD-MODULE-PROMOTION-0002 promotes the adapter-backed dashboard cards `calendar`, `exchange`, `locksmith`, `reviews`, and `services` from card-only coverage into first-class dashboard modules. No adapter-backed workflow may remain outside dashboard governance coverage.

## Dashboard Module Inventory

Updated module count: **17 dashboard modules total**.

| Tier | Modules | Count | Governance Meaning |
|---|---|---:|---|
| Tier 1 — Security Critical | flyerBuilder, designStudio, vportOwnerStats, bookings, team, settings, leads | 7 | Must carry ARCHITECTURE, VENOM, ELEKTRA, BLACKWIDOW, THOR, BEHAVIOR.md, and SPIDER-MAN coverage. |
| Tier 2 — Operational | portfolio, schedule, gas prices | 3 | Must carry operational architecture/security/test coverage because each has mutations, write surfaces, or owner workflows. |
| Tier 3 — Newly Promoted Modules | calendar, exchange, locksmith, reviews, services | 5 | Adapter-backed owner workflows promoted by TICKET-DASHBOARD-MODULE-PROMOTION-0002. |
| Tier 4 — Read Only | qrcode, shared | 2 | Read-only/shared modules; security triad is not applicable unless behavior changes. |

### Promoted Module Architecture Map

| Module | Source Path | Local Layers | Adapter Workflow | Ownership Gate | Classification |
|---|---|---|---|---|---|
| calendar | `apps/VCSM/src/features/dashboard/vport/dashboard/cards/calendar/` | Screen + index | booking adapter availability/resource hooks; profile feed publish adapters | `useVportOwnership` UI gate; authoritative writes delegated to adapters | DASHBOARD_MODULE |
| exchange | `apps/VCSM/src/features/dashboard/vport/dashboard/cards/exchange/` | Screen + index | profile rate view/editor/save/publish adapters | `useVportOwnership` UI gate; authoritative writes delegated to profile adapters | DASHBOARD_MODULE |
| locksmith | `apps/VCSM/src/features/dashboard/vport/dashboard/cards/locksmith/` | Screen + components + index | locksmith profile owner/read/publish adapters | `useVportOwnership` UI gate; authoritative writes delegated to profile adapters | DASHBOARD_MODULE |
| reviews | `apps/VCSM/src/features/dashboard/vport/dashboard/cards/reviews/` | Screen + index | reviews view adapter with owner/public mode | `useVportOwnership` mode gate; adapter owns review action authorization | DASHBOARD_MODULE |
| services | `apps/VCSM/src/features/dashboard/vport/dashboard/cards/services/` | Screen + index | service catalog view/edit adapter | `useVportOwnership` gate before `allowOwnerEditing` | DASHBOARD_MODULE |

---

## Layer Presence

| Layer | Present | Path |
|---|---|---|
| Controllers | YES | vport/controller/, vport/dashboard/cards/*/controller/, flyerBuilder/controller/, flyerBuilder/designStudio/controller/ |
| DALs | YES | vport/dal/read/, vport/dal/write/, vport/dashboard/cards/*/dal/, flyerBuilder/dal/, flyerBuilder/designStudio/dal/ |
| Models | YES | vport/model/, vport/screens/model/, vport/dashboard/cards/*/model/, flyerBuilder/model/, flyerBuilder/designStudio/model/ |
| Hooks | YES | vport/hooks/, vport/dashboard/cards/*/hooks/, flyerBuilder/hooks/, flyerBuilder/designStudio/hooks/ |
| Screens | YES | vport/screens/, vport/dashboard/cards/*/screens/ (or root card jsx), flyerBuilder/screens/, flyerBuilder/designStudio/screens/ |
| Components | YES | vport/components/, vport/dashboard/cards/*/components/, flyerBuilder/components/, flyerBuilder/designStudio/components/, qrcode/components/, dashboard/shared/components/ |
| Adapters | YES | vport/adapters/vport.adapter.js, qrcode/adapters/qrcode.adapter.js, portfolio/adapters/portfolioTrace.adapter.js |
| Engine controllers | NO | None |
| Engine DALs | NO | None |

---

## Active Controllers

| Controller | Purpose | Auth Gate |
|---|---|---|
| checkVportOwnership.controller.js | UI visibility gate — checks if caller owns target VPORT | `assertActorOwnsVportActorController` (booking adapter) |
| vportOwnerStats.controller.js (loadOwnerQuickStatsController) | Load today/upcoming booking counts and active barbers | actorId required; reads from `resources` + `bookings` |
| createOwnerBooking.controller.js | Owner creates a confirmed booking for a resource | `assertActorOwnsVportActorController` |
| vportPublicBooking.controller.js (createVportPublicBookingController) | Public/citizen booking creation | Actor kind check (must be user-kind); past-time guard; service label server-side resolution |
| vportPublicBooking.controller.js (listVportBookingResourcesController) | List bookable resources for a VPORT actor | actorId required |
| vportPublicBooking.controller.js (getVportResourceAvailabilityController) | Fetch availability rules + bookings in range | resourceId required |
| updateVportBooking.controller.js | Owner updates a booking status | `assertActorOwnsVportActorController` |
| loadDaySchedule.controller.js | Load day's schedule for owner | `assertActorOwnsVportActorController` |
| scheduleBookingCoordinator.controller.js | Coordinator — delegates schedule mutations to bookings card boundary | Via coordinator (TICKET-0004 resolved) |
| saveVportPublicDetailsByActorId.controller.js | Save VPORT public details (address, hours, contact) | `assertActorOwnsVportActorController` |
| settingsCoordinator.controller.js (settingsSaveCoordinator) | Orchestrate settings validation + save workflow | Delegates ownership check to saveVportPublicDetailsByActorId |
| getVportGasPrices.controller.js | Load gas prices + community submissions | actorId required; no ownership gate (read-only, public data possible) |
| submitFuelPriceSuggestion.controller.js | Route gas submit payload to owner update or citizen suggestion controller | Guarded by actor/fuel/profile validation |
| submitOwnerFuelPriceUpdate.controller.js | Owner updates official fuel price | `checkVportOwnershipController` |
| submitCitizenFuelPriceSuggestion.controller.js | Authenticated citizen submits pending fuel suggestion | Authenticated actor required; fuel/price/duplicate guards |
| reviewFuelPriceSuggestion.controller.js | Owner reviews a pending suggestion | `assertActorOwnsVportActorController` |
| publishFuelPriceUpdateAsPost.controller.js | Publish gas price update as a platform post | `assertActorOwnsVportActorController` |
| updateStationFuelUnit.controller.js | Update fuel unit setting for station | `assertActorOwnsVportActorController` |
| vportLeads.controller.js | List and manage leads | `assertActorOwnsVportActorController` |
| addPortfolioMediaWithRecord.controller.js | Add portfolio media + media asset record | `assertActorOwnsVportActorController` |
| probeVportPortfolio.controller.js | Probe portfolio data for owner | actorId required |
| vportTeam.controller.js | Team operations (remove member, etc.) | `assertActorOwnsVportActorController` |
| vportTeamAccess.controller.js | Team access check | `assertActorOwnsVportActorController` |
| vportTeamInvite.controller.js | Accept/decline team invites, barber join flow | `assertActorOwnsVportActorController` (dual-path: owner + invited barber) |
| flyerEditor.controller.js (uploadFlyerImageCtrl) | Upload flyer image to storage | media adapter + `requireOwnerActorAccess` |
| flyerEditor.controller.js (saveFlyerPublicDetailsCtrl) | Save flyer public details | `requireOwnerActorAccess` (actor_owners via DB) |
| designStudio.controller.js | Design studio session management | `requireOwnerActorAccess` |
| designStudio.load.controller.js | Load design studio scene | `requireOwnerActorAccess` |
| designStudio.pages.controller.js | Design studio page operations | `requireOwnerActorAccess` |
| designStudio.assetsExports.controller.js | Export design studio assets | `requireOwnerActorAccess` |
| designStudio.shared.controller.js (requireOwnerActorAccess) | Shared auth gate — verifies actor_owners via DB | `actor_owners` DB lookup via auth + actorId |

**Note:** `designStudio.shared.controller.js` is a shared gate used across all design studio controllers — it does NOT use the booking adapter; instead it queries `actor_owners` directly through its own DAL stack.

---

## Active DALs

| DAL | Tables | Notes |
|---|---|---|
| actorVport.read.dal.js | `vc.actors` | Reads actor kind + vport_id link |
| actorOwners.read.dal.js | `vc.actor_owners` | Reads owner relationships |
| vportProfile.read.dal.js | `vport.profiles` | Profile by actorId, profileId by actorId, actorId by profileId |
| vportResource.read.dal.js | `vport.resources` | Resource by id, list by profileId |
| vportResource.write.dal.js | `vport.resources` | Update resource |
| vportAvailabilityRules.read.dal.js | `vport.availability_rules` | Rules by resourceId, rules by resourceIds |
| vportBookingsInRange.read.dal.js | `vport.bookings` | Bookings in date range for resourceId |
| vportBookingById.read.dal.js | `vport.bookings` | Single booking by id |
| listVportBookingsForProfileDay.read.dal.js | `vport.bookings` | Bookings for a profile day (resourceIds + range) |
| vportCities.read.dal.js | `vport.cities` (or equivalent) | Resolve city by name/state/country |
| vportServices.read.dal.js | `vport.services` | Service by id |
| vportProfileActorAccess.read.dal.js | `vport.profiles` + `vc.actor_owners` | Profile actor access check |
| insertVportBooking.write.dal.js | `vport.bookings` | Insert booking; column whitelist enforced; 23505 collision guard |
| updateVportBooking.write.dal.js | `vport.bookings` | Update booking status/fields |
| vportPublicDetails.write.dal.js | `vport.public_details` | Upsert public details |
| vportFuelPrices.read.dal.js | `vport.fuel_prices` (or station_prices) | Read official fuel prices |
| vportFuelPrices.write.dal.js | `vport.fuel_prices` | Write fuel prices |
| vportFuelPriceHistory.write.dal.js | `vport.fuel_price_history` | Write fuel price history |
| vportFuelPricePost.read.dal.js | `vport.fuel_price_posts` | Read fuel price post records |
| vportFuelPriceReviews.write.dal.js | `vport.fuel_price_reviews` | Write fuel price reviews |
| vportFuelPriceSubmissions.read.dal.js | `vport.fuel_price_submissions` | Read pending submissions |
| vportFuelPriceSubmissions.write.dal.js | `vport.fuel_price_submissions` | Write/update submissions |
| vportStationPriceSettings.read.dal.js | `vport.station_price_settings` | Read station display settings |
| vportLeads.read.dal.js | `vport.leads` | Read leads list |
| vportLeads.write.dal.js | `vport.leads` | Update lead status |
| portfolioMediaRecord.write.dal.js | `vport.portfolio_media` (or platform.media_assets) | Write portfolio media record |
| vportTeam.read.dal.js | `vport.resources` (staff) | Read team members |
| vportTeam.write.dal.js | `vport.resources` (staff) | Update team member records |
| vportTeamInvite.read.dal.js | `vport.resources` (pending_acceptance) | Read pending team requests |
| vportTeamInvite.write.dal.js | `vport.resources` | Accept/decline team requests |
| flyer.write.dal.js | `vport.flyer_details` or `vport.public_details` | Save flyer public details |
| designStudio.auth.dal.js | `auth.uid()` | Read authenticated user id |
| designStudio.read.dal.js | `vc.actor_owners` + design tables | Read studio scene, actor owner row |
| designStudio.write.dal.js | `vport.design_scenes` (or equivalent) | Write design studio scene |

---

## Active Hooks

| Hook | What it Calls | Purpose |
|---|---|---|
| useVportOwnership.js | `checkVportOwnershipController` | UI ownership gate — re-checks on window focus/visibility |
| useOwnerQuickStats.js | `loadOwnerQuickStatsController` | Owner dashboard quick stats (today/upcoming/barbers) |
| useVportBookingActions.js | booking controllers (via bookings card boundary) | VPORT owner booking action dispatchers |
| useVportBookingOps.js | booking controllers + DALs | Booking operations (create, update, cancel) |
| useQuickBookingModal.js | `getVportServicesController` (profiles adapter) | Quick-booking modal state + service fetch |
| useVportOwnerSchedule.js | `loadDayScheduleController`, `scheduleBookingCoordinator` | Schedule view state management — OVERLOADED (DEFER-DASH-001) |
| useVportGasPrices.js | `getVportGasPricesController` | Load gas prices + community suggestions |
| useSubmitFuelPriceSuggestion.js | `submitFuelPriceSuggestionController` | Submit community fuel price |
| useOwnerPendingSuggestions.js | `reviewFuelPriceSuggestionController` | Owner reviews pending suggestions |
| useSubmitBulkFuelPrices.js | `publishFuelPriceUpdateAsPost` | Bulk fuel price submit + post |
| useGasUnitToggle.js | `updateStationFuelUnitController` | Toggle fuel unit display setting |
| useAfterSubmitSuggestion.js | gas price invalidation | Post-submit side effects |
| useUpdateStationFuelUnit.js | `updateStationFuelUnitController` | Station unit update |
| useVportLeads.js | `vportLeadsController` | List and manage leads |
| useVportNewLeadsCount.js | `vportLeadsController` | Unread leads count badge |
| useVportPortfolioProbe.js | `probeVportPortfolioController` | Portfolio probe for owner |
| usePortfolioItemSubmit.js | `addPortfolioMediaWithRecordController` | Portfolio item submission flow |
| usePortfolioMediaUpload.js | `@media` hook (`useMediaUpload`) | Portfolio media upload wrapper |
| useSaveVportSettings.js | `settingsSaveCoordinator`, `useProfilesOps` (profiles adapter) | Settings save workflow + cache invalidation |
| useSaveVportPublicDetailsByActorId.js | `saveVportPublicDetailsByActorIdController`, `useProfilesOps` | Save VPORT public details |
| useVportTeam.js | `vportTeamController` | Team member list + remove |
| useVportTeamAccess.js | `vportTeamAccessController` | Team access check |
| useBarberTeamRequests.js | `vportTeamInviteController` | Pending team requests for barber |
| useFlyerEditor.js | `uploadFlyerImageCtrl`, `saveFlyerPublicDetailsCtrl` | Flyer editor state + persistence |
| useDesignStudio.js | `designStudioController` | Design studio session |
| useDesignStudioExports.js | `designStudioAssetsExportsController` | Export design assets |
| useDesignStudioSceneActions.js | `designStudio.pages.controller` | Scene page manipulation |
| useCanvasInteraction.js | canvas math utils | Canvas interaction state |

---

## Engine Dependencies

None — dashboard uses no `engines/` imports. Cross-feature access is routed through adapter boundaries within `apps/VCSM/src/features/`.

---

## Cross-Feature Dependencies

| Feature | What is Imported | Direction | Boundary Respected |
|---|---|---|---|
| booking | `assertActorOwnsVportActorController`, `getActorByIdDAL`, `useOwnerBookingResources`, `useBookingHistory` | dashboard → booking | YES — via `booking.adapter.js` |
| notifications | `publishVcsmNotificationBatch`, `publishVcsmNotification` | dashboard → notifications | YES — via `notifications.adapter.js` |
| media (`@media`) | `uploadMediaController`, `useMediaUpload` | dashboard → media | YES — via `@media` alias (adapter) |
| media (feature) | `createMediaAssetController`, `resolveVcsmAppId` | dashboard → media | YES — via `media.adapter.js`, `mediaAppId.adapter.js` |
| profiles | `useVportDashboardDetails`, `useProfilesOps`, `VportRatesView`, `VportRateEditorCard`, `useUpsertVportRate`, `usePublishExchangeRatePost`, `mapVportRateRow`, `usePublishBarbershopHoursPost`, `usePublishLocksmithPost`, `useLocksmithProfile`, `useLocksmithOwner` | dashboard → profiles | YES — via `profiles.adapter.js` and kind-specific adapters |
| settings | `settings-modern.css`, `Card.adapter`, `VportAboutDetails.view.adapter`, `useVportDirectoryVisibility`, `useVportBusinessCardSettings`, `useResolvedVportId` | dashboard → settings | YES — via `settings/adapters/` |
| portfolio | `portfolioTraceStore` | dashboard → portfolio | RESOLVED — accessed through `@/features/portfolio/adapters/portfolioTrace.adapter` |
| profiles (internal) | `getVportServicesController` | useQuickBookingModal → profiles (internal path) | VIOLATION — direct import from `@/features/profiles/kinds/vport/controller/services/` (not via adapter) |

**Known Boundary Violations:**
1. `useQuickBookingModal.js` imports `getVportServicesController` directly from `@/features/profiles/kinds/vport/controller/services/getVportServices.controller` — bypasses profiles adapter.
2. `useVportPortfolioProbe.js` accesses portfolio trace state through `@/features/portfolio/adapters/portfolioTrace.adapter` — RESOLVED 2026-06-04.

---

## Authorization Pattern

Dashboard uses a two-tier ownership model:

**Tier 1 — UI Gate (hooks layer):**
`useVportOwnership` calls `checkVportOwnershipController` to derive `isOwner` flag. This controls UI visibility only and re-verifies on window focus and visibility change. The hook comment explicitly states: "All privileged mutations MUST independently verify ownership through controller-layer actor_owners checks."

**Tier 2 — Controller Enforcement (security boundary):**
All mutating controllers call `assertActorOwnsVportActorController({ requestActorId, targetActorId })` from `@/features/booking/adapters/booking.adapter`. This performs a DB-level `actor_owners` check before any write proceeds.

**Design Studio exception:** `requireOwnerActorAccess` in `designStudio.shared.controller.js` verifies ownership by calling `dalReadActorOwnerRow({ actorId, userId })` directly through its own DAL stack (not the booking adapter). This is a documented intentional deviation.

**Public booking surface:** `createVportPublicBookingController` does not require the caller to be an owner — it verifies the caller is a `user`-kind actor (not vport) and performs a past-time guard. Guest/walk-in bookings with `requestActorId = null` are explicitly supported.

---

## Module Independence Classification

**DEPENDENT**

The dashboard feature has deep structural dependencies on the booking, notifications, media, profiles, and settings features accessed via their public adapters. This is architecturally intentional — the dashboard orchestrates across the platform's domain services. The portfolio setup trace import violation is resolved through `portfolioTrace.adapter.js`; remaining adapter concerns should be tracked per module.

---

## Architecture State

**EVOLVING**

The dashboard architecture is actively mature but has several open compliance items:
- Rule 9 violations: `gasprices/index.js`, `leads/index.js`, and `portfolio/index.js` were patched; these public card indexes no longer export write DALs.
- `useVportOwnerSchedule.js` is overloaded (DEFER-DASH-001 open).
- Duplicate model files between `vport/model/` and `vport/screens/model/` (3 files duplicated: `buildDashboardCards.model.js`, `dashboardViewByVportType.model.js`).
- Two adapter boundary violations identified.
- TICKET-BOOKING-RPC-001 is resolved as RLS-only booking policy hardening; direct reschedule field updates remain a source/product caution.
- Newly promoted adapter-backed modules (`calendar`, `exchange`, `locksmith`, `reviews`, `services`) now have dashboard governance status but still need BEHAVIOR.md and SPIDER-MAN coverage.

---

## Known Structural Risks

1. **Rule 9 violations — gasprices, leads, portfolio cards:** RESOLVED 2026-06-04. Public `index.js` files no longer export write DALs/controllers.
2. **DEFER-DASH-001 — useVportOwnerSchedule.js overloaded:** Hook manages both schedule loading and booking mutation coordination. Should be split into `useVportScheduleView` (read) and `useScheduleBookingActions` (write). Low operational risk today but violates Rule 6 (hooks must not own business workflows across multiple domains).
3. **Duplicate model files:** `buildDashboardCards.model.js` and `dashboardViewByVportType.model.js` exist in both `vport/model/` and `vport/screens/model/`. One set is dead code — unclear which is canonical. Risk: stale model being imported.
4. **Adapter boundary violation — profiles internal import:** `useQuickBookingModal.js` bypasses `profiles.adapter` and imports directly from `@/features/profiles/kinds/vport/controller/services/`.
5. **Adapter boundary violation — portfolio setup import:** RESOLVED 2026-06-04. `useVportPortfolioProbe.js` imports trace helpers from `@/features/portfolio/adapters/portfolioTrace.adapter`.
6. **TICKET-BOOKING-RPC-001 (RESOLVED / RLS LIVE VERIFIED):** Broad authenticated booking UPDATE was removed and replaced with narrow RLS policies plus column-level UPDATE grants. `customer_actor_id` injection + status overpermission are DB-hardened without SECURITY DEFINER functions or RPCs. Direct reschedule field updates are intentionally not DB-granted by this RLS-only design; `scheduleBookingCoordinator.controller.js` needs SPIDER-MAN coverage and product/source follow-up if owner reschedule remains required.
7. **VENOM full pass pending:** Settings card security (TICKET-0009 resolved but full VENOM+ELEKTRA post-ticket pass not complete). Flyer builder VENOM reclassification pending.

---

## Module Completeness Matrix

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Source scan + DR.STRANGE.md + ARCHITECTURE.md | Owner-only VPORT management surface |
| Owner defined | PARTIAL | OWNERSHIP.md exists; formal IRONMAN audit not run | Inferred from architecture evidence; 10+ cards UNKNOWN confidence |
| Entry points mapped | PASS | VportDashboardScreen.jsx confirmed; 12+ sub-routes mapped | — |
| Controllers present | PASS | 26 controllers across 9 card domains + flyerBuilder + designStudio | — |
| DAL/repository present | PASS | 34 DAL files; explicit column selects enforced; WRITE_COLS whitelists used | Rule 9 violations in 3 card indexes (see risks) |
| Models/transformers | PASS | 23 model files across all card domains | Duplicate models in vport/model/ vs vport/screens/model/ — needs dedup |
| Hooks/view models | PASS | 28 hooks mapped; all call controllers (not DALs directly) | DEFER-DASH-001 — useVportOwnerSchedule overloaded |
| Screens/components | PASS | 23 screens + 79 components; Final/View split present in larger cards | — |
| Authorization path mapped | PASS | Tier-1 (UI hook) + Tier-2 (controller assertActorOwnsVportActorController) pattern confirmed across all mutating controllers | Design studio uses alternate gate (not booking adapter) — intentional |
| Engine dependencies mapped | PASS (N/A) | No engine imports found | Feature uses cross-feature adapters only |
| Tests/validation noted | PARTIAL | 12 test files found; scheduleBookingCoordinator covered; bookings controller covered; gasprices controller covered; 10+ cards not tested | SPIDER-MAN full pass not run; settingsCoordinator coverage unknown |

---

## Recommended Handoffs

- **SENTRY:** Continue remaining non-Rule-9 architecture audits; gasprices/index.js, leads/index.js, and portfolio/index.js Rule 9 are patched. Gas Final/View split, submit path split, and cache service ownership are resolved.
- **VENOM:** Full settings + flyer builder security pass post TICKET-0009. Verify dashboard-wide ownership gate consistency.
- **IRONMAN:** Formal ownership audit — 10+ cards have UNKNOWN confidence.
- **SPIDER-MAN:** Test coverage sweep — promoted modules calendar/exchange/locksmith/reviews/services have zero dashboard-local tests.
- **CARNAGE:** TICKET-BOOKING-RPC-001 when DB migration becomes unblocked.

---

## Final Module Status

**MOSTLY_COMPLETE**

The dashboard has a well-established architecture with ownership enforcement, coordinator pattern, and comprehensive layering. Open items (Rule 9 violations, duplicate models, adapter boundary violations, pending security passes) prevent COMPLETE status.

---

## ARCHITECT Run Record
- Date: 2026-06-02
- Ticket: ARCHITECT-DASHBOARD-0002
- Architecture State: EVOLVING
- Promotion Date: 2026-06-04
- Promotion Ticket: TICKET-DASHBOARD-MODULE-PROMOTION-0002
- Promotion Verdict: calendar, exchange, locksmith, reviews, services are first-class dashboard modules
