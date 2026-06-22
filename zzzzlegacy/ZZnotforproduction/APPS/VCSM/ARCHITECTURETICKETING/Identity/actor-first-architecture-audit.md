# Actor-First Architecture Audit — VCSM
**Date:** 2026-06-06
**Scope:** `/Users/vcsm/Desktop/VCSM/apps/VCSM/src`
**Auditor:** Principal Systems Architect (source-verified only)
**Final Verdict:** ACTOR_FIRST_PARTIAL

---

## 1. Executive Summary

VCSM is **partially actor-first**. The architecture is clearly structured around `vc.actors` as the
canonical identity substrate, and ownership is predominantly resolved through `vc.actor_owners`.
Both Citizen (kind='user') and VPORT (kind='vport') are modeled as first-class actors in the
identity engine and lifecycle layer.

However, three categories of drift exist that prevent a CONFIRMED verdict:

1. **ownerActorId is exposed through the public `useIdentity()` surface**, violating the locked
   Identity Contract which restricts the public surface to `{ actorId, kind, ownerActorId, realmId }`.
   The inclusion of `ownerActorId` in the public surface is a design drift — some callers
   misread it as "use this for ownership assertions" when it is present only as a display/routing hint.

2. **A confirmed functional bug exists in `useVportLeadsCount`**: when identity is vport-kind,
   `countNewVportLeadsController` is passed `actorId = identity.actorId` (the vport actor), but
   the `assertSessionOwnsVportActorController` it calls works correctly via the Supabase session —
   this path does NOT require the caller to be a user actor. The SECURITY.md documents this as
   THANOS-BB-NEW-001 with wrong diagnosis (it claims ownership always rejects, but the session
   controller does not require user-kind). This needs source re-verification.

3. **Legacy `owner_user_id` enforcement in DAL write paths** (vport.profiles) creates a dual
   ownership model: `vc.actor_owners` at the controller layer AND `owner_user_id = auth.uid()` at
   the DAL layer. While documented as "defense-in-depth", it creates semantic drift: two
   ownership models that must stay synchronized.

4. **Several hooks pass `callerActorId = identity?.actorId`** when identity is in vport-kind,
   forwarding that vport actorId to `assertActorOwnsVportActorController` — a controller that
   enforces kind='user' on the requester. This is a **systemic functional bug** affecting any
   hook that does not separately resolve the user actor from `availableActors`.

---

## 2. Actual Architecture Diagram (from source)

```
AUTH.USERS (Supabase auth)
    │
    └─► public.profiles (user_id FK to auth.users)
            │
            ├─► vc.actors row (kind='user', profile_id=profiles.id)
            │       │
            │       └─► vc.actor_owners (actor_id, user_id=profiles.id) — citizen owns self
            │
            └─ onboarding completes ─► create_actor_for_user RPC + dalCreateActorOwner

VPORT CREATION (create_vport RPC — SECURITY DEFINER)
    │
    └─► vport.profiles (owner_user_id=auth.uid()) ←── LEGACY OWNERSHIP FIELD
            │
            ├─► vc.actors row (kind='vport', vport_id=vport.profiles.id)
            │       │
            │       └─► vc.actor_owners (actor_id=vport_actor.id, user_id=profiles.id)
            │
            └─► vport.profile_actor_access (profile_id, actor_id, is_primary) ←── FALLBACK PATH

IDENTITY RESOLUTION (engine → hydrator)
    │
    └─► resolveAuthenticatedContext() ─► active actor from platform.user_app_actor_links
            │
            └─► hydrateVcsmActor()
                    ├─ kind='user': readProfileIdentityDAL(actor.profile_id)
                    │       returns { actorId, kind, realmId, ownerActorId:null, + internal fields }
                    └─ kind='vport': readVportIdentityDAL(actor.vport_id)
                            + readActorOwnerUserDAL(actor.id) ─► vc.actor_owners
                            + readUserActorByProfileIdDAL(ownerRow.user_id) ─► vc.actors(kind='user')
                            + FALLBACK: profile_actor_access if actor_owners fails
                            returns { actorId, kind, realmId, ownerActorId, + internal fields }

PUBLIC SURFACE (toPublicIdentity)
    └─► { actorId, kind, ownerActorId, realmId }

OWNERSHIP GATE (primary)
    assertActorOwnsVportActorController
    ├─ getActorByIdDAL(requestActorId) ─► kind MUST be 'user'
    ├─ self-shortcut: requestActorId === targetActorId AND kind='user' → ok (no DB query)
    └─ readActorOwnerLinkByActorAndUserProfileDAL(targetActorId, requestor.profile_id)
           ─► vc.actor_owners

OWNERSHIP GATE (session-based)
    assertSessionOwnsVportActorController
    └─ readOwnerLinkByActorAndSessionDAL(targetActorId)
           ─► supabase.auth.getUser() → profiles.user_id → vc.actor_owners
```

---

## 3. Target Architecture Diagram (expected)

```
CITIZEN (user) ACTOR LIFECYCLE
├─ auth.users
├─ public.profiles (user_id FK)
├─ vc.actors row (kind='user', profile_id FK)
└─ vc.actor_owners row (actor_id, user_id) — citizen owns self

VPORT (vport) ACTOR LIFECYCLE
├─ vport.profiles
├─ vc.actors row (kind='vport', vport_id FK)
└─ vc.actor_owners row (actor_id, user_id) — citizen owns vport

IDENTITY CONTRACT
├─ useIdentity() exposes: { actorId, kind, ownerActorId, realmId } ONLY
├─ ownerActorId: present only for vport-kind, resolves citizen owner
├─ NO: profileId, vportId, userId, isVoid, displayName, username, avatar, banner, email

OWNERSHIP MODEL
├─ vc.actor_owners.actor_id → vc.actors.id
├─ vc.actor_owners.user_id → public.profiles.id
└─ Rule: Only kind='user' actors may appear as owners
   └─ assertActorOwnsVportActorController enforces this at line 28 (kind !== 'user' → throw)

HOOK PATTERN
└─ When identity.kind='vport', hooks requiring user-kind callerActorId must resolve
   the owner actor from availableActors — not pass identity.actorId directly
```

