# VCSM Feature Status Registry

Last Updated: 2026-06-04
Owner: LOGAN
Migrated From: zzzzlegacy/CURRENT/FEATURE_STATUS.md
Migration Ticket: TICKET-ZZ-SCANNER-MAPPED-FOLDERS-0001

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

## Security Tier Definitions

| Tier | Meaning |
|---|---|
| CRITICAL | Authentication, identity, actor system, booking engine — breach impacts all users |
| HIGH | PII exposure, financial data, owner-only access gates, access control surfaces |
| MEDIUM | Owner-managed data with no direct PII, community data, operational aggregates |
| LOW | Read-only modules, UI-only surfaces, no data access, no auth requirements |

Dashboard modules get their own tier — they do not inherit from the parent `dashboard` feature.

---

## Governance Inclusion Rules

### ACTIVE
- Included in: VENOM, ELEKTRA, BLACKWIDOW, ARCHITECT, KRAVEN, SENTRY, SPIDER-MAN, THOR, CARNAGE, IRONMAN, HAWKEYE, DB, LOKI, WATCHER
- Included in: triad reviews, architecture planning, migration planning, technical debt, roadmap, dashboard coverage

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
- See: `ZZnotforproduction/GOVERNANCE/FROZEN_FEATURE_CONTRACT.md`

---

## Feature Registry

---

### FROZEN Features

| Feature | Source Path | Frozen Since | Reason | Record |
|---|---|---|---|---|
| `wanders` | `apps/VCSM/src/features/wanders/` | 2026-06 | Product work paused | `frozen/wanders/STATUS.md` |
| `wanderex` | `apps/VCSM/src/features/wanderex/` | 2026-06 | Product work paused | `frozen/wanderex/STATUS.md` |
| `vgrid` | `apps/VCSM/src/features/vgrid/` | 2026-06 | Product work paused | `frozen/vgrid/STATUS.md` |
| `learning` | `apps/VCSM/src/learning/` | 2026-06 | Product work paused | `frozen/learning/STATUS.md` |

---

### ACTIVE Features — VCSM App

