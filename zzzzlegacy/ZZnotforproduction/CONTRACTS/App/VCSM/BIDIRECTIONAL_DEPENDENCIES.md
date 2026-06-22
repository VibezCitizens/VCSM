# VCSM Bidirectional Dependency Registry

**Version:** 1.0  
**Generated:** 2026-06-06  
**Source:** BIDIR_DEPENDENCY_DECISION.md (ARCH-BIDIR-001, CLOSED 2026-06-06)  
**Scanner data:** `apps/scanner/maps/dependency-map.json` (2026-06-05)  
**Total pairs:** 15

All 15 pairs from scanner analysis are classified here. Source of truth is BIDIR_DEPENDENCY_DECISION.md. This document is a registry — for full evidence and remediation steps, read the decision record.

---

## Summary Table

| # | Pair | Classification | Fixable Now? | Action Required | Ticket | Risk |
|---|---|---|---|---|---|---|
| 1 | `ads` ↔ `settings` | CSS-LEAK | YES | Move CSS to `shared/styles/` | ARCH-BIDIR-CSS-001 | LOW |
| 2 | `auth` ↔ `legal` | LEGITIMATE | n/a | NONE | — | NONE |
| 3 | `block` ↔ `feed` | QUERY-INVALIDATION | n/a | NONE | — | NONE |
| 4 | `booking` ↔ `notifications` | LEGITIMATE | n/a | NONE | — | NONE |
| 5a | `dashboard` ↔ `profiles` | DAL-VIOLATION + ADAPTER-MISSING | YES (11 violations) | Add 4 adapter exports in profiles; update 10 dashboard files | ARCH-BIDIR-PROFILES-001 | MEDIUM |
| 5b | `dashboard` ↔ `profiles` | GAS-PRICES-SPLIT | NO | Gas prices ownership decision required | ARCH-BIDIR-GASPRICES-001 (blocked on ARCH-DASH-001) | HIGH |
| 6 | `dashboard` ↔ `public` | SHARED-MODEL-LEAK | YES | Move `businessCardSettings.model` to `shared/lib/businessCard/` | ARCH-BIDIR-MODEL-001 | LOW |
| 7 | `dashboard` ↔ `settings` | CSS-LEAK + ADAPTER-MISSING | YES | Move CSS; expose 3 hooks in settings adapter | ARCH-BIDIR-SETTINGS-001 + ARCH-BIDIR-CSS-001 | LOW |
| 8 | `feed` ↔ `post` | UI-COMPOSITION | n/a | NONE | — | NONE |
| 9 | `feed` ↔ `social` | QUERY-INVALIDATION + UI-COMPOSITION | n/a | NONE | — | NONE |
| 10 | `notifications` ↔ `post` | LEGITIMATE | n/a | NONE | — | NONE |
| 11 | `notifications` ↔ `profiles` | CSS-LEAK + SCANNER-ARTIFACT | YES (CSS) / VERIFY (@media) | Move CSS; verify @media alias | ARCH-BIDIR-CSS-001 + ARCH-BIDIR-VERIFY-001 | LOW |
| 12 | `notifications` ↔ `social` | LEGITIMATE | n/a | NONE | — | NONE |
| 13 | `post` ↔ `profiles` | CSS-LEAK | YES | Move CSS to `shared/styles/` | ARCH-BIDIR-CSS-001 | LOW |
| 14 | `profiles` ↔ `social` | DAL-VIOLATION | YES | Add adapter in `social/adapters/privacy/` | ARCH-BIDIR-SOCIAL-001 | LOW |
| 15 | `settings` ↔ `vport` | LEGITIMATE | n/a | NONE | — | NONE |

---

## Pair Detail Records

---

### Pair 1 — ads ↔ settings

**Classification:** CSS-LEAK (ads→settings) / LEGITIMATE (settings→ads)

| Direction | From File | To | Adapter? |
|---|---|---|---|
| ads→settings | `ads/screens/VportAdsSettingsScreen.jsx` | `settings/styles/settings-modern.css` | NO — VIOLATION |
| settings→ads | `settings/vports/ui/VportsTab.view.jsx` | `ads/adapters/widgets/OnemoredaysAd.adapter` | YES — CLEAN |

**Why it exists:** The settings screen imports `ads` for display. The ads settings screen imports the settings stylesheet directly rather than using a shared stylesheet.

