# Profiles Module — Ownership Record

**Application Scope:** VCSM  
**File count:** ~408 JS/JSX files  
**Ownership record created:** 2026-05-23  
**Audited by:** CEREBRO session (ARCHITECT, VENOM, SENTRY, DB, CARNAGE, LOKI, KRAVEN, IRONMAN, LOGAN)

---

## 1. Purpose

The profiles module is the largest feature module in VCSM. It owns:

- **Actor profile routing** — resolution of any `/profile/:actorId` URL to a canonical slug, then to the correct kind-specific profile screen
- **User profiles** — social profile tabs (posts, photos, tags, friends), profile header, friend/follow actions
- **VPORT profiles** — full public-facing business profile rendering for all VPORT types (gas, menu, barbershop, locksmith, exchange, restaurant/general)
- **VPORT kind isolation** — each VPORT type (gas, menu, barbershop, locksmith, exchange, restaurant) is a self-contained sub-module under `kinds/vport/`
- **VPORT write paths** — services catalog upsert, fuel prices, exchange rates, content pages, menu items, barbershop/locksmith availability
- **VPORT adapter boundary** — the `adapters/` layer bridges the profiles feature to the dashboard feature and any other cross-feature consumer
- **Slug resolution and canonical redirect** — the profile router enforces canonical URL form; legacy UUIDs redirect to slugs; all routes go through `useResolveActorBySlug` or `useActorCanonicalSlug`

---

## 2. Application Scope

VCSM only. No engine scope. No Wentrex or Traffic overlap.

---

## 3. Code Roots

| Root | Purpose |
|---|---|
| `apps/VCSM/src/features/profiles/` | Full module root (408 files) |
| `apps/VCSM/src/features/profiles/screens/` | Route entry screen, canonical redirect logic |
| `apps/VCSM/src/features/profiles/kinds/` | Kind-specific submodules |
| `apps/VCSM/src/features/profiles/kinds/vport/` | VPORT-specific DAL/model/controller/hook/screen |
| `apps/VCSM/src/features/profiles/adapters/` | Cross-feature adapter boundary |
| `apps/VCSM/src/features/profiles/controller/` | Profile-level (non-kind) controllers |
| `apps/VCSM/src/features/profiles/dal/` | Profile-level (non-kind) DAL |
| `apps/VCSM/src/features/profiles/hooks/` | Profile-level hooks (slug resolution, kind detection, canonical redirect) |
| `apps/VCSM/src/features/profiles/model/` | Profile-level domain models |
| `apps/VCSM/src/features/profiles/styles/` | CSS (profiles-modern.css) |
| `apps/VCSM/src/features/profiles/ui/` | Shared UI primitives for profiles |
| `apps/VCSM/src/features/profiles/config/` | Profile config (e.g. kind registry keys) |
| `apps/VCSM/src/features/profiles/debug/` | Dev-only profile debug utilities |

---

## 4. Core Layers

### DAL
- `dal/` — friends, photos, post, tags
- `kinds/vport/dal/` — barbershop, content, exchange, gas, locksmith, menu, rates, review, services (each sub-directory owns its VPORT-type-specific Supabase queries)

### Model
- `model/` — friends, photos
- `kinds/vport/` model files per type (menu model, barbershop model, etc.)
- `screens/views/tabs/post/models/` — post tab models

### Controller
- `controller/` — friends, photos, post, tags
- `kinds/vport/controller/` — barbershop, content, exchange, gas, locksmith, menu, portfolio, rates, review, services, subscribers

### Hooks
- `hooks/` — `useActorKind`, `useActorCanonicalSlug`, `useActorSlugRedirect`, `useResolveActorBySlug`, `useVportType`, `useVportProfileBySlug`
- `hooks/header/` — profile header state hooks
- `kinds/vport/hooks/` — per-VPORT-type hooks
- `screens/hooks/` — `useProfileRouteTelemetry`
- `screens/views/tabs/*/hooks/` — per-tab hooks (friends, photos, post, tags)

### Screen / View
- `screens/ActorProfileScreen.jsx` — canonical profile route entry point
- `screens/UsernameProfileRedirect.jsx` — legacy username redirect passthrough
- `screens/views/` — `UserProfileViewScreen`, `VportProfileViewScreen`, profile header views, tab views (posts, photos, tags, friends)
- `kinds/vport/screens/` — kind-specific view screens (gas, menu, barbershop, locksmith, exchange, rates, review, services, portfolio, owner panel)
- `kinds/vport/screens/views/` — VPORT tab system

