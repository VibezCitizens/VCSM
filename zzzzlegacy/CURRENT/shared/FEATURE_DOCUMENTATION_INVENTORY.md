# FEATURE_DOCUMENTATION_INVENTORY.md
# Ticket: DOCS-ORG-001
# Phase 3 — Real Feature Inventory with Current Documentation Coverage
# Date: 2026-06-02
# Status: READ-ONLY PLANNING — No files modified

---

## COVERAGE LEGEND

| Symbol | Meaning |
|---|---|
| FULL | Canonical spec exists + audit history present |
| PARTIAL | Audit history only — no canonical source-of-truth spec |
| SPARSE | Mentioned in audits but not deeply documented |
| NONE | No documentation found in zNOTFORPRODUCTION at all |
| PHANTOM | Empty placeholder folders signal intent with no content |

---

## TIER 1 — LARGE / CRITICAL FEATURES (>100 source files)

### 1. profiles
- **Source Path:** `apps/VCSM/src/features/profiles/`
- **Source Files:** ~374
- **Internal Structure:** adapters, config, controller, dal, debug, hooks, kinds, model, screens, styles, ui
- **Key Subsystem:** `kinds/vport/` — 120+ files (owner screens, controller, dal)
- **Public Surface:** Profile viewing screens for all user types
- **Owner Surface:** vport edit/manage screens, owner-only controller actions
- **DAL:** Yes — friends, photos, posts, tags
- **Controllers:** Yes — friends, photos, posts, tags
- **Security Sensitivity:** HIGH — actor identity, profile ownership, photo access
- **Ownership Sensitivity:** HIGH — profile creation/modification, friend management
- **Current Documentation Coverage:** PARTIAL
  - `_CANONICAL/logan/vcsm/profiles/` — has audit (phase3e), but no canonical spec file
  - `_CANONICAL/logan/vcsm/identity/` — identity overlap (13 files, auth pipeline)
  - Multiple audit mentions in security/, compliance/, ownership/
  - No single `vcsm.profiles.pipeline.md` equivalent of booking spec
- **Documentation Gap:** Missing canonical feature spec
- **Recommended Feature Folder:** `CURRENT/features/profiles/`

---

### 2. dashboard
- **Source Path:** `apps/VCSM/src/features/dashboard/`
- **Source Files:** ~238
- **Internal Structure:** flyerBuilder (designStudio, printableQr), qrcode, shared, vport (extensive card system)
- **Key Subsystem:** `vport/dashboard/cards/` — bookings, calendar, exchange, gasprices, leads, locksmith, portfolio, reviews, schedule, services, settings, team
- **Public Surface:** None — entirely owner-only
- **Owner Surface:** Full vport owner dashboard with 12+ cards
- **DAL:** Yes — `vport/dal/read/`, `vport/dal/write/` with tests
- **Controllers:** Yes — extensive per card
- **Security Sensitivity:** HIGH — owner-gated, business data access
- **Ownership Sensitivity:** CRITICAL — all operations are owner-scoped
- **Current Documentation Coverage:** PARTIAL
  - `_CANONICAL/logan/marvel/architect/VPORT/DASHBOARD/` — architect scan output (in marvel/, not vcsm/)
  - `CURRENT/features/dashboard/evidence/2026-05-18_ironman_dashboard-team-booking-ownership.md`
  - `_HISTORY/session-summaries/2026-05-18_cerebro-dashboard-dal-booking-governance-closure.md`
  - No canonical dashboard spec
- **Documentation Gap:** No canonical spec; architect scan is in wrong location
- **Recommended Feature Folder:** `CURRENT/features/dashboard/`

---