**Allowed temporarily?** NO. CSS file must move.

**Target boundary:** `ads` → `shared/styles/settings-modern.css`; `settings` → `ads/adapters/` (already correct)

**Remediation ticket:** ARCH-BIDIR-CSS-001  
**Risk:** LOW

---

### Pair 2 — auth ↔ legal

**Classification:** LEGITIMATE

| Direction | From File | To | Adapter? |
|---|---|---|---|
| auth→legal | `auth/hooks/useRegister.js` | `legal/adapters/legal.adapter` | YES — CLEAN |
| legal→auth | `legal/screens/ConsentGateScreen.jsx` | `auth/adapters/auth.adapter` | YES — CLEAN |
| legal→auth | `legal/screens/LegalDocumentScreen.jsx` | `auth/adapters/auth.adapter` | YES — CLEAN |

**Why it exists:** Registration requires consent; legal screens gate on auth state. Both are platform primitives.

**Allowed permanently?** YES — both directions at adapter boundary.

**Remediation ticket:** None required.  
**Risk:** NONE

---

### Pair 3 — block ↔ feed

**Classification:** QUERY-INVALIDATION + UI-COMPOSITION

| Direction | From File | To | Adapter? |
|---|---|---|---|
| block→feed | `block/hooks/useBlockActions.js` | `feed/adapters/feedCache.adapter` | YES — CLEAN |
| block→feed | `block/hooks/useBlockActorAction.js` | `feed/adapters/feedCache.adapter` | YES — CLEAN |
| feed→block | `feed/hooks/useCentralFeedActions.js` | `block/adapters/hooks/useBlockActorAction.adapter` | YES — CLEAN |

**Why it exists:** Blocking an actor must invalidate the feed cache; feed surfaces a block button in the action bar.

**Allowed permanently?** YES — both directions at adapter boundary.

**Remediation ticket:** None required.  
**Risk:** NONE

---

### Pair 4 — booking ↔ notifications

**Classification:** LEGITIMATE + UI-COMPOSITION

| Direction | From File | To | Adapter? |
|---|---|---|---|
| booking→notifications | `cancelBooking.controller.js` | `notifications/adapters/notifications.adapter` | YES — CLEAN |
| booking→notifications | `confirmBooking.controller.js` | `notifications/adapters/notifications.adapter` | YES — CLEAN |
| booking→notifications | `createBooking.controller.js` | `notifications/adapters/notifications.adapter` | YES — CLEAN |
| booking→notifications | `booking/setup.js` | `notifications/adapters/notifications.adapter` | YES — CLEAN |
| notifications→booking | `screen/hooks/useMyAppointments.js` | `booking/adapters/booking.adapter` | YES — CLEAN |

**Why it exists:** Booking lifecycle events fire notifications; notifications inbox includes appointments view.

**Allowed permanently?** YES.

**Remediation ticket:** None required.  
**Risk:** NONE

---

### Pair 5a — dashboard ↔ profiles (fixable violations)

**Classification:** DAL-VIOLATION + ADAPTER-MISSING (dashboard→profiles)

| From File | To | Adapter? | Rule |
|---|---|---|---|
| `cards/gasprices/__tests__/…test.js` | `profiles/kinds/vport/dal/services/resolveVportProfileId.dal` | NO | DAL-VIOLATION |
| `cards/gasprices/controller/submitFuelPriceSuggestion.controller.js` | `profiles/kinds/vport/dal/services/resolveVportProfileId.dal` | NO | DAL-VIOLATION |
| `cards/gasprices/dal/vportFuelPriceHistory.write.dal.js` | `profiles/kinds/vport/dal/services/resolveVportProfileId.dal` | NO | DAL-VIOLATION |
| `cards/gasprices/dal/vportFuelPriceSubmissions.read.dal.js` | `profiles/kinds/vport/dal/services/resolveVportProfileId.dal` | NO | DAL-VIOLATION |
| `cards/gasprices/dal/vportFuelPriceSubmissions.write.dal.js` | `profiles/kinds/vport/dal/services/resolveVportProfileId.dal` | NO | DAL-VIOLATION |
| `cards/gasprices/dal/vportFuelPrices.read.dal.js` | `profiles/kinds/vport/dal/services/resolveVportProfileId.dal` | NO | DAL-VIOLATION |
| `cards/gasprices/dal/vportFuelPrices.write.dal.js` | `profiles/kinds/vport/dal/services/resolveVportProfileId.dal` | NO | DAL-VIOLATION |
| `cards/gasprices/dal/vportStationPriceSettings.read.dal.js` | `profiles/kinds/vport/dal/services/resolveVportProfileId.dal` | NO | DAL-VIOLATION |
| `cards/bookings/hooks/useQuickBookingModal.js` | `profiles/kinds/vport/controller/services/getVportServices.controller` | NO | ADAPTER-MISSING |
| `cards/portfolio/hooks/usePortfolioItemSubmit.js` | `profiles/kinds/vport/controller/locksmith/locksmithOwner.controller` | NO | ADAPTER-MISSING |
| `cards/portfolio/hooks/usePortfolioItemSubmit.js` | `profiles/kinds/vport/controller/locksmith/publishLocksmithPortfolioUpdateAsPost.controller` | NO | ADAPTER-MISSING |

