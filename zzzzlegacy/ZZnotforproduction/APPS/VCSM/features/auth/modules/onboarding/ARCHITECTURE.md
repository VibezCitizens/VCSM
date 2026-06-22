---
title: Onboarding Module — Architecture
status: SOURCE_VERIFIED
feature: auth
module: onboarding
source: ARCHITECT V1 manual scan — all source files read
created: 2026-06-05
last-architect-run: 2026-06-06
---

# auth / modules / onboarding — ARCHITECTURE

## Status

SOURCE_VERIFIED. Full source trace completed 2026-06-06. Full report:
`features/auth/modules/onboarding/outputs/2026/06/06/ARCHITECT/vcsm.auth.onboarding.architecture.md`

## Route

`/onboarding` — registered under `<ProtectedRoute>` in apps/VCSM/src/app/routes/index.jsx:178
Lazy-loaded from lazyPublic.jsx:49 → `import("@/features/auth/screens/Onboarding")`

## Layer Stack — Confirmed

```
Onboarding.jsx (Screen)
  └── useAuthOnboarding.js (Hook)
        ├── BOOTSTRAP: getOnboardingBootstrapController()
        │     ├── dalGetAuthSession() → supabase.auth.getSession()
        │     └── readProfileForOnboardingDAL(userId) → public.profiles (id, username, birthdate)
        └── SAVE: completeOnboardingController({userId, form, ...})
              ├── dalGetAuthSession() — SESSION RE-VERIFIED (userId === user.id check)
              ├── normalizeOnboardingFormModel(form) → onboarding.model.js
              ├── computeAgeFromBirthdateModel(birthdate) → onboarding.model.js
              ├── generateUsernameDAL() → generate_username RPC
              ├── upsertCompletedOnboardingProfileDAL() → public.profiles
              │     (display_name, username, birthdate, age, is_adult, sex,
              │      publish=true, discoverable=true)
              ├── createUserActorForProfile()
              │     ├── guard: profileId === userId (VENOM-AUTH-006)
              │     ├── dalGetActorByProfile() → vc.actors
              │     ├── dalCreateUserActor() → vc.create_actor_for_user RPC
              │     ├── dalCreateActorOwner() → vc.actor_owners (idempotent upsert)
              │     └── return ActorModel(actor) → strips profile_id ✓
              ├── acceptVibeInviteByCodeDAL() — CROSS-FEATURE DAL IMPORT (ARCH-ONBOARD-001)
              │     └── initiation/dal/vibeInvites.dal — boundary violation
              └── ensureVcsmPlatformBootstrap() → identity.adapter (correct boundary)
```

## Profile Shell Upsert (Ownership Gap — ONBOARDING-SEC-001)

```
[register callback / early onboarding entry]
  └── profileOnboarding.controller.js → ensureProfileShell({userId, email})
                                         ↑ userId from CALLER — no session cross-check CONFIRMED
        └── onboarding.dal.js → upsertProfileShellDAL({id: userId, email, ...})
                                  → public.profiles upsert (no .eq('id', auth.uid()) filter)
                                  → RLS gate UNVERIFIED (ONBOARDING-SEC-002)
```

## Security State (Source-Verified 2026-06-06)

| Finding | Status | Confirmed |
|---|---|---|
| ONBOARDING-SEC-001 — ensureProfileShell no session pin | OPEN | YES — confirmed no getUser() call inside controller |
| ONBOARDING-SEC-002 — profiles upsert RLS unconfirmed | OPEN | UNVERIFIED — DB audit needed |
| ONBOARDING-SEC-003 — open redirect in useAuthOnboarding | **RESOLVED** | isSafeAuthReturnPath confirmed present with allowlist (authInputValidation.model.js:56) |
| ARCH-ONBOARD-001 — cross-feature DAL import | NEW (this run) | initiation/dal/vibeInvites.dal imported directly at controller:13 |

## Confirmed Invariants (Source-Verified 2026-06-06)

- Session pin: `completeOnboardingController` re-fetches session and asserts `userId === user.id` at line 72 — CONFIRMED BLOCKED
- profileId stripped from actor return: `ActorModel` omits `profile_id` — CONFIRMED
- Redirect allowlist: `isSafeAuthReturnPath` rejects `//` and `protocol:` paths — CONFIRMED
- Actor creation owner-scoped: `profileId !== userId → throw` guard at createUserActor.controller:26 — CONFIRMED
- Actor creation idempotent: `dalCreateActorOwner` uses `ignoreDuplicates:true` on conflict — CONFIRMED
