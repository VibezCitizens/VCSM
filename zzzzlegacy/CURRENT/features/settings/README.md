# settings — README.md
# Last Updated: 2026-06-02
# Ticket: TICKET-DOCS-CLEANUP-001
# Gap ID: GAP-007
# Status: CURRENT SOURCE OF TRUTH

The settings feature is the owner-only configuration surface for VCSM actors and VPORTs. It allows authenticated owners to manage their public profile details, business card settings, directory visibility, privacy controls, account lifecycle, and social settings across four distinct controller stacks. All write paths are gated at the controller layer via `assertActorOwnsVportActorController` and backed by canonical RLS on the database. The feature is split across the `settings/` root (account, privacy, profile, vports sub-stacks) and the `dashboard/vport/dashboard/cards/settings/` card (coordinator and save hook).

**Source Path:** `apps/VCSM/src/features/settings/`
**Feature Status:** ACTIVE
**Auth Surface:** OWNER
**Security Tier:** HIGH
**DR. STRANGE:** Queryable — see CURRENT/features/settings/

---

## Layer Summary

| Layer | Present | Notes |
|---|---|---|
| Controllers | YES | Four stacks: account/, privacy/, profile/, vports/ |
| DAL | YES | vports/dal/, privacy/dal/, account/dal/ confirmed |
| Hooks | YES | vports/hooks/, dashboard card hooks, queries/ folder (dead-code status unclear) |
| Screens | YES | VportSettingsFinalScreen, VportSettingsScreen in dashboard |
| Model | YES | vportSettingsValidation.model.js, vportAboutDetails.model.js (layer violation) |

---

## File Map

| File | Purpose |
|---|---|
| CURRENT_STATUS.md | Ticket state, release gate, command run history |
| ARCHITECTURE.md | Layer map, known boundary issues, write surface register |
| SECURITY.md | VENOM / ELEKTRA / BLACKWIDOW findings and trust boundary |
| BLOCKERS.md | Open tickets, pending migrations, deployment blockers |
| DEFERRED.md | Deferred findings and follow-up items |
| OWNERSHIP.md | Ownership map from IRONMAN audit |
| TESTS.md | Test coverage status from SPIDER-MAN |
| PERFORMANCE.md | Performance status from KRAVEN |
| HISTORY_INDEX.md | Index of all audit HISTORY artifacts |

---

## See Also
- [CURRENT_STATUS.md](CURRENT_STATUS.md)
- [SECURITY.md](SECURITY.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [BLOCKERS.md](BLOCKERS.md)
- [DEFERRED.md](DEFERRED.md)
