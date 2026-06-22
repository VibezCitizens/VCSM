# VCSM VPort Tab Classification System

## 1 Purpose

Documents the VPort type classification system and the tab layout resolver that maps each VPort type to the correct set of profile tabs. This is the single reference for understanding which tabs appear on a given VPort profile, why, and how to change them.

## 2 Scope

- `apps/VCSM/src/features/profiles/config/profileTabs.config.js`
- `apps/VCSM/src/features/profiles/kinds/vport/config/vportTypes.config.js`
- `apps/VCSM/src/features/profiles/kinds/vport/model/getVportTabsByType.model.js`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx` (effectiveTabs computation)

## 3 Ownership

Application Scope: VCSM  
Code Roots: `apps/VCSM/src/features/profiles/`  
Related Engines: none — app-level config only

## 4 Type Classification

### Source of truth

`apps/VCSM/src/features/profiles/kinds/vport/config/vportTypes.config.js` — exports `VPORT_TYPE_GROUPS`.

DB constraint `vc.vports.vport_type_check` enforces that `vport_type` values match this list exactly (lowercase, exact spacing).

Types are stored in `vport.profile_categories` with an `is_primary=true` flag. The primary row drives tab resolution.

### Type groups (48 types across 13 groups)

| Group | Types |
|---|---|
| Arts, Media & Entertainment | artist, creator, dj, event planner, musician, photographer, public figure, videographer |
| Beauty & Wellness | barber, barbershop, esthetician, fitness instructor, hairstylist, makeup artist, massage therapist, nail technician, yoga instructor |
| Education & Care | babysitter, caregiver, counselor, elder care, nanny, teacher, therapist, tutor |
| Food, Hospitality & Events | baker, bartender, caterer, chef, cook, restaurant, server |
| Health & Medical | chiropractor, dentist, doctor, nurse, nutritionist |
| Home, Maintenance & Trades | carpenter, cleaning service, contractor, electrician, gardener, handyman, landscaper, locksmith, mechanic, painter, plumber |
| Professional & Business Services | accountant, bookkeeper, business, consultant, designer, developer, engineer, lawyer, marketer, notary, organization, real estate, exchange |
| Retail, Sales & Commerce | nonprofit, shop, vendor |
| Sports & Fitness | athlete, coach, trainer |
| Transport & Logistics | courier, delivery, driver, mover, rideshare, towing, truck driver |
| Gas & Fuel | gas station |
| Animal Care | dog walker, pet sitter |
| Other | other |

## 5 Tab Catalog

Defined in `profileTabs.config.js` as `TAB`:

| Key | Label | Notes |
|---|---|---|
| vibes | Vibes | Social posts feed |
| photos | Photos | Photo gallery |
| about | About | Business info, hours, location |
| subscribers | Subscribers | Follow/subscribe list |
| reviews | Reviews | Star ratings + dimension reviews |
| menu | Menu | Food/drink menu items |
| gas | Gas | Fuel price board |
| services | Services | Service catalog with pricing |
| rates | Rates | FX exchange rate pairs |
| portfolio | Portfolio | Work samples derived from posts |
| book | Book | Appointment/booking calendar |
| content | Content | Creator content pages |
| team | Team | Team member list (barbershop only) |

`TAB_FLAGS` controls global enable/disable per key. Setting a flag to `false` hides the tab everywhere regardless of layout.

## 6 Tab Resolution

### File

`apps/VCSM/src/features/profiles/kinds/vport/model/getVportTabsByType.model.js`

> **Note:** The old path `model/gas/getVportTabsByType.model.js` is a re-export stub (moved 2026-05-03).

### Algorithm (3-tier)

```
getVportTabsByType(type)
  1. normalizeType(type)            → lowercase, trim, underscores → spaces
  2. TYPE_TABS[type] exists?        → return that layout (most specific)
     Special: gas station reorders to always put "gas" tab first
  3. resolveGroup(type)             → scan VPORT_TYPE_GROUPS for membership
  4. GROUP_TABS[group] exists?      → return group layout
  5. fallback                       → VPORT_TABS
