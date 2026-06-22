# VCSM VPort Kinds — Architecture Map

_Basis: code inspection of `apps/VCSM/src/features/profiles/kinds/vport/` and `apps/VCSM/src/features/dashboard/vport/screens/` — 2026-05-10_

## 1. Purpose

Single reference for understanding what every vport kind has built, which layer tier it sits in, what tab config it uses, what dashboard screens exist for it, and how to reason about adding a new kind or extending an existing one.

---

## 2. Kind Inventory

11 distinct implementation kinds exist inside `features/profiles/kinds/vport/`. These are not the same as the 48 vport type strings — they are the kinds for which dedicated code exists.

| Kind | DAL files | Controllers | Hooks | Model | Public screens | Dashboard screen | Adapter |
|---|---|---|---|---|---|---|---|
| **gas** | 8 | 5 | 4 | 4 | ✓ rich (`screens/gas/`) | `VportDashboardGasScreen` | ✓ gas-specific |
| **menu** | 13 | 6 | 4 | 3 | ✓ rich (`screens/menu/`) | — | — |
| **content** | 9 | 9 | implicit | 1 | ✓ rich (`screens/content/`) | — | — |
| **services** | 5 | 5 | 5 | 2 | ✓ (`screens/services/`) | `VportDashboardServicesScreen` | ✓ |
| **review** | 3 | 2 | 3 | 1 | ✓ (`screens/review/`) | `VportDashboardReviewScreen` | ✓ |
| **rates** | 3 | 2 | 2 | 1 | ✓ (`screens/rates/`) | — | ✓ |
| **barbershop** | 1 | 2 | 2 | — | via shared tabs | `BarberTeamRequestsScreen` | — |
| **locksmith** | 6 | 8 | 4 | 1 | via shared tabs | `VportDashboardLocksmithScreen` | — |
| **exchange** | 1 | 1 | 1 | — | — | `VportDashboardExchangeScreen` | — |
| **subscribers** | 2 | 1 | 1 | — | — | — | — |
| **portfolio** | — | 1 | 1 | 3 | ✓ (`screens/portfolio/`) | `VportDashboardPortfolioScreen` | — |

> `portfolio`, `review`, `services`, and `subscribers` are cross-kind features available to all vports, not dedicated business categories. They appear in this table because they have isolated code under `kinds/vport/`.

DAL and controller counts for locksmith include the 3 feed-share controllers and the new `vportLocksmithPost.read.dal.js` built 2026-05-10.

---

## 3. Maturity Tiers

### Tier 1 — Full Kind

Has dedicated DAL + controller + hook + model layers AND kind-specific public profile screens under `screens/{kind}/`.

| Kind | Distinguishing feature |
|---|---|
| **gas** | Custom `VPORT_GAS_TABS`, `GasPricesPanel`, owner submission review workflow, fuel unit management |
| **menu** | Deep CRUD (13 DALs), category + item hierarchy, media-per-item, owner editor |
| **content** | CMS-like system: pages, templates, publish/unpublish, viewer access control |

These three are the most complete. They have rich owner dashboards baked into their public profile screens (owner mode rendered inside the profile view, not a separate dashboard screen).

### Tier 2 — Functional Kind

Has DAL + controller + hook layers. Public profile surface reuses shared tabs. Has a dedicated dashboard screen for owner management.

| Kind | What makes it work |
|---|---|
| **locksmith** | 5 DALs for service areas, service details, portfolio details. Dedicated dashboard for area CRUD. Feed-share for 3 post types. Reuses `VPORT_BARBER_TABS`. |
| **barbershop** | Feed-share for 2 post types. Dedicated team requests screen. Reuses own `VPORT_BARBERSHOP_TABS`. |
| **exchange** | Thin publish controller for FX rate posts. Dashboard for rate entry. Reuses `VPORT_RATES_TABS`. |

### Tier 3 — Feature Module

Not a business category. Provides a capability used by multiple kinds. Lives under `kinds/vport/` because it is vport-scoped.

| Kind | Scope |
|---|---|
| **services** | Service catalog (addons, ordering, toggle). Used by all service-type vports. |
| **review** | Review submission + dimension display. Used by all vports with reviews tab. |
| **rates** | Rate card upsert + display. Used by exchange and any rates-enabled vport. |
| **subscribers** | Subscriber count + list. Used by all vports. |
| **portfolio** | Portfolio items + media + tags. Used by barbershop, locksmith, creative, and trades vports. |

---

## 4. Tab Configuration Per Kind

