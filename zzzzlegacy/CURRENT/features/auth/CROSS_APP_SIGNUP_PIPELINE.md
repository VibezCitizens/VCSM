# Cross-App Signup Pipeline — VCSM + Wentrex

**Date:** 2026-04-04
**Source:** Real code inspection of all auth/identity/provisioning files

---

## 1. Signup Entry Points

### VCSM (Public Self-Signup)
| Path | Entry | Who |
|------|-------|-----|
| Public registration | `features/auth/screens/RegisterScreen.jsx` → `useRegister()` → `ctrlRegisterAccount()` | User |
| Onboarding completion | `features/auth/hooks/useAuthOnboarding.js` → `completeOnboardingController()` | User |
| Login self-heal | `state/identity/identityContext.jsx` effect → `ensureVcsmPlatformBootstrap()` | System |

### Wentrex (Admin-Provisioned, No Public Signup)
| Path | Entry | Who |
|------|-------|-----|
| Create staff/teacher/admin | `supabase/functions/create-org-member/index.ts` | Admin |
| Create student | `supabase/functions/create-student/index.ts` | Admin |
| Create parent | `supabase/functions/create-parent/index.ts` | Admin |
| Login self-heal | `features/identity/WentrexIdentityContext.jsx` → `provisionWentrexIdentity()` | System |

---

## 2. VCSM Signup Pipeline

### Sequence Diagram

```
User fills email+password on RegisterScreen
  ↓
useRegister() hook
  ↓
ctrlRegisterAccount({ email, password })
  ├── dalSignUpRegisterUser() → supabase.auth.signUp() → auth.users CREATED
  └── dalUpsertRegisterProfile() → public.profiles UPSERTED (id=userId, email)
  ↓
Navigate to /onboarding
  ↓
useAuthOnboarding() hook
  ↓
completeOnboardingController({ userId, form })
  ├── upsertCompletedOnboardingProfileDAL() → public.profiles UPDATED (name, username, birthdate, age, sex)
  ├── createUserActorForProfile({ profileId: user.id, userId: user.id })
  │   ├── dalGetActorByProfile(profileId) → vc.actors SELECT
  │   ├── dalCreateUserActor(profileId) → RPC create_actor_for_user → vc.actors CREATED
  │   └── dalCreateActorOwner(actor.id, userId) → vc.actor_owners UPSERTED
  │   └── Returns: ActorModel({ id, kind, profileId, isVoid })
  └── ensureVcsmPlatformBootstrap({ userId: user.id, actorId: actor.id })
      └── dalProvisionVcsmIdentity({ userId, actorId })
          └── RPC provision_vcsm_identity(p_user_id, p_actor_id) [SECURITY DEFINER]
              ├── platform.user_app_access UPSERTED
              ├── platform.user_app_accounts UPSERTED
              ├── platform.user_app_preferences UPSERTED
              ├── platform.user_app_state UPSERTED
              ├── platform.user_app_actor_links UPSERTED (actor_source='vc')
              └── vc.actors.user_app_account_id UPDATED
          └── Returns: userAppAccountId
  ↓
Navigate to /feed
  ↓
IdentityProvider effect fires
  ↓
loadDefaultIdentityForUser({ userId, savedActorId })
  ├── dalGetVcsmAppAccount(userId) → platform.user_app_accounts
  ├── dalListVcActorLinks(accountId) → platform.user_app_actor_links
  ├── dalGetVcsmPreferences(accountId) → platform.user_app_preferences
  └── readIdentityActorByIdDAL(actorId) → vc.actors
      └── hydrateIdentityActor(actor)
          ├── readProfileIdentityDAL(profile_id) → public.profiles
          ├── readActorPrivacyDAL(actor_id) → vc.actor_privacy_settings
          └── resolveRealmId(actor) → vc.realms
  ↓
setIdentity(hydratedIdentity)
  ↓
useIdentity() available to 50+ consumers
```

### Table Write Order

