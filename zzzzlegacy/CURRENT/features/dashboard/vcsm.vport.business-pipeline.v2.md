# VCSM VPORT Business Pipeline — v2

> **Version:** 2
> **Supersedes:** `vcsm.vport.business-pipeline.md` (v1 — legacy `vc.vports` architecture)
> **Effective:** 2026-04-13
> **Reason:** Full schema migration from `vc.vports` to `vport.profiles`. Dedicated `kind='vport'` actor model introduced. `vc.create_vport` RPC replaced by `vport.create_vport`.

---

## 1. Architecture Overview

VPORT is VCSM's business-actor system. It spans:

- VPORT creation and core records under `apps/VCSM/src/features/vport`
- public/profile rendering under `apps/VCSM/src/features/profiles/kinds/vport`
- owner management through VPORT profile tabs, dashboards, and settings

VPORT behavior is actor-first:

- a VPORT is a dedicated `vc.actors.kind='vport'` actor — **not** the owner's `kind='user'` actor
- each VPORT has its own actor row with `user_app_account_id = null`
- `vc.actors.vport_id` was repurposed — FK to `vc.vports` was dropped — it now points to `vport.profiles.id`
- public business presentation comes from `vport.profiles` and `vport.profile_public_details`
- category/type comes from `vport.profile_categories` (replaces the old `vport_type` column on `vc.vports`)
- owner-only capabilities are unlocked when `viewerActorId === profileActorId`
- the owner's user actor is registered in `vport.profile_actor_access` with `role='owner'`
- the vport actor is registered as switchable in `platform.user_app_actor_links`

The profile screen dynamically changes tabs by VPORT category, so barber, locksmith, restaurant, gas station, exchange, and other businesses share the same actor framework but get different public modules.

**Legacy removed:** `vc.vports` is fully gone. All DALs query `vport.profiles` via `vportSchema` (Supabase client targeting the `vport` schema).

---

## 2. Entry Screens and User Flows

Primary entry points:

- create VPORT: `apps/VCSM/src/features/vport/CreateVportForm.jsx`
- VPORT profile route: `apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx`
- VPORT kind wrapper: `apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileKindScreen.jsx`

Major public/owner modules used by the VPORT screen:

- services: `apps/VCSM/src/features/profiles/kinds/vport/screens/services/view/VportServicesView.jsx`
- portfolio: `apps/VCSM/src/features/profiles/kinds/vport/screens/portfolio/view/VportPortfolioView.jsx`
- reviews: `apps/VCSM/src/features/profiles/kinds/vport/screens/review/VportReviewsView.jsx`
- menu: `apps/VCSM/src/features/profiles/kinds/vport/screens/menu/VportMenuView.jsx`
- gas prices: `apps/VCSM/src/features/profiles/kinds/vport/screens/gas/view/VportGasPricesView.jsx`
- booking tab wrapper: `apps/VCSM/src/features/profiles/kinds/vport/screens/views/tabs/VportBookingView.jsx`
- owner tools: `apps/VCSM/src/features/profiles/kinds/vport/screens/owner/VportOwnerView.jsx`
- rates: `apps/VCSM/src/features/profiles/kinds/vport/screens/rates/view/VportRatesView.jsx`

---

## 3. Database Schema Authority

### Core business identity

- `vport.profiles`
  - canonical VPORT rows — replaces `vc.vports` entirely
  - columns: `id, actor_id, owner_user_id, slug, name, bio, avatar_url, banner_url, is_active, is_deleted, deleted_at, deleted_by_actor_id`
  - `deleted_at` — set on soft delete, cleared on restore (added 2026-04-20)
  - `deleted_by_actor_id` — self-referential: set to the vport's own `actor_id` on soft delete (added 2026-04-20)
  - `actor_id` — FK to `vc.actors.id` (the dedicated `kind='vport'` actor)
  - `owner_user_id` — FK to `auth.users.id`