Tab layouts are resolved by `getVportTabsByType.model.js` via a 3-tier lookup (TYPE_TABS → GROUP_TABS → fallback). Full reference: `vcsm.vport.tab-classification.md`.

| Kind / group | Tab layout | First tab |
|---|---|---|
| gas station | `VPORT_GAS_TABS` | Gas |
| exchange | `VPORT_RATES_TABS` | Rates |
| barber | `VPORT_BARBER_TABS` | Portfolio |
| barbershop | `VPORT_BARBERSHOP_TABS` | Portfolio |
| locksmith | `VPORT_BARBER_TABS` | Portfolio |
| restaurant, caterer | `VPORT_FOOD_BOOK_TABS` | Menu |
| Arts, Media & Entertainment | `VPORT_CREATIVE_TABS` | Portfolio |
| Beauty & Wellness | `VPORT_SERVICE_BOOK_TABS` | Portfolio |
| Home, Maintenance & Trades | `VPORT_TRADES_TABS` | Portfolio |
| Health & Medical | `VPORT_HEALTH_TABS` | Book |
| Professional & Business | `VPORT_SERVICE_TABS` | Portfolio |
| Retail, Sales & Commerce | `VPORT_RETAIL_TABS` | Services |
| Food, Hospitality & Events | `VPORT_FOOD_TABS` | Menu |
| Other | `VPORT_TABS` (fallback) | About |

Locksmith currently shares `VPORT_BARBER_TABS` — this is intentional for now. A dedicated `VPORT_LOCKSMITH_TABS` would be needed only if the tab order or set needs to differ from barber.

---

## 5. Dashboard Screens

All screens at `features/dashboard/vport/screens/`. Kind-specific screens (marked ★) are the ones created per-business-type.

| Screen | Kind-specific | Purpose |
|---|---|---|
| `VportDashboardScreen.jsx` | No | Main dashboard entry, card grid |
| `VportDashboardCalendarScreen.jsx` | No | Availability grid, working hours, feed-share (barbershop + locksmith) |
| `VportDashboardPortfolioScreen.jsx` | No | Portfolio CRUD — create/edit items, upload media |
| `VportDashboardServicesScreen.jsx` | No | Service catalog editor (toggle, edit, reorder) |
| `VportDashboardReviewScreen.jsx` | No | Review reading with owner filters |
| `VportDashboardTeamScreen.jsx` | No | Team member management |
| `VportDashboardLeadsScreen.jsx` | No | Lead management (cross-kind) |
| `VportDashboardBookingHistoryScreen.jsx` | No | Booking history |
| `VportDashboardScheduleScreen.jsx` | No | Schedule view |
| `VportSettingsScreen.jsx` | No | Profile settings |
| `VportDashboardGasScreen.jsx` | ★ gas | Fuel price editor, suggestion review, unit settings |
| `VportDashboardExchangeScreen.jsx` | ★ exchange | FX rate pair editor, publish rate post |
| `VportDashboardLocksmithScreen.jsx` | ★ locksmith | Service area CRUD, service details display, quick stats |
| `BarberTeamRequestsScreen.jsx` | ★ barbershop | Barber team join requests |

---

## 6. Adapter Strategy

Adapters exist only where the consuming surface is complex enough to need props/hook reshaping. Most kinds do not need adapters.

| Adapter location | Purpose | Used by |
|---|---|---|
| `adapters/profiles.adapter.js` | Re-exports key hooks for cross-feature consumption | Shared cross-feature boundary |
| `kinds/vport/config/vportTypes.config.adapter.js` | Re-exports type groups + resolveServiceCatalog | Profile routing |
| `hooks/gas/*.adapter.js` | Gas price hook adaptations (read, suggestions, owner review) | Gas dashboard + gas price panels |
| `hooks/rates/*.adapter.js` | Rate upsert hook adaptation | Rates view |
| `hooks/services/*.adapter.js` | Service upsert hook adaptation | Services view |
| `screens/gas/components/*.adapter.js` | Gas panel component prop bridges | Gas tab view |
| `screens/rates/*.adapter.js` | Rates view adapter | Rates tab |
| `screens/review/*.adapter.js` | Reviews view adapter | Reviews tab |
| `screens/services/*.adapter.js` | Services view adapter | Services tab |

**Rule of thumb:** Adapters appear when a hook or component is consumed across different contexts with different prop shapes. Barbershop, locksmith, and exchange have no adapters because their owner surfaces are simple enough to wire directly.

---

## 7. Feed-Share Coverage