### Adapter
- `adapters/kinds/vport/hooks/` — gas, rates, services adapters
- `adapters/kinds/vport/screens/` — gas, rates, review, services view adapters
- `adapters/photos/` — photo adapter
- `adapters/tags/` — tags adapter
- `adapters/ui/` — shared UI adapters

### Components
- `screens/components/` — `ActorProfileDevProbe`, `ActorProfileProdDebugPanel`
- `screens/views/tabs/*/` — per-tab components
- `kinds/vport/screens/*/components/` — kind-specific profile components
- `kinds/vport/ui/` — VPORT UI primitives (tabs, header)

---

## 5. Engines Used

| Engine | Usage |
|---|---|
| `engines/hydration` | Actor hydration (name, avatar, bio) throughout profile rendering |
| `engines/booking` | Booking flow surface on VPORT profiles (resources, availability) |
| `engines/reviews` | Review rendering on VPORT profiles |
| `engines/portfolio` | Portfolio rendering on VPORT profiles |

Cross-feature adapters (not engines):
- `features/identity` — `useIdentity()` for viewer identity
- `features/actors` — `searchActors`, slug resolution DAL
- `features/feed` — post publishing (via adapter boundary)

---

## 6. Database / Schema Ownership

### Tables read
| Table | Schema | Usage |
|---|---|---|
| `actors` | `vc` | Actor kind, slug, metadata |
| `actor_owners` | `vc` | Ownership verification |
| `user_app_accounts` | `vc` | Session-to-actor resolution (`vc.current_actor_id()`) |
| `profiles` | `vport` | VPORT profile metadata (name, type, active/deleted state) |
| `services` | `vport` | VPORT service catalog |
| `rates` | `vport` | Exchange rates |
| `fuel_prices` | `vport` | Gas station prices |
| `content_pages` | `vport` | VPORT content/about pages |
| `resources` | `vport` | Bookable resources (staff, bays, etc.) |
| `posts` | `vc` | Actor posts on profile post tab |
| `actor_tags` | `vc` | Actor tags on profile tags tab |
| `actor_friends` | `vc` | Friend/follow graph on friends tab |
| `photos` | `vport` or `vc` | Photo gallery |
| `reviews` | `vport` | VPORT reviews |

### Tables written
| Table | Schema | Write Path | Owner |
|---|---|---|---|
| `services` | `vport` | `upsertVportServices.controller.js` | profiles/vport |
| `rates` | `vport` | `upsertVportRate.adapter.js` | profiles/vport |
| `fuel_prices` | `vport` | gas controller | profiles/vport |
| `content_pages` | `vport` | content controller | profiles/vport |
| `posts` | `vc` | `publishExchangeRatePost`, feed publish flow | profiles/vport + feed adapter |

### RLS policy owner
All `vport.*` write paths: `vport.actor_can_manage_profile(vc.current_actor_id(), profile_id)`  
All `vc.posts` write paths: `actor_owners` JOIN pattern

### Migration owner
VCSM scope. Relevant migrations:
- `20260416140000` (archive, untracked) — original vport grants + RLS
- `20260419150000` (archive, untracked) — additional vport policies
- `20260515010000` — bookings_insert_actor_owner
- `20260522010000` — vc.posts INSERT RLS
- `20260523010000` — backfill_tracked_rls_coverage (services, posts, fuel_prices)
- `20260523020000` — fix_vport_rates_rls (rates tautology + legacy owner)
- `20260523030000` — fix_content_pages_rls (5 legacy policies dropped)
- `20260523040000` — fix_bookings_rls (DB-RLS-01, DB-RLS-03, DB-RLS-04)

---

## 7. Rule Ownership

