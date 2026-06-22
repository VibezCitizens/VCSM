# ARCH-BIDIR-001 — Bidirectional Dependency Decision Record

**Date:** 2026-06-06  
**Status:** ALL TICKETS CLOSED — 2026-06-07  
**Source data:** `apps/scanner/maps/dependency-map.json` (2026-06-05), `FEATURE_IMPORT_MAP.json`  
**Total pairs classified:** 15  
**Pairs safe as-is:** 8  
**Pairs requiring fix:** 5  
**Pairs requiring design decision (blocked on split tickets):** 1  
**Suspected scanner artifact:** 1  

---

## Classification Framework

Each pair is classified using exactly one of:

| Code | Meaning |
|---|---|
| `LEGITIMATE` | Intentional bidirectional coupling; both directions through adapters; safe to remain |
| `QUERY-INVALIDATION` | One direction fires an event that invalidates the other's cache; standard pattern; safe to remain |
| `UI-COMPOSITION` | One feature renders components owned by the other; both through adapters; safe to remain |
| `CSS-LEAK` | One direction imports another feature's stylesheet directly; wrong ownership; must fix |
| `SHARED-MODEL-LEAK` | One direction imports another feature's internal model; model belongs in `shared/`; must fix |
| `DAL-VIOLATION` | One direction imports another feature's DAL directly without adapter; must fix |
| `ADAPTER-MISSING` | Correct direction but hook/function not yet exposed via adapter; must add adapter export |
| `GAS-PRICES-SPLIT` | Gas prices logic is currently split across dashboard and profiles; neither can be fixed without ARCH-DASH-001 design decision |
| `SCANNER-ARTIFACT` | Alias resolution in scanner produced a false-positive edge; verify before any action |

---

## Layer Contract Verification

Before each classification, checked against the platform layer contract:

> **Controller** may decide.  
> **DAL** may execute.  
> **RLS** may enforce.  
> **No ownership decisions migrate into DAL while breaking cycles.**

Applied per pair: any import where a Controller is called from another feature's DAL, or a DAL is reached from outside its own feature's Controller, is flagged regardless of pair classification.

---

## Pair Classifications

---

### Pair 1 — ads ↔ settings

**Classification:** `CSS-LEAK` (ads→settings) / `LEGITIMATE` (settings→ads)

| Direction | Imports | Adapter? | Verdict |
|---|---|---|---|
| ads→settings | `ads/screens/VportAdsSettingsScreen.jsx` → `settings/styles/settings-modern.css` | NO | VIOLATION |
| settings→ads | `settings/vports/ui/VportsTab.view.jsx` → `ads/adapters/widgets/OnemoredaysAd.adapter` | YES | CLEAN |

**Root cause:** `settings-modern.css` is a page layout stylesheet containing CSS custom property assignments (`--settings-bg-a`, `--settings-surface`, etc.). It uses platform design tokens (`--vc-*`). It is not a settings-specific stylesheet — it is a shared page layout utility that was authored inside `settings/styles/` and leaked.

**Decision:** `settings-modern.css` → move to `shared/styles/settings-modern.css`. Update all importers.

**Can it remain?** NO.  
**Action:** `FIXABLE-SHARED` — move CSS file to `shared/styles/`, update import paths.  
**Risk:** LOW — CSS only, no behavior change.  
**Layer contract:** Not applicable (no Controller/DAL involved).  
**Blocks split tickets?** No.  
**Required file changes:** 2 (move 1 file, update 1 importer in this pair; other importers updated in Pairs 7 and 11).

---

### Pair 2 — auth ↔ legal

**Classification:** `LEGITIMATE`

| Direction | Imports | Adapter? | Verdict |
|---|---|---|---|
| auth→legal | `auth/hooks/useRegister.js` → `legal/adapters/legal.adapter` | YES | CLEAN |
| legal→auth | `legal/screens/ConsentGateScreen.jsx` → `auth/adapters/auth.adapter` | YES | CLEAN |
| legal→auth | `legal/screens/LegalDocumentScreen.jsx` → `auth/adapters/auth.adapter` | YES | CLEAN |

**Root cause:** Registration requires consent (auth uses legal). Legal screens gate on auth state (legal uses auth). This coupling is intentional at the platform level — auth and legal are platform primitives that must know about each other.

**Decision:** SAFE AS-IS.  
**Can it remain?** YES.  
**Action:** NONE.  
**Risk:** NONE — 0 violations; both directions at adapter boundary.  
**Layer contract:** Hooks and screens only; no Controller→DAL cross-feature calls.

---

### Pair 3 — block ↔ feed

**Classification:** `QUERY-INVALIDATION` + `UI-COMPOSITION`

| Direction | Imports | Adapter? | Verdict |
|---|---|---|---|
| block→feed | `block/hooks/useBlockActions.js` → `feed/adapters/feedCache.adapter` | YES | CLEAN |
| block→feed | `block/hooks/useBlockActorAction.js` → `feed/adapters/feedCache.adapter` | YES | CLEAN |
| feed→block | `feed/hooks/useCentralFeedActions.js` → `block/adapters/hooks/useBlockActorAction.adapter` | YES | CLEAN |

**Root cause:** Blocking an actor must invalidate the feed cache (block is the event source; feed exposes a cache adapter for this). Feed surfaces a block button (UI composition; uses the block action adapter).

**Decision:** SAFE AS-IS. Classic event-driven cache invalidation.  
**Can it remain?** YES.  
**Action:** NONE.  
**Risk:** NONE — 0 violations; both directions at adapter boundary.  
**Layer contract:** Hook-to-adapter only; no DAL or Controller cross-feature calls.

---

### Pair 4 — booking ↔ notifications

**Classification:** `LEGITIMATE` + `UI-COMPOSITION`

| Direction | Imports | Adapter? | Verdict |
|---|---|---|---|
| booking→notifications | `cancelBooking.controller.js` → `notifications/adapters/notifications.adapter` | YES | CLEAN |
| booking→notifications | `confirmBooking.controller.js` → `notifications/adapters/notifications.adapter` | YES | CLEAN |
| booking→notifications | `createBooking.controller.js` → `notifications/adapters/notifications.adapter` | YES | CLEAN |
| booking→notifications | `booking/setup.js` → `notifications/adapters/notifications.adapter` | YES | CLEAN |
| notifications→booking | `notifications/screen/hooks/useMyAppointments.js` → `booking/adapters/booking.adapter` | YES | CLEAN |

**Root cause:** Booking lifecycle events (create, confirm, cancel) dispatch notifications (booking is event source). The notifications screen includes an appointments view (UI composition — notification screen aggregates booking data).