| # | Table | File | Why |
|---|-------|------|-----|
| 1 | `auth.users` | `register.dal.js` → `supabase.auth.signUp()` | Auth account |
| 2 | `public.profiles` | `register.dal.js` → `dalUpsertRegisterProfile()` | Profile shell |
| 3 | `public.profiles` (update) | `onboarding.dal.js` → `upsertCompletedOnboardingProfileDAL()` | Name, username, birthdate |
| 4 | `vc.actors` | `actorCreate.dal.js` → RPC `create_actor_for_user` | Domain actor |
| 5 | `vc.actor_owners` | `actorOwnerCreate.dal.js` → upsert | Domain ownership |
| 6 | `platform.user_app_access` | RPC `provision_vcsm_identity` | App access grant |
| 7 | `platform.user_app_accounts` | same RPC | App account |
| 8 | `platform.user_app_preferences` | same RPC | Defaults |
| 9 | `platform.user_app_state` | same RPC | State defaults |
| 10 | `platform.user_app_actor_links` | same RPC | Actor link (actor_source='vc') |
| 11 | `vc.actors` (update) | same RPC | user_app_account_id bridge |

### Return Shapes

| Function | File | Returns |
|----------|------|---------|
| `ctrlRegisterAccount()` | `register.controller.js` | `{ ok, requiresEmailConfirm, userId, message }` |
| `completeOnboardingController()` | `onboarding.controller.js` | `{ ok, action, error, data: { userId } }` |
| `createUserActorForProfile()` | `createUserActor.controller.js` | `ActorModel({ id, kind, profileId, isVoid })` — **`id` not `actorId`** |
| `dalProvisionVcsmIdentity()` | `provision.rpc.dal.js` | `userAppAccountId` (uuid string) |
| `ensureVcsmPlatformBootstrap()` | bootstrap controller | `{ ok, userAppAccountId?, error? }` |

### Non-Fatal Failure Points

| File | Code | What's hidden |
|------|------|--------------|
| `onboarding.controller.js` line 123 | `.catch(() => {})` | Platform provisioning failure completely swallowed |
| `ensureVcsmPlatformBootstrap` line 43-48 | `try/catch → { ok: false }` | RPC failure returns error object, not throw |
| `identityContext.jsx` self-heal | Dynamic imports + catch | Self-heal failure → identity=null |

### VCSM Signup Risks
- **Partial creation:** Profile + actor created, but if RPC fails → no platform rows. Self-heal covers this on next login.
- **Non-fatal swallowing:** `.catch(() => {})` means platform provisioning failure is invisible in production.
- **RPC dependency:** If `provision_vcsm_identity` RPC is down or not yet updated to accept `p_actor_id`, the entire platform bootstrap fails silently.
- **Field name trap:** ActorModel returns `{ id }` not `{ actorId }` — previously caused the bootstrap to never run. Fixed.

---

## 3. Wentrex Signup Pipeline

### 3.1 Staff/Teacher/Admin Creation

```
Admin clicks "Enroll Staff" on dashboard
  ↓
DashboardScreen → EnrollStaffModal
  ↓
createOrgMember() → supabase.functions.invoke("create-org-member")
  ↓
create-org-member/index.ts (Edge Function)
  ├── Resolve caller + authorize (3-level check)
  ├── adminClient.auth.admin.createUser() → auth.users CREATED
  └── adminClient.schema("learning").rpc("ensure_org_member_account") → SECURITY DEFINER RPC
      ├── public.profiles UPSERTED
      ├── learning.actors CREATED (via internal actor resolution)
      ├── learning.actor_owners CREATED
      ├── learning.organization_memberships CREATED (role, status=active)
      └── learning.actor_access CREATED (can_access_learning_center=true)
  ↓
Edge function returns { authUserId, actorId, membershipId, generatedPassword }
```

**Platform rows:** NOT created during admin provisioning. Created on first login via self-heal.

### 3.2 Student Creation

```
Admin clicks "Register Student" on dashboard
  ↓
RegisterStudentScreen → createStudent()
  ↓
supabase.functions.invoke("create-student")
  ↓
create-student/index.ts (Edge Function)
  ├── Authorize (3-level check)
  ├── RPC generate_student_login_id() → 7-digit ID (e.g., 2026015)
  ├── syntheticEmail = "s2026015@school.internal"
  ├── adminClient.auth.admin.createUser({ email: syntheticEmail }) → auth.users CREATED
  ├── learning.actors INSERT (user_id, organization_id, is_active=true)
  ├── learning.actor_identities UPSERT (login_id, synthetic_email, must_change_password=true)
  ├── learning.actor_profiles UPSERT (full_name, student_id)
  ├── learning.actor_access UPSERT (can_access_learning_center=true)
  └── learning.course_memberships UPSERT (role=student, if courses provided)
  ↓
Returns { authUserId, studentActorId, loginId, generatedPassword }
```

