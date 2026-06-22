---
title: Profile Module — API Surface
status: ACTIVE
feature: settings
module: profile
created: 2026-06-07
---

# settings / modules / profile — API

## Controllers

**File:** `apps/VCSM/src/features/settings/profile/controller/profile.controller.js`

| Function | Signature | Notes |
|---|---|---|
| `loadProfileCore` | `({ subjectId, mode }) → profileData` | Read operation, both modes |
| `saveProfileCore` | `({ subjectId, mode, draft, uploads, invalidateActorProfileCache, refreshVcActorDirectory }) → void` | Write + hydration store mutation |

**Other controllers:**

| Function | File | Notes |
|---|---|---|
| `authSession.controller.js` | Auth session read | Used for user context |
| `recordProfileMediaAsset` | `recordProfileMediaAsset.controller.js` | Records uploaded photo/banner in media_assets |
| `resolveVportIdByActorId` | `resolveVportIdByActorId.controller.js` | VPORT ID resolution helper |
| `saveProfile` | `saveProfile.controller.js` | Wrapper orchestration for saveProfileCore |

---

## Adapters (Profile-Level)

**Directory:** `apps/VCSM/src/features/settings/profile/adapter/`

| Adapter | Purpose | Notes |
|---|---|---|
| `ProfileTab.jsx` | Routes to user or vport profile tab by mode | Lazy switch |
| `UserProfileTab.jsx` | User-mode profile editor | Consumes useProfileController with mode='user' |
| `VportProfileTab.jsx` | Vport-mode profile editor | Consumes useProfileController with mode='vport' |

**External adapter:**
- `adapters/profile/ui/VportAboutDetails.view.adapter.js` — re-exports `VportAboutDetails` view

---

## Hooks

| Hook | File | Purpose |
|---|---|---|
| `useProfileController` | `hooks/useProfileController.js` | Load + save orchestration; returns form state, busy, error, submit handler |
| `useProfileUploads` | `hooks/useProfileUploads.js` | Photo and banner upload state management |

---

## DAL — Write Surfaces

**File:** `apps/VCSM/src/features/settings/profile/dal/profile.write.dal.js`

| Mode | Table | Filter | Session bind | Safety |
|---|---|---|---|---|
| `user` | `public.profiles` | `.eq('id', subjectId)` | NONE — subjectId caller-supplied | RLS sole backstop — PROFILE-SEC-001 |
| `vport` | `vport.profiles` | `.eq('owner_user_id', userId)` | Session-bound | SAFE |

**File:** `apps/VCSM/src/features/settings/profile/dal/profileMediaAsset.write.dal.js`

Records uploaded photo/banner in `platform.media_assets`.

---

## DAL — Read Surfaces

| Function | File | Target |
|---|---|---|
| Profile read | `profile.read.dal.js` | `public.profiles` or `vport.profiles` by mode |
| Actor read | `actors.read.dal.js` | `vc.actors` |
| Auth read | `auth.read.dal.js` | Supabase auth session |
| VPORT public details | `vportPublicDetails.read.dal.js` | `vport.profile_public_details` |
| Actor ID by subject | `actorIdBySubject.read.dal.js` | `vc.actors` |

---

## Models

**Directory:** `apps/VCSM/src/features/settings/profile/model/`

| File | Purpose |
|---|---|
| `profile.model.js` | Transforms raw profile row → canonical profile view object |
| `vportPublicDetails.model.js` | Transforms vport_profile_public_details row → view object |

**UI-level model files** (non-canonical, in `/ui/`):
- `vportAboutDetails.model.js` — UI form field definitions
- `vportAboutDetailsFields.jsx` — Field renderer driven by model

---

## Actor Identity

| Field | Source | Safety |
|---|---|---|
| `subjectId` | Caller-supplied to `saveProfileCore` | NOT session-bound at DAL (user-mode) — PROFILE-SEC-001 |
| `userId` | Session-bound via `auth.getUser()` | SAFE (vport-mode only) |
| `mode` | `'user'` \| `'vport'` | Determines which table branch is written |

---

## Hydration Store Mutation

After a successful profile write, `saveProfileCore` force-mutates the hydration store:

```
upsertActors([...], { force: true })   ← from profile/controller/profile.controller.js
```

**Risk:** If RLS fails on profile write, a forged actor identity could be committed to the
in-memory hydration store, poisoning feed/chat avatar displays until the next full reload.
See PROFILE-SEC-002.

---

## Tables / Tables Touched

| Name | Type | Access | Notes |
|---|---|---|---|
| `public.profiles` | table | read/write | User-mode — RLS sole backstop |
| `vport.profiles` | table | read/write | Vport-mode — session-bound, SAFE |
| `vport.profile_public_details` | table | read | Read only in this module |
| `platform.media_assets` | table | write | Photo/banner records |
| `vc.actors` | table | read | Actor ID + kind resolution |

---

## Ownership Validation Path

| Operation | App-layer gate | DB-layer gate | Status |
|---|---|---|---|
| saveProfile (user-mode) | NONE — subjectId caller-supplied | RLS on public.profiles | PROFILE-SEC-001 OPEN |
| saveProfile (vport-mode) | owner_user_id = auth.uid() at DAL | RLS on vport.profiles | SAFE |
| loadProfile | Read-only, no ownership required | RLS if applicable | OK |

---

## Monitoring Behavior IDs

None assigned. Feature has 0 formal test files.

---

## Deferred Tickets

| Ticket | Description |
|---|---|
| PROFILE-SEC-001 | profile.write.dal.js user-mode no session bind — subjectId caller-supplied, RLS sole backstop |
| PROFILE-SEC-002 | Hydration store force-mutation downstream of profile write — second-order risk if RLS fails |