**Decision:** SAFE AS-IS.  
**Can it remain?** YES.  
**Action:** NONE.  
**Risk:** NONE — 0 violations; both directions at adapter boundary.  
**Layer contract:** Controllers dispatch through notifications adapter (correct — Controller decides, DAL does not). No DAL-to-DAL cross calls.

---

### Pair 5 — dashboard ↔ profiles [CRITICAL]

**Classification:** `GAS-PRICES-SPLIT` + `ADAPTER-MISSING` + `DAL-VIOLATION`

This is the most complex pair in the codebase. There are 18 total violations across both directions. The violations cluster into three distinct problems with different fix complexity.

#### dashboard→profiles (34 imports, 11 violations)

| Source file | Target | Adapter? | Rule |
|---|---|---|---|
| `flyerBuilder/screens/VportActorMenuFlyerView.jsx` | `profiles/adapters/kinds/vport/hooks/useVportPublicDetails.adapter` | YES | CLEAN |
| `flyerBuilder/screens/VportActorMenuFlyerView.jsx` | `profiles/adapters/profiles.adapter` | YES | CLEAN |
| `cards/bookings/hooks/useQuickBookingModal.js` | `profiles/kinds/vport/controller/services/getVportServices.controller` | **NO** | `ADAPTER-MISSING` |
| `cards/calendar/VportDashboardCalendarScreen.jsx` | `profiles/adapters/kinds/vport/vportProfiles.adapter` | YES | CLEAN |
| `cards/exchange/VportDashboardExchangeScreen.jsx` | `profiles/adapters/kinds/vport/screens/rates/view/VportRatesView.adapter` | YES | CLEAN |
| `cards/exchange/VportDashboardExchangeScreen.jsx` | `profiles/adapters/kinds/vport/screens/rates/components/VportRateEditorCard.adapter` | YES | CLEAN |
| `cards/exchange/VportDashboardExchangeScreen.jsx` | `profiles/adapters/kinds/vport/hooks/rates/useUpsertVportRate.adapter` | YES | CLEAN |
| `cards/exchange/VportDashboardExchangeScreen.jsx` | `profiles/adapters/kinds/vport/exchange.adapter` | YES | CLEAN |
| `cards/gasprices/__tests__/…test.js` | `profiles/kinds/vport/dal/services/resolveVportProfileId.dal` | **NO** | `DAL-VIOLATION` |
| `cards/gasprices/controller/submitFuelPriceSuggestion.controller.js` | `profiles/kinds/vport/dal/services/resolveVportProfileId.dal` | **NO** | `DAL-VIOLATION` |
| `cards/gasprices/dal/vportFuelPriceHistory.write.dal.js` | `profiles/kinds/vport/dal/services/resolveVportProfileId.dal` | **NO** | `DAL-VIOLATION` |
| `cards/gasprices/dal/vportFuelPriceSubmissions.read.dal.js` | `profiles/kinds/vport/dal/services/resolveVportProfileId.dal` | **NO** | `DAL-VIOLATION` |
| `cards/gasprices/dal/vportFuelPriceSubmissions.write.dal.js` | `profiles/kinds/vport/dal/services/resolveVportProfileId.dal` | **NO** | `DAL-VIOLATION` |
| `cards/gasprices/dal/vportFuelPrices.read.dal.js` | `profiles/kinds/vport/dal/services/resolveVportProfileId.dal` | **NO** | `DAL-VIOLATION` |
| `cards/gasprices/dal/vportFuelPrices.write.dal.js` | `profiles/kinds/vport/dal/services/resolveVportProfileId.dal` | **NO** | `DAL-VIOLATION` |
| `cards/gasprices/dal/vportStationPriceSettings.read.dal.js` | `profiles/kinds/vport/dal/services/resolveVportProfileId.dal` | **NO** | `DAL-VIOLATION` |
| `cards/locksmith/VportDashboardLocksmithScreen.jsx` | `profiles/adapters/kinds/vport/vportProfiles.adapter` | YES | CLEAN |
| `cards/portfolio/VportDashboardPortfolioScreen.jsx` | `profiles/adapters/kinds/vport/vportProfiles.adapter` | YES | CLEAN |
| `cards/portfolio/hooks/usePortfolioItemSubmit.js` | `profiles/kinds/vport/controller/locksmith/locksmithOwner.controller` | **NO** | `ADAPTER-MISSING` |
| `cards/portfolio/hooks/usePortfolioItemSubmit.js` | `profiles/kinds/vport/controller/locksmith/publishLocksmithPortfolioUpdateAsPost.controller` | **NO** | `ADAPTER-MISSING` |
| `cards/reviews/VportDashboardReviewScreen.jsx` | `profiles/adapters/kinds/vport/screens/review/VportReviewsView.adapter` | YES | CLEAN |
| `cards/services/VportDashboardServicesScreen.jsx` | `profiles/adapters/kinds/vport/screens/services/view/VportServicesView.adapter` | YES | CLEAN |
| `cards/settings/VportSettingsScreen.jsx` | `profiles/adapters/kinds/vport/hooks/useVportPublicDetails.adapter` | YES | CLEAN |
| `cards/settings/VportSettingsScreen.jsx` | `profiles/adapters/profiles.adapter` | YES | CLEAN |
| `cards/settings/hooks/useSaveVportPublicDetailsByActorId.js` | `profiles/adapters/profiles.adapter` | YES | CLEAN |
| `cards/settings/hooks/useSaveVportSettings.js` | `profiles/adapters/profiles.adapter` | YES | CLEAN |
| `model/dashboardViewByVportType.model.js` | `profiles/adapters/kinds/vport/config/vportTypes.config.adapter` | YES | CLEAN |
| `screens/VportDashboardScreen.jsx` | `profiles/adapters/kinds/vport/hooks/useVportPublicDetails.adapter` | YES | CLEAN |
| `screens/VportDashboardScreen.jsx` | `profiles/adapters/profiles.adapter` | YES | CLEAN |

**dashboard→profiles violation analysis:**

**Problem A — DAL-to-DAL: `resolveVportProfileId.dal` (8 imports)**  
`resolveVportProfileId` resolves a `vport.profiles.id` from an `actor_id`. Dashboard gas price DAL files call it to get the profile ID before their own DB writes. The function is in `profiles/kinds/vport/dal/` and dashboard is calling it directly — DAL importing from another feature's DAL, skipping the adapter boundary.  
*Layer contract violation:* DAL may execute, but it must not call another feature's DAL directly. Ownership decisions (profile ID resolution) may not migrate into the caller's DAL without breaking the cycle.  
**Fix:** Expose `resolveVportProfileId` via `profiles/adapters/` (add one adapter export). Dashboard gas price DALs import the adapter. No behavior change.