| Feature | Source Path | Doc Path | Security Tier | Notes |
|---|---|---|---|---|
| `auth` | `apps/VCSM/src/features/auth/` | `ZZnotforproduction/APPS/VCSM/features/auth/` | CRITICAL | Full auth pipeline |
| `booking` | `apps/VCSM/src/features/booking/` | `ZZnotforproduction/APPS/VCSM/features/booking/` | CRITICAL | Open: TICKET-BOOKING-RPC-001 |
| `identity` | `apps/VCSM/src/features/identity/` | `ZZnotforproduction/APPS/VCSM/features/identity/` | CRITICAL | Actor identity resolution |
| `actors` | `apps/VCSM/src/features/actors/` | `ZZnotforproduction/APPS/VCSM/features/actors/` | CRITICAL | Core actor system |
| `profiles` | `apps/VCSM/src/features/profiles/` | `ZZnotforproduction/APPS/VCSM/features/profiles/` | HIGH | Profile and vport kinds |
| `dashboard` | `apps/VCSM/src/features/dashboard/` | `ZZnotforproduction/APPS/VCSM/features/dashboard/` | HIGH | Owner-only surfaces — see dashboard modules below |
| `chat` | `apps/VCSM/src/features/chat/` | `ZZnotforproduction/APPS/VCSM/features/chat/` | HIGH | Real-time messaging |
| `settings` | `apps/VCSM/src/features/settings/` | `ZZnotforproduction/APPS/VCSM/features/settings/` | HIGH | Privacy, account, vports |
| `block` | `apps/VCSM/src/features/block/` | `ZZnotforproduction/APPS/VCSM/features/block/` | HIGH | User access control |
| `moderation` | `apps/VCSM/src/features/moderation/` | `ZZnotforproduction/APPS/VCSM/features/moderation/` | HIGH | Content safety |
| `legal` | `apps/VCSM/src/features/legal/` | `ZZnotforproduction/APPS/VCSM/features/legal/` | HIGH | Consent, compliance |
| `public` | `apps/VCSM/src/features/public/` | `ZZnotforproduction/APPS/VCSM/features/public/` | HIGH | Unauthenticated surfaces |
| `vport` | `apps/VCSM/src/features/vport/` | `ZZnotforproduction/APPS/VCSM/features/vport/` | HIGH | Vport core operations |
| `post` | `apps/VCSM/src/features/post/` | `ZZnotforproduction/APPS/VCSM/features/post/` | MEDIUM | Social and business content |
| `feed` | `apps/VCSM/src/features/feed/` | `ZZnotforproduction/APPS/VCSM/features/feed/` | MEDIUM | Feed composition |
| `social` | `apps/VCSM/src/features/social/` | `ZZnotforproduction/APPS/VCSM/features/social/` | MEDIUM | Friends, subscriptions |
| `notifications` | `apps/VCSM/src/features/notifications/` | `ZZnotforproduction/APPS/VCSM/features/notifications/` | MEDIUM | Notification pipeline |
| `upload` | `apps/VCSM/src/features/upload/` | `ZZnotforproduction/APPS/VCSM/features/upload/` | MEDIUM | File upload |
| `invite` | `apps/VCSM/src/features/invite/` | `ZZnotforproduction/APPS/VCSM/features/invite/` | MEDIUM | Invite codes |
| `join` | `apps/VCSM/src/features/join/` | `ZZnotforproduction/APPS/VCSM/features/join/` | MEDIUM | Join flow |
| `onboarding` | `apps/VCSM/src/features/onboarding/` | `ZZnotforproduction/APPS/VCSM/features/onboarding/` | MEDIUM | Onboarding flow |
| `media` | `apps/VCSM/src/features/media/` | `ZZnotforproduction/APPS/VCSM/features/media/` | MEDIUM | Media handling |
| `professional` | `apps/VCSM/src/features/professional/` | `ZZnotforproduction/APPS/VCSM/features/professional/` | MEDIUM | Vertical market features |
| `explore` | `apps/VCSM/src/features/explore/` | `ZZnotforproduction/APPS/VCSM/features/explore/` | LOW | Discovery |
| `ads` | `apps/VCSM/src/features/ads/` | `ZZnotforproduction/APPS/VCSM/features/ads/` | LOW | Advertising system |
| `void` | `apps/VCSM/src/features/void/` | `ZZnotforproduction/APPS/VCSM/features/void/` | LOW | Planned future realm |
| `hydration` | `apps/VCSM/src/features/hydration/` | `ZZnotforproduction/APPS/VCSM/features/hydration/` | LOW | Actor hydration utility |

---

### ACTIVE Dashboard Modules — Own Security Tiers

Each dashboard module has its own tier. Tier is determined by the module's data surface and auth requirements — not inherited from the parent `dashboard` feature.

