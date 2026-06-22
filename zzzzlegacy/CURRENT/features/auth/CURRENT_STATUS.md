# CURRENT STATUS — auth

**Feature:** auth
**App:** VCSM
**As of:** 2026-06-02
**Propagation Ticket:** TICKET-ARCHITECT-PROPAGATION-SYNC-0001

---

## Command Coverage Status

| Command    | Status      | Notes |
|------------|-------------|-------|
| VENOM      | COMPLETE    | 3 passes: 2026-05-11 (trust boundaries), 2026-05-14 (full surface), 2026-05-23 (recovery surface + BW remediation verification) |
| SENTRY     | COMPLETE    | 2026-05-11 — post-Wolverine execution review; 5 findings confirmed resolved |
| BLACKWIDOW | PARTIAL     | BW-LOGIN-001/-002/-003 remediated per 2026-05-23 VENOM report; no direct BW audit file read in this governance pass |
| DB         | NOT_STARTED | Multiple VENOM follow-ups pending: RLS on profiles, vc.actor_owners, vc.actors |
| LOKI       | NOT_STARTED | Recommended by VENOM-2026-05-14-007 (identity gap trace) and F9 (bootstrap failure path) |
| IRONMAN    | NOT_STARTED | Recommended by VENOM-2026-05-14-002 (dev diagnostics ownership) |
| CARNAGE    | NOT_STARTED | Recommended by VENOM-2026-05-14-003 (booking schema constraints) and F4 (public.profiles RLS) |
| SPIDER-MAN | NOT_STARTED | VENOM-2026-05-14-010 calls for regression test covering hashType recovery gate |
| LOGAN      | NOT_STARTED | Multiple VENOM follow-ups: ActorModel docs, authOps.controller caller audit, auth callback security contract |
| ARCHITECT  | COMPLETE | 2026-06-02 — TICKET-AUTH-ARCHITECT-0001 / ARCHITECT_AUTH_COMPLETE; architecture file created by propagation sync |

---

## Remediation Status (as reported in audit files)

### Confirmed RESOLVED (SENTRY 2026-05-11)

| Item | Resolution |
|------|-----------|
| Cross-feature boundary violation: `register.dal.js` imported wanders client directly | RESOLVED — moved to controller via approved adapter boundary |
| Missing auth guard on `AuthPublicRoute.jsx` | RESOLVED — auth state guard redirects to `/feed` with `replace` |
| Duplicate `getSession` wrappers across 4 DAL files | RESOLVED — canonical `dalGetAuthSession()` in `authSession.read.dal.js` |
| `profile.controller.js` param renamed `profileId` → `userId` | RESOLVED |
| Arrow symbols in `WelcomeScreen.jsx` | RESOLVED |

### Confirmed HARDENED (VENOM 2026-05-23)

| Finding ID | Status |
|------------|--------|
| VENOM-AUTH-001 | MITIGATED (docs corrected) |
| VENOM-AUTH-002 | HARDENED |
| VENOM-AUTH-003 | HARDENED |
| VENOM-AUTH-006 | HARDENED |

### OPEN — Not resolved in any source file

| Finding | Severity | Priority |
|---------|----------|----------|
| ActorModel exposes `profileId` | HIGH | P1 |
| Raw session tokens in `AuthContext` | HIGH | P2 |
| Booking source bypass (`createBookingController`) | HIGH | P0 |
| Dev diagnostics accessible to all authenticated users | HIGH | P0 |
| Client-controlled booking duration/label/note | HIGH | P0 |
| `error_description` URL reflection | MEDIUM | P1 |
| `#type=recovery` hash redirect without session check | MEDIUM | P2 |
| `dalUpdateProfileDiscoverable` no ownership check | MEDIUM | P3 |
| `dalCreateActorOwner` unguarded caller-supplied IDs | MEDIUM | P3 |
| Wanders client on `globalThis` | MEDIUM | P3 |
| Legacy `profileId` identity in `ensureProfileDiscoverable` | MEDIUM | P1 |
| `assertActorOwnsVportActor` self-check bypass | MEDIUM | P1 |
| `AuthProvider` DAL bypass | MEDIUM | P1 |
| T6→T35 identity gap — no route-level guard | MEDIUM | P1 |
| `window.__sb` Supabase client on global window | MEDIUM | P1 |
| Platform bootstrap silently skippable | MEDIUM | P2 |
| `authOps.controller.js` pass-through | LOW | P4 |
| Full auth response propagated to hook | LOW | P4 |
| `vc.actors` RLS unverified | LOW | P4 |
| Auth callback hashType — no regression test | LOW | P2 |
| VENOM-AUTH-004 | OPEN | — |
| VENOM-AUTH-005 | OPEN | — |
| VENOM-AUTH-007 | OPEN | — |
| VENOM-AUTH-008 | OPEN | — |

---

## Security Tier

**CRITICAL** — auth manages session state, actor provisioning, and platform bootstrap for all VCSM users. Trust boundary spans unauthenticated visitors through authenticated Citizens and VPORT owners.

## ARCHITECT Propagation Sync — 2026-06-02

Completed audit: `TICKET-AUTH-ARCHITECT-0001`
Final verdict: `ARCHITECT_AUTH_COMPLETE`

Propagated findings:
- Source inventory: 14 controllers, 11 DALs, 9 hooks, 5 models, 9 screens, 1 relevant test.
- Architecture status: structurally complete but security-critical.
- Identity dependency risk: actor provisioning and `actorOwnerCreate` rely on caller-supplied IDs and DB/RLS assumptions.
- Boundary risk: `AuthProvider` reads Supabase session directly and exposes raw session tokens through React context.
- Test gap: auth callback/recovery and actor provisioning need regression coverage.

Recommended next command remains DB/CARNAGE for RLS and schema authority verification, followed by SPIDER-MAN.
