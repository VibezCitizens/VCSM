# PROFILES-SPLIT-002 — Shared Leak Elimination Review

```
[PROFILES-SPLIT-002] Shared Leak Elimination (Shared→Citizen + Shared→VPORT)
Status: Complete (READ ONLY — no code, no moves, no refactors)
Priority: P1
Type: ARCHITECTURE
App: VCSM
Builds on: PROFILES-SPLIT-000, PROFILES-SPLIT-001 (executed)
Date: 2026-06-08
```

> **Verdict: GO for implementation.** Both shared leaks are small and cleanly separable.
> `getProfileView → ProfileModel` has **exactly one consumer** (itself) — a trivial promote.
> `useProfilesOps` consumers **split cleanly** (1 shared-only, 5 vport-only, zero mixed) — a
> clean Option-C split. Friends is **provably citizen-only** and its relocation is
> **mechanical** (path moves, no logic). After this ticket + a 3-file dispatcher whitelist +
> relocating one misplaced vport test, ESLint can flip **WARN → ERROR**.

---

## Deliverable A — Shared Leak #1 · `getProfileView.controller.js`

**Why shared imports citizen ProfileModel:** `getProfileView` is the polymorphic profile RPC.
The `kind === 'vport'` branch builds its object **inline** (lines 51-78); the `kind === 'user'`
branch spreads `ProfileModel(userProfile)` (line 81). So it borrows the citizen user-row mapper
for the user branch only.

**Exact symbol:** `import { ProfileModel } from '@/features/profiles/kinds/citizen/model/profile.model'` (line 2).

| Symbol | Imported From | Consumer(s) | Citizen-specific? | Recommendation |
|---|---|---|---|---|
| `ProfileModel` | `kinds/citizen/model/profile.model.js` | **getProfileView ONLY** | Marked `[CITIZEN_ONLY]`, but it is a **pure, dependency-free row mapper** (snake→camel + defaults). Not behaviorally citizen-bound. | **Promote to shared** |

**Is it truly citizen-specific?** No. `ProfileModel(row)` (full file, 22 lines) takes a user-profile
row and returns `{displayName, username, bio, avatarUrl, bannerUrl, private, discoverable,
publish, createdAt, updatedAt, lastSeen, followerCount, followingCount}`. Zero imports, zero
side effects, no citizen-only logic — it is the *user-branch shape mapper* of a shared
polymorphic view. The vport branch's inline object is its sibling.

**Critical disambiguation:** a grep for `ProfileModel` shows a **second, unrelated** definition
at `features/auth/login/model/profile.model.js` (consumed by `auth/login/controllers/profile.controller.js`).
That is a *different file* — NOT this one. The citizen `profile.model.js` has **exactly one
importer: getProfileView**.

**Can the imported model be promoted into shared? → YES.**
- **Destination:** `profiles/model/userProfile.model.js` (shared model zone; sits beside the
  other shared mappers `actorSeo.model`, `post.model`). Keep the export name `ProfileModel`
  (or rename `UserProfileModel`) — symbol choice is cosmetic.
- **Importer count:** **1** (getProfileView line 2/81).
- **Blast radius:** move 1 file + edit 1 import line. Nothing else references it. Minimal.

---

## Deliverable B — Shared Leak #2 · `useProfilesOps.js`

`useProfilesOps()` (full file, 14 lines) bundles 1 shared op + 3 vport ops and returns them
as a plain object. The 3 vport imports are the leak.

| Symbol | Source | Used For | VPORT-only? | Shared-compatible? |
|---|---|---|---|---|
| `invalidateActorProfileCache` | `profiles/controller/profileCache.controller` (shared) | Generic actor profile cache bust | No — actor-generic | ✅ stays shared |
| `invalidateVportPublicDetails` | `kinds/vport/controller/getVportPublicDetails.controller` | VPORT public-details cache bust | **Yes** | ❌ vport-only |
| `getVportTabsByType` | `kinds/vport/model/getVportTabsByType.model` | VPORT dashboard tab layout | **Yes** | ❌ vport-only |
| `getFallbackServiceCatalogRows` | `kinds/vport/model/services/vportServiceCatalogFallback.model` | VPORT service catalog fallback | **Yes** | ❌ vport-only |

**External consumer breakdown (the decisive evidence — they split cleanly):**