### 3.3 Parent Creation

```
Admin clicks "Link Parent" on dashboard
  ↓
LinkParentScreen → createParent()
  ↓
supabase.functions.invoke("create-parent")
  ↓
create-parent/index.ts (Edge Function)
  ├── Authorize (3-level check)
  ├── Find or create auth user by email
  ├── RPC ensure_parent_account() → SECURITY DEFINER
  │   ├── public.profiles UPSERTED
  │   ├── learning.actors CREATED
  │   ├── learning.actor_owners CREATED
  │   └── learning.actor_access CREATED
  ├── learning.actor_profiles UPSERT (full_name, relationship)
  ├── learning.actor_identities UPSERT (parent_email, parent_name)
  └── learning.parent_student_links INSERT
  ↓
Returns { authUserId, parentActorId, linkId }
```

### 3.4 Login + Self-Heal (All Roles)

```
User logs in (LoginScreen or StudentLoginScreen)
  ↓
supabase.auth.signInWithPassword() (or student-login edge fn → setSession)
  ↓
SIGNED_IN auth event fires
  ↓
WentrexIdentityContext.resolve()
  ↓
provisionWentrexIdentity()
  ├── resolveSessionUser() → userId
  ├── resolveWentrexActorForProvisioning(supabase, userId)
  │   ├── learning.actors WHERE user_id, is_active=true → actor
  │   └── learning.actor_access WHERE actor_id → hasAccess check
  ├── dalProvisionWentrexIdentity({ actorId, organizationId })
  │   └── RPC provision_wentrex_identity(p_actor_id, p_organization_id) [SECURITY DEFINER]
  │       ├── platform.user_app_access UPSERTED
  │       ├── platform.user_app_accounts UPSERTED
  │       ├── platform.user_app_actor_links UPSERTED (actor_source='learning')
  │       ├── platform.user_app_preferences UPSERTED
  │       └── platform.user_app_state UPSERTED
  └── resolveAuthenticatedContext({ appKey: 'wentrex' })
      └── Engine resolves: session → app → access → account → actor links → roles
          └── Wentrex resolver derives roleKeys from learning.*
  ↓
WentrexIdentityContext sets context
  ↓
LoginScreen navigates to context.defaultDestination
  ↓
useWentrexIdentity() / useWentrexActorId() available
```

### Wentrex Table Write Order (Staff/Admin Creation + First Login)

| # | Table | When | File |
|---|-------|------|------|
| 1 | `auth.users` | Admin creation | create-org-member edge fn |
| 2 | `public.profiles` | Admin creation | ensure_org_member_account RPC |
| 3 | `learning.actors` | Admin creation | same RPC |
| 4 | `learning.actor_owners` | Admin creation | same RPC |
| 5 | `learning.organization_memberships` | Admin creation | same RPC |
| 6 | `learning.actor_access` | Admin creation | same RPC |
| 7 | `platform.user_app_access` | First login | provision_wentrex_identity RPC |
| 8 | `platform.user_app_accounts` | First login | same RPC |
| 9 | `platform.user_app_actor_links` | First login | same RPC (actor_source='learning') |
| 10 | `platform.user_app_preferences` | First login | same RPC |
| 11 | `platform.user_app_state` | First login | same RPC |

### Wentrex Signup Risks
- **Student partial creation:** 5 separate inserts (actor → identity → profile → access → memberships) without a wrapping transaction. If one fails mid-way, student is partially provisioned.
- **Self-heal dependency:** Platform rows don't exist until first login. If RPC is down during first login, user gets `NO_LEARNING_ACTOR` and can't access the app.
- **Edge function auth:** Uses `adminClient` with service role key — if the edge function isn't deployed, user creation fails entirely.

---

## 4. Cross-App Comparison

