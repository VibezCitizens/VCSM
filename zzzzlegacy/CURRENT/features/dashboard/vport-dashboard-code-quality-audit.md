# VPORT Dashboard — Architecture & Code Quality Audit

**Audited:** 2026-06-02
**Method:** Direct source file inspection across all card implementations
**Scope:** 12 active card directories + shared supporting layers
**Maintained by:** ARCHITECT

---

## Master Scores Table

| Card | Architecture | Modularity | Maintainability | Tech Debt | Classification |
|---|---|---|---|---|---|
| **leads** | 85 | 85 | 85 | 10 | EXCELLENT |
| **reviews** | 75 | 80 | 85 | 5 | GOOD |
| **services** | 75 | 80 | 85 | 5 | GOOD |
| **booking** | 75 | 80 | 78 | 20 | GOOD |
| **calendar** | 65 | 70 | 85 | 5 | GOOD |
| **team** | 70 | 72 | 75 | 15 | GOOD |
| **locksmith** | 65 | 60 | 70 | 20 | ACCEPTABLE |
| **exchange** | 55 | 60 | 50 | 35 | NEEDS_REFACTOR |
| **gas** | 55 | 60 | 45 | 45 | NEEDS_REFACTOR |
| **portfolio** | 50 | 55 | 45 | 40 | NEEDS_REFACTOR |
| **settings** | 45 | 50 | 40 | 50 | NEEDS_REFACTOR |
| **schedule** | 35 | 40 | 35 | 55 | SPAGHETTI |

---

## Section A — Fully Modular Cards

These cards are production-ready with minimal technical debt.

### Leads

**Source:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/`

- **Files:** 13 (~864 LOC total)
- **Entry:** `VportDashboardLeadsFinalScreen.jsx`
- **Hooks:** `useVportLeads.js` (100 lines — read only), `useVportNewLeadsCount.js` (51 lines)
- **Controllers:** `vportLeads.controller.js` (78 lines)
- **DALs:** `vportLeads.read.dal.js`, `vportLeads.write.dal.js`
- **Models:** `vportLead.model.js` (24 lines), `vportLead.display.model.js` (40 lines)
- **Tests:** 2 test files present

**Why it scores highest:** The card demonstrates the exact architecture the platform is designed around. The Screen → Hook → Controller → DAL → DB chain is clean and unbroken. Read hooks contain no mutations. Write operations live exclusively in the controller. Model files are small and single-purpose. No cross-card imports. No inline business logic. Test coverage present.

---

### Reviews / Services / Calendar

These three cards are intentionally thin wrappers over profile adapters. Their simplicity is correct by design — they exist to route owner traffic through the dashboard shell without duplicating business logic.

- **Reviews:** ~80 LOC, delegates entirely to `VportReviewsView` adapter. Zero violations.
- **Services:** ~101 LOC, delegates entirely to `VportServicesView` adapter. Zero violations.
- **Calendar:** ~221 LOC, minimal screen with ownership gate and delegation to booking engine. Zero debt, though the card's identity (thin alias vs. distinct feature) should be clarified in documentation.

---

### Booking

**Source:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/`

- **Files:** 14 (~1,536 LOC)
- **Entry:** `VportDashboardBookingHistoryScreen.jsx`
- **Hooks:** `useVportBookingOps`, `useVportBookingActions`, `useQuickBookingModal` (78 lines)
- **Controllers:** `createOwnerBooking.controller.js` (59 lines), `updateVportBooking.controller.js` (138 lines), `vportPublicBooking.controller.js` (127 lines)
- **DALs:** `insertVportBooking.write.dal.js`
- **Tests:** 2 test files

Clean layer separation. Ownership verified via `assertActorOwnsVportActorController` before every mutation. No cross-card imports from the card itself. DEFER-001 resolved. Classified GOOD (not EXCELLENT) because `updateVportBooking.controller.js` at 138 lines is approaching the size limit — it handles confirm, cancel, and reschedule in one file.

---

### Team

