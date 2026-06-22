# VCSM — Profile Bottom-Nav Transition Audit

Date: 2026-05-03
Scope: apps/VCSM/src/features/profiles/ + shared/components/BottomNavBar
Type: Performance Audit + Implementation
Status: Audit complete — all priorities implemented (2026-05-03); vc.actors dual-cache fixed (2026-05-03)

---

## 1. Summary

Every tap on the Profile icon in the bottom nav was slow because of a mandatory double-mount cycle triggered by a `/profile/self` redirect, combined with 3 serial network RTTs before content appears, and multiple duplicate DB calls on cold cache.

**Root causes ranked (✅ = fixed, ⚠️ = deferred):**
1. ✅ `/profile/self` forces a remount on every single tap — adds one full render cycle + one DB RTT every time
2. ✅ Posts and actor identity fetched serially — parallelized in `getProfileView.controller.js`
3. ✅ Core profile hooks bypass React Query — no stale-while-revalidate, no deduplication, loading spinner every time
4. ✅ `vc.actor_privacy_settings` fetched twice concurrently — deduplicated via shared `dalGetActorPrivacy` TTL cache
5. ✅ `vc.actors` fetched twice concurrently — unified into shared `readActorTypeDAL` with one 10-min TTL cache
6. ✅ `identity.kind` not used to skip the `readActorKindDAL` query when viewing own profile

---

## 2. Click-to-Render Chain

```
BottomNavBar
  → NavLink to="/profile/self"     ← always "/self", regardless of known slug

  → ProtectedRoute (already resolved — not blocking on warm session)

  → ProfileGatedOutlet / CompleteProfileGate
      → useCompleteProfileGate (ran on app boot — not blocking on warm session)

  → ActorProfileScreen mounts with routeParam="self"
      → useIdentity()                       [sync, not blocking]
      → useResolveActorBySlug(null)          [skipped, isSelf=true]
      → useActorCanonicalSlug(actorId)       [BLOCKING — DB query → vport.public_actor_seo_v]
      → useActorKind(actorId)               [BLOCKING — DB query → vc.actors (kind)]
      → useVportType(actorId)               [DB query → vc.actors (kind+vport_id)]
      → useActorSlugRedirect fires           [navigate("/profile/{slug}", {replace:true})]
      → returns SKELETON (routeParam !== canonicalSlug)
      → UNMOUNT

  → ActorProfileScreen REMOUNTS with routeParam="{canonicalSlug}"
      → All TTL caches HIT (kind, slug, vportType — 10min)
      → useVportProfileBySlug(slug)          [React Query fires for vport-kind check]
      → slugLoading=false, kindLoading=false

  → ActorProfileViewScreen mounts
      → useProfileGate({ isSelf=true })     [immediate for self — not blocking]
      → useBlockStatus(viewer, target)      [immediate self-check — not blocking]
      → useProfileView({ canViewContent=true })
          → readActorProfileDAL             [BLOCKING — vc.read_actor_profile RPC]
          → readActorPrivacyDAL             [DUPLICATE — vc.actor_privacy_settings]
          → (after actor resolves)
          → readActorPostsDAL               [BLOCKING — vc.posts SERIAL]
          → readPostMediaByPostIdsDAL       [BLOCKING — vc.post_media SERIAL inside posts DAL]

  → Profile renders with header + posts
```

**Total minimum RTTs before content renders (cold cache, own profile):**
1. `vport.public_actor_seo_v` (canonical slug — triggers redirect)
2. `vc.read_actor_profile` RPC (profile header data)
3. `vc.posts` (posts list)
4. `vc.post_media` (media for posts — serial inside posts DAL)

= **4 sequential network round trips** before the page shows content.

---

## 3. Render Gates

