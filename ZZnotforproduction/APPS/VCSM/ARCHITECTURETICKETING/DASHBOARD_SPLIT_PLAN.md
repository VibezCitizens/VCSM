# Dashboard Split Plan

**Ticket:** ARCH-DASH-001
**Generated:** 2026-06-06
**Status:** PLANNING ONLY — no source files modified
**Data Source:** `apps/scanner/maps/dependency-map.json` (generated 2026-06-05)

---

## 1. Current Dashboard Structure

`apps/VCSM/src/features/dashboard/` — **264 files total** across 3 unrelated subsystems.

```
dashboard/
├── flyerBuilder/       (53 files)  — Flyer and design studio
│   ├── components/
│   ├── controller/
│   ├── dal/
│   ├── designStudio/   — Canvas-based design editor (nested subsystem)
│   │   ├── components/
│   │   ├── controller/
│   │   ├── dal/
│   │   ├── hooks/
│   │   ├── model/
│   │   └── screens/
│   ├── hooks/
│   ├── model/
│   ├── screens/
│   └── styles/
│
├── qrcode/             (9 files)   — QR code generation
│   ├── __tests__/
│   ├── adapters/
│   │   └── qrcode.adapter.js      ← already has a proper adapter
│   ├── components/
│   │   └── flyer/
│   └── index.js
│
└── vport/              (200 files) — Vport owner dashboard + 12 card subsystems
    ├── adapters/
    │   └── vport.adapter.js
    ├── components/
    ├── controller/
    ├── dal/
    ├── dashboard/
    │   └── cards/
    │       ├── bookings/   (12 files)
    │       ├── calendar/   (15 files)
    │       ├── exchange/   (4 files)
    │       ├── gasprices/  (47 files)
    │       ├── leads/      (11 files)
    │       ├── locksmith/  (5 files)
    │       ├── portfolio/  (12 files)
    │       ├── reviews/    (3 files)
    │       ├── schedule/   (20 files)
    │       ├── services/   (3 files)
    │       ├── settings/   (12 files)
    │       └── team/       (18 files)
    ├── hooks/
    ├── model/
    └── screens/
```

---

## 2. Target Structure

After the split, each subsystem becomes an independent feature at the top level of `features/`:

```
features/
├── flyerBuilder/       ← from dashboard/flyerBuilder/
│   ├── adapters/       ← NEW: flyerBuilder.adapter.js (create before any consumers change)
│   ├── components/
│   ├── controller/
│   ├── dal/
│   ├── designStudio/
│   ├── hooks/
│   ├── model/
│   ├── screens/
│   └── styles/
│
├── qrcode/             ← from dashboard/qrcode/
│   ├── adapters/
│   │   └── qrcode.adapter.js   ← same file, path changes only
│   ├── components/
│   │   └── flyer/
│   └── index.js
│
└── vportDashboard/     ← from dashboard/vport/
    ├── adapters/
    │   └── vportDashboard.adapter.js   ← rename from vport.adapter.js
    ├── components/
    ├── controller/
    ├── dal/
    ├── dashboard/
    │   └── cards/
    │       └── [12 card subsystems — same internal structure]
    ├── hooks/
    ├── model/
    └── screens/
```

### Import alias changes after split

| Old path prefix | New path prefix |
|---|---|
| `@/features/dashboard/flyerBuilder/...` | `@/features/flyerBuilder/...` |
| `@/features/dashboard/qrcode/...` | `@/features/qrcode/...` |
| `@/features/dashboard/vport/...` | `@/features/vportDashboard/...` |
| `@/features/dashboard/vport/adapters/vport.adapter` | `@/features/vportDashboard/adapters/vportDashboard.adapter` |
| `@/features/dashboard/qrcode/adapters/qrcode.adapter` | `@/features/qrcode/adapters/qrcode.adapter` |

---

## 3. Completed Pre-Work