### 3. post
- **Source Path:** `apps/VCSM/src/features/post/`
- **Source Files:** ~116
- **Internal Structure:** adapters, commentcard, postcard (with postModules), screens, styles
- **Key Subsystem:** `postcard/postModules/` — barbershopHours, barbershopPortfolio, exchangeRates, fuelPrices, locksmithHours, locksmithPortfolio, locksmithServiceArea, menuDrop
- **Public Surface:** Post and comment viewing
- **Owner Surface:** Post creation/editing, module management
- **DAL:** Yes — postcard/dal/, commentcard/dal/
- **Controllers:** Yes — postcard, commentcard
- **Security Sensitivity:** MEDIUM — content moderation, module access
- **Ownership Sensitivity:** HIGH — post creation is owner-scoped, module content is business-sensitive
- **Current Documentation Coverage:** PARTIAL
  - `_CANONICAL/logan/vcsm/feed/` — feed pipeline docs (post delivery, not creation)
  - `_CANONICAL/logan/marvel/post-system/` — 12 post feature deep dives (in marvel/, not vcsm/)
  - `_ACTIVE/audits/` — scattered mentions in security and compliance
  - No canonical post pipeline spec separate from feed
- **Documentation Gap:** Post creation pipeline undocumented canonically; post-system docs in wrong location
- **Recommended Feature Folder:** `CURRENT/features/post/`

---

### 4. wanders
- **Source Path:** `apps/VCSM/src/features/wanders/`
- **Source Files:** ~124
- **Internal Structure:** adapters, components, cardstemplates (lovedrop, mothersday, photo, teacherappreciation), controllers, core, dal, hooks, lib, model, models, screens, services, utils
- **Key Subsystem:** `core/` — adapters, controllers, dal (read, rpc, write), hooks (mailboxExperience), model
- **Public Surface:** Viewing received wanders
- **Owner Surface:** Sending/creating wanders, managing mailbox
- **DAL:** Yes — comprehensive, uses RPC
- **Controllers:** Yes — core and feature-level
- **Security Sensitivity:** MEDIUM — private messaging, recipient validation
- **Ownership Sensitivity:** MEDIUM — users send to recipients
- **Current Documentation Coverage:** SPARSE
  - `_CANONICAL/logan/vcsm/wanders/` — async card messaging system doc (exists)
  - No audit trail found in security, compliance, or release folders
  - No test coverage audit
- **Documentation Gap:** Minimal audit coverage; canonical spec may exist but not audited
- **Recommended Feature Folder:** `CURRENT/features/wanders/`

---

### 5. auth
- **Source Path:** `apps/VCSM/src/features/auth/`
- **Source Files:** ~56
- **Internal Structure:** adapters, components, controllers, dal, hooks, model, screens (9), styles, ui, usecases
- **Key Screens:** LoginScreen, RegisterScreen, ResetPasswordScreen, ForgotPasswordScreen, AuthCallbackScreen, VerifyEmailRequiredScreen, WelcomeScreen, Onboarding, CompleteProfileGate
- **Public Surface:** Login, registration, callbacks — all unauthenticated
- **Owner Surface:** N/A — auth is pre-identity
- **DAL:** Yes — authentication and session data
- **Security Sensitivity:** CRITICAL — all authentication flows, token management, OAuth
- **Ownership Sensitivity:** HIGH — account creation
- **Current Documentation Coverage:** FULL
  - `_CANONICAL/logan/vcsm/identity/` — 13 files: auth pipeline, login, actor switch, hydration, vport creation, account settings, soft delete, access block
  - `CURRENT/features/dashboard/evidence/` — multiple VENOM/ELEKTRA auth surface audits
  - `CURRENT/features/dashboard/evidence/` — contract reviews for auth surfaces
  - Phase 3a identity drift audit
- **Documentation Gap:** Onboarding flow may not be fully documented; OAuth callback spec unclear
- **Recommended Feature Folder:** `CURRENT/features/auth/`

---

### 6. booking
- **Source Path:** `apps/VCSM/src/features/booking/`
- **Source Files:** ~66
- **Internal Structure:** adapters, components, controller, dal, hooks, model, screens
- **Key Controllers:** assertActorOwnsVportActor, bookingServices, cancelBooking, confirmBooking, createBooking, ensureOwnerBookingResource, getBookingServiceProfiles, getResourceAvailability, listMyBookings, listOwnerBookingResources, resolveVportProfileId, setAvailabilityException, setAvailabilityRule, setResourceSlotDuration
- **Public Surface:** Browse booking availability (unauthenticated)
- **Owner Surface:** CRITICAL — all create/manage operations
- **DAL:** Yes — booking records, availability, resources
- **Security Sensitivity:** CRITICAL — ownership assertions, state machine, payment-adjacent
- **Ownership Sensitivity:** CRITICAL — `assertActorOwnsVportActor` + `ensureOwnerBookingResource`
- **Current Documentation Coverage:** FULL (over-documented, no synthesis)
  - `_CANONICAL/logan/vcsm/booking/vcsm.booking.pipeline.md` — authoritative spec
  - `_CANONICAL/logan/engines/engines.booking.contract.md` — engine contract
  - `_CANONICAL/logan/vcsm/dal/vcsm.dal.booking.md` — DAL specification
  - 35+ audit files across all command categories