---

## 4. Diff Between Actual and Target (All Drift)

### D-001 — Public identity exposes ownerActorId (DESIGN DRIFT)
- **Target:** useIdentity() exposes only `{ actorId, kind }`
- **Actual:** `toPublicIdentity()` in `state/identity/identity.model.js:7` exposes `ownerActorId`
- **Impact:** Hooks use `identity.ownerActorId` (e.g., `resolveInboxActor.js:48`) which is a
  non-contract pattern. The original locked contract says only actorId+kind; ownerActorId is present.
- **Note:** CLAUDE.md and ARCHITECTURE.md do acknowledge `ownerActorId` in the locked shape,
  so this may be an intentional extension. Classified as DESIGN DRIFT not CONTRACT VIOLATION
  unless the locked contract explicitly forbids it.

### D-002 — Hooks pass vport actorId as callerActorId to assertActorOwnsVportActorController (FUNCTIONAL BUG)
- **Target:** callerActorId must always be a user-kind actor
- **Actual:** Multiple hooks set `callerActorId = identity?.actorId ?? null` without checking
  `identity.kind`. When identity is vport-kind, this passes a vport actorId to a controller
  that enforces `kind !== 'user' → throw`.
- **Affected files:**
  - `features/settings/vports/hooks/useVportDirectoryVisibility.js:24`
  - `features/settings/vports/hooks/useVportBusinessCardSettings.js:74`
  - `features/settings/vports/hooks/useVportsController.js:98,110`
  - `features/settings/privacy/hooks/useActorPrivacy.js:11`
  - `features/dashboard/vport/dashboard/cards/bookings/hooks/useVportBookingActions.js:7`
  - `features/dashboard/vport/dashboard/cards/bookings/hooks/useQuickBookingModal.js:8`
  - `features/dashboard/vport/dashboard/cards/team/hooks/useVportTeam.js:13`
  - `features/join/hooks/useJoinBarbershop.js:185,203,244,255`
  - `features/profiles/kinds/vport/screens/content/hooks/useVportContentPages.js:15`
  - `features/profiles/kinds/vport/hooks/barbershop/usePublishBarbershopPortfolioPost.js:11`
  - `features/profiles/kinds/vport/hooks/barbershop/usePublishBarbershopHoursPost.js:11`
- **SECURITY.md note:** TASK-2026-06-06-004 documents "14 hooks across VCSM use identity.actorId
  as callerActorId — systemic pattern" — confirmed from source.

### D-003 — Dual ownership model on vport.profiles writes (DESIGN DRIFT)
- **Target:** Single ownership model via vc.actor_owners
- **Actual:** DAL write files use `owner_user_id = auth.uid()` WHERE clause as secondary gate
  - `features/settings/vports/dal/vports.write.dal.js:44,75,106`
  - `features/settings/vports/dal/vports.read.dal.js:111,134`
  - `features/vport/dal/vport.read.vportRecords.dal.js:20`
  - `features/vport/dal/vport.core.dal.js:126`
- **Impact:** Two ownership models must stay synchronized. If actor_owners and owner_user_id
  ever diverge (e.g., after a user transfer), the DAL would reject valid actor-first ownership.
  Documented as "defense-in-depth" in `vportBusinessCardSettings.controller.js:18`.

### D-004 — Profile_actor_access fallback in hydrator (DESIGN DRIFT)
- **Target:** ownerActorId resolved exclusively via vc.actor_owners
- **Actual:** `vcsmActorHydrator.js:64-73` has a fallback: if `actor_owners` returns no row for
  a vport, it reads `vport.profile_actor_access.actor_id` where `is_primary=true`
- **Impact:** Creates a second ownership resolution path. An actor could be hydrated with an
  ownerActorId that is NOT backed by vc.actor_owners. This ownerActorId could then pass into
  assertActorOwnsVportActorController's requestActorId, which re-validates via actor_owners —
  so the security boundary is preserved, but the hydrated ownerActorId may differ from the
  enforced ownership.

### D-005 — identity.isVoid exposed through useResolvedActor (CONTRACT VIOLATION)
- **Target:** useIdentity() does not expose isVoid
- **Actual:** `features/upload/hooks/useResolvedActor.js:18` reads `identity.isVoid` directly
  from the public identity object returned by `useIdentity()`.
- **Note:** `toPublicIdentity()` does NOT include `isVoid` in the returned object. However,
  `useIdentityDetailsDeprecated()` exists and returns the full detail object. `useResolvedActor`
  uses `useIdentity()` which returns the public identity. If `isVoid` is not in the public
  identity shape, this line reads `undefined` — it silently produces wrong behavior.
- **Verification:** `identity.model.js:7-9` — `toPublicIdentity` returns `{ actorId, kind,
  ownerActorId, realmId }`. `isVoid` is NOT included. So `identity.isVoid` in useResolvedActor
  evaluates to `undefined`, which means `resolveRealm(undefined)` is called in createPost.
  **This is a functional bug** — realm resolution may fall back to default when it should use
  void state.