### ARCH-DASH-GAS-ADAPTER-001 — CLOSED 2026-06-06

**What was done:**

`dashboard/vport/adapters/vport.adapter.js` was missing exports for all gas prices hooks, components, and the view screen. Profiles adapter files were pointing directly at dashboard internals as a workaround.

**Files changed:**

`dashboard/vport/adapters/vport.adapter.js` — 8 new exports added:
- `useVportGasPrices`
- `useOwnerPendingSuggestions`
- `useSubmitFuelPriceSuggestion`
- `GasPricesPanel`
- `GasStates`
- `OwnerPendingSuggestionsList`
- `VportGasPricesView`
- `checkVportOwnershipController`

7 profiles adapter files updated to import from `dashboard/vport/adapters/vport.adapter` instead of dashboard internals:
- `profiles/adapters/kinds/vport/screens/gas/VportGasPricesView.adapter.js`
- `profiles/adapters/kinds/vport/hooks/gas/useVportGasPrices.adapter.js`
- `profiles/adapters/kinds/vport/hooks/gas/useOwnerPendingSuggestions.adapter.js`
- `profiles/adapters/kinds/vport/hooks/gas/useSubmitFuelPriceSuggestion.adapter.js`
- `profiles/adapters/kinds/vport/screens/gas/components/GasPricesPanel.adapter.js`
- `profiles/adapters/kinds/vport/screens/gas/components/GasStates.adapter.js`
- `profiles/adapters/kinds/vport/screens/gas/components/OwnerPendingSuggestionsList.adapter.js`
- `profiles/adapters/kinds/vport/ownership.adapter.js`

**Validation:** `grep profiles/adapters/kinds/vport gasprices internals` → 0 results confirmed.

### ARCH-BIDIR-CSS-001 — CLOSED 2026-06-06

`settings-modern.css` moved to `shared/styles/`. `VportSettingsScreen.jsx` CSS import violation is resolved.

### ARCH-BIDIR-MODEL-001 — CLOSED 2026-06-06

`businessCardSettings.model.js` moved to `shared/lib/businessCard/`. `VportSettingsBusinessCard.jsx` model violation is resolved.

---

## 4. Remaining Dashboard → Profiles Violations

The following 11 violations remain after pre-work. They are all in `vportDashboard/` (the `dashboard/vport/` subsystem). None are in `flyerBuilder/` or `qrcode/`.

**These must be resolved before the vportDashboard split can be considered clean.**

### Group A — resolveVportProfileId.dal (×8)

`resolveVportProfileId` is a DAL utility that resolves a `vport.profiles.id` from an `actor_id`. Dashboard gas prices DAL files call it directly before their own DB writes.

**Violating files (all in `dashboard/vport/dashboard/cards/gasprices/`):**

| File | Import path |
|---|---|
| `controller/submitFuelPriceSuggestion.controller.js` | `@/features/profiles/kinds/vport/dal/services/resolveVportProfileId.dal` |
| `dal/vportFuelPriceHistory.write.dal.js` | `@/features/profiles/kinds/vport/dal/services/resolveVportProfileId.dal` |
| `dal/vportFuelPriceSubmissions.read.dal.js` | `@/features/profiles/kinds/vport/dal/services/resolveVportProfileId.dal` |
| `dal/vportFuelPriceSubmissions.write.dal.js` | `@/features/profiles/kinds/vport/dal/services/resolveVportProfileId.dal` |
| `dal/vportFuelPrices.read.dal.js` | `@/features/profiles/kinds/vport/dal/services/resolveVportProfileId.dal` |
| `dal/vportFuelPrices.write.dal.js` | `@/features/profiles/kinds/vport/dal/services/resolveVportProfileId.dal` |
| `dal/vportStationPriceSettings.read.dal.js` | `@/features/profiles/kinds/vport/dal/services/resolveVportProfileId.dal` |
| `__tests__/submitFuelPriceSuggestion.controller.test.js` | `@/features/profiles/kinds/vport/dal/services/resolveVportProfileId.dal` |