**Problem B — Controller import without adapter: `getVportServices.controller` (1 import)**  
`useQuickBookingModal.js` in dashboard calls `getVportServices.controller` directly from profiles internals. The controller resolves the vport service catalog.  
**Fix:** Add `getVportServices` to `profiles/adapters/kinds/vport/` adapter surface. Dashboard hook imports the adapter.

**Problem C — Controller import without adapter: locksmith controllers (2 imports)**  
`usePortfolioItemSubmit.js` calls `locksmithOwner.controller` and `publishLocksmithPortfolioUpdateAsPost.controller` directly. These are business logic controllers in profiles.  
**Fix:** Add locksmith controller exports to `profiles/adapters/kinds/vport/` adapter surface. Dashboard hook imports the adapters.

#### profiles→dashboard (13 imports, 7 violations)

| Source file | Target | Adapter? | Rule |
|---|---|---|---|
| `profiles/adapters/kinds/vport/hooks/gas/useOwnerPendingSuggestions.adapter.js` | `dashboard/vport/dashboard/cards/gasprices/hooks/useOwnerPendingSuggestions` | **NO** | `GAS-PRICES-SPLIT` |
| `profiles/adapters/kinds/vport/hooks/gas/useSubmitFuelPriceSuggestion.adapter.js` | `dashboard/vport/dashboard/cards/gasprices/hooks/useSubmitFuelPriceSuggestion` | **NO** | `GAS-PRICES-SPLIT` |
| `profiles/adapters/kinds/vport/hooks/gas/useVportGasPrices.adapter.js` | `dashboard/vport/dashboard/cards/gasprices/hooks/useVportGasPrices` | **NO** | `GAS-PRICES-SPLIT` |
| `profiles/adapters/kinds/vport/ownership.adapter.js` | `dashboard/vport/controller/checkVportOwnership.controller` | **NO** | `GAS-PRICES-SPLIT` |
| `profiles/adapters/kinds/vport/screens/gas/components/GasPricesPanel.adapter.js` | `dashboard/vport/dashboard/cards/gasprices/components/GasPricesPanel` | **NO** | `GAS-PRICES-SPLIT` |
| `profiles/adapters/kinds/vport/screens/gas/components/GasStates.adapter.js` | `dashboard/vport/dashboard/cards/gasprices/components/GasStates` | **NO** | `GAS-PRICES-SPLIT` |
| `profiles/adapters/kinds/vport/screens/gas/components/OwnerPendingSuggestionsList.adapter.js` | `dashboard/vport/dashboard/cards/gasprices/components/OwnerPendingSuggestionsList` | **NO** | `GAS-PRICES-SPLIT` |
| `profiles/kinds/vport/hooks/useVportOwnerQuickStats.js` | `dashboard/vport/adapters/vport.adapter` | YES | CLEAN |
| `profiles/kinds/vport/screens/barbershop/VportBarberShopBookingView.jsx` | `dashboard/vport/adapters/vport.adapter` | YES | CLEAN |
| `profiles/kinds/vport/screens/barbershop/VportBarberShopTeamView.jsx` | `dashboard/vport/adapters/vport.adapter` | YES | CLEAN |
| `profiles/kinds/vport/screens/booking/hooks/useVportPublicBooking.js` | `dashboard/vport/adapters/vport.adapter` | YES | CLEAN |
| `profiles/kinds/vport/screens/components/VportProfileTabContent.jsx` | `dashboard/vport/dashboard/cards/gasprices/screens/VportGasPricesView` | **NO** | `GAS-PRICES-SPLIT` |
| `profiles/screens/views/profileheader/VisibleQRCode.jsx` | `dashboard/qrcode/adapters/qrcode.adapter` | YES | CLEAN |

**profiles→dashboard violation analysis:**

All 7 violations are the same root cause: **gas prices UI is co-owned by both features.**

`dashboard/vport/dashboard/cards/gasprices/` owns gas price hooks, components, DAL, and the owner-facing view. `profiles/kinds/vport/` renders the gas price view in the public vport profile tab (`VportProfileTabContent.jsx`) and has profiles adapter files that are just thin re-exports pointing back into dashboard gas prices hooks and components.

This is a designed workaround — the public profile tab needs to show gas prices, but the gas prices logic lives in dashboard. The profiles adapter layer wraps dashboard internals rather than wrapping dashboard adapters, because dashboard hasn't exposed these hooks/components via `dashboard/vport/adapters/`.

Additionally, `checkVportOwnership.controller` is in dashboard but `profiles/adapters/kinds/vport/ownership.adapter.js` points directly at it. This controller belongs at the boundary between both features — it asserts that a caller owns a vport actor.

**Decision:** These violations CANNOT be fixed independently. They require a gas prices ownership decision from ARCH-DASH-001:

- **Option A:** Gas prices moves out of `dashboard/cards/gasprices/` and into a standalone `vportGasPrices/` feature. Both profiles and dashboard import from `vportGasPrices/adapters/`. Eliminates all 7 profiles→dashboard violations.
- **Option B:** Gas prices stays in dashboard, but `dashboard/vport/adapters/` exposes all hooks and components that profiles needs. `profiles/adapters/kinds/vport/hooks/gas/*.adapter.js` files re-export from `dashboard/adapters/` instead of from dashboard internals. `VportProfileTabContent.jsx` imports `VportGasPricesView` from `dashboard/adapters/`. `ownership.adapter.js` imports from `dashboard/vport/adapters/` instead of directly from the controller.

Option B is lower risk (no file moves). Option A is architecturally cleaner.

**Can profiles→dashboard violations be fixed now?** NO — blocked on ARCH-DASH-001 gas prices ownership decision.  
**Can dashboard→profiles violations be fixed now?** YES — Problems A, B, C above are simple adapter additions. They do not require the gas prices design decision.

**Pair 5 summary:**

| Sub-problem | Violations | Fixable now? | Action |
|---|---|---|---|
| dashboard DAL calling profiles DAL (resolveVportProfileId) | 8 | YES | Add adapter export in profiles, update 8 dashboard DAL files |
| dashboard hook calling profiles controller (getVportServices) | 1 | YES | Add adapter export in profiles, update 1 dashboard hook |
| dashboard hook calling profiles controllers (locksmith ×2) | 2 | YES | Add adapter exports in profiles, update 1 dashboard hook |
| profiles adapters wrapping dashboard gas prices internals | 7 | NO — ARCH-DASH-001 | Gas prices ownership decision required |

