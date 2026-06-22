# VCSM VPORT Business Pipeline

## 1. Architecture Overview

VPORT is VCSM's business-actor system. It spans:

- VPORT creation and core records under `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/vport`
- public/profile rendering under `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport`
- owner management through VPORT profile tabs, dashboards, and settings

VPORT behavior is actor-first:

- a VPORT is a `vc.actors.kind='vport'` actor
- public business presentation comes from `vc.vports` and `vc.vport_public_details`
- owner-only capabilities are unlocked when `viewerActorId === profileActorId`

The profile screen dynamically changes tabs by VPORT type, so barber, locksmith, restaurant, gas station, and other businesses share the same actor framework but get different public modules.

## 2. Entry Screens and User Flows

Primary entry points:

- create VPORT: `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/vport/CreateVportForm.jsx`
- VPORT profile route: `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx`
- VPORT kind wrapper: `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileKindScreen.jsx`

Major public/owner modules used by the VPORT screen:

- services: `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport/screens/services/view/VportServicesView.jsx`
- portfolio: `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport/screens/portfolio/view/VportPortfolioView.jsx`
- reviews: `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport/screens/review/VportReviewsView.jsx`
- menu: `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport/screens/menu/VportMenuView.jsx`
- gas prices: `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport/screens/gas/view/VportGasPricesView.jsx`
- booking tab wrapper: `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport/screens/views/tabs/VportBookingView.jsx`
- owner tools: `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport/screens/owner/VportOwnerView.jsx`
- rates: `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport/screens/rates/view/VportRatesView.jsx`

## 3. Database Schema Authority

### Core business identity

- `vc.vports`
  - canonical VPORT rows (legacy; still active)
- `vc.actors`
  - actor wrapper for VPORT identity
- `vc.actor_owners`
  - actor ownership linkage

### Public business details

- `vc.vport_public_details`
  - public contact, booking, flyer, brand, and misc details

### Services

- `vc.vport_service_catalog`
  - type-based canonical service catalog
- `vc.vport_services`
  - actor-specific enabled/disabled service overrides
- `vc.vport_service_addons`
  - actor-specific add-on rows

### Reviews

- `vc.vport_reviews`
- `vc.vport_review_ratings`

RPCs:

- `get_vport_review_form_config`
- `get_vport_official_stats`

### Menu

- `vc.vport_actor_menu_categories`
- `vc.vport_actor_menu_items`

### Gas

- `vc.vport_fuel_prices`
- `vc.vport_fuel_price_submissions`
- `vc.vport_station_price_settings`
- inferred write/review tables also exist from code paths:
  - `vc.vport_fuel_price_submission_reviews`

### Subscribers

RPCs:

- `count_subscribers`
- `list_subscribers`

The public subscriber concept ultimately derives from actor-follow relationships.

### Additional modules present in code

- inferred: `vc.vport_rates`
- booking integration reads/writes booking tables through the booking engine (see below)

### vport schema — Neutral Business Infrastructure

The `vport` schema is the modern layer for business-specific data. Used in parallel with `vc` tables, not as a replacement.

| Table | Purpose |
|---|---|
| `vport.profiles` | Business profile (parallel to vc.vports for new-model vports) |
| `vport.resources` | Booking calendars / staff members owned by a profile |
| `vport.bookings` | Appointment records for vport.resources |
| `vport.availability_rules` | Weekly availability rules for vport.resources |
| `vport.availability_exceptions` | Time blocks / closures for vport.resources |
| `vport.organizations` | Business org wrapper — groups locations under one vport |
| `vport.locations` | Physical or virtual locations under an org |
| `vport.qr_links` | QR scan entry points (slug → destination path) |
| `vport.resource_service_overrides` | Per-resource price/duration overrides |
| `vport.content_pages` | Owner-authored long-form content pages (draft/published) |

All `vport` schema reads/writes go through `vportClient` (Supabase client pre-scoped to the vport schema). The booking engine (`engines/booking/`) owns all DAL access to `vport.resources`, `vport.bookings`, `vport.availability_*`, `vport.organizations`, `vport.locations`, `vport.qr_links`, and `vport.resource_service_overrides`. Content pages are managed directly within the `apps/VCSM` content feature DALs.

## 4. Layer Stack

The VPORT feature is more modular than older VCSM areas:

```text
screen -> hook -> controller -> DAL -> model -> UI
```

Examples:

- public details:
  - `useVportPublicDetails` -> `getVportPublicDetailsController` -> `vportPublicDetails.read.dal`
- services:
  - `useVportServices` -> `getVportServicesController` -> services DALs