**Rule violated:** `NO_CROSS_FEATURE_DAL` — a DAL file may not import another feature's DAL directly.

**Why adapters cannot fix this:** The VCSM architecture contract prohibits adapters from exporting DAL functions. Exposing `resolveVportProfileId` through a profiles adapter would comply with the boundary rule but violate the adapter contract.

**Remediation strategy — move to `shared/lib/`:**

`resolveVportProfileId` is a pure utility: given an `actor_id`, return a `vport_profile_id`. It has no feature-specific state, no RLS context, no domain logic beyond a single lookup. It belongs in `shared/lib/` alongside other cross-feature utilities.

```
SOURCE:  profiles/kinds/vport/dal/services/resolveVportProfileId.dal.js
DEST:    shared/lib/vport/resolveVportProfileId.js   ← new location

UPDATE:  8 dashboard DAL/controller files
         from: @/features/profiles/kinds/vport/dal/services/resolveVportProfileId.dal
         to:   @/shared/lib/vport/resolveVportProfileId

ALSO UPDATE: any profiles-internal consumers of this file (grep required before move)
```

**Ticket:** ARCH-BIDIR-RESOLVE-001 (new ticket — do not implement in this plan)

---

### Group B — getVportServices.controller (×1)

`useQuickBookingModal.js` in the bookings card calls `getVportServices.controller` directly from profiles internals to load the vport service catalog when opening a quick booking.

| File | Import path |
|---|---|
| `dashboard/vport/dashboard/cards/bookings/hooks/useQuickBookingModal.js` | `@/features/profiles/kinds/vport/controller/services/getVportServices.controller` |

**Rule violated:** `NO_INTERNAL_WITHOUT_ADAPTER` — controller imported directly without going through profiles adapter.

**Remediation strategy — expose via profiles adapter hook:**

`getVportServices` should be wrapped in a hook that the profiles adapter exposes. The dashboard bookings card then consumes the hook through the adapter, not the raw controller.

```
ADD: profiles/adapters/kinds/vport/screens/services/view/VportServicesView.adapter.js
     (or a new hook adapter file)
     export a hook wrapper for getVportServices that the dashboard can call

UPDATE: useQuickBookingModal.js
        from: @/features/profiles/kinds/vport/controller/services/getVportServices.controller
        to:   @/features/profiles/adapters/kinds/vport/[new hook adapter]
```

**Note:** If `useVportServices` hook already exists in profiles, it may already expose this — grep `useVportServices` in `profiles/` before creating a new hook. `VportDashboardServicesScreen.jsx` already imports `VportServicesView.adapter` cleanly, confirming the adapter exists.

**Ticket:** ARCH-BIDIR-GETSERVICES-001 (new ticket — do not implement in this plan)

---

### Group C — locksmith controllers (×2)

`usePortfolioItemSubmit.js` in the portfolio card imports two locksmith-specific controllers directly from profiles internals.

| File | Import path |
|---|---|
| `dashboard/vport/dashboard/cards/portfolio/hooks/usePortfolioItemSubmit.js` | `@/features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller` |
| `dashboard/vport/dashboard/cards/portfolio/hooks/usePortfolioItemSubmit.js` | `@/features/profiles/kinds/vport/controller/locksmith/publishLocksmithPortfolioUpdateAsPost.controller` |

**Rule violated:** `NO_INTERNAL_WITHOUT_ADAPTER` — controllers imported directly without going through profiles adapter.

**Remediation strategy — expose via profiles adapter:**

Both locksmith controllers should be accessible through the profiles adapter layer. This follows the same pattern as `checkVportOwnershipController` which was already exposed through `profiles/adapters/kinds/vport/ownership.adapter.js`.