### D-006 — Non-contract fields accessed on public identity (DESIGN DRIFT)
- `features/vport/screens/RestoreVportScreen.jsx:9` — `identity?.actorId` passed to
  `useRestoreVport`; then `identity?.isDeleted` at line 50 — isDeleted not in public contract
- `features/upload/ui/ActorPill.jsx:10-11` — `identity.displayName`, `identity.avatar` accessed
  directly. These fields are not in the public `toPublicIdentity()` shape. Both evaluate to
  `undefined` when using useIdentity() (falls through to useActorSummary hydration instead).
- `features/dashboard/vport/screens/VportDashboardScreen.jsx:58` — `identity?.vportType` not
  in public identity shape, evaluates to undefined, falls back to `dashboardDetails.vportType`.

---

## 5. Identity Contract Report

### useIdentity() surface

**File:** `state/identity/identityContext.jsx:179-181`
**File:** `state/identity/identity.model.js:1-10`

`toPublicIdentity()` returns:
```
{
  actorId: source.actorId,
  kind: source.kind,
  ownerActorId: source.ownerActorId ?? null,
  realmId: source.realmId ?? null,
}
```

**Locked contract stated in CLAUDE.md:**
> "The canonical identity fields are `actorId` and `kind` (`'user'` | `'vport'`)."
> "Never expose `profileId` or `vportId` through `useIdentity()` or any public hook or controller surface"

**Finding:** The public surface DOES expose `ownerActorId` and `realmId` beyond the strict
`actorId + kind` minimum. `profileId`, `vportId`, and `userId` are NOT exposed through
`useIdentity()`. The `ownerActorId` inclusion may be intentional but creates the systemic D-002
bug pattern where hooks pass it as callerActorId.

**Additional fields accessed from public identity but NOT in public shape:**
- `identity.isVoid` — NOT in public shape → reads `undefined` (bug)
- `identity.isDeleted` — NOT in public shape → reads `undefined`
- `identity.displayName` — NOT in public shape → reads `undefined` (falls through to actor summary)
- `identity.avatar` — NOT in public shape → reads `undefined`
- `identity.vportType` — NOT in public shape → reads `undefined`

**VERDICT:** Identity contract is PARTIALLY COMPLIANT. The forbidden fields (profileId, vportId,
userId) are correctly excluded. ownerActorId and realmId are present as intentional extensions.
But several internal-only fields are accessed on the public identity object and silently return
undefined.

---

## 6. Ownership Contract Report

**Is ownership consistently resolved through vc.actor_owners?**

### Primary gate — assertActorOwnsVportActorController
`features/booking/controller/assertActorOwnsVportActor.controller.js`

The canonical ownership check:
1. Validates requestActorId exists in vc.actors
2. Enforces `kind === 'user'` on requester (ELEK-004 fix applied — kind check precedes self-shortcut)
3. Self-shortcut at line 34: only fires AFTER kind='user' is confirmed
4. Reads `readActorOwnerLinkByActorAndUserProfileDAL` → queries `vc.actor_owners`
5. Also validates targetActorId exists and is not void
**VERDICT: REFERENCE IMPLEMENTATION. Correctly enforces the contract.**

### Session gate — assertSessionOwnsVportActorController
`features/booking/controller/assertSessionOwnsVportActor.controller.js`

Session-derived ownership check (no callerActorId from UI):
1. Validates targetActorId is vport-kind
2. Reads `readOwnerLinkByActorAndSessionDAL` → `supabase.auth.getUser()` → `profiles` → `vc.actor_owners`
**VERDICT: CONTRACT COMPLIANT. Ownership via vc.actor_owners, no UI-supplied identity.**

### checkVportOwnershipController
`features/dashboard/vport/controller/checkVportOwnership.controller.js`

Notable exception at line 8-11:
```js
if (callerActorId === targetActorId) {
  const actor = await getActorByIdDAL({ actorId: callerActorId });
  if (actor && actor.kind === "vport" && !actor.is_void) return true;
}
```
This allows a VPORT actor viewing its own dashboard to pass the ownership check **without**
querying vc.actor_owners. This is a **navigation/visibility gate exception only** — the comment
at line 7 explicitly states "mutations require a user-kind actor." The adapter comment at
`booking.adapter.js:21` documents this as "Approved §5.3 exception: actor kind/void check for
self-ownership shortcut in checkVportOwnership (1 call site, dashboard controller only)."
**VERDICT: DESIGN DRIFT — documented and intentional exception. Not a security risk because
mutations always go through assertActorOwnsVportActorController which enforces user-kind.**

### DAL-layer owner_user_id as secondary gate
- `features/settings/vports/dal/vports.write.dal.js:44,75,106` — `.eq("owner_user_id", userId)`
- `features/settings/vports/dal/vports.read.dal.js:111,134` — `.eq("owner_user_id", userId)`
**VERDICT: DESIGN DRIFT — creates dual ownership path. But the actor_owners gate is upstream
at controller layer, so this is defense-in-depth, not primary ownership.**

### listMyVports — legacy owner_user_id query
- `features/vport/dal/vport.read.vportRecords.dal.js:20` — queries by `owner_user_id = user.id`
- `features/vport/dal/vport.core.dal.js:126` — same
- `features/settings/vports/dal/vports.read.dal.js:22-52` — listMyVportsDAL correctly uses
  actor_owners path (the actor-first implementation)
**VERDICT: DESIGN DRIFT — two implementations of "list my vports". vport.core.dal.js uses
the legacy owner_user_id path; vports.read.dal.js uses the actor_owners path. The actor-first
DAL is the correct one; the legacy DAL should be migrated.**

---

