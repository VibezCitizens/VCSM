# VPORT Tab Governance System

**Path:** `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/architect/VPORT/TABS/`
**Domain:** VCSM — VPORT profile tabs only
**Created:** 2026-05-27
**Status:** ACTIVE — authoritative governance root for all VPORT tab systems

---

## What This System Is

This directory is the canonical governance, architecture, and audit tracking root for every tab that appears on a **VPORT public profile** in VCSM.

It is **not** about:
- Citizen (user) profile tabs
- Social feed tabs
- Inbox tabs
- Dashboard management screens
- Settings pages unrelated to public surfaces

---

## What Qualifies as a VPORT Tab

A **VPORT tab** is a content section that appears on the **public-facing VPORT profile** (`/profile/:actorId?tab=<key>`) inside the `VportProfileTabs` navigation bar, and whose content is rendered by `VportProfileTabContent`.

### Inclusion Criteria

All of the following must be true:

1. The tab key appears in at least one `VPORT_*_TABS` layout array **or** in `getVportTabsByType.model.js`
2. The tab has a corresponding entry in `profileTabs.config.js`
3. The tab is rendered inside `VportProfileViewScreen.jsx` (not a standalone dashboard screen)
4. The tab's content view is under `features/profiles/kinds/vport/screens/` or a cross-feature adapter

### Explicit Exclusions

| Excluded Item | Why |
|---|---|
| Citizen/user profile tabs | Different profile system — not VPORT |
| `/actor/:actorId/dashboard/*` screens | These are owner-only management screens, not public tabs |
| Social feed (`/feed`) | Not a VPORT tab |
| Inbox / chat | Not a VPORT tab |
| Settings (`/actor/:actorId/settings`) | Admin surface, not a public tab |
| `VportDashboardExchangeScreen` | Dashboard card — not a public tab |
| Owner band (`VportBarberShopOwnerBand`) | UI overlay, not a tab |

---

## Dashboard Cards vs Public Tabs

This distinction is critical. **Do not confuse them.**

| Concept | Location | Purpose | Access |
|---|---|---|---|
| **Public Tab** | `/profile/:actorId?tab=<key>` | Visitor-facing content section | Public (with privacy gate) |
| **Dashboard Card / Screen** | `/actor/:actorId/dashboard/<section>` | Owner management surface | Protected — owner only |

Some content is shared between both contexts via adapters. For example, `VportRatesView` renders rate data in both the public rates tab and is referenced from dashboard context. But the **tab** is the public surface. The **dashboard screen** is the management surface.

---

## Tab Count and Taxonomy

**Total VPORT tabs:** 16 (including `owner` which is owner-only)

| Key | Label | Availability |
|---|---|---|
| `about` | About | All types |
| `book` | Book | Service types |
| `content` | Content | Most types |
| `gas` | Gas Prices | Gas station only |
| `menu` | Menu | Food/hospitality types |
| `owner` | Owner | Owner only (dynamically injected) |
| `photos` | Photos | Most types |
| `portfolio` | Portfolio | Creative/trade types |
| `rates` | Rates | Exchange only |
| `reviews` | Reviews | All types |
| `services` | Services | Service-based types |
| `subscribers` | Subscribers | Most types |
| `team` | Team | Barbershop only |
| `vibes` | Vibes | Most types |
| `contact` | Contact | Not yet implemented |
| `gallery` | Gallery | Planned (maps to photos) |

---

## How Tab Presets Work

Tab presets are ordered arrays of tab keys assigned per VPORT type or group. Resolution is:

```
Requested type → TYPE_TABS override? → Yes → use it
                                     → No  → GROUP_TABS for category? → Yes → use it
                                                                       → No  → VPORT_TABS (global fallback)
```

**Type overrides** (highest priority — exact match on vport kind):
- `barber` → `VPORT_BARBER_TABS`
- `barbershop` → `VPORT_BARBERSHOP_TABS`
- `locksmith` → `VPORT_BARBER_TABS` (reuses barber preset)
- `gas station` → `VPORT_GAS_TABS` (gas always first by design)
- `exchange` / `money exchange` → `VPORT_RATES_TABS`