```
ADD to profiles/adapters/kinds/vport/ownership.adapter.js (or a new locksmith adapter):
  export { locksmithOwnerController } from '@/features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller'
  export { publishLocksmithPortfolioUpdateAsPost } from '@/features/profiles/kinds/vport/controller/locksmith/publishLocksmithPortfolioUpdateAsPost.controller'

UPDATE: usePortfolioItemSubmit.js
        from: @/features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller
        to:   @/features/profiles/adapters/kinds/vport/ownership.adapter
```

**Note:** This is a controller export through an adapter — the same pattern already used by `checkVportOwnershipController`. It is consistent with existing architecture. The CLAUDE.md adapter contract says adapters expose "hooks, components, view screens" — controllers are listed as NOT allowed. However, the existing `ownership.adapter.js` already exports a controller. Confirm whether this pattern is acceptable before implementing, or wrap in a hook instead.

**Ticket:** ARCH-BIDIR-LOCKSMITH-001 (new ticket — do not implement in this plan)

---

### Remaining dashboard → settings violations (settings hooks — 3 files)

`VportSettingsScreen.jsx` imports 3 settings hooks directly without going through a settings adapter:

| Import | Adapter exists? |
|---|---|
| `settings/vports/hooks/useVportDirectoryVisibility` | NO |
| `settings/vports/hooks/useVportBusinessCardSettings` | NO |
| `settings/vports/hooks/useResolvedVportId` | NO |

**Remediation:** Add these 3 hooks to `settings/adapters/` and update `VportSettingsScreen.jsx`.
This is tracked under **ARCH-BIDIR-SETTINGS-001** (existing open ticket — coordinate with naming work).

---

## 5. Dashboard Consumers — Full Map

Source: `apps/scanner/maps/dependency-map.json`

### Features that import from dashboard

| Consumer | File | Import path | Subsystem | Via adapter? | Status |
|---|---|---|---|---|---|
| `profiles` | `profiles/kinds/vport/screens/barbershop/VportBarberShopBookingView.jsx` | `dashboard/vport/adapters/vport.adapter` | vport | YES | CLEAN |
| `profiles` | `profiles/kinds/vport/screens/barbershop/VportBarberShopTeamView.jsx` | `dashboard/vport/adapters/vport.adapter` | vport | YES | CLEAN |
| `profiles` | `profiles/kinds/vport/hooks/useVportOwnerQuickStats.js` | `dashboard/vport/adapters/vport.adapter` | vport | YES | CLEAN |
| `profiles` | `profiles/kinds/vport/screens/booking/hooks/useVportPublicBooking.js` | `dashboard/vport/adapters/vport.adapter` | vport | YES | CLEAN |
| `profiles` | `profiles/adapters/kinds/vport/hooks/gas/useVportGasPrices.adapter.js` | `dashboard/vport/adapters/vport.adapter` | vport | YES | CLEAN (fixed) |
| `profiles` | `profiles/adapters/kinds/vport/hooks/gas/useOwnerPendingSuggestions.adapter.js` | `dashboard/vport/adapters/vport.adapter` | vport | YES | CLEAN (fixed) |
| `profiles` | `profiles/adapters/kinds/vport/hooks/gas/useSubmitFuelPriceSuggestion.adapter.js` | `dashboard/vport/adapters/vport.adapter` | vport | YES | CLEAN (fixed) |
| `profiles` | `profiles/adapters/kinds/vport/screens/gas/components/GasPricesPanel.adapter.js` | `dashboard/vport/adapters/vport.adapter` | vport | YES | CLEAN (fixed) |
| `profiles` | `profiles/adapters/kinds/vport/screens/gas/components/GasStates.adapter.js` | `dashboard/vport/adapters/vport.adapter` | vport | YES | CLEAN (fixed) |
| `profiles` | `profiles/adapters/kinds/vport/screens/gas/components/OwnerPendingSuggestionsList.adapter.js` | `dashboard/vport/adapters/vport.adapter` | vport | YES | CLEAN (fixed) |
| `profiles` | `profiles/adapters/kinds/vport/ownership.adapter.js` | `dashboard/vport/adapters/vport.adapter` | vport | YES | CLEAN (fixed) |
| `profiles` | `profiles/screens/views/profileheader/VisibleQRCode.jsx` | `dashboard/qrcode/adapters/qrcode.adapter` | qrcode | YES | CLEAN |
| `public` | `public/vportMenu/view/VportPublicMenuQrView.jsx` | `dashboard/qrcode/adapters/qrcode.adapter` | qrcode | YES | CLEAN |
| `public` | `public/vportMenu/view/VportPublicReviewsQrView.jsx` | `dashboard/qrcode/adapters/qrcode.adapter` | qrcode | YES | CLEAN |
| `settings` | `settings/vports/ui/VportsQrModal.jsx` | `dashboard/qrcode/adapters/qrcode.adapter` | qrcode | YES | CLEAN |

