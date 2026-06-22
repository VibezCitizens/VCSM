---
# CURRENT Category Registry
**Created:** 2026-06-02
**Last Updated:** 2026-06-02T03:30:00
**Ticket:** TICKET-CURRENT-CATEGORY-INDEX-0001
**Status:** ACTIVE
**Fix:** TICKET-CURRENT-CATEGORY-INDEX-0001 — removed per-section duplicate tables; Master Table is now single source of truth

---

## Purpose

This registry defines the canonical category key used by all future governance, audit, command, workflow, DR. STRANGE, and discovery outputs inside CURRENT.

Every output file, governance report, and audit artifact must include a Category Key from this registry.

Category keys are stable forever once assigned. Do not rename them.

---

## Naming Contract

| Rule | Description |
|---|---|
| Case | Lowercase only |
| Separator | Kebab-case (hyphens only — no underscores, no slashes, no spaces) |
| Stability | Once assigned, never changed |
| Feature keys | Match CURRENT/features/[feature] folder name exactly |
| Dashboard submodules | dashboard-[module-name] |
| Dashboard tabs | dashboard-tab-[tab-name] |
| Dashboard governance | dashboard-gov-[area] |
| Platform areas | platform-[area] |
| Shared areas | shared or shared-[sub] |
| Services | service-[name] |
| State areas | state-[area] |
| Styles | style-[area] |
| Triage buckets | needs-triage |

---

## Master Category Table

This is the single source of truth. All keys appear exactly once here. Per-section views below are filtered references only — no data rows.