```

### TYPE_TABS (type-level overrides)

| Type | Layout |
|---|---|
| barber | `VPORT_BARBER_TABS` |
| barbershop | `VPORT_BARBERSHOP_TABS` |
| locksmith | `VPORT_BARBER_TABS` |
| gas station | `VPORT_GAS_TABS` (gas tab always first) |
| exchange | `VPORT_RATES_TABS` |
| restaurant | `VPORT_FOOD_BOOK_TABS` |
| caterer | `VPORT_FOOD_BOOK_TABS` |

### GROUP_TABS (group-level defaults)

| Group | Layout |
|---|---|
| Arts, Media & Entertainment | `VPORT_CREATIVE_TABS` |
| Beauty & Wellness | `VPORT_SERVICE_BOOK_TABS` |
| Education & Care | `VPORT_SERVICE_BOOK_TABS` |
| Health & Medical | `VPORT_HEALTH_TABS` |
| Home, Maintenance & Trades | `VPORT_TRADES_TABS` |
| Professional & Business Services | `VPORT_SERVICE_TABS` |
| Retail, Sales & Commerce | `VPORT_RETAIL_TABS` |
| Sports & Fitness | `VPORT_SERVICE_BOOK_TABS` |
| Transport & Logistics | `VPORT_SERVICE_TABS` |
| Animal Care | `VPORT_SERVICE_BOOK_TABS` |
| Food, Hospitality & Events | `VPORT_FOOD_TABS` |
| Other | `VPORT_TABS` |

## 7 Layout Tab Orders

| Layout | Tabs (in order) |
|---|---|
| `VPORT_TABS` | About, Reviews, Content, Vibes, Photos, Subscribers |
| `VPORT_SERVICE_TABS` | Portfolio, Services, Reviews, Content, About, Vibes, Photos, Subscribers |
| `VPORT_BARBER_TABS` | Portfolio, Book, Services, Reviews, Content, About, Photos, Vibes, Subscribers |
| `VPORT_BARBERSHOP_TABS` | Portfolio, Book, Team, Services, Reviews, About, Photos, Vibes, Content, Subscribers |
| `VPORT_FOOD_TABS` | Menu, Reviews, Content, About, Services, Photos, Vibes, Subscribers |
| `VPORT_FOOD_BOOK_TABS` | Menu, Book, Reviews, About, Services, Photos, Vibes, Subscribers |
| `VPORT_GAS_TABS` | Gas, Services, Content, About, Reviews, Photos, Vibes, Subscribers |
| `VPORT_RATES_TABS` | Rates, Services, Content, Reviews, About, Photos, Vibes, Subscribers |
| `VPORT_CREATIVE_TABS` | Portfolio, Vibes, Content, Reviews, Services, About, Photos, Subscribers |
| `VPORT_SERVICE_BOOK_TABS` | Portfolio, Book, Services, Reviews, About, Photos, Vibes, Subscribers |
| `VPORT_HEALTH_TABS` | Book, Services, Reviews, About, Photos, Subscribers |
| `VPORT_TRADES_TABS` | Portfolio, Services, Book, Reviews, About, Photos, Subscribers |
| `VPORT_RETAIL_TABS` | Services, Reviews, About, Photos, Vibes, Subscribers |

## 8 effectiveTabs Computation

Computed in `VportProfileViewScreen.jsx` via `useMemo`:

```
1. Resolve vportType: publicDetails?.vportType ?? profile?.vport_type ?? profile?.vportType ?? profile?.category
2. baseTabs = type ? getVportTabsByType(type) : fallbackTabs
3. If isOwner: append { key: "owner", label: "Owner" } unless already present
4. If not owner: filter out any "owner" tab
```

Initial tab state is `null`. The auto-select `useEffect` sets the first tab once `effectiveTabs` resolves. This prevents the former "Vibes" flash for non-creator VPort types.

## 9 Tab Content Router

`VportProfileTabContent.jsx` renders the correct view for each active tab key. All views are imported eagerly (no code splitting). The `vibes` tab stays mounted with `display:none` while inactive; all other tabs are conditionally rendered.

## 10 Rules / Invariants

- All type strings in `VPORT_TYPE_GROUPS` must match the DB constraint `vc.vports.vport_type_check` exactly (lowercase, spaces preserved)
- `TYPE_TABS` takes priority over `GROUP_TABS` — a type with a TYPE_TABS override never falls through to its group layout
- The owner tab is never stored in any config layout array — always injected dynamically
- `TAB_FLAGS[key] = false` globally hides a tab regardless of which layout includes it
- Adding a new tab requires: add to `TAB` in `profileTabs.config.js`, add to relevant layout arrays, wire a view component in `VportProfileTabContent.jsx`

## 11 Failure Risks

- VPort type race: `publicDetails` loads async. Until it resolves, `effectiveTabs` falls back to `VPORT_TABS`. Types whose primary tab differs from "about" (first of VPORT_TABS) will show "about" briefly then switch. This is a data-loading race, not a config bug.
- `vport.profile_categories` RLS must allow `authenticated` SELECT — silent failure results in `vportType = null` and permanent fallback to `VPORT_TABS`
- `TAB_FLAGS[key] = false` silently drops the tab from every layout — check flags before debugging "missing tab" reports

## 12 Files Map

| File | Role |
|---|---|
| `features/profiles/config/profileTabs.config.js` | TAB catalog, TAB_FLAGS, all layout arrays |
| `features/profiles/kinds/vport/config/vportTypes.config.js` | VPORT_TYPE_GROUPS master list |
| `features/profiles/kinds/vport/model/getVportTabsByType.model.js` | 3-tier tab resolver (canonical location) |
| `features/profiles/kinds/vport/model/gas/getVportTabsByType.model.js` | Re-export stub only (deprecated path) |
| `features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx` | effectiveTabs computation, owner tab injection, initial tab state |
| `features/profiles/kinds/vport/screens/components/VportProfileTabContent.jsx` | Tab content router (all tab views) |
| `features/profiles/kinds/vport/ui/tabs/VportProfileTabs.jsx` | Scrollable tab bar component |
| `features/profiles/kinds/vport/config/reviewDimensions.config.js` | Per-type/group review dimension weights |

## 13 Change Log

### 2026-05-03

Task: VPort tab classification fixes — expand group coverage, add missing layouts, fix tab flash, move resolver  
Code Status Before: 2 of 13 groups had explicit tab layouts; 8 groups fell through to bare VPORT_TABS  
Summary:
- Added 6 new tab layouts: VPORT_CREATIVE_TABS, VPORT_SERVICE_BOOK_TABS, VPORT_HEALTH_TABS, VPORT_TRADES_TABS, VPORT_RETAIL_TABS, VPORT_FOOD_BOOK_TABS
- Expanded GROUP_TABS to cover all 11 non-Other groups explicitly
- Added TYPE_TABS overrides for restaurant and caterer → VPORT_FOOD_BOOK_TABS
- Fixed TAB.BOOK label from "Calendar" to "Book"
- Moved resolver from model/gas/ to model/ (gas folder was wrong; no gas-specific logic)
- Fixed VportProfileViewScreen initial tab from useState("vibes") to useState(null)

Files Changed:
- `apps/VCSM/src/features/profiles/config/profileTabs.config.js`
- `apps/VCSM/src/features/profiles/kinds/vport/model/getVportTabsByType.model.js` (NEW)
- `apps/VCSM/src/features/profiles/kinds/vport/model/gas/getVportTabsByType.model.js` (re-export stub)
- `apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx`

Validation: Code read-verified. All layout exports confirmed in profileTabs.config.js. GROUP_TABS and TYPE_TABS confirmed in new resolver. Import path and useState(null) confirmed in VportProfileViewScreen.jsx.
