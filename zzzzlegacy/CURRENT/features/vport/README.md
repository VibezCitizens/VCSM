# vport — Governance README
# Last Updated: 2026-06-02
# Ticket: TICKET-DOCS-CLEANUP-001
# Status: CURRENT SOURCE OF TRUTH

| Field | Value |
|---|---|
| Feature | vport |
| Classification | FEATURE |
| Auth Surface | OWNER |
| Priority | P0 |
| Risk Level | HIGH |
| Governance Status | BOOTSTRAPPED |
| Last Updated | 2026-06-02 |
| Ticket | TICKET-DOCS-CLEANUP-001 |
| Gap ID | GAP-005 |

## What This Feature Does

VPORT is the core actor-based identity system for business owners on the VCSM platform. It provides the full owner management surface for all business VPORT kinds (barbershop, locksmith, restaurant/menu, gas station, exchange, and more), including bookings, team management, portfolio, schedule, content pages, services, leads, and public profile details. The vport feature is P0 foundational — all dashboard cards, profile kinds, and public booking surfaces depend on it. All write paths are CONFIG_WRITE surfaces gated behind OWNER auth with the `assertActorOwnsVportActorController` ownership primitive.

## Layer Summary

| Layer | Present | Path |
|---|---|---|
| Controllers | YES | apps/VCSM/src/features/vport/controller/ |
| DAL | YES | apps/VCSM/src/features/vport/dal/ |
| Hooks | YES | apps/VCSM/src/features/vport/hooks/ |
| Screens | YES | apps/VCSM/src/features/vport/screens/ |

The broader vport governance surface spans multiple source paths beyond the base feature path — see ARCHITECTURE.md for the full inventory covering dashboard shell, dashboard cards, VPORT kind profiles (locksmith, barbershop, restaurant/menu, gas, exchange), public menu/QR, settings, subscribers, reviews, and feed system posts.

## See Also

- [CURRENT_STATUS.md](CURRENT_STATUS.md)
- [SECURITY.md](SECURITY.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [BLOCKERS.md](BLOCKERS.md)
- [OWNERSHIP.md](OWNERSHIP.md)
- [TESTS.md](TESTS.md)
- [PERFORMANCE.md](PERFORMANCE.md)
- [DEFERRED.md](DEFERRED.md)
- [HISTORY_INDEX.md](HISTORY_INDEX.md)

## Canonical ARCHITECT Governance

ARCHITECT has extensive governance for this feature:
`zNOTFORPRODUCTION/_CANONICAL/logan/marvel/architect/VPORT/` (432 files)

DR. STRANGE: Queryable — see CURRENT/features/vport/