- **Documentation Gap:** No single "current security status of booking" synthesis document
- **Recommended Feature Folder:** `CURRENT/features/booking/`

---

### 7. chat
- **Source Path:** `apps/VCSM/src/features/chat/`
- **Source Files:** ~66
- **Internal Structure:** adapters, conversation (components, controller, dal, hooks/realtime, layout, lib, permissions, screen), inbox (components, constants, controller, dal, hooks, lib, model, screens/settings), start, debug, store, styles
- **Public Surface:** None — authenticated only
- **Owner Surface:** Inbox management, conversation settings, blocking
- **DAL:** Yes — conversation/dal/, inbox/dal/
- **Controllers:** Yes — conversation and inbox controllers
- **Security Sensitivity:** HIGH — private messages, permissions, blocking
- **Ownership Sensitivity:** HIGH — inbox management
- **Current Documentation Coverage:** FULL
  - `_CANONICAL/logan/vcsm/chat/` — runtime pipeline, badge pipeline, notification pipeline, migration status
  - Audit history across security and compliance
  - Engine contracts in engines/
- **Documentation Gap:** Migration status may be stale (chat migrated in April 2026)
- **Recommended Feature Folder:** `CURRENT/features/chat/`

---

### 8. settings
- **Source Path:** `apps/VCSM/src/features/settings/`
- **Source Files:** ~92
- **Internal Structure:** account, adapters, privacy, profile, sponsored, vports, queries, screen, styles, ui
- **Key Subsystems:** account (controller, dal, hooks, ui), privacy (controller, dal, hooks, models, ui), profile (adapter, controller, dal, hooks, model, ui), vports (controller, dal, hooks, model, ui)
- **Public Surface:** None
- **Owner Surface:** All — privacy, profile, vport, account management
- **DAL:** Yes — account, privacy, profile, vports
- **Security Sensitivity:** HIGH — privacy controls, account deletion, data access
- **Ownership Sensitivity:** HIGH — all self-scoped mutations
- **Current Documentation Coverage:** SPARSE
  - `_CANONICAL/logan/vcsm/identity/` — account settings mentioned
  - No standalone settings feature spec
  - Diagnostic groups in dev/ suggest active diagnostics coverage
- **Documentation Gap:** No canonical settings spec; privacy controls underdocumented
- **Recommended Feature Folder:** `CURRENT/features/settings/`

---

## TIER 2 — MEDIUM FEATURES (30–100 source files)

### 9. notifications
- **Source Path:** `apps/VCSM/src/features/notifications/`
- **Source Files:** ~43
- **Internal Structure:** adapters, inbox, runtime, screen, styles, types (booking, comment, follow, mention, reaction, review, team)
- **Security Sensitivity:** MEDIUM — notification content, recipient validation
- **Current Documentation Coverage:** FULL
  - `_CANONICAL/logan/vcsm/notifications/` — notification pipeline, coverage audit
  - Audit mentions in security and compliance
- **Recommended Feature Folder:** `CURRENT/features/notifications/`

---

### 10. public (unauthenticated Vport surfaces)
- **Source Path:** `apps/VCSM/src/features/public/`
- **Source Files:** ~64
- **Internal Structure:** screens, vportBusinessCard (controller, dal, hooks, model, screen, view), vportMenu (adapters, components, controller, dal, hooks, model, screen, view)
- **Public Surface:** ENTIRELY PUBLIC — no auth required; business cards and menus
- **Security Sensitivity:** HIGH — unauthenticated surface, must never expose owner data
- **Current Documentation Coverage:** PARTIAL
  - `_CANONICAL/logan/vcsm/public/` — SEO infrastructure, conversion funnel
  - `_CANONICAL/logan/vports/` — vport business card and menu docs
  - Audit mentions in security
