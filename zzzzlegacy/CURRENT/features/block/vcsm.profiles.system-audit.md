# Profile System Audit

Generated: 2026-04-09
Codebase: `/Users/vcsm/Desktop/VCSM/apps/VCSM`
Target: Barber / Vport profile system — full architecture audit

---

## 1. Summary

The VCSM profile system is a two-track architecture: **user profiles** and **vport profiles** share a common entry screen, header, and privacy gate, then diverge into kind-specific tab layouts and content. Vport profiles use a **config-driven tab system** where tab lists are determined by `vport_type` (barber, restaurant, gas station, exchange, etc.), but **tab content rendering is hardcoded** via switch statements. The system supports owner vs visitor mode, privacy gating, block detection, and actor-safe identity presentation.

**Current state (updated 2026-04-19):** Structurally sound. The DAL → Controller → Hook → Component layering is consistent. The tab configuration system is well-designed. Profile URLs are UUID-free (canonical slugs) when `vport.profiles.slug` is populated; vports without a stored slug fall back to bare UUID as canonical (no routing loop). "self" redirects to canonical, UUID URLs redirect to canonical, slug URLs resolve via DB. The main weaknesses are avatar shape inconsistency, no lazy loading of tab content, services owner editing disabled in profile view, and some empty state gaps.

---

## 2. Profile Architecture

### URL Resolution Pipeline

Updated: 2026-04-18 — All profile URLs are now UUID-free canonical slugs.

```
URL formats accepted:
  /profile/self               → viewer's own profile (redirect to canonical)
  /profile/{vport-slug}       → e.g. /profile/tyba-restaurant
  /profile/{username}         → e.g. /profile/architect1
  /profile/{uuid}             → legacy: redirect to canonical (UUID never shown)
  /profile/{uuid}-{suffix}    → legacy: redirect to canonical

Resolution by input type:
  "self"     → identity.actorId → useActorCanonicalSlug → redirect → /profile/{canonical}
  UUID       → actorId known    → useActorCanonicalSlug → redirect → /profile/{canonical}
  slug/user  → useResolveActorBySlug → DB lookup → actorId → render at /profile/{slug}
```

Strict rule: content only renders when `routeParam === canonicalSlug`. Any mismatch
(including "self") shows a skeleton while the redirect fires.

### Render Chain

```
URL: /profile/:actorId
  ↓
ActorProfileScreen
  ├─ "self"  → actorIdForSelf = identity.actorId → canonical → redirect → /profile/{canonical}
  ├─ UUID    → uuidFromParam extracted → canonical → redirect → /profile/{canonical}
  ├─ slug    → useResolveActorBySlug → actorIdFromSlug → canonical matches → render
  └─ PROFILE_KIND_REGISTRY[kind] → selects screen component

FOR "user":
  ActorProfileViewScreen
    ├─ useProfileView() + useProfileGate() + useBlockStatus()
    ├─ ActorProfileHeader (shared)
    ├─ ActorProfileTabs (hardcoded: posts, photos, videos, tags, friends)
    └─ Tab content via hardcoded switch

FOR "vport":
  VportProfileKindScreen
    ├─ useVportType() → resolves vport category
    ├─ getVportTabsByType(type) → config-driven tab list
    └─ VportProfileViewScreen
        ├─ useProfileView() + useProfileGate() + useBlockStatus()
        ├─ useVportPublicDetails()
        ├─ isOwner = viewerActorId === profileActorId
        ├─ effectiveTabs = baseTabs + "owner" tab if isOwner
        ├─ VportProfileHeader → ActorProfileHeader (shared)
        ├─ VportProfileTabs (scrollable, from effectiveTabs)
        └─ Tab content via hardcoded switch (12 possible tabs)
```

### Canonical Slug Resolution Logic

For vport actors:
  1. `vport.profiles.slug` — stored slug if present and valid
  2. `normalizeSlugPart(vportProfile.name)` — business name fallback

For user actors:
  1. `public.profiles.username` — canonical (most reliable)
  2. `normalizeSlugPart(display_name)` — fallback if username missing

Reverse resolution (slug → actorId) in `resolveActorBySlugOrUsernameDAL`:
  1. `vport.profiles WHERE slug = ?` → vport actor
  2. `public.profiles WHERE username = ?` → profile_id → `vc.actors WHERE profile_id = ? AND kind = 'user'`

