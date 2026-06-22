# VPORT Architecture Folder Gap Report

**Generated:** 2026-06-02  
**Compared:** Source features vs `DASHBOARD/modules/` and `TABS/tabs/`  
**Constraint:** Read-only pass — no folders created

---

## Legend

| Classification | Meaning |
|---|---|
| `HAS_DASHBOARD_FOLDER` | Module folder exists at `DASHBOARD/modules/[name]/` |
| `HAS_TABS_FOLDER` | Tab folder exists at `TABS/tabs/[name]/` |
| `HAS_PARTIAL_FOLDER` | Folder exists but does not isolate this feature — coverage is merged with another module |
| `MISSING_FOLDER` | No governance folder exists for this feature anywhere |
| `WRONG_LOCATION` | Folder exists but was placed under the wrong root (DASHBOARD vs TABS) |
| `DUPLICATE_OR_OVERLAPPING_FOLDER` | Two or more folders track the same source feature |
| `NEEDS_SPLIT` | A single governance folder covers two logically separate surfaces (should become two isolated folders) |
| `STRUCTURAL_GAP` | The governance system itself is missing required tracking columns or files |

---

## Section 1 — DASHBOARD Module Folder Coverage

### Confirmed HAS_DASHBOARD_FOLDER (25 modules)

| Module Folder | Source Path(s) Covered | Notes |
|---|---|---|
| `modules/dashboard/` | `dashboard/vport/` (shell, controller, dal, screens) | ✓ Covers dashboard shell |
| `modules/dashboard-cards/` | `dashboard/vport/dashboard/cards/settings/` | ✓ Covers settings card variant panel |
| `modules/leads/` | `dashboard/vport/dashboard/cards/leads/` | ✓ |
| `modules/exchange/` | `dashboard/vport/dashboard/cards/exchange/` | ✓ |
| `modules/gas/` | `dashboard/vport/dashboard/cards/gasprices/` | ✓ Name mismatch: folder=`gas`, source dir=`gasprices` — tracked correctly in registry |
| `modules/menu/` | `dashboard/vport/dashboard/cards/` (no dedicated menu card dir found) + `public/vportMenu/` (owner side) | ⚠ Public menu is a separate surface — see NEEDS_SPLIT below |
| `modules/services/` | `dashboard/vport/dashboard/cards/services/` + `profiles/kinds/vport/controller/services/` | ✓ Covers both owner card and profile kind |
| `modules/booking/` | `dashboard/vport/dashboard/cards/bookings/` + booking engine | ✓ |
| `modules/reviews/` | `dashboard/vport/dashboard/cards/reviews/` + `profiles/kinds/vport/controller/review/` | ✓ |
| `modules/subscribers/` | `profiles/kinds/vport/controller/subscribers/` + `hooks/subscribers/` | ✓ BLOCKED status |
| `modules/availability/` | `dashboard/vport/dal/read/vportAvailabilityRules.read.dal.js` | ✓ |
| `modules/barber/` | `profiles/kinds/vport/controller/barbershop/` (barber-specific paths) | ✓ WATCH status |
| `modules/barbershop/` | `profiles/kinds/vport/controller/barbershop/` + `dal/barbershop/` + `screens/barbershop/` | ✓ WATCH status |
| `modules/locksmith/` | `profiles/kinds/vport/controller/locksmith/` + `dal/locksmith/` + `dashboard/vport/dashboard/cards/locksmith/` | ✓ WATCH status |
| `modules/restaurant/` | `profiles/kinds/vport/controller/menu/` + `dal/menu/` + `hooks/menu/` + `model/menu/` + `screens/menu/` | ✓ PARTIAL status |
| `modules/portfolio/` | `dashboard/vport/dashboard/cards/portfolio/` + `profiles/kinds/vport/controller/portfolio/` | ✓ PARTIAL status |
| `modules/exchange-profile/` | `profiles/kinds/vport/controller/exchange/` + `dal/exchange/` + rates path | ✓ PARTIAL status |
| `modules/tripoint/` | External domain API (spec-only) | ✓ BLOCKED status |
| `modules/team/` | `dashboard/vport/dashboard/cards/team/` + `dal/vportTeam.read.dal.js` | ✓ |
| `modules/settings/` | `dashboard/vport/dashboard/cards/settings/` + `settings/vports/` (partial) | ✓ |
| `modules/content-pages/` | `profiles/kinds/vport/controller/content/` + `dal/content/` | ✓ BLOCKED status |
| `modules/tab-classification/` | `profiles/kinds/vport/config/` + `ui/tabs/` + `model/getVportTabsByType.model.js` | ✓ Covers vportTypeRegistry.js deprecation |
| `modules/delete-lifecycle/` | Cross-cutting delete controllers/DALs | ✓ BLOCKED status |
| `modules/external-site/` | Supabase Edge Functions | ✓ BLOCKED status |
| `modules/schedule/` | `dashboard/vport/dashboard/cards/schedule/` | ✓ |
| `modules/calendar/` | `dashboard/vport/dashboard/cards/calendar/` | ✓ |