- reviews:
  - `useVportReviews` -> `VportReviews.controller` -> review DALs
- menu:
  - `useVportActorMenu` -> `getVportActorMenuController` -> menu DALs
- gas:
  - `useVportGasPrices` -> `getVportGasPricesController` -> gas DALs

This is one of the cleaner feature areas in the repo.

## 5. Pipeline 1: Create VPORT

Entry:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/vport/CreateVportForm.jsx`

Runtime:

```text
CreateVportForm
  -> optional avatar upload to upload endpoint
  -> createVport({ name, avatarUrl, bio, vportType })
  -> vc.create_vport RPC via vport.core.dal.js
  -> optional upsert selected services
  -> navigate to /profile/:actorId
```

Core create layer:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/vport/dal/vport.core.dal.js`

Observed behavior:

- `createVport()` requires an authenticated user
- writes through RPC `vc.create_vport`
- returns both `vport_id` and `actor_id`
- the form can immediately persist selected services after creation

## 6. Pipeline 2: Public VPORT Profile Load

Main screen:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx`

Runtime shape:

```text
VportProfileViewScreen
  -> useProfileGate()
  -> useProfileView()
  -> useBlockStatus()
  -> useVportPublicDetails()
  -> determine effective tabs by vportType and ownership
  -> render services / portfolio / reviews / menu / gas / booking / owner / rates
```

Public details controller:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport/controller/getVportPublicDetails.controller.js`

DAL:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/dal/vportPublicDetails.read.dal.js`

That DAL reads:

- `vc.actors`
- joined `vc.vports`
- joined `vc.vport_public_details`

## 7. Pipeline 3: Services

Public/owner services screen:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport/screens/services/view/VportServicesView.jsx`

Controller:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport/controller/services/getVportServices.controller.js`

DALs:

- `readVportTypeByActorId`
- `readVportServiceCatalogByType`
- `readVportServicesByActor`
- `readVportServiceAddonsByActor`

Service authority split:

- `vc.vport_service_catalog` is the business-type baseline
- `vc.vport_services` is the actor-specific override layer

Owner editing rules:

- owner UI only turns on when `allowOwnerEditing` is true and the viewer owns the VPORT
- owner saves go through `useUpsertVportServices`, which writes `vc.vport_services`

This makes services one of the cleanest business modules in the app.

## 8. Pipeline 4: Reviews

Public and owner review screen:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport/screens/review/VportReviewsView.jsx`

Controller owner:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport/controller/review/VportReviews.controller.js`

Read path:

- `dalGetVportReviewFormConfig()` -> RPC `get_vport_review_form_config`
- `dalGetVportOfficialStats()` -> RPC `get_vport_official_stats`
- `dalListVportReviews()` -> `vc.vport_reviews`
- `dalListVportReviewRatingsByReviewIds()` -> `vc.vport_review_ratings`

Write path:

- insert/update body in `vc.vport_reviews`
- upsert dimension ratings in `vc.vport_review_ratings`

Business rules:

- cannot review self
- review target must be a non-void VPORT actor
- dimensions can come from DB config or fallback type config
- review author is restricted to `identity.kind === 'user'` in the view layer

## 9. Pipeline 5: Menu

Menu controller:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport/controller/menu/getVportActorMenu.controller.js`

Menu DALs:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport/dal/menu/listVportActorMenuCategories.dal.js`
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport/dal/menu/listVportActorMenuItems.dal.js`

Public/owner split:

- public view shows read-only menu
- owner view exposes manage panels, category/item mutations, and QR entry

Menu tables:

- `vc.vport_actor_menu_categories`
- `vc.vport_actor_menu_items`

Media handling:

- menu item forms upload images to R2/Cloudflare through `uploadToCloudflare` and `buildR2Key`

QR behavior:

- owner manage header links to `/vport/:actorId/menu/qr`

## 10. Pipeline 6: Gas Prices

Public gas screen:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport/screens/gas/view/VportGasPricesView.jsx`

Controller:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport/controller/gas/getVportGasPrices.controller.js`

DALs:

- `fetchVportFuelPricesDAL()` -> `vc.vport_fuel_prices`
- `fetchPendingFuelPriceSubmissionsDAL()` -> `vc.vport_fuel_price_submissions`
- `fetchVportStationPriceSettingsDAL()` -> `vc.vport_station_price_settings`

Behavior:

- official prices come from `vc.vport_fuel_prices`
- community suggestions come from pending submissions
- controller keeps only the latest pending suggestion per fuel key
- public submission goes through `useSubmitFuelPriceSuggestion`
- owner review flows exist for approving/rejecting submissions

## 11. Pipeline 7: Subscribers