Two kinds currently implement the opt-in feed-share system (owner checkbox → public system post):

| Kind | Post types | Checkbox surfaces |
|---|---|---|
| **barbershop** | `barbershop_hours_update`, `barbershop_portfolio_update` | CalendarScreen (hours), PortfolioItemForm (portfolio create) |
| **locksmith** | `locksmith_service_area_update`, `locksmith_hours_update`, `locksmith_portfolio_update` | LocksmithScreen (areas), CalendarScreen (hours), PortfolioItemForm (portfolio create) |

Gas station, exchange, and menu auto-publish system posts without a checkbox. The gas dashboard publishes `fuel_price_update` on owner confirm; exchange publishes `exchange_rate_update` on rate save; menu publishes `menu_update` on item save. These do not expose a shareToFeed toggle.

Full contract: `vcsm.feed.post-pipeline.md` Section 19.

---

## 8. Public Profile Screen Architecture

Kind-specific views live under `features/profiles/kinds/vport/screens/`:

```
screens/
├── VportProfileViewScreen.jsx      — main vport profile route entry
├── VportProfileKindScreen.jsx      — kind-based routing
├── components/                     — shared profile shell components
├── views/tabs/                     — per-tab views (About, Book, Content, Gas, Menu, Portfolio, Rates, Reviews, Services, Subscribers)
├── gas/                            — gas-specific components (price board, suggestion UI, history)
├── menu/                           — menu-specific components (category/item editor, public menu display)
├── content/                        — content-specific components (page editor, viewer, publish controls)
├── barbershop/                     — barbershop booking + team views
├── booking/                        — booking flow (calendar, date picker, confirm, QR)
├── portfolio/                      — portfolio grid + modal + transformations (cross-kind)
├── rates/                          — rate card editor + display
├── review/                         — review composition + list
├── services/                       — service catalog display + owner editor
└── owner/                          — owner info band (cross-kind)
```

Locksmith has no `screens/locksmith/` directory. All locksmith-specific public profile rendering happens inside `views/tabs/VportAboutView.jsx` (service areas section) via the `isLocksmith` branch. This is the correct approach for a Tier 2 kind — the complexity does not justify a dedicated screen directory yet.

---

## 9. What a "Full Kind" Requires

If locksmith were to grow to Tier 1 parity with gas, the additions would be:

1. `screens/locksmith/` — dedicated public profile components for service area map, emergency coverage display, ETA grid
2. `VPORT_LOCKSMITH_TABS` — own tab layout in `profileTabs.config.js` if tab order or set diverges from barber
3. `TYPE_TABS` entry in `getVportTabsByType.model.js` pointing to the new layout
4. Adapter layer if the locksmith components need cross-context prop reshaping

None of these are required today. Locksmith is correctly built for its current scope.

---

## 10. Adding a New Kind — Checklist

When a new vport business type needs kind-specific code:

1. **Confirm the type string** is in `VPORT_TYPE_GROUPS` in `vportTypes.config.js` and matches the DB constraint
2. **Build in layer order:** DAL → Model → Controller → Hook → Component → View → Dashboard Screen
3. **DAL:** explicit column selects only, no `select('*')`, use `@/` imports
4. **Tab layout:** determine if the group default is sufficient or a TYPE_TABS override is needed
5. **Dashboard:** create `VportDashboard{Kind}Screen.jsx` following the shell pattern (`useParams` → `useIdentity` → `isOwner` gate → `createVportDashboardShellStyles` → optional `createPortal`)
6. **Public profile:** decide if a `screens/{kind}/` directory is needed or if `VportAboutView` branch logic is sufficient
7. **Feed-share (optional):** follow the barbershop/locksmith pattern — DAL dedup + controller + hook + owner checkbox
8. **Adapter (optional):** only if the hook or component needs prop reshaping for cross-context use
9. **Logan:** create `vcsm.vport.{kind}-profile-spec.md` documenting public profile goal, tabs, dashboard sections, data model, and any implementation notes

---

## 11. Change Log

### 2026-05-10

Task: Create vport kinds architecture map from code survey  
Code Status Before: No document existed mapping all 11 kinds, their layer coverage, maturity tiers, tab configs, and dashboard screens  
Summary: Full document written from code inspection. Covers 11 kinds, 3 maturity tiers, tab resolution reference, dashboard screen inventory, adapter strategy, feed-share coverage, public profile screen architecture, checklist for adding new kinds.  
Files Changed: (documentation only — this file)  
Validation: Verified against file system survey conducted 2026-05-10.