**Known data gap:** If `vport.profiles.slug` is NULL for a vport actor, the forward
direction computes a name-derived slug, but the reverse lookup cannot find it (slug column
is NULL). Direct navigation to a name-derived vport URL will fail. Fix: populate
`vport.profiles.slug` for all vport actors.

### Key Files

| File | Role |
|------|------|
| `features/profiles/screens/ActorProfileScreen.jsx` | Entry point — strict URL resolution, redirect enforcement |
| `features/profiles/kinds/profileKindRegistry.js` | Maps kind → screen component |
| `features/profiles/hooks/useResolveActorBySlug.js` | Resolves UUID-free slug/username → actorId via DB |
| `features/profiles/hooks/useActorCanonicalSlug.js` | Computes the canonical slug for a resolved actorId |
| `features/profiles/hooks/useActorSlugRedirect.js` | Enforces redirect when routeParam ≠ canonicalSlug |
| `features/profiles/controller/buildActorCanonicalSlug.controller.js` | Orchestrates DAL reads + slug computation |
| `features/profiles/model/ActorSeoModel.js` | Pure transform: DB rows → canonical slug string |
| `features/profiles/dal/readActorSeoData.dal.js` | All SEO/slug DAL queries + reverse resolution |
| `shared/lib/actorSlug.js` | `isCanonicalSlug`, `extractActorIdFromSlug`, `normalizeSlugPart` |
| `features/profiles/screens/views/ActorProfileViewScreen.jsx` | User profile screen |
| `features/profiles/kinds/vport/screens/VportProfileKindScreen.jsx` | Vport type resolver + tab resolver |
| `features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx` | Vport profile screen |
| `features/profiles/screens/views/ActorProfileHeader.jsx` | Shared header (avatar, name, bio, actions) |
| `features/profiles/config/profileTabs.config.js` | Tab definitions, layouts, feature flags |
| `features/profiles/kinds/vport/model/getVportTabsByType.model.js` | Type → tab layout resolver (canonical location) |

---

## 3. Tabs System

### How Tabs Work

**Tab definitions** are centralized in `profileTabs.config.js`:
- 16 tab types defined in `TAB` catalog
- Feature flags (`TAB_FLAGS`) enable/disable tabs globally
- Layout arrays define tab order per vport type
- `makeTabs()` validates, filters, and freezes arrays

**Tab layout resolution** for vports:
1. `useVportType(actorId)` fetches `vport_type` from DB
2. `getVportTabsByType(type)` resolves tabs via 3-tier priority:
   - Exact type match (TYPE_TABS): barber, barbershop, locksmith, gas station, exchange, restaurant, caterer
   - Group default (GROUP_TABS): all 13 groups now have an explicit layout
   - Global fallback → `VPORT_TABS`
3. Owner detection adds "owner" tab dynamically at end of effectiveTabs

**Layout definitions (updated 2026-05-03):**

| Layout | Vport Types / Groups | Tabs |
|---|---|---|
| `VPORT_TABS` | Other / global fallback | About, Reviews, Content, Vibes, Photos, Subscribers |
| `VPORT_SERVICE_TABS` | Professional & Business Services, Transport & Logistics | Portfolio, Services, Reviews, Content, About, Vibes, Photos, Subscribers |
| `VPORT_BARBER_TABS` | barber, locksmith (type override) | Portfolio, Book, Services, Reviews, Content, About, Photos, Vibes, Subscribers |
| `VPORT_BARBERSHOP_TABS` | barbershop (type override) | Portfolio, Book, Team, Services, Reviews, About, Photos, Vibes, Content, Subscribers |
| `VPORT_FOOD_TABS` | Food, Hospitality & Events (group default) | Menu, Reviews, Content, About, Services, Photos, Vibes, Subscribers |
| `VPORT_FOOD_BOOK_TABS` | restaurant, caterer (type override) | Menu, Book, Reviews, About, Services, Photos, Vibes, Subscribers |
| `VPORT_GAS_TABS` | gas station (type override) | Gas, Services, Content, About, Reviews, Photos, Vibes, Subscribers |
| `VPORT_RATES_TABS` | exchange (type override) | Rates, Services, Content, Reviews, About, Photos, Vibes, Subscribers |
| `VPORT_CREATIVE_TABS` | Arts, Media & Entertainment | Portfolio, Vibes, Content, Reviews, Services, About, Photos, Subscribers |
| `VPORT_SERVICE_BOOK_TABS` | Beauty & Wellness, Education & Care, Sports & Fitness, Animal Care | Portfolio, Book, Services, Reviews, About, Photos, Vibes, Subscribers |
| `VPORT_HEALTH_TABS` | Health & Medical | Book, Services, Reviews, About, Photos, Subscribers |
| `VPORT_TRADES_TABS` | Home, Maintenance & Trades | Portfolio, Services, Book, Reviews, About, Photos, Subscribers |
| `VPORT_RETAIL_TABS` | Retail, Sales & Commerce | Services, Reviews, About, Photos, Vibes, Subscribers |

