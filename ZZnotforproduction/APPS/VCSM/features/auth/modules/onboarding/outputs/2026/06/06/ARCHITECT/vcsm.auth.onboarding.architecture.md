---
title: auth/modules/onboarding — ARCHITECT Module Architecture Report
feature: auth
module: onboarding
scope: /onboarding screen — Complete Your Profile form
run-date: 2026-06-06
status: SOURCE_VERIFIED
method: V1 manual scan — all source files read
scan-trigger: User screenshot of /onboarding at localhost:5173/onboarding
---

# MODULE ARCHITECTURE REPORT

**Module:** onboarding
**Application Scope:** apps/VCSM
**Module Type:** feature module (auth sub-module)
**Primary Root:** apps/VCSM/src/features/auth/
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The auth/onboarding module captures the initial profile fields for a newly registered Citizen immediately after email verification. It collects display name, username base (sanitized + deduped via RPC), birthdate, age (computed), sex, and then creates the user's actor + ownership record in the vc schema.

This is the identity bootstrap gate — no actor exists in `vc.actors` until this module's write path completes. Downstream features (feed, chat, explore, notifications) all require a resolved actor that this module creates.

---

## OWNERSHIP

**Owner:** VCSM platform team — auth and identity domain
**Primary domain:** Supabase Auth + public.profiles + vc.actors + vc.actor_owners
**Auth boundary:** All writes verified against live Supabase session (session.user.id)

---

## ENTRY POINTS

| Route | Screen | Lazy Loader | Guard | Trigger |
|---|---|---|---|---|
| `/onboarding` | Onboarding.jsx | lazyPublic.jsx → OnboardingScreen | ProtectedRoute | Post-register or post-callback when profile is incomplete |

**Route registration:** `apps/VCSM/src/app/routes/index.jsx:178` — inside `<ProtectedRoute>` but OUTSIDE `<ProfileGatedOutlet>`. This is intentional: the gate would redirect here, but the screen itself must not require the profile to already be complete.

**Lazy load path:** `apps/VCSM/src/app/routes/lazyPublic.jsx:49` → `import("@/features/auth/screens/Onboarding")`

---

## LAYER MAP (SOURCE-VERIFIED)