| Consumer | Symbol used | Domain |
|---|---|---|
| `settings/profile/hooks/useProfileController.js` | `invalidateActorProfileCache` | **SHARED only** |
| `vport/hooks/useVportServiceCatalog.js` | `getFallbackServiceCatalogRows` | VPORT |
| `vportDashboard/.../settings/VportSettingsScreen.jsx` | `getVportTabsByType` | VPORT |
| `vportDashboard/.../settings/hooks/useSaveVportSettings.js` | `invalidateVportPublicDetails` | VPORT |
| `vportDashboard/.../settings/hooks/useSaveVportPublicDetailsByActorId.js` | `invalidateVportPublicDetails` | VPORT |
| `vportDashboard/screens/VportDashboardScreen.jsx` | `getVportTabsByType` | VPORT |

**1 consumer uses only the shared op; 5 use only vport ops; none mix.** Perfect cleavage line.

**Recommendation: OPTION C — split into shared + vport hooks.**

Reasoning:
- **Not A (delegate through adapters):** the 3 vport symbols are a **controller + two models**.
  The app contract states *"Adapters never export DAL functions, models, or controllers."*
  Routing them through `.adapter.js` would violate adapter purity. Rejected.
- **Not B (dispatcher-adjacent):** `useProfilesOps` is not on the route-dispatch path; it's a
  cross-feature cache/ops utility. Whitelisting it would hide a real ownership smell. Rejected.
- **C fits the data:** consumers already cluster by domain. Keep `useProfilesOps` shared with
  **only** `invalidateActorProfileCache` (its 1 shared consumer unchanged). Move the 3 vport
  ops into a vport-owned hook (e.g. `kinds/vport/hooks/useVportProfileOps.js`, exposed via the
  vport adapter as a hook → adapter-pure). The 5 vport consumers swap their import. Removes the
  shared→vport edge entirely with no behavior change.

---

## Deliverable C — Friends Subtree Audit

