# invite — README.md
# Last Updated: 2026-06-02
# Ticket: TICKET-DOCS-CLEANUP-001
# Gap ID: GAP-009
# Status: CURRENT SOURCE OF TRUTH

The invite feature governs the full lifecycle of invite issuance and acceptance across
two surfaces: the standalone `/invite` route (sending invites to citizens or barbers)
and the `/join/barbershop/:token` route (barber onboarding via QR code or invite link).
It includes team invite accept/decline on the dashboard team card (barbershop sends
invite to barber, barber accepts or declines). Invite token issuance is security-critical
— tokens grant access to barbershop resources and must be protected by ownership gates
at every write point.

**Source Path:** `apps/VCSM/src/features/invite/`
**Feature Status:** ACTIVE
**Security Tier:** HIGH
**Auth Surface:** AUTH
**Risk Level:** HIGH
**Priority:** P1
**DR. STRANGE:** Queryable — see CURRENT/features/invite/

---

## Layer Summary

| Layer | Present | Notes |
|---|---|---|
| Controllers | YES | `apps/VCSM/src/features/invite/invite.controller.js` — may be stale post-refactor |
| DAL | YES | `apps/VCSM/src/features/invite/invite.dal.js` — may be stale post-refactor |
| Hooks | YES | `apps/VCSM/src/features/invite/useInvite.js` |
| Screens | YES | `InviteScreen.jsx`, `InviteView.jsx`, `InviteView.styles.js` |
| Adapter/Index | NO | Flagged as gap — no public adapter boundary |

Join/acceptance path shares DAL with `features/join/`:
- `apps/VCSM/src/features/join/dal/joinInvite.dal.js`
- `apps/VCSM/src/features/join/controllers/joinBarbershopAccount.controller.js`
- `apps/VCSM/src/features/join/controllers/joinBarbershopQr.controller.js`
- `apps/VCSM/src/features/join/hooks/useJoinBarbershop.js`

Dashboard team invite surface lives in `features/dashboard/vport/`.

---

## Current State Summary

| Item | Value |
|---|---|
| THOR gate | BLOCKED — two open ELEK findings + zero audit on standalone module |
| VENOM | NOT RUN on `features/invite/` standalone module |
| ELEKTRA | PARTIAL — team/join paths audited; standalone module NOT audited |
| Open security findings | 8 OPEN (3 HIGH, 2 MEDIUM, 1 CRITICAL deferred, 2 cross-reference duplicates) |
| Resolved security findings | 7 RESOLVED |
| Open tickets | NONE formally scoped to invite |
| Recommended next | VENOM + ELEKTRA on `features/invite/` — mandatory before THOR clearance |

---

## File Map

| File | Purpose |
|---|---|
| CURRENT_STATUS.md | Ticket state, release gates, command run history |
| ARCHITECTURE.md | Layer map, file inventory, known boundary issues |
| DEFERRED.md | Open and resolved deferred items |
| BLOCKERS.md | Active blockers preventing work or release |
| HISTORY_INDEX.md | Index of all HISTORY artifacts for this feature |
| OWNERSHIP.md | Ownership map — PARTIAL until IRONMAN runs on standalone module |
| TESTS.md | Test coverage status |
| PERFORMANCE.md | Performance status — PARTIAL KRAVEN evidence |
| SECURITY.md | Security findings from VENOM + ELEKTRA + BLACKWIDOW audits |

---

## See Also

- [CURRENT_STATUS.md](CURRENT_STATUS.md)
- [SECURITY.md](SECURITY.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [BLOCKERS.md](BLOCKERS.md)
- [DEFERRED.md](DEFERRED.md)