```
DAL:
  apps/VCSM/src/features/auth/dal/onboarding.dal.js
    ├── readCurrentAuthUserDAL()            → supabase.auth.getUser()
    ├── readProfileForOnboardingDAL(id)     → public.profiles (SELECT id,username,birthdate)
    ├── readProfileShellDAL(id)             → public.profiles (SELECT id,display_name,username,birthdate,age,sex)
    ├── upsertProfileShellDAL({...})        → public.profiles (upsert — no session filter)
    ├── generateUsernameDAL({...})          → generate_username RPC
    └── upsertCompletedOnboardingProfileDAL({...}) → public.profiles (upsert: display_name, username,
                                                      birthdate, age, is_adult, sex, publish=true,
                                                      discoverable=true)

  apps/VCSM/src/features/auth/dal/authSession.read.dal.js
    └── dalGetAuthSession()                 → supabase.auth.getSession()

  apps/VCSM/src/features/auth/dal/actorCreate.dal.js
    └── dalCreateUserActor(profileId)       → vc.create_actor_for_user RPC (kind='user')

  apps/VCSM/src/features/auth/dal/actorOwnerCreate.dal.js
    └── dalCreateActorOwner(actorId, userId) → vc.actor_owners upsert
                                               (conflict: actor_id,user_id; ignoreDuplicates=true)

  apps/VCSM/src/features/auth/dal/actorGetByProfile.dal.js
    └── dalGetActorByProfile(profileId)     → vc.actors (SELECT id,kind,profile_id,is_void)

  CROSS-FEATURE DAL (BOUNDARY VIOLATION):
    apps/VCSM/src/features/initiation/dal/vibeInvites.dal
    └── acceptVibeInviteByCodeDAL(code, actorId)  [imported directly — no adapter boundary]

Model:
  apps/VCSM/src/features/auth/model/onboarding.model.js
    ├── mapProfileOnboardingRowToFormModel(row)    → hydrates form from DB row
    ├── isProfileShellIncompleteModel(row)         → completion check
    ├── normalizeOnboardingFormModel(form)         → trims/sanitizes form fields
    ├── normalizeSexValueModel(value)              → 'male'→'Male', 'female'→'Female', else null
    └── computeAgeFromBirthdateModel(isoDate)      → integer age or null (future dates → null)

  apps/VCSM/src/features/auth/model/actor.model.js
    └── ActorModel(row)                            → strips profile_id; returns {id, kind, isVoid}

  apps/VCSM/src/features/auth/model/authInputValidation.model.js
    └── isSafeAuthReturnPath(path)                 → allowlist prefix check; rejects // and absolute URLs

Controller:
  apps/VCSM/src/features/auth/controllers/onboarding.controller.js
    ├── getOnboardingBootstrapController()         → session check → profile read → form hydration
    ├── completeOnboardingController({...})        → full write path (session-pinned)
    └── bootstrapJoinOnboardingController({...})   → join/barbershop invite path (session-pinned)

  apps/VCSM/src/features/auth/controllers/profileOnboarding.controller.js
    └── ensureProfileShell({userId, email})        → profile shell upsert (NO session cross-check)

  apps/VCSM/src/features/auth/controllers/createUserActor.controller.js
    └── createUserActorForProfile({profileId, userId, refreshActorFn})
          → get-or-create actor + ensure ownership (IDEMPOTENT; profileId===userId guard present)

Hook:
  apps/VCSM/src/features/auth/hooks/useAuthOnboarding.js
    ├── Calls getOnboardingBootstrapController() on mount
    ├── Calls completeOnboardingController() on form submit
    ├── Validates: all 4 fields non-empty before enabling submit
    ├── Redirect safety: isSafeAuthReturnPath(state.from) — confirmed allowlist-gated
    └── Returns: {form, loading, saving, errorMessage, isValid, todayISO, handleChange, handleSave}

  apps/VCSM/src/features/auth/hooks/useJoinOnboarding.js
    └── Thin wrapper: re-exports bootstrapJoinOnboardingController as bootstrapJoinOnboarding

Screen:
  apps/VCSM/src/features/auth/screens/Onboarding.jsx
    ├── Consumes: useAuthOnboarding()
    ├── Fields: display_name, username_base, birthdate (type=date, max=todayISO), sex (select)
    ├── Submit: form onSubmit → handleSave()
    ├── Loading state: opacity fade + pointer-events:none on form div
    ├── Error state: error alert div with role="alert" aria-live="polite"
    ├── Empty/disabled state: button disabled when !isValid or busy
    └── No redirects in screen — all routing in hook
```

---

## FULL CALL CHAIN — BOOTSTRAP PATH

```
URL: /onboarding
  → ProtectedRoute (guard: authenticated user required)
  → Onboarding.jsx
  → useAuthOnboarding (useEffect on mount)
  → getOnboardingBootstrapController()
      1. dalGetAuthSession()              → supabase.auth.getSession()
         isAnonymousUser(user)?           → bounce to /register
         !user?                           → bounce to /login
      2. readProfileForOnboardingDAL(user.id)
                                          → public.profiles
                                            SELECT id,username,birthdate
                                            .eq('id', profileId)
      3. mapProfileOnboardingRowToFormModel(profileRow)
                                          → {display_name:'', username_base, birthdate, sex}
  → setUserId(userId)
  → setForm({...EMPTY_FORM, ...form})
  → setLoading(false) → form renders
```

---

## FULL CALL CHAIN — SAVE PATH (CRITICAL PATH)