---

### MISSING_FOLDER — DASHBOARD (6 features without governance)

| Feature | Source Path | Why It Needs Its Own Folder | Risk |
|---|---|---|---|
| **flyer-builder** | `dashboard/flyerBuilder/` (full feature: controller, dal, hooks, model, screens, designStudio subsystem) | Owner-only dashboard tool with its own controller+DAL+DB layer. Large subsystem (designStudio has canvas, sidebar, topbar). No security audit on ownership gate or media upload paths. | HIGH |
| **qrcode** | `dashboard/qrcode/` (adapters, components) | Dashboard QR code generation and sharing. Generates links that contain VPORT identity. No audit on what identity data is embedded in QR payloads. | MEDIUM |
| **vport-core** | `features/vport/` (adapters, controller, dal, hooks, model, public, screens, utils) | Core VPORT identity feature — actor kind, identity resolution, public view scaffold. Not covered by any dashboard card module or kind-specific module. Likely cross-cutting. | HIGH |
| **join** | `features/join/` (controllers: joinBarbershopAccount, joinBarbershopQr; dal: joinInvite; hooks: useJoinBarbershop; screens) | Ownership-establishment flow. A barber joining a barbershop VPORT is a high-trust operation. Controller paths touch ownership and invite validation. Active on current branch (vport-booking-feed-security-updates). | HIGH |
| **invite** | `features/invite/` (controller, dal, hooks, screens) | Invite issuance and acceptance. Cross-feature trust boundary. Shares DAL layer with join (joinInvite.dal.js). No security audit. | HIGH |
| **settings-vports** | `features/settings/vports/` (controller, dal, hooks, model, ui) | VPORT-specific settings management layer — separate from the dashboard settings card. Handles visibility, privacy, and business configuration writes. Partial overlap with DASHBOARD.settings but not explicitly covered. | MEDIUM |

---

## Section 2 — TABS Folder Coverage

### Confirmed HAS_TABS_FOLDER (15 tabs, path: `TABS/tabs/`)

| Tab Folder | Source Path(s) Covered | Notes |
|---|---|---|
| `tabs/about/` | `profiles/kinds/vport/screens/views/` | ✓ |
| `tabs/booking/` | `profiles/kinds/vport/screens/booking/` | ✓ Note: folder is `booking` but governance matrix key is `book` — consistent, tracked |
| `tabs/contact/` | Not yet implemented | ✓ Placeholder folder exists |
| `tabs/content/` | `profiles/kinds/vport/screens/content/` | ✓ |
| `tabs/gallery/` | Not yet implemented (planned) | ⚠ See CONTRADICTION below — "photos" tab row in matrix may refer to this folder |
| `tabs/gas-prices/` | Gas prices adapter screen | ✓ Note: folder is `gas-prices`, matrix key is `gas` — tracked |
| `tabs/menu/` | `profiles/kinds/vport/screens/menu/` | ✓ |
| `tabs/owner/` | `profiles/kinds/vport/screens/owner/` | ✓ |
| `tabs/portfolio/` | `profiles/kinds/vport/screens/portfolio/` | ✓ |
| `tabs/rates/` | `profiles/kinds/vport/screens/rates/` + `dal/rates/` + `model/rates/` | ✓ |
| `tabs/reviews/` | `profiles/kinds/vport/screens/review/` | ✓ |
| `tabs/services/` | `profiles/kinds/vport/screens/services/` | ✓ |
| `tabs/subscribers/` | `profiles/kinds/vport/screens` (views layer) | ✓ |
| `tabs/team/` | `profiles/kinds/vport/screens/barbershop/` + team membership views | ✓ |
| `tabs/vibes/` | `profiles/kinds/vport/screens/views/` (social vibes slice) | ✓ |

