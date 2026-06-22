# VPORT Feature Inventory

**Generated:** 2026-06-02  
**Source of truth:** `apps/VCSM/src/features/`  
**Scope:** All features that touch VPORT data, surfaces, or ownership

---

## How to Read This Document

- **Surface** — where the feature is visible: DASHBOARD (owner-only management), TAB (public + owner profile view), PUBLIC (unauthenticated), SYSTEM (no UI surface), BOTH (appears in both owner and public contexts)
- **VPORT Kind Scope** — which VPORT business type(s) this feature applies to
- **Arch Folder** — path to the existing architecture governance folder, if any

---

## Group 1 — Dashboard Shell and Core Management

| Feature | Source Path | Surface | VPORT Kind Scope | Arch Folder |
|---|---|---|---|---|
| Dashboard shell | `dashboard/vport/` + `dashboard/vport/screens/` + `dashboard/vport/adapters/` | DASHBOARD | ALL | `DASHBOARD/modules/dashboard/` |
| Dashboard card settings panel | `dashboard/vport/dashboard/cards/settings/` | DASHBOARD | ALL | `DASHBOARD/modules/dashboard-cards/` |
| Dashboard shell DAL | `dashboard/vport/dal/read/` + `dashboard/vport/dal/write/` | SYSTEM | ALL | `DASHBOARD/modules/dashboard/` |
| Dashboard shell controller | `dashboard/vport/controller/` | SYSTEM | ALL | `DASHBOARD/modules/dashboard/` |
| Dashboard shared components | `dashboard/vport/dashboard/shared/` + `dashboard/shared/components/` | DASHBOARD | ALL | None (shared util — no dedicated folder needed) |

---

## Group 2 — Dashboard Cards (Owner-Only)

| Feature | Source Path | Surface | VPORT Kind Scope | Arch Folder |
|---|---|---|---|---|
| Booking card | `dashboard/vport/dashboard/cards/bookings/` | DASHBOARD | ALL service types | `DASHBOARD/modules/booking/` |
| Calendar card | `dashboard/vport/dashboard/cards/calendar/` | DASHBOARD | ALL | `DASHBOARD/modules/calendar/` |
| Exchange rate card | `dashboard/vport/dashboard/cards/exchange/` | DASHBOARD | EXCHANGE | `DASHBOARD/modules/exchange/` |
| Gas prices card | `dashboard/vport/dashboard/cards/gasprices/` | DASHBOARD | GAS | `DASHBOARD/modules/gas/` |
| Leads card | `dashboard/vport/dashboard/cards/leads/` | DASHBOARD | ALL | `DASHBOARD/modules/leads/` |
| Locksmith dashboard card | `dashboard/vport/dashboard/cards/locksmith/` | DASHBOARD | LOCKSMITH | `DASHBOARD/modules/locksmith/` |
| Portfolio card | `dashboard/vport/dashboard/cards/portfolio/` | DASHBOARD | ALL supporting portfolio | `DASHBOARD/modules/portfolio/` |
| Reviews card | `dashboard/vport/dashboard/cards/reviews/` | DASHBOARD | ALL | `DASHBOARD/modules/reviews/` |
| Schedule card | `dashboard/vport/dashboard/cards/schedule/` | DASHBOARD | ALL | `DASHBOARD/modules/schedule/` |
| Services card | `dashboard/vport/dashboard/cards/services/` | DASHBOARD | ALL service types | `DASHBOARD/modules/services/` |
| Team card | `dashboard/vport/dashboard/cards/team/` | DASHBOARD | BARBERSHOP | `DASHBOARD/modules/team/` |

---

## Group 3 — Availability Management

| Feature | Source Path | Surface | VPORT Kind Scope | Arch Folder |
|---|---|---|---|---|
| Availability rules | `dashboard/vport/dal/read/vportAvailabilityRules.read.dal.js` + related hooks/controller | DASHBOARD | ALL service types | `DASHBOARD/modules/availability/` |

---

## Group 4 — VPORT Kind Profiles (Dashboard + Public both)