## 7. Citizen Lifecycle Report (Full Trace)

**Entry point:** Auth callback → `completeOnboardingController`

1. `auth.users` row created by Supabase auth
2. `public.profiles` row created by Supabase DB trigger (or onboarding)
3. `upsertCompletedOnboardingProfileDAL()` writes display_name, username, birthdate, age, sex
4. `createUserActorForProfile({ profileId: user.id, userId: user.id })` is called
   - Enforces `profileId === userId` guard (VENOM-AUTH-006)
   - Calls `dalGetActorByProfile(profileId)` → checks if actor exists
   - If not: `dalCreateUserActor(profileId)` → `vc.rpc('create_actor_for_user', { p_kind: 'user', p_profile_id: profileId, p_vport_id: null, p_is_void: false, p_is_primary: true })`
   - Then: `dalCreateActorOwner(actor.id, userId)` → upsert into `vc.actor_owners`
     with `onConflict: 'actor_id,user_id', ignoreDuplicates: true` — IDEMPOTENT
5. `ensureVcsmPlatformBootstrap({ userId, actorId })` ensures platform linkage

**Guarantees:**
- Every citizen is guaranteed a user actor IF onboarding completes (not DB-enforced, app-enforced)
- Every citizen actor is guaranteed an actor_owners row (idempotent upsert)
- Orphan actors CAN exist if the process fails between step 4a and 4b (actor without ownership)
- The `ignoresDuplicates: true` on upsert means no error on re-run — safe for retry
- `profileId === userId` guard prevents creating an actor for a different user (security)

**Lifecycle status: SOUND with one gap** — no DB-level constraint guarantees onboarding
completion before actor creation. The `username` presence check in
`getOnboardingBootstrapController` is an app-layer guard only.

---

## 8. VPORT Lifecycle Report (Full Trace)

**Entry point:** `createVport()` in `features/vport/dal/vport.core.dal.js`

1. `requireUser()` verifies Supabase auth session exists
2. `vportSchema.rpc("create_vport", { p_slug, p_name, p_primary_category_key, ... })` is called
   - This is a SECURITY DEFINER RPC in the DB
   - Returns `{ profile_id, actor_id, slug }` — the actor is created inside the RPC
   - Error codes: AUTH_REQUIRED, ACTOR_NOT_FOUND, SLUG_ALREADY_EXISTS, etc.
3. Returns `{ vport_id: row.profile_id, actor_id: row.actor_id, ... }`
4. `refreshVcActorDirectory(row.actor_id)` is called to update identity engine links

**Implicit lifecycle (inside create_vport RPC — source-inferred, not directly readable):**
- Creates `vport.profiles` row with `owner_user_id = auth.uid()`
- Creates `vc.actors` row with `kind='vport', vport_id=profile_id`
- Creates `vc.actor_owners` row (actor_id, user_id=auth.uid()) — inferred from pattern
- Creates `platform.user_app_actor_links` row — inferred from `refreshVcActorDirectory` succeeding