**Total pair 5 violations fixable now:** 11  
**Total pair 5 violations blocked:** 7  
**Risk (fixable now):** MEDIUM — adapter additions + 10 import path changes across gas price DAL files  
**Risk (blocked):** HIGH — gas prices redesign, see ARCH-DASH-001

---

### Pair 6 — dashboard ↔ public

**Classification:** `SHARED-MODEL-LEAK` (dashboard→public) / `UI-COMPOSITION` (public→dashboard)

| Direction | Source | Target | Adapter? | Verdict |
|---|---|---|---|---|
| dashboard→public | `cards/settings/components/VportSettingsBusinessCard.jsx` | `public/vportBusinessCard/model/businessCardSettings.model` | NO | VIOLATION |
| public→dashboard | `public/vportMenu/view/VportPublicMenuQrView.jsx` | `dashboard/qrcode/adapters/qrcode.adapter` | YES | CLEAN |
| public→dashboard | `public/vportMenu/view/VportPublicReviewsQrView.jsx` | `dashboard/qrcode/adapters/qrcode.adapter` | YES | CLEAN |

**Root cause:** `businessCardSettings.model.js` contains:
- `DEFAULT_BUSINESS_CARD_SETTINGS` — default field visibility config
- `TYPE_SECTION_OVERRIDES` — per-vport-type section defaults
- `deepMergeSettings()` — pure merge utility
- `getBusinessCardSettings()` — pure config resolver
- `getSectionToggles()` — UI toggle list by vport type

This is a **pure configuration model** with no side effects. It is consumed by:
1. `public/` (owns the business card render — the feature that defined the model)
2. `dashboard/cards/settings/` (dashboard settings card configures the card)
3. `settings/vports/hooks/useVportBusinessCardSettings.js` (settings hook applies the model when saving)

The model has three consumers from three different features. It does not belong to any one of them — it belongs in `shared/`.

**Decision:** Move `businessCardSettings.model.js` to `shared/lib/businessCard/businessCardSettings.model.js`. Update 3 importers.

**Can it remain?** NO — a model consumed by 3 features must live in `shared/`.  
**Action:** `FIXABLE-SHARED` — move model to `shared/lib/businessCard/`.  
**Risk:** LOW — pure model, no DB side effects, no React state.  
**Layer contract:** Not applicable (no Controller/DAL involved).  
**Required file changes:** 4 (1 move + 3 import path updates in dashboard, public, and settings).

---

### Pair 7 — dashboard ↔ settings

**Classification:** `CSS-LEAK` + `ADAPTER-MISSING` (dashboard→settings) / `UI-COMPOSITION` (settings→dashboard)

| Direction | Source | Target | Adapter? | Verdict |
|---|---|---|---|---|
| dashboard→settings | `cards/settings/VportSettingsScreen.jsx` | `settings/styles/settings-modern.css` | NO | CSS-LEAK |
| dashboard→settings | `cards/settings/VportSettingsScreen.jsx` | `settings/adapters/ui/Card.adapter` | YES | CLEAN |
| dashboard→settings | `cards/settings/VportSettingsScreen.jsx` | `settings/adapters/profile/ui/VportAboutDetails.view.adapter` | YES | CLEAN |
| dashboard→settings | `cards/settings/VportSettingsScreen.jsx` | `settings/vports/hooks/useVportDirectoryVisibility` | NO | ADAPTER-MISSING |
| dashboard→settings | `cards/settings/VportSettingsScreen.jsx` | `settings/vports/hooks/useVportBusinessCardSettings` | NO | ADAPTER-MISSING |
| dashboard→settings | `cards/settings/VportSettingsScreen.jsx` | `settings/vports/hooks/useResolvedVportId` | NO | ADAPTER-MISSING |
| dashboard→settings | `cards/settings/components/VportSettingsBusinessCard.jsx` | `settings/adapters/ui/Card.adapter` | YES | CLEAN |
| dashboard→settings | `cards/settings/components/VportSettingsTrazeCard.jsx` | `settings/adapters/ui/Card.adapter` | YES | CLEAN |
| settings→dashboard | `settings/vports/ui/VportsQrModal.jsx` | `dashboard/qrcode/adapters/qrcode.adapter` | YES | CLEAN |

**Root cause — CSS:** `settings-modern.css` is a shared stylesheet. Fix: same as Pair 1 and Pair 11 — move to `shared/styles/`.

**Root cause — 3 hooks:** `VportSettingsScreen.jsx` inside `dashboard/cards/settings/` renders the vport settings UI. It uses three hooks from `settings/vports/hooks/`:
- `useVportDirectoryVisibility` — toggle directory listing
- `useVportBusinessCardSettings` — manage business card display config
- `useResolvedVportId` — resolve profile ID from actor ID

These hooks are correct in settings (they orchestrate settings controllers). They are not yet exposed via `settings/adapters/`. Dashboard imports them directly into internals.

**Decision for hooks:** Add all three to `settings/adapters/vports.adapter.js` (or extend existing settings adapter). Dashboard imports from the adapter.

**Note:** A deeper architectural question exists — `VportSettingsScreen.jsx` is a settings interface embedded inside a dashboard card. This should be flagged for ARCH-DASH-001 consideration: the settings card in dashboard may eventually belong in the settings feature as a properly separated screen. The hook adapter fix resolves the boundary violation without prejudging that question.

**Can it remain?** NO for violations.  
**Action (CSS):** `FIXABLE-SHARED` — same move as Pairs 1, 11, 13.  
**Action (hooks):** `ADAPTER-MISSING` — add 3 adapter exports in `settings/adapters/`, update 1 dashboard screen.  
**Risk:** LOW — CSS only, plus 3 adapter additions with 1 import site.  
**Layer contract:** Hooks use controllers — no DAL cross-feature access. Clean.  
**Required file changes:** 5 (settings CSS import updated, 1 settings adapter file updated, 1 dashboard screen updated).

---

### Pair 8 — feed ↔ post

**Classification:** `UI-COMPOSITION` + `QUERY-INVALIDATION`