**Why it exists:** Gas price DAL files need to resolve a vport profile ID. The function exists in `profiles/kinds/vport/dal/` but was never exposed via a profiles adapter.

**Allowed temporarily?** NO. Fix is simple (add adapter exports).

**Target boundary:** All 11 imports → `profiles/adapters/kinds/vport/` adapter surface.

**Remediation ticket:** ARCH-BIDIR-PROFILES-001  
**Risk:** MEDIUM (10 DAL import sites + 1 hook; gas price flow must be validated)

---

### Pair 5b — dashboard ↔ profiles (gas prices — blocked)

**Classification:** GAS-PRICES-SPLIT (profiles→dashboard)

| From File | To | Adapter? |
|---|---|---|
| `profiles/adapters/kinds/vport/hooks/gas/useOwnerPendingSuggestions.adapter.js` | `dashboard/vport/dashboard/cards/gasprices/hooks/useOwnerPendingSuggestions` | NO |
| `profiles/adapters/kinds/vport/hooks/gas/useSubmitFuelPriceSuggestion.adapter.js` | `dashboard/vport/dashboard/cards/gasprices/hooks/useSubmitFuelPriceSuggestion` | NO |
| `profiles/adapters/kinds/vport/hooks/gas/useVportGasPrices.adapter.js` | `dashboard/vport/dashboard/cards/gasprices/hooks/useVportGasPrices` | NO |
| `profiles/adapters/kinds/vport/ownership.adapter.js` | `dashboard/vport/controller/checkVportOwnership.controller` | NO |
| `profiles/adapters/kinds/vport/screens/gas/components/GasPricesPanel.adapter.js` | `dashboard/vport/dashboard/cards/gasprices/components/GasPricesPanel` | NO |
| `profiles/adapters/kinds/vport/screens/gas/components/GasStates.adapter.js` | `dashboard/vport/dashboard/cards/gasprices/components/GasStates` | NO |
| `profiles/adapters/kinds/vport/screens/gas/components/OwnerPendingSuggestionsList.adapter.js` | `dashboard/vport/dashboard/cards/gasprices/components/OwnerPendingSuggestionsList` | NO |

**Why it exists:** Gas prices UI is co-owned across both features. `profiles/adapters/kinds/vport/` wraps dashboard internals directly because dashboard hasn't exposed these hooks/components via its own adapter surface.

**Allowed temporarily?** YES — blocked on ARCH-DASH-001 gas prices ownership decision.

**Target boundary options:**
- **Option A:** Gas prices becomes standalone `vportGasPrices/` feature. Both import from it.
- **Option B:** Dashboard exposes all gas prices hooks/components via `dashboard/vport/adapters/`. Profiles adapters re-export from dashboard adapters (not internals).

**Remediation ticket:** ARCH-BIDIR-GASPRICES-001 (BLOCKED on ARCH-DASH-001)  
**Risk:** HIGH

---

### Pair 6 — dashboard ↔ public

**Classification:** SHARED-MODEL-LEAK (dashboard→public) / UI-COMPOSITION (public→dashboard)

