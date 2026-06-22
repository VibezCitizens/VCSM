# VPORT Tab Governance Matrix

**Last Updated:** 2026-06-02 (TICKET-0005: ELEKTRA + BLACKWIDOW columns added)
**Maintainer:** WOLVERINE (auto-updated after each specialist command run)
**Source:** `vport-tab-registry.md` + per-tab audit files in `tabs/`

This is the authoritative cross-tab governance status matrix. Every tab that appears on any VPORT public profile must have a row here.

---

## Legend

**Lifecycle Statuses:** `NOT_STARTED` | `IN_PROGRESS` | `PARTIAL` | `VERIFIED` | `COMPLETE` | `BLOCKED` | `DEFERRED`

**Priority:** P0 = release blocker · P1 = critical · P2 = high · P3 = medium · P4 = low

**Risk:** CRITICAL · HIGH · MEDIUM · LOW · NONE

---

## Master Governance Matrix

| Tab | Key | Route Pattern | VPORT Types | Public/Owner | Mobile | Desktop | Active | Release Flag | VENOM | ELEKTRA | BLACKWIDOW | ARCHITECT | KRAVEN | SENTRY | SPIDER-MAN | LOGAN | THOR | Priority | Risk | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **About** | `about` | `?tab=about` | ALL | Both | ✓ | ✓ | ✓ | — | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | P2 | LOW | Present in every preset; identity fields visible |
| **Book** | `book` | `?tab=book` | barber, barbershop, locksmith, beauty, health, trades, sports, animal | Both | ✓ | ✓ | ✓ | `TAB_FLAGS.BOOK` | PARTIAL | NOT_STARTED | NOT_STARTED | PARTIAL | COMPLETE | COMPLETE | PARTIAL | COMPLETE | RELEASE APPROVED | P0 | LOW | THOR RELEASE APPROVED 2026-05-27 (CAUTION). BOOK-001 RESOLVED. BOOK-002 RESOLVED. KRAVEN WATCH (KPF-001/003 P3 post-release). SENTRY MINOR DRIFT (all low). BOOK-003 LOW post-release. DTAB-006 P2 deferred. |
| **Content** | `content` | `?tab=content` | Most types | Both | ✓ | ✓ | ✓ | — | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | P2 | MEDIUM | Social content feed within profile |
| **Gas Prices** | `gas` | `?tab=gas` | gas station | Both | ✓ | ✓ | ✓ | — | COMPLETE | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | PARTIAL | NOT_STARTED | CAUTION | P1 | HIGH | VENOM COMPLETE: security is sound. GAS-001 resolved by tests. GAS-002 LOW open. |
| **Menu** | `menu` | `?tab=menu` | restaurant, baker, chef, caterer, food types | Both | ✓ | ✓ | ✓ | — | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | P1 | MEDIUM | QR-based public access; flyer pipeline; printable flag |
| **Owner** | `owner` | `?tab=owner` | ALL | Owner only | ✓ | ✓ | ✓ | — | COMPLETE | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | RELEASE APPROVED | P1 | LOW | VENOM COMPLETE: injection gate sound; content is nav links only; LOW finding open. |
| **Photos** | `photos` | `?tab=photos` | Most types | Both | ✓ | ✓ | ✓ | — | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | P2 | LOW | Photo gallery; upload/media pipeline — CONTRADICTION: folder on disk is gallery/ not photos/ — requires ARCHITECT resolution |
| **Portfolio** | `portfolio` | `?tab=portfolio` | barber, barbershop, locksmith, creative, trades, professional | Both | ✓ | ✓ | ✓ | `TAB_FLAGS.PORTFOLIO` | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | P2 | MEDIUM | Work showcase; upload surface |
| **Rates** | `rates` | `?tab=rates` | exchange, money exchange | Both | ✓ | ✓ | ✓ | `TAB_FLAGS.RATES` | PARTIAL | NOT_STARTED | NOT_STARTED | PARTIAL | VERIFIED | PARTIAL | PARTIAL | COMPLETE | NOT_STARTED | P1 | MEDIUM | Exchange rate board; hardened 2026-05-27; 3 bugs fixed |
| **Reviews** | `reviews` | `?tab=reviews` | ALL | Both | ✓ | ✓ | ✓ | — | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | P2 | MEDIUM | Review submission writes; dimension ratings |
| **Services** | `services` | `?tab=services` | Most service types | Both | ✓ | ✓ | ✓ | `TAB_FLAGS.SERVICES` | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | P2 | MEDIUM | Service catalog; owner writes; public reads |
| **Subscribers** | `subscribers` | `?tab=subscribers` | Most types | Both | ✓ | ✓ | ✓ | — | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | P3 | LOW | Subscriber list; identity surface consideration |
| **Team** | `team` | `?tab=team` | barbershop | Both | ✓ | ✓ | ✓ | — | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | P1 | HIGH | Team membership, barber identity, booking routing per barber |
| **Vibes** | `vibes` | `?tab=vibes` | Most types | Both | ✓ | ✓ | ✓ | — | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | P3 | LOW | Social feed slice within VPORT profile |
| **Contact** | `contact` | `?tab=contact` | TBD | TBD | TBD | TBD | NOT_STARTED | — | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | P4 | LOW | Planned — not yet implemented |
| **Gallery** | `gallery` | `?tab=gallery` | TBD | TBD | TBD | TBD | NOT_STARTED | — | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | P4 | LOW | Planned — may map to photos tab — CONTRADICTION: this folder exists but governance matrix also has a separate Photos row with key=photos — requires ARCHITECT resolution |