| Direction | Imports | Adapter? | Verdict |
|---|---|---|---|
| feed→post | `feed/hooks/useCentralFeedActions.js` → `post/adapters/postcard/hooks/useDeletePostAction.adapter` | YES | CLEAN |
| feed→post | `feed/screens/CentralFeedScreen.jsx` → `post/adapters/postCard.adapter` | YES | CLEAN |
| feed→post | `feed/screens/CentralFeedScreen.jsx` → `post/adapters/postcard/components/PostActionsMenu.adapter` | YES | CLEAN |
| feed→post | `feed/screens/CentralFeedScreen.jsx` → `post/adapters/postcard/components/ShareModal.adapter` | YES | CLEAN |
| post→feed | `post/screens/PostFeed.screen.jsx` → `feed/adapters/hooks/useFeed.adapter` | YES | CLEAN |

**Decision:** SAFE AS-IS. Feed is the container; post is the content. Feed renders post cards (UI composition). Post has its own feed view that uses the feed hook (expected — post screen has a full feed context).  
**Can it remain?** YES.  
**Action:** NONE.  
**Risk:** NONE.

---

### Pair 9 — feed ↔ social

**Classification:** `QUERY-INVALIDATION` + `UI-COMPOSITION`

| Direction | Imports | Adapter? | Verdict |
|---|---|---|---|
| feed→social | `useCentralFeedActions.js` → `social/adapters/friend/subscribe/hooks/useFollowActorToggle.adapter` | YES | CLEAN |
| feed→social | `useCentralFeedActions.js` → `social/adapters/friend/subscribe/hooks/useFollowStatus.adapter` | YES | CLEAN |
| social→feed | `followRequests.controller.js` → `feed/adapters/feedCache.adapter` | YES | CLEAN |
| social→feed | `follow.controller.js` → `feed/adapters/feedCache.adapter` | YES | CLEAN |
| social→feed | `unsubscribe.controller.js` → `feed/adapters/feedCache.adapter` | YES | CLEAN |
| social→feed | (+ 3 test files) → `feed/adapters/feedCache.adapter` | YES | CLEAN |

**Decision:** SAFE AS-IS. Social follow/unfollow controllers invalidate feed cache (social is the event source). Feed renders follow buttons in the feed action bar (UI composition, through social adapters).  
**Can it remain?** YES.  
**Action:** NONE.  
**Risk:** NONE.  
**Layer contract:** Social controllers call feed adapter (Controller dispatches through adapter boundary — correct).

---

### Pair 10 — notifications ↔ post

**Classification:** `LEGITIMATE` + `UI-COMPOSITION`

| Direction | Imports | Adapter? | Verdict |
|---|---|---|---|
| notifications→post | `NotiViewPostScreen.jsx` → `post/adapters/screens/PostDetail.view.adapter` | YES | CLEAN |
| post→notifications | `commentReactions.controller.js` → `notifications/adapters/notifications.adapter` | YES | CLEAN |
| post→notifications | `postComments.controller.js` → `notifications/adapters/notifications.adapter` | YES | CLEAN |
| post→notifications | `sendRose.controller.js` → `notifications/adapters/notifications.adapter` | YES | CLEAN |
| post→notifications | `togglePostReaction.controller.js` → `notifications/adapters/notifications.adapter` | YES | CLEAN |

**Decision:** SAFE AS-IS. Post controllers fire notifications (correct: Controller decides, dispatches through notifications adapter). Notification screen navigates to a post (UI composition, through post adapter).  
**Can it remain?** YES.  
**Action:** NONE.  
**Risk:** NONE.

---

### Pair 11 — notifications ↔ profiles

**Classification:** `CSS-LEAK` (notifications→profiles) / `LEGITIMATE` + `SCANNER-ARTIFACT` (profiles→notifications)

| Direction | Source | Target | Adapter? | Verdict |
|---|---|---|---|---|
| notifications→profiles | `NotificationsScreenView.jsx` | `profiles/styles/profiles-modern.css` | NO | CSS-LEAK |
| profiles→notifications | `VportReviews.controller.js` | `notifications/adapters/notifications.adapter` | YES | CLEAN |
| profiles→notifications | `useMenuItemPhotoUpload.js` | `notifications/runtime/index.js` | via `@media` alias | SCANNER-ARTIFACT |

**Root cause — CSS:** `profiles-modern.css` contains page layout CSS custom properties. `NotificationsScreenView.jsx` imports it directly for styling. Same class of error as Pairs 1 and 13.

**Root cause — scanner artifact:** The scanner resolves the `@media` import alias in `useMenuItemPhotoUpload.js` as pointing to `notifications/runtime/index.js`. When the file is read directly, it imports `{ useMediaUpload }` from `'@media'` — the media engine alias. The `@media` alias almost certainly resolves to `engines/media/` or a media engine module, not to the notifications runtime. This is a scanner alias resolution false positive.

**Action on artifact:** Verify the `@media` alias resolution in `vite.config.js` or `tsconfig.paths` before treating this as a violation. Do not count it in violation totals.

**Decision for CSS:** Move `profiles-modern.css` to `shared/styles/profiles-modern.css`. Update all importers (notifications + post + profiles itself if it self-imports).  
**Can it remain?** NO for CSS violation. Scanner artifact: pending verification.  
**Risk:** LOW (CSS only).  
**Layer contract:** `VportReviews.controller.js` dispatches notifications through adapter — correct.

---

### Pair 12 — notifications ↔ social

**Classification:** `LEGITIMATE` + `UI-COMPOSITION`

| Direction | Imports | Adapter? | Verdict |
|---|---|---|---|
| notifications→social | `useNotificationInbox.js` → `social/adapters/social.adapter` | YES | CLEAN |
| notifications→social | `FollowRequestItem.view.jsx` → `social/adapters/friend/request/hooks/useFollowRequestActions.adapter` | YES | CLEAN |
| social→notifications | `followRequests.controller.js` → `notifications/adapters/notifications.adapter` | YES | CLEAN |
| social→notifications | `follow.controller.js` → `notifications/adapters/notifications.adapter` | YES | CLEAN |
| social→notifications (+ 2 test files) | — | YES | CLEAN |

**Decision:** SAFE AS-IS. Social follow actions dispatch notifications (social is the event source). Follow request notification items render follow request actions (UI composition — the notification item itself has action buttons, sourced from the social adapter).  
**Can it remain?** YES.  
**Action:** NONE.  
**Risk:** NONE.

---

### Pair 13 — post ↔ profiles

**Classification:** `CSS-LEAK` (post→profiles) / `UI-COMPOSITION` (profiles→post)

| Direction | Source | Target | Adapter? | Verdict |
|---|---|---|---|---|
| post→profiles | `post/postcard/ui/EditPost.jsx` | `profiles/styles/profiles-modern.css` | NO | CSS-LEAK |
| post→profiles | `post/screens/PostDetail.view.jsx` | `profiles/styles/profiles-modern.css` | NO | CSS-LEAK |
| profiles→post | `profiles/adapters/ui/actorProfileScreenDependencies.adapter.js` | `post/adapters/postcard/components/ShareModal.adapter` | YES | CLEAN |
| profiles→post | (12 more post adapter imports) | post adapters | YES | CLEAN |

