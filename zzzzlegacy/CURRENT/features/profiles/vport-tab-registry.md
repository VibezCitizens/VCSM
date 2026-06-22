# VPORT Tab Registry

**Last Updated:** 2026-05-27
**Source of Truth:** `features/profiles/config/profileTabs.config.js` + `features/profiles/kinds/vport/model/getVportTabsByType.model.js`

---

## 1. Canonical Tab Definitions

All tabs registered in `profileTabs.config.js`. Key is the canonical slug used everywhere.

| Key | Display Label | i18n Key | Tab Flag | Status |
|---|---|---|---|---|
| `about` | About | `vport.tabs.about` | — (no flag) | ACTIVE |
| `book` | Book | `vport.tabs.book` | `TAB_FLAGS.BOOK` | ACTIVE |
| `content` | Content | `vport.tabs.content` | — | ACTIVE |
| `gas` | Gas Prices | `vport.tabs.gas` | — | ACTIVE |
| `menu` | Menu | `vport.tabs.menu` | — | ACTIVE |
| `owner` | Owner | `vport.tabs.owner` | — | ACTIVE (owner-only, injected) |
| `photos` | Photos | `vport.tabs.photos` | — | ACTIVE |
| `portfolio` | Portfolio | `vport.tabs.portfolio` | `TAB_FLAGS.PORTFOLIO` | ACTIVE |
| `rates` | Rates | `vport.tabs.rates` | `TAB_FLAGS.RATES` | ACTIVE |
| `reviews` | Reviews | `vport.tabs.reviews` | — | ACTIVE |
| `services` | Services | `vport.tabs.services` | `TAB_FLAGS.SERVICES` | ACTIVE |
| `subscribers` | Subscribers | `vport.tabs.subscribers` | — | ACTIVE |
| `team` | Team | `vport.tabs.team` | — | ACTIVE |
| `vibes` | Vibes | `vport.tabs.vibes` | — | ACTIVE |
| `contact` | Contact | `vport.tabs.contact` | — | NOT_STARTED (planned) |
| `gallery` | Gallery | `vport.tabs.gallery` | — | NOT_STARTED (maps to photos) |

---

## 2. Tab Feature Flags

Defined in `profileTabs.config.js` as `TAB_FLAGS`:

```js
export const TAB_FLAGS = {
  SERVICES: true,
  RATES: true,
  PORTFOLIO: true,
  BOOK: true,
};
```

- Setting any flag to `false` removes the tab from **all** presets globally at render time
- No per-type feature flags exist — these are global kill switches
- `undefined` keys are treated as enabled (no flag = always shown if in preset)

**Risk:** A single `TAB_FLAGS.BOOK = false` change would remove booking from all 77 vport types simultaneously. No per-type granularity.

---

## 3. Tab Layout Presets (Ordered)

### 3.1 Type-Level Overrides (Exact match on `vport.kind`)

| Preset Name | Types | Tab Order |
|---|---|---|
| `VPORT_BARBER_TABS` | barber, locksmith | portfolio → book → services → reviews → content → about → photos → vibes → subscribers |
| `VPORT_BARBERSHOP_TABS` | barbershop | portfolio → book → team → services → reviews → about → photos → vibes → content → subscribers |
| `VPORT_GAS_TABS` | gas station | **gas** → services → content → about → reviews → photos → vibes → subscribers |
| `VPORT_RATES_TABS` | exchange, money exchange | **rates** → services → content → reviews → about → photos → vibes → subscribers |

### 3.2 Group-Level Defaults (Category fallback)

| Preset Name | Category | Tab Order |
|---|---|---|
| `VPORT_CREATIVE_TABS` | Arts, Media & Entertainment | portfolio → vibes → content → reviews → services → about → photos → subscribers |
| `VPORT_SERVICE_BOOK_TABS` | Beauty & Wellness; Education & Care; Sports & Fitness; Animal Care | portfolio → book → services → reviews → about → photos → vibes → subscribers |
| `VPORT_FOOD_TABS` | Food, Hospitality & Events | menu → reviews → content → about → services → photos → vibes → subscribers |
| `VPORT_HEALTH_TABS` | Health & Medical | book → services → reviews → about → photos → subscribers |
| `VPORT_TRADES_TABS` | Home, Maintenance & Trades | portfolio → services → book → reviews → about → photos → subscribers |
| `VPORT_SERVICE_TABS` | Professional & Business Services; Transport & Logistics | portfolio → services → reviews → content → about → vibes → photos → subscribers |
| `VPORT_RETAIL_TABS` | Retail, Sales & Commerce | services → reviews → about → photos → vibes → subscribers |
| `VPORT_TABS` | Other / Global fallback | about → reviews → content → vibes → photos → subscribers |

### 3.3 Special: Gas Tab Position Rule

The `gas` tab is **always reordered to the first position** regardless of its position in the preset array. This is enforced in `getVportTabsByType.model.js` via:

```js
const gasTab = tabs.find(t => t.key === 'gas');
const rest = tabs.filter(t => t.key !== 'gas');
return gasTab ? [gasTab, ...rest] : tabs;
```

---

## 4. Owner Tab Injection

The `owner` tab is **not in any preset array**. It is dynamically injected at runtime:

```js
// VportProfileViewScreen.jsx
if (isOwner) {
  if (baseTabs.some((t) => t.key === "owner")) return baseTabs;
  return [...baseTabs, { key: "owner", label: "Owner" }];
}
return baseTabs.filter((t) => t.key !== "owner");
```

- Always appended last
- Never visible to non-owners
- Not present in `TAB_FLAGS`