| Feature | Source Path | Surface | VPORT Kind Scope | Arch Folder |
|---|---|---|---|---|
| Barber profile management | `profiles/kinds/vport/controller/barbershop/` + `dal/barbershop/` + `hooks/barbershop/` + `screens/barbershop/` | BOTH | BARBER + BARBERSHOP | `DASHBOARD/modules/barber/` + `DASHBOARD/modules/barbershop/` |
| Locksmith profile management | `profiles/kinds/vport/controller/locksmith/` + `dal/locksmith/` + `hooks/locksmith/` + `model/locksmith/` | BOTH | LOCKSMITH | `DASHBOARD/modules/locksmith/` |
| Restaurant profile management | `profiles/kinds/vport/controller/menu/` + `dal/menu/` + `hooks/menu/` + `model/menu/` + `screens/menu/` | BOTH | RESTAURANT | `DASHBOARD/modules/restaurant/` |
| Exchange profile management | `profiles/kinds/vport/controller/exchange/` + `dal/exchange/` + `hooks/exchange/` + `dal/rates/` + `model/rates/` + `controller/rates/` | BOTH | EXCHANGE | `DASHBOARD/modules/exchange-profile/` |
| Portfolio management | `profiles/kinds/vport/controller/portfolio/` + `hooks/portfolio/` + `screens/portfolio/` | BOTH | barber, barbershop, locksmith, creative, trades | `DASHBOARD/modules/portfolio/` |
| Content pages | `profiles/kinds/vport/controller/content/` + `dal/content/` + `hooks/content/` + `model/content/` + `screens/content/` | BOTH | ALL | `DASHBOARD/modules/content-pages/` |
| Subscribers/follow | `profiles/kinds/vport/controller/subscribers/` + `hooks/subscribers/` + `screens` | BOTH | ALL | `DASHBOARD/modules/subscribers/` |
| Services profile | `profiles/kinds/vport/controller/services/` + `dal/services/` + `hooks/services/` + `model/services/` + `screens/services/` | BOTH | ALL service types | `DASHBOARD/modules/services/` |
| Reviews management | `profiles/kinds/vport/controller/review/` + `dal/review/` + `hooks/review/` + `screens/review/` | BOTH | ALL | `DASHBOARD/modules/reviews/` |

---

## Group 5 — Tab Views (Public Profile Surfaces)

| Feature | Source Path | Surface | VPORT Kind Scope | Arch Folder |
|---|---|---|---|---|
| About tab | `profiles/kinds/vport/screens/views/` + `ui/tabs/` | TAB | ALL | `TABS/tabs/about/` |
| Book tab | `profiles/kinds/vport/screens/booking/` + booking engine | TAB | barber, barbershop, locksmith, beauty, health, trades | `TABS/tabs/booking/` |
| Content tab | `profiles/kinds/vport/screens/content/` | TAB | ALL | `TABS/tabs/content/` |
| Gas prices tab | `profiles/kinds/vport/screens` (via gas adapter) | TAB | GAS | `TABS/tabs/gas-prices/` |
| Menu tab | `profiles/kinds/vport/screens/menu/` | TAB | RESTAURANT | `TABS/tabs/menu/` |
| Owner tab | `profiles/kinds/vport/screens/owner/` | TAB | ALL | `TABS/tabs/owner/` |
| Portfolio tab | `profiles/kinds/vport/screens/portfolio/` | TAB | barber, barbershop, locksmith, creative | `TABS/tabs/portfolio/` |
| Rates tab | `profiles/kinds/vport/screens/rates/` + `dal/rates/` + `model/rates/` | TAB | EXCHANGE | `TABS/tabs/rates/` |
| Reviews tab | `profiles/kinds/vport/screens/review/` | TAB | ALL | `TABS/tabs/reviews/` |
| Services tab | `profiles/kinds/vport/screens/services/` | TAB | ALL service types | `TABS/tabs/services/` |
| Subscribers tab | `profiles/kinds/vport/screens` (views layer) | TAB | ALL | `TABS/tabs/subscribers/` |
| Team tab | `profiles/kinds/vport/screens/barbershop/` + team views | TAB | BARBERSHOP | `TABS/tabs/team/` |
| Vibes tab | `profiles/kinds/vport/screens/views/` | TAB | ALL | `TABS/tabs/vibes/` |
| Contact tab | Not yet implemented | TAB | TBD | `TABS/tabs/contact/` |
| Gallery tab (planned) | Not yet implemented | TAB | TBD | `TABS/tabs/gallery/` |
| Photos tab | Governance matrix row exists; folder is "gallery" — CONTRADICTION | TAB | TBD | `TABS/tabs/gallery/` (folder exists; "photos" row in matrix is stale or merged) |

---

## Group 6 — Tab System Infrastructure

| Feature | Source Path | Surface | VPORT Kind Scope | Arch Folder |
|---|---|---|---|---|
| Tab classification / routing | `profiles/kinds/vport/config/` + `ui/tabs/` + `model/getVportTabsByType.model.js` | SYSTEM | ALL | `DASHBOARD/modules/tab-classification/` |
| VPORT type registry | `profiles/kinds/vport/vportTypeRegistry.js` | SYSTEM | ALL | `DASHBOARD/modules/tab-classification/` (deprecated — DTAB-001 finding) |
| VPORT profile header | `profiles/kinds/vport/ui/vportprofileheader/` | TAB | ALL | None — **MISSING** |
| Profile adapter layer (VPORT) | `profiles/adapters/kinds/vport/` | SYSTEM | ALL | None — **MISSING** |
| Tab view container | `profiles/kinds/vport/screens/views/tabs/components/` | TAB | ALL | None — covered implicitly by individual tab folders |

---

## Group 7 — Public (Unauthenticated) Surfaces