### Observations

- **Config-driven tab lists** — well-designed, immutable, feature-flagged
- **Hardcoded tab content** — each tab is a `{tab === "key" && <Component />}` block, not lazy-loaded or plugin-based
- **No lazy loading** — all tab view components are imported at module load time
- **URL query support** — `?tab=reviews` switches to requested tab on mount
- **Scrollable tab bar** — VportProfileTabs has horizontal scroll with arrow buttons

---

## 4. Portfolio System

### Architecture

Portfolio is a **derived view** — it renders posts as work samples, not a separate data entity.

```
Posts (useProfileView) + Services (useVportServices) + ServiceProfiles (useBookingServiceProfiles)
  ↓
buildVportPortfolioModel() — 542-line model that merges all three
  ↓
PortfolioTab → PortfolioGrid → PortfolioCard / PortfolioTransformationCard
```

### Features
- Detects work types: SINGLE, GALLERY, TRANSFORMATION (before/after)
- Matches portfolio items to services via tags/keywords
- Client-side tag filtering
- Related services section with pricing/duration
- Loading skeleton and empty state

### Observations
- **Read-only for both owner and visitor** — no inline editing
- Posting new work happens via post creation flow (not portfolio UI)
- Service matching via tag/keyword is fragile — could break if naming conventions change
- Empty state shows preview of published services and links to Services/Reviews tabs

---

## 5. Identity / Actor Presentation

### ActorLink Component

The shared `ActorLink.jsx` is the canonical actor presentation component:
- Default shape: `rounded-xl`
- Default size: `w-11 h-11`
- Accepts `avatarShape` prop for caller override
- Fallback: `/avatar.jpg` on load error
- No kind-based shape differentiation — shape is context-driven

### Avatar Shape Inconsistency

| Context | Shape | Size |
|---------|-------|------|
| Profile header (main) | `rounded-2xl` | `w-24 h-24` |
| Subscriber list | `rounded-xl` | `w-12 h-12` |
| ActorLink default | `rounded-xl` | `w-11 h-11` |
| Notifications | `rounded-xl` | `w-11 h-11` |
| Chat header | `rounded-xl` | `w-10 h-10` |
| Post header | `rounded-lg` | `w-11 h-11` |
| Comment header | `rounded-lg` | `w-9 h-9` |
| Friends list | `rounded-lg` | `w-10 h-10` |
| Review cards | `rounded-xl` | `w-10 h-10` |
| Booking panel | `rounded-md` | `w-10 h-10` |
| Explore results | `rounded-md` | CSS-defined |

**No `rounded-full` anywhere.** The app deliberately avoids circular avatars.

### Main Header Bypasses ActorLink

`ActorProfileHeader.jsx` renders the main avatar directly (`<img>` with `rounded-2xl`) instead of using ActorLink. This is the only place using `rounded-2xl` for avatars.

### Owner vs Visitor

Determined by: `isSelf = viewerActorId === profileActorId`

| Element | Owner | Visitor |
|---------|-------|---------|
| QR button | ✅ Shown | ❌ Hidden |
| Actions menu (block) | ❌ Hidden | ✅ Shown |
| Message button | ❌ Hidden | ✅ Shown |
| Subscribe button | ❌ Hidden | ✅ Shown |
| Owner tab | ✅ Added | ❌ Removed |

### Privacy

- `useProfileGate()` checks privacy + follow status
- Private profiles show `PrivateProfileNotice` instead of tab content
- Header (avatar, name, bio, banner) always visible even on private profiles
- Block detection redirects to `/feed`

---

## 6. Services / Rates

### Services System

```
Catalog DAL + Actor Override DAL + Add-ons DAL
  → getVportServicesController()
  → useVportServices()
  → VportServicesView (mode decision)
    ├─ Visitor → VportServicesPanel (read-only)
    └─ Owner → VportServicesOwnerPanel (editable draft state)
```