**Decision for CSS:** Same fix as Pair 11 — profiles-modern.css to `shared/styles/`. Update post importers.  
**Decision for profiles→post:** SAFE AS-IS. Profiles renders post cards in the actor profile screen (UI composition). All 14 imports through adapters.  
**Can CSS remain?** NO.  
**Action:** `FIXABLE-SHARED` — CSS move, update 2 post importers.  
**Risk:** LOW.  
**Layer contract:** No Controller/DAL cross calls in this pair.

---

### Pair 14 — profiles ↔ social

**Classification:** `DAL-VIOLATION` (profiles→social, 2 imports) + `UI-COMPOSITION` (social→profiles)

| Direction | Source | Target | Adapter? | Verdict |
|---|---|---|---|---|
| profiles→social | `getSubscribers.controller.js` | `social/privacy/dal/actorSignalVisibility.dal` | NO | DAL-VIOLATION |
| profiles→social | `getSubscribers.controller.test.js` | `social/privacy/dal/actorSignalVisibility.dal` | NO | DAL-VIOLATION |
| profiles→social | `profiles/dal/readActorProfile.dal.js` | `social/adapters/privacy/actorPrivacy.adapter` | YES | CLEAN |
| profiles→social | `profiles/hooks/useProfileGate.js` | `social/adapters/friend/subscribe/hooks/useFollowStatus.adapter` | YES | CLEAN |
| profiles→social | (7 more social adapter imports) | social adapters | YES | CLEAN |
| social→profiles | `social/components/PrivateProfileNotice.jsx` | `profiles/adapters/ui/PrivateProfileGate.adapter` | YES | CLEAN |

**Root cause:** `getSubscribersController` in profiles calls `dalCanViewActorSignal` directly from `social/privacy/dal/`. This function wraps the Supabase RPC `can_view_actor_signal` which checks if a viewer can see a target actor's follower count or follower list. The profiles subscriber screen uses this to gate the subscriber list display.

**Layer contract violation:** A profiles Controller (`getSubscribers.controller.js`) calls a social DAL (`actorSignalVisibility.dal`) directly. The DAL may execute, but it must not be called from another feature's Controller — it must be accessed through the owning feature's adapter boundary. This also bypasses RLS context: the DAL wraps a Supabase RPC which has its own enforcement, but the architectural contract requires the adapter layer to be the cross-feature interface.

**Decision:** Add `dalCanViewActorSignal` to `social/adapters/privacy/actorSignalVisibility.adapter.js`. Profiles controller imports from the adapter. No behavior change — the RPC call is the same.

**Can it remain?** NO.  
**Action:** `ADAPTER-MISSING` — add adapter export in `social/adapters/`, update 1 profiles controller + 1 test file.  
**Risk:** LOW — 1 controller + 1 test file; no behavior change; RPC is unchanged.  
**Layer contract:** After fix: profiles Controller → social Adapter → social DAL → Supabase RPC. Correct.  
**Required file changes:** 3 (1 new adapter file in social, 1 controller update in profiles, 1 test update).

---

### Pair 15 — settings ↔ vport

**Classification:** `LEGITIMATE`

| Direction | Imports | Adapter? | Verdict |
|---|---|---|---|
| settings→vport | `useVportAccountOps.js` → `vport/adapters/vport.public.adapter` | YES | CLEAN |
| settings→vport | `recordProfileMediaAsset.controller.js` → `vport/adapters/vport.adapter` | YES | CLEAN |
| settings→vport | `VportsCreateModal.jsx` → `vport/adapters/CreateVportForm.jsx.adapter` | YES | CLEAN |
| vport→settings | `vport/hooks/useRestoreVport.js` → `settings/adapters/settings.adapter` | YES | CLEAN |

**Decision:** SAFE AS-IS. Settings manages vport account operations and uses vport adapters. Creating/restoring a vport requires navigating to a settings flow (vport→settings). Both through adapters.  
**Can it remain?** YES.  
**Action:** NONE.  
**Risk:** NONE.

---

## Consolidated Decision Table

| # | Pair | Classification | Direction of Issue | Action | Risk | Blocks Split Tickets? |
|---|---|---|---|---|---|---|
| 1 | ads ↔ settings | CSS-LEAK | ads→settings | Move CSS to `shared/styles/` | LOW | NO |
| 2 | auth ↔ legal | LEGITIMATE | — | NONE | NONE | NO |
| 3 | block ↔ feed | QUERY-INVALIDATION | — | NONE | NONE | NO |
| 4 | booking ↔ notifications | LEGITIMATE | — | NONE | NONE | NO |
| 5a | dashboard ↔ profiles | DAL-VIOLATION + ADAPTER-MISSING | dashboard→profiles | Add 3 adapter exports in profiles | MEDIUM | YES — fix before split |
| 5b | dashboard ↔ profiles | GAS-PRICES-SPLIT | profiles→dashboard | Gas prices ownership decision required | HIGH | BLOCKED on ARCH-DASH-001 |
| 6 | dashboard ↔ public | SHARED-MODEL-LEAK | dashboard→public | Move model to `shared/lib/businessCard/` | LOW | NO |
| 7 | dashboard ↔ settings | CSS-LEAK + ADAPTER-MISSING | dashboard→settings | Move CSS; expose 3 hooks in settings adapter | LOW | NO |
| 8 | feed ↔ post | UI-COMPOSITION | — | NONE | NONE | NO |
| 9 | feed ↔ social | QUERY-INVALIDATION + UI-COMPOSITION | — | NONE | NONE | NO |
| 10 | notifications ↔ post | LEGITIMATE | — | NONE | NONE | NO |
| 11 | notifications ↔ profiles | CSS-LEAK + SCANNER-ARTIFACT | notifications→profiles | Move CSS; verify @media alias | LOW | NO |
| 12 | notifications ↔ social | LEGITIMATE | — | NONE | NONE | NO |
| 13 | post ↔ profiles | CSS-LEAK | post→profiles | Move CSS to `shared/styles/` | LOW | NO |
| 14 | profiles ↔ social | DAL-VIOLATION | profiles→social | Add adapter in social/adapters/privacy/ | LOW | NO |
| 15 | settings ↔ vport | LEGITIMATE | — | NONE | NONE | NO |