---

### MISSING_FOLDER — TABS (3 features without governance)

| Feature | Source Path | Why It Needs Its Own Folder | Risk |
|---|---|---|---|
| **public-vport-business-card** | `public/vportBusinessCard/` (controller, dal, hooks, model, screen, view) | Full standalone feature exposing public VPORT identity. Separate from profile tabs — unauthenticated rendering. No security audit on what data is exposed without auth. | HIGH |
| **public-vport-menu** | `public/vportMenu/` (adapters, components, controller, dal, hooks, model, screen, view) | Unauthenticated QR-accessed public menu display. Separate public surface from the owner-side menu management (DASHBOARD.menu). Different trust boundary, different DAL paths, needs isolated coverage. | HIGH |
| **vport-profile-header** | `profiles/kinds/vport/ui/vportprofileheader/` | VPORT profile header component renders identity data (name, type, location, hours) to all public viewers. No audit on what fields are exposed. Shared across all profile tabs. | MEDIUM |

---

## Section 3 — Features That Should Exist in BOTH Trees (Split Required)

| Feature | Dashboard Folder | Tabs Folder | Issue |
|---|---|---|---|
| **menu** | `DASHBOARD/modules/menu/` ✓ covers owner writes | `TABS/tabs/menu/` ✓ covers public tab view | Currently split correctly. BUT `public/vportMenu/` (the unauthenticated public surface) has no folder in either tree. Needs TABS/tabs/public-menu/ isolated folder. |
| **reviews** | `DASHBOARD/modules/reviews/` ✓ covers owner-side + engine | `TABS/tabs/reviews/` ✓ covers tab view | Correctly split. Verify that `features/reviews/` (root-level, apparently empty directory) is not a separate feature. |
| **portfolio** | `DASHBOARD/modules/portfolio/` ✓ covers owner writes | `TABS/tabs/portfolio/` ✓ covers public tab view | Correctly split. Verify adapter boundary per TABS governance matrix finding. |
| **services** | `DASHBOARD/modules/services/` ✓ | `TABS/tabs/services/` ✓ | Correctly split. |
| **subscribers** | `DASHBOARD/modules/subscribers/` ✓ (BLOCKED) | `TABS/tabs/subscribers/` ✓ | Correctly split. Dashboard module is BLOCKED (BW-SUB-003). Tab folder is NOT_STARTED. Same BW finding affects both surfaces. |

---

## Section 4 — Stale, Duplicate, or Conflicting Folders

### CONTRADICTION: photos tab vs gallery folder

| Finding | Severity | Detail |
|---|---|---|
| `TABS/tabs/gallery/` exists on disk but `vport-tab-governance-matrix.md` has a separate "Photos" row (key: `photos`) | MEDIUM | The governance matrix tracks both "Photos" (key=photos, implemented) and "Gallery" (key=gallery, planned). The only folder on disk is `gallery/`. Either: (a) the `gallery/` folder IS the photos tab (misnaming), or (b) there should be a `photos/` folder and `gallery/` is separate. Governance matrix notes say "Gallery — Planned — may map to photos tab", suggesting they might be merged. This is a contradiction that requires resolution before any audit. |
| Matrix "Photos" tab row: "Photo gallery; upload/media pipeline" — key=`photos` | — | If photos is the real implemented feature, the folder should be `photos/` not `gallery/`. |
| Matrix "Gallery" tab row: "Planned — may map to photos tab" — key=`gallery` | — | If gallery merges into photos, the `gallery/` folder should either be renamed to `photos/` or the matrix row for gallery should be removed. |
| **Resolution needed:** Verify which tab key is used in `VportProfileTabContent.jsx` and `getVportTabsByType.model.js` | — | Use ARCHITECT audit to resolve. |