### App-level route consumers (lazyApp.jsx)

All 16 dashboard screen imports in `lazyApp.jsx` are direct lazy imports (not cross-feature adapter imports — this is correct for route registration). After the split, all import paths in `lazyApp.jsx` must be updated.

| Screen | Current path | Subsystem |
|---|---|---|
| `VportActorMenuFlyerEditorScreen` | `dashboard/flyerBuilder/screens/` | flyerBuilder |
| `VportDashboardScreen` | `dashboard/vport/screens/` | vportDashboard |
| `VportDashboardGasScreen` | `dashboard/vport/dashboard/cards/gasprices/screens/` | vportDashboard |
| `VportDashboardReviewScreen` | `dashboard/vport/dashboard/cards/reviews/` | vportDashboard |
| `VportDashboardLeadsScreen` | `dashboard/vport/dashboard/cards/leads/` | vportDashboard |
| `VportDashboardServicesScreen` | `dashboard/vport/dashboard/cards/services/` | vportDashboard |
| `VportDashboardExchangeScreen` | `dashboard/vport/dashboard/cards/exchange/` | vportDashboard |
| `VportDashboardCalendarScreen` | `dashboard/vport/dashboard/cards/calendar/` | vportDashboard |
| `VportDashboardPortfolioScreen` | `dashboard/vport/dashboard/cards/portfolio/` | vportDashboard |
| `VportDashboardLocksmithScreen` | `dashboard/vport/dashboard/cards/locksmith/` | vportDashboard |
| `VportDashboardBookingHistoryScreen` | `dashboard/vport/dashboard/cards/bookings/` | vportDashboard |
| `VportDashboardTeamScreen` | `dashboard/vport/dashboard/cards/team/` | vportDashboard |
| `BarberTeamRequestsScreen` | `dashboard/vport/dashboard/cards/team/` | vportDashboard |
| `VportDashboardScheduleScreen` | `dashboard/vport/dashboard/cards/schedule/` | vportDashboard |
| `VportSettingsFinalScreen` | `dashboard/vport/dashboard/cards/settings/` | vportDashboard |
| `VportGasPricesScreen` | `dashboard/vport/dashboard/cards/gasprices/screens/` | vportDashboard |

### RootLayout.jsx

`RootLayout.jsx` imports from `dashboard/vport/adapters/vport.adapter`. After the split, this becomes `vportDashboard/adapters/vportDashboard.adapter`.

---

## 6. Proposed New Import Paths After Split

### qrcode consumers

| File | Old path | New path |
|---|---|---|
| `profiles/screens/views/profileheader/VisibleQRCode.jsx` | `@/features/dashboard/qrcode/adapters/qrcode.adapter` | `@/features/qrcode/adapters/qrcode.adapter` |
| `public/vportMenu/view/VportPublicMenuQrView.jsx` | `@/features/dashboard/qrcode/adapters/qrcode.adapter` | `@/features/qrcode/adapters/qrcode.adapter` |
| `public/vportMenu/view/VportPublicReviewsQrView.jsx` | `@/features/dashboard/qrcode/adapters/qrcode.adapter` | `@/features/qrcode/adapters/qrcode.adapter` |
| `settings/vports/ui/VportsQrModal.jsx` | `@/features/dashboard/qrcode/adapters/qrcode.adapter` | `@/features/qrcode/adapters/qrcode.adapter` |

