# SECURITY — auth

**Feature:** auth
**Security Tier:** CRITICAL
**Last VENOM pass:** 2026-05-23
**Auditors:** VENOM (x3), SENTRY (x1), BLACKWIDOW (partial — BW-LOGIN-001/-002/-003 per VENOM 2026-05-23)

---

## Trust Boundary

```
Client input:          email, password, birthdate, displayName, username, sex (forms)
                       ?code= / #access_token= / #type=recovery (URL params)
Validated at:          Controllers (email normalization, password rules, session re-fetch)
Identity resolved at:  dalGetAuthSession() — session user.id sourced from Supabase JWT
Authorization:         Route guards (AuthPublicRoute, ProtectedRoute), controller session re-reads
Sensitive objects:     access_token, refresh_token, user.email, user.id, actor_owners entries
                       recovery codes, birthdate, is_adult flag
```

---

## VENOM Audit — 2026-05-11 (trust boundaries)

**Scope:** login, register, callback, onboarding, password-reset
**Files inspected:** 24 | Findings: 10 (2 HIGH, 5 MEDIUM, 3 LOW)
**Blocking issues:** 0

### Findings

| ID | Severity | Status | Location | Summary |
|----|----------|--------|----------|---------|
| Finding 1 | HIGH | OPEN | `AuthProvider.jsx:162` | Raw `session` object (including `access_token`, `refresh_token`) in `AuthContext` — any component calling `useAuth()` can access tokens |
| Finding 2 | HIGH | OPEN | `actor.model.js:6` | `ActorModel` returns `profileId` as named public field — identity contract violation; profileId propagates to hooks and potentially UI |
| Finding 3 | MEDIUM | OPEN | `wandersSupabaseClient.js:153` | Auth client singleton stored on `globalThis` (`window.__WANDERS_SB__`) — accessible from any JS on same origin |
| Finding 4 | MEDIUM | OPEN | `profile.dal.js:14` | `dalUpdateProfileDiscoverable` — no app-layer ownership check; RLS assumed but unverified |
| Finding 5 | MEDIUM | OPEN | `register.dal.js:34`, `actorOwnerCreate.dal.js:3` | Write DALs accept caller-supplied IDs with no internal ownership validation; `actor_owners` write is unguarded |
| Finding 6 | MEDIUM | OPEN | `authCallback.controller.js:32` | `error_description` URL param reflected as platform UI text — phishing surface |
| Finding 7 | MEDIUM | OPEN | `authCallback.controller.js:40` | `#type=recovery` hash triggers recovery redirect without verifying a valid session exists |
| Finding 8 | LOW | OPEN | `authOps.controller.js` | Pass-through controller — second unguarded code path to DAL writes; should be deleted if unused |
| Finding 9 | LOW | OPEN | `login.dal.js:3`, `login.controller.js:7` | Full auth response (tokens) propagated to hook layer beyond what callers need |
| Finding 10 | LOW | OPEN | `actorGetByProfile.dal.js` | `vc.actors` lookup by `profile_id` — RLS not verified; potential enumeration surface |

**Identity Surface Warnings (ISW):**
- ISW-1: `actor.model.js` — `profileId` returned as named field; violates identity contract
- ISW-2: `actorGetByProfile.dal.js` — `profile_id` returned in DAL result and re-exposed as `profileId` via ActorModel

**RLS assumptions flagged:** 4 (Findings 4, 5, 10 + actor read path) — DB verification not yet performed

---

## VENOM Audit — 2026-05-14 (full surface)

**Scope:** auth-login + booking trust + dev diagnostics surface
**Findings:** 3 HIGH, 5 MEDIUM, 3 LOW
**P0 blockers confirmed at time of audit:**