**Source:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/team/`

- **Files:** 17 (~2,323 LOC — second largest card)
- **Entry:** `VportDashboardTeamScreen.jsx`
- **Hooks:** `useVportTeam.js` (73 lines), `useVportTeamAccess.js` (89 lines), `useBarberTeamRequests.js` (70 lines)
- **Controllers:** `vportTeam.controller.js` (138 lines), `vportTeamAccess.controller.js` (156 lines), `vportTeamInvite.controller.js` (111 lines)
- **DALs:** `vportTeam.read.dal.js`, `vportTeam.write.dal.js`, `vportTeamInvite.read.dal.js`, `vportTeamInvite.write.dal.js`
- **Components:** `TeamMemberCards`, `AddTeamMemberSheet`, `ConfirmRemoveModal`

Despite high file count and LOC, the team card is well-structured. Controllers properly separate read/access/invite concerns. Ownership gates applied before all mutations. DAL layer cleanly split read/write. The two issues keeping it from EXCELLENT:

1. `vportTeamAccess.controller.js` is 156 lines — slightly over limit, though each exported function is single-responsibility
2. `VportDashboardTeamScreen.jsx` manages 7 separate `useState` hooks inline (showAddSheet, adding, pendingRemove, removing, removeError, mutateError, mobileBarberIdx) — these should be consolidated into a `useTeamScreenState` hook

---

## Section B — Acceptable Cards

### Locksmith

**Source:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/locksmith/`

- **Files:** 3 (~358 LOC in card)
- **Entry:** `VportDashboardLocksmithScreen.jsx` (174 lines)
- **Components:** `locksmithScreenComponents.jsx` (162 lines)
- **Hooks:** delegated to profile adapter (`useLocksmithProfile`, `useLocksmithOwner`, `usePublishLocksmithPost`)
- **Controllers/DALs:** none in card — fully delegated

Two specific issues:

1. `locksmithScreenComponents.jsx` contains `AreaForm`, `AreaCard`, `ServiceDetailRow`, and `GapServiceRow` — four distinct components in one 162-line file. Each should be its own file.

2. Screen directly calls `owner.addArea`, `owner.updateArea`, `owner.deleteArea` without a local controller layer. When the adapter hook changes signature, the screen breaks with no intermediate safety layer.

Not spaghetti, but these two patterns prevent it from scoring above ACCEPTABLE.

---

## Section C — Needs Refactor

### Exchange

**Source:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/exchange/`

- **Files:** 2 (~285 LOC)
- **Entry:** `VportDashboardExchangeScreen.jsx`
- **Hooks:** `useUpsertVportRate`, `usePublishExchangeRatePost` (both from profiles adapter)

**Violations:**

1. **Business logic embedded in screen file.** Helper functions `normalizeCurrencyCode`, `toNumOrNull`, `toRatePairKey`, and `formatPublishToast` are defined inline in the screen component. These are pure data-transformation functions and belong in a model layer (`exchange.model.js`), not the screen.

2. **No local controller layer.** The card has no `exchange.controller.js`. Rate upsert and feed publishing are orchestrated directly from the screen's `onSubmit` handler by calling adapter hooks. When those adapter hooks change, the screen owns the breakage.

3. **Optimistic state managed inline.** `optimisticRatesByPair` is a `useState` in the screen (200+ lines of form + optimistic update + rollback logic). This should be in a dedicated hook.

**Risk:** MEDIUM. Rate publishing is a visible VPORT action. Logic changes require touching the screen directly.

**Estimated refactor effort:** 2–3 hours. Extract helpers to `exchange.model.js`, create `exchange.controller.js` wrapping adapter calls, move optimistic state to `useExchangeRate.js`.

---

### Gas

**Source:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/gas/`

- **Files:** 42 (~3,855 LOC — largest card by significant margin)
- **Entry:** `VportDashboardGasScreen.jsx`
- **Hooks:** 7 (useVportGasPrices, useSubmitFuelPriceSuggestion, useOwnerPendingSuggestions, useSubmitBulkFuelPrices, useUpdateStationFuelUnit, useAfterSubmitSuggestion, useGasUnitToggle)
- **Controllers:** 5
- **DALs:** 8
- **Models:** 5
- **Components:** 8
- **Screens:** 4