| Rule | Enforced By | Layer |
|---|---|---|
| Actor ownership on VPORT writes | `assertActorOwnsVportActorController` | Controller |
| Canonical URL slug enforcement | `useActorSlugRedirect` + `useActorCanonicalSlug` | Hook |
| Kind-based screen dispatch | `PROFILE_KIND_REGISTRY` | Screen |
| VPORT profile visibility (active + non-deleted) | `actor_can_view_profile` | DB RLS |
| VPORT write authorization | `actor_can_manage_profile` | DB RLS |
| Post feed attribution (actor = viewer's actor) | `actor_owners` JOIN | DB RLS |
| Public booking integrity (resource belongs to same profile) | `bookings_insert_public_pending` WITH CHECK | DB RLS |
| Debug panel tree-shaking | `import.meta.env.DEV &&` guard | Screen |

---

## 8. Contracts Touched

- Architecture contract §1.4 — Owner Meaning Rule (ownership via `actor_owners`)
- Architecture contract — Screen Role Boundaries (Final Screen: route entry only)
- Architecture contract — Mandatory Build Order (DAL → Model → Controller → Hook → Screen)
- Architecture contract — Cross-feature access via adapters only
- Boundary Isolation Contract — VCSM scope only

---

## 9. Documentation Links

| Document | Path |
|---|---|
| Architecture dashboard | `_CANONICAL/logan/marvel/architect/modules/vcsm.profiles.architecture.md` |
| CEREBRO audit | `_CANONICAL/logan/marvel/architect/modules/vcsm.profiles.architect-audit-2026-05-22.md` |
| RLS audit | `_HISTORY/db/snapshots/2026-05-23_db_profiles-session-rls-audit.md` |
| Carnage migration plan | `_ACTIVE/audits/migrations/2026-05-23_carnage_vport-services-rates-rls-backfill.md` |
| THOR release gate | `CURRENT/features/dashboard/evidence/2026-05-23_thor_profiles-cerebro-release-gate.md` |

---

## 10. Responsibilities

1. Own all slug-based profile routing and canonical URL enforcement
2. Own kind-based screen dispatch (`PROFILE_KIND_REGISTRY`)
3. Own all VPORT sub-feature write paths (services, rates, gas, content, menu, barbershop, locksmith, exchange)
4. Own the adapter boundary for cross-feature consumers (dashboard, feed, external API callers)
5. Own hydration of actor identity data on all profile surfaces
6. Own RLS alignment for all `vport.*` tables written through this feature

---

## 11. Boundaries

- Must NOT import directly from `features/feed` internals — use adapter boundary
- Must NOT import directly from `features/booking` internals — use engine interface or adapter
- Must NOT expose `profileId` or `vportId` through `useIdentity()` or any public hook surface
- Must NOT use `select('*')` in any DAL file
- VPORT sub-modules under `kinds/vport/` must remain isolated from user profile sub-modules
- Debug components must remain behind `import.meta.env.DEV` guard — never ship to production bundle

---

## 12. Change Impact Rules

When profiles changes:

| Change Type | Must Also Update |
|---|---|
| New VPORT type added | `PROFILE_KIND_REGISTRY`, `kinds/vport/` sub-module, `adapters/kinds/vport/`, DB migration for new vport tables |
| Slug resolution logic | `useResolveActorBySlug`, `useActorCanonicalSlug`, `useActorSlugRedirect`, `ActorProfileScreen.jsx` |
| New write path added | DB migration (RLS + grants), controller ownership gate, VENOM review |
| Profile tabs changed | Per-tab controller, hook, component, and model files; adapter if cross-feature |
| Profile header changed | `ui/header/`, `kinds/vport/ui/vportprofileheader/`, adapter hooks |
| RLS policy changed | CARNAGE plan required, VENOM sign-off, THOR gate before production |

---

## 13. Release Gate Notes

As of 2026-05-23:
- THOR decision: **CAUTION** (code changes may proceed; risk owners must be named before deploy)
- DB track: All 4 RLS migration phases (Phase 1-4) applied to live DB ✅
- Staging verification of 8 VPORT publish flows: **PENDING** (human action required)
- Risk acceptance owners: **UNKNOWN** — must be named before production deploy

---

## 14. Open Ownership Questions

| Question | Risk | Follow-up |
|---|---|---|
| `checkActorOwnership.controller.js` crosses DAL/controller boundary | LOW exploitability — function is read-only check, but ownership is ambiguous | Architecture sprint |
| `actor_can_manage_profile` function still contains legacy `owner_user_id` branch | Residual architectural debt — not a runtime gap but creates maintenance confusion | Separate data audit + migration sprint |
| Serial waterfall on profile load (R-08) | Performance — 4–6 serial round trips per profile render | P1 performance sprint |

---

*Created: 2026-05-23 | Scope: VCSM | Session: profiles-release-window-fixes*
