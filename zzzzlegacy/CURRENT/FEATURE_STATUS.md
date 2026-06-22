# DEPRECATED — DO NOT READ
# Migrated to: ZZnotforproduction/GOVERNANCE/FEATURE_STATUS.md (2026-06-04)
# Dashboard modules with own security tiers are in the new file only.
# This file is preserved for historical reference — no updates will be made here.
#
# VCSM Feature Status Registry
# Ticket: LOGAN-DOCS-001
# Last Updated: 2026-06-02 (learning frozen)
# Owner: LOGAN

---

## Status Definitions

| Status | Meaning | Included in Governance? |
|---|---|---|
| `ACTIVE` | Feature is in development or production. All commands apply. | YES — full coverage |
| `PLANNED` | Feature is planned but not yet built. Architecture planning only. | PARTIAL — architecture only |
| `BLOCKED` | Feature is waiting for an external dependency before work can resume. | PARTIAL — dependency lookup only |
| `DEFERRED` | Feature work is postponed. No active sprint work. | NO — skip audits and migrations |
| `LEGACY` | Feature is historical only. No longer maintained or extended. | NO — read-only inspection only |
| `FROZEN` | Feature is intentionally paused, archived, or experimental. Excluded from all governance. | NO — immediate exclusion |

---

## Governance Inclusion Rules

### ACTIVE
- Included in: VENOM, ELEKTRA, BLACKWIDOW, ARCHITECT, KRAVEN, SENTRY, SPIDER-MAN, THOR, CARNAGE, IRONMAN, HAWKEYE, DB, LOKI, WATCHER
- Included in: triad reviews, architecture planning, migration planning, technical debt, roadmap, dashboard coverage, tab coverage, native migration planning

### PLANNED
- Included in: ARCHITECT (architecture design only)
- Excluded from: all other commands, audits, migrations, technical debt

### BLOCKED
- Included in: dependency lookup, blocker registry
- Excluded from: audits, migration planning, architecture generation, roadmap, technical debt

### DEFERRED
- Included in: REGISTRY/DEFERRED_ITEMS.md
- Excluded from: audits, migrations, architecture planning, roadmap, technical debt

### LEGACY
- Included in: read-only inspection if explicitly requested
- Excluded from: all governance commands, migrations, roadmap, technical debt

### FROZEN
- Included in: nothing, unless explicitly requested by the user in that session
- Excluded from: ALL governance commands and planning activities
- See: `FROZEN_FEATURE_CONTRACT.md` for full rule list

---

## Feature Registry

### FROZEN Features

| Feature | Source Path | Frozen Since | Reason | Record |
|---|---|---|---|---|
| `wanders` | `apps/VCSM/src/features/wanders/` | 2026-06 | Product work paused | `frozen/wanders/STATUS.md` |
| `wanderex` | `apps/VCSM/src/features/wanderex/` | 2026-06 | Product work paused | `frozen/wanderex/STATUS.md` |
| `vgrid` | `apps/VCSM/src/features/vgrid/` | 2026-06 | Product work paused | `frozen/vgrid/STATUS.md` |
| `learning` | `apps/VCSM/src/learning/` | 2026-06 | Product work paused | `frozen/learning/STATUS.md` |

---

### ACTIVE Features

| Feature | Source Path | Security Tier | Notes |
|---|---|---|---|
| `auth` | `apps/VCSM/src/features/auth/` | CRITICAL | Full auth pipeline |
| `booking` | `apps/VCSM/src/features/booking/` | CRITICAL | Open tickets: TICKET-BOOKING-RPC-001 |
| `identity` | `apps/VCSM/src/features/identity/` | CRITICAL | Actor identity resolution |
| `actors` | `apps/VCSM/src/features/actors/` | CRITICAL | Core actor system |
| `profiles` | `apps/VCSM/src/features/profiles/` | HIGH | Profile and vport kinds |
| `dashboard` | `apps/VCSM/src/features/dashboard/` | HIGH | Owner-only surfaces |
| `chat` | `apps/VCSM/src/features/chat/` | HIGH | Real-time messaging |
| `settings` | `apps/VCSM/src/features/settings/` | HIGH | Privacy, account, vports |
| `block` | `apps/VCSM/src/features/block/` | HIGH | User access control |
| `moderation` | `apps/VCSM/src/features/moderation/` | HIGH | Content safety |
| `legal` | `apps/VCSM/src/features/legal/` | HIGH | Consent, compliance |
| `public` | `apps/VCSM/src/features/public/` | HIGH | Unauthenticated surfaces |
| `post` | `apps/VCSM/src/features/post/` | MEDIUM | Social and business content |
| `feed` | `apps/VCSM/src/features/feed/` | MEDIUM | Feed composition |
| `social` | `apps/VCSM/src/features/social/` | MEDIUM | Friends, subscriptions |
| `notifications` | `apps/VCSM/src/features/notifications/` | MEDIUM | Notification pipeline |
| `upload` | `apps/VCSM/src/features/upload/` | MEDIUM | File upload |
| `invite` | `apps/VCSM/src/features/invite/` | MEDIUM | Invite codes |
| `join` | `apps/VCSM/src/features/join/` | MEDIUM | Join flow |
| `onboarding` | `apps/VCSM/src/features/onboarding/` | MEDIUM | Onboarding flow |
| `explore` | `apps/VCSM/src/features/explore/` | LOW | Discovery |
| `media` | `apps/VCSM/src/features/media/` | MEDIUM | Media handling |
| `vport` | `apps/VCSM/src/features/vport/` | HIGH | Vport core operations |
| `professional` | `apps/VCSM/src/features/professional/` | MEDIUM | Vertical market features |
| `ads` | `apps/VCSM/src/features/ads/` | LOW | Advertising system |
| `void` | `apps/VCSM/src/features/void/` | LOW | Planned future realm |
| `hydration` | `apps/VCSM/src/features/hydration/` | LOW | Actor hydration utility |
| ~~`learning`~~ | ~~`apps/VCSM/src/learning/`~~ | — | **FROZEN** — see frozen/learning/STATUS.md |

---

### PLACEHOLDER Features (no active implementation)

| Feature | Source Path | Status | Notes |
|---|---|---|---|
| `portfolio` | `apps/VCSM/src/features/portfolio/` | PLANNED | Setup hook only — real portfolio in dashboard/cards/ |
| `reviews` | `apps/VCSM/src/features/reviews/` | PLANNED | Setup hook only — real reviews in dashboard/cards/ |

---

## Updating This Registry

Only LOGAN or an explicit user instruction may change a feature's status entry.
When a status changes, update:
1. The status row in this file
2. The feature's `frozen/[feature]/STATUS.md` if applicable
3. The `FROZEN_FEATURE_CONTRACT.md` exclusion list if moving into or out of FROZEN
