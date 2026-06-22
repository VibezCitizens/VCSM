# VCSM — Settings Profile Screen Audit

Date: 2026-05-03
Scope: apps/VCSM/src/features/settings/
Type: Performance + Architecture Audit — READ ONLY
Status: Audit complete, fixes not yet applied
Related: vcsm.runtime.profile-nav-audit.md

---

## 1. Summary

The Settings Profile screen (`/settings?tab=profile`) is architecturally healthier than the public profile view — it uses React Query throughout and has no mandatory redirect cycle. However, it has a two-phase vport load, a serial save path with up to 5 sequential operations, and an actorId resolution step after every save that adds an extra round trip.

**Key findings ranked:**
1. Vport mode requires 3 sequential fetches before the form renders (actorId → vportId → profile)
2. Save path with both avatar + banner is up to 5 serial async operations
3. actorId resolved via DB after every save — already available from the pre-save vportId resolution query
4. Query keys keyed to `user.id` / `vportId`, not `actorId` — actor switch won't trigger automatic invalidation
5. No shared React Query cache with the public profile screen — save invalidates TTL caches but not the React Query `['profile', 'view', ...]` entries
6. Settings and public profile read from different tables (`public.profiles` / `vport.profiles` vs `vc.read_actor_profile` RPC) — no unified cache possible without a shared key strategy

---

## 2. Route & File Map

**Route:** `/settings` (tab dispatching via `?tab=profile`)

| File | Layer | Role |
|---|---|---|
| `screen/SettingsScreen.jsx` | Final Screen | Tab switcher, lazy-loads each tab |
| `profile/adapter/ProfileTab.jsx` | Adapter | Dispatches to UserProfileTab or VportProfileTab based on `identity.kind` |
| `profile/adapter/UserProfileTab.jsx` | Adapter | Wires `useProfileController` → `ProfileTab.view` for user mode |
| `profile/adapter/VportProfileTab.jsx` | Adapter | Wires `useProfileController` → `ProfileTab.view` for vport mode |
| `profile/ui/ProfileTab.view.jsx` | View | Form fields: banner, avatar, username, display name, email, bio, Save button |
| `profile/hooks/useProfileController.js` | Hook | All settings-profile state: mode resolve, React Query, save mutation, uploads |
| `profile/hooks/useProfileUploads.js` | Hook | Avatar/banner upload orchestration |
| `profile/controller/profile.controller.js` | Controller | `loadProfileCore`, `saveProfileCore` — pure, no React |
| `profile/controller/resolveVportIdByActorId.controller.js` | Controller | actorId → vportId resolution for vport mode |
| `profile/controller/recordProfileMediaAsset.controller.js` | Controller | Writes media_asset_id back to profile table |
| `profile/dal/profile.read.dal.js` | DAL | Reads `public.profiles` (user) or `vport.profiles` (vport) |
| `profile/dal/profile.write.dal.js` | DAL | Updates profile fields |
| `profile/dal/actorIdBySubject.read.dal.js` | DAL | Resolves actorId from profileId or vportId (used post-save) |
| `profile/model/profile.model.js` | Model | `mapProfileToView`, `mapProfileUpdate` — pure transforms |
| `queries/useProfileSettings.js` | Query | `useQuery` wrappers — `useProfileSettings`, `useVportProfileSettings` |

---

## 3. Load Sequence

### User mode (straightforward)

```
/settings?tab=profile
  → SettingsScreen → ProfileTab.jsx adapter
  → useProfileController()
      → mode = 'user' (identity.kind === 'user')
      → subjectId = user.id (sync, from useAuth)
      → useQuery(['settings', 'profile', userId])
          → loadProfileCore({ subjectId: userId, mode: 'user' })
          → fetchProfile(userId, 'user')
          → SELECT id,username,display_name,email,bio,photo_url,banner_url
            FROM public.profiles WHERE id=?
  → profile renders (1 DB call)
```

**RTTs before form renders: 1**

---

### Vport mode (two-phase)