| Feature | Source Path | Surface | VPORT Kind Scope | Arch Folder |
|---|---|---|---|---|
| Public VPORT business card | `public/vportBusinessCard/` (controller, dal, hooks, model, screen, view) | PUBLIC | ALL | None — **MISSING** |
| Public VPORT menu (QR) | `public/vportMenu/` (adapters, components, controller, dal, hooks, model, screen, view) | PUBLIC | RESTAURANT | None — **MISSING** (DASHBOARD.menu covers owner side only) |

---

## Group 8 — Dashboard Tools (Owner-Only)

| Feature | Source Path | Surface | VPORT Kind Scope | Arch Folder |
|---|---|---|---|---|
| Flyer Builder | `dashboard/flyerBuilder/` (full feature with designStudio subsystem) | DASHBOARD | ALL | None — **MISSING** |
| Flyer Builder Design Studio | `dashboard/flyerBuilder/designStudio/` (components, controller, dal, hooks, model, screens) | DASHBOARD | ALL | None — **MISSING** (subsystem of flyer-builder) |
| QR Code generator | `dashboard/qrcode/` (adapters, components) | DASHBOARD | ALL | `DASHBOARD/modules/qrcode/` — APPROVED / THOR CLEAR / SPIDER-MAN COMPLETE |

---

## Group 9 — Settings (VPORT-Specific)

| Feature | Source Path | Surface | VPORT Kind Scope | Arch Folder |
|---|---|---|---|---|
| VPORT settings card | `dashboard/vport/dashboard/cards/settings/` | DASHBOARD | ALL | `DASHBOARD/modules/settings/` |
| VPORT settings feature | `settings/vports/` (controller, dal, hooks, model, ui) | DASHBOARD | ALL | Partial — `DASHBOARD/modules/settings/` covers card but not underlying feature |
| Privacy settings | `settings/privacy/` (controller, dal, hooks, models, ui) | DASHBOARD | ALL | None — **MISSING** (VPORT privacy is actor-level) |
| Profile settings | `settings/profile/` (controller, dal, hooks, model, ui) | DASHBOARD | ALL | None — partial coverage in DASHBOARD.settings |
| Account settings | `settings/account/` (controller, dal, hooks, ui) | DASHBOARD | ALL | None — partial coverage in DASHBOARD.settings |

---

## Group 10 — External and Integration Surfaces

| Feature | Source Path | Surface | VPORT Kind Scope | Arch Folder |
|---|---|---|---|---|
| External site Edge Function API | Supabase Edge Functions (no in-repo source path confirmed) | PUBLIC | ALL | `DASHBOARD/modules/external-site/` |
| TriPoint integration | External domain API (spec-only, no implementation yet) | PUBLIC | LOCKSMITH | `DASHBOARD/modules/tripoint/` |

---

## Group 11 — Delete and Lifecycle

| Feature | Source Path | Surface | VPORT Kind Scope | Arch Folder |
|---|---|---|---|---|
| VPORT delete lifecycle | Cross-feature (delete controllers, DALs, soft-delete patterns) | SYSTEM | ALL | `DASHBOARD/modules/delete-lifecycle/` |

---

## Group 12 — VPORT Core Identity Feature

| Feature | Source Path | Surface | VPORT Kind Scope | Arch Folder |
|---|---|---|---|---|
| Core VPORT feature (adapters, controller, dal, hooks, model, public, screens, utils) | `features/vport/` | BOTH | ALL | None — **MISSING** |

---

## Group 13 — Join and Onboarding

| Feature | Source Path | Surface | VPORT Kind Scope | Arch Folder |
|---|---|---|---|---|
| Join barbershop (barber joins existing VPORT) | `join/controllers/joinBarbershopAccount.controller.js` + `joinBarbershopQr.controller.js` + `dal/joinInvite.dal.js` + `hooks/useJoinBarbershop.js` + `screens/` | DASHBOARD | BARBERSHOP | None — **MISSING** |
| Invite feature | `invite/` (controller, dal, hooks, screens) | SYSTEM | BARBERSHOP | None — **MISSING** |

---

## Feature Count Summary

| Category | Feature Count | Fully Covered | Partially Covered | Missing Folder |
|---|---|---|---|---|
| Dashboard shell + cards | 15 | 15 | 0 | 0 |
| VPORT kind profiles | 9 | 7 | 2 | 0 |
| Tab views | 16 | 15 (folders exist) | 1 (photos/gallery conflict) | 0 |
| Tab infrastructure | 5 | 2 | 1 | 2 |
| Public surfaces | 2 | 0 | 0 | 2 |
| Dashboard tools | 3 | 0 | 0 | 3 |
| Settings | 5 | 1 | 2 | 2 |
| External/integration | 2 | 2 | 0 | 0 |
| Core VPORT feature | 1 | 0 | 0 | 1 |
| Join/onboarding | 2 | 0 | 0 | 2 |
| Delete/lifecycle | 1 | 1 | 0 | 0 |
| **TOTAL** | **61** | **43** | **5** | **13** |