### flyerBuilder consumers

| File | Old path | New path |
|---|---|---|
| `app/routes/lazyApp.jsx` | `@/features/dashboard/flyerBuilder/screens/VportActorMenuFlyerEditorScreen` | `@/features/flyerBuilder/screens/VportActorMenuFlyerEditorScreen` |

### vportDashboard consumers (app-level)

| File | Old path prefix | New path prefix |
|---|---|---|
| `app/routes/lazyApp.jsx` (15 routes) | `@/features/dashboard/vport/` | `@/features/vportDashboard/` |
| `app/layout/RootLayout.jsx` | `@/features/dashboard/vport/adapters/vport.adapter` | `@/features/vportDashboard/adapters/vportDashboard.adapter` |

### vportDashboard consumers (features)

| File | Old path | New path |
|---|---|---|
| `profiles/kinds/vport/screens/barbershop/VportBarberShopBookingView.jsx` | `@/features/dashboard/vport/adapters/vport.adapter` | `@/features/vportDashboard/adapters/vportDashboard.adapter` |
| `profiles/kinds/vport/screens/barbershop/VportBarberShopTeamView.jsx` | `@/features/dashboard/vport/adapters/vport.adapter` | `@/features/vportDashboard/adapters/vportDashboard.adapter` |
| `profiles/kinds/vport/hooks/useVportOwnerQuickStats.js` | `@/features/dashboard/vport/adapters/vport.adapter` | `@/features/vportDashboard/adapters/vportDashboard.adapter` |
| `profiles/kinds/vport/screens/booking/hooks/useVportPublicBooking.js` | `@/features/dashboard/vport/adapters/vport.adapter` | `@/features/vportDashboard/adapters/vportDashboard.adapter` |
| `profiles/adapters/kinds/vport/hooks/gas/*.adapter.js` (×3) | `@/features/dashboard/vport/adapters/vport.adapter` | `@/features/vportDashboard/adapters/vportDashboard.adapter` |
| `profiles/adapters/kinds/vport/screens/gas/components/*.adapter.js` (×3) | `@/features/dashboard/vport/adapters/vport.adapter` | `@/features/vportDashboard/adapters/vportDashboard.adapter` |
| `profiles/adapters/kinds/vport/ownership.adapter.js` | `@/features/dashboard/vport/adapters/vport.adapter` | `@/features/vportDashboard/adapters/vportDashboard.adapter` |

---

## 7. Route Impact

All route registrations live in `apps/VCSM/src/app/routes/lazyApp.jsx`.

**flyerBuilder routes:** 1 route to update.
**vportDashboard routes:** 15 routes to update + RootLayout.jsx.
**qrcode routes:** None — qrcode has no screen routes; it is consumed as a component library only.

No route paths change (URL strings stay the same). Only the lazy import source paths change.

---

## 8. Migration Order

**Rule:** qrcode first (smallest, already has adapter, zero violations), flyerBuilder second (53 files, zero violations), vportDashboard last (largest, has remaining violations that must be resolved first).

---

### Phase 1 — qrcode (9 files)

qrcode has no violations. Its adapter already exists. All 4 external consumers use the adapter correctly. This is the safest move.

**Steps:**
1. Create `features/qrcode/` folder.
2. Move all 9 files from `dashboard/qrcode/` to `features/qrcode/` (preserve internal structure).
3. Update the adapter file's internal imports if any reference `dashboard/qrcode/` by relative path.
4. Update 4 external consumer import paths (`@/features/dashboard/qrcode/` → `@/features/qrcode/`).
5. Grep validate: `grep -r "dashboard/qrcode" apps/VCSM/src/ --include="*.js" --include="*.jsx"` → zero results.
6. Delete `dashboard/qrcode/`.