| Category Key | Display Name | Type | CURRENT Path | Source Path | Default Output Prefix | DR. STRANGE Entry |
|---|---|---|---|---|---|---|
| feature-registry | Feature Documentation Index | registry | FEATURE_DOCUMENTATION_INDEX.md | | feature-registry | FEATURE_DOCUMENTATION_INDEX.md |
| feature-status | Feature Status Registry | registry | FEATURE_STATUS.md | | feature-status | FEATURE_STATUS.md |
| frozen-registry | Frozen Feature Contract | registry | FROZEN_FEATURE_CONTRACT.md | | frozen-registry | FROZEN_FEATURE_CONTRACT.md |
| source-workflow | Source Workflow Intake | registry | SOURCE_WORKFLOW_INTAKE.md | | source-workflow | SOURCE_WORKFLOW_INTAKE.md |
| output-index | CURRENT Root README | registry | README.md | | output-index | README.md |
| feature-index | Feature Index (FEATURE_INDEX) | registry | FEATURE_INDEX | | feature-index | actors.md |
| feature-index-runtime | Feature Index Runtime (FEATURE_INDEX_RUNTIME) | registry | FEATURE_INDEX_RUNTIME | | feature-index-runtime | actors.md |
| actors | Actors | feature | features/actors | apps/VCSM/src/features/actors | actors | CURRENT_STATUS.md |
| auth | Auth | feature | features/auth | apps/VCSM/src/features/auth | auth | CURRENT_STATUS.md |
| block | Block | feature | features/block | apps/VCSM/src/features/block | block | CURRENT_STATUS.md |
| booking | Booking | feature | features/booking | apps/VCSM/src/features/booking | booking | CURRENT_STATUS.md |
| chat | Chat | feature | features/chat | apps/VCSM/src/features/chat | chat | CURRENT_STATUS.md |
| dashboard | Dashboard | feature | features/dashboard | apps/VCSM/src/features/dashboard | dashboard | CURRENT_STATUS.md |
| feed | Feed | feature | features/feed | apps/VCSM/src/features/feed | feed | CURRENT_STATUS.md |
| identity | Identity | feature | features/identity | apps/VCSM/src/features/identity | identity | CURRENT_STATUS.md |
| invite | Invite | feature | features/invite | apps/VCSM/src/features/invite | invite | CURRENT_STATUS.md |
| join | Join | feature | features/join | apps/VCSM/src/features/join | join | CURRENT_STATUS.md |
| legal | Legal | feature | features/legal | apps/VCSM/src/features/legal | legal | CURRENT_STATUS.md |
| media | Media | feature | features/media | apps/VCSM/src/features/media | media | CURRENT_STATUS.md |
| moderation | Moderation | feature | features/moderation | apps/VCSM/src/features/moderation | moderation | CURRENT_STATUS.md |
| notifications | Notifications | feature | features/notifications | apps/VCSM/src/features/notifications | notifications | CURRENT_STATUS.md |
| onboarding | Onboarding | feature | features/onboarding | apps/VCSM/src/features/onboarding | onboarding | vcsm.onboarding.architecture.md |
| portfolio | Portfolio | feature | features/portfolio | apps/VCSM/src/features/portfolio | portfolio | vcsm.portfolio.architecture.md |
| post | Post | feature | features/post | apps/VCSM/src/features/post | post | CURRENT_STATUS.md |
| profiles | Profiles | feature | features/profiles | apps/VCSM/src/features/profiles | profiles | CURRENT_STATUS.md |
| public | Public | feature | features/public | apps/VCSM/src/features/public | public | CURRENT_STATUS.md |
| settings | Settings | feature | features/settings | apps/VCSM/src/features/settings | settings | CURRENT_STATUS.md |
| social | Social | feature | features/social | apps/VCSM/src/features/social | social | CURRENT_STATUS.md |
| upload | Upload | feature | features/upload | apps/VCSM/src/features/upload | upload | CURRENT_STATUS.md |
| vgrid | VGrid | feature | features/vgrid | apps/VCSM/src/features/vgrid | vgrid | vcsm.vgrid.architecture.md |
| vport | VPort | feature | features/vport | apps/VCSM/src/features/vport | vport | CURRENT_STATUS.md |
| ads | Ads | feature | | apps/VCSM/src/features/ads | ads | |
| explore | Explore | feature | | apps/VCSM/src/features/explore | explore | |
| hydration | Hydration | feature | | apps/VCSM/src/features/hydration | hydration | |
| professional | Professional | feature | | apps/VCSM/src/features/professional | professional | |
| reviews | Reviews | feature | | apps/VCSM/src/features/reviews | reviews | |
| void | Void Realm | feature | | apps/VCSM/src/features/void | void | |
| frozen-learning | Frozen — Learning | feature | frozen/learning | | frozen-learning | README.md |
| frozen-vgrid | Frozen — VGrid | feature | frozen/vgrid | | frozen-vgrid | README.md |
| frozen-wanderex | Frozen — Wanderex | feature | frozen/wanderex | | frozen-wanderex | README.md |
| frozen-wanders | Frozen — Wanders | feature | frozen/wanders | | frozen-wanders | README.md |
| dashboard-availability | Dashboard — Availability Module | dashboard-module | features/dashboard/modules/availability | apps/VCSM/src/features/dashboard/vport/dashboard/cards/availability | dashboard-availability | README.md |
| dashboard-barber | Dashboard — Barber Module | dashboard-module | features/dashboard/modules/barber | apps/VCSM/src/features/dashboard/vport | dashboard-barber | README.md |
| dashboard-barbershop | Dashboard — Barbershop Module | dashboard-module | features/dashboard/modules/barbershop | apps/VCSM/src/features/dashboard/vport | dashboard-barbershop | README.md |
| dashboard-booking | Dashboard — Booking Module | dashboard-module | features/dashboard/modules/booking | apps/VCSM/src/features/dashboard/vport/dashboard/cards/booking | dashboard-booking | README.md |
| dashboard-calendar | Dashboard — Calendar Module | dashboard-module | features/dashboard/modules/calendar | apps/VCSM/src/features/dashboard/vport/dashboard/cards/calendar | dashboard-calendar | README.md |
| dashboard-content-pages | Dashboard — Content Pages Module | dashboard-module | features/dashboard/modules/content-pages | apps/VCSM/src/features/dashboard/vport/dashboard/cards/content | dashboard-content-pages | README.md |
| dashboard-dashboard | Dashboard — Dashboard Module | dashboard-module | features/dashboard/modules/dashboard | apps/VCSM/src/features/dashboard/vport/dashboard | dashboard-dashboard | README.md |
| dashboard-dashboard-cards | Dashboard — Dashboard Cards Module | dashboard-module | features/dashboard/modules/dashboard-cards | apps/VCSM/src/features/dashboard/vport/dashboard/cards | dashboard-dashboard-cards | README.md |
| dashboard-delete-lifecycle | Dashboard — Delete Lifecycle Module | dashboard-module | features/dashboard/modules/delete-lifecycle | apps/VCSM/src/features/dashboard/vport | dashboard-delete-lifecycle | README.md |
| dashboard-exchange | Dashboard — Exchange Module | dashboard-module | features/dashboard/modules/exchange | apps/VCSM/src/features/dashboard/vport/dashboard/cards/exchange | dashboard-exchange | README.md |
| dashboard-flyer-builder | Dashboard — Flyer Builder Module | dashboard-module | features/dashboard/modules/flyer-builder | apps/VCSM/src/features/dashboard/vport/dashboard/cards/flyer | dashboard-flyer-builder | README.md |
| dashboard-gas | Dashboard — Gas Module | dashboard-module | features/dashboard/modules/gas | apps/VCSM/src/features/dashboard/vport/dashboard/cards/gas | dashboard-gas | README.md |
| dashboard-invite | Dashboard — Invite Module | dashboard-module | features/dashboard/modules/invite | apps/VCSM/src/features/dashboard/vport/dashboard/cards/invite | dashboard-invite | README.md |
| dashboard-join | Dashboard — Join Module | dashboard-module | features/dashboard/modules/join | apps/VCSM/src/features/dashboard/vport/dashboard/cards/join | dashboard-join | README.md |
| dashboard-leads | Dashboard — Leads Module | dashboard-module | features/dashboard/modules/leads | apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads | dashboard-leads | README.md |
| dashboard-locksmith | Dashboard — Locksmith Module | dashboard-module | features/dashboard/modules/locksmith | apps/VCSM/src/features/dashboard/vport/dashboard/cards/locksmith | dashboard-locksmith | README.md |
| dashboard-menu | Dashboard — Menu Module | dashboard-module | features/dashboard/modules/menu | apps/VCSM/src/features/dashboard/vport/dashboard/cards/menu | dashboard-menu | README.md |
| dashboard-portfolio | Dashboard — Portfolio Module | dashboard-module | features/dashboard/modules/portfolio | apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio | dashboard-portfolio | README.md |
| dashboard-qrcode | Dashboard — QR Code Module | dashboard-module | features/dashboard/modules/qrcode | apps/VCSM/src/features/dashboard/vport/dashboard/cards/qrcode | dashboard-qrcode | README.md |
| dashboard-restaurant | Dashboard — Restaurant Module | dashboard-module | features/dashboard/modules/restaurant | apps/VCSM/src/features/dashboard/vport/dashboard/cards/restaurant | dashboard-restaurant | README.md |
| dashboard-reviews | Dashboard — Reviews Module | dashboard-module | features/dashboard/modules/reviews | apps/VCSM/src/features/dashboard/vport/dashboard/cards/reviews | dashboard-reviews | README.md |
| dashboard-schedule | Dashboard — Schedule Module | dashboard-module | features/dashboard/modules/schedule | apps/VCSM/src/features/dashboard/vport/dashboard/cards/schedule | dashboard-schedule | README.md |
| dashboard-services | Dashboard — Services Module | dashboard-module | features/dashboard/modules/services | apps/VCSM/src/features/dashboard/vport/dashboard/cards/services | dashboard-services | README.md |
| dashboard-settings | Dashboard — Settings Module | dashboard-module | features/dashboard/modules/settings | apps/VCSM/src/features/dashboard/vport/dashboard/cards/settings | dashboard-settings | README.md |
| dashboard-settings-vports | Dashboard — Settings VPorts Module | dashboard-module | features/dashboard/modules/settings-vports | apps/VCSM/src/features/dashboard/vport/dashboard/cards/settings | dashboard-settings-vports | README.md |
| dashboard-subscribers | Dashboard — Subscribers Module | dashboard-module | features/dashboard/modules/subscribers | apps/VCSM/src/features/dashboard/vport/dashboard/cards/subscribers | dashboard-subscribers | README.md |
| dashboard-tab-classification | Dashboard — Tab Classification Module | dashboard-module | features/dashboard/modules/tab-classification | apps/VCSM/src/features/dashboard/vport | dashboard-tab-classification | README.md |
| dashboard-team | Dashboard — Team Module | dashboard-module | features/dashboard/modules/team | apps/VCSM/src/features/dashboard/vport/dashboard/cards/team | dashboard-team | README.md |
| dashboard-vport-core | Dashboard — VPort Core Module | dashboard-module | features/dashboard/modules/vport-core | apps/VCSM/src/features/dashboard/vport | dashboard-vport-core | README.md |
| dashboard-tab-about | Dashboard Tab — About | dashboard-tab | features/dashboard/tabs/about | apps/VCSM/src/features/dashboard/vport/dashboard/tabs/about | dashboard-tab-about | README.md |
| dashboard-tab-booking | Dashboard Tab — Booking | dashboard-tab | features/dashboard/tabs/booking | apps/VCSM/src/features/dashboard/vport/dashboard/tabs/booking | dashboard-tab-booking | README.md |
| dashboard-tab-contact | Dashboard Tab — Contact | dashboard-tab | features/dashboard/tabs/contact | apps/VCSM/src/features/dashboard/vport/dashboard/tabs/contact | dashboard-tab-contact | README.md |
| dashboard-tab-content | Dashboard Tab — Content | dashboard-tab | features/dashboard/tabs/content | apps/VCSM/src/features/dashboard/vport/dashboard/tabs/content | dashboard-tab-content | README.md |
| dashboard-tab-gallery | Dashboard Tab — Gallery | dashboard-tab | features/dashboard/tabs/gallery | apps/VCSM/src/features/dashboard/vport/dashboard/tabs/gallery | dashboard-tab-gallery | README.md |
| dashboard-tab-gas-prices | Dashboard Tab — Gas Prices | dashboard-tab | features/dashboard/tabs/gas-prices | apps/VCSM/src/features/dashboard/vport/dashboard/tabs/gas | dashboard-tab-gas-prices | README.md |
| dashboard-tab-menu | Dashboard Tab — Menu | dashboard-tab | features/dashboard/tabs/menu | apps/VCSM/src/features/dashboard/vport/dashboard/tabs/menu | dashboard-tab-menu | README.md |
| dashboard-tab-owner | Dashboard Tab — Owner | dashboard-tab | features/dashboard/tabs/owner | apps/VCSM/src/features/dashboard/vport/dashboard/tabs/owner | dashboard-tab-owner | README.md |
| dashboard-tab-portfolio | Dashboard Tab — Portfolio | dashboard-tab | features/dashboard/tabs/portfolio | apps/VCSM/src/features/dashboard/vport/dashboard/tabs/portfolio | dashboard-tab-portfolio | README.md |
| dashboard-tab-rates | Dashboard Tab — Rates | dashboard-tab | features/dashboard/tabs/rates | apps/VCSM/src/features/dashboard/vport/dashboard/tabs/rates | dashboard-tab-rates | README.md |
| dashboard-tab-reviews | Dashboard Tab — Reviews | dashboard-tab | features/dashboard/tabs/reviews | apps/VCSM/src/features/dashboard/vport/dashboard/tabs/reviews | dashboard-tab-reviews | README.md |
| dashboard-tab-services | Dashboard Tab — Services | dashboard-tab | features/dashboard/tabs/services | apps/VCSM/src/features/dashboard/vport/dashboard/tabs/services | dashboard-tab-services | README.md |
| dashboard-tab-subscribers | Dashboard Tab — Subscribers | dashboard-tab | features/dashboard/tabs/subscribers | apps/VCSM/src/features/dashboard/vport/dashboard/tabs/subscribers | dashboard-tab-subscribers | README.md |
| dashboard-tab-team | Dashboard Tab — Team | dashboard-tab | features/dashboard/tabs/team | apps/VCSM/src/features/dashboard/vport/dashboard/tabs/team | dashboard-tab-team | README.md |
| dashboard-tab-vibes | Dashboard Tab — Vibes | dashboard-tab | features/dashboard/tabs/vibes | apps/VCSM/src/features/dashboard/vport/dashboard/tabs/vibes | dashboard-tab-vibes | README.md |
| dashboard-tab-mod-business-card | Dashboard Tab Module — Public VPort Business Card | dashboard-tab | features/dashboard/tabs/modules/public-vport-business-card | apps/VCSM/src/features/dashboard/vport | dashboard-tab-mod-business-card | README.md |
| dashboard-tab-mod-menu | Dashboard Tab Module — Public VPort Menu | dashboard-tab | features/dashboard/tabs/modules/public-vport-menu | apps/VCSM/src/features/dashboard/vport | dashboard-tab-mod-menu | README.md |
| dashboard-tab-mod-profile-header | Dashboard Tab Module — VPort Profile Header | dashboard-tab | features/dashboard/tabs/modules/vport-profile-header | apps/VCSM/src/features/dashboard/vport | dashboard-tab-mod-profile-header | README.md |
| dashboard-gov-architect | Dashboard Governance — Architect | dashboard-governance | features/dashboard/governance/architect | | dashboard-gov-architect | README.md |
| dashboard-gov-avengersassemble | Dashboard Governance — Avengers Assemble | dashboard-governance | features/dashboard/governance/avengersassemble | | dashboard-gov-avengersassemble | README.md |
| dashboard-gov-blackwidow | Dashboard Governance — Black Widow | dashboard-governance | features/dashboard/governance/blackwidow | | dashboard-gov-blackwidow | README.md |
| dashboard-gov-captain | Dashboard Governance — Captain | dashboard-governance | features/dashboard/governance/captain | | dashboard-gov-captain | README.md |
| dashboard-gov-carnage | Dashboard Governance — Carnage | dashboard-governance | features/dashboard/governance/carnage | | dashboard-gov-carnage | README.md |
| dashboard-gov-cerebro | Dashboard Governance — Cerebro | dashboard-governance | features/dashboard/governance/cerebro | | dashboard-gov-cerebro | README.md |
| dashboard-gov-dataengineer | Dashboard Governance — Data Engineer | dashboard-governance | features/dashboard/governance/dataengineer | | dashboard-gov-dataengineer | README.md |
| dashboard-gov-db | Dashboard Governance — DB | dashboard-governance | features/dashboard/governance/db | | dashboard-gov-db | README.md |
| dashboard-gov-deadpool | Dashboard Governance — Deadpool | dashboard-governance | features/dashboard/governance/deadpool | | dashboard-gov-deadpool | README.md |
| dashboard-gov-elektra | Dashboard Governance — Elektra | dashboard-governance | features/dashboard/governance/elektra | | dashboard-gov-elektra | README.md |
| dashboard-gov-falcon | Dashboard Governance — Falcon | dashboard-governance | features/dashboard/governance/falcon | | dashboard-gov-falcon | README.md |
| dashboard-gov-hawkeye | Dashboard Governance — Hawkeye | dashboard-governance | features/dashboard/governance/hawkeye | | dashboard-gov-hawkeye | README.md |
| dashboard-gov-ironman | Dashboard Governance — Iron Man | dashboard-governance | features/dashboard/governance/ironman | | dashboard-gov-ironman | README.md |
| dashboard-gov-kraven | Dashboard Governance — Kraven | dashboard-governance | features/dashboard/governance/kraven | | dashboard-gov-kraven | README.md |
| dashboard-gov-logan | Dashboard Governance — Logan | dashboard-governance | features/dashboard/governance/logan | | dashboard-gov-logan | README.md |
| dashboard-gov-loki | Dashboard Governance — Loki | dashboard-governance | features/dashboard/governance/loki | | dashboard-gov-loki | README.md |
| dashboard-gov-nickfury | Dashboard Governance — Nick Fury | dashboard-governance | features/dashboard/governance/nickfury | | dashboard-gov-nickfury | README.md |
| dashboard-gov-review-contract | Dashboard Governance — Review Contract | dashboard-governance | features/dashboard/governance/review-contract | | dashboard-gov-review-contract | README.md |
| dashboard-gov-sentry | Dashboard Governance — Sentry | dashboard-governance | features/dashboard/governance/sentry | | dashboard-gov-sentry | README.md |
| dashboard-gov-session-summary | Dashboard Governance — Session Summary | dashboard-governance | features/dashboard/governance/session-summary | | dashboard-gov-session-summary | README.md |
| dashboard-gov-shield | Dashboard Governance — Shield | dashboard-governance | features/dashboard/governance/shield | | dashboard-gov-shield | README.md |
| dashboard-gov-spiderman | Dashboard Governance — Spider-Man | dashboard-governance | features/dashboard/governance/spiderman | | dashboard-gov-spiderman | README.md |
| dashboard-gov-thor | Dashboard Governance — Thor | dashboard-governance | features/dashboard/governance/thor | | dashboard-gov-thor | README.md |
| dashboard-gov-venom | Dashboard Governance — Venom | dashboard-governance | features/dashboard/governance/venom | | dashboard-gov-venom | README.md |
| dashboard-gov-vision | Dashboard Governance — Vision | dashboard-governance | features/dashboard/governance/vision | | dashboard-gov-vision | README.md |
| dashboard-gov-watcher | Dashboard Governance — Watcher | dashboard-governance | features/dashboard/governance/watcher | | dashboard-gov-watcher | README.md |
| dashboard-gov-wintersoldier | Dashboard Governance — Winter Soldier | dashboard-governance | features/dashboard/governance/wintersoldier | | dashboard-gov-wintersoldier | README.md |
| dashboard-gov-wolverine | Dashboard Governance — Wolverine | dashboard-governance | features/dashboard/governance/wolverine | | dashboard-gov-wolverine | README.md |
| platform-change-intent | Platform — Change Intent | platform | platform/change-intent | | platform-change-intent | CHANGE_INTENT.md |
| platform-documentation | Platform — Documentation | platform | platform/documentation | | platform-documentation | CURRENT_STATUS.md |
| platform-native | Platform — Native | platform | platform/native | | platform-native | README.md |
| platform-security | Platform — Security | platform | platform/security | | platform-security | CURRENT_STATUS.md |
| behavior-contracts | Behavior Contracts System | platform | platform/documentation | | behavior-contracts | BEHAVIOR_TEMPLATE.md |
| platform-scanner | Platform — Scanner System | platform | platform/documentation | apps/scanner | platform-scanner | command-preflight-matrix.md |
| shared | Shared — Engine Audits and Contracts | shared | shared | engines/ | shared | engines.booking.contract.md |
| service-vport | Services — VPort External Integrations | service | services | | service-vport | README.md |
| state-store | State — Store Map | state | state | | state-store | state-store-map.md |
| style-theme | Styles — Theme and Design Tokens | style | styles | | style-theme | vcsm.theme.design-tokens.md |
| needs-triage | Needs Triage (NEEDS_TRIAGE) | triage | NEEDS_TRIAGE | | needs-triage | CONFLICT_FROM_ACTIVE_CANONICAL___CANONICAL__logan__README.md |
| needs-triage-alt | Needs Triage Alt (_NEEDS_TRIAGE) | triage | _NEEDS_TRIAGE | | needs-triage-alt | VPORT_FEATURE_INVENTORY.md |