```
User: fills form → clicks "Save & Continue"
  → Onboarding.jsx: form onSubmit → handleSave()
  → useAuthOnboarding.handleSave()
      guard: isValid && userId → else no-op

  → completeOnboardingController({userId, form, ensureVcsmPlatformBootstrap, refreshActorFn})

      1. dalGetAuthSession()              → session re-verify
         isAnonymousUser(user)?           → return {ok:false, action:'register'}
         !user?                           → return {ok:false, action:'login'}
         userId !== user.id?              → return {ok:false, action:'login', error:'Session changed'}
                                          *** SESSION PIN CONFIRMED — source-verified ***

      2. normalizeOnboardingFormModel(form)
                                          → trims display_name, username_base, birthdate
                                          → normalizeSexValueModel(sex) → 'Male'|'Female'|null

      3. guard: !displayName || !usernameBase || !birthdate → return error

      4. generateUsernameDAL({displayName, usernameBase})
                                          → supabase.rpc('generate_username', {
                                               _display_name: displayName,
                                               _username: usernameBase
                                             })
                                          → returns finalUsername (sanitized + deduplicated)

      5. computeAgeFromBirthdateModel(birthdate)
                                          → integer age; future dates → null → return error

      6. upsertCompletedOnboardingProfileDAL({profileId: user.id, ...})
                                          → public.profiles upsert {
                                               id, display_name, username, birthdate,
                                               age, is_adult, sex,
                                               publish: true, discoverable: true,    ← VISIBILITY FLAGS
                                               updated_at
                                             }
                                          *** NOTE: publish + discoverable set here atomically ***

      7. createUserActorForProfile({profileId: user.id, userId: user.id, refreshActorFn})
         7a. guard: profileId !== userId → throw (VENOM-AUTH-006 guard — source-verified)
         7b. dalGetActorByProfile(profileId)
                                          → vc.actors SELECT id,kind,profile_id,is_void
                                            .eq('profile_id', profileId)
         7c. if !actor: dalCreateUserActor(profileId)
                                          → vc.create_actor_for_user RPC {
                                               p_kind: 'user',
                                               p_profile_id: profileId,
                                               p_vport_id: null,
                                               p_is_void: false,
                                               p_is_primary: true
                                             }
         7d. dalCreateActorOwner(actor.id, userId)
                                          → vc.actor_owners upsert
                                            {actor_id, user_id}
                                            onConflict: 'actor_id,user_id'
                                            ignoreDuplicates: true (IDEMPOTENT)
         7e. refreshActorFn?.(actor.id)   → triggers identity refresh in state
         7f. return ActorModel(actor)     → {id, kind, isVoid} — profileId STRIPPED ✓

      8. if actor.id && citizenInviteCode (from user.user_metadata.citizen_invite_code):
         acceptVibeInviteByCodeDAL(inviteCode, actor.id)   ← CROSS-FEATURE DAL IMPORT
                                          → initiation/dal/vibeInvites.dal
                                          → best-effort (.catch logs to Sentry)
                                          → does NOT block onboarding completion

      9. ensureVcsmPlatformBootstrap?.({userId: user.id, actorId: actor.id})
                                          → identity adapter (platform bootstrap)

      10. return {ok: true, data: {userId: user.id}}

  → navigate(navState.redirectTo, {replace: true})
     redirectTo = isSafeAuthReturnPath(state.from) ? state.from : '/'
     *** REDIRECT VALIDATED — allowlist prefix check confirmed ***
```

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Source read — identity bootstrap; actor creation | — |
| Owner defined | PASS | Auth feature — VCSM platform team | — |
| Entry points mapped | PASS | /onboarding route — ProtectedRoute, lazyPublic | — |
| Controllers present | PASS | onboarding.controller, profileOnboarding.controller, createUserActor.controller | — |
| DAL/repository present | PASS | onboarding.dal, authSession.read.dal, actorCreate.dal, actorOwnerCreate.dal, actorGetByProfile.dal | Cross-feature DAL import (see Boundary) |
| Models/transformers present | PASS | onboarding.model, actor.model, authInputValidation.model | — |
| Hooks/view models present | PASS | useAuthOnboarding, useJoinOnboarding | — |
| Screens/components present | PASS | Onboarding.jsx — all UI states handled | — |
| Services/adapters consumed | PASS | identity.adapter → ensureVcsmPlatformBootstrap, refreshVcActorDirectory | — |
| Database objects mapped | PASS | public.profiles, vc.actors, vc.actor_owners, vc.vibe_invites (cross), 2 RPCs | — |
| Authorization path mapped | PASS | Session pin in completeOnboardingController confirmed (source-read) | profileOnboarding.controller — no session pin (ONBOARDING-SEC-001) |
| Cache/runtime behavior | PARTIAL | No local cache; session from supabase.auth.getSession() | No optimistic update — full roundtrip on save |
| Error/loading/empty states | PASS | Loading (opacity fade), error (role=alert, aria-live), disabled button (!isValid\|\|busy) | — |
| Documentation linked | PARTIAL | INDEX.md, ARCHITECTURE.md, SECURITY.md — all STUB status before this run | BEHAVIOR.md is STUB for this module |
| Tests/validation noted | FAIL | 0 test files in auth/modules/onboarding | controllers/__tests__/onboarding.controller.test.js exists at feature level — verify scope |
| Native parity noted | N/A | No native (iOS) implementation tracked for this module | — |
| Engine dependencies mapped | PASS | No direct engine import; identity adapter boundary respected for platform bootstrap | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| public.profiles | database | onboarding → profiles | DAL boundary — correct | Read (2 queries) + Upsert (2 writes) |
| vc.actors | database | onboarding → actors | DAL via RPC — correct | dalCreateUserActor uses create_actor_for_user RPC |
| vc.actor_owners | database | onboarding → actor_owners | DAL boundary — correct | Idempotent upsert |
| generate_username RPC | database | onboarding → RPC | DAL boundary — correct | Returns sanitized+unique username |
| Supabase Auth | external | onboarding → supabase.auth | authSession.read.dal — correct | getSession() for session verification |
| identity.adapter | feature adapter | onboarding → identity | Adapter boundary — CORRECT | ensureVcsmPlatformBootstrap, refreshVcActorDirectory |
| authInputValidation.model | model | onboarding → auth/model | Same-feature — correct | isSafeAuthReturnPath |
| initiation/dal/vibeInvites.dal | feature DAL | onboarding → initiation | **DIRECT IMPORT — VIOLATION** | acceptVibeInviteByCodeDAL: line 13 of onboarding.controller.js |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| public.profiles | read/write | auth | onboarding.dal | MEDIUM — upsertProfileShellDAL has no session filter (ONBOARDING-SEC-001) |
| public.profiles.publish | write | auth | upsertCompletedOnboardingProfileDAL | LOW — set to true at onboarding; expected behavior |
| public.profiles.discoverable | write | auth | upsertCompletedOnboardingProfileDAL | LOW — set to true at onboarding; expected behavior |
| vc.actors | read/write | identity | actorCreate.dal, actorGetByProfile.dal | PASS — owner-scoped via RPC |
| vc.actor_owners | write | identity | actorOwnerCreate.dal | PASS — idempotent, conflict-safe |
| vc.vibe_invites | read/write | initiation | acceptVibeInviteByCodeDAL (cross-feature) | MEDIUM — direct DAL import bypasses adapter |
| user.user_metadata.citizen_invite_code | read | supabase auth | onboarding.controller:127 | LOW — best-effort only; failure caught |
| form.redirectTo (state.from) | derived | router | useAuthOnboarding | PASS — isSafeAuthReturnPath validates allowlist |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PASS | /onboarding registered under ProtectedRoute | — |
| Loading state | PASS | opacity:0.5 + pointerEvents:none on form; "Loading..." button text | — |
| Empty state | PASS | Button disabled (!isValid) until all 4 fields populated | — |
| Error state | PASS | role=alert, aria-live=polite error div; Sentry capture on both bootstrap and save | — |
| Auth/owner gates | PASS | ProtectedRoute requires session; completeOnboardingController pins to session.user.id | profileOnboarding.controller has no pin (ONBOARDING-SEC-001) |
| Cache behavior | N/A | No caching — all reads direct from Supabase; state reset on each mount | — |
| Hot path identified | YES | upsertCompletedOnboardingProfileDAL + dalCreateUserActor RPC — sequential writes on save | No retry on partial failure |
| Monitoring | PASS | captureFrontendError on bootstrap failure and save failure; invite attribution failure | — |
| LOKI handoff | NOT NEEDED | Runtime behavior is straightforward sequential writes; no async complexity | — |
| KRAVEN handoff | NOT NEEDED | No N+1 risk; 2 RPCs + 2 table writes — bounded and acceptable | — |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Architecture | ZZnotforproduction/APPS/VCSM/features/auth/modules/onboarding/ARCHITECTURE.md | STUB → updated this run |
| Index | ZZnotforproduction/APPS/VCSM/features/auth/modules/onboarding/INDEX.md | STUB → updated this run |
| Security | ZZnotforproduction/APPS/VCSM/features/auth/modules/onboarding/SECURITY.md | STUB |
| Behavior | ZZnotforproduction/APPS/VCSM/features/auth/modules/onboarding/BEHAVIOR.md | STUB |
| Feature BEHAVIOR.md | ZZnotforproduction/APPS/VCSM/features/auth/BEHAVIOR.md | ACTIVE (auth-level) |
| Feature ARCHITECTURE.md | ZZnotforproduction/APPS/VCSM/features/auth/ARCHITECTURE.md | PRESENT |
| Ownership | ZZnotforproduction/APPS/VCSM/features/auth/OWNERSHIP.md | PRESENT |
| Security audit | ZZnotforproduction/APPS/VCSM/features/auth/SECURITY.md | PRESENT |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | — | N/A |
| Engine audit | — | N/A — no engine direct dependency |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Cross-feature DAL import — initiation boundary violation | HIGH | onboarding.controller imports initiation/dal/vibeInvites.dal directly. No adapter exists that would proxy this. Violates architecture contract. Future initiation DAL changes can silently break onboarding. | ARCHITECT → WOLVERINE |
| profileOnboarding.controller.js — no session pin in ensureProfileShell | MEDIUM | userId is accepted from caller; no supabase.auth.getUser() cross-check inside; upsert has no .eq('id', auth.uid()) filter (ONBOARDING-SEC-001). DB RLS is the only backstop and is unconfirmed (ONBOARDING-SEC-002). | ELEKTRA → patch |
| BEHAVIOR.md for this module — STUB | MEDIUM | No authoritative behavior contract for the profile completion write path. ONBOARDING-SEC-003 redirect path is unverified in behavior docs. | LOGAN |
| Test coverage — controller unit tests exist at feature level but scope unclear | MEDIUM | controllers/__tests__/onboarding.controller.test.js exists — verify it covers session mismatch, age validation, and username generation paths. | SPIDER-MAN |
| Partial failure on profile upsert + actor creation | MEDIUM | If upsertCompletedOnboardingProfileDAL succeeds but dalCreateUserActor fails, profile is written but no actor exists. User is blocked with an orphaned profile. No retry path in current implementation. | WOLVERINE |
| Open redirect mitigation documented but not in module SECURITY.md | LOW | isSafeAuthReturnPath IS present and validated. ONBOARDING-SEC-003 in SECURITY.md is outdated — this is now BLOCKED not OPEN. | LOGAN → update |
| publish=true + discoverable=true forced on onboarding upsert | LOW | Profile becomes publicly visible and discoverable immediately upon onboarding completion, before the user completes any other settings. This is likely intentional but undocumented as a business rule. | IRONMAN |

