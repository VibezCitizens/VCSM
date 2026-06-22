---
title: Onboarding Module — Behavior
status: SOURCE_VERIFIED
feature: auth
module: onboarding
source: ARCHITECT V1 manual scan (2026-06-06)
created: 2026-06-05
last-architect-run: 2026-06-06
---

# auth / modules / onboarding — BEHAVIOR

## Status

SOURCE_VERIFIED. All behaviors confirmed by direct source read 2026-06-06.

## Confirmed Behaviors (Source-Verified)

### Onboarding Form Fields
- Screen: Onboarding.jsx collects exactly 4 fields: `display_name`, `username_base`, `birthdate` (date picker, max=today), `sex` (select: Male/Female)
- No avatar field on this screen — avatar is a separate settings concern
- Submit is disabled until all 4 fields are non-empty (isValid check in useAuthOnboarding)

### Onboarding Bootstrap (on mount)
- `getOnboardingBootstrapController` called on mount
- Fetches active session; if anonymous or no session → redirect to /register or /login
- Reads `public.profiles` (id, username, birthdate) and pre-fills username_base and birthdate if present
- display_name always starts empty (not pre-filled from DB)

### Session Pin on Save
- `completeOnboardingController` re-fetches session before any write
- Checks `userId !== user.id` → returns login redirect action (does NOT write)
- This guard is present at controller:72 — CONFIRMED BLOCKED

### Write Order on Save
1. `generateUsernameDAL` — RPC generates sanitized, deduplicated username
2. `computeAgeFromBirthdateModel` — computes integer age; rejects future dates
3. `upsertCompletedOnboardingProfileDAL` — writes profile: display_name, username, birthdate, age, is_adult, sex, **publish=true, discoverable=true** (profile becomes visible at this step)
4. `createUserActorForProfile` — get-or-create actor + idempotent ownership upsert
5. Invite attribution — `acceptVibeInviteByCodeDAL` (best-effort; does not block on failure)
6. `ensureVcsmPlatformBootstrap` — platform bootstrap via identity adapter

### Post-Save Redirect (Confirmed)
- `isSafeAuthReturnPath(state.from)` — validates redirect with allowlist prefix check
- Rejects `//` (protocol-relative) and `protocol:` (absolute URLs) — CONFIRMED PRESENT
- Default redirect: `/` (fallback when state.from absent or invalid)

### Profile Visibility Set at Onboarding
- `upsertCompletedOnboardingProfileDAL` sets `publish=true` and `discoverable=true` in the same upsert
- Profile becomes discoverable immediately upon completing the onboarding form
- No separate discoverable-settings step in this flow

### Profile Shell Upsert (Registration Entry)
- `ensureProfileShell({userId, email})` in profileOnboarding.controller
- userId sourced from CALLER — no session.getUser() call inside controller
- DAL upsert has no `.eq('id', auth.uid())` filter — RLS is sole backstop
- RLS status UNVERIFIED (ONBOARDING-SEC-002)

### Invite Attribution (Best-Effort)
- After actor creation: reads `user.user_metadata.citizen_invite_code`
- If present: calls `acceptVibeInviteByCodeDAL(code, actor.id)` — fire-and-forget with `.catch()` logging to Sentry
- Invite attribution failure does NOT block onboarding completion

### Join/Barbershop Onboarding Path
- `bootstrapJoinOnboardingController` — separate path for join/invite flow
- Session pin: asserts `authedId === userId` before any write
- Skips birthdate, age, sex (not collected in join flow)
- username generated same way via generateUsernameDAL

## Resolved TODOs (from STUB)
- [x] Onboarding step list: display_name, username_base, birthdate, sex — 4 fields confirmed
- [x] ensureProfileShell userId: from CALLER — no session verification inside controller
- [x] Post-onboarding redirect: state.from validated via isSafeAuthReturnPath → CONFIRMED BLOCKED