---

## Audit Command Coverage Matrix

| Tab | VENOM | ELEKTRA | BLACKWIDOW | ARCHITECT | KRAVEN | SENTRY | SPIDER-MAN | LOGAN | Last Audit Date |
|---|---|---|---|---|---|---|---|
| about | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | — |
| **book** | **PARTIAL** | NOT_STARTED | NOT_STARTED | **PARTIAL** | **COMPLETE** | **COMPLETE** | **PARTIAL** | **COMPLETE** | **2026-05-27** |
| content | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | — |
| **gas** | **COMPLETE** | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | **PARTIAL** | NOT_STARTED | **2026-05-27** |
| menu | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | — |
| **owner** | **COMPLETE** | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | **2026-05-27** |
| photos | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | — |
| portfolio | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | — |
| **rates** | PARTIAL | NOT_STARTED | NOT_STARTED | PARTIAL | **VERIFIED** | PARTIAL | PARTIAL | **COMPLETE** | 2026-05-27 |
| reviews | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | — |
| services | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | — |
| subscribers | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | — |
| team | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | — |
| vibes | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | — |
| contact | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | — |
| gallery | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | NOT_STARTED | — |

---

## Risk Priority Stack (Unaudited — Recommended Audit Order)

| Rank | Tab | Risk | Justification |
|---|---|---|---|
| 1 | **book** | CRITICAL | Booking writes, ownership enforcement, payment surface, team-aware scheduling (barbershop). Highest-risk unaudited tab in the system. |
| 2 | **owner** | HIGH | Dynamically injected, owner-only. If the injection gate has a bypass path, any visitor could see the owner tab. |
| 3 | **team** | HIGH | Barber team membership affects booking routing. Team members are identity objects — exposure risk. |
| 4 | **gas** | HIGH | Owner writes public-facing fuel prices. Price manipulation risk. Landing tab for gas types. |
| 5 | **menu** | MEDIUM | QR-accessed public menu; flyer pipeline; printable feature flag; potential flyer content injection. |
| 6 | **services** | MEDIUM | Owner writes service catalog. Cross-feature access pattern needs adapter audit. |
| 7 | **reviews** | MEDIUM | Review submission write path needs ownership and identity audit. |
| 8 | **portfolio** | MEDIUM | Upload surface; media handling; identity association. |
| 9 | **about** | LOW | Mostly read-only; hours, location, contact — low write risk. |
| 10 | **content** | LOW | Social content feed; read-heavy. |
| 11 | **subscribers** | LOW | Read-only list; identity exposure. |
| 12 | **photos** | LOW | Read-heavy; upload pipeline risk is upload-system scoped. |
| 13 | **vibes** | LOW | Social feed slice; read-heavy. |

---

## Governance Events Log