**Files (11 subtree + ActorProfileFriendsView = 12; corrects SPLIT-000's "13" estimate):**

| File | Current Location | Imports → | Actual Domain | Recommendation |
|---|---|---|---|---|
| `hooks/useFriendLists.js` | shared tree | `kinds/citizen/controller/friends/{getFriendLists,hydrateActorsIntoStore}` | **Citizen** | → citizen |
| `hooks/useSaveTopFriendRanks.js` | shared tree | `kinds/citizen/controller/friends/saveTopFriendRanks` | **Citizen** | → citizen |
| `hooks/useTopFriendActorIds.js` | shared tree | `kinds/citizen/controller/friends/{getTopFriendActorIds,hydrateActorsIntoStore}` | **Citizen** | → citizen |
| `hooks/useTopFriendCandidates.js` | shared tree | `kinds/citizen/controller/friends/{getTopFriendCandidates,hydrateActorsIntoStore}` | **Citizen** | → citizen |
| `components/FriendsList.jsx` | shared tree | local hooks + components | **Citizen** (consumes citizen hooks) | → citizen |
| `components/ProfileFriendItem.jsx` | shared tree | `@/state/actors/useActorSummary`, `@/shared/components/ActorLink` | **Citizen** (friends UI) | → citizen |
| `components/FriendListSection.jsx` | shared tree | local | **Citizen** | → citizen |
| `components/FriendsEmptyState.jsx` | shared tree | local | **Citizen** | → citizen |
| `components/RankedFriendsPublic.jsx` | shared tree | `@/state`, `@/shared` | **Citizen** | → citizen |
| `components/RankPickerModal.jsx` | shared tree | `@/state`, `@/shared`, local `useTopFriendCandidates` | **Citizen** | → citizen |
| `components/TopFriendsRankEditor.jsx` | shared tree | `@/state`, `@/shared`, local hooks; **mounted by route** `/profile/:id/friends/top/edit` | **Citizen** | → citizen |
| `screens/views/ActorProfileFriendsView.jsx` | shared tree | local components + hooks + `useIdentity` (adapter) | **Citizen** | → citizen |

**Is friends truly citizen-only? → YES.** Evidence:
1. Every data path terminates in `kinds/citizen/controller/friends/*` (friend ranks, follow graph). No vport equivalent exists.
2. `rg kinds/vport … friends` = 0 — VPORT never imports friends.
3. VPORT profiles never render a friends tab: friends mount only via `CitizenTabRouter` (citizen); vport uses `VportTabRouter`. `ActorProfileTabs` gates citizen-only chrome via `includeTags={isCitizenProfile}`.
4. Non-citizen imports are only domain-neutral primitives (`@/state/actors/useActorSummary`, `@/shared/components/ActorLink`) — allowed from any zone.

**Relocation blast radius:** 12 files moved + internal cross-imports (absolute `@/`-alias, must repoint) + **2 external edits**: `CitizenFriendsTab.jsx` (imports ActorProfileFriendsView) and `app/routes/lazyApp.jsx` (lazy-imports `TopFriendsRankEditor` for the edit route).

---

## Deliverable D — Identity Coupling Audit · `ActorProfileFriendsView.jsx`

**Why it imports `useIdentity()`:** lines 29-32 — it reads `identity.actorId` to compute
`viewerActorId` and `isOwnProfile = viewerActorId === profileActorId`, which drives the
`reconcile`, edit-button, and privacy (`isPrivate`) logic. It is **not** passed `viewerActorId`
as a prop (only `profileActorId`, `canViewContent`, `version`).

**Is identity required?** The *value* (viewerActorId) is required; the *self-fetch* is not.
`ActorProfileScreen` already resolves `viewerActorId` and threads it down the citizen tab chain
(`ActorProfileViewScreen → CitizenTabRouter → CitizenFriendsTab`), so the value is available
upstream.

**Can this dependency be removed during relocation? → YES (but should be deferred).**
- *How:* thread `viewerActorId` as a prop from the chain that already holds it, dropping the
  `useIdentity()` call.
- *Why defer:* `useIdentity` is imported from `@/features/identity/adapters/identity.adapter` —
  a **cross-feature adapter**. Under the boundary rule (citizen → citizen/shared/**adapters**),
  this import is **fully legal and NOT a violation**. Removing it is behavior-adjacent prop
  drilling, not a boundary fix. To keep the relocation purely mechanical (zero behavior change),
  **leave it as-is**; schedule prop-threading as separate optional cleanup if desired.

> Net: the identity coupling does **not** block ERROR mode and is **out of scope** for the
> mechanical relocation.

---

## Deliverable E — Boundary Rule Readiness (post-SPLIT-001)

| File | Violation Type | Severity | Blocks ERROR? |
|---|---|---|---|
| `controller/getProfileView.controller.js` | shared → citizen (`ProfileModel`) | HIGH | **YES** — until LEAK-01 fixed |
| `hooks/useProfilesOps.js` | shared → vport (×3) | HIGH | **YES** — until LEAK-02 fixed |
| `screens/views/tabs/friends/hooks/*` (4) | shared → citizen | MEDIUM | **YES** — until friends relocated (becomes citizen→citizen) |
| `dal/__tests__/vportPublicDetails.read.dal.test.js` | shared → vport (test) | LOW | **YES (trivial)** — relocate test with vport |
| `screens/ActorProfileScreen.jsx` | shared → vport (kind prefetch) | — | No — **dispatcher whitelist** |
| `screens/views/ActorProfileViewScreen.jsx` | shared → citizen (`CitizenTabRouter`) | — | No — **dispatcher whitelist** |
| `kinds/profileKindRegistry.js` | references both | — | No — **dispatcher whitelist** |

**Can ESLint move to ERROR after this ticket alone? → YES, conditional on two trivial co-items:**
1. The **3-file dispatcher whitelist** must be configured in the rule (registry + ActorProfileScreen + ActorProfileViewScreen).
2. The **1 misplaced vport DAL test** must be relocated into the vport zone (fold into this ticket or the enable step).

With LEAK-01 + LEAK-02 + friends relocation + those two co-items, **no true blockers remain.**

---

## Deliverable F — Migration Plan (smallest safe ticket = PROFILES-SPLIT-003)

Constraints honored: no behavior / route-semantics / ownership / gas / dashboard / DB / auth changes.

| Step | Action | Files touched | Risk | Rollback |
|---|---|---|---|---|
| **1** | **Promote ProfileModel → shared.** Move `kinds/citizen/model/profile.model.js` → `model/userProfile.model.js`; update `getProfileView` import (1 line). | 1 move + 1 edit | **LOW** | Trivial (revert path) |
| **2** | **Split useProfilesOps (Option C).** Create `kinds/vport/hooks/useVportProfileOps.js` returning the 3 vport ops; expose via vport adapter as a hook. Trim `useProfilesOps` to `invalidateActorProfileCache` only. Repoint the **5 vport consumers** to `useVportProfileOps`; leave the 1 settings consumer. | create 1 + adapter export + trim 1 + edit 5 | **MEDIUM** | Medium (re-merge hook) |
| **3** | **Relocate friends subtree → citizen.** Move 12 files into `kinds/citizen/` (e.g. `kinds/citizen/tabs/friends/`); repoint internal cross-imports; update `CitizenFriendsTab` import + `lazyApp.jsx` route import for `TopFriendsRankEditor`. No logic change; keep `useIdentity`. | 12 moves + ~internal + 2 external edits | **MEDIUM** | Medium (paths) |
| **4** | **Relocate misplaced vport test.** Move `dal/__tests__/vportPublicDetails.read.dal.test.js` into the vport zone. | 1 move | **LOW** | Trivial |
| **5** (separate enable step) | Configure 3-file dispatcher whitelist; flip ESLint shared/citizen/vport rule **WARN → ERROR**. | ESLint config | **LOW** | Trivial (revert to WARN) |

Smallest *leak-elimination* ticket = Steps 1-4. Step 5 (ERROR flip) is the follow-on gate.
Recommended intra-ticket order: **1 → 2 → 3 → 4** (ascending risk; LEAK-01 first as confidence build).

---

## Deliverable G — Risk Register

| ID | Severity | Blast Radius | Recommended Fix |
|---|---|---|---|
| **SHARED-LEAK-01** (`getProfileView`→ProfileModel) | **MEDIUM** | **1 importer** (getProfileView only). Lowest-risk of the three. | Promote `ProfileModel` → `profiles/model/userProfile.model.js`; update 1 import. |
| **SHARED-LEAK-02** (`useProfilesOps`→vport) | **HIGH** | **6 consumers** (5 vport external + 1 shared); spans vport + vportDashboard + settings. Highest-risk. | Option C split: shared keeps `invalidateActorProfileCache`; vport ops → `useVportProfileOps` (vport adapter); repoint 5 consumers. |
| **CITIZEN-FRIENDS-01** (friends subtree in shared tree) | **MEDIUM** | **12 files** + 2 external (`CitizenFriendsTab`, `lazyApp` route). Mechanical. | Relocate subtree → citizen; repoint cross-imports + route import. Keep `useIdentity` (legal). |

---

## Deliverable H — Final Verdict

1. **First file to change:** `kinds/citizen/model/profile.model.js` → promote to
   `profiles/model/userProfile.model.js` (LEAK-01, single importer, lowest risk).
2. **Last file to change:** `app/routes/lazyApp.jsx` (route import for the relocated
   `TopFriendsRankEditor`) — the final code edit of the friends relocation. *(The very last
   action overall is the ESLint WARN→ERROR flip, which is the separate enable step.)*
3. **Higher-risk leak:** **SHARED-LEAK-02** (`useProfilesOps`) — 6 consumers across 3 features
   vs LEAK-01's single internal consumer.
4. **Friends relocation: MECHANICAL.** Pure path moves; no logic, no behavior, no route-semantics
   change; identity coupling is legal and stays. Not architectural.
5. **Can PROFILES-SPLIT-003 be an implementation ticket? → YES.** Scope is bounded, evidence-complete,
   and every step is path-level with clear rollback.
6. **Must be completed before ERROR mode:** (a) promote ProfileModel to shared; (b) split
   `useProfilesOps` (remove shared→vport); (c) relocate friends subtree to citizen; (d) relocate
   the 1 misplaced vport DAL test; (e) configure the 3-file dispatcher whitelist. Then flip
   WARN→ERROR.

```
GO / NO-GO : GO for implementation (PROFILES-SPLIT-003)
Scope      : Steps 1-4 (leak elimination + friends + test). ERROR flip = Step 5 follow-on.
Net effect : Removes the last 2 true shared-zone violations; friends becomes citizen→citizen;
             boundary rule becomes ERROR-ready.
```

### DB AUDIT NOTE
```
None. SPLIT-002 scope is app-layer only — no RLS, RPC, migration, or authorization surface is
touched by promoting a pure mapper, splitting a cache-ops hook, or relocating presentation files.
```

---

*Analysis only. No files moved, renamed, created, or modified. This document is the sole artifact.*