| Aspect | VCSM | Wentrex |
|--------|------|---------|
| **Signup model** | Public self-signup | Admin-provisioned (no public signup) |
| **Auth creation** | Client-side `supabase.auth.signUp()` | Server-side `adminClient.auth.admin.createUser()` |
| **Domain actor table** | `vc.actors` | `learning.actors` |
| **Actor creation method** | RPC `create_actor_for_user` | RPC `ensure_org_member_account` (staff) / direct INSERT (student) |
| **Actor ownership** | `vc.actor_owners` (domain) | `learning.actor_owners` (domain) |
| **Platform provisioning** | During onboarding, same session | On first login, self-heal pattern |
| **Provision RPC** | `provision_vcsm_identity(p_user_id, p_actor_id)` | `provision_wentrex_identity(p_actor_id, p_organization_id)` |
| **RPC input** | Takes userId + actorId | Takes actorId + organizationId |
| **Actor source tag** | `'vc'` | `'learning'` |
| **Identity resolution** | Platform-only (no legacy fallback) | Engine-backed (`resolveAuthenticatedContext`) |
| **Identity hook** | `useIdentity()` → `{ identity, loading, switchActor }` | `useWentrexIdentity()` → `{ loading, context, error }` |
| **Role system** | None (roleKeys=[]) | Derived from org_memberships + parent_links + course_memberships |
| **Engine usage** | Setup exists but not called; DALs used directly | Fully engine-backed via `@identity` |
| **Self-heal** | Yes — identityContext tries, then self-heals, then retries | Yes — WentrexIdentityContext `_canSelfHeal` pattern |
| **Non-fatal failures** | `.catch(() => {})` swallows all errors | `_canSelfHeal()` retries; non-healable errors shown |

### What Both Apps Share
- Platform provisioning via SECURITY DEFINER RPC
- Same `platform.*` schema tables
- Actor link model with `actor_source` discriminator
- Self-heal pattern for missing platform rows
- Idempotent provisioning (all RPCs use ON CONFLICT DO NOTHING)

### Biggest Architectural Difference
VCSM does platform reads directly via app DALs (`dalGetVcsmAppAccount`, `dalListVcActorLinks`).
Wentrex delegates platform reads to the identity engine (`resolveAuthenticatedContext`).
The engine already handles account lookup, actor link listing, active actor selection, and preference management — VCSM duplicates all of this.

---

## 5. Executive Summary

- **Cleaner signup pipeline:** Wentrex — atomic RPCs for creation, engine for resolution
- **Safer identity bootstrap:** Wentrex — engine handles errors with typed codes (NO_SESSION, NO_LEARNING_ACTOR, ACCESS_DENIED)
- **More engine-aligned:** Wentrex — fully uses `@identity` engine; VCSM has the setup but doesn't call it
- **More app-specific identity logic:** VCSM — direct platform DAL reads, custom hydration, localStorage hints

**Top 10 files to inspect for signup/debugging:**
1. `apps/VCSM/src/features/auth/controllers/onboarding.controller.js` — VCSM signup orchestrator
2. `apps/VCSM/src/features/identity/controller/ensureVcsmPlatformBootstrap.controller.js` — VCSM provisioning
3. `apps/VCSM/src/features/identity/dal/provision.rpc.dal.js` — VCSM RPC caller
4. `apps/VCSM/src/state/identity/identityContext.jsx` — VCSM identity bootstrap + self-heal
5. `apps/VCSM/src/state/identity/identity.controller.js` — VCSM identity resolution
6. `apps/wentrex/src/features/identity/WentrexIdentityContext.jsx` — Wentrex identity bootstrap
7. `apps/wentrex/src/features/identity/controller/provisionWentrexIdentity.controller.js` — Wentrex provisioning
8. `apps/wentrex/supabase/functions/create-org-member/index.ts` — Staff creation
9. `apps/wentrex/supabase/functions/create-student/index.ts` — Student creation
10. `apps/wentrex/src/features/identity/resolvers/wentrexIdentity.resolver.js` — Role derivation

**Top 5 critical DB tables:**
1. `platform.user_app_accounts` — both apps
2. `platform.user_app_actor_links` — both apps (actor_source differs)
3. `vc.actors` / `learning.actors` — domain actors
4. `platform.user_app_preferences` — active actor selection
5. `public.profiles` — user profile data

**Biggest VCSM signup risk:** `.catch(() => {})` swallows platform provisioning failures. If the RPC fails, the user has a vc actor but no platform rows — identity resolution returns null.

**Biggest Wentrex signup risk:** Student creation uses 5 separate inserts without a transaction. Partial failure leaves a half-provisioned student.

**Safest next VCSM step:** Call `setupVcsmIdentityEngine()` in `main.jsx` and use engine's `resolveAuthenticatedContext` instead of direct platform DAL calls — eliminates the duplicated resolution logic.

**Safest next Wentrex step:** Wrap student creation inserts in the `ensure_org_member_account` RPC pattern (single atomic RPC) instead of 5 separate inserts.