| Date | Tab | Command | Outcome | Engineer | Notes |
|---|---|---|---|---|---|
| 2026-05-27 | rates | KRAVEN | VERIFIED — stale-read closed, 3 LOW findings | Wolverine | Full report: `audits/performance/2026-05-27_03-00_kraven_vport-exchange-rate-runtime.md` |
| 2026-05-27 | rates | SENTRY | PARTIAL — MINOR DRIFT (SF-001, SF-002 P3 deferred) | Wolverine | Report: `audits/compliance/2026-05-27_02-50_sentry_vport-exchange-rate-p1-fixes.md` |
| 2026-05-27 | rates | SPIDER-MAN | PARTIAL — 26 new tests, 1 critical prod bug fixed | Wolverine | In master audit file: `2026-05-27_vport-exchange-hardening.audit.md` |
| 2026-05-27 | rates | LOGAN | COMPLETE | Wolverine | Doc: `logan/vports/vcsm.vport.exchange-rate.md` |
| 2026-05-27 | book | VENOM | PARTIAL — 3 findings (BOOK-001 MEDIUM, BOOK-002 MEDIUM, BOOK-003 LOW) | Wolverine | Report: `governance/venom/2026-05-27_venom_vport-book-tab.md` |
| 2026-05-27 | book | ARCHITECT | PARTIAL — DTAB-006 confirmed (MODERATE DRIFT) | Wolverine | Report: `governance/architect/2026-05-27_architect_vport-dtab-006-adapter-boundary.md` |
| 2026-05-27 | owner | VENOM | COMPLETE — LOW risk; injection gate sound | Wolverine | Report: `governance/venom/2026-05-27_venom_vport-owner-tab.md` |
| 2026-05-27 | gas | VENOM | COMPLETE — security sound; GAS-001 HIGH gap resolved by tests | Wolverine | Report: `governance/venom/2026-05-27_venom_vport-gas-tab.md` |
| 2026-05-27 | gas | SPIDER-MAN | PARTIAL — 18 tests written (ownership rejection, citizen path isolation) | Wolverine | File: `controller/gas/__tests__/submitFuelPriceSuggestion.controller.test.js` |
| 2026-05-27 | all | ARCHITECT | DTAB-001 confirmed (MEDIUM — registry divergence) | Wolverine | Report: `governance/architect/2026-05-27_architect_vport-dtab-001-duplicate-registry.md` |
| 2026-05-27 | book | SPIDER-MAN | BOOK-002 RESOLVED — 20 tests; kind-gate + guest booking + guards | Wolverine | File: `controller/__tests__/vportPublicBooking.controller.test.js` |
| 2026-05-27 | book | CARNAGE | BOOK-001 proposal written — slot collision DB constraint proposal | Wolverine | File: `governance/carnage/2026-05-27_carnage_book-slot-collision-proposal.md` |
| 2026-05-27 | all | DTAB-001 | vportTypeRegistry.js deprecated + Beauty & Wellness preset fixed | Wolverine | File: `vportTypeRegistry.js` — deprecation header + GROUP_TABS aligned |
| 2026-05-27 | book | CARNAGE+WOLVERINE | BOOK-001 RESOLVED — slot collision index applied + 23505 DAL handler + regression tests | Wolverine | Migration: `20260527010000_vport_bookings_slot_collision_index.sql`; 14 DAL tests + 5 controller tests + 3 engine tests added |

---

## Duplicate Tab System Detection

| Finding | Severity | Files Involved | Status |
|---|---|---|---|
| `vportTypeRegistry.js` duplicates `getVportTabsByType.model.js` logic | MEDIUM | `vportTypeRegistry.js` vs `model/getVportTabsByType.model.js` | **CONFIRMED** 2026-05-27 — registry diverged, 1 dev-only caller, safe to delete |
| `model/gas/getVportTabsByType.model.js` is a redirect shim | LOW | `model/gas/getVportTabsByType.model.js` | DEFERRED — P4 |
| `VportServicesView` may exist under both `screens/views/tabs/` and `screens/services/view/` | UNVERIFIED | Requires ARCHITECT audit | NOT_STARTED |

---

## Dead / Unreachable Tab Detection

| Finding | Severity | Evidence | Status |
|---|---|---|---|
| `contact` tab — key registered but no view component found | MEDIUM | Not in `VportProfileTabContent.jsx` switch | CONFIRMED NOT_STARTED |
| `gallery` tab — not in any preset; not in tab content switch | LOW | No view component found | CONFIRMED NOT_STARTED |
| `owner` tab not in any preset array | INFO | Injected dynamically — intentional design | NOT A BUG |

---

## Tabs Missing Adapter Boundary (Unverified)

The following tabs may be importing cross-feature internals directly rather than through approved adapter paths. Each requires an ARCHITECT audit to confirm:

| Tab | Import Risk | Adapter Path Expected |
|---|---|---|
| `book` | HIGH | `features/profiles/adapters/kinds/vport/screens/booking/` |
| `portfolio` | MEDIUM | `features/profiles/adapters/kinds/vport/screens/portfolio/` |
| `menu` | MEDIUM | `features/profiles/adapters/kinds/vport/screens/menu/` |
| `team` | MEDIUM | `features/profiles/adapters/kinds/vport/screens/team/` |
| `content` | LOW | `features/profiles/adapters/kinds/vport/screens/content/` |
| `vibes` | LOW | `features/profiles/adapters/kinds/vport/screens/vibes/` |