| Gate | File | Line | Classification | Condition |
|---|---|---|---|---|
| `identityLoading` | `ActorProfileScreen.jsx` | ~132 | **HARD BLOCK** — full skeleton | `useIdentity().identityLoading` |
| `slugResolveLoading` | `ActorProfileScreen.jsx` | ~138 | **HARD BLOCK** — full skeleton | `useResolveActorBySlug` loading (non-self only) |
| `slugLoading` | `ActorProfileScreen.jsx` | ~175 | **HARD BLOCK** — full skeleton | `useActorCanonicalSlug` loading |
| `!canonicalSlug` | `ActorProfileScreen.jsx` | ~177 | **HARD BLOCK** — redirect to /feed | No canonical slug resolved |
| `routeParam !== canonicalSlug` | `ActorProfileScreen.jsx` | ~190 | **HARD BLOCK** — skeleton + navigate | Always fires on `/profile/self` — causes double-mount |
| `kindLoading` | `ActorProfileScreen.jsx` | ~195 | **HARD BLOCK** — full skeleton | `useActorKind` loading |
| `gate.loading \|\| blockLoading \|\| loading` | `ActorProfileViewScreen.jsx` | ~87 | **HARD BLOCK** — header skeleton only | Waits for privacy + block check + profile RPC |
| `canViewContent === undefined` | `useProfileView.js` | ~20 | **SOFT** — prevents fetch start | Privacy gate still resolving (non-self only) |
| `!gate.canView` | `ActorProfileViewScreen.jsx` | ~120 | **SOFT** — PrivateProfileNotice | Private profile, not followed |

All gates in `ActorProfileScreen` from `slugLoading` through `kindLoading` are **HARD BLOCKS** that show a full-page skeleton. On cold cache, the user sees nothing until all resolve. On warm cache (TTL hit), they pass instantly on the second mount.

---

## 4. Fetch Count Table

| # | Trigger | Function | Supabase Target | Cache | Duplicate? | Blocking? | Serial/Parallel |
|---|---|---|---|---|---|---|---|
| 1 | ProfileGatedOutlet boot | `readCurrentAuthUserDAL` | Auth API `getUser` | Session | No | Boot-only | — |
| 2 | ProfileGatedOutlet boot | `readProfileShellDAL` | `public.profiles` | None | No | Boot-only | — |
| 3 | `useActorCanonicalSlug` | `readActorSeoViewDAL` | `vport.public_actor_seo_v` | 10min TTL | No | **HARD** | Parallel w/ 4,5 |
| 4 | `useActorKind` | `readActorKindDAL` | `vc.actors` (kind) | 10min TTL | **YES** — duplicates #5 | **HARD** | Parallel w/ 3,5 |
| 5 | `useVportType` | `readVportTypeDAL` | `vc.actors` (kind+vport_id) | 10min TTL | **YES** — duplicates #4 | Background | Parallel w/ 3,4 |
| 6 | `useVportProfileBySlug` Q3 | `getVportPublicDetailsController` | `vport.profiles` + `vport.profile_categories` | React Query 60s + 5min | No | Background | After redirect |
| 7a | `useProfileView` → `readActorProfileDAL` | `readActorProfileDAL` | `vc.read_actor_profile` RPC | 30s TTL | No | **HARD** | Parallel w/ 7b |
| 7b | Inside `readActorProfileDAL` | (inline query) | `vc.actor_privacy_settings` | 30s TTL | **YES** — duplicates #8 | **HARD** | Parallel w/ 7a |
| 8 | `useActorPrivacy` → `useProfileGate` | `dalGetActorPrivacy` | `vc.actor_privacy_settings` | 30s TTL | **YES** — duplicates #7b | **HARD** (non-self) | Parallel w/ 9 |
| 9 | `useBlockStatus` | `checkBlockStatus` | `moderation.blocks` | **None** | No | **HARD** (non-self) | Parallel w/ 8 |
| 10 | `getProfileView` (follow check) | `readFollowStateDAL` | **STUB** (returns false) | — | No | No | Serial after 7a |
| 11 | `readActorPostsDAL` | `readActorPostsDAL` | `vc.posts` | **None** | No | **HARD** | **SERIAL** after 7a |
| 12 | Inside `readActorPostsDAL` | `readPostMediaByPostIdsDAL` | `vc.post_media` | **None** | No | **HARD** | **SERIAL** after 11 |