**Violations:**

1. **`submitFuelPriceSuggestion.controller.js` is 177 lines** — the largest controller in the codebase. It imports 10+ DAL functions on lines 1–8 and handles: profile resolution, owner/citizen path branching, settings fetch, multiple DAL writes (official prices, submission record, history record), and feed publishing coordination. This is two controllers masquerading as one.

2. **Cache management has no clear owner.** `invalidateFuelPriceCache` is exported from the read DAL (`vportFuelPrices.read.dal.js`) but called from multiple controllers (submitFuelPriceSuggestion, updateStationFuelUnit, reviewFuelPriceSuggestion). There is no central cache service. When caching behavior changes, all three controllers need updating.

3. **Duplicate or ambiguous screens.** There are 4 screen files: `VportDashboardGasScreen.jsx`, `VportGasPricesScreen.jsx`, `VportGasPricesView.jsx`, and a second `VportDashboardGasScreen.jsx` (different export, same filename pattern). DEFER-004 in the governance docs confirms this is a known pre-existing Screen/View split violation.

4. **`useVportGasPrices` returns 10+ properties** destructured directly in screens — a prop-surface explosion that makes it hard to know which properties are actually consumed by which screen.

**Risk:** MEDIUM. Gas prices are a public-facing live feature. The controller size and cache ambiguity create maintenance risk when price logic changes.

**Estimated refactor effort:** 1–2 days. Split `submitFuelPriceSuggestion.controller.js` into `submitCitizenFuelSuggestion.controller.js` + `updateOwnerFuelPrice.controller.js`. Create a `FuelPriceCacheService`. Resolve screen naming/split as part of DEFER-004 structural sprint.

---

### Portfolio

**Source:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/`

- **Files:** 12 (~1,158 LOC)
- **Entry:** `VportDashboardPortfolioScreen.jsx`
- **Hooks:** `useVportPortfolioProbe.js` (51 lines at card level), `usePortfolioItemSubmit.js` (155 lines — nested inside `components/portfolio/hooks/`), `usePortfolioMediaUpload.js` (33 lines — also nested)
- **Controllers:** `addPortfolioMediaWithRecord.controller.js` (79 lines), `probeVportPortfolio.controller.js` (56 lines)
- **DALs:** `portfolioMediaRecord.write.dal.js` (20 lines)
- **Components:** `PortfolioItemForm.jsx` (292 lines), `PortfolioManagerCard.jsx` (72 lines)

**Violations:**

1. **`PortfolioItemForm.jsx` is 292 lines** — the largest single component file in the entire codebase. It handles: kind selector, title/description inputs, tag management, locksmith-specific conditional fields, file upload/preview, form validation, and submission. This is a god component.

2. **Hooks nested inside the component subtree.** `usePortfolioItemSubmit.js` and `usePortfolioMediaUpload.js` live at `components/portfolio/hooks/` — inside the component directory, not the card-level hooks directory. This violates the architecture contract. Hooks should never be owned by the component layer.

3. **`usePortfolioItemSubmit.js` is 155 lines** and contains business logic (submission orchestration, media record creation, error recovery) that belongs in a controller. The hook is acting as a controller.

4. **No controller layer for form submission.** The card has `addPortfolioMediaWithRecord.controller.js` but it handles only the DAL write — the orchestration of the full submission flow (validate → upload → create record → update portfolio) lives in the hook, not a controller.

**Risk:** HIGH. Portfolio is used by all VPORT kinds. The oversized form component + misplaced hook pattern creates high risk when adding new portfolio kinds (a new VPORT kind would need locksmith-style conditional logic added to an already 292-line file).

**Estimated refactor effort:** 1 day. Split `PortfolioItemForm.jsx` into `PortfolioFormBase`, `LocksmithPortfolioFields`, `PortfolioFileUploader`. Move hooks to card-level `hooks/`. Create `submitPortfolioItem.controller.js` wrapping the submission flow.

---

### Settings

**Source:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/settings/`