---

## MODULE BOUNDARY WARNINGS

### MODULE BOUNDARY WARNING — 1

**Location:** apps/VCSM/src/features/auth/controllers/onboarding.controller.js:13
**Module:** auth/onboarding
**Current dependency:** `import { acceptVibeInviteByCodeDAL } from '@/features/initiation/dal/vibeInvites.dal'`
**Expected boundary:** Cross-feature access must go through the initiation feature's adapter (`initiation/adapters/onboarding.adapter.js`). The adapter currently exports only `OnboardingCardsView` and `CitizenVibesScreen` — no DAL proxy exists.
**Risk:** Architecture contract violation. The auth feature is directly coupled to an internal DAL layer of the initiation feature. If `vibeInvites.dal` is renamed, moved, or its signature changes, the auth onboarding controller breaks silently.
**Suggested correction:** Either (a) add `acceptVibeInviteByCode` as an exported function in `initiation/adapters/onboarding.adapter.js` and import from there, or (b) move invite attribution to the identity platform bootstrap layer (since it runs post-actor-creation, which is the natural boundary).

---

## BEHAVIOR CONSISTENCY CHECK — auth/onboarding

```
Behavior Consistency Check — auth/onboarding
=============================================
BEHAVIOR.md present: YES (module level) — status: STUB
Feature BEHAVIOR.md: YES (auth level) — status: ACTIVE

Check A (Source without behavior):
  Controllers, hooks, DAL all present → BEHAVIOR.md present → PASS at feature level
  Module BEHAVIOR.md: STUB → FINDING: module-level behavior contract is absent

Check B (Behavior without source):
  §3 entries scanned: per feature BEHAVIOR.md §3 Happy Path 3 (auth-level)
  "completeOnboardingController writes profiles then creates actor" — SOURCE VERIFIED
  "generateUsernameDAL called via RPC" — SOURCE VERIFIED
  "refreshVcActorDirectory triggered via identity adapter" — SOURCE VERIFIED
  Entries without source: 0

Check C (§13 engine consistency):
  Declared engines: NONE in module; identity engine consumed via adapter (correct)
  Undeclared actual engine imports: 0
  Declared but unused engines: 0

Check D (§6 data change consistency):
  Declared operations: profiles upsert, vc.actors create, vc.actor_owners upsert
  Operations without DAL: 0 — all confirmed source-verified
  EXTRA: acceptVibeInviteByCodeDAL cross-feature write NOT declared in any behavior contract
```

