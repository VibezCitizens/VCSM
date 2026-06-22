---
# invite — CURRENT_STATUS.md
# Last Updated: 2026-06-02
# Ticket: TICKET-DOCS-CLEANUP-001
# Status: CURRENT SOURCE OF TRUTH

## Feature Status

| Field | Value |
|---|---|
| Status | ACTIVE — THOR BLOCKED |
| Security Tier | HIGH |
| Auth Surface | AUTH |
| Priority | P1 |
| Risk Level | HIGH |
| Gap ID | GAP-009 |
| Last Security Audit | 2026-05-28 (ELEKTRA barber path — partial) |
| Standalone Module Last Audit | NEVER AUDITED |
| Open Security Findings | 8 OPEN (see SECURITY.md) |
| Resolved Security Findings | 7 RESOLVED |
| Open Named Tickets | NONE |
| Recommended Next Command | VENOM + ELEKTRA (scoped to `features/invite/` standalone module) |
| Last Updated | 2026-06-02 |

---

## Known Blockers

### BLOCK-INVITE-001 — ELEK-2026-05-28-025 (THOR BLOCKER)
- **Finding:** `createBarberVportAndAccept` (invite path) calls `acceptJoinResourceDAL` without ownership assertion after VPORT creation.
- **Inconsistency:** `useExistingBarberVportAndAccept` correctly calls `assertActorOwnsVportActorController` — `createBarberVportAndAccept` does not.
- **THOR status:** BLOCKED — this finding was explicitly named in the 2026-05-28 ELEKTRA THOR block report.
- **Resolution required:** Add `assertActorOwnsVportActorController` before `acceptJoinResourceDAL` call in `createBarberVportAndAccept`.

### BLOCK-INVITE-002 — Standalone module zero audit coverage (THOR BLOCKER)
- **Finding:** `features/invite/` standalone module (invite issuance, `/invite` route) has received NO security audit — VENOM, ELEKTRA, and BLACKWIDOW all NOT_STARTED.
- **THOR status:** BLOCKED — canonical module release-status.md explicitly states: "Feature is RELEASED with no coverage."
- **Resolution required:** VENOM + ELEKTRA must run on `features/invite/` before THOR can clear.

### BLOCK-INVITE-003 — ELEK-2026-05-27-005 (DB-BLOCKED)
- **Finding:** `send-citizen-invite` edge function calls `adminClient.auth.admin.listUsers()` on every invite — O(n) full user table fetch, email enumeration oracle, rate amplification risk.
- **Blocked by:** New SECURITY DEFINER RPC required — DB-level change before feature ships at scale.
- **Status:** BLOCKED / COMPLEX — explicitly deferred pending DB migration.

### BLOCK-INVITE-004 — Wildcard CORS on send-citizen-invite (OPEN)
- **Finding:** `send-citizen-invite` and all five edge functions set `"Access-Control-Allow-Origin": "*"` — any origin can trigger invite write surfaces.
- **Status:** OPEN — unresolved.

### BLOCK-INVITE-005 — findEligibleBarberActorIdsDAL uses banned legacy identity surface (ARCH VIOLATION)
- **Finding:** `findEligibleBarberActorIdsDAL` queries `vport.profile_categories` joined on `profiles.owner_user_id` — uses banned legacy identity surface for determining invite eligibility.
- **Status:** OPEN — architecture contract violation, ARCHITECT/IRONMAN handoff pending.

---

## Recommended Next Actions

1. **Run VENOM + ELEKTRA** scoped to `apps/VCSM/src/features/invite/` — required before any THOR gate attempt.
2. **Resolve ELEK-2026-05-28-025** — add `assertActorOwnsVportActorController` to `createBarberVportAndAccept`.
3. **Resolve ELEK-2026-05-28-026** — add ownership assertion to `autoResumeInviteOnboarding`.
4. **Run ARCHITECT** — determine canonical location for shared `joinInvite.dal.js` (shared between `features/invite/` and `features/join/`).
5. **Run IRONMAN** — establish full ownership map for invite feature.
6. **DB sprint** — SECURITY DEFINER RPC for `send-citizen-invite` user lookup (BLOCK-INVITE-003).

---

## Release Gate State

| Gate | Status | Blocking Finding |
|---|---|---|
| VENOM | NEVER RUN on standalone module | BLOCK-INVITE-002 |
| ELEKTRA | PARTIAL — barber/join paths only | BLOCK-INVITE-001, BLOCK-INVITE-002 |
| BLACKWIDOW | NOT RUN on invite module | — |
| SENTRY | NOT RUN | — |
| THOR | BLOCKED | BLOCK-INVITE-001 + BLOCK-INVITE-002 |

---

## Last Command Runs (invite-related)

| Command | Scope | Date | Result |
|---|---|---|---|
| VENOM | vcsm-full-deep-scan | 2026-05-10 | F-06, F-12 found — both RESOLVED |
| VENOM | vport-dashboard-team-card | 2026-05-27 | VD-02, VD-09 found — both RESOLVED |
| VENOM | external-site (send-citizen-invite) | 2026-05-27 | VENOM-EXTSITE-003, VENOM-EXTSITE-005 — OPEN |
| ELEKTRA | barber-vport-patch-advisory | 2026-05-27 | ELEK-001 RESOLVED |
| ELEKTRA | vport-dashboard-team-card | 2026-05-27 | ELEK-002 RESOLVED; ELEK-TEAM-005 OPEN |
| ELEKTRA | external-site (send-citizen-invite) | 2026-05-27 | ELEK-2026-05-27-005/006 OPEN |
| ELEKTRA | barber (join/invite paths) | 2026-05-28 | ELEK-2026-05-28-025/026 OPEN — THOR BLOCKED |
| BLACKWIDOW | vport-dashboard-team-card | 2026-05-27 | BW-TEAM-004a RESOLVED/BLOCKED |
| LOKI | barbershop-join-route-trace | 2026-05-18 | DEAD-IMPORT found (LOW) |
| IRONMAN | dashboard-team-booking-ownership | 2026-05-18 | Partial ownership map — standalone NOT covered |
| SPIDER-MAN | — | NEVER | NOT_AUDITED |
| KRAVEN | barber-locksmith-barbershop-profile | 2026-06-01 | Invite classified low risk / one-shot |

---

## DR. STRANGE Summary

The invite feature is ACTIVE but THOR-BLOCKED. Two distinct surfaces exist: the standalone
`features/invite/` module (issuance, `/invite` route) which has NEVER received a security
audit and is released to production with zero coverage; and the join/team invite paths
(`features/join/`, `features/dashboard/vport/`) which have been partially audited with
7 findings resolved and 8 open. The most critical open findings are ELEK-2026-05-28-025
(missing ownership assertion in `createBarberVportAndAccept`) and the standalone module
audit gap. VENOM + ELEKTRA must run on `features/invite/` before THOR can issue any
clearance. No formal TICKET-XXXX exists scoped to this feature — one should be opened
before the next sprint.
---