Subscriber controller:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport/controller/subscribers/getSubscribers.controller.js`

Data source:

- RPC `count_subscribers`
- RPC `list_subscribers`

Public screen:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport/screens/views/tabs/VportSubscribersView.jsx`

This is a VPORT-flavored read model over the actor follow graph.

## 12. Pipeline 8: Booking and Rates Integration

The booking tab delegates into the shared booking engine (`engines/booking/`). The engine is fully extracted with 27 controllers, 23 DAL files. All active booking tables are in the `vport` schema: `vport.bookings`, `vport.resources`, `vport.availability_rules`, `vport.availability_exceptions`, `vport.service_booking_profiles`. The legacy dual-schema routing concept (vc resources → vc.booking_*) does not exist in the live database.

Relevant integrations from the VPORT profile:

- `VportBookingView` (tab) → `VportBookingView` (screen) → `useVportBookingView` + `useVportBookingMutations` → booking engine controllers
- rates tab delegates into VPORT rates hooks/controllers
- owner booking flows can search/select subscribers as customers
- `resolveBookingContext({ profileId, resourceId?, locationId?, serviceId? })` resolves the correct resource/location/pricing context for a given profile in three modes: `selected_resource`, `any_available`, `primary_calendar`

Canonical booking engine documentation: `zNOTFORPRODUCTION/_CANONICAL/logan/engines/BOOKING_ENGINE_AUDIT_V1.md`
Canonical booking pipeline documentation: `zNOTFORPRODUCTION/logan/vcsm/booking/vcsm.booking.pipeline.md`

## 13. Business Actor vs Citizen Actor Behavior

### Identity effects

- VPORTs are separate actors, not alternate skins on the user actor
- `viewerActorId === profileActorId` enables owner mode in the profile screen
- switching from citizen to VPORT changes:
  - available tabs
  - owner-only edit controls
  - chat/inbox persona
  - business-facing booking/service actions

### Review author rule

- VPORT reviews are composed as customer feedback, so the public review form only enables composition when `identity.kind === 'user'`

### Subscribers

- VPORT subscriber counts are actor-based and therefore change when the active actor changes

## 14. Key Files Reference

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/vport/CreateVportForm.jsx` — create-VPORT form and initial service selection.
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/vport/dal/vport.core.dal.js` — core create/read/update DAL.
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx` — main public/owner VPORT screen.
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/dal/vportPublicDetails.read.dal.js` — public details read.
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport/controller/services/getVportServices.controller.js` — services orchestration.
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport/controller/review/VportReviews.controller.js` — review orchestration.
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport/controller/menu/getVportActorMenu.controller.js` — menu orchestration.
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport/controller/gas/getVportGasPrices.controller.js` — gas prices orchestration.

## 15. Weak Spots / Risks

1. VPORT spans multiple roots (`features/vport`, `features/profiles/kinds/vport`, dashboard/settings/booking integrations), so ownership is distributed.
2. Business logic is clean inside each module, but the overall VPORT system is broad and easy to fragment.
3. Booking and rates integrations are only partially visible from the profile boundary and need their own docs.
4. Some VPORT functionality depends on RPCs (`create_vport`, review stats/config, subscribers), so DB-side behavior matters a lot.
5. Owner behavior is inferred from `viewerActorId === profileActorId`; if identity drift occurs, owner UI can disappear even when backend ownership is still valid.

## Tab Layouts by VPORT Type

Tab configuration defined in `features/profiles/config/profileTabs.config.js`.
Type → layout mapping in `features/profiles/kinds/vport/model/gas/getVportTabsByType.model.js`.

### Barber / Locksmith (`VPORT_BARBER_TABS`)
Portfolio → Calendar → Services → Reviews → Content → About → Photos → Vibes → Subscribers

### Beauty & Wellness (`VPORT_SERVICE_TABS`)
Portfolio → Services → Reviews → Content → About → Vibes → Photos → Subscribers