---

## SECURITY SURFACE SUMMARY (SOURCE-VERIFIED)

| Finding ID | Severity | Surface | Status |
|---|---|---|---|
| ONBOARDING-SEC-001 | MEDIUM | profileOnboarding.controller ensureProfileShell — userId from caller, no session cross-check | OPEN |
| ONBOARDING-SEC-002 | MEDIUM | public.profiles upsert RLS unconfirmed for INSERT/UPSERT | OPEN — UNVERIFIED |
| ONBOARDING-SEC-003 | MEDIUM | useAuthOnboarding redirect path | **RESOLVED — isSafeAuthReturnPath confirmed present, source-verified** |
| NEW: ARCH-ONBOARD-001 | HIGH | onboarding.controller imports initiation/dal directly — boundary violation | NEW FINDING — this run |

### Source-Verified BLOCKED Invariants (confirmed this run)
- Session pin in completeOnboardingController: `userId !== user.id → reject` — **CONFIRMED PRESENT** (controller:72)
- profileId stripped by ActorModel before return — **CONFIRMED** (actor.model.js:8)
- isSafeAuthReturnPath uses allowlist + rejects `//` and `protocol:` — **CONFIRMED** (authInputValidation.model.js:56-64)
- createUserActorForProfile profileId===userId guard — **CONFIRMED** (createUserActor.controller.js:26)
- ActorModel omits profile_id from public return — **CONFIRMED** (actor.model.js:8-9)

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

