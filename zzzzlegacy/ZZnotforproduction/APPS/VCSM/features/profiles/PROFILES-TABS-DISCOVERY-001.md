# PROFILES-TABS-DISCOVERY-001
# Full Scale Profiles Tab Inventory — Citizen + VPORT

Generated: 2026-06-07
Status: COMPLETE
Scope: apps/VCSM/src/features/profiles
Goal: Full tab inventory for modularization sprint

---

## Architecture Summary

```
Profiles Feature Architecture
────────────────────────────

┌─ Citizen Profile (User Kind) ─────────────────────────────┐
│  ActorProfileViewScreen (main)                            │
│  └─ ActorProfileTabs (tab selector)                       │
│     ├─ Posts / Vibes [ActorProfilePostsView]              │
│     ├─ Photos [ActorProfilePhotosView]                    │
│     ├─ Videos [STUB - "Coming soon"]                      │
│     ├─ Tags [ActorProfileTagsView, citizen-only]          │
│     └─ Friends [ActorProfileFriendsView]                  │
└───────────────────────────────────────────────────────────┘

┌─ VPORT Profile (Vport Kind) ──────────────────────────────┐
│  VportProfileViewScreen (main)                            │
│  └─ VportProfileTabs (scrollable tab selector)            │
│  └─ getVportTabsByType (layout resolver)                  │
│     ├─ Type-specific override (e.g., barbershop)          │
│     ├─ Group default (e.g., Beauty & Wellness)            │
│     └─ Global fallback (VPORT_TABS)                       │
│                                                            │
│  VportProfileTabContent (conditional renderer)            │
│  ├─ Vibes [ActorProfilePostsView]                         │
│  ├─ Photos [ActorProfilePhotosView]                       │
│  ├─ Portfolio [VportPortfolioView]                        │
│  ├─ Services [VportServicesView]                          │
│  ├─ Book [VportBookingView | VportBarberShopBookingView]  │
│  ├─ Team [VportBarberShopTeamView, barbershop-only]       │
│  ├─ About [VportAboutView]                                │
│  ├─ Subscribers [VportSubscribersView]                    │
│  ├─ Reviews [VportReviewsView]                            │
│  ├─ Menu [VportMenuView, food-only]                       │
│  ├─ Content [VportContentView]                            │
│  ├─ Rates [VportRatesView, exchange-only]                 │
│  ├─ Gas [VportGasPricesView, gas-only]                    │
│  └─ Owner [VportOwnerView, owner-only]                    │
└───────────────────────────────────────────────────────────┘

Tab Resolution Flow (VPORT)
───────────────────────────
1. VportProfileKindScreen loads vportType (parallel fetch)
2. Calls getVportTabsByType(vportType)
   → Resolves TYPE_TABS (specific type override)
   → Falls back to GROUP_TABS (group default)
   → Falls back to global VPORT_TABS
3. Returns frozen array of tab objects
4. VportProfileViewScreen adds "owner" tab if isOwner
5. VportProfileTabs renders tab buttons
6. VportProfileTabContent renders active tab content
7. Tab-specific data loaded via hooks
```

---

## A. Citizen Profile Tabs

| Tab Name | Key | File | Component | Visibility | Data Source | Public/Owner | Conditional |
|----------|-----|------|-----------|------------|-------------|--------------|-------------|
| Posts (Vibes) | `posts` | ActorProfileViewScreen.jsx | ActorProfilePostsView | Public | useActorPosts | Public | Always shown by default |
| Photos | `photos` | ActorProfileViewScreen.jsx | ActorProfilePhotosView | Public | useActorPosts | Public | Conditional render |
| Videos | `videos` | ActorProfileViewScreen.jsx | **(STUB — no component)** | Public stub | N/A | Public | Shows "Coming soon..." |
| Tags | `tags` | ActorProfileViewScreen.jsx | ActorProfileTagsView | Citizen-only | useActorVibeTags | Owner-only edit | `isCitizenProfile === true` |
| Friends | `friends` | ActorProfileViewScreen.jsx | ActorProfileFriendsView | Public | useFriendLists | Public | Conditional render |