```
/settings?tab=profile  (when identity.kind === 'vport')
  → useProfileController()
      → mode = 'vport'
      → needsVportResolution = true (no URL param, actorId known)

  Phase 1:
      → useQuery(['settings', 'vport-id-from-actor', actorId])
          → ctrlResolveVportIdByActorId(actorId)
          → SELECT id,vport_id FROM vc.actors WHERE id=?
          → staleTime: 10min

      → resolvedVportId resolves → subjectId set

  Phase 2:
      → useQuery(['settings', 'vport-profile', vportId])
          → loadProfileCore({ subjectId: vportId, mode: 'vport' })
          → fetchProfile(vportId, 'vport')
          → SELECT id,owner_user_id,slug,name,bio,avatar_url,banner_url
            FROM vport.profiles WHERE id=?
          → staleTime: 5min

  → form renders (2 serial DB calls)
```

**RTTs before form renders: 2 (serial)**

---

## 4. React Query Usage

| Query | Key | staleTime | gcTime | enabled |
|---|---|---|---|---|
| Vport ID resolution | `['settings','vport-id-from-actor', actorId]` | 10min | default | vport mode + no URL param |
| User profile | `['settings','profile', userId]` | 5min | default | !!userId |
| Vport profile | `['settings','vport-profile', vportId]` | 5min | default | !!validSubjectId |

All three use React Query — no bare `useEffect` for data fetching. Stale-while-revalidate is active — the form renders with cached data on revisit while a background refresh runs.

---

## 5. Save Path

### With text-only changes (no uploads)

```
saveProfileCore()
  → mapProfileUpdate(draft)
  → updateProfile(subjectId, mode, payload)     [1 DB write]
  → dalReadActorIdByProfileId / ByVportId       [1 DB read — actorId resolution]
  → refreshVcActorDirectory(actorId)            [background]
  → invalidateActorProfileCache(actorId)        [clears 30s TTL cache]
  → useActorStore.upsertActors()                [sync, hydration update]
  → qc.setQueryData(profileKey, ...)            [optimistic cache update]
  → setIdentity({ avatar, banner })             [sync, identity update]
```

**RTTs: 2 serial** (profile write → actorId read)

---

### With avatar + banner file changes

```
saveProfileCore()
  → uploads.uploadAvatar(file)                  [S3 upload — can be ~1-3s on mobile]
  → uploads.uploadBanner(file)                  [S3 upload — serial after avatar]
  → updateProfile(subjectId, mode, payload)     [DB write]
  → dalReadActorIdByProfileId / ByVportId       [DB read]
  → refreshVcActorDirectory(actorId)
  → invalidateActorProfileCache(actorId)
  → useActorStore.upsertActors()
  → qc.setQueryData / setIdentity
```

**Operations: 4 serial async steps** (avatar upload → banner upload → DB write → actorId read)

---

## 6. Issues Found

### Issue 1 — Serial actorId resolution after save (avoidable DB call)

**File:** `profile/controller/profile.controller.js` ~L66-74

After every save, `saveProfileCore` calls `dalReadActorIdByProfileId` or `dalReadActorIdByVportId` to resolve the actorId for cache invalidation. For vport mode, this actorId is already available — it was used to resolve the vportId in Phase 1 (`identity.actorId`). For user mode, the actorId is also in `identity.actorId`.

The actorId can be passed into `saveProfileCore` from `useProfileController` (which already has `identity.actorId`), eliminating this DB call entirely.

**Fix:** Add `actorId` to the `saveProfileCore` call signature. Pass `identity.actorId` from `useProfileController`. Skip `dalReadActorIdByProfileId/ByVportId`.

---

### Issue 2 — Serial avatar + banner uploads

**File:** `profile/controller/profile.controller.js` L34-42

```js
if (draft.__avatarFile) {
  const uploaded = await uploads.uploadAvatar(draft.__avatarFile)
  ...
}
if (draft.__bannerFile) {
  const uploaded = await uploads.uploadBanner(draft.__bannerFile)
  ...
}
```

These are sequential `await` calls. If both files are changed, the banner upload waits for the avatar upload to complete before starting. On a typical mobile connection (S3 upload latency 1-3s each), this doubles the save time unnecessarily.

**Fix:** Run uploads in parallel:
```js
const [uploadedPhoto, uploadedBanner] = await Promise.all([
  draft.__avatarFile ? uploads.uploadAvatar(draft.__avatarFile) : Promise.resolve(null),
  draft.__bannerFile ? uploads.uploadBanner(draft.__bannerFile) : Promise.resolve(null),
])
```