**Reason:** All core layers are present, session pinning is confirmed, model normalization is correct, and UI states are fully handled. Primary gaps are the cross-feature DAL boundary violation (HIGH), two open MEDIUM security findings in the profile shell path, and a STUB behavior contract at the module level.

---

## RECOMMENDED HANDOFFS

| Command | Reason |
|---|---|
| ELEKTRA | Patch ONBOARDING-SEC-001 (ensureProfileShell session pin) + verify profiles RLS (ONBOARDING-SEC-002) |
| WOLVERINE | Resolve ARCH-ONBOARD-001 boundary violation — route invite attribution through initiation adapter or platform bootstrap |
| SPIDER-MAN | Verify onboarding.controller.test.js covers session mismatch, age validation, partial write failure paths |
| LOGAN | Update SECURITY.md — ONBOARDING-SEC-003 is BLOCKED (isSafeAuthReturnPath confirmed); write module BEHAVIOR.md |
| CARNAGE | Confirm profiles table RLS INSERT WITH CHECK policy for auth.uid() = id (ONBOARDING-SEC-002) |

---

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Fix cross-feature DAL import (initiation boundary) | Architecture contract violation; coupling risk on DAL changes | WOLVERINE → ELEKTRA |
| P1 | Add session pin to ensureProfileShell | Ownership gap on profile shell creation path | ELEKTRA |
| P1 | Confirm profiles table RLS for INSERT/UPSERT | DB-layer backstop unverified; must be confirmed before release | CARNAGE |
| P2 | Write module BEHAVIOR.md | Missing authoritative behavior contract for write path | LOGAN |
| P2 | Verify test coverage of onboarding.controller.test.js | Partial write failure, session mismatch, age boundary conditions untested | SPIDER-MAN |
| P3 | Document publish=true/discoverable=true as explicit business rule | Currently implicit in DAL code — no governance reference | LOGAN |