**Key files:**
- Tab selector: `apps/VCSM/src/features/profiles/screens/views/ActorProfileTabs.jsx`
- View components: `apps/VCSM/src/features/profiles/screens/views/ActorProfile*.jsx`
- Main screen: `apps/VCSM/src/features/profiles/screens/views/ActorProfileViewScreen.jsx`

---

## B. VPORT Profile Tabs

| Tab Name | Key | File | Component | Visibility | Data Source | Public/Owner | Conditional |
|----------|-----|------|-----------|------------|-------------|--------------|-------------|
| Vibes | `vibes` | VportProfileTabContent.jsx | ActorProfilePostsView | Public | useActorPosts | Public | Default display |
| Photos | `photos` | VportProfileTabContent.jsx | ActorProfilePhotosView | Public | useActorPosts | Public | `tab === "photos"` |
| Portfolio | `portfolio` | VportProfileTabContent.jsx | VportPortfolioView | Public | useVportPortfolio | Public | `tab === "portfolio"` |
| Services | `services` | VportProfileTabContent.jsx | VportServicesView | Public view / Owner edit | useVportServices (asOwner flag) | Public | `tab === "services"` |
| Book | `book` | VportProfileTabContent.jsx | VportBookingView or VportBarberShopBookingView | Public | useVportPublicBooking | Public view / Owner controls | `tab === "book"` + type check |
| Team | `team` | VportProfileTabContent.jsx | VportBarberShopTeamView | Barbershop-only | useVportPublicBooking | Public | `tab === "team" && vportType === "barbershop"` |
| About | `about` | VportProfileTabContent.jsx | VportAboutView | Public | useVportPublicDetails | Public | `tab === "about"` |
| Subscribers | `subscribers` | VportProfileTabContent.jsx | VportSubscribersView | Public | useSubscribers | Public | `tab === "subscribers"` |
| Reviews | `reviews` | VportProfileTabContent.jsx | VportReviewsView | Public view / Auth write | useVportReviews + useVportReviewCompose | Public | `tab === "reviews"` |
| Menu | `menu` | VportProfileTabContent.jsx | VportMenuView | Food-service only | useVportActorMenu | Public view / Owner edit | `tab === "menu"` |
| Content | `content` | VportProfileTabContent.jsx | VportContentView | Public view / Owner edit | useVportContentPages | Public | `tab === "content"` |
| Rates | `rates` | VportProfileTabContent.jsx | VportRatesView | Exchange/money only | useVportRates | Public view / Owner edit | `tab === "rates"` |
| Gas | `gas` | VportProfileTabContent.jsx | VportGasPricesView | Gas station only | useVportGasPrices | Public view / Owner edit | `tab === "gas"` |
| Owner | `owner` | VportProfileTabContent.jsx | VportOwnerView | **Owner-only** | N/A | Owner-only | `tab === "owner" && isOwner` |

**Key files:**
- Tab config: `apps/VCSM/src/features/profiles/config/profileTabs.config.js`
- Tab layout resolver: `apps/VCSM/src/features/profiles/kinds/vport/model/getVportTabsByType.model.js`
- Content router: `apps/VCSM/src/features/profiles/kinds/vport/screens/components/VportProfileTabContent.jsx`
- Tab selector: `apps/VCSM/src/features/profiles/kinds/vport/components/tabs/VportProfileTabs.jsx`
- Main screen: `apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx`
- Kind screen: `apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileKindScreen.jsx`

---

## C. Shared Profile Tabs (Used by Both Citizen and VPORT)

| Tab Name | Key | Component | Note |
|----------|-----|-----------|------|
| Vibes (Posts) | `vibes` / `posts` | ActorProfilePostsView | Reused for Vport social feed |
| Photos | `photos` | ActorProfilePhotosView | Reused for Vport photo gallery |

---

## D. Owner-Only Tabs