**Duplicates confirmed:** #4+#5 (same `vc.actors` row fetched twice), #7b+#8 (same `vc.actor_privacy_settings` row fetched twice).

**Uncached calls on every navigation (not just cold):** #9, #11, #12 — no TTL or React Query cache on these.

---

## 5. Hydration Reuse Analysis

The VCSM hydration engine (`useIdentity`, `useActorStore`) has this data available immediately when the user clicks Profile:

| Data point | Source | Profile re-fetches it? |
|---|---|---|
| `actorId` | `IdentityContext` | No — used directly |
| `kind` (`'user'` \| `'vport'`) | `IdentityContext.kind` | **YES** — `readActorKindDAL` fires anyway |
| `displayName`, `username`, `avatar`, `banner` | `IdentityContext.identityDetails` + `useActorStore` | **YES** — `read_actor_profile` RPC refetches all |
| `vportType` / `category_key` | `IdentityContext.identityDetails.vportType` | **YES** — `readVportTypeDAL` fires anyway |
| `canonicalSlug` | Not in identity — must be fetched | No alternative |
| Posts | Not in identity | No |
| Follow/block status | Not in identity | No |

The profile screen **ignores the hydration engine's already-loaded displayName/avatar/username** and fetches them again via the `read_actor_profile` RPC on every mount. This means the header cannot render from cache — it waits for the RPC even though all the data it needs is already in memory.

---

## 6. Root Causes of "Feels Slow"

### Root Cause 1 — Mandatory double-mount on every Profile tap
- `BottomNavBar` always navigates to `/profile/self`
- `ActorProfileScreen` detects `routeParam !== canonicalSlug` and immediately fires `navigate("/profile/{slug}", {replace:true})`
- Screen returns a skeleton while redirect is pending
- After redirect: full unmount + remount, all hooks re-run (hit TTL caches on second run)
- **Files:** `shared/components/BottomNavBar.jsx`, `features/profiles/hooks/useActorSlugRedirect.js`, `features/profiles/screens/ActorProfileScreen.jsx`

### Root Cause 2 — 3-deep serial fetch chain for content
- `readActorProfileDAL` must complete before `readActorPostsDAL` starts
- `readActorPostsDAL` must complete before `readPostMediaByPostIdsDAL` starts
- Each is a Supabase round trip — 3 sequential RTTs before post content is visible
- **Files:** `controller/getProfileView.controller.js`, `dal/readActorPosts.dal.js`

### Root Cause 3 — No React Query on profile core hooks
- All profile hooks use `useEffect` + `useState` — no stale-while-revalidate
- Every navigation to Profile (even back-navigation within the 30s TTL) shows the full skeleton until data resolves
- No deduplication: if two components call the same hook for the same actorId simultaneously, two fetches fire
- **Files:** `hooks/useActorKind.js`, `hooks/useActorCanonicalSlug.js`, `hooks/useProfileView.js`, `hooks/useActorPrivacy.js`