### Food / Restaurant / Hospitality (`VPORT_FOOD_TABS`)
Menu → Reviews → Content → About → Services → Photos → Vibes → Subscribers
*(Portfolio excluded — restaurants don't showcase portfolio work)*

### Gas Station (`VPORT_GAS_TABS`)
Gas → Services → Content → About → Reviews → Photos → Vibes → Subscribers

### Exchange (`VPORT_RATES_TABS`)
Rates → Services → Content → Reviews → About → Photos → Vibes → Subscribers

### Other / Default (`VPORT_TABS`)
About → Reviews → Content → Vibes → Photos → Subscribers
*(Basic tabs only — no Portfolio, no Services, no Calendar)*

### Portfolio Inclusion Rules
- **Included:** barber, locksmith, beauty & wellness, salon, spa (work-showcase types)
- **Excluded:** restaurant, food, gas station, exchange, default/other
- Owner tab injected dynamically when `viewerActorId === profileActorId`

---

## 16. Final Judgment

The VPORT system is one of the stronger architectural areas in VCSM:

- cleanly layered: mostly yes
- hybrid: yes, because it spans multiple feature roots and integrates with booking/settings/upload
- tightly coupled: moderately
- duplicated: relatively low
- actor-pure: yes
- migration-ready: better than most VCSM features, but still needs follow-up docs for booking, upload/media, and dashboard owner flows

---

## Change Log

### 2026-04-10 03:20 AM
- Task: Remove Portfolio from food/restaurant and default/other tab layouts
- Code Status Before: MINOR DRIFT — doc described tab system but did not list per-layout tabs
- Summary: Removed `PORTFOLIO` from `VPORT_FOOD_TABS` (restaurants don't showcase portfolio work). Stripped `VPORT_TABS` (default/other) to basic tabs only (About, Reviews, Vibes, Photos, Subscribers). Added "Tab Layouts by VPORT Type" reference section to this document.
- Files Changed:
  - `apps/VCSM/src/features/profiles/config/profileTabs.config.js`
- Validation:
  - Restaurant VPORT no longer shows Portfolio tab
  - Default/Other VPORT shows only basic tabs
  - Barber/locksmith/beauty still have Portfolio
  - Gas/exchange unchanged (never had Portfolio)
  - `effectiveTabs` fallback logic handles removed tabs gracefully

### 2026-04-10 04:00 AM
- Task: Reuse Photos tab ImageViewerModal inside Portfolio
- Code Status Before: MAJOR DRIFT — Portfolio had its own inline PortfolioDetailModal, different from Photos' ImageViewerModal
- Summary: Removed custom `PortfolioDetailModal` from VportPortfolioView. Portfolio now imports and uses `ImageViewerModal` from the Photos tab. Portfolio item media converted to `{url, type}` shape via `toViewerImages()`. Clicking a portfolio image opens the same full-screen snap-scroll viewer used by Photos. Tag filter chips updated to purple theme tokens. Empty/loading/error states use `--vc-*` tokens.
- Files Changed:
  - `apps/VCSM/src/features/profiles/kinds/vport/screens/portfolio/view/VportPortfolioView.jsx`
- Validation:
  - Portfolio click opens identical viewer as Photos tab
  - `PortfolioDetailModal` fully removed (0 grep matches)
  - Portfolio grid cards, tag filtering, load-more preserved
  - Empty state works for VPORTs with no portfolio items
  - Photos tab behavior unchanged

### 2026-04-10 05:30 AM
- Task: Fix Portfolio viewer trapped inside card stacking context on iOS + fix ImageViewerModal close button and image sizing
- Code Status Before: MAJOR DRIFT — Portfolio ImageViewerModal rendered inside `.profiles-card` div which has `backdrop-filter` and `overflow` creating a stacking context on iOS. Modal appeared inside the tab card instead of fullscreen. Close button unresponsive on iOS due to scroll container swallowing touch events.
- Summary:
  - **VportPortfolioView.jsx**: Moved `ImageViewerModal` render from inside the `.profiles-card` div to a React fragment sibling (`<>...</>`) — same pattern Photos uses in `PhotoGrid`. This breaks the iOS stacking context trap and lets the modal go truly fullscreen.
  - **ImageViewerModal.jsx**: Complete rewrite of the viewer layout.
    - Close button: own overlay layer at `z-index: 100` with `pointer-events-none` parent + `pointer-events-auto` on button. Both `onClick` and `onTouchEnd` with `preventDefault` + `stopPropagation`. 44px tap target, frosted glass style.
    - Image sizing: `max-h-full max-w-full object-contain` (fills viewport while maintaining aspect ratio).
    - Single image: no scroll container, just centered flex.
    - Multi-image: snap scroll preserved.
    - Backdrop: solid `rgba(0,0,0,0.92)` — darker, more immersive.
    - Background tap closes viewer, image tap does NOT close (stopPropagation on img).
    - Reaction sidebar: only renders when `canAct` (has `activePostId`). Portfolio passes null, so no sidebar. Photos passes post ID, so sidebar shows.
    - Reaction sidebar styling: inline dark frosted glass, proper z-index layering.
- Files Changed:
  - `apps/VCSM/src/features/profiles/kinds/vport/screens/portfolio/view/VportPortfolioView.jsx`
  - `apps/VCSM/src/features/profiles/screens/views/tabs/photos/components/ImageViewerModal.jsx`
- Validation:
  - Portfolio images open fullscreen (not trapped in card)
  - Photos images open fullscreen with reaction sidebar
  - Close button works on iOS (touch + click)
  - Image fills viewport properly
  - No reaction strip on Portfolio (canAct = false)
  - Reaction strip present on Photos (canAct = true)
  - Background tap closes both Photos and Portfolio viewers
  - Keyboard nav (arrows + escape) still works

### 2026-04-26

Task: Documentation drift resolution — code review + Logan sync
Code Status Before: MAJOR DRIFT — Section 3 listed only vc schema tables (entire vport schema missing), Section 12 described booking as opaque integration seam, Tab Layouts section missing Content tab from all 6 layouts
Summary:
- Section 3: Added full vport schema block listing vport.profiles, vport.resources, vport.bookings, vport.availability_rules, vport.availability_exceptions, vport.organizations, vport.locations, vport.qr_links, vport.resource_service_overrides, vport.content_pages with ownership notes.
- Section 12: Replaced opaque "integration seam" description with reference to the extracted booking engine (engines/booking/), its capabilities, and canonical documentation links.
- Tab Layouts: Added Content tab to all 6 layouts (VPORT_BARBER_TABS, VPORT_SERVICE_TABS, VPORT_FOOD_TABS, VPORT_GAS_TABS, VPORT_RATES_TABS, VPORT_TABS).
Files Changed: zNOTFORPRODUCTION/logan/vports/vcsm.vport.business-pipeline.md
Validation: vport schema tables confirmed via live RLS migration files and booking engine DAL files. Tab layouts confirmed against profileTabs.config.js. Content tab schema confirmed as vport.content_pages via listVportContentPages.dal.js.

### iOS Stacking Context Rule (Learned)
On iOS Safari, `position: fixed` elements inside a parent that has ANY of these properties get trapped:
- `backdrop-filter` / `-webkit-backdrop-filter`
- `transform` (including `translateZ(0)`)
- `filter`
- `will-change: transform`
- `overflow: hidden` with border-radius

**Rule:** Never render `position: fixed` modals inside styled card containers. Always render them as siblings at the component root level via React fragments.

### 2026-05-03

**Task:** Fix VPORT Dashboard Leads "permission denied for table business_card_leads"

**Root cause:**
The `vport.business_card_leads` table was created by migration `20260425013000_vport_business_card_and_leads.sql` on 2026-04-25, after the bulk GRANT migration (2026-04-19). It was never included in that bulk grants run.

Result: the `authenticated` role had no table-level GRANT, so every query from the DAL returned `permission denied for table business_card_leads` even though RLS policies existed and were correct.

**RLS Policy State (confirmed live — 5 policies present):**
| Policy | Operation | Role |
|---|---|---|
| `business_card_leads_owner_select` | SELECT | authenticated |
| `business_card_leads_owner_update` | UPDATE | authenticated |
| `business_card_leads_owner_delete` | DELETE | authenticated |
| `business_card_leads_insert_anon` | INSERT | anon |
| `business_card_leads_insert_authenticated` | INSERT | authenticated |

The `all_rls_policies.csv` snapshot was stale and showed zero rows for this table — policies were confirmed live via direct DB inspection.

**Fix applied (DB — executed by user):**
```sql
GRANT SELECT ON vport.business_card_leads TO authenticated;
GRANT UPDATE ON vport.business_card_leads TO authenticated;
GRANT DELETE ON vport.business_card_leads TO authenticated;
```
No INSERT grant needed — INSERT uses the `submit_business_card_lead` SECURITY DEFINER RPC which bypasses RLS and doesn't require a direct table grant for the caller.

**DAL pattern note:**
`vportLeads.write.dal.js` uses direct `.update()` and `.delete()` (not RPCs) for mark-contacted and delete. The owner-scoped UPDATE/DELETE RLS policies accommodate this correctly since they restrict to `vport_profile_id` matching the authenticated user's actor → vport ownership chain.

**Code change (pre-approved):**
- `apps/VCSM/src/features/dashboard/vport/screens/VportDashboardLeadsScreen.jsx` — raw `{error}` string replaced with `import.meta.env.DEV ? error : "Unable to load leads right now."` for production-safe error display.

**Future note:** Any new table in the `vport` schema must receive an explicit `GRANT SELECT/INSERT/UPDATE/DELETE TO authenticated` (and/or `anon`) if it will be accessed outside of SECURITY DEFINER RPCs. Do not rely on bulk grant migrations automatically covering new tables.
