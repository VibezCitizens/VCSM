# public — README.md
# Last Updated: 2026-06-02
# Ticket: TICKET-DOCS-CLEANUP-001
# Gap ID: GAP-008
# Status: CURRENT SOURCE OF TRUTH

The public feature is the unauthenticated VPORT discovery and lead-capture surface. It comprises two full-MVC sub-modules: vportMenu (exposes menu, pricing, availability, and reviews to any visitor via slug-based routes and QR scan paths) and vportBusinessCard (exposes VPORT profile, contact details, services, and branding, and accepts lead submissions). Both sub-modules are released and actively serving traffic with zero security audit coverage on record.

**Source Path:** `apps/VCSM/src/features/public/`
**Feature Status:** ACTIVE
**Security Tier:** HIGH
**Auth Surface:** PUBLIC — no authentication required on any route
**DR. STRANGE:** Queryable — see CURRENT/features/public/

---

## Layer Summary

| Layer | Present | Notes |
|---|---|---|
| Controllers | YES | vportBusinessCard/controller/, vportMenu/controller/ |
| DAL | YES | vportBusinessCard/dal/, vportMenu/dal/ |
| Hooks | YES | vportBusinessCard/hooks/, vportMenu/hooks/ |
| Screens | YES | vportBusinessCard/screen/, vportMenu/screens/ |
| Models | YES | vportBusinessCard/model/, vportMenu/models/ |
| Components | YES | vportMenu/components/ |
| Views | YES | vportMenu/views/ |

---

## Current State

| Item | Value |
|---|---|
| Latest resolved ticket | NONE — feature has no governance ticket history |
| Open security blockers | 11 open items (see BLOCKERS.md) |
| Recommended next command | VENOM + ELEKTRA |
| THOR release gate | BLOCKED — vportMenu and vportBusinessCard both unaudited |
| SECURITY.md | SEEDED — evidence-backed, full audit PENDING |

---

## File Map

| File | Purpose |
|---|---|
| CURRENT_STATUS.md | Ticket state, release gates, command run history |
| ARCHITECTURE.md | Module structure, layer inventory, known violations |
| SECURITY.md | Security findings register — evidence-backed |
| BLOCKERS.md | Active blockers preventing work or release |
| DEFERRED.md | Open and resolved deferred items |
| OWNERSHIP.md | Ownership map — NOT_AUDITED until IRONMAN runs |
| TESTS.md | Test coverage status — NOT_AUDITED until SPIDER-MAN runs |
| PERFORMANCE.md | Performance status — NOT_AUDITED until KRAVEN runs |
| HISTORY_INDEX.md | Index of all HISTORY artifacts for this feature |

---

## See Also
- [CURRENT_STATUS.md](CURRENT_STATUS.md)
- [SECURITY.md](SECURITY.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [BLOCKERS.md](BLOCKERS.md)