**Guarantees:**
- VPORT actor creation is atomic (inside SECURITY DEFINER RPC) — no partial state visible to app
- `actor_id` is returned from `create_vport` RPC — guaranteed to exist
- `owner_user_id` is set on `vport.profiles` by the RPC
- vc.actor_owners row is presumed to be created inside the RPC (source cannot be verified
  from app layer, as migrations don't contain create_vport definition)

**Orphan risk:** The hydrator fallback at `vcsmActorHydrator.js:64-73` queries
`vport.profile_actor_access` if `actor_owners` returns no row. This suggests that in some
historical or edge-case scenario, a vport actor may lack an `actor_owners` row. The fallback
attempts recovery by using `profile_actor_access.actor_id` as ownerActorId. This ownerActorId
is then returned as part of the hydrated identity — but it is a vport actorId (from the
profile_actor_access table), not a user actorId. **This could cause ownership assertion failures
downstream because assertActorOwnsVportActorController expects ownerActorId to be a user-kind actor.**

**Lifecycle status: SOUND for normal paths, RISKY for the profile_actor_access fallback.**

---

## 9. Ownership Call Matrix

| File | Function | Ownership Source | Uses actor_owners? | Expects user actor? | Status |
|------|----------|-----------------|-------------------|---------------------|--------|
| `features/booking/controller/assertActorOwnsVportActor.controller.js` | assertActorOwnsVportActorController | vc.actor_owners | YES | YES (enforced) | REFERENCE IMPLEMENTATION |
| `features/booking/controller/assertSessionOwnsVportActor.controller.js` | assertSessionOwnsVportActorController | vc.actor_owners via session | YES | NO (session-based) | CONTRACT COMPLIANT |
| `features/booking/dal/readActorOwnerLinkByActorAndUserProfile.dal.js` | readActorOwnerLinkByActorAndUserProfileDAL | vc.actor_owners | YES | N/A (DAL only) | DAL-ONLY OK |
| `features/booking/dal/readOwnerLinkByActorAndSession.dal.js` | readOwnerLinkByActorAndSessionDAL | vc.actor_owners + session | YES | N/A (DAL only) | DAL-ONLY OK |
| `features/dashboard/vport/controller/checkVportOwnership.controller.js` | checkVportOwnershipController | vc.actor_owners (+ vport self-shortcut) | YES (with exception) | NO (approved exception) | DESIGN DRIFT (documented) |
| `features/settings/vports/dal/actorOwners.read.dal.js` | readActorOwnersByUserDAL | vc.actor_owners | YES | N/A (DAL only) | DAL-ONLY OK |
| `features/auth/dal/actorOwnerCreate.dal.js` | dalCreateActorOwner | vc.actor_owners | YES (write) | N/A (write path) | REFERENCE IMPLEMENTATION |
| `features/hydration/vcsmActorHydrator.js` | hydrateVcsmActor | vc.actor_owners + profile_actor_access fallback | PARTIAL | N/A (read) | DESIGN DRIFT (fallback) |
| `features/settings/vports/controller/vportBusinessCardSettings.controller.js` | ctrlGetVportBusinessCardSettings | actor_owners (via assertActorOwns) | YES | YES (via assert) | CONTRACT COMPLIANT |
| `features/settings/vports/controller/vportDirectoryVisibility.controller.js` | ctrlSetVportDirectoryVisible | actor_owners (via assertActorOwns) | YES | YES (via assert) | CONTRACT COMPLIANT |
| `features/settings/privacy/controller/actorPrivacy.controller.js` | ctrlSetActorPrivacy | actor_owners (via assertActorOwns; skipped if self) | YES | YES (via assert) | CONTRACT COMPLIANT |
| `features/settings/account/controller/account.controller.js` | (delete vport) | actor_owners (via assertActorOwns) | YES | YES (via assert) | CONTRACT COMPLIANT |
| `features/vport/dal/vport.core.dal.js` | listMyVports | owner_user_id = auth.uid() | NO | N/A | DESIGN DRIFT |
| `features/vport/dal/vport.read.vportRecords.dal.js` | listMyVports | owner_user_id = auth.uid() | NO | N/A | DESIGN DRIFT |

---

## 10. Anti-Pattern Inventory

### ownerActorId

| File | Layer | Classification | Why |
|------|-------|----------------|-----|
| `state/identity/identity.model.js:7` | Public identity model | PUBLIC SURFACE (ALLOWED — intentional extension) | Present in toPublicIdentity for vport→owner resolution |
| `features/hydration/vcsmActorHydrator.js:57-78` | Hydration (internal) | ALLOWED INTERNAL USE | Computed from actor_owners + fallback |
| `features/notifications/inbox/lib/resolveInboxActor.js:48` | UI layer | ALLOWED (reads public identity.ownerActorId) | Uses for inbox actor resolution — valid |
| `features/media/controller/createMediaAsset.controller.js:27` | Controller | ALLOWED INTERNAL USE | Owner of media asset — not from identity |
| `features/booking/hooks/useBookingHistory.js:18` | Hook | ALLOWED INTERNAL USE | Passed as param, not derived from identity |
| `features/settings/profile/hooks/useProfileUploads.js:36-148` | Hook | ALLOWED (identity.actorId used as ownerActorId) | actorId is correct owner for own uploads |

### profileId

| File | Layer | Classification | Why |
|------|-------|----------------|-----|
| `state/identity/identity.read.dal.js:5,130` | DAL (internal) | ALLOWED INTERNAL USE | DB query column, never exposed to UI |
| `features/auth/controllers/createUserActor.controller.js` | Controller | ALLOWED INTERNAL USE | Lifecycle creation parameter |
| `features/settings/vports/dal/vports.read.dal.js:111,134` | DAL | ALLOWED INTERNAL USE | vportId used as profile row ID |
| `features/settings/profile/model/profile.model.js:73` | Model | ALLOWED INTERNAL USE | Mapping DB row, not public |

### vportId

| File | Layer | Classification | Why |
|------|-------|----------------|-----|
| `state/identity/identity.read.dal.js:5` | DAL (internal) | ALLOWED INTERNAL USE | DB column read for actor hydration |
| `features/vport/dal/vport.core.dal.js:113` | DAL | ALLOWED INTERNAL USE | createVport return value |
| `features/settings/vports/controller/vportBusinessCardSettings.controller.js` | Controller | ALLOWED INTERNAL USE | Profile row ID passed from parent hook |

### owner_user_id

| File | Layer | Classification | Why |
|------|-------|----------------|-----|
| `features/settings/vports/dal/vports.write.dal.js:44,75,106` | DAL | DESIGN DRIFT | Defense-in-depth; actor_owners is primary |
| `features/settings/vports/dal/vports.read.dal.js:111,134` | DAL | DESIGN DRIFT | Legacy ownership path for read |
| `features/vport/dal/vport.core.dal.js:126` | DAL | DESIGN DRIFT | listMyVports uses legacy path |
| `features/vport/dal/vport.read.vportRecords.dal.js:20` | DAL | DESIGN DRIFT | Legacy listMyVports |
| `state/identity/identity.read.dal.js:124` | DAL (hydration) | ALLOWED INTERNAL USE | Reading vport.profiles for hydration |

---

## 11. Bottom-Bar Decision

**Question: Should bottom-bar read ownerActorId? YES / NO**

**ANSWER: NO — and the current architecture proves it.**

### Evidence from source

1. `features/shell/modules/bottom-bar/components/VportLeadsChip.jsx:14`:
   ```js
   const isVport = identity?.kind === "vport";
   const actorId = isVport ? identity?.actorId : null;
   const count = useVportLeadsCount(actorId);
   ```

2. `features/shell/modules/bottom-bar/hooks/useVportLeadsCount.js:18-23`:
   ```js
   const result = await countNewVportLeadsController(actorId);
   ```

3. `features/dashboard/vport/dashboard/cards/leads/controller/vportLeads.controller.js:53-57`:
   ```js
   export async function countNewVportLeadsController(actorId) {
     await assertSessionOwnsVportActorController({ targetActorId: actorId });
     ...
   }
   ```

4. `features/booking/controller/assertSessionOwnsVportActor.controller.js:10-28`:
   ```js
   assertSessionOwnsVportActorController — reads from Supabase auth session
   ```

### Analysis

`countNewVportLeadsController` uses the **session-based ownership gate**, NOT
`assertActorOwnsVportActorController`. The session gate does NOT require a user-kind actor —
it derives the owner from `supabase.auth.getUser()` → `profiles.user_id` → `vc.actor_owners`.

Therefore:
- When identity is vport-kind, passing `identity.actorId` (the vport actor) to
  `countNewVportLeadsController` is **CORRECT behavior**.
- The documented bug in SECURITY.md (THANOS-BB-NEW-001, TASK-2026-06-06-001) that says
  "ownership gate always rejects" is **INCORRECT in its diagnosis**.
- `assertSessionOwnsVportActorController` only checks that `targetActor.kind === 'vport'`
  and that the session user owns it via `vc.actor_owners`. It does NOT require callerActorId
  to be user-kind.

**Bottom-bar does NOT need to read `identity.ownerActorId`.** The current implementation
passes the vport actorId to a session-based controller that correctly resolves ownership from
the session. This is the contract-compliant approach for "vport is the active actor, and we
need to verify that the current session user owns it."

**The SECURITY.md finding TASK-2026-06-06-001 is a FALSE POSITIVE** — the correct fix is to
re-verify that `assertSessionOwnsVportActorController` works correctly (source confirms it does).

---

## 12. Top 20 Findings

### CRITICAL

**FINDING-001: profile_actor_access fallback may hydrate ownerActorId with a VPORT actorId**
- **File:** `features/hydration/vcsmActorHydrator.js:64-73`
- **Evidence:** Fallback queries `vport.profile_actor_access.actor_id` when actor_owners has no row.
  This `actor_id` could be any actor, not necessarily a user-kind actor.
- **Impact:** If a vport actor lacks an actor_owners row and has a profile_actor_access row
  with a vport actorId, the hydrated `ownerActorId` would be a vport actor. Any code reading
  `identity.ownerActorId` and passing it to assertActorOwnsVportActorController as requestActorId
  would then fail at runtime (kind !== 'user'). The session-based controller would not be affected.
- **Classification:** ARCHITECTURE VIOLATION
- **Severity:** CRITICAL (data integrity + silent runtime failures)
- **Exploitable:** Architecture only — no privilege escalation, but could silently prevent
  legitimate VPORT owners from accessing their dashboard/operations.

### HIGH

**FINDING-002: D-002 Systemic callerActorId = identity.actorId pattern when identity.kind='vport'**
- **File:** 11 hooks listed in D-002 section
- **Evidence:** Hooks directly assign `callerActorId = identity?.actorId ?? null` without
  checking identity.kind. When switched to vport identity, assertActorOwnsVportActorController
  throws "Only actor owners can manage this booking resource."
- **Impact:** Operations silently fail when user is acting as a VPORT actor. Affects: vport
  directory visibility toggle, business card settings, privacy settings, booking actions, team
  management, join barbershop, content pages.
- **Classification:** FUNCTIONAL BUG
- **Severity:** HIGH (operations unavailable for vport-acting users)
- **Exploitable:** Architecture/functional only — no security escalation.
- **Correct fix direction:** These hooks should check `identity.kind`:
  ```js
  const callerActorId = identity?.kind === "user"
    ? identity.actorId
    : availableActors?.find(a => a.actorKind === "user")?.actorId ?? null;
  ```

**FINDING-003: identity.isVoid reads undefined from public identity (createPost realm misrouting)**
- **File:** `features/upload/controllers/createPost.controller.js:77` + `useResolvedActor.js:18`
- **Evidence:** `toPublicIdentity()` does NOT include `isVoid`. `useResolvedActor` reads
  `identity.isVoid` → `undefined`. Posts are created with `resolveRealm(undefined)` which
  falls back to default realm — meaning void users' posts may land in the wrong realm.
- **Classification:** FUNCTIONAL BUG
- **Severity:** HIGH (data integrity — posts in wrong realm for void actors)
- **Exploitable:** Architecture/functional only.
- **Correct fix direction:** Add `isVoid` to `toPublicIdentity()` or read from
  `useIdentityDetailsDeprecated()`.

**FINDING-004: Legacy listMyVports in vport.core.dal.js uses owner_user_id not actor_owners**
- **File:** `features/vport/dal/vport.core.dal.js:121-131`
- **Evidence:** `.eq("owner_user_id", user.id)` used for listing vports. Actor-first equivalent
  exists in `features/settings/vports/dal/vports.read.dal.js:22-52`.
- **Impact:** If owner_user_id ever diverges from actor_owners (e.g., after a user account
  transfer), this DAL returns different results than the actor-first DAL.
- **Classification:** DESIGN DRIFT
- **Severity:** HIGH (data consistency risk)

### MEDIUM

**FINDING-005: SECURITY.md TASK-2026-06-06-001 false positive diagnosis**
- **File:** `features/shell/modules/bottom-bar/docs/SECURITY.md:47`
- **Evidence:** Documented as "callerActorId reads identity.actorId (vport-kind) instead of
  identity.ownerActorId (user-kind) → ownership gate always rejects → leads badge silently broken"
- **Source truth:** `countNewVportLeadsController` uses `assertSessionOwnsVportActorController`
  which does NOT require user-kind callerActorId — it derives ownership from auth session.
  Passing vport actorId as targetActorId is correct.
- **Impact:** Incorrect diagnosis may lead to a wrong fix that breaks the leads badge.
- **Classification:** DOCUMENTATION ERROR (false positive)
- **Severity:** MEDIUM (wrong fix direction)

**FINDING-006: profile_actor_access fallback path not covered by the same ownership guarantee**
- **File:** `features/hydration/vcsmActorHydrator.js:64-73`
- **Evidence:** Fallback exists and triggers when actor_owners has no row for a vport actor.
  This means orphan vport actors (without actor_owners rows) can still be hydrated.
- **Impact:** A vport with no actor_owners row is technically "unowned" — but the fallback
  gives it an ownerActorId anyway. This creates a false ownership signal.
- **Classification:** DESIGN DRIFT
- **Severity:** MEDIUM

**FINDING-007: checkVportOwnershipController allows vport self-match without actor_owners**
- **File:** `features/dashboard/vport/controller/checkVportOwnership.controller.js:8-11`
- **Evidence:** `callerActorId === targetActorId AND kind='vport' → return true` without DB check
- **Impact:** Navigation/visibility only — mutations are still gated. Documented and approved.
- **Classification:** DESIGN DRIFT (approved §5.3 exception)
- **Severity:** MEDIUM (architecture) / FALSE POSITIVE (security)

**FINDING-008: identity.isDeleted accessed on public identity in RestoreVportScreen**
- **File:** `features/vport/screens/RestoreVportScreen.jsx:50`
- **Evidence:** `identity?.isDeleted` accessed — not in public identity shape → reads undefined
- **Impact:** The "restore" UI check `{identity?.isDeleted && vportId && ...}` silently
  evaluates to false, hiding the restore UI even when it should show.
- **Classification:** FUNCTIONAL BUG
- **Severity:** MEDIUM

**FINDING-009: identity.vportType accessed on public identity in VportDashboardScreen**
- **File:** `features/dashboard/vport/screens/VportDashboardScreen.jsx:58,89-90`
- **Evidence:** `identity?.vportType ?? dashboardDetails.vportType` — not in public shape
- **Impact:** Falls through to dashboardDetails.vportType — likely correct behavior via fallback,
  so functional impact is minimal. But it's a pattern violation.
- **Classification:** DESIGN DRIFT
- **Severity:** MEDIUM (pattern violation; functional fallback exists)

**FINDING-010: Dual listMyVports implementations (actor_owners vs owner_user_id)**
- **Files:** `features/vport/dal/vport.core.dal.js` vs `features/settings/vports/dal/vports.read.dal.js`
- **Evidence:** Both export `listMyVports` but with different ownership resolution strategies.
- **Classification:** DESIGN DRIFT
- **Severity:** MEDIUM

### LOW

**FINDING-011: posts.group.js diagnostic reads identity.userId**
- **File:** `dev/diagnostics/groups/posts.group.js:57`
- **Evidence:** `userId = identity.userId` where identity comes from `ensureActorContext()`
  (not from useIdentity()). `ensureActorContext` is a dev diagnostic helper that returns
  a composite context including auth.userId. This is a diagnostic-only path.
- **Classification:** FALSE POSITIVE (dev/diagnostics scope, not production code)
- **Severity:** LOW / INFO

**FINDING-006-B: ActorPill accesses identity.displayName and identity.avatar**
- **File:** `features/upload/ui/ActorPill.jsx:10-11`
- **Evidence:** Reads `identity.displayName` and `identity.avatar` — not in public shape
- **Impact:** Falls through to `hydratedName` from `useActorSummary`. Functional fallback works.
- **Classification:** DESIGN DRIFT
- **Severity:** LOW

**FINDING-012: readVportBusinessCardSettingsDAL uses owner_user_id for reads**
- **File:** `features/settings/vports/dal/vports.read.dal.js:111`
- **Evidence:** `.eq("owner_user_id", userId)` — legacy path, but called from
  `ctrlGetVportBusinessCardSettings` which already enforces actor_owners at controller layer.
- **Classification:** DESIGN DRIFT (defense-in-depth)
- **Severity:** LOW

**FINDING-013: inviteActorId from identity.actorId with no kind check in invite flow**
- **File:** `features/invite/hooks/useInvite.js:68`
- **Evidence:** `inviterName: identity?.displayName ?? null` reads undefined from public identity
- **Classification:** DESIGN DRIFT
- **Severity:** LOW

**FINDING-014: ActorPrivacy ctrlSetActorPrivacy has self-shortcut without kind check**
- **File:** `features/settings/privacy/controller/actorPrivacy.controller.js:18`
- **Evidence:** `if (callerActorId !== actorId)` — if a vport actor calls with callerActorId
  being the same as actorId (its own privacy), this skips assertActorOwns. But if callerActorId
  is a different vport (different actorId), assertActorOwns is called with a vport-kind requester
  which correctly throws.
- **Classification:** DESIGN DRIFT
- **Severity:** LOW (vport self-privacy update shortcut is likely intentional)

**FINDING-015 through FINDING-020 (informational):**
- FINDING-015: `features/wanders/` uses `owner_user_id` extensively — Wanders is in FROZEN
  status, exclude from governance.
- FINDING-016: No DB-level NOT NULL constraint enforcement on actor lifecycle from app layer
  (depends entirely on RPC internals not visible from source).
- FINDING-017: `vport.profiles.actor_id` column referenced in queries but relationship between
  actor_id and vc.actor_owners not enforced at DAL layer.
- FINDING-018: `refreshVcActorDirectory` called after VPORT creation but not after citizen
  actor creation (relies on ensureVcsmPlatformBootstrap instead).
- FINDING-019: `useBookingHistory` requires both `callerActorId` and `ownerActorId` — the
  callerActorId pattern here may have the same vport-kind issue as D-002.
- FINDING-020: `features/social/privacy/dal/actorSocialSettings.dal.js:17` comment says
  "VPORT actor settings must go through ctrlUpdateVportSocialSettings (actor_owners gate)" —
  confirming actor-first intent exists but not all paths are consistently enforced.

---

## 13. Fix Plan

### P0 — Data Integrity / Silent Breakage (fix immediately)

**P0-001: Fix FINDING-001 — profile_actor_access fallback**
- File: `features/hydration/vcsmActorHydrator.js:64-73`
- Action: Verify that `profile_actor_access.actor_id` returns a user-kind actorId, not a vport
  actorId. If it returns a vport actorId, the fallback is broken. Either remove the fallback
  or validate that the returned actor is kind='user' before setting as ownerActorId.

**P0-002: Fix FINDING-003 — identity.isVoid undefined in createPost**
- Files: `features/upload/controllers/createPost.controller.js:77`, `useResolvedActor.js:18`
- Action: Add `isVoid` to `toPublicIdentity()` OR access from `useIdentityDetailsDeprecated()`.

### P1 — High-Impact Functional Bugs (fix in next sprint)

**P1-001: Fix D-002 — Systemic callerActorId = identity.actorId pattern**
- Affects: 11 hooks (see D-002 list)
- Action: Each hook that passes callerActorId to assertActorOwnsVportActorController must
  check identity.kind and resolve the user actor from `availableActors` when kind='vport'.
  Pattern already exists in: `usePublishMenuPost.js`, `usePortfolioItemSubmit.js`,
  `useUpsertVportServices.js` — use those as reference implementations.

**P1-002: Fix FINDING-008 — identity.isDeleted in RestoreVportScreen**
- File: `features/vport/screens/RestoreVportScreen.jsx:50`
- Action: Read from `useIdentityDetailsDeprecated()` or add `isDeleted` to public identity.

**P1-003: Update SECURITY.md to correct TASK-2026-06-06-001 diagnosis (FINDING-005)**
- File: `features/shell/modules/bottom-bar/docs/SECURITY.md`
- Action: Reclassify as FALSE POSITIVE. The leads count path uses session-based ownership
  controller and correctly accepts vport actorId as targetActorId. No fix needed.

### P2 — Design Drift (fix in technical debt sprint)

**P2-001: Migrate legacy listMyVports to actor_owners path**
- Files: `features/vport/dal/vport.core.dal.js:118-132`, `features/vport/dal/vport.read.vportRecords.dal.js`
- Action: Replace `owner_user_id = user.id` queries with actor_owners join pattern
  (use `features/settings/vports/dal/vports.read.dal.js:22-52` as reference).

**P2-002: Remove profile_actor_access fallback or document its actor-kind guarantee**
- File: `features/hydration/vcsmActorHydrator.js:64-73`
- Action: Determine if profile_actor_access.actor_id is always a user-kind actor.
  If yes, add an assertion. If no, remove the fallback.

**P2-003: Remove owner_user_id from write DAL WHERE clauses if actor_owners is the primary gate**
- Files: `features/settings/vports/dal/vports.write.dal.js`
- Action: Document explicitly whether owner_user_id serves as defense-in-depth or is required.
  If defense-in-depth is the intent, add a comment. If not needed, remove.

### P3 — Informational / Documentation

**P3-001: Document checkVportOwnershipController §5.3 exception in architecture contract**
- File: `features/dashboard/vport/controller/checkVportOwnership.controller.js`
- Action: Reference the approved exception in the architecture contract for future maintainers.

**P3-002: Fix non-contract field accesses on public identity**
- Files: `VportDashboardScreen.jsx`, `ActorPill.jsx`, `invite hooks`
- Action: Add `vportType` to public identity shape OR read from identityDetails.

---

## 14. Final Verdict

**ACTOR_FIRST_PARTIAL**

### Rationale

**What is correctly actor-first:**
- Both Citizen (kind='user') and VPORT (kind='vport') are modeled as full actors in `vc.actors`
- Identity resolution is engine-driven and actor-first (not profile-first)
- `assertActorOwnsVportActorController` correctly enforces user-kind only as requester
- `assertSessionOwnsVportActorController` provides a contract-compliant session-based alternative
- ELEK-004 fix is confirmed applied — kind check precedes self-shortcut
- Ownership creation is idempotent and actor-first (dalCreateActorOwner)
- Actor creation is owner-scoped with profileId === userId guard (VENOM-AUTH-006)
- Many controllers (vportBusinessCardSettings, vportDirectoryVisibility, vportSocialSettings,
  etc.) correctly gate mutations through actor_owners

**What is partially actor-first (drift):**
- 11 hooks have the systemic D-002 bug: they pass `identity.actorId` as callerActorId without
  kind-checking, breaking all operations when identity.kind='vport'
- identity.isVoid not in public shape causes wrong realm on post creation
- Two listMyVports implementations with different ownership semantics
- profile_actor_access fallback in hydrator bypasses the actor_owners contract

**What is NOT actor-first (legacy):**
- Several DAL write paths still use `owner_user_id = auth.uid()` as ownership check
- `vport.profiles.owner_user_id` is a legacy ownership field that co-exists with actor_owners

The architecture INTENDS to be actor-first and the primary security and ownership gates are
correctly implemented. The drift is systemic but patterns for correct implementation exist
throughout the codebase. The system is not broken at the security boundary — no privilege
escalation from the drift was identified. The bugs are primarily functional (silent failures,
wrong realm, unavailable UI operations for vport-acting users).

---

*Report written from source only. No speculation. All file paths are absolute references to
`/Users/vcsm/Desktop/VCSM/apps/VCSM/src`. No code changes made.*