| Tab | Component | File | Condition |
|-----|-----------|------|-----------|
| Owner | VportOwnerView | `kinds/vport/screens/owner/VportOwnerView.jsx` | Dynamically added if `isOwner === true` |
| Content (edit) | VportContentView | `kinds/vport/screens/content/VportContentView.jsx` | Public view; edit restricted to owner via prop |
| Services (edit) | VportServicesView | `kinds/vport/screens/services/view/VportServicesView.jsx` | Public view; edit via `allowOwnerEditing` prop |
| Menu (edit) | VportMenuView | `kinds/vport/screens/menu/VportMenuView.jsx` | Public view; edit internal to component |
| Reviews (compose) | VportReviewsView | `kinds/vport/screens/review/VportReviewsView.jsx` | Compose via `useVportReviewCompose` (auth-gated) |
| Booking (owner controls) | VportBookingView | `kinds/vport/screens/booking/view/VportBookingView.jsx` | Public view; owner controls via `isOwner` prop |
| Gas (edit) | VportGasPricesView | via vportDashboard adapter | Public view; edit via `useSubmitFuelPriceSuggestion` |
| Rates (edit) | VportRatesView | `kinds/vport/screens/rates/view/VportRatesView.jsx` | Public view; edit via `isOwner` prop |

---

## E. Public Tabs (Visible to Any Viewer)

1. Vibes (Posts feed) — always public
2. Photos — always public
3. About — always public
4. Subscribers — always public
5. Reviews — always public (compose requires auth)
6. Portfolio — always public when present in layout
7. Services — always public (edit owner-only)
8. Menu — always public when present in layout (food-service only)
9. Content — always public (edit owner-only)
10. Book — always public (owner controls availability)
11. Team — always public (barbershop-only)
12. Rates — always public (edit owner-only)
13. Gas — always public (edit owner-only)

---

## F. Hidden / Conditional Tabs

### VPORT — Type-Specific Tabs

| Tab | Condition | Applies To |
|-----|-----------|------------|
| Team | `vportType === "barbershop"` | Barbershop only |
| Menu | Included in `VPORT_FOOD_TABS` | Food, Hospitality & Events |
| Book | Included in `VPORT_SERVICE_BOOK_TABS`, `VPORT_BARBER_TABS`, etc. | Multiple service categories |
| Portfolio | Included in multiple layouts | Creative, Service, Trades, etc. |
| Rates | Included in `VPORT_RATES_TABS` | Exchange/Money type override |
| Gas | Included in `VPORT_GAS_TABS` | Gas station type override |
| Services | Included in most service layouts | Most types except basic vports |

### Citizen — Conditional Tabs

| Tab | Condition |
|-----|-----------|
| Tags | `includeTags === true` (explicit prop) |
| Videos | Always present; shows stub "Coming soon..." |

### Dynamic Tab List Adjustments

- **Owner Tab Addition (VPORT)**: Added to `effectiveTabs` array if `isOwner === true`
- **Tab Filtering by Type**: Resolved via `getVportTabsByType(vportType)` → TYPE override → GROUP default → global fallback

---

## G. Dead / Stale Tabs

| Tab | Status | Evidence |
|-----|--------|----------|
| Videos (citizen) | **STALE** | Renders "Coming soon..." string literal. No `ActorProfileVideosView.jsx` exists. File: `ActorProfileViewScreen.jsx` lines ~210–214 |

No other stale tabs detected in primary rendering paths.

---

## H. Missing Adapter Exports

| Tab | Component File | Adapter Status |
|-----|----------------|----------------|
| About | VportAboutView.jsx | NOT EXPORTED via profiles adapter |
| Subscribers | VportSubscribersView.jsx | NOT EXPORTED via profiles adapter |
| Portfolio | VportPortfolioView.jsx | NOT EXPORTED via profiles adapter |
| Content | VportContentView.jsx | NOT EXPORTED via profiles adapter |
| Menu | VportMenuView.jsx | NOT EXPORTED via profiles adapter |
| Booking | VportBookingView.jsx | NOT EXPORTED via profiles adapter |
| Team | VportBarberShopTeamView.jsx | NOT EXPORTED via profiles adapter |
| Owner | VportOwnerView.jsx | NOT EXPORTED via profiles adapter |
| Gas | VportGasPricesView | **EXPORTED** via vportDashboard adapter |
| Rates | VportRatesView.jsx | **EXPORTED** via profiles adapter |
| Reviews | VportReviewsView.jsx | **EXPORTED** via profiles adapter |
| Services | VportServicesView.jsx | **EXPORTED** via profiles adapter |

