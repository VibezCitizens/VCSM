# BOTTOM NAV — PROFILE (CITIZEN) BUTTON ARCHITECTURE MAP

**Generated:** 2026-05-11
**Button:** Profile / Citizen (User icon)
**Route:** `/profile/{slug}` (fast path) or `/profile/self` (fallback)
**Feature:** profiles, identity

---

## Button Definition

```jsx
<ProfileNavTab personaActorId={personaActorId} navigate={navigate} location={location} t={t} />
```

Custom component — NOT a NavLink. Uses `onClick` handler with programmatic navigate.

```js
// STATICALLY TRACED:
const cached = getCachedActorCanonicalSlug(personaActorId)
if (cached) {
  navigate(`/profile/${cached}`)       // FAST PATH: direct slug navigation
} else {
  navigate('/profile/self')             // FALLBACK: triggers slug resolution
}
```

Active detection: `location.pathname.startsWith('/profile')`

---

## Two Resolution Paths

### Path A — Fast Path (cached slug, most common after first visit)

```
User taps Profile
  → getCachedActorCanonicalSlug(actorId) → controllerCache.get(actorId)?.canonicalSlug
  → Cache hit (10min TTL) → navigate('/profile/{slug}')
  → ActorProfileScreen: routeParam === canonicalSlug → renders immediately
  → PROFILE_KIND_REGISTRY[kind] → UserProfileKindScreen or VportProfileKindScreen
```

**DB reads:** ZERO (cache hit) — slug served from controller TTL cache.

### Path B — Fallback (first visit or TTL expired)

```
User taps Profile
  → getCachedActorCanonicalSlug(actorId) → null (cache miss)
  → navigate('/profile/self')
  → ActorProfileScreen: isSelf=true, actorIdForSelf=identity?.actorId
  → useActorCanonicalSlug(actorId)
    → buildActorCanonicalSlugController(actorId)
      → controllerCache.get(actorId) → null (miss)
      → readActorSeoViewDAL(actorId) → vport.public_actor_seo_v (SELECT)
      → ActorSeoModel → builds canonicalSlug
      → controllerCache.set(actorId, { canonicalSlug }) [10min TTL]
  → useActorSlugRedirect: if routeParam !== canonicalSlug → navigate('/profile/{slug}', replace)
  → Screen renders at canonical URL
```

**DB reads:** 1 (readActorSeoViewDAL → `vport.public_actor_seo_v`)

---

## Screen Chain

```
/profile/self → ActorProfileScreen (resolves slug → redirect to /profile/{slug})
/profile/{slug} → ActorProfileScreen → PROFILE_KIND_REGISTRY[kind]
```

**Entry Screen:** `features/profiles/screens/ActorProfileScreen.jsx`
**Kind Registry:** `features/profiles/kinds/profileKindRegistry.js`
- `user` → `UserProfileKindScreen` (INFERRED from registry)
- `vport` → `VportProfileKindScreen`

---

## Primary Hooks (in ActorProfileScreen)

| Hook | File | Purpose | DB? |
|---|---|---|---|
| `useIdentity` | `identity/adapters/identity.adapter` | Gets viewer actorId and kind | Identity store |
| `useResolveActorBySlug(slug)` | `profiles/hooks/useResolveActorBySlug.js` | Resolves slug → actorId | Reads actor directory |
| `useActorCanonicalSlug(actorId)` | `profiles/hooks/useActorCanonicalSlug.js` | Gets canonical slug via controller | `vport.public_actor_seo_v` |
| `useActorSlugRedirect` | `profiles/hooks/useActorSlugRedirect.js` | Redirects non-canonical URLs to canonical | Navigation only |
| `useActorKind(actorId)` | `profiles/hooks/useActorKind.js` | Fetches actor kind (user/vport) | `vc.actors` |
| `useVportType(actorId)` | `profiles/hooks/useVportType.js` | Prefetches vport type for kind screen | INFERRED: vport.profiles |
| `useVportProfileBySlug(slug)` | `profiles/kinds/vport/hooks/useVportProfileBySlug.js` | Vport profile data prefetch | `vport.profiles` (INFERRED) |
| `useProfileRouteTelemetry` | `profiles/screens/hooks/useProfileRouteTelemetry.js` | IOS prod debug logging | No DB |

---

## Primary DAL Reads

| DAL Method | File | Tables / Views / RPCs | Condition |
|---|---|---|---|
| `readActorSeoViewDAL` | `profiles/dal/readActorSeoData.dal.js` | `vport.public_actor_seo_v` | On cache miss |
| `useResolveActorBySlug` DAL | INFERRED | `identity.actor_directory` or `vc.actors` | When navigating to non-self slug |
| `useActorKind` DAL | INFERRED | `vc.actors` | When kind not in identity |
| `useVportType` DAL | INFERRED | `vport.profiles` | Prefetch on vport actor |

---

## State Stores / Caches

| Store | Data | TTL |
|---|---|---|
| `controllerCache` (TTL Map) | `{ canonicalSlug, slugParts, actorKind }` keyed by actorId | 10 min |
| `identitySelection.store` | actorId + kind for viewer | Session |
| actorStore | Hydrated actor records | 5 min TTL |

---

## Loading / Redirect States

| State | Behavior |
|---|---|
| identityLoading | Show skeleton |
| identity missing | Redirect to /login |
| slugResolveLoading | Show skeleton |
| slugResolveError | Show error message (or debug panel in DEV) |
| slugNotFound | Redirect to /feed |
| slugLoading | Show skeleton |
| canonicalSlug missing | Redirect to /feed |
| routeParam !== canonicalSlug | Show skeleton (awaiting redirect) |
| kindLoading | Show skeleton |
| Render | PROFILE_KIND_REGISTRY[kind] → kind screen |

---

## Security / Ownership Gates

- Requires `identity` (auth redirect if missing)
- Profile is public for authenticated actors (no owner-only gate at this level)
- VportProfileKindScreen and UserProfileKindScreen own their own owner-only section gates

---

## Spaghetti / Risk Flags

| Signal | Evidence | Risk | Handoff |
|---|---|---|---|
| Profile tab navigates to `/profile/` (non-standard path) | Route tree shows `/u/:username` and `/v/:slug` as canonical in routes doc but BottomNavBar uses `/profile/:slug` | MEDIUM — ambiguous route family? | NEEDS LOKI |
| Multiple skeleton render conditions | 7 separate skeleton return points in ActorProfileScreen | MEDIUM — complex loading waterfall | KRAVEN |
| `appendIOSProdDebugLog` calls on each redirect | IOS prod debug logging on every redirect — console + storage writes | LOW — acceptable prod telemetry | — |
| `useActorKind` and `useVportType` may fire in parallel | Both hook into actorId but read different tables — potentially parallel | LOW — acceptable | — |

---

## Missing Pieces

- Canonical route unclear: `/profile/:slug` vs `/u/:username` vs `/v/:slug` (NEEDS LOKI)
- ProfileNavTab `isActive` check uses `/profile` prefix — `/u/:username` and `/v/:slug` will NOT activate the profile tab (INFERRED risk)
- `PROFILE_KIND_REGISTRY` not read — full kind map unknown