| Module | Source Path | Doc Path | Security Tier | Tier Reason |
|---|---|---|---|---|
| `bookings` | `apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/` | `ZZnotforproduction/APPS/VCSM/features/dashboard/modules/bookings/` | CRITICAL | Booking records: customer PII, scheduling, payment context |
| `calendar` | `apps/VCSM/src/features/dashboard/vport/dashboard/cards/calendar/` | `ZZnotforproduction/APPS/VCSM/features/dashboard/modules/calendar/` | HIGH | Availability rules, resource scheduling, affects booking integrity |
| `leads` | `apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/` | `ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/` | HIGH | PII: name, phone, email, message from business card scans |
| `exchange` | `apps/VCSM/src/features/dashboard/vport/dashboard/cards/exchange/` | `ZZnotforproduction/APPS/VCSM/features/dashboard/modules/exchange/` | HIGH | Financial rate data, exchange transactions, pricing |
| `locksmith` | `apps/VCSM/src/features/dashboard/vport/dashboard/cards/locksmith/` | `ZZnotforproduction/APPS/VCSM/features/dashboard/modules/locksmith/` | HIGH | Service area data, security hardware, emergency job details |
| `schedule` | `apps/VCSM/src/features/dashboard/vport/dashboard/cards/schedule/` | `ZZnotforproduction/APPS/VCSM/features/dashboard/modules/schedule/` | HIGH | Availability rules, operating hours, emergency availability |
| `settings` | `apps/VCSM/src/features/dashboard/vport/dashboard/cards/settings/` | `ZZnotforproduction/APPS/VCSM/features/dashboard/modules/settings/` | HIGH | Account settings, privacy, VPORT configuration |
| `team` | `apps/VCSM/src/features/dashboard/vport/dashboard/cards/team/` | `ZZnotforproduction/APPS/VCSM/features/dashboard/modules/team/` | HIGH | Staff/team member data, barber linking, access management |
| `vport` | `apps/VCSM/src/features/dashboard/vport/` | `ZZnotforproduction/APPS/VCSM/features/dashboard/modules/vport/` | HIGH | VPORT lifecycle, identity, core configuration |
| `gasprices` | `apps/VCSM/src/features/dashboard/vport/dashboard/cards/gasprices/` | `ZZnotforproduction/APPS/VCSM/features/dashboard/modules/gasprices/` | MEDIUM | Fuel price submission/review, community data, owner moderation |
| `portfolio` | `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/` | `ZZnotforproduction/APPS/VCSM/features/dashboard/modules/portfolio/` | MEDIUM | Work samples, media — no PII, owner-only writes |
| `reviews` | `apps/VCSM/src/features/dashboard/vport/dashboard/cards/reviews/` | `ZZnotforproduction/APPS/VCSM/features/dashboard/modules/reviews/` | MEDIUM | Review management, owner responses, rating data |
| `services` | `apps/VCSM/src/features/dashboard/vport/dashboard/cards/services/` | `ZZnotforproduction/APPS/VCSM/features/dashboard/modules/services/` | MEDIUM | Service catalog: pricing, descriptions, active/inactive |
| `vportOwnerStats` | `apps/VCSM/src/features/dashboard/vport/controller/` | `ZZnotforproduction/APPS/VCSM/features/dashboard/modules/vportOwnerStats/` | MEDIUM | Operational aggregates: booking counts, staff counts — no raw PII |
| `designStudio` | `apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/` | `ZZnotforproduction/APPS/VCSM/features/dashboard/modules/designStudio/` | LOW | Design/creative tool, no PII, minimal mutations |
| `flyerBuilder` | `apps/VCSM/src/features/dashboard/flyerBuilder/` | `ZZnotforproduction/APPS/VCSM/features/dashboard/modules/flyerBuilder/` | LOW | Print/marketing tool, reads public profile data only |
| `qrcode` | `apps/VCSM/src/features/dashboard/qrcode/` | `ZZnotforproduction/APPS/VCSM/features/dashboard/modules/qrcode/` | LOW | Read-only rendering, no data access, no auth |
| `shared` | `apps/VCSM/src/features/dashboard/shared/` | `ZZnotforproduction/APPS/VCSM/features/dashboard/modules/shared/` | LOW | Single UI component (BackButton), no data access |

---

### PLACEHOLDER Features (no active implementation)

| Feature | Source Path | Status | Notes |
|---|---|---|---|
| `portfolio` | `apps/VCSM/src/features/portfolio/` | PLANNED | Setup/config only — real portfolio lives in `dashboard/modules/portfolio` |
| `reviews` | `apps/VCSM/src/features/reviews/` | PLANNED | Setup hook only — real reviews live in `dashboard/modules/reviews` |

---

## Updating This Registry

Only LOGAN or an explicit user instruction may change a feature's status or tier entry.

When a status changes, update:
1. The status row in this file
2. The feature's `frozen/[feature]/STATUS.md` if applicable
3. The `FROZEN_FEATURE_CONTRACT.md` exclusion list if moving into or out of FROZEN

When a tier changes:
1. Update the tier column in the relevant section
2. Add a note with the reason and date
3. Any open THOR gates affected by the tier change must be re-evaluated