**Score: 4 of 12 tab views exported via adapter. 8 missing.**

---

## I. Tabs with Direct Internal Imports (Not Via Adapter)

`VportProfileTabContent.jsx` directly imports from internal vport feature folders:

```
VportProfileTabContent.jsx (direct imports)
├─ ActorProfilePostsView      (social posts — reuse OK)
├─ ActorProfilePhotosView     (photos — reuse OK)
├─ VportAboutView             ← direct, NOT exported via adapter
├─ VportSubscribersView       ← direct, NOT exported via adapter
├─ VportReviewsView           ← direct import; re-exported separately
├─ VportMenuView              ← direct, NOT exported via adapter
├─ VportPortfolioView         ← direct, NOT exported via adapter
├─ VportServicesView          ← direct import; re-exported separately
├─ VportBookingView           ← direct, NOT exported via adapter
├─ VportContentView           ← direct, NOT exported via adapter
├─ VportBarberShopTeamView    ← direct, NOT exported via adapter
├─ VportRatesView             ← direct import; re-exported separately
├─ VportOwnerView             ← direct, NOT exported via adapter
└─ VportGasPricesView         ← imported from vportDashboard adapter (cross-feature)
```

11 of 14 VPORT tab view components are NOT exported via the profiles adapter.

---

## J. Recommended Cleanup / Fix Tickets (Modularization Sprint)

### P0 — Blocker for Modularization

**[TABS-001] Create adapter export for every VPORT tab view**
- What: Create `adapters/kinds/vport/screens/vportTabViews.adapter.js`; export all 8 missing tab views
- Why: VportProfileTabContent.jsx cannot be modularized if tabs import directly from internal folders
- Files: VportAboutView, VportSubscribersView, VportMenuView, VportPortfolioView, VportBookingView, VportContentView, VportBarberShopTeamView, VportOwnerView
- Effort: Low (re-exports only, no logic change)

**[TABS-002] Modularize VportProfileTabContent.jsx — one file per tab**
- What: Split monolithic conditional renderer into per-tab modules
- Why: Single file renders 14 tabs via if/else chain; impossible to tree-shake or test individually
- Pattern: `kinds/vport/tabs/about/VportAboutTab.jsx`, `kinds/vport/tabs/reviews/VportReviewsTab.jsx`, etc.
- Each tab module: imports its own view component, hook, and adapter
- Central router: thin `VportProfileTabRouter.jsx` maps tab key → tab module
- Effort: Medium (no logic changes; structural only)

**[TABS-003] Modularize ActorProfileTabs — one file per citizen tab**
- What: Split citizen tab views into `kinds/citizen/tabs/posts/`, `kinds/citizen/tabs/photos/`, etc.
- Why: Parallel structure to VPORT; citizen tabs are inlined in ActorProfileViewScreen.jsx
- Effort: Low-Medium

**[TABS-004] Delete stale Videos tab stub or implement it**
- What: Either create `ActorProfileVideosView.jsx` or remove the Videos tab from `ActorProfileTabs.jsx`
- Why: Shows "Coming soon..." with no implementation — dead UX
- Decision: Product call; if removing, clean tab config entry too
- Effort: Low

### P1 — Architecture Improvements

**[TABS-005] Create unified tab metadata registry**
- What: Single source of truth for tab key, label, component ref, kind, public/owner, type conditions
- Why: Metadata is scattered across `profileTabs.config.js`, `getVportTabsByType.model.js`, and `VportProfileTabContent.jsx`
- Target: `config/tabRegistry.config.js`
- Effort: Medium

**[TABS-006] Create type-safe TAB_KEY constants**
- What: Export `TAB_KEY = { VIBES: 'vibes', PHOTOS: 'photos', ... }` from tab config
- Why: String literal tab keys scattered across files; typos fail silently
- Effort: Low

**[TABS-007] Deprecate and delete vportTypeRegistry.js**
- What: File is marked DEPRECATED (pending deletion: DTAB-001); confirm getVportTabsByType.model.js is canonical and remove the registry
- File: `kinds/vport/vportTypeRegistry.js`
- Effort: Low