---

## Required Changes Count

| Category | Count | Risk |
|---|---|---|
| CSS files to move to `shared/styles/` | 2 files (`settings-modern.css`, `profiles-modern.css`) | LOW |
| CSS import sites to update | 5 files across ads, notifications, post ×2, dashboard | LOW |
| Adapter exports to add in `profiles/adapters/` | 4 (resolveVportProfileId, getVportServices, locksmithOwner, publishLocksmithPortfolioUpdate) | MEDIUM |
| Import sites updated in dashboard after profiles adapter additions | 10 (8 DAL files + 1 useQuickBookingModal + 1 usePortfolioItemSubmit) | MEDIUM |
| Adapter exports to add in `settings/adapters/` | 3 hooks (useVportDirectoryVisibility, useVportBusinessCardSettings, useResolvedVportId) | LOW |
| Import sites updated in dashboard after settings adapter additions | 1 (VportSettingsScreen.jsx) | LOW |
| Model to move to `shared/lib/businessCard/` | 1 model file | LOW |
| Import sites updated after model move | 3 (public, dashboard, settings) | LOW |
| Adapter to add in `social/adapters/privacy/` | 1 (actorSignalVisibility.adapter.js) | LOW |
| Import sites updated in profiles after social adapter addition | 2 (controller + test) | LOW |
| **Blocked — gas prices ownership decision** | **7 violations (profiles adapters wrapping dashboard internals)** | **HIGH** |
| **Scanner artifact to verify** | **1 (@media alias resolution)** | **LOW** |
| **Total fixable now** | **28 file changes** | — |
| **Total blocked** | **7 violations** | — |

---

## Dependency DAG After Remediation

```
Pairs that remain bidirectional (all through adapters — safe):
  auth       ↔  legal          [LEGITIMATE — platform primitives]
  block      ↔  feed           [QUERY-INVALIDATION — cache invalidation]
  booking    ↔  notifications  [LEGITIMATE — lifecycle events]
  dashboard  ↔  profiles       [LEGITIMATE — partial: gas prices still blocked]
  dashboard  ↔  settings       [UI-COMPOSITION — settings card in dashboard]
  feed       ↔  post           [UI-COMPOSITION — feed renders posts]
  feed       ↔  social         [QUERY-INVALIDATION + UI-COMPOSITION]
  notifications ↔ post        [LEGITIMATE — post events fire notifications]
  notifications ↔ social      [LEGITIMATE — follow events fire notifications]
  settings   ↔  vport          [LEGITIMATE — platform operations]

Pairs that become effectively unidirectional after remediation:
  ads        ↔  settings       → settings → ads  (ads was CSS-only, now removed)
  dashboard  ↔  public         → public → dashboard  (dashboard model moves to shared)
  notifications ↔ profiles    → profiles → notifications  (notifications was CSS-only)
  post       ↔  profiles       → profiles → post  (post was CSS-only)
  profiles   ↔  social         → profiles → social  (DAL violation fixed, becomes adapter)

Gas prices pair remains BIDIR until ARCH-DASH-001 decision:
  dashboard  ↔  profiles       [GAS-PRICES-SPLIT — 7 violations pending design decision]
```

---

## Recommended Order of Remediation

Ordered by risk (lowest first) and dependency (unblocked first).

### Group 1 — Shared CSS (no behavior risk, no imports to trace)

1. Create `shared/styles/settings-modern.css` — copy content from `settings/styles/settings-modern.css`
2. Create `shared/styles/profiles-modern.css` — copy content from `profiles/styles/profiles-modern.css`
3. Update CSS importers:
   - `ads/screens/VportAdsSettingsScreen.jsx` → `@/shared/styles/settings-modern.css`
   - `dashboard/vport/dashboard/cards/settings/VportSettingsScreen.jsx` → `@/shared/styles/settings-modern.css`
   - `notifications/screen/views/NotificationsScreenView.jsx` → `@/shared/styles/profiles-modern.css`
   - `post/postcard/ui/EditPost.jsx` → `@/shared/styles/profiles-modern.css`
   - `post/screens/PostDetail.view.jsx` → `@/shared/styles/profiles-modern.css`
4. Verify originals still imported by their own feature (keep or delete originals after confirming no other importers)

**Validation:** App loads; affected screens (ads settings, notifications, post detail, dashboard settings card) render correctly. No visual regression.

---

### Group 2 — Shared model move (no behavior risk, pure data)

5. Move `public/vportBusinessCard/model/businessCardSettings.model.js` → `shared/lib/businessCard/businessCardSettings.model.js`
6. Update importers:
   - `public/vportBusinessCard/` internal usages → new path
   - `dashboard/vport/dashboard/cards/settings/components/VportSettingsBusinessCard.jsx` → new path
   - `settings/vports/hooks/useVportBusinessCardSettings.js` → new path

**Validation:** Business card settings screen loads; vport-type section toggles render correctly; save/load cycle works.

---

### Group 3 — Social adapter addition (low risk, 1 new file, 2 import updates)

7. Create `social/adapters/privacy/actorSignalVisibility.adapter.js`:
   ```js
   export { dalCanViewActorSignal } from "@/features/social/privacy/dal/actorSignalVisibility.dal";
   ```
8. Update `profiles/kinds/vport/controller/subscribers/getSubscribers.controller.js` — import from new adapter
9. Update the test file to match

**Validation:** Vport subscriber list loads; privacy gating (follower count vs list) still enforced correctly.

---

### Group 4 — Settings hooks adapter additions (low risk, existing adapter extended)

10. Add to `settings/adapters/` (or create `settings/adapters/vports.adapter.js`):
    - Export `useVportDirectoryVisibility`
    - Export `useVportBusinessCardSettings`
    - Export `useResolvedVportId`
11. Update `dashboard/vport/dashboard/cards/settings/VportSettingsScreen.jsx` — import all 3 hooks from settings adapter

**Validation:** Dashboard settings card loads; directory visibility toggle works; business card settings persist; vport ID resolution succeeds on mount.

---

### Group 5 — Profiles adapter additions for dashboard DAL violations (medium risk, 10 import sites)

12. Add to `profiles/adapters/kinds/vport/` (or extend an existing adapter file):
    - Export `resolveVportProfileId`
    - Export `getVportServicesController`
    - Export `locksmithOwnerController`
    - Export `publishLocksmithPortfolioUpdateAsPostController`