---

### Issue 3 — Vport mode: two serial RTTs before form renders

**File:** `profile/hooks/useProfileController.js` L44-74

Phase 1 (vport ID resolution) must complete before Phase 2 (profile load) starts. The vport ID query has a 10-minute staleTime so subsequent visits are instant, but on first settings visit in vport mode the user sees a loading state for two sequential DB calls.

The `actorId` → `vportId` relationship is also available in `identity.actorId` + `identity.vportId` (if the identity engine exposes it). If `identity.vportId` is already set, Phase 1 can be skipped entirely.

**Fix:** In `useProfileController`, check `identity.vportId` before enabling the resolution query:
```js
const knownVportId = (mode === 'vport' && identity?.vportId) ? identity.vportId : null
const needsVportResolution = mode === 'vport' && !params.vportId && !knownVportId && !!identity?.actorId
const subjectId = knownVportId || params.vportId || resolvedVportId || (mode !== 'vport' ? user?.id : null)
```

---

### Issue 4 — No shared React Query cache with public profile

**Settings query key:** `['settings','profile', userId]` → reads `public.profiles`
**Public profile query key:** No React Query (bare useEffect) → reads `vc.read_actor_profile` RPC

These are completely separate cache entries reading from different sources. A save in settings does call `invalidateActorProfileCache(actorId)` which busts the 30s TTL cache used by public profile hooks — so the public profile **will** re-fetch after a save. This path works correctly.

However, if the public profile screen ever migrates to React Query (recommended in the profile-nav-audit), the invalidation strategy must be extended to include `qc.invalidateQueries({ queryKey: ['profile', 'view', ..., actorId] })` from the settings save mutation.

**No action needed now.** Flag for when public profile is migrated to React Query.

---

### Issue 5 — Query keys not tied to actorId

**File:** `queries/useProfileSettings.js`

```js
queryKey: queryKeys.settingsProfile(userId)       // keyed to user.id
queryKey: queryKeys.settingsVportProfile(vportId) // keyed to vportId
```

If the user switches from their citizen actor to a vport actor mid-session, the settings screen correctly dispatches to vport mode — but the old user profile cache at `['settings','profile',userId]` remains in memory until its 5-minute staleTime expires. This is not a data leak (the two keys are distinct) but it means cache memory persists for disconnected actors.

This is low risk given the 5-minute TTL. No action needed unless memory pressure is observed.

---

### Issue 6 — `onSuccess` in save mutation uses `draft.actorId` which may be null

**File:** `profile/hooks/useProfileController.js` L83-89

```js
onSuccess: (updatedUi) => {
  qc.setQueryData(profileKey, ...)
  if (updatedUi.actorId && identity?.actorId === updatedUi.actorId) {
    setIdentity(...)
  }
}
```

`updatedUi.actorId` comes from `draft.actorId ?? null` in `saveProfileCore`. If the draft doesn't include `actorId` (it's a UI field, not a form input), `setIdentity` is never called and the identity store avatar/banner won't update in the same session without a full re-hydration.

This depends on whether `mapProfileToView` sets `actorId` on the profile view object. If it does, this works. If not, the identity patch is silently skipped.

**Fix (low risk):** Pass `identity.actorId` directly in the `onSuccess` handler rather than relying on `updatedUi.actorId`:
```js
onSuccess: (updatedUi) => {
  qc.setQueryData(profileKey, (prev) => ({ ...(prev || {}), ...updatedUi }))
  setIdentity((prev) =>
    prev ? { ...prev, avatar: updatedUi.photoUrl, banner: updatedUi.bannerUrl } : prev
  )
}
```

---

## 7. Fetch Count Table