- **Recommended Feature Folder:** `CURRENT/features/public/`

---

### 11. feed
- **Source Path:** `apps/VCSM/src/features/feed/`
- **Source Files:** ~46
- **Internal Structure:** adapters, components, controllers, dal, hooks, model, pipeline, queries, screens
- **Security Sensitivity:** MEDIUM — feed composition, RLS filtering
- **Current Documentation Coverage:** FULL
  - `_CANONICAL/logan/vcsm/feed/` — post pipeline, profiler system
  - Multiple audit files across security and compliance
  - `_CANONICAL/logan/marvel/post-system/` — 12 deep-dive files (wrong location)
- **Recommended Feature Folder:** `CURRENT/features/feed/`

---

### 12. social
- **Source Path:** `apps/VCSM/src/features/social/`
- **Source Files:** ~44
- **Internal Structure:** adapters (friend/request, friend/subscribe, privacy), friend (request, subscribe), privacy
- **Security Sensitivity:** MEDIUM — friend requests, privacy visibility
- **Current Documentation Coverage:** FULL
  - `_CANONICAL/logan/vcsm/social/` — subscribe architecture (actor pair matrix, RPC audit, visibility model)
  - Audit mentions in compliance and runtime
- **Recommended Feature Folder:** `CURRENT/features/social/`

---

### 13. moderation
- **Source Path:** `apps/VCSM/src/features/moderation/`
- **Source Files:** ~35
- **Internal Structure:** adapters, components, controllers, dal, hooks, models, types
- **Security Sensitivity:** HIGH — content safety, admin operations
- **Current Documentation Coverage:** SPARSE
  - `_CANONICAL/logan/vcsm/moderation/` — block pipeline
  - `_ACTIVE/audits/moderation/` — 1 file
  - No comprehensive moderation spec
- **Recommended Feature Folder:** `CURRENT/features/moderation/`

---

### 14. professional
- **Source Path:** `apps/VCSM/src/features/professional/`
- **Source Files:** ~33
- **Internal Structure:** briefings, core, enterprise, professional-nurse, screens
- **Security Sensitivity:** MEDIUM — vertical market data, briefing content
- **Current Documentation Coverage:** NONE
  - No canonical doc found
  - No audit history found
- **Recommended Feature Folder:** `CURRENT/features/professional/`

---

### 15. upload
- **Source Path:** `apps/VCSM/src/features/upload/`
- **Source Files:** ~38
- **Internal Structure:** adapters, api, controller, controllers, dal, hooks, lib, model, screens, styles, ui
- **Security Sensitivity:** MEDIUM — file validation, storage access
- **Current Documentation Coverage:** SPARSE
  - `_CANONICAL/logan/vcsm/upload/` — remote consistency doc
  - `_BACKUPS/upload_writeback_debug_20260430-220835/` — debug artifact (not docs)
- **Recommended Feature Folder:** `CURRENT/features/upload/`

---

### 16. legal
- **Source Path:** `apps/VCSM/src/features/legal/`
- **Source Files:** ~26
- **Internal Structure:** adapters, config, controllers, dal, docs, engine, hooks, screens, styles
- **Security Sensitivity:** HIGH — consent, versioning, compliance
- **Current Documentation Coverage:** PARTIAL
  - `_CANONICAL/legal/` — consent system, automation scripts (2 files)
  - `_ACTIVE/audits/ip-safety/` — 1 IP/legal compliance check
- **Recommended Feature Folder:** `CURRENT/features/legal/`

---

### 17. explore
- **Source Path:** `apps/VCSM/src/features/explore/`
- **Source Files:** ~22
- **Internal Structure:** controller, dal, hooks, model, screens, styles, ui, usecases
- **Security Sensitivity:** LOW — read-only discovery
- **Current Documentation Coverage:** SPARSE
  - `_CANONICAL/logan/vcsm/explore/` — search pipeline
  - No audit history
- **Recommended Feature Folder:** `CURRENT/features/explore/`

---

## TIER 3 — SMALL FEATURES (1–30 source files)

