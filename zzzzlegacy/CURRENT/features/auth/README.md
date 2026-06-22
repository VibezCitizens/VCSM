# Feature: auth

**Status:** ACTIVE
**Security Tier:** CRITICAL
**Source:** `apps/VCSM/src/features/auth/`
**Last audit sprint:** 2026-05-23

## What This Feature Does

The auth feature handles the full authentication lifecycle for VCSM Citizens: login via email/password, new account registration, email verification callback, password reset, and onboarding. It maintains session state via `AuthProvider` (React Context) backed by Supabase Auth, and provisions the initial actor identity for new users during onboarding.

## Governance Coverage

| Command  | Status      | Date       | Report |
|----------|-------------|------------|--------|
| VENOM    | COMPLETE    | 2026-05-11 | `2026-05-11_venom_auth-login-trust-boundaries.md` |
| VENOM    | COMPLETE    | 2026-05-14 | `2026-05-14_venom_auth-login-full-surface.md` |
| VENOM    | COMPLETE    | 2026-05-23 | `2026-05-23_14-00_venom_login-recovery-surface.md` |
| SENTRY   | COMPLETE    | 2026-05-11 | `2026-05-11_sentry_auth-login-wolverine-fixes.md` |
| DB       | NOT_STARTED | —          | — |
| LOKI     | NOT_STARTED | —          | — |
| IRONMAN  | NOT_STARTED | —          | — |
| CARNAGE  | NOT_STARTED | —          | — |
| SPIDER-MAN | NOT_STARTED | —        | — |

## Open Items

The following findings remain OPEN as of the last audit (2026-05-23). Status reflects what audit reports say — nothing is closed here that was not closed in the source files.

**From 2026-05-11 VENOM audit:**
- Finding 1 (HIGH): Raw session with `access_token` / `refresh_token` exposed in `AuthContext` — `AuthProvider.jsx:162`
- Finding 2 (HIGH): `ActorModel` exposes `profileId` as a named public field — `actor.model.js:6`
- Finding 3 (MEDIUM): Wanders Supabase client stored on `globalThis` — `wandersSupabaseClient.js:153`
- Finding 4 (MEDIUM): `dalUpdateProfileDiscoverable` — no app-layer ownership check; RLS assumed
- Finding 5 (MEDIUM): `dalCreateActorOwner` and `dalUpsertRegisterProfile` accept caller-supplied IDs with no internal ownership validation; `actor_owners` write is unguarded
- Finding 6 (MEDIUM): `error_description` URL parameter reflected as platform UI text — phishing surface
- Finding 7 (MEDIUM): `#type=recovery` hash forces recovery redirect without session verification
- Finding 8 (LOW): `authOps.controller.js` — pass-through controller creates unguarded second path to DAL writes
- Finding 9 (LOW): Full auth response (tokens) propagated through controller to hook layer
- Finding 10 (LOW): `vc.actors` RLS not verified — read by profile_id without app-layer session check

**From 2026-05-14 VENOM audit:**
- VENOM-2026-05-14-001 (HIGH): Booking source bypass — unknown `source` values skip all authorization in `createBookingController`
- VENOM-2026-05-14-002 (HIGH): Dev diagnostics screen accessible to all authenticated users with real DB write capability
- VENOM-2026-05-14-003 (HIGH): Client-controlled booking duration, label, internal note, and contact fields
- VENOM-2026-05-14-004 (MEDIUM): `ensureProfileDiscoverable` uses legacy `profileId` identity — identity contract violation
- VENOM-2026-05-14-005 (MEDIUM): `assertActorOwnsVportActor` self-check short-circuits `actor_owners` lookup
- VENOM-2026-05-14-006 (MEDIUM): `AuthProvider` reads Supabase session directly, bypassing DAL layer
- VENOM-2026-05-14-007 (MEDIUM): T6→T35 identity gap — no explicit identity loading guard in route chain
- VENOM-2026-05-14-008 (MEDIUM): `window.__sb` full Supabase client exposed when `VITE_EXPOSE_SB_CLIENT=1`
- VENOM-2026-05-14-009 (MEDIUM): Platform bootstrap silently skippable via optional chaining; errors suppressed
- VENOM-2026-05-14-010 (LOW): Auth callback `hashType` attacker-controlled — safety depends on session check remaining in place

**From 2026-05-23 VENOM audit:**
- VENOM-AUTH-004, VENOM-AUTH-005, VENOM-AUTH-007, VENOM-AUTH-008: OPEN (lower priority — see SECURITY.md)
- VENOM-AUTH-001: MITIGATED (docs corrected)
- VENOM-AUTH-002: HARDENED
- VENOM-AUTH-003: HARDENED
- VENOM-AUTH-006: HARDENED

**DB follow-ups required (not started):**
- Verify RLS on `public.profiles` for `discoverable` write path
- Verify RLS on `vc.actor_owners` insert policy
- Verify RLS on `vc.actors` read policy