**Group defaults** (fallback per type category):
- Beauty & Wellness → `VPORT_SERVICE_BOOK_TABS`
- Food, Hospitality & Events → `VPORT_FOOD_TABS`
- Arts, Media & Entertainment → `VPORT_CREATIVE_TABS`
- Health & Medical → `VPORT_HEALTH_TABS`
- Home, Maintenance & Trades → `VPORT_TRADES_TABS`
- Professional & Business Services → `VPORT_SERVICE_TABS`
- Retail, Sales & Commerce → `VPORT_RETAIL_TABS`
- Others → `VPORT_TABS` (global fallback)

**Feature flags** (`TAB_FLAGS` in `profileTabs.config.js`):
- Currently: SERVICES, RATES, PORTFOLIO, BOOK all `true`
- Setting any to `false` removes it from ALL layouts globally

---

## Governance Lifecycle

Each tab progresses through the following states:

| Status | Meaning |
|---|---|
| `NOT_STARTED` | No governance work done |
| `IN_PROGRESS` | Actively being audited |
| `PARTIAL` | Some governance done, gaps remain |
| `VERIFIED` | All required checks passed for current scope |
| `COMPLETE` | Fully audited, documented, tested, release-approved |
| `BLOCKED` | Cannot proceed — blocker identified |
| `DEFERRED` | Known gaps, intentionally postponed |

---

## Required Audit Commands Per Tab

A tab is `COMPLETE` only when all of the following have been run and have no blocking findings:

| Command | What It Checks | Required For |
|---|---|---|
| **VENOM** | Trust boundaries, identity exposure, auth gates | All tabs with writes or identity data |
| **ARCHITECT** | Layer separation, adapter usage, dependency flow | All tabs |
| **KRAVEN** | DB read count, waterfall patterns, cache efficiency | All tabs with DAL reads |
| **SENTRY** | Architecture contract compliance | All tabs with controllers or DAL imports |
| **SPIDER-MAN** | Regression test coverage | All tabs with controller/hook write paths |
| **LOGAN** | Canonical documentation exists and is current | All tabs |
| **THOR** | Release gate sign-off | Only at release time |

---

## Release Readiness Requirements

A tab is release-ready when:
1. VENOM: No HIGH or CRITICAL findings
2. ARCHITECT: No CONTRACT VIOLATION or MAJOR DRIFT
3. KRAVEN: No CRITICAL findings; HIGH findings have mitigation plan
4. SENTRY: ALIGNED or MINOR DRIFT with P3 deferred plan
5. SPIDER-MAN: CLEAN (critical paths protected)
6. LOGAN: Canonical doc exists and is current
7. THOR: RELEASE APPROVED

---

## File Structure Per Tab

Each `tabs/<tab-name>/` folder contains:

| File | Purpose |
|---|---|
| `README.md` | What this tab is, what types use it, file map, data contract |
| `audit-status.md` | Per-command audit status and latest findings summary |
| `findings.md` | All open findings (VENOM, ARCHITECT, KRAVEN, SENTRY, SPIDER-MAN) |
| `performance.md` | KRAVEN performance notes, DB read counts, waterfall analysis |
| `security.md` | VENOM security notes, trust boundaries, identity exposure |
| `ownership.md` | Who owns this tab, which VPORT types, adapter paths |
| `release-status.md` | Current release readiness, blockers, last THOR assessment |

---

## Key Source Files

| File | Role |
|---|---|
| `features/profiles/config/profileTabs.config.js` | Master tab catalog + TAB_FLAGS |
| `features/profiles/kinds/vport/model/getVportTabsByType.model.js` | Type → tab preset resolution |
| `features/profiles/kinds/vport/config/vportTypes.config.js` | Type groups and categories |
| `features/profiles/kinds/vport/vportTypeRegistry.js` | Legacy registry (duplicate — see deferred items) |
| `features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx` | Tab state management + owner injection |
| `features/profiles/kinds/vport/screens/components/VportProfileTabContent.jsx` | Tab content dispatcher |
| `features/profiles/kinds/vport/ui/tabs/VportProfileTabs.jsx` | Tab navigation bar UI |

---

## Index of Governance Documents

| Document | Purpose |
|---|---|
| `vport-tab-governance-matrix.md` | Full cross-tab audit status matrix |
| `vport-tab-registry.md` | Tab registry — all tabs, keys, types, presets |
| `pending-full-audits.md` | Tabs requiring full audit cycles |
| `deferred-open-items.md` | Known issues intentionally deferred |
| `type-presets/*.md` | Per-type preset documentation |
| `tabs/<name>/*.md` | Per-tab governance files |
| `governance/<command>/*.md` | Per-command governance records |