- **Files:** 13 (~857 LOC)
- **Entry:** `VportSettingsFinalScreen.jsx`
- **Hooks:** `useSaveVportSettings.js` (129 lines), `useSaveVportPublicDetailsByActorId.js`
- **Controllers:** `saveVportPublicDetailsByActorId.controller.js` (85 lines)
- **DALs:** `vportPublicDetails.write.dal.js`
- **Models:** `vportSettingsDraft.model.js`, `vportSettingsValidation.model.js`

**Violations:**

1. **`useSaveVportSettings.js` is 129 lines and acts as a controller.** It internally coordinates 5+ hooks from different features: `useVportDashboardDetails`, `useVportAds`, `useVportDirectoryVisibility`, `useVportBusinessCardSettings`. A hook that coordinates other hooks across feature boundaries is a controller in disguise. It should be `settingsCoordinator.controller.js`.

2. **Settings domain is fragmented across 5+ features.** The screen imports from: `settings/adapters/ui/`, `settings/adapters/profile/ui/`, `settings/vports/hooks/` (3 hooks), `ads/adapters/hooks/`. There is no single source of truth for what constitutes "VPORT settings."

3. **Validation split.** `vportSettingsValidation.model.js` exists in the model layer, but validation logic is also present inside the hook. Two places own validation for the same domain.

4. **`VportSettingsScreen.jsx` imports from 10+ locations.** Tightly coupled to the current feature structure; any refactor of any of the 5 dependent features forces a settings screen change.

**Risk:** HIGH. This card writes to `vport.profile_public_details` — the public-facing VPORT identity table consumed by TRAZE, business cards, and QR landing pages. The coordinator hook pattern and scattered domain make it risky to change any single setting without potentially breaking others. This risk is compounded by the open VENOM-SETTINGS-002 finding (RLS missing on profile_public_details — CARNAGE pending).

**Estimated refactor effort:** 2–3 days. Create `settingsCoordinator.controller.js`. Consolidate settings domain into a single `vportSettings` feature boundary. Merge validation into model layer. Reduce screen imports to 3–4 max.

---

## Section D — Spaghetti

### Schedule

**Source:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/schedule/`

- **Files:** 12 (~1,183 LOC)
- **Entry:** `VportDashboardScheduleScreen.jsx` (150+ lines)
- **Hooks:** `useVportOwnerSchedule.js` (150 lines)
- **Controllers:** `loadDaySchedule.controller.js` (78 lines)
- **Components:** 7 schedule components (ScheduleGrid, TimeLabelsColumn, DayHeader, etc.)

**Violations:**

**1. CRITICAL — Direct cross-card controller imports.**

`apps/VCSM/src/features/dashboard/vport/dashboard/cards/schedule/hooks/useVportOwnerSchedule.js` lines 5–6:

```javascript
import { createOwnerBookingController } from
  "@/features/dashboard/vport/dashboard/cards/bookings/controller/createOwnerBooking.controller";
import { updateBookingStatusController, rescheduleBookingController } from
  "@/features/dashboard/vport/dashboard/cards/bookings/controller/updateVportBooking.controller";