**[TABS-008] Create citizen profile kinds folder**
- What: Create `kinds/citizen/` parallel to `kinds/vport/` for all citizen profile logic
- Why: Citizen tabs live under `screens/views/` with no `kinds/citizen/` structure; asymmetric
- Effort: Low (move files, update imports)

### P2 — Quality

**[TABS-009] Add test: tab key uniqueness per kind**
- What: Test that no two tabs in the same layout share the same key
- File: `config/profileTabs.config.test.js`
- Effort: Low

**[TABS-010] Document type-to-tab mapping in getVportTabsByType.model.js**
- What: Add header table showing which vportType maps to which tab layout
- Why: Currently only derivable by reading the entire model file
- Effort: Low

---

## K. Validation Summary

| Check | Result | Notes |
|-------|--------|-------|
| Every tab has a source file | YES (with exception) | Videos tab has no component file |
| Every tab has a rendered component | YES (with exception) | Videos renders a string literal, not a component |
| Every tab has a visibility rule | YES | VPORT: layout arrays + type conditions; Citizen: hardcoded + `includeTags` flag |
| Duplicate tab keys | NONE FOUND | Keys are unique within citizen vs. vport |
| Stale tabs pointing to deleted files | 1 FOUND | Videos stub in citizen profile |
| Missing adapter exports | 8 of 12 VPORT tab views | See Section H |

---

## L. Full File Inventory

### Configuration
- `apps/VCSM/src/features/profiles/config/profileTabs.config.js`
- `apps/VCSM/src/features/profiles/kinds/vport/model/getVportTabsByType.model.js`

### Citizen Profile
- `apps/VCSM/src/features/profiles/screens/views/ActorProfileTabs.jsx`
- `apps/VCSM/src/features/profiles/screens/views/ActorProfileViewScreen.jsx`
- `apps/VCSM/src/features/profiles/screens/views/ActorProfilePostsView.jsx`
- `apps/VCSM/src/features/profiles/screens/views/ActorProfilePhotosView.jsx`
- `apps/VCSM/src/features/profiles/screens/views/ActorProfileTagsView.jsx`
- `apps/VCSM/src/features/profiles/screens/views/ActorProfileFriendsView.jsx`

### VPORT Profile — Screens
- `apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileKindScreen.jsx`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/components/VportProfileTabContent.jsx`
- `apps/VCSM/src/features/profiles/kinds/vport/components/tabs/VportProfileTabs.jsx`

### VPORT Profile — Tab View Components
- `apps/VCSM/src/features/profiles/kinds/vport/screens/views/tabs/VportAboutView.jsx`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/views/tabs/VportBookingView.jsx`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/views/tabs/VportContentView.jsx`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/views/tabs/VportMenuView.jsx`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/views/tabs/VportPortfolioView.jsx`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/views/tabs/VportReviewsView.jsx`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/views/tabs/VportSubscribersView.jsx`

### VPORT Profile — Tab Implementations
- `apps/VCSM/src/features/profiles/kinds/vport/screens/services/view/VportServicesView.jsx`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/review/VportReviewsView.jsx`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/booking/view/VportBookingView.jsx`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/barbershop/VportBarberShopTeamView.jsx`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/barbershop/VportBarberShopBookingView.jsx`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/menu/VportMenuView.jsx`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/content/VportContentView.jsx`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/owner/VportOwnerView.jsx`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/portfolio/view/VportPortfolioView.jsx`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/rates/view/VportRatesView.jsx`

### Adapters (Partial)
- `apps/VCSM/src/features/profiles/adapters/kinds/vport/screens/review/VportReviewsView.adapter.js`
- `apps/VCSM/src/features/profiles/adapters/kinds/vport/screens/services/view/VportServicesView.adapter.js`
- `apps/VCSM/src/features/profiles/adapters/kinds/vport/screens/rates/view/VportRatesView.adapter.js`
- `apps/VCSM/src/features/profiles/adapters/kinds/vport/screens/gas/VportGasPricesView.adapter.js`

### Deprecated
- `apps/VCSM/src/features/profiles/kinds/vport/vportTypeRegistry.js` — MARKED DEPRECATED (pending DTAB-001)