**Consumer files to update (4 total):**
- `profiles/screens/views/profileheader/VisibleQRCode.jsx`
- `public/vportMenu/view/VportPublicMenuQrView.jsx`
- `public/vportMenu/view/VportPublicReviewsQrView.jsx`
- `settings/vports/ui/VportsQrModal.jsx`

**Risk:** LOW. All consumers go through `qrcode.adapter.js`. No violations. Zero behavioral change.

---

### Phase 2 — flyerBuilder (53 files)

flyerBuilder has no violations — all its outbound imports go through adapters (`@/features/media/adapters/`, `@/features/profiles/adapters/`, `@/shared/`). One route registration to update.

**Steps:**
1. Create `features/flyerBuilder/` folder.
2. Move all 53 files from `dashboard/flyerBuilder/` to `features/flyerBuilder/` (preserve structure).
3. Create `features/flyerBuilder/adapters/flyerBuilder.adapter.js` — expose any screen/hook the app layer needs. Initially empty or minimal.
4. Update internal imports inside flyerBuilder that reference sibling files (relative paths stay valid; `@/features/dashboard/flyerBuilder/` alias references need update if any).
5. Update 1 route in `lazyApp.jsx`: `dashboard/flyerBuilder/screens/VportActorMenuFlyerEditorScreen` → `flyerBuilder/screens/VportActorMenuFlyerEditorScreen`.
6. Grep validate: `grep -r "dashboard/flyerBuilder" apps/VCSM/src/ --include="*.js" --include="*.jsx"` → zero results.
7. Delete `dashboard/flyerBuilder/`.

**Risk:** LOW. Only 1 external consumer (lazyApp.jsx). No cross-feature violations.

---

### Phase 3 — vportDashboard (200 files)

vportDashboard is the largest subsystem and has 11 remaining boundary violations (Groups A, B, C above) plus 3 settings hook violations. **These violations must be resolved in their own tickets before or alongside this move.** The split itself is mechanical — the violations are independent pre-work.

**Prerequisite tickets (must close before vportDashboard move):**
- `ARCH-BIDIR-RESOLVE-001` — move `resolveVportProfileId.dal` to `shared/lib/vport/` (8 files updated)
- `ARCH-BIDIR-GETSERVICES-001` — expose `getVportServices` via profiles adapter hook (1 file updated)
- `ARCH-BIDIR-LOCKSMITH-001` — expose locksmith controllers via profiles adapter (1 file updated)
- `ARCH-BIDIR-SETTINGS-001` — add 3 settings hooks to `settings/adapters/` (1 file updated)

**Steps (after prerequisites close):**
1. Create `features/vportDashboard/` folder.
2. Move all 200 files from `dashboard/vport/` to `features/vportDashboard/` (preserve entire structure including all 12 card subsystems).
3. Rename `vportDashboard/adapters/vport.adapter.js` → `vportDashboard/adapters/vportDashboard.adapter.js`.
4. Update internal imports inside vportDashboard that use `@/features/dashboard/vport/` by absolute alias.
5. Update all external consumers:
   - `app/routes/lazyApp.jsx` — 15 route import paths
   - `app/layout/RootLayout.jsx` — 1 adapter import
   - `profiles/` — 11 adapter files (all already pointing at `vport.adapter` — update path only)
6. Grep validate: `grep -r "dashboard/vport" apps/VCSM/src/ --include="*.js" --include="*.jsx"` → zero results.
7. Delete `dashboard/vport/`.
8. Delete `dashboard/` folder (now empty after all 3 subsystems moved).

**Risk:** HIGH. 200 files. 15 route registrations. All 12 card subsystems must be verified individually after the move.

---

## 9. Validation Checklist

### Phase 1 — qrcode