| # | When | Function | Supabase Target | Query Key | Cached? | Serial/Parallel |
|---|---|---|---|---|---|---|
| 1 | Settings tab mounts | `ctrlResolveVportIdByActorId` | `vc.actors` (vport_id) | `['settings','vport-id-from-actor',actorId]` | 10min RQ | Vport only |
| 2 | After #1 resolves (vport) or immediate (user) | `loadProfileCore → fetchProfile` | `vport.profiles` or `public.profiles` | `['settings','vport-profile',vportId]` or `['settings','profile',userId]` | 5min RQ | Serial after #1 (vport) / parallel (user) |
| 3 | On Save (if avatar changed) | `uploads.uploadAvatar` | S3 (via media engine) | — | None | Serial (currently) |
| 4 | On Save (if banner changed) | `uploads.uploadBanner` | S3 (via media engine) | — | None | Serial after #3 |
| 5 | On Save (always) | `updateProfile` | `public.profiles` or `vport.profiles` UPDATE | — | None | Serial after uploads |
| 6 | On Save (always) | `dalReadActorIdByProfileId/VportId` | `vc.actors` | — | None | Serial after #5 — avoidable |

**User mode total fetches (text-only save):** 1 load + 2 save = 3 calls
**Vport mode total fetches (text-only save):** 2 load (serial) + 3 save = 5 calls
**Vport mode with both uploads:** 2 load (serial) + 5 save (serial) = 7 calls, ~4-8s on mobile

---

## 8. Upload Flow Detail

```
User selects file
  → URL.createObjectURL(file) → local blob preview rendered immediately
  → file stored in draft.__avatarFile / draft.__bannerFile

User taps Save
  → saveProfileCore({ ..., uploads, draft })
  → uploads.uploadAvatar(file)
      → uploadMediaController({ file, scope: 'user_avatar', ownerActorId })
      → S3 upload via media engine
      → platform.media_assets INSERT (async IIFE — non-blocking)
      → returns permanent URL
  → uploads.uploadBanner(file)       ← serial (fix: parallelize)
      → same pattern
  → updateProfile(subjectId, mode, payload)
      → clean URL (no ?v=) written to DB
  → saveProfileCore returns displayPhotoUrl = url + ?v=timestamp
  → blob URL revoked (memory cleanup)
  → qc.setQueryData → React Query cache updated
  → useActorStore.upsertActors() → hydration store updated
  → setIdentity() → identity context updated
  → All avatar/banner renderers across app update (feeds, chat, header)
```

Cache-bust suffix (`?v=${Date.now()}`) is **display-only** — never persisted to DB. DB always stores the clean URL.

---

## 9. Comparison: Settings vs Public Profile Screen

| Aspect | Settings Profile | Public Profile View |
|---|---|---|
| Data fetching | React Query | Bare useEffect |
| staleTime | 5min (profile), 10min (vport ID) | 30s TTL cache (custom) |
| Stale-while-revalidate | Yes | No — full skeleton on every visit |
| Tables | `public.profiles` / `vport.profiles` | `vc.read_actor_profile` RPC |
| Cache key | `['settings','profile',userId]` | No React Query key |
| Shared cache with public profile | No | — |
| Save invalidates public profile | Yes — via `invalidateActorProfileCache` (TTL bust) | — |
| Render gate | Loading state until query resolves (but header shell renders) | Full-page hard block |
| Double-mount | None | Yes (on every Profile tab tap) |

---

## 10. Fix Priority

| Priority | Fix | Impact |
|---|---|---|
| 1 | Parallelize avatar + banner uploads in `saveProfileCore` | Saves 1-3s on mobile when both changed |
| 2 | Pass `actorId` into `saveProfileCore` — skip post-save DB resolution | Removes 1 serial DB call from every save |
| 3 | Check `identity.vportId` before enabling vport-ID resolution query | Removes 1 serial DB call on vport first-visit |
| 4 | Fix `onSuccess` to always patch identity — don't rely on `draft.actorId` | Prevents silent identity update failure |
| 5 | (Future) Add `qc.invalidateQueries(['profile','view',...])` to save `onSuccess` when public profile migrates to React Query | Cross-screen cache consistency |

---

## 11. What's Working Well

- React Query used throughout — no bare useEffect for data
- 5-minute staleTime means form renders instantly on revisit
- Blob URL preview before save — good optimistic UX
- `useActorStore.upsertActors()` on save — feeds/chat update immediately without TTL wait
- `invalidateActorProfileCache` busts the public profile TTL cache on save
- DAL uses explicit column selection — no `select('*')`
- Upload flow revokes blob URLs after completion — no memory leak
- Save mutation uses `qc.setQueryData` for instant optimistic cache update