| Direction | From File | To | Adapter? |
|---|---|---|---|
| dashboard→public | `cards/settings/components/VportSettingsBusinessCard.jsx` | `public/vportBusinessCard/model/businessCardSettings.model` | NO — VIOLATION |
| public→dashboard | `public/vportMenu/view/VportPublicMenuQrView.jsx` | `dashboard/qrcode/adapters/qrcode.adapter` | YES — CLEAN |
| public→dashboard | `public/vportMenu/view/VportPublicReviewsQrView.jsx` | `dashboard/qrcode/adapters/qrcode.adapter` | YES — CLEAN |

**Why it exists:** `businessCardSettings.model.js` is a pure config model consumed by 3 features (dashboard, public, settings). It was authored in `public/` but belongs in `shared/`.

**Allowed temporarily?** NO. Model must move.

**Target boundary:** `public/vportBusinessCard/model/businessCardSettings.model` → `shared/lib/businessCard/businessCardSettings.model`

**Remediation ticket:** ARCH-BIDIR-MODEL-001  
**Risk:** LOW

---

### Pair 7 — dashboard ↔ settings

**Classification:** CSS-LEAK + ADAPTER-MISSING (dashboard→settings) / UI-COMPOSITION (settings→dashboard)

| Direction | From File | To | Adapter? |
|---|---|---|---|
| dashboard→settings | `cards/settings/VportSettingsScreen.jsx` | `settings/styles/settings-modern.css` | NO — CSS-LEAK |
| dashboard→settings | `cards/settings/VportSettingsScreen.jsx` | `settings/vports/hooks/useVportDirectoryVisibility` | NO — ADAPTER-MISSING |
| dashboard→settings | `cards/settings/VportSettingsScreen.jsx` | `settings/vports/hooks/useVportBusinessCardSettings` | NO — ADAPTER-MISSING |
| dashboard→settings | `cards/settings/VportSettingsScreen.jsx` | `settings/vports/hooks/useResolvedVportId` | NO — ADAPTER-MISSING |
| dashboard→settings | (3 Card.adapter imports) | `settings/adapters/ui/Card.adapter` | YES — CLEAN |
| settings→dashboard | `settings/vports/ui/VportsQrModal.jsx` | `dashboard/qrcode/adapters/qrcode.adapter` | YES — CLEAN |

**Why it exists:** The vport settings card in dashboard uses settings hooks and the shared settings stylesheet. The hooks are not yet exposed via settings adapters.

**Allowed temporarily?** NO for hooks and CSS. Card.adapter imports are already correct.

**Target boundary:** Add 3 hooks to `settings/adapters/`; CSS moves to `shared/styles/`.

**Remediation tickets:** ARCH-BIDIR-SETTINGS-001, ARCH-BIDIR-CSS-001  
**Risk:** LOW

---

### Pair 8 — feed ↔ post

**Classification:** UI-COMPOSITION + QUERY-INVALIDATION — LEGITIMATE

All imports through adapters. Feed renders post cards; post has a full-feed view using feed hook.

**Allowed permanently?** YES.  
**Remediation ticket:** None.  
**Risk:** NONE

---

### Pair 9 — feed ↔ social

**Classification:** QUERY-INVALIDATION + UI-COMPOSITION — LEGITIMATE

Social follow/unfollow controllers invalidate feed cache; feed surfaces follow buttons through social adapters.

**Allowed permanently?** YES.  
**Remediation ticket:** None.  
**Risk:** NONE

---

### Pair 10 — notifications ↔ post

**Classification:** LEGITIMATE + UI-COMPOSITION

Post controllers fire notifications through adapter; notifications screen surfaces post detail through post adapter.

**Allowed permanently?** YES.  
**Remediation ticket:** None.  
**Risk:** NONE

---

### Pair 11 — notifications ↔ profiles

**Classification:** CSS-LEAK (notifications→profiles) / LEGITIMATE + SCANNER-ARTIFACT (profiles→notifications)

| Direction | From File | To | Adapter? |
|---|---|---|---|
| notifications→profiles | `NotificationsScreenView.jsx` | `profiles/styles/profiles-modern.css` | NO — CSS-LEAK |
| profiles→notifications | `VportReviews.controller.js` | `notifications/adapters/notifications.adapter` | YES — CLEAN |
| profiles→notifications | `useMenuItemPhotoUpload.js` | `@media alias → notifications/runtime/index.js` | SCANNER-ARTIFACT — verify |

**Allowed temporarily?** CSS violation must be fixed. Scanner artifact must be verified.

**Target boundary:** `profiles-modern.css` → `shared/styles/profiles-modern.css`