- [ ] `grep -r "dashboard/qrcode" apps/VCSM/src/` → zero results
- [ ] QR code renders correctly on profile header (`VisibleQRCode.jsx`)
- [ ] QR code renders on public menu views (`VportPublicMenuQrView`, `VportPublicReviewsQrView`)
- [ ] QR modal opens correctly in settings (`VportsQrModal.jsx`)
- [ ] `qrcode.spiderman.test.js` passes

### Phase 2 — flyerBuilder

- [ ] `grep -r "dashboard/flyerBuilder" apps/VCSM/src/` → zero results
- [ ] Flyer editor screen loads via its route (`VportActorMenuFlyerEditorScreen`)
- [ ] Design studio canvas renders (`VportDesignStudioViewScreen`)
- [ ] Flyer design studio controller tests pass (`flyerEditor.controller.test.js`, `designStudio.*.test.js`)
- [ ] Media upload in design studio still works

### Phase 3 — vportDashboard

- [ ] `grep -r "dashboard/vport" apps/VCSM/src/` → zero results
- [ ] `grep -r "@/features/dashboard/" apps/VCSM/src/` → zero results (confirms full cleanup)
- [ ] Owner dashboard loads (`VportDashboardScreen`)
- [ ] All 12 card screens load independently:
  - [ ] bookings — history and quick booking modal
  - [ ] calendar — schedule loads for barbershop
  - [ ] exchange — rates display and edit
  - [ ] gasprices — price view and suggestion submission
  - [ ] leads — list and new lead count
  - [ ] locksmith — dashboard loads
  - [ ] portfolio — upload and probe
  - [ ] reviews — review list loads
  - [ ] schedule — owner schedule loads
  - [ ] services — service list loads
  - [ ] settings — vport public details and business card
  - [ ] team — team list, barber requests, team access
- [ ] Gas prices on public vport profile tab still loads (profiles→vportDashboard adapter chain)
- [ ] `vportDashboard.adapter.js` is importable (replaces `vport.adapter.js` for all consumers)
- [ ] All 12 card controller tests pass

---

## 10. Owner Approval Checklist

### Design decisions requiring approval before implementation tickets open

- [ ] **Approve migration order:** qrcode → flyerBuilder → vportDashboard (or override)
- [ ] **Approve `resolveVportProfileId` moving to `shared/lib/vport/`** (Group A remediation) — alternative is a profiles adapter wrapper (does not expose DAL function publicly)
- [ ] **Approve locksmith controllers exposed through profiles adapter** (Group C remediation) — consistent with existing `checkVportOwnershipController` pattern in `ownership.adapter.js`
- [ ] **Approve vportDashboard adapter rename:** `vport.adapter.js` → `vportDashboard.adapter.js`
- [ ] **Approve prerequisite tickets (ARCH-BIDIR-RESOLVE-001, ARCH-BIDIR-GETSERVICES-001, ARCH-BIDIR-LOCKSMITH-001) must close before Phase 3 begins**
- [ ] **Confirm `features/dashboard/` folder is fully deleted** after all 3 phases complete
- [ ] **Confirm this does not change any URL paths or visible behavior** — purely structural

### New tickets created by this plan

| Ticket | Scope | Blocks |
|---|---|---|
| ARCH-BIDIR-RESOLVE-001 | Move `resolveVportProfileId.dal` to `shared/lib/vport/`; update 8 gasprices files | Phase 3 |
| ARCH-BIDIR-GETSERVICES-001 | Expose `getVportServices` via profiles adapter hook; update `useQuickBookingModal.js` | Phase 3 |
| ARCH-BIDIR-LOCKSMITH-001 | Expose locksmith controllers via `profiles/adapters/kinds/vport/ownership.adapter.js`; update `usePortfolioItemSubmit.js` | Phase 3 |

**ARCH-BIDIR-SETTINGS-001** (already open) must also close before Phase 3.