- **Owner editing exists** but is **disabled in profile view** — `allowOwnerEditing` prop is not passed from `VportProfileViewScreen`
- Owner UI works in dashboard mode (toggle services, save/reset, dirty state tracking)
- Category-based grouping with service badges
- Empty state: "Service catalog is being prepared" (visitor) / "No services available" (owner)

### Rates System

```
Rates DAL → mapVportRateRows → getVportRatesController → useVportRates → VportRatesView
```

- Display-only (no edit UI in profile view)
- Shows buy/sell pairs with color coding (emerald/amber)
- Per-pair timestamps and global last-updated
- Empty state message is not context-aware (same for owner and visitor)

---

## 7. Reviews Integration

Reviews are rendered as the `reviews` tab in vport profiles.

```
VportProfileViewScreen
  → tab === "reviews"
  → VportReviewsView (targetActorId, profile, viewerActorId, mode)
    → useVportReviews() hook
    → Summary card + compose form + ReviewsList
```

- **Engine-backed** — controller delegates to `engines/reviews/`
- Summary card shows overall rating, count, stars
- Compose form uses dimension pills (not dropdown), progress bar, guided flow
- Optimistic UI for submission (instant card, reconcile on response)
- Review cards show author info via snapshots (SECURITY DEFINER RPC for private actors)
- Author avatar uses `rounded-xl` (matches ActorLink default)
- Owner mode shows tab filters (overall, services, per-dimension)
- Edit/delete for own reviews with confirmation modal

---

## 8. UI / UX Observations

### Strengths
1. Config-driven tab system is clean and extensible
2. DAL → Controller → Hook → Component layering is consistent
3. Privacy gating is well-implemented
4. Review compose form (post-redesign) is guided and clear
5. Portfolio's transformation detection is clever

### Issues

1. **Avatar shape inconsistency** — 4 different rounded values used across the app with no documented standard. Header uses `rounded-2xl`, most components use `rounded-xl` or `rounded-lg`.

2. **Services owner editing disabled** — `VportServicesView` supports owner editing but `VportProfileViewScreen` doesn't pass `allowOwnerEditing={isOwner}`. Owner must use dashboard.

3. **No lazy tab loading** — all 12 tab view components are imported at module load. Large initial bundle for vport profiles.

4. **Rates empty state not context-aware** — shows same "No exchange pairs yet" message to both owner and visitor.

5. **Photos tab has no upload affordance** — photos come from posts, but no CTA explains this or links to post creation.

6. **About tab is read-only everywhere** — editing only in dashboard. No inline edit UI.

7. **Portfolio model complexity** — 542-line model with tag/keyword matching for service association. Fragile if naming changes.

8. **Main header bypasses ActorLink** — renders avatar directly with `rounded-2xl` instead of using the shared component.

---

## 9. Structural Risks / Duplication

| Risk | Impact | Details |
|------|--------|---------|
| Hardcoded tab switch (12 branches) | Medium | Adding a new tab requires touching VportProfileViewScreen + config + new component. Not plugin-based. |
| Avatar shape drift | Low | Each new component picks its own shape. No enforced standard. |
| Portfolio ↔ Service matching fragility | Medium | Tag-based matching between posts and services can break silently. |
| Services allowOwnerEditing gap | Low | Owner panel exists but is unreachable from profile view. |
| No tab content code splitting | Medium | All tab views imported eagerly. Affects initial load. |
| Photos as posts abstraction | Low | Users may not understand that adding photos requires creating a post. |

---

## 10. Suggested Improvements (Non-breaking)

1. **Standardize avatar shapes** — define a shape scale (`xs: rounded-md`, `sm: rounded-lg`, `md: rounded-xl`, `lg: rounded-2xl`) and document which contexts use which. Consider making ActorLink the only avatar renderer.

2. **Enable services owner editing in profile** — pass `allowOwnerEditing={isOwner}` to `VportServicesView` in `VportProfileViewScreen.jsx` line 355.

3. **Context-aware empty states** — rates, services, and portfolio empty states should show different copy for owner ("Set up your rates") vs visitor ("No rates available yet").

4. **Lazy load tab content** — wrap each tab view in `React.lazy()` + `Suspense` to code-split. Tabs are already config-driven, making this straightforward.

5. **Photos tab upload CTA** — add "Share your work" button in empty state that navigates to post creation.

6. **About tab inline editing** — add edit button for owner that opens a form or links to dashboard settings.

7. **Portfolio service matching** — add explicit `service_id` tagging on posts instead of relying on keyword matching. This would make the association reliable.

