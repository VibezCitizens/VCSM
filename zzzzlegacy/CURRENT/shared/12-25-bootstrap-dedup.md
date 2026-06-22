# Bootstrap Query Dedup Pass

**Task:** Identify and eliminate duplicate bootstrap queries across VCSM screens.
**Date:** 2026-04-12
**Status:** COMPLETE

---

## Trace Results

### 1. All callers of `resolveAuthenticatedContext`

Three call sites in VCSM, all routed through the engine's 120s result cache:

| Caller | File | Purpose |
|--------|------|---------|
| `loadDefaultIdentityForUser` | `identity.controller.js:141` | Initial identity resolve (IdentityProvider mount) |
| `loadOwnedActorChoices` | `identity.controller.js:281` | Actor switcher list |
| `switchActor` | `identityContext.jsx:63` | Actor switch flow (reads context to find link) |

Additionally, `platform/services/identityService.js` wraps `resolveAuthenticatedContext` via `getPlatformContext`, `getActiveActor`, `getActorLinks`, `getUserAppState` -- but **no VCSM code imports from this service** (0 callers found in `apps/VCSM/src`).

**Verdict:** All three callers benefit from the engine cache. The in-flight dedup in `identity.controller.js` covers concurrent calls. Sequential calls within 120s hit the result cache. No duplication here.

### 2. Identity context consumers (`useIdentity()`)

**77 files** import `useIdentity()`. However, `useIdentity()` is a pure `useContext(IdentityContext)` call -- it reads from React context, does NOT trigger a re-resolve. Each consumer gets the same identity object. No duplication.

### 3. Direct platform schema queries OUTSIDE the identity engine

**FOUND -- Issue #1:** `apps/VCSM/src/features/vport/dal/vport.core.dal.js` (lines 87-121)

After vport creation, in DEV mode, it directly queries:
- `platform.user_app_actor_links`
- `platform.user_app_preferences`
- `platform.user_app_state`

These 3 queries bypass the identity engine cache entirely. While DEV-only, they pollute perf traces.

**FIX APPLIED:** Removed the 3 direct platform queries. The RPC response already contains the authoritative data.

### 4. Feed viewer context

**FOUND -- Issue #2:** `getFeedViewerContext.controller.js` + `feed.read.viewerContext.dal.js`

The feed independently queries:
1. `vc.actors` (to get `profile_id`/`vport_id`)
2. `profiles.is_adult`

This data is already available on the identity object (`identity.isAdult`, `identity.kind`).

Worse: `viewerIsAdult` is computed and stored in `useFeed` state, but **never consumed by any downstream code**. The `fetchViewer()` call in `CentralFeedScreen` fires 2 DB queries on every mount and refresh for data that is never read.

**FIX APPLIED:**
- Removed `fetchViewer` callback from `useFeed`
- Removed `getFeedViewerIsAdult` import from `useFeed`
- `useFeed` now accepts `viewerIsAdult` as an option from caller
- `CentralFeedScreen` and `PostFeed.screen.jsx` derive `viewerIsAdult` from identity context
- Eliminated 2 DB queries per feed mount + refresh

### 5. Auth token refresh re-render cascade

**FOUND -- Issue #3:** `AuthProvider.jsx` `onAuthStateChange` handler

On every `TOKEN_REFRESHED` event (Supabase refreshes tokens every ~60min), the handler called:
```js
setUser(nextSession?.user ?? null)
setSession(nextSession ?? null)
```

This creates new object references even when `user.id` hasn't changed, causing unnecessary re-renders of all AuthContext consumers.

While the identity useEffect depends on `user?.id` (a string primitive, so value-equal), every component that reads `user` from `useAuth()` re-renders needlessly.

**FIX APPLIED:** Added functional updater guards:
- `setUser()` now returns the previous user if `prev?.id === nextUserId`
- `setSession()` now returns the previous session if `access_token` is unchanged

### 6. Profile viewer context

No separate viewer context loader found for profile screens. Profile screens use `useIdentity()` directly. Clean.

---

## Summary of Fixes

| Fix | File | Queries Eliminated |
|-----|------|--------------------|
| Remove direct platform queries in vport create debug | `vport.core.dal.js` | 3 (DEV only) |
| Remove feed viewer context fetch | `useFeed.js`, `CentralFeedScreen.jsx`, `PostFeed.screen.jsx` | 2 per feed mount + refresh |
| Guard AuthProvider against token refresh re-renders | `AuthProvider.jsx` | 0 queries, prevents cascade |

**Net effect:** At minimum 2 fewer DB queries per feed screen mount, plus elimination of re-render cascade on token refresh that could trigger unnecessary downstream work.

---

## Files Modified

- `apps/VCSM/src/features/vport/dal/vport.core.dal.js` -- removed direct platform.* debug queries
- `apps/VCSM/src/features/feed/hooks/useFeed.js` -- removed fetchViewer, accept viewerIsAdult prop
- `apps/VCSM/src/features/feed/screens/CentralFeedScreen.jsx` -- derive viewerIsAdult from identity
- `apps/VCSM/src/features/post/screens/PostFeed.screen.jsx` -- derive viewerIsAdult from identity
- `apps/VCSM/src/app/providers/AuthProvider.jsx` -- guard against token refresh re-renders

## Dead Code Identified (not removed, low priority)

- `apps/VCSM/src/features/feed/controllers/getFeedViewerContext.controller.js` -- no longer imported by runtime code
- `apps/VCSM/src/features/feed/dal/feed.read.viewerContext.dal.js` -- no longer imported by runtime code
