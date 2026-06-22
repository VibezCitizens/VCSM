# booking — README.md
# Last Updated: 2026-06-02
# Ticket: TICKET-DOCS-CLEANUP-001
# Gap ID: GAP-003
# Status: CURRENT SOURCE OF TRUTH

The booking feature is the P0 scheduling and appointment system for VPORT actors. It handles the full lifecycle of a booking: creation (customer public path and owner walk-in path), confirmation, cancellation, history retrieval, availability rule management, and resource management. It spans three tiers — feature-level controllers and DALs in `apps/VCSM/src/features/booking/`, engine-level controllers and DALs in `engines/booking/`, and dashboard-level owner controllers in `apps/VCSM/src/features/dashboard/vport/controller/`. The write surface is CRITICAL — customer_actor_id injection and status overpermission have been confirmed on the live DB and are the subject of TICKET-BOOKING-RPC-001.

**Source Path:** `apps/VCSM/src/features/booking/`
**Feature Status:** ACTIVE
**Security Tier:** CRITICAL
**Auth Surface:** OWNER (dashboard write paths) + PUBLIC (customer booking creation)
**DR. STRANGE:** Queryable — see CURRENT/features/booking/

---

## Current State

| Item | Value |
|---|---|
| Open blocker (P0) | TICKET-BOOKING-RPC-001 — customer_actor_id injection + status overpermission, DB-BLOCKED |
| THOR gate state | CAUTION CLEARED (2026-05-27) — ELEK-001 required before customer cancel sees production volume |
| Security posture | PARTIAL — multiple VENOM/ELEKTRA findings resolved; 9 open findings carry forward |
| Test coverage | BLOCKED — 7 CRITICAL + 7 HIGH findings with zero regression tests |
| Migration state | PARTIAL — bookings_insert_actor_owner live; 6 untracked live RLS policies |
| Dead code | 12 dead DALs + 8 dead controllers — DELETE CANDIDATES, not yet removed |

---

## Layer Summary

| Layer | Present | Path |
|---|---|---|
| Controllers | YES | apps/VCSM/src/features/booking/controller/ |
| DAL | YES | apps/VCSM/src/features/booking/dal/ |
| Hooks | YES | (dashboard/vport/hooks/ and profiles/kinds/vport/screens/booking/hooks/) |
| Screens | YES | apps/VCSM/src/features/dashboard/vport/screens/ and profiles/kinds/vport/screens/booking/ |
| Engine controllers | YES | engines/booking/src/controller/ |
| Adapter | YES | apps/VCSM/src/features/booking/adapters/booking.adapter.js |

---

## File Map

| File | Purpose |
|---|---|
| CURRENT_STATUS.md | Ticket state, release gates, command run history |
| ARCHITECTURE.md | Layer map, boundary rules, known violations |
| SECURITY.md | All VENOM/ELEKTRA/BLACKWIDOW findings with status |
| BLOCKERS.md | Active blockers preventing work or deployment |
| DEFERRED.md | Accepted deferred items with priority and owner |
| TESTS.md | Test coverage status and SPIDER-MAN findings |
| PERFORMANCE.md | KRAVEN findings and performance posture |
| OWNERSHIP.md | Ownership map — IRONMAN findings included |
| HISTORY_INDEX.md | Index of all HISTORY artifacts for this feature |

---

## See Also
- [CURRENT_STATUS.md](CURRENT_STATUS.md)
- [SECURITY.md](SECURITY.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [BLOCKERS.md](BLOCKERS.md)
- [DEFERRED.md](DEFERRED.md)
- [TESTS.md](TESTS.md)
- [PERFORMANCE.md](PERFORMANCE.md)
- [OWNERSHIP.md](OWNERSHIP.md)
- [HISTORY_INDEX.md](HISTORY_INDEX.md)