8. **Use ActorLink for header avatar** — have ActorProfileHeader use ActorLink with `avatarShape="rounded-2xl"` and `avatarSize="w-24 h-24"` instead of direct `<img>` rendering.

---

## Final Answer

**What is the true blueprint for the Barber / Vport profile system today?**

The blueprint is a **kind-routed, config-driven profile system** where:
- A shared entry screen resolves actor kind and routes to the correct profile view
- Vport profiles resolve their `vport_type` from DB and select a tab layout from a frozen config array
- Tab content is rendered via hardcoded switch statements (not lazy, not plugin-based)
- A shared header component renders identity, actions, and privacy controls
- Owner/visitor mode is determined by simple actor ID comparison
- Privacy gating blocks tab content but keeps header visible
- Reviews are engine-backed with optimistic UI
- Portfolio is derived from posts (not a separate entity)
- Services have full owner editing capability but it's disabled in profile view

**What parts could be improved?**

1. **Avatar consistency** — standardize shapes across all contexts using a documented scale, route all rendering through ActorLink
2. **Tab loading** — add lazy loading to reduce initial bundle for vport profiles with 12 possible tab views
3. **Owner editing access** — enable the existing services owner panel in profile view (one prop change)
4. **Empty states** — make them context-aware (owner vs visitor get different messaging and CTAs)
5. **Portfolio reliability** — replace tag-based service matching with explicit service ID associations on posts
6. **Photos clarity** — make the connection between photos and posts obvious with upload CTAs

None of these require architectural changes. The current layering (DAL → Controller → Hook → Component), tab config system, and actor-safe identity model are solid foundations that should be preserved.

---

## Change Log — 2026-04-19

### About Tab — vportType Resolution Bug

**File:** `apps/VCSM/src/features/profiles/kinds/vport/screens/views/tabs/VportAboutView.jsx`

`VportAboutView` resolved `type` (used to gate locksmith-specific sections) only from `profile`:
```js
const type = profile?.vportType || profile?.type || profile?.vport_type || null;
```

`profile.vportType` comes from `readActorProfileDAL` → `read_actor_profile` RPC which does **not** return `vport_type`. So `type` was always `null` for vport profiles — locksmith service areas, and any future type-gated sections, never rendered.

**Fix:** Fall through to `details?.vportType` which is reliably set via `getVportPublicDetailsController` → `readVportTypeDAL` → `vport.profile_categories`:
```js
const type = profile?.vportType || profile?.type || profile?.vport_type || details?.vportType || null;
```

**Known gap:** `read_actor_profile` RPC does not return `vport_type`. If the RPC is ever extended to include it, `profile.vportType` will resolve first and the `details` fallback becomes a no-op (safe). Do not add `vport_type` to the RPC without also updating `readActorProfileDAL` to map it into the vport object.

---

### Profile Navigation Regression — /feed Redirect Loop

**Root cause:** `ActorSeoModel` and `buildActorCanonicalSlugController` derived a canonical slug from `vportProfile.name` (normalized, e.g. "Tyba Restaurant" → "tyba-restaurant") when `vport.profiles.slug` is NULL. When a user navigated to `/profile/tyba-restaurant`, `resolveActorBySlugOrUsernameDAL` queried `vport.profiles.slug = 'tyba-restaurant'` — no match (slug column is NULL) — returned null → `slugNotFound = true` → production redirect to `/feed`.

**Redirect loop reproduced as:**
1. Legacy UUID URL → redirect to `/profile/tyba-restaurant` (from normalized name)
2. `/profile/tyba-restaurant` → slug lookup fails → `/feed`

**Fix (3 files):**

`apps/VCSM/src/features/profiles/model/ActorSeoModel.js`
- Removed `vportProfile.name` normalized from canonical slug priority
- Vports without `vport.profiles.slug` return `null` from the model

`apps/VCSM/src/features/profiles/controller/buildActorCanonicalSlug.controller.js`
- Replaced hydration-store name fallback (`storeActor.vportName` normalized) with bare `actorId`
- Removed unused `normalizeSlugPart` and `useActorStore` imports

`apps/VCSM/src/features/profiles/screens/ActorProfileScreen.jsx`
- Removed `!isCanonicalSlug(routeParam) ||` from render gate
- Render now fires when `routeParam === canonicalSlug` regardless of whether canonical is a bare UUID
- Removed unused `isCanonicalSlug` import