---

## Feature Categories

*See Master Category Table above — filter by Type: feature*

Quick reference (keys only):
actors, ads, auth, block, booking, chat, dashboard, explore, feed, frozen-learning, frozen-vgrid, frozen-wanderex, frozen-wanders, hydration, identity, invite, join, legal, media, moderation, notifications, onboarding, portfolio, post, professional, profiles, public, reviews, settings, social, upload, vgrid, void, vport

---

## Dashboard Module Categories

*See Master Category Table above — filter by Type: dashboard-module, dashboard-tab, dashboard-governance*

Quick reference (keys only):
dashboard-availability, dashboard-barber, dashboard-barbershop, dashboard-booking, dashboard-calendar, dashboard-content-pages, dashboard-dashboard, dashboard-dashboard-cards, dashboard-delete-lifecycle, dashboard-exchange, dashboard-flyer-builder, dashboard-gas, dashboard-invite, dashboard-join, dashboard-leads, dashboard-locksmith, dashboard-menu, dashboard-portfolio, dashboard-qrcode, dashboard-restaurant, dashboard-reviews, dashboard-schedule, dashboard-services, dashboard-settings, dashboard-settings-vports, dashboard-subscribers, dashboard-tab-classification, dashboard-team, dashboard-vport-core, dashboard-tab-about, dashboard-tab-booking, dashboard-tab-contact, dashboard-tab-content, dashboard-tab-gallery, dashboard-tab-gas-prices, dashboard-tab-menu, dashboard-tab-owner, dashboard-tab-portfolio, dashboard-tab-rates, dashboard-tab-reviews, dashboard-tab-services, dashboard-tab-subscribers, dashboard-tab-team, dashboard-tab-vibes, dashboard-tab-mod-business-card, dashboard-tab-mod-menu, dashboard-tab-mod-profile-header, dashboard-gov-architect, dashboard-gov-avengersassemble, dashboard-gov-blackwidow, dashboard-gov-captain, dashboard-gov-carnage, dashboard-gov-cerebro, dashboard-gov-dataengineer, dashboard-gov-db, dashboard-gov-deadpool, dashboard-gov-elektra, dashboard-gov-falcon, dashboard-gov-hawkeye, dashboard-gov-ironman, dashboard-gov-kraven, dashboard-gov-logan, dashboard-gov-loki, dashboard-gov-nickfury, dashboard-gov-review-contract, dashboard-gov-sentry, dashboard-gov-session-summary, dashboard-gov-shield, dashboard-gov-spiderman, dashboard-gov-thor, dashboard-gov-venom, dashboard-gov-vision, dashboard-gov-watcher, dashboard-gov-wintersoldier, dashboard-gov-wolverine

---

## Platform Categories

*See Master Category Table above — filter by Type: platform*

Quick reference (keys only):
platform-change-intent, platform-documentation, platform-native, platform-security, behavior-contracts, platform-scanner

---

## Shared / Service / State / Style Categories

*See Master Category Table above — filter by Type: shared, service, state, style*

Quick reference (keys only):
shared, service-vport, state-store, style-theme

---

## Triage Categories

*See Master Category Table above — filter by Type: triage*

Quick reference (keys only):
needs-triage, needs-triage-alt

---

## Registry / Root Categories

*See Master Category Table above — filter by Type: registry*

Quick reference (keys only):
feature-registry, feature-status, frozen-registry, source-workflow, output-index, feature-index, feature-index-runtime

---

*Generated: 2026-06-02 | Last Fixed: 2026-06-02 | Ticket: TICKET-GOVERNANCE-REALIGNMENT-0001 | Added: behavior-contracts, platform-scanner*