**Remediation tickets:** ARCH-BIDIR-CSS-001, ARCH-BIDIR-VERIFY-001  
**Risk:** LOW

---

### Pair 12 — notifications ↔ social

**Classification:** LEGITIMATE + UI-COMPOSITION

Social follow controllers fire notifications through adapter; follow request notification items have action buttons from social adapters.

**Allowed permanently?** YES.  
**Remediation ticket:** None.  
**Risk:** NONE

---

### Pair 13 — post ↔ profiles

**Classification:** CSS-LEAK (post→profiles) / UI-COMPOSITION (profiles→post)

| Direction | From File | To | Adapter? |
|---|---|---|---|
| post→profiles | `post/postcard/ui/EditPost.jsx` | `profiles/styles/profiles-modern.css` | NO — CSS-LEAK |
| post→profiles | `post/screens/PostDetail.view.jsx` | `profiles/styles/profiles-modern.css` | NO — CSS-LEAK |
| profiles→post | 14 imports | `post/adapters/` | YES — CLEAN |

**Allowed temporarily?** NO for CSS. profiles→post is already correct.

**Target boundary:** `profiles-modern.css` → `shared/styles/profiles-modern.css`

**Remediation ticket:** ARCH-BIDIR-CSS-001  
**Risk:** LOW

---

### Pair 14 — profiles ↔ social

**Classification:** DAL-VIOLATION (profiles→social) / UI-COMPOSITION (social→profiles)

| Direction | From File | To | Adapter? |
|---|---|---|---|
| profiles→social | `getSubscribers.controller.js` | `social/privacy/dal/actorSignalVisibility.dal` | NO — DAL-VIOLATION |
| profiles→social | `getSubscribers.controller.test.js` | `social/privacy/dal/actorSignalVisibility.dal` | NO — DAL-VIOLATION |
| profiles→social | (9 more imports) | `social/adapters/` | YES — CLEAN |
| social→profiles | `social/components/PrivateProfileNotice.jsx` | `profiles/adapters/ui/PrivateProfileGate.adapter` | YES — CLEAN |

**Why it exists:** `getSubscribersController` needs `dalCanViewActorSignal` (social RPC for follower visibility gating) and reached into social's DAL directly. No social adapter existed for this function.

**Allowed temporarily?** NO.

**Target boundary:** Add `social/adapters/privacy/actorSignalVisibility.adapter.js`; update profiles controller + test.

**Remediation ticket:** ARCH-BIDIR-SOCIAL-001  
**Risk:** LOW

---

### Pair 15 — settings ↔ vport

**Classification:** LEGITIMATE

All imports through adapters. Settings manages vport operations; vport restore navigates to settings.

**Allowed permanently?** YES.  
**Remediation ticket:** None.  
**Risk:** NONE

---

## Pairs That Become Unidirectional After Remediation

| Pair | Remaining Direction | Reason |
|---|---|---|
| `ads` ↔ `settings` | settings → ads | ads CSS import removed |
| `dashboard` ↔ `public` | public → dashboard | dashboard model import moves to shared |
| `notifications` ↔ `profiles` | profiles → notifications | notifications CSS import removed |
| `post` ↔ `profiles` | profiles → post | post CSS import removed |
| `profiles` ↔ `social` | profiles → social | DAL violation fixed, adapter added |

---

## Implementation Tickets

| Ticket | Scope | Pairs Fixed |
|---|---|---|
| ARCH-BIDIR-CSS-001 | Move settings-modern.css + profiles-modern.css to shared/styles/ | 1, 7, 11, 13 |
| ARCH-BIDIR-MODEL-001 | Move businessCardSettings.model to shared/lib/businessCard/ | 6 |
| ARCH-BIDIR-SOCIAL-001 | Add actorSignalVisibility.adapter in social/adapters/privacy/ | 14 |
| ARCH-BIDIR-SETTINGS-001 | Add 3 settings hooks to settings/adapters/ | 7 |
| ARCH-BIDIR-PROFILES-001 | Add 4 adapter exports in profiles/adapters/kinds/vport/ | 5a |
| ARCH-BIDIR-GASPRICES-001 | Fix 7 profiles adapters wrapping dashboard internals | 5b (BLOCKED) |
| ARCH-BIDIR-VERIFY-001 | Verify @media alias in vite config | 11 |