**Result:** Vports with `vport.profiles.slug` populated get clean UUID-free URLs (unchanged). Vports without a stored slug use bare `actorId` as canonical — renders at `/profile/{uuid}`, no loop, no feed redirect. Legacy UUID-prefixed URLs redirect once to the correct canonical and render.

---

### Feed Vport Names — "User" on Refresh

**Root cause:** `useFeed.js` and `normalizeFeedRows.js` both keyed into `vportMap[a.vport_id]` instead of `vportMap[a.id]`. The `readActorsBundle` DAL keys `vportMap` by actor UUID (`v.actor_id`), but `a.vport_id` is a different FK field (vport.profiles.id) which is null for most rows. Result: vport name lookup always missed → `vport_name = null` in immediate store upsert → `useActorSummary` returned "User" until background `hydrateActorsByIds` corrected the store.

**Fix:**
`apps/VCSM/src/features/feed/model/normalizeFeedRows.js` line 44:
```js
// Before: const vp = a?.vport_id ? vportMap[a.vport_id] : null;
const vp = a?.kind === 'vport' ? (vportMap[a.id] ?? null) : null;
```
`apps/VCSM/src/features/feed/hooks/useFeed.js` lines 203–208:
```js
// Before: vportMap[a.vport_id] (wrong key), guarded by a.vport_id (wrong field)
photo_url: vportMap[a.id]?.avatar_url ?? null
vport_name: a.kind === 'vport' ? vportMap[a.id]?.name ?? null : null
vport_slug: a.kind === 'vport' ? vportMap[a.id]?.slug ?? null : null
```

---

### Profile Canonical Slug — Hardened Error Fallback

`useActorCanonicalSlug.js` catch block: on controller throw (network failure, RLS error), now falls back to bare `actorId` instead of `null`. Prevents the `!canonicalSlug` production gate from sending the user to `/feed` on transient errors.

---

### Subscribe Count — No Optimistic Update

**Root cause:** `useFollowerCount` exposed only `refresh()` (triggers server re-fetch). The `onAfterChange` callback in `ActorProfileHeader` called `refreshFollowerCount()` **after** the server round-trip completed, so the displayed count was stale for the full duration of both the toggle RPC and the count RPC.

**Fix (2 files):**

`apps/VCSM/src/features/social/friend/subscribe/hooks/useFollowerCount.js`
- Added `optimisticAdjust(delta)` — `setCount(c => Math.max(0, c + delta))`, floored at 0

`apps/VCSM/src/features/profiles/screens/views/ActorProfileHeader.jsx`
- Renamed raw `onClick` from `useSubscribeAction` to `onSubscribeAsync`
- Added `onSubscribe` wrapper: calls `optimisticAdjust(isSubscribed ? -1 : 1)` synchronously, then fires `onSubscribeAsync()`
- `onAfterChange` still calls `refreshFollowerCount()` to sync actual server value after toggle resolves

---

### Bottom Nav /profile/self — Stuck in Skeleton (useActorSlugRedirect Loop Guard Bug)

**Root cause:** `useActorSlugRedirect` used a `useRef` (`lastRedirectedTo`) as a loop-prevention guard. The ref persisted across navigations within the same mounted component instance (React Router reuses the same component for all `/profile/:actorId` routes).

**Reproduction sequence:**
1. Click feed profile → `/profile/self` → redirect fires → `lastRedirectedTo.current = "architect2"` → URL becomes `/profile/architect2` → renders
2. Click bottom nav profile button → `/profile/self` again (same component instance, ref still set)
3. Effect runs: `lastRedirectedTo.current === canonicalSlug` → "architect2" === "architect2" → **guard returns early → no redirect → skeleton forever**

**Why it was originally safe:** The guard was added to prevent double-navigate calls during a single transition. But it never reset between navigations, so any second visit to `/profile/self` (or any non-canonical URL) was permanently blocked.

**Fix:**
`apps/VCSM/src/features/profiles/hooks/useActorSlugRedirect.js`
- Removed `lastRedirectedTo` ref and its guard entirely
- Removed unused `useRef` import
- `routeParam === canonicalSlug` check is sufficient loop prevention — once navigate lands at canonical, the effect exits immediately because the params match

**Note:** The `routeParam === canonicalSlug` guard is the correct and sufficient loop-break. No ref needed. After navigate fires and the URL becomes the canonical slug, the effect re-runs with `routeParam === canonicalSlug` → returns early. No infinite loop possible.