13. Update 8 dashboard gas price DAL files to import `resolveVportProfileId` from profiles adapter
14. Update `dashboard/vport/dashboard/cards/bookings/hooks/useQuickBookingModal.js` to import `getVportServices` from profiles adapter
15. Update `dashboard/vport/dashboard/cards/portfolio/hooks/usePortfolioItemSubmit.js` to import locksmith controllers from profiles adapter

**Validation:** Gas price submission flow works end-to-end; quick booking modal loads vport services; portfolio item submission works for locksmith vport type.

---

### Group 6 — Scanner artifact verification

16. Verify `@media` alias resolution in `vite.config.js` / path aliases config
17. If `@media` resolves to media engine (expected): no action — scanner false positive, close as resolved
18. If `@media` resolves ambiguously or incorrectly to notifications: file a new ticket

---

### Group 7 — Gas prices ownership (BLOCKED — requires ARCH-DASH-001)

19. BLOCKED: Wait for ARCH-DASH-001 gas prices ownership decision (Option A: standalone feature, or Option B: expose via dashboard adapters)
20. After decision: fix 7 profiles adapter files that currently wrap dashboard internals

---

## Risk Per Pair

| Pair | Fixable Now Risk | Implementation Risk |
|---|---|---|
| ads ↔ settings | LOW | LOW — CSS only |
| auth ↔ legal | NONE | n/a |
| block ↔ feed | NONE | n/a |
| booking ↔ notifications | NONE | n/a |
| dashboard ↔ profiles (11 fixable) | MEDIUM | MEDIUM — 10 DAL import sites, gas price flow must be tested |
| dashboard ↔ profiles (7 blocked) | HIGH | HIGH — gas prices redesign |
| dashboard ↔ public | LOW | LOW — pure model move |
| dashboard ↔ settings | LOW | LOW — adapter additions only |
| feed ↔ post | NONE | n/a |
| feed ↔ social | NONE | n/a |
| notifications ↔ post | NONE | n/a |
| notifications ↔ profiles | LOW | LOW — CSS only + artifact verify |
| notifications ↔ social | NONE | n/a |
| post ↔ profiles | LOW | LOW — CSS only |
| profiles ↔ social | LOW | LOW — 1 adapter + 2 import updates |
| settings ↔ vport | NONE | n/a |

---

## Verification Against Layer Contract

> **Controller may decide. DAL may execute. RLS may enforce. No ownership decisions migrate into DAL while breaking cycles.**

| Violation | Verified Against Contract |
|---|---|
| dashboard DAL → profiles DAL (`resolveVportProfileId`) | FAILS — DAL-to-DAL cross-feature. Ownership decision (profile ID resolution) is migrated into dashboard's DAL scope. Fix: profiles adapter wraps the DAL; dashboard DAL calls through adapter. After fix: dashboard DAL → profiles adapter → profiles DAL. Controller boundary is preserved. |
| dashboard hook → profiles controller (`getVportServices`) | FAILS — Controller reached from a hook bypass. Fix: profiles adapter wraps the controller function; dashboard hook calls through adapter. Controller ownership stays with profiles. |
| dashboard hook → profiles controllers (locksmith ×2) | FAILS — same pattern as above. Fix: adapter wraps controllers. |
| profiles controller → social DAL (`actorSignalVisibility`) | FAILS — Controller calls another feature's DAL. The RPC itself has RLS enforcement, but the architectural contract requires the adapter boundary regardless. Fix: social adapter wraps the DAL; profiles controller calls through adapter. |
| profiles adapter files → dashboard internals (gas prices) | FAILS — adapter files wrapping internals instead of wrapping adapters. The adapter layer in profiles is the correct boundary but it points to the wrong side — it should wrap `dashboard/adapters/` exports, not dashboard internal hooks and components. Blocked on gas prices ownership decision. |
| CSS imports (5 files) | Not a Controller/DAL concern — stylesheet boundary violations. Out of layer contract scope. Fix: move to shared. |
| businessCardSettings model (dashboard→public) | Not a Controller/DAL concern — model layer only. Fix: move to shared. |

All violations either have an explicit fix path or are blocked with a recorded reason. No violation was accepted as "OK to leave broken."

---

## Implementation Tickets — Closure Log

| Ticket ID | Scope | Status | Closed |
|---|---|---|---|
| ARCH-BIDIR-CSS-001 | Move settings-modern.css + profiles-modern.css to shared/styles/; update 5 importers | ✅ CLOSED | 2026-06-06 |
| ARCH-BIDIR-MODEL-001 | Move businessCardSettings.model to shared/lib/businessCard/; update 3 importers | ✅ CLOSED | 2026-06-06 |
| ARCH-BIDIR-SOCIAL-001 | Add actorSignalVisibility.adapter.js in social/adapters/privacy/; update 1 profiles controller + test | ✅ CLOSED | prior session |
| ARCH-BIDIR-SETTINGS-001 | Add 3 settings hooks to settings/adapters/; update 1 dashboard screen | ✅ CLOSED | 2026-06-06 |
| ARCH-BIDIR-PROFILES-001 | resolveVportProfileId → shared/lib/vport/ (stronger than adapter); services.adapter.js + locksmith.adapter.js created; 10 import sites updated | ✅ CLOSED | 2026-06-06 |
| ARCH-BIDIR-GASPRICES-001 | Profiles gas adapter files now point to vportDashboard/adapters/vportDashboard.adapter (correct adapter-to-adapter). Resolved as side effect of ARCH-DASH-GAS-ADAPTER-001 + Phase 3 rename. Gas prices ownership decision not required — violation no longer exists. | ✅ CLOSED | 2026-06-07 |
| ARCH-BIDIR-VERIFY-001 | @media → engines/media/index.js confirmed in vite.config.js. Scanner false positive. Not a violation. | ✅ CLOSED — FALSE POSITIVE | 2026-06-07 |

---

## Closure Criteria for ARCH-BIDIR-001

- [x] All 15 pairs classified
- [x] Pairs 2, 3, 4, 8, 9, 10, 12, 15 confirmed SAFE AS-IS
- [x] All violations have a classification and resolution path
- [x] Gas prices block documented and linked to ARCH-DASH-001
- [x] Layer contract verified for each violation
- [x] Implementation tickets defined with scopes
- [x] Remediation order established
- [x] No source files modified in this ticket
- [x] All 7 implementation tickets CLOSED — 2026-06-07
- [x] 0 remaining violations across all 15 pairs — confirmed via grep
- [x] ARCH-BIDIR-VERIFY-001 closed as false positive — @media confirmed → engines/media/index.js
- [x] ARCH-BIDIR-GASPRICES-001 closed without gas prices redesign — violation resolved by adapter promotion in prior session + Phase 3 rename
