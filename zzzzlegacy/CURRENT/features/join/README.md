# join — README.md
# Last Updated: 2026-06-02
# Ticket: TICKET-DOCS-CLEANUP-001
# Gap ID: GAP-006
# Status: CURRENT SOURCE OF TRUTH

The join feature is the public ownership-establishment surface that allows barbers and other VPORT members to join a VPORT (currently barbershop) via QR code scan or invite token. It handles new-user signup, existing-user login, VPORT creation for new barbers, and the `acceptJoinResourceDAL` write that links a member actor to a VPORT resource slot. The route is public (`/join/barbershop/:token`) and sits outside ProtectedRoute, making it a critical trust boundary where ownership assertions must be applied at the controller layer.

**Source Path:** `apps/VCSM/src/features/join/`
**Feature Status:** ACTIVE
**Security Tier:** CRITICAL
**Auth Surface:** PUBLIC
**DR. STRANGE:** Queryable — see CURRENT/features/join/

---

## Layer Summary

| Layer | Present | Path |
|---|---|---|
| Controllers | YES | apps/VCSM/src/features/join/controllers/ |
| DAL | YES | apps/VCSM/src/features/join/dal/ |
| Hooks | YES | apps/VCSM/src/features/join/hooks/ |
| Screens | YES | (JoinBarbershopScreen.jsx, JoinLoginForm.jsx, JoinSignupForm.jsx) |
| Adapter Layer | NO | Missing — architecture gap noted |

---

## Current State

| Item | Value |
|---|---|
| Branch | vport-booking-feed-security-updates (ACTIVE) |
| THOR Gate | BLOCKED — no completed security audit at module governance level |
| Open security findings | 9 OPEN (3 HIGH, 4 MEDIUM, 2 LOW) |
| Resolved security findings | 4 RESOLVED (1 CRITICAL, 2 HIGH, 1 MEDIUM) |
| Open tickets (formal) | NONE assigned |
| Recommended command | VENOM + ELEKTRA |

---

## File Map

| File | Purpose |
|---|---|
| CURRENT_STATUS.md | Ticket state, release gates, command run history |
| ARCHITECTURE.md | Layer map, boundary issues, known gaps |
| SECURITY.md | All security findings — resolved and open |
| BLOCKERS.md | Active blockers preventing release or governance |
| DEFERRED.md | Deferred items by priority |
| HISTORY_INDEX.md | Index of all audit artifacts for this feature |
| OWNERSHIP.md | Ownership map — PARTIAL until IRONMAN runs |
| TESTS.md | Test coverage status — SPIDER-MAN not run |
| PERFORMANCE.md | Performance status — KRAVEN not run |

---

## See Also

- [CURRENT_STATUS.md](CURRENT_STATUS.md)
- [SECURITY.md](SECURITY.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [BLOCKERS.md](BLOCKERS.md)