```

A schedule hook directly imports controller files from the bookings card. This violates the module boundary contract. Cards must not import from other cards' internal controller or DAL layers. The schedule card now has a hidden compile-time dependency on the bookings card's internal structure — any renaming, splitting, or moving of booking controllers will silently break the schedule card.

**2. `useVportOwnerSchedule.js` is 150 lines with four unrelated responsibilities.**

- Lines 1–28: 7 state initializations + refs
- Lines 30–60: `loadSchedule()` — fetches day schedule via controller
- Lines 62–77: Modal open/close handlers (createModal + detailModal — two separate modal states with overlapping logic)
- Lines 79–110+: `submitCreateBooking()` — calls `createOwnerBookingController` imported from bookings card
- Lines 112+: Booking status update + reschedule handlers — again calling imported bookings controllers

This hook is simultaneously a data loader, a UI state coordinator, and a booking mutation orchestrator. Each of those is a separate responsibility.

**3. Modal state duplication.** `createModal` and `detailModal` are separate state objects but share overlapping open/close/submit logic. The two modal flows diverge only at the submit step, yet they are managed as fully separate state trees — requiring two separate sets of handlers.

**4. Callback chain depth.** `submitCreateBooking → createOwnerBookingController (from bookings card) → setScheduleData → loadSchedule → setScheduleData` — this chain requires understanding two card boundaries to trace a single user action.

**Risk:** HIGH. The schedule card and booking card are now semantically coupled at the source code level. Any refactor of booking controllers (TICKET-BOOKING-RPC-001 is open) will require simultaneous changes to schedule — and there is no test to catch the breakage.

**Estimated refactor effort:** 1 day, coordinated with TICKET-BOOKING-RPC-001.

**Recommended architecture:**
1. Create `scheduleBookingCoordinator.controller.js` inside the schedule card that imports from a published `booking.adapter` interface (not the booking card's internal controllers)
2. Split `useVportOwnerSchedule` into three hooks: `useScheduleData`, `useScheduleModals`, `useScheduleBookingOps`
3. Move the booking adapter exports to `cards/bookings/index.js` so the import path is `bookings` (public) not `bookings/controller/` (internal)

---

## Final Summary

| Category | Card | Reason |
|---|---|---|
| Best architected | **leads** | Textbook Screen → Hook → Controller → DAL chain; small files; single-responsibility throughout |
| Worst architected | **schedule** | Cross-card controller imports; 150-line multi-concern hook; SPAGHETTI classification |
| Most complex | **gas** | 42 files, 3,855 LOC, 5 controllers, 8 DALs, 7 hooks, 4 screens |
| Most maintainable | **reviews** | 80 LOC, zero violations, zero debt |
| Highest technical debt | **schedule** (55) followed by **settings** (50) | Both have structural issues that compound with future feature work |

---

## Top 10 Architectural Risks

| # | Risk | Card | Severity |
|---|---|---|---|
| 1 | Schedule imports booking controllers directly — compile-time cross-card coupling | schedule | CRITICAL |
| 2 | `submitFuelPriceSuggestion.controller.js` is 177 lines with dual owner/citizen path | gas | HIGH |
| 3 | `PortfolioItemForm.jsx` is 292 lines — god component; grows with each new VPORT kind | portfolio | HIGH |
| 4 | `useSaveVportSettings.js` is a 129-line controller disguised as a hook | settings | HIGH |
| 5 | Settings card writes to `vport.profile_public_details` table with no RLS confirmed (VENOM-SETTINGS-002 open — CARNAGE pending) | settings | HIGH |
| 6 | Hooks nested inside component subfolder (`components/portfolio/hooks/`) — violates layer contract | portfolio | MEDIUM |
| 7 | `useVportOwnerSchedule.js` is 150 lines managing 4 concerns (load + modal + booking create + booking update) | schedule | MEDIUM |
| 8 | Settings domain fragmented across 5+ features; 10+ imports in screen file | settings | MEDIUM |
| 9 | Exchange screen carries inline model functions (`normalizeCurrencyCode`, `toRatePairKey`, `toNumOrNull`, `formatPublishToast`) | exchange | MEDIUM |
| 10 | Gas card has 4 screens with naming ambiguity — DEFER-004 structural split still open | gas | LOW |

---

## Codebase Strengths (Confirmed)

- Clean DAL layer: read/write DALs properly separated across all cards
- Model-driven: most cards have focused model files for data transformation
- Consistent ownership pattern: `assertActorOwnsVportActorController` applied correctly throughout
- Clean module boundaries: `index.js` files export only hooks/components/screens in compliant cards
- No codebase-wide TODO/FIXME accumulation
- Test coverage present in the highest-risk cards (booking, team, leads)