- `vc.actors`
  - actor wrapper for VPORT identity (`kind='vport'`)
  - `vport_id` column repurposed — points to `vport.profiles.id` (FK dropped, no constraint enforced)
  - `user_app_account_id = null` for all vport actors (UNIQUE constraint on column prevents sharing the user actor's value)
- `vc.actor_owners`
  - actor ownership linkage — must have row `(actor_id=vport_actor_id, user_id=owner_user_id)`
  - required for `ownerActorId` hydration in `vcsmActorHydrator`

### Category / Type

- `vport.profile_categories`
  - replaces the old `vport_type` column on `vc.vports`
  - columns: `profile_id, category_key, is_primary`
  - the primary row (`is_primary=true`) drives tab layout selection and service catalog filtering
  - **RLS note:** requires a public SELECT policy for `authenticated` role — category data is not sensitive
- `vport.categories`
  - catalog of valid category keys — columns: `key, label, is_active`
  - `vport.create_vport_for_actor` validates `p_primary_category_key` against this table before creation

### Access control

- `vport.profile_actor_access`
  - stores owner/manager/staff access per actor per profile
  - columns: `profile_id, actor_id, role, status, is_primary`
  - `role='owner'` granted to the creator's user actor (`kind='user'`) at creation time
  - used by `vport.current_actor_id()` RLS helper for vport schema policies

### Platform actor linking

- `platform.user_app_actor_links`
  - registers the vport actor as switchable for the owner's user app account
  - required for `switchActor` engine to find and switch to the vport context
  - columns: `user_app_account_id, app_id, actor_source='vc', actor_id, actor_kind='vport', is_switchable=true, status='active'`
  - `app_id` derived from `platform.user_app_accounts.app_id` at creation time

### Public business details

- `vport.profile_public_details`
  - replaces `vc.vport_public_details`
  - shell row created atomically at vport creation time
  - columns: website_url, email_public, phone_public, location_text, address, hours, price_tier, highlights, languages, payment_methods, social_links, booking_url, logo_url, flyer fields, accent_color

### Services

- `vport.service_catalog`
  - type-based canonical service catalog — keyed by `category_key`
  - replaces `vc.vport_service_catalog`
- `vc.vport_services`
  - actor-specific enabled/disabled service overrides (still in `vc` schema)
- `vc.vport_service_addons`
  - actor-specific add-on rows

### Reviews

- `vc.vport_reviews`
- `vc.vport_review_ratings`

RPCs:

- `get_vport_review_form_config`
- `get_vport_official_stats`

### Menu

- `vc.vport_actor_menu_categories`
- `vc.vport_actor_menu_items`

### Gas

- `vc.vport_fuel_prices`
- `vc.vport_fuel_price_submissions`
- `vc.vport_station_price_settings`
- `vc.vport_fuel_price_submission_reviews`

### Subscribers

RPCs: `count_subscribers`, `list_subscribers`

The public subscriber concept derives from actor-follow relationships.

### Additional modules

- `vc.vport_rates`
- booking integration reads/writes booking tables through the booking feature

---

## 4. Layer Stack

```text
screen -> hook -> controller -> DAL -> model -> UI
```

Examples:

- public details: `useVportPublicDetails` → `getVportPublicDetailsController` → `vportPublicDetails.read.dal`
- services: `useVportServices` → `getVportServicesController` → services DALs
- reviews: `useVportReviews` → `VportReviews.controller` → review DALs
- menu: `useVportActorMenu` → `getVportActorMenuController` → menu DALs
- gas: `useVportGasPrices` → `getVportGasPricesController` → gas DALs

---

## 5. Pipeline 1: Create VPORT

Entry: `apps/VCSM/src/features/vport/CreateVportForm.jsx`

Runtime:

```text
CreateVportForm
  -> optional avatar upload
  -> createVport({ name, avatarUrl, bio, bannerUrl, vportType })
  -> vport.create_vport RPC via vport.core.dal.js
  -> optional upsert selected services
  -> navigate to /profile/:actorId
```

### App-side DAL (`createVport` in `vport.core.dal.js`)

1. `requireUser()` — assert authenticated session
2. Validate `name` (required) and `vportType` → converted to `category_key` via `toCategoryKey()`
3. Generate slug client-side: `{name-slug}-{4-char-random-suffix}` — DB does not auto-generate
4. Call `vportSchema.rpc("create_vport", { p_slug, p_name, p_primary_category_key, p_bio, p_avatar_url, p_banner_url })`
5. Extract first row: `{ profile_id, actor_id, slug }` from returned array
6. Call `refreshVcActorDirectory(row.actor_id)` non-fatally
7. Return `{ ok: true, vport_id, profile_id, actor_id, slug, profileId, vportId, actorId }`

### DB function (`vport.create_vport`)

`SECURITY DEFINER`, `set search_path = public, auth, platform, vc, vport`. Delegates to `vport.create_vport_for_actor`.

```text
1. auth.uid() → assert AUTH_REQUIRED
2. actor_ids_for_current_user() → find caller's kind='user' actor → assert ACTOR_NOT_FOUND
3. call vport.create_vport_for_actor(p_actor_id, p_owner_user_id, ...)
```

### DB function (`vport.create_vport_for_actor`) — 15-step transaction

```text
1.  Assert p_actor_id not null → ACTOR_REQUIRED
2.  Assert actor exists, kind='user', not void → ACTOR_NOT_FOUND
3.  Assert p_owner_user_id not null → OWNER_USER_REQUIRED
4.  Assert owner exists in auth.users → OWNER_USER_NOT_FOUND
5.  Assert slug not taken in vport.profiles → SLUG_ALREADY_EXISTS
6.  Assert category_key exists in vport.categories (is_active=true) → INVALID_CATEGORY
7.  SELECT platform.user_app_accounts → v_user_app_account_id + v_app_id → USER_APP_ACCOUNT_NOT_FOUND
8.  INSERT vc.actors (kind='vport', user_app_account_id=NULL) → v_vport_actor_id
9.  INSERT vport.profiles (actor_id=v_vport_actor_id, ...) → v_profile_id
10. UPDATE vc.actors SET vport_id = v_profile_id WHERE id = v_vport_actor_id
11. INSERT vc.actor_owners (actor_id=v_vport_actor_id, user_id=p_owner_user_id, is_primary=true)
12. INSERT vc.actor_privacy_settings (actor_id=v_vport_actor_id, is_private=false)
13. INSERT platform.user_app_actor_links (user_app_account_id, app_id, actor_source='vc', actor_id=v_vport_actor_id, actor_kind='vport', is_switchable=true, status='active')
14. INSERT vport.profile_public_details shell (profile_id=v_profile_id)
15. INSERT vport.profile_categories (profile_id=v_profile_id, category_key, is_primary=true)
16. INSERT vport.profile_actor_access (profile_id=v_profile_id, actor_id=p_actor_id [user actor], role='owner', is_primary=true)
17. RETURN (profile_id, actor_id, slug)
```

### Error codes

| DB exception | App error |
|---|---|
| `AUTH_REQUIRED` | Not authenticated |
| `ACTOR_NOT_FOUND` | Account not fully set up |
| `SLUG_ALREADY_EXISTS` | Name already taken |
| `INVALID_CATEGORY` | Invalid Vport type |
| `USER_APP_ACCOUNT_NOT_FOUND` | Platform account missing |

### Post-creation state

After `create_vport` succeeds, the new vport actor is:
- `vc.actors`: `kind='vport'`, `vport_id = vport.profiles.id`, `user_app_account_id = null`
- `platform.user_app_actor_links`: registered — immediately switchable via `switchActor`
- `vc.actor_owners`: row exists — `ownerActorId` hydration resolves correctly
- `vport.profile_actor_access`: user actor has `role='owner'` — vport RLS passes
- `vport.profile_categories`: primary category row exists — `readVportTypeDAL` resolves `vport_type`

### Known data gap for pre-migration vports

Vports created before this migration was deployed may be missing:
- `platform.user_app_actor_links` row → switch aborts with `SWITCH_ABORT_LINK_NOT_FOUND`
- `vc.actor_owners` row → hydration returns `ownerActorId=null` → `resolveInboxActor` fails

Backfill SQL documented in planning/april/13/.

---

## 6. Pipeline 2: Public VPORT Profile Load

Main screen: `apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx`

Runtime:

```text
VportProfileViewScreen
  -> useProfileGate()
  -> useProfileView()
  -> useBlockStatus()
  -> useVportPublicDetails()
  -> determine effective tabs by vportType (category_key) and ownership
  -> render services / portfolio / reviews / menu / gas / booking / owner / rates
```

Public details controller: `apps/VCSM/src/features/profiles/kinds/vport/controller/getVportPublicDetails.controller.js`

DAL reads from `vport.profile_public_details` via `vportPublicDetails.read.dal.js`.

`vportType` is resolved separately via `readVportTypeDAL(actorId)`:
- queries `vc.actors` for `kind, vport_id`
- queries `vport.profile_categories WHERE profile_id = vport_id AND is_primary = true`
- returns `{ kind, vport_type: category_key }`

---

## 7. Pipeline 3: Services

Controller: `apps/VCSM/src/features/profiles/kinds/vport/controller/services/getVportServices.controller.js`

DALs:
- `readVportTypeByActorId` — resolves `category_key` via `vport.profile_categories`
- `readVportServiceCatalogByType` — queries `vport.service_catalog` by `category_key`
- `readVportServicesByActor`
- `readVportServiceAddonsByActor`

Service authority split:
- `vport.service_catalog` is the category baseline (was `vc.vport_service_catalog`)
- `vc.vport_services` is the actor-specific override layer

### vport.service_catalog — exact column names

| Column | Type | Notes |
|--------|------|-------|
| `category_key` | text | FK → `vport.categories.key`. Primary filter in DAL queries |
| `key` | text | Service key (unique within category) |
| `label` | text | Display label |
| `description` | text | Optional description |
| `service_group` | text | Groups services within a category (e.g. `core`, `care`, `amenities`). UI uses this as the grouping header |
| `is_active` | boolean | Filter: DAL queries with `is_active = true` by default |
| `sort_order` | integer | Primary sort |
| `meta` | jsonb | Extra metadata |

**There is no `category` column.** The grouping column is `service_group`. The mapper field name is still `category` in the domain object — it maps from `row.service_group`.

### Create VPORT service selection path

```text
CreateVportForm (services tab)
  -> useVportServiceCatalog({ vportType })
  -> getVportServiceCatalogController({ vportType })
  -> readVportServiceCatalogByTypeDAL   [apps/VCSM/src/features/vport/dal/]
  -> vport.service_catalog WHERE category_key = vportType AND is_active = true
  -> mapVportServiceCatalogRows()        [apps/VCSM/src/features/vport/model/]
  -> grouped by .category (= service_group) in the form UI
```

Key files (create flow — distinct from profile view flow):
- DAL: `apps/VCSM/src/features/vport/dal/readVportServiceCatalogByType.dal.js`
- Model: `apps/VCSM/src/features/vport/model/vportServiceCatalog.model.js`
- Hook: `apps/VCSM/src/features/vport/hooks/useVportServiceCatalog.js`
- Controller: `apps/VCSM/src/features/vport/controller/getVportServiceCatalog.controller.js`

---

## 8. Pipeline 4: Reviews

Controller: `apps/VCSM/src/features/profiles/kinds/vport/controller/review/VportReviews.controller.js`

Read path:
- `dalGetVportReviewFormConfig()` → RPC `get_vport_review_form_config`
- `dalGetVportOfficialStats()` → RPC `get_vport_official_stats`
- `dalListVportReviews()` → `vc.vport_reviews`
- `dalListVportReviewRatingsByReviewIds()` → `vc.vport_review_ratings`

Write path:
- insert/update body in `vc.vport_reviews`
- upsert dimension ratings in `vc.vport_review_ratings`

Business rules:
- cannot review self
- review target must be a non-void VPORT actor
- review author restricted to `identity.kind === 'user'`

---

## 9. Pipeline 5: Menu

Controller: `apps/VCSM/src/features/profiles/kinds/vport/controller/menu/getVportActorMenu.controller.js`

Tables: `vc.vport_actor_menu_categories`, `vc.vport_actor_menu_items`

Media: menu item images uploaded to R2/Cloudflare via `uploadToCloudflare` and `buildR2Key`.

---

## 10. Pipeline 6: Gas Prices

Controller: `apps/VCSM/src/features/profiles/kinds/vport/controller/gas/getVportGasPrices.controller.js`

Tables: `vc.vport_fuel_prices`, `vc.vport_fuel_price_submissions`, `vc.vport_station_price_settings`

---

## 11. Pipeline 7: Subscribers

RPCs: `count_subscribers`, `list_subscribers`

Screen: `apps/VCSM/src/features/profiles/kinds/vport/screens/views/tabs/VportSubscribersView.jsx`

---

## 12. Pipeline 8: Booking and Rates Integration

Booking tab and rates tab delegate to their own feature controllers. Treated as integration seams.

---

## 13. Business Actor vs Citizen Actor Behavior

### Identity effects

- VPORTs are dedicated `kind='vport'` actors — not alternate skins on the user actor
- each VPORT has its own actor ID, completely separate from the owner's `kind='user'` actor
- `identity.ownerActorId` — the owning citizen actor — resolves via `vc.actor_owners` chain; required for `resolveInboxActor`
- switching from citizen to VPORT changes: available tabs, owner-only edit controls, chat/inbox persona, business-facing actions

### Actor switch requirements

For a vport to be switchable, ALL of the following must exist:
1. `vc.actors` row with `kind='vport'`, correct `vport_id` pointing to `vport.profiles.id`
2. `platform.user_app_actor_links` row with `is_switchable=true` for this actor + app account
3. `vc.actor_owners` row linking the vport actor to the owner's `user_id`

Missing any one of these causes partial failures:
- missing `user_app_actor_links` → `SWITCH_ABORT_LINK_NOT_FOUND`
- missing `actor_owners` → `ownerActorId=null` → `resolveInboxActor` invalid

### Review author rule

- VPORT reviews only allow composition when `identity.kind === 'user'`

### Subscribers

- VPORT subscriber counts are actor-based and change when the active actor changes

---

## 14. Key Files Reference

- `apps/VCSM/src/features/vport/CreateVportForm.jsx` — create-VPORT form
- `apps/VCSM/src/features/vport/dal/vport.core.dal.js` — core create/read/update DAL (queries `vport.profiles`)
- `apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx` — main public/owner screen
- `apps/VCSM/src/features/profiles/dal/readVportType.dal.js` — resolves category_key via `vport.profile_categories`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/services/readVportTypeByActorId.js` — resolves category_key for services/reviews
- `apps/VCSM/src/features/profiles/kinds/vport/controller/getVportPublicDetails.controller.js` — public details orchestration
- `apps/VCSM/src/features/profiles/kinds/vport/controller/services/getVportServices.controller.js` — services orchestration
- `apps/VCSM/src/features/profiles/kinds/vport/controller/review/VportReviews.controller.js` — review orchestration
- `apps/VCSM/src/features/hydration/vcsmActorHydrator.js` — vport hydration (reads actor_owners for ownerActorId)

---

## 15. Tab Layouts by VPORT Category

Tab configuration: `features/profiles/config/profileTabs.config.js`
Category → layout mapping: `features/profiles/kinds/vport/model/getVportTabsByType.model.js`

> **Note:** The old path `model/gas/getVportTabsByType.model.js` is now a re-export stub only. The canonical file is at `model/getVportTabsByType.model.js`.

Resolution is 3-tier: TYPE_TABS (exact match) → GROUP_TABS (group default) → VPORT_TABS (global fallback).

### Type-level overrides (TYPE_TABS)

These take priority over group defaults.

| Type | Layout |
|---|---|
| barber | `VPORT_BARBER_TABS` |
| barbershop | `VPORT_BARBERSHOP_TABS` |
| locksmith | `VPORT_BARBER_TABS` |
| gas station | `VPORT_GAS_TABS` |
| exchange | `VPORT_RATES_TABS` |
| restaurant | `VPORT_FOOD_BOOK_TABS` |
| caterer | `VPORT_FOOD_BOOK_TABS` |

### Group-level defaults (GROUP_TABS)

Applied when no type override matches.

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

### Layout tab orders

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

### Owner tab

Injected dynamically at the end of `effectiveTabs` when `viewerActorId === profileActorId`. Never stored in config arrays.

### Tab label note

`TAB.BOOK` has key `"book"` and label `"Book"`. (Previously labelled `"Calendar"` — corrected 2026-05-03.)

---

## 16. Weak Spots / Risks

1. `vport.profile_categories` RLS must allow public `authenticated` reads — no public SELECT policy blocks `readVportTypeDAL` silently
2. `refresh_actor_directory_row` DB function still references `vc.vports` — fails non-fatally after creation (tracked, not blocking)
3. Pre-migration vport actors missing `platform.user_app_actor_links` or `vc.actor_owners` must be backfilled manually
4. `vport.create_vport_for_actor` is granted `execute` to `authenticated` without ownership check on `p_actor_id` — security gap, patch pending
5. VPORT spans multiple feature roots — ownership is distributed and easy to fragment
6. Owner behavior inferred from `viewerActorId === profileActorId` — identity drift breaks owner UI silently
9. **`vport.service_catalog` has no `category` column** — the grouping column is `service_group`. Any DAL that selects `category` from this table will get a PostgREST 400 and silently surface as "Failed to load services for this type." Use `service_group` in the SELECT and map it to the domain field at the model layer. Fixed in `readVportServiceCatalogByType.dal.js` and `vportServiceCatalog.model.js` (2026-04-19).
10. **`vc_public` schema does not exist** — any DAL referencing `vc_public.*` views will 404 at runtime. Canonical public data comes from `vport.profiles`, `vport.profile_public_details`, and `vport.menu_*` tables directly
8. **SECURITY DEFINER helper functions in RLS policies** — `actor_can_manage_profile` interferes with `auth.uid()` when called from RLS WITH CHECK clauses. Write policies on menu tables were rewritten to inline the ownership check directly (see `vcsm.vport.menu-pipeline.md`)

---

## 17. Change Log

### 2026-04-16 14:00

**Task:** Align public DALs, fix menu RLS, add optimistic UI  
**Summary:**
- Removed all references to `vc_public.vport_menu_public` and `vc_public.vports_public` — schema does not exist. Public DALs rewritten to query `vport.*` tables directly
- `vport.menu_categories`, `vport.menu_items`, `vport.menu_item_media` — granted INSERT/UPDATE/DELETE to `authenticated`
- RLS write policies on menu tables rewritten with inline `auth.uid()` checks (removed SECURITY DEFINER helper indirection)
- Read DALs for single-category and single-item now join `profiles!inner(actor_id)` to support controller ownership checks
- `useVportActorMenu` gained `patchMenu()` for optimistic state updates
- Optimistic item creation added in `VportActorMenuManagePanel`

**See also:** `vcsm.vport.menu-pipeline.md` (new doc, full menu system reference)

### 2026-04-19

**Task:** Fix VPORT creation service selector — "Failed to load services for this type."
**Summary:**
- `readVportServiceCatalogByType.dal.js` was selecting a `category` column from `vport.service_catalog`. That column does not exist — the correct column is `service_group`. PostgREST returned a 400 on every service catalog fetch, which the hook surfaced as the error message shown in the UI.
- `vportServiceCatalog.model.js` mapper was reading `row.vport_type` (no such column in response) and `row.category` (no such column). Fixed to read `row.category_key` → `vportType` and `row.service_group` → `category`.
- 87 rows confirmed in `vport.service_catalog` across `barber`, `gas_station`, `locksmith`, `restaurant` (and others). Data was always present — only the column name was wrong.

**Files changed:**
- `apps/VCSM/src/features/vport/dal/readVportServiceCatalogByType.dal.js` — select `service_group` not `category`
- `apps/VCSM/src/features/vport/model/vportServiceCatalog.model.js` — `row.category_key` and `row.service_group`

### 2026-04-20

**Task:** VPORT soft delete + hard delete — DB RPCs + DAL wiring
**Summary:**
- Added `deleted_at`, `deleted_by_actor_id` columns to `vport.profiles`
- Created `vport.soft_delete_vport(uuid)` and `vport.restore_vport(uuid)` SECURITY DEFINER RPCs
- Created `vport.hard_delete_vport(uuid)` SECURITY DEFINER RPC — 11-phase FK-safe deletion chain. Actor row is voided (`vc.actors.is_void = true`), not deleted (RESTRICT FK constraints on `vc.post_comments` and `vc.messages` prevent actor hard delete without nuking social content)
- Precondition: hard delete requires `is_deleted = true` (soft delete must be done first)
- Wired `dalDeleteMyVport`, `dalRestoreVport`, `dalHardDeleteVport` in `account.write.dal.js`
- Wired `softDeleteVport`, `restoreVport`, `hardDeleteVport` in `vport.core.dal.js`
- Full reference: `vcsm.vport.delete-lifecycle.md`

**Files changed:**
- `apps/VCSM/supabase/migrations/20260420010000_vport_soft_delete_rpc.sql` (NEW)
- `apps/VCSM/supabase/migrations/20260420020000_vport_hard_delete_rpc.sql` (NEW)
- `apps/VCSM/src/features/settings/account/dal/account.write.dal.js`
- `apps/VCSM/src/features/vport/dal/vport.core.dal.js`

### 2026-05-03

**Task:** VPort tab classification fixes — expand group coverage, add missing layouts, fix tab flash, move resolver  
**Summary:**
- Added 6 new tab layouts to `profileTabs.config.js`: `VPORT_CREATIVE_TABS`, `VPORT_SERVICE_BOOK_TABS`, `VPORT_HEALTH_TABS`, `VPORT_TRADES_TABS`, `VPORT_RETAIL_TABS`, `VPORT_FOOD_BOOK_TABS`
- Expanded GROUP_TABS in tab resolver from 2 entries (Beauty & Wellness, Food) to 11 — all 13 VPORT_TYPE_GROUPS now have an explicit layout; 8 groups previously fell through to bare `VPORT_TABS`
- Added type-level overrides for `restaurant` and `caterer` → `VPORT_FOOD_BOOK_TABS` (Menu + Book + Reviews)
- Fixed `TAB.BOOK` label from `"Calendar"` to `"Book"` — corrects key/label mismatch across all booking-enabled tab bars
- Moved canonical tab resolver from `model/gas/getVportTabsByType.model.js` to `model/getVportTabsByType.model.js` — the `/gas/` folder was incorrect; the file has no gas-specific logic. Old path is now a 2-line re-export stub.
- Fixed `VportProfileViewScreen` initial tab state from `useState("vibes")` to `useState(null)` — eliminates a visible "Vibes" flash before type-specific first tab resolves. Existing auto-select useEffect handles null correctly.
- Updated import path in `VportProfileViewScreen.jsx` to the new resolver location.

**Files changed:**
- `apps/VCSM/src/features/profiles/config/profileTabs.config.js` — 6 new layouts, BOOK label fix
- `apps/VCSM/src/features/profiles/kinds/vport/model/getVportTabsByType.model.js` (NEW) — canonical resolver location, full GROUP_TABS, restaurant/caterer overrides
- `apps/VCSM/src/features/profiles/kinds/vport/model/gas/getVportTabsByType.model.js` — replaced with re-export stub
- `apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx` — `useState(null)`, updated import path
