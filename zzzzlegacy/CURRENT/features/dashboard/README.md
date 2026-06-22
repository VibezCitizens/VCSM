# dashboard — README.md
# Last Updated: 2026-06-04
# Ticket: TICKET-BOOKING-RPC-001
# Status: CURRENT SOURCE OF TRUTH

The dashboard feature is the owner-only VPORT management surface. Business owners manage their bookings, schedule, portfolio, team, services, menu, gas prices, exchange rates, leads, and settings through a card-based interface. It is entirely gated — no public surface.

**Source Path:** `apps/VCSM/src/features/dashboard/`
**Feature Status:** ACTIVE
**Security Tier:** HIGH
**DR. STRANGE:** Queryable — see CURRENT/features/dashboard/

---

## Current State

| Item | Value |
|---|---|
| Latest resolved ticket | TICKET-BOOKING-RPC-001 — Booking RLS policy hardening live-verified |
| Open blocker | None at P0 implementation level; THOR still blocked by SPIDER-MAN/BEHAVIOR approval/governance sign-off |
| Next recommended ticket | SPIDER-MAN booking/schedule regression coverage after RLS hardening |
| Architecture contract | CREATED — DASHBOARD_ARCHITECTURE_CONTRACT.md |
| Schedule card | COMPLIANT — coordinator pattern implemented |
| Settings card | COORDINATOR IMPLEMENTED (TICKET-0009) — SENTRY PARTIAL (TICKET-DASH-SENTRY-001) — VENOM/BLACKWIDOW complete with deferred items |
| SECURITY.md | EXISTS — dashboard triad complete; booking RLS hardening live-verified; SPIDER-MAN coverage pending |

---

## File Map

| File | Purpose |
|---|---|
| CURRENT_STATUS.md | Ticket state, release gates, command run history |
| ARCHITECTURE.md | Contract rules, coordinator pattern, card compliance inventory |
| DEFERRED.md | Open and resolved deferred items |
| BLOCKERS.md | Active blockers preventing work |
| HISTORY_INDEX.md | Index of all HISTORY artifacts for this feature |
| OWNERSHIP.md | Ownership map — PARTIAL until IRONMAN runs |
| TESTS.md | Test coverage status |
| PERFORMANCE.md | Performance status — PENDING until KRAVEN runs |
| SECURITY.md | EXISTS (TICKET-0009, TICKET-DASH-SENTRY-001) — SENTRY PARTIAL — full VENOM + BLACKWIDOW pass pending |