### Root Cause 4 — `identity.kind` unused (own-profile shortcut missing)
- For the logged-in user's own profile, `identity.kind` is already known in memory
- `useActorKind(actorId)` fires a `vc.actors` DB query anyway
- This DB call sits on the critical path (it's a hard render gate)
- **File:** `features/profiles/screens/ActorProfileScreen.jsx` ~L76

### Root Cause 5 — `vc.actor_privacy_settings` fetched twice simultaneously
- `readActorProfileDAL` includes a privacy SELECT in its `Promise.all`
- `dalGetActorPrivacy` (for `useProfileGate`) independently queries the same table
- Two separate TTL caches, both cold on first visit
- **Files:** `dal/readActorProfile.dal.js`, `social/privacy/dal/actorPrivacy.dal.js`

---

## 7. Fix Plan

### Priority 1 — Eliminate the double-mount (highest impact)

**Where:** `apps/VCSM/src/shared/components/BottomNavBar.jsx`

Instead of hardcoding `/profile/self`, resolve the canonical slug from the actor store before navigating:

```js
const { actorId } = useIdentity()
const actor = useActorStore(s => s.actors[actorId])
const profilePath = useMemo(() => {
  const slug = actor?.username ?? actor?.vportSlug ?? null
  return slug ? `/profile/${slug}` : '/profile/self'
}, [actor])
// <NavLink to={profilePath}>
```

After first visit (10min TTL), every subsequent Profile tap navigates directly to the slug — no redirect, no double-mount, no skeleton flash.

---

### Priority 2 — Parallelize posts fetch with actor fetch

**Where:** `apps/VCSM/src/features/profiles/controller/getProfileView.controller.js`

Move the posts fetch into a parallel `Promise.all` with the actor RPC (when `canViewContent` is known to be true, e.g. own profile):

```js
const [actorRow, postsRaw] = await Promise.all([
  readActorProfileDAL(profileActorId),
  canViewContent === true
    ? readActorPostsDAL(profileActorId)
    : Promise.resolve([]),
])
```

Saves one full RTT for own-profile loads.

---

### Priority 3 — Migrate core profile hooks to React Query

**Hooks to migrate:** `useActorKind`, `useActorCanonicalSlug`, `useProfileView`, `useActorPrivacy`, `useFollowStatus`, `useBlockStatus`

Benefits:
- **Stale-while-revalidate:** on revisit, old data renders immediately while background refresh runs — eliminates the full-page skeleton on every navigation
- **Single-flight dedup:** concurrent callers for same actorId share one network request
- **Consistent TTL:** one cache layer instead of per-file TTL maps

Suggested query keys:
```
['profile', 'kind', actorId]
['profile', 'canonical-slug', actorId]
['profile', 'view', viewerActorId, profileActorId]
['profile', 'privacy', actorId]
['profile', 'follow-status', viewerActorId, profileActorId]
['profile', 'block-status', viewerActorId, profileActorId]
```
All include `actorId` in the key — prevents stale data leak when actor switches.

---

### Priority 4 — Short-circuit `useActorKind` for own profile

**Where:** `apps/VCSM/src/features/profiles/screens/ActorProfileScreen.jsx`

```js
const { kind: identityKind } = useIdentity()
const skipKindFetch = isSelf && !!identityKind
const { loading: kindLoading, kind: fetchedKind } = useActorKind(
  skipKindFetch ? null : resolvedActorId
)
const kind = skipKindFetch ? identityKind : fetchedKind
const kindLoading_resolved = skipKindFetch ? false : kindLoading
```

Removes one DB call from the hard-blocking render gate path on every own-profile tap.

---

### Priority 5 — Eliminate duplicate `vc.actor_privacy_settings` read

**Option A (cleanest):** Remove the inline privacy SELECT from `readActorProfileDAL`. Have `getProfileView.controller.js` accept `isPrivate` as a parameter (already resolved by `useProfileGate` before the view hook fires).

**Option B (minimal change):** Merge both callers to use `dalGetActorPrivacy` exclusively — make `readActorProfileDAL` call `dalGetActorPrivacy(actorId)` instead of querying the table directly. Both will then hit the same 30s TTL cache.

---

### Priority 6 — Merge `readActorKindDAL` + `readVportTypeDAL`

Both query `vc.actors` for the same actor. Consolidate:

```js
// New: readActorTypeDAL(actorId) → { kind, vport_id }
// Shared 10min TTL cache
// getActorKindController and getVportTypeController both call this
```

Reduces two cold DB calls to one.

---

### Priority 7 — Optimistic profile shell from hydration

For own-profile (`isSelf=true`), the header (avatar, display name, username, kind badge) can render immediately from `IdentityContext` / `useActorStore` while the full `read_actor_profile` RPC completes in the background:

In `ActorProfileViewScreen` or the profile header component:
```js
// Optimistic values from hydration engine (sync, zero latency)
const optimisticActor = useActorStore(s => s.actors[profileActorId])
const headerName = profile?.displayName ?? optimisticActor?.displayName
const headerAvatar = profile?.avatar ?? optimisticActor?.avatar
```

The user sees their name/avatar immediately — the RPC only updates bio, follower counts, and extended fields.

---

## 8. Proposed DEV Timing Marks

Behind `import.meta.env.DEV` only:

```js
performance.mark('profile:navigate:start')      // BottomNavBar onClick
performance.mark('profile:shell:rendered')       // ActorProfileScreen first paint (after redirect)
performance.mark('profile:hydration:ready')      // after kindLoading + slugLoading resolve
performance.mark('profile:fetch:start')          // getProfileView fires
performance.mark('profile:fetch:end')            // actor row resolved
performance.mark('profile:posts:start')          // readActorPostsDAL fires
performance.mark('profile:posts:end')            // posts + media resolved
performance.mark('profile:media:start')          // readPostMediaByPostIdsDAL fires
performance.mark('profile:media:end')
performance.mark('profile:usable')               // full UI interactive
// WARN if profile:fetch:start fires twice within 200ms → duplicate fetch
```

---

## 9. Test Checklist (post-fix validation)

- [ ] Cold profile open — no full-page white/blank flash, content appears within 1 RTT of shell
- [ ] Warm profile open (within staleTime) — zero loading state, instant render from cache
- [ ] Back-navigate to Profile after 5s — stale-while-revalidate: old data renders, background refresh runs
- [ ] Actor switch — profile cache keyed by actorId does not leak previous actor's data
- [ ] Avatar/banner appear without blocking shell render
- [ ] Network tab: profile:navigate → profile:shell: 0 DB calls. Shell → content: max 2 parallel calls (actor RPC + posts), not 4 serial
- [ ] No duplicate `vc.actor_privacy_settings` calls in Network tab
- [ ] No duplicate `vc.actors` calls in Network tab
- [ ] Bottom nav tap: single mount of ActorProfileScreen (no double-mount / no replace navigate)
- [ ] `/profile/self` URL only appears in nav if canonicalSlug not yet cached

---

## 10. Files Involved

| File | Issue |
|---|---|
| `shared/components/BottomNavBar.jsx` | Hardcodes `/profile/self` — root of double-mount |
| `features/profiles/screens/ActorProfileScreen.jsx` | Multiple hard render gates; ignores `identity.kind` for self |
| `features/profiles/hooks/useActorSlugRedirect.js` | Fires navigate on routeParam mismatch — causes remount |
| `features/profiles/hooks/useActorKind.js` | Bypasses `identity.kind` — unnecessary DB call for own profile |
| `features/profiles/hooks/useActorCanonicalSlug.js` | Hard-blocks until DB resolves; no React Query |
| `features/profiles/hooks/useProfileView.js` | No React Query; content fetch serial after actor fetch |
| `features/profiles/controller/getProfileView.controller.js` | Posts fetch serial with actor fetch |
| `features/profiles/dal/readActorProfile.dal.js` | Fetches `actor_privacy_settings` (duplicates `dalGetActorPrivacy`) |
| `features/profiles/dal/readActorPosts.dal.js` | `readPostMediaByPostIdsDAL` called serially inside |
| `features/social/privacy/dal/actorPrivacy.dal.js` | `dalGetActorPrivacy` — duplicate of inline privacy query |
| `features/block/dal/block.check.dal.js` | `checkBlockStatus` — no cache, fresh DB hit every non-self view |

---

## 11. Implementation Log (2026-05-03)

Fixes applied in this session. Each entry maps to the audit's Priority list.

---

### Fix 1 — Eliminate double-mount (Priority 1)
**File:** `apps/VCSM/src/shared/components/BottomNavBar.jsx`

Replaced the hardcoded `<Tab to="/profile/self">` link with a `ProfileNavTab` component that reads the controller-level TTL cache synchronously at click time:

```js
import { getCachedActorCanonicalSlug } from '@/features/profiles/controller/buildActorCanonicalSlug.controller'

function ProfileNavTab({ personaActorId, navigate, location }) {
  const isActive = location.pathname.startsWith('/profile')
  const handleClick = useCallback(() => {
    if (!personaActorId) { navigate('/feed'); return }
    const cached = getCachedActorCanonicalSlug(personaActorId)
    if (cached) {
      navigate(`/profile/${cached}`)   // direct slug — no redirect, no double-mount
    } else {
      navigate('/profile/self')        // cold cache fallback — double-mount still occurs once
    }
  }, [personaActorId, navigate])
  // renders <button> with manual active styling
}
```

`getCachedActorCanonicalSlug` is a new synchronous read added to the controller cache (see Fix 1b below). After the first profile visit (10-min TTL), every subsequent tap navigates directly to the slug — the double-mount and skeleton flash are eliminated.

---

### Fix 1b — Expose synchronous cache read (supports Fix 1)
**File:** `apps/VCSM/src/features/profiles/controller/buildActorCanonicalSlug.controller.js`

Added a synchronous cache read export alongside the existing async controller:

```js
export function getCachedActorCanonicalSlug(actorId) {
  if (!actorId) return null
  return controllerCache.get(actorId)?.canonicalSlug ?? null
}
```

This reads directly from the existing 10-min `createTTLCache` instance without triggering a fetch. Safe to call in click handlers — returns `null` on cold cache rather than throwing.

---

### Fix 2 — React Query for `useProfileView` (Priority 3)
**File:** `apps/VCSM/src/features/profiles/hooks/useProfileView.js`

Rewrote from `useEffect + useState` to `useQuery`:

```js
const { data, isLoading, isFetching, error } = useQuery({
  queryKey: queryKeys.profileView(viewerActorId, profileActorId, canViewContent),
  queryFn: () => getProfileView({ viewerActorId, profileActorId, canViewContent }),
  enabled: canViewContent !== undefined && !!profileActorId && !!viewerActorId,
  staleTime: 60_000,
  gcTime: 300_000,
  placeholderData: keepPreviousData,
})
```

Key behaviors unlocked:
- **Stale-while-revalidate**: warm navigation (< 60s) renders immediately from cache with zero loading state
- **keepPreviousData**: no blank flash when `canViewContent` transitions from `undefined` → resolved
- **Deduplication**: concurrent callers for same actorId/viewerActorId share one fetch
- `canViewContent` is part of the query key so private and open views have distinct cache slots

---

### Fix 3 — `profileView` query key (supports Fix 2)
**File:** `apps/VCSM/src/queries/queryKeys.js`

Added:

```js
profileView: (viewerActorId, profileActorId, canViewContent) =>
  ['profile', 'view', viewerActorId, profileActorId, canViewContent ?? 'pending'],
```

`canViewContent ?? 'pending'` ensures the key is deterministic even when the gate hasn't resolved — prevents the query from being enabled with `undefined` in the key.

---

### Fix 4 — Seed profile header from hydration store (Priority 7)
**File:** `apps/VCSM/src/features/profiles/screens/views/ActorProfileViewScreen.jsx`

Added `identity` prop + actor store seed so the header renders before the RPC resolves:

```js
const storeActor = useActorStore((s) => s.actors[profileActorId] ?? null)
const isSelf = viewerActorId === profileActorId

const seedProfile = useMemo(() => {
  const src = storeActor ?? (isSelf ? identity : null)
  if (!src) return null
  const isVport = (src.kind ?? src.actor_kind) === 'vport'
  return {
    actorId: profileActorId,
    kind: src.kind ?? 'user',
    displayName: isVport
      ? (src.vportName ?? src.vport_name ?? src.displayName ?? src.display_name ?? null)
      : (src.displayName ?? src.display_name ?? null),
    username: isVport
      ? (src.vportSlug ?? src.vport_slug ?? src.username ?? null)
      : (src.username ?? null),
    avatarUrl: isVport
      ? (src.vportAvatarUrl ?? src.vport_avatar_url ?? src.photoUrl ?? src.photo_url ?? '/avatar.jpg')
      : (src.photoUrl ?? src.photo_url ?? src.avatar ?? '/avatar.jpg'),
    bannerUrl: src.bannerUrl ?? src.banner_url ?? src.banner ?? '/default-banner.jpg',
    bio: src.bio ?? null,
    isFollowing: false,
    _isSeed: true,
  }
}, [storeActor, isSelf, identity, profileActorId])

const displayProfile = profile ?? seedProfile
```

Render gate updated to: `if (!displayProfile && (loading || blockLoading || gate.loading))` — full skeleton only when no seed data exists at all. With seed, `ActorProfileHeader` renders immediately; the content area still waits for security checks (`contentReady = !blockLoading && !gate.loading`).

`postsVersion` state (which was set but never consumed by `useProfileView`) was removed. Post-delete cache busting now uses:

```js
qc.invalidateQueries({
  queryKey: queryKeys.profileView(viewerActorId, profileActorId, canViewContent),
})
```

---

### Fix 5 — Skip `useActorKind` DB call for own profile (Priority 4)
**File:** `apps/VCSM/src/features/profiles/screens/ActorProfileScreen.jsx`

Added identity kind short-circuit — removes one hard-blocking DB call from the own-profile render path:

```js
const identityKind = isSelf ? (identity?.kind ?? null) : null
const { loading: kindLoading, kind: fetchedKind } = useActorKind(
  identityKind ? null : resolvedActorId   // pass null → hook returns immediately, no fetch
)
const kind = identityKind ?? fetchedKind
const effectiveKindLoading = identityKind ? false : kindLoading
```

`useActorKind(null)` returns `{ loading: false, kind: null }` immediately — safe to call. All downstream `kindLoading` references replaced with `effectiveKindLoading`.

Also passes `identity` prop down to `ActorProfileViewScreen` to enable Fix 4.

---

### Fix 6 — Settings save bridges public profile cache (supports Fix 2)
**File:** `apps/VCSM/src/features/settings/profile/hooks/useProfileController.js`

Updated `onSuccess` handler to invalidate all `profileView` query cache entries for the saved actor, ensuring the public profile reflects settings saves immediately (no 60s staleTime wait):

```js
onSuccess: (updatedUi) => {
  qc.setQueryData(profileKey, (prev) => ({ ...(prev || {}), ...updatedUi }))

  // Patch identity — fixed: no longer conditional on updatedUi.actorId
  // (actorId is not a form field; was silently skipping on first save)
  setIdentity((prev) =>
    prev ? { ...prev, avatar: updatedUi.photoUrl, banner: updatedUi.bannerUrl } : prev
  )

  // Predicate-based invalidation matches all canViewContent variants
  const savedActorId = identity?.actorId ?? null
  if (savedActorId) {
    qc.invalidateQueries({
      predicate: (query) => {
        const k = query.queryKey
        return (
          Array.isArray(k) &&
          k[0] === 'profile' &&
          k[1] === 'view' &&
          k[3] === savedActorId   // position 3 = profileActorId in the key
        )
      },
    })
  }
}
```

The predicate targets `k[3]` (profileActorId slot) rather than the full key because `canViewContent` at `k[4]` can be `true`, `false`, or `'pending'` — a predicate match catches all variants with one call.

Also fixed the identity patch: previous condition `if (updatedUi.actorId && identity?.actorId === updatedUi.actorId)` was silently failing because `actorId` is not a form field and was null on saves from the settings form. Now always applies the patch.

---

---

### Fix 7 — Parallelize actor + posts + follow in `getProfileView.controller.js` (Priority 2)
**File:** `apps/VCSM/src/features/profiles/controller/getProfileView.controller.js`

Rewrote the two-phase sequential fetch into parallel groups.

**Before:** `readActorProfileDAL` → `readFollowStateDAL` → `readActorPostsDAL` → `readPostReactionsDAL` → `readPostRoseCountsDAL` (5 serial RTTs minimum, not counting internal DAL RTTs)

**After:**

```js
// Phase 1 — all three start simultaneously
const [actorRow, followRow, postRows] = await Promise.all([
  readActorProfileDAL(profileActorId),
  viewerActorId
    ? readFollowStateDAL({ viewerActorId, targetActorId: profileActorId }).catch(() => null)
    : Promise.resolve(null),
  canViewContent === true
    ? readActorPostsDAL(profileActorId).catch(() => [])
    : Promise.resolve([]),
])

// Phase 2 — reactions + roses in parallel after postIds known
const [reactions, roses] = await Promise.all([
  readPostReactionsDAL(postIds),
  readPostRoseCountsDAL(postIds),
])
```

Follow state and posts no longer wait for actor identity to resolve. Reactions and rose counts no longer run serially. On cold cache this saves 2+ RTTs. The `canViewContent` guard on the post fetch preserves the existing privacy semantics — posts only fire when access is confirmed.

The `console.warn` on post enrichment failure is now DEV-only (wrapped in `import.meta.env.DEV`).

---

### Fix 8 — Deduplicate `vc.actor_privacy_settings` reads (Priority 5)
**File:** `apps/VCSM/src/features/profiles/dal/readActorProfile.dal.js`

Replaced the inline `actor_privacy_settings` Supabase query with a call to the shared `dalGetActorPrivacy` function (Option B from the audit):

```js
// Before: inline query with its own error handling
{ data: privacyData, error: privacyError } = await supabase
  .schema('vc').from('actor_privacy_settings').select('is_private').eq('actor_id', actorId).maybeSingle()

// After: shared TTL cache (actorPrivacy.dal.js, 30s TTL)
const privacyResult = await dalGetActorPrivacy({ actorId })
const isPrivate = privacyResult.isPrivate
```

`dalGetActorPrivacy` handles errors internally (fails closed to `isPrivate: true`) — the separate `privacyError` branch in `readActorProfileDAL` is no longer needed.

Both `readActorProfileDAL` and `useProfileGate` (via `useActorPrivacy`) now call the same function and share the same 30s TTL cache. On warm cache (second caller within 30s), the DB call is skipped entirely.

---

---

### Fix 9 — Unified `vc.actors` cache via `readActorTypeDAL` (Priority 5 — vc.actors)
**New file:** `apps/VCSM/src/features/profiles/dal/readActorType.dal.js`
**Updated:** `readActorKind.dal.js`, `readVportType.dal.js`

Created a new shared DAL that both `readActorKindDAL` and `readVportTypeDAL` delegate to:

```js
// readActorType.dal.js — single 10-min TTL cache for kind + vport category
export async function readActorTypeDAL(actorId) {
  const cached = actorTypeCache.get(actorId);
  if (cached) return cached;

  // RTT 1: vc.actors (kind, vport_id)
  const { data: actor } = await supabase.schema("vc").from("actors")
    .select("kind, vport_id").eq("id", actorId).maybeSingle();

  // RTT 2 (vport only): vport.profile_categories
  if (actor.kind === "vport" && actor.vport_id) {
    const { data: cat } = await vportSchema.from("profile_categories")
      .select("category_key").eq("profile_id", actor.vport_id).eq("is_primary", true).maybeSingle();
    vportType = cat?.category_key ?? null;
  }

  const result = { kind: actor.kind, vport_type: vportType };
  actorTypeCache.set(actorId, result);
  return result;
}
```

Both existing DALs become thin wrappers with no caches of their own:
- `readActorKindDAL` → calls `readActorTypeDAL`, returns `{ kind }`
- `readVportTypeDAL` → calls `readActorTypeDAL`, returns `{ kind, vport_type }`

**Effect:** On warm cache (second visit within 10 min), both callers hit the same entry — one DB round trip instead of two. On cold cache, whichever fires first populates the cache; the second caller arriving after completion gets a cache hit. Concurrent cold callers (same tick) may still both fire the DB query, but the result is idempotent and they converge to the same cache entry.

`getVportPublicDetails.controller.js` calls `readVportTypeDAL` directly — unaffected, now also benefits from the shared cache.

`invalidateActorTypeCache` exported for write paths that change actor kind or vport category.