| Finding ID | Severity | Status | Location | Summary |
|------------|----------|--------|----------|---------|
| VENOM-2026-05-14-001 | HIGH | OPEN | `createBooking.controller.js:54–77` | Booking source bypass — unknown `source` string values skip all authorization; booking inserted unconditionally |
| VENOM-2026-05-14-002 | HIGH | OPEN | `lazyApp.jsx:3–4`, `app.routes.jsx:163–165` | Dev diagnostics screen accessible to all authenticated users; runs real DB write operations (block/unblock, UPSERT to `vc.actor_follows`, `vc.friend_ranks`) |
| VENOM-2026-05-14-003 | HIGH | OPEN | `createBooking.controller.js:84–103` | Client-controlled booking data — `durationMinutes`, `serviceLabelSnapshot`, `internalNote`, `customerPhone`, `customerEmail` trusted from caller without server-side validation |
| VENOM-2026-05-14-004 | MEDIUM | OPEN | `profile.controller.js:8–24`, `profile.dal.js:3–28` | Legacy `profileId` identity in login-critical path — identity contract violation; bypasses actor ownership chain |
| VENOM-2026-05-14-005 | MEDIUM | OPEN | `assertActorOwnsVportActor.controller.js:15–16` | Self-check short-circuits `actor_owners` lookup when `requestActorId === targetActorId` — latent ownership bypass |
| VENOM-2026-05-14-006 | MEDIUM | OPEN | `AuthProvider.jsx:37, 57` | `AuthProvider` calls Supabase auth APIs directly, bypassing DAL layer — split session access path |
| VENOM-2026-05-14-007 | MEDIUM | OPEN | Route chain: `ProtectedRoute` → `RootLayout` | T6→T35 identity gap (200–1500ms) — no explicit `identityLoading` guard in route chain; implicit safety only |
| VENOM-2026-05-14-008 | MEDIUM | OPEN | `supabaseClient.js:37–38` | `window.__sb` full Supabase client attached to window when `VITE_EXPOSE_SB_CLIENT=1` in DEV mode |
| VENOM-2026-05-14-009 | MEDIUM | OPEN | `onboarding.controller.js:104–127` | Platform bootstrap silently skippable via optional chaining on `ensureVcsmPlatformBootstrap`; errors suppressed with `.catch(() => {})` |
| VENOM-2026-05-14-010 | LOW | OPEN | `authCallback.controller.js:13–14, 49` | `hashType` attacker-controllable — currently handled correctly but safety depends on session check remaining; no regression test |

---

## VENOM Audit — 2026-05-23 (login/recovery surface)

**Scope:** Full auth/login/recovery surface — post-BlackWidow BW-LOGIN-001/-002/-003 remediation verification
**Findings:** 2 HIGH, 3 MEDIUM, 3 LOW, 2 INFO

**Remediation status as reported in audit file:**

| Finding ID | Status as of 2026-05-23 |
|------------|------------------------|
| VENOM-AUTH-001 | MITIGATED — docs corrected |
| VENOM-AUTH-002 | HARDENED |
| VENOM-AUTH-003 | HARDENED |
| VENOM-AUTH-006 | HARDENED |
| VENOM-AUTH-004 | OPEN |
| VENOM-AUTH-005 | OPEN |
| VENOM-AUTH-007 | OPEN |
| VENOM-AUTH-008 | OPEN |

Note: Full finding detail for VENOM-AUTH-004/005/007/008 is in the source report. Only the first 80 lines of the 2026-05-23 report were available to this governance pass.

---

## SENTRY Review — 2026-05-11

**Status:** PASS with 2 advisory notes
**Verdict:** No blocking violations. No architectural contract breaches. All 5 Wolverine findings confirmed resolved.

**Advisory notes (from SENTRY):**
- Route loop risk: If `AuthPublicRoute` wraps `/feed`, a loop would occur — routing config must ensure `/feed` is not wrapped in `AuthPublicRoute`
- `register.controller.js` uses adapter import pattern — correct per VCSM Architecture Contract §5.4

---

## Debug Leakage Status

Per VENOM 2026-05-11 review:
- `@debuggers/identity` — PRODUCTION SAFE (no-ops in production build)
- `appendIOSProdDebugLog` — PRODUCTION SAFE (no-op when `IS_PROD=true`)
- Residual: In non-production deployments, auth telemetry including `userId` and `hasSession` written to `sessionStorage` under `__vcsm_ios_dbg_logs` — acceptable for dev/staging

---

## Open DB Verification Tasks

These were flagged by VENOM but DB command has not run against this feature:

| Task | Source Finding |
|------|---------------|
| Verify RLS on `public.profiles` — `discoverable` write path enforces `auth.uid() = id` | Finding 4 (2026-05-11) |
| Verify RLS on `vc.actor_owners` — insert enforces `user_id = auth.uid()` | Finding 5 (2026-05-11) |
| Verify RLS on `vc.actors` — read policy restricts access appropriately | Finding 10 (2026-05-11) |
| Verify RLS on `vc.bookings` — independently enforces ownership | VENOM-2026-05-14-001 |
| Verify diagnostics DAL reads have RLS coverage | VENOM-2026-05-14-002 |