| # | Feature | Source Path | Files | Security | Doc Coverage | Recommended Folder |
|---|---|---|---|---|---|---|
| 18 | wanderex | features/wanderex/ | ~22 | LOW | NONE | `CURRENT/features/wanderex/` |
| 19 | ads | features/ads/ | ~18 | LOW | NONE | `CURRENT/features/ads/` |
| 20 | block | features/block/ | ~18 | HIGH | SPARSE | `CURRENT/features/block/` |
| 21 | onboarding | features/onboarding/ | ~16 | MEDIUM | PARTIAL (in identity/) | `CURRENT/features/onboarding/` |
| 22 | identity | features/identity/ | ~9 | CRITICAL | FULL (identity/ canonical) | `CURRENT/features/identity/` |
| 23 | vgrid | features/vgrid/ | ~10 | LOW | NONE | `CURRENT/features/vgrid/` |
| 24 | join | features/join/ | ~12 | MEDIUM | SPARSE | `CURRENT/features/join/` |
| 25 | invite | features/invite/ | ~6 | MEDIUM | SPARSE | `CURRENT/features/invite/` |
| 26 | media | features/media/ | ~9 | MEDIUM | SPARSE | `CURRENT/features/media/` |
| 27 | void | features/void/ | ~11 | LOW | NONE | `CURRENT/features/void/` |
| 28 | vport (core) | features/vport/ | ~29 | HIGH | PARTIAL | `CURRENT/features/vport/` |
| 29 | actors | features/actors/ | ~4 | CRITICAL | PARTIAL (in identity/) | `CURRENT/features/actors/` |

---

## TIER 4 — MINIMAL / PLACEHOLDER FEATURES

| # | Feature | Source Path | Files | Status | Doc Coverage | Notes |
|---|---|---|---|---|---|---|
| 30 | hydration | features/hydration/ | 2 | ACTIVE | NONE | Actor hydrator utility |
| 31 | portfolio | features/portfolio/ | 1 | PLACEHOLDER | NONE | Setup hook only — real portfolio in dashboard/cards/ |
| 32 | reviews | features/reviews/ | 1 | PLACEHOLDER | NONE | Setup hook only — real reviews in dashboard/cards/ |
| 33 | debug | features/debug/ | 3 | DEV-ONLY | N/A | Never ships to production |
| 34 | ui | features/ui/ | 1 | PLACEHOLDER | N/A | Shell or organizational |

---

## NON-FEATURE ROOT DIRECTORIES REQUIRING DOCS

| # | Directory | Path | Files | Doc Need | Coverage |
|---|---|---|---|---|---|
| 35 | shared | src/shared/ | ~42 | LOW | None — derivable from code |
| 36 | state | src/state/ | ~23 | MEDIUM | PARTIAL (identity/ canonical covers actors/identity) |
| 37 | app (routing) | src/app/ | ~35 | MEDIUM | NONE — route map not documented |
| 38 | services | src/services/ | ~14 | HIGH | PARTIAL (platform/ has some) |
| 39 | learning (LMS) | src/learning/ | ~175 | HIGH | NONE — large system, no canonical spec |
| 40 | bootstrap | src/bootstrap/ | ~4 | LOW | NONE |
| 41 | queries | src/queries/ | unknown | LOW | NONE |

---

## DOCUMENTATION COVERAGE SUMMARY

| Coverage Level | Feature Count | % of Features |
|---|---|---|
| FULL | 6 | 17% |
| PARTIAL | 10 | 29% |
| SPARSE | 7 | 20% |
| NONE | 10 | 29% |
| N/A (dev-only) | 2 | 6% |

**17% of features have full documentation. 34 features have gaps. The learning system (175 files) has zero documentation.**

---

## HIGH-PRIORITY DOCUMENTATION GAPS

1. **learning** (175 files, NONE) — Embedded LMS with no canonical spec at all
2. **settings** (92 files, SPARSE) — Privacy and account controls poorly documented
3. **dashboard** (238 files, PARTIAL) — Canonical spec absent; architect output in wrong location
4. **profiles** (374 files, PARTIAL) — Largest feature, no canonical spec
5. **moderation** (35 files, SPARSE) — Safety-critical, underdocumented
6. **professional** (33 files, NONE) — Entire vertical market with no docs
7. **post** (116 files, PARTIAL) — Post creation pipeline not canonically documented