---

## 5. Type → Tabs Resolution Matrix

Which tabs appear on which vport types (first tab = landing tab):

| Tab | barber | barbershop | locksmith | gas station | exchange | restaurant | baker/chef | other food | creative | beauty | health | trades | professional | retail | other |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `about` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `book` | ✓¹ | ✓² | ✓¹ | — | — | — | — | — | — | ✓ | ✓ | ✓ | — | — | — |
| `content` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — | ✓ | — | ✓ |
| `gas` | — | — | — | **①** | — | — | — | — | — | — | — | — | — | — | — |
| `menu` | — | — | — | — | — | ✓ | ✓ | ✓ | — | — | — | — | — | — | — |
| `owner` | ✓³ | ✓³ | ✓³ | ✓³ | ✓³ | ✓³ | ✓³ | ✓³ | ✓³ | ✓³ | ✓³ | ✓³ | ✓³ | ✓³ | ✓³ |
| `photos` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| `portfolio` | **①** | **①** | **①** | — | — | — | — | — | **①** | **①** | — | **①** | **①** | — | — |
| `rates` | — | — | — | — | **①** | — | — | — | — | — | — | — | — | — | — |
| `reviews` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `services` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| `subscribers` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `team` | — | ✓ | — | — | — | — | — | — | — | — | — | — | — | — | — |
| `vibes` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | ✓ |

**Legend:**
- **①** = Landing tab (first in preset)
- ✓ = Present in preset
- ✓¹ = Barber-specific booking view (`VportBookingView`)
- ✓² = Barbershop-specific booking view (`VportBarberShopBookingView`) with team-aware scheduling
- ✓³ = Owner-only, dynamically injected, always last

---

## 6. Conditional Tab Rendering Rules

### 6.1 Barbershop Booking Specialization

```js
// VportProfileTabContent.jsx
{tab === "book" && vportType === "barbershop" && (
  <VportBarberShopBookingView ... />
)}
{tab === "book" && vportType !== "barbershop" && (
  <VportBookingView ... />
)}
```

The `book` tab renders two entirely different view components depending on vport type. This is a **conditional content injection**, not a separate tab key.

### 6.2 Owner Tab Injection (runtime)

The `owner` tab key does not exist in any static preset. It is appended by `VportProfileViewScreen` only when `isOwner === true`.

### 6.3 Privacy Gate (before tabs render)

If `gate.canView === false` (private profile + not subscriber/follower), the entire tab system is replaced by `<PrivateProfileNotice />`. No individual tab gate — the entire profile is blocked.

### 6.4 Global Feature Flag Kill

`TAB_FLAGS` in `profileTabs.config.js` can globally disable SERVICES, RATES, PORTFOLIO, or BOOK across all types.

---

## 7. Duplicate / Legacy Systems

| Item | Issue | Risk |
|---|---|---|
| `vportTypeRegistry.js` | Legacy tab registry that duplicates logic from `getVportTabsByType.model.js` | MEDIUM — two sources of truth; drift risk |
| `model/gas/getVportTabsByType.model.js` | Redirect shim pointing to the main model | LOW — exists as path alias, not true logic |

---

## 8. Tab → Source File Map

| Tab | View Component | Source Path |
|---|---|---|
| `about` | `VportAboutView` | `screens/views/tabs/VportAboutView.jsx` |
| `book` (generic) | `VportBookingView` | `screens/booking/view/VportBookingView.jsx` |
| `book` (barbershop) | `VportBarberShopBookingView` | `screens/barbershop/VportBarberShopBookingView.jsx` |
| `content` | `VportContentView` | `screens/content/VportContentView.jsx` |
| `gas` | `VportGasPricesView` | `screens/gas/view/VportGasPricesView.jsx` |
| `menu` | `VportMenuView` | `screens/menu/VportMenuView.jsx` |
| `owner` | `VportOwnerView` | `screens/owner/VportOwnerView.jsx` |
| `photos` | _(inline or gallery component)_ | TBD — confirm in tab audit |
| `portfolio` | `VportPortfolioView` | `screens/portfolio/view/VportPortfolioView.jsx` (via adapter) |
| `rates` | `VportRatesView` | `screens/rates/view/VportRatesView.jsx` |
| `reviews` | `VportReviewsView` | `screens/review/VportReviewsView.jsx` |
| `services` | `VportServicesView` | `screens/services/view/VportServicesView.jsx` |
| `subscribers` | `VportSubscribersView` | `screens/views/tabs/VportSubscribersView.jsx` |
| `team` | `VportBarberShopTeamView` | `screens/barbershop/VportBarberShopTeamView.jsx` |
| `vibes` | _(feed component)_ | TBD — confirm in tab audit |

---

## 9. Registered Cross-Feature Adapters

Adapter paths bridging `profiles/` to other features (boundary contract compliant):

| Adapter Path | Purpose |
|---|---|
| `features/profiles/adapters/kinds/vport/screens/rates/` | Rates tab → exchange rate module |
| `features/profiles/adapters/kinds/vport/screens/review/` | Reviews tab → reviews engine |
| `features/profiles/adapters/kinds/vport/screens/services/` | Services tab → services feature |
| `features/profiles/adapters/kinds/vport/screens/gas/` | Gas tab → gas prices feature |

**Gaps (not yet confirmed — require ARCHITECT audit):**
- `booking/` adapter — does the book tab use an adapter or import booking internals directly?
- `portfolio/` adapter — does portfolio view go through adapter boundary?
- `menu/` adapter — is menu view adapter-wrapped?
- `team/` adapter — does team view cross feature boundaries?