### Duplicate Registry Detection (Already Logged)

| Finding | Severity | Detail | Status |
|---|---|---|---|
| `vportTypeRegistry.js` duplicates `getVportTabsByType.model.js` | MEDIUM | Covered under `DASHBOARD/modules/tab-classification/` | DTAB-001: deprecation header added; still needs deletion |
| `model/gas/getVportTabsByType.model.js` is a redirect shim | LOW | Covered under tab-classification findings | DEFERRED P4 |

---

## Section 5 — Structural Gap: TABS Governance Missing ELEKTRA and BLACKWIDOW

**This is the most significant structural gap found.**

The `TABS/vport-tab-governance-matrix.md` tracks these columns:
```
VENOM | ARCHITECT | KRAVEN | SENTRY | SPIDER-MAN | LOGAN | THOR
```

The `DASHBOARD/vport-dashboard-governance-matrix.md` tracks these columns:
```
VENOM | ELEKTRA | BLACKWIDOW | ARCHITECT | KRAVEN | SENTRY | SPIDER-MAN | LOGAN | THOR
```

**ELEKTRA and BLACKWIDOW are completely absent from the TABS governance matrix.**

This means:
- No TABS module has ever received an ELEKTRA precision scan
- No TABS module has ever received a BLACKWIDOW adversarial runtime test
- The TABS triad is structurally incomplete — not just unstated, but untrackable in the current matrix
- All 15 active tabs have a TRIAD_NOT_STARTED for the full security triad, regardless of VENOM status

**Required action:** Add ELEKTRA and BLACKWIDOW columns to `TABS/vport-tab-governance-matrix.md` and to the `audit-status.md` template inside each tab folder. This must happen before any tab audit can be called TRIAD_COMPLETE.

---

## Section 6 — Summary Counts

| Classification | Count | Features |
|---|---|---|
| HAS_DASHBOARD_FOLDER | 25 | All existing modules |
| HAS_TABS_FOLDER | 15 | All existing tab folders |
| MISSING_FOLDER (DASHBOARD) | 6 | flyer-builder, qrcode, vport-core, join, invite, settings-vports |
| MISSING_FOLDER (TABS) | 3 | public-vport-business-card, public-vport-menu, vport-profile-header |
| HAS_PARTIAL_FOLDER | 3 | menu (public surface missing), settings (vports feature uncovered), availability (dal coverage only) |
| NEEDS_SPLIT | 1 | menu (owner vs public surfaces are already split but public-vportMenu has no TABS folder) |
| CONTRADICTION | 1 | photos/gallery tab naming conflict |
| STRUCTURAL_GAP | 1 | TABS governance matrix missing ELEKTRA + BLACKWIDOW columns |
| DUPLICATE_OR_OVERLAPPING | 2 | vportTypeRegistry.js (tracked), gas getVportTabsByType shim (tracked) |

---

## Section 7 — Recommended Structural Fixes (Not Code Changes)

These are architecture governance fixes only — no source code changes:

1. **Add ELEKTRA + BLACKWIDOW columns** to `TABS/vport-tab-governance-matrix.md`
2. **Add ELEKTRA + BLACKWIDOW fields** to each `TABS/tabs/*/audit-status.md` file
3. **Resolve photos/gallery contradiction** — run ARCHITECT on tab content switch to determine correct key, then rename/remove accordingly
4. **Create 9 missing folders** (6 DASHBOARD + 3 TABS) — see `VPORT_FOLDER_BUILD_PLAN.md`
5. **Verify `features/reviews/` and `features/portfolio/` root directories** are not standalone features — they appear as empty directories (no subdirs), likely scaffolding stubs, not active features requiring separate coverage
