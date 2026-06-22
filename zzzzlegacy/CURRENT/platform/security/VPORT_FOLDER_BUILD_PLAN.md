# VPORT Folder Build Plan

**Generated:** 2026-06-02  
**Status:** Plan only — no folders created until explicitly authorized  
**Source:** `VPORT_FEATURE_INVENTORY.md` + `VPORT_ARCHITECTURE_FOLDER_GAP_REPORT.md` + `VPORT_TRIAD_COVERAGE_MATRIX.md`

---

## Naming Convention

All new folders follow the exact same 9-file governance structure as existing modules:

```
[feature-name]/
├── README.md
├── audit-status.md
├── triad.md
├── findings.md
├── security.md
├── ownership.md
├── architecture.md
├── performance.md
└── release-status.md
```

**Note on TABS path:** The existing TABS structure uses `TABS/tabs/[name]/`. The task specifies a new path `TABS/modules/[name]/` for features that are not pure tab surfaces (public views, profile infrastructure). This document uses `TABS/modules/` for net-new non-tab features. Existing `TABS/tabs/` folders are not renamed.

---

## Structural Fix Required Before New Folders Are Created

### Fix 1 — Add ELEKTRA and BLACKWIDOW to TABS governance matrix (prerequisite)

**File:** `TABS/vport-tab-governance-matrix.md`  
**Action:** Add `ELEKTRA` and `BLACKWIDOW` columns between `VENOM` and `ARCHITECT`  
**Also required:** Update `audit-status.md` template in each of the 15 `TABS/tabs/*/` folders to add ELEKTRA and BLACKWIDOW tracking rows  
**Why first:** Without these columns, no tab audit can be called TRIAD_COMPLETE. All new module folders for TABS will also use 9-command audit tracking from creation.

### Fix 2 — Resolve photos/gallery contradiction (prerequisite for those folders)

**Action:** Read `VportProfileTabContent.jsx` tab content switch and `getVportTabsByType.model.js` to confirm which key (`photos` vs `gallery`) is active. Then either:
- Rename `TABS/tabs/gallery/` to `TABS/tabs/photos/` and update governance matrix row, or
- Remove the "Photos" row from the governance matrix and accept `gallery/` as the canonical folder
**Command:** ARCHITECT

---

## Priority Group 1 — Critical: Features with Active Security Risk (Build First)

### New Folder 1: DASHBOARD/modules/join/

```
Feature:          join
Source Path:      apps/VCSM/src/features/join/
Target Folder:    DASHBOARD/modules/join/
Route/Surface:    /join/barbershop + QR join flow (DASHBOARD onboarding)
Dashboard/Tab:    DASHBOARD
Public/Owner:     Owner (ownership-establishment for barber joining barbershop)
VPORT Kind Scope: BARBERSHOP
VENOM Status:     NOT_STARTED
ELEKTRA Status:   NOT_STARTED
BLACKWIDOW Status: NOT_STARTED
Triad Status:     TRIAD_NOT_STARTED
Risk Level:       HIGH
Current Blockers: None
Next Command:     VENOM
Reason:           Ownership-establishment flow. joinBarbershopAccount + joinBarbershopQr controllers
                  create actor→VPORT ownership records. joinInvite.dal.js crosses feature
                  boundary with invite feature. Active on current branch. No auth audit exists.
```

**Files to create:**

`README.md` — Feature: join. Source: features/join/. Route: /join/barbershop. Surface: DASHBOARD. Kind scope: BARBERSHOP. Ownership-establishment flow — barber joins existing barbershop VPORT via account link or QR code. Shares invite DAL with features/invite/.

`audit-status.md` — All 9 commands: NOT_STARTED. VENOM recommended first.

`triad.md` — VENOM: NOT_STARTED. ELEKTRA: NOT_STARTED. BLACKWIDOW: NOT_STARTED. Status: TRIAD_NOT_STARTED.

`findings.md` — No findings yet. Opens after first VENOM run.

`security.md` — Key trust questions: (1) Can a barber join a VPORT they don't own without proper owner approval? (2) Is the QR join path protected against replay/forgery? (3) Does joinInvite.dal.js validate invite ownership before consumption? (4) Is there a race between invite issuance and acceptance?

`ownership.md` — Module: join. Owner: VPORT BARBERSHOP team. VPORT Kind: BARBERSHOP only. Dashboard surface.

`architecture.md` — Source: features/join/ (controllers, dal, hooks, screens). Crosses into features/invite/. Writes actor_owners or equivalent ownership table. QR path uses invite token + barbershop VPORT ID.

`performance.md` — Not yet assessed. KRAVEN pending.

`release-status.md` — NOT REVIEWED. THOR: NOT_STARTED.

---

### New Folder 2: DASHBOARD/modules/invite/

```
Feature:          invite
Source Path:      apps/VCSM/src/features/invite/
Target Folder:    DASHBOARD/modules/invite/
Route/Surface:    Invite issuance and acceptance flows
Dashboard/Tab:    DASHBOARD
Public/Owner:     Owner (invite issuer) + limited public (invite recipient link)
VPORT Kind Scope: BARBERSHOP (primary) + ALL (general invite infrastructure)
VENOM Status:     NOT_STARTED
ELEKTRA Status:   NOT_STARTED
BLACKWIDOW Status: NOT_STARTED
Triad Status:     TRIAD_NOT_STARTED
Risk Level:       HIGH
Current Blockers: None
Next Command:     VENOM
Reason:           Invite tokens are trust artifacts. Acceptance writes ownership or membership
                  records. Shares DAL with join feature. No audit on invite token integrity,
                  expiry, or consumption idempotency.
```

**Files to create:**

`README.md` — Feature: invite. Source: features/invite/. Surface: DASHBOARD + public link. Invite issuance (owner creates invite) and acceptance (recipient claims invite). Shares joinInvite.dal.js with features/join/.

`audit-status.md` — All 9 commands: NOT_STARTED. VENOM recommended first.

`triad.md` — VENOM: NOT_STARTED. ELEKTRA: NOT_STARTED. BLACKWIDOW: NOT_STARTED. Status: TRIAD_NOT_STARTED.

`findings.md` — No findings yet.

`security.md` — Key trust questions: (1) Are invite tokens single-use and expiry-enforced at DAL level? (2) Can an invite be accepted by a different actor than intended? (3) Is there ownership validation before invite issuance (can only a VPORT owner issue invites)? (4) Is there a path to invite enumeration?

`ownership.md` — Module: invite. Owner: VPORT BARBERSHOP team. Kind scope: BARBERSHOP primary.

`architecture.md` — Source: features/invite/. Shares dal/joinInvite.dal.js with features/join/. Invite token lifecycle: creation → delivery → acceptance → consumption.

`performance.md` — Not yet assessed.

`release-status.md` — NOT REVIEWED. THOR: NOT_STARTED.

---

### New Folder 3: TABS/modules/public-vport-business-card/

```
Feature:          public-vport-business-card
Source Path:      apps/VCSM/src/features/public/vportBusinessCard/
Target Folder:    TABS/modules/public-vport-business-card/
Route/Surface:    Public unauthenticated VPORT business card display
Dashboard/Tab:    PUBLIC (unauthenticated)
Public/Owner:     PUBLIC only
VPORT Kind Scope: ALL
VENOM Status:     NOT_STARTED
ELEKTRA Status:   NOT_STARTED
BLACKWIDOW Status: NOT_STARTED
Triad Status:     TRIAD_NOT_STARTED
Risk Level:       HIGH
Current Blockers: None
Next Command:     VENOM
Reason:           Full feature with controller, DAL, hooks, model, screen, view — all serving
                  unauthenticated viewers. What VPORT fields are exposed? Is there a data
                  minimization gate? Can identity data be scraped via this surface?
```

**Files to create:**

`README.md` — Feature: public-vport-business-card. Source: features/public/vportBusinessCard/. Surface: PUBLIC (unauthenticated). Renders a condensed VPORT identity card for public/shared links. Has its own controller/DAL/model stack.

`audit-status.md` — All 9 commands: NOT_STARTED. VENOM recommended first.

`triad.md` — VENOM: NOT_STARTED. ELEKTRA: NOT_STARTED. BLACKWIDOW: NOT_STARTED. Status: TRIAD_NOT_STARTED.

`findings.md` — No findings yet.

`security.md` — Key trust questions: (1) Which fields does the DAL select for unauthenticated viewers? (2) Is there a data minimization policy compared to authenticated view? (3) Can the business card link expose internal IDs or actor identifiers? (4) Is there rate-limiting on the public read path?

`ownership.md` — Module: public-vport-business-card. Surface: PUBLIC. No owner auth required.

`architecture.md` — Source: features/public/vportBusinessCard/. Full MVC stack (controller, dal, model, view). Separate from profile tab views.

`performance.md` — Not yet assessed.

`release-status.md` — NOT REVIEWED. THOR: NOT_STARTED.

---

### New Folder 4: TABS/modules/public-vport-menu/

```
Feature:          public-vport-menu
Source Path:      apps/VCSM/src/features/public/vportMenu/
Target Folder:    TABS/modules/public-vport-menu/
Route/Surface:    Public QR-accessed unauthenticated menu display
Dashboard/Tab:    PUBLIC (unauthenticated, QR entry)
Public/Owner:     PUBLIC only
VPORT Kind Scope: RESTAURANT + food-adjacent types
VENOM Status:     NOT_STARTED
ELEKTRA Status:   NOT_STARTED
BLACKWIDOW Status: NOT_STARTED
Triad Status:     TRIAD_NOT_STARTED
Risk Level:       HIGH
Current Blockers: None
Next Command:     VENOM
Reason:           DIFFERENT surface from DASHBOARD.menu (owner writes) and TABS.menu (profile tab).
                  This is the unauthenticated QR-scan landing page. Full own feature stack.
                  No audit on what menu data is exposed, whether category/item IDs are exposed
                  in the public response, or whether the public read has proper scope limiting.
```

**Files to create:**

`README.md` — Feature: public-vport-menu. Source: features/public/vportMenu/. Surface: PUBLIC (unauthenticated QR entry). Separate from DASHBOARD.menu (owner management) and TABS.menu (profile tab). This is the QR scan destination for restaurant customers.

`audit-status.md` — All 9 commands: NOT_STARTED. VENOM recommended first.

`triad.md` — VENOM: NOT_STARTED. ELEKTRA: NOT_STARTED. BLACKWIDOW: NOT_STARTED. Status: TRIAD_NOT_STARTED.

`findings.md` — No findings yet.

`security.md` — Key trust questions: (1) Does the public menu DAL select only public-safe fields (no internal IDs, actor_ids in response)? (2) Is access scoped to published menus only (no draft items visible)? (3) Is the menu accessible before the VPORT is live/published? (4) Can QR link expose internal VPORT identifiers in the URL?

`ownership.md` — Module: public-vport-menu. Surface: PUBLIC. Restaurant kind scope.

`architecture.md` — Source: features/public/vportMenu/. Full MVC stack. QR entry point. Related to DASHBOARD.menu (owner writes) and TABS.menu (authenticated profile view) but is a distinct surface.

`performance.md` — Not yet assessed.

`release-status.md` — NOT REVIEWED. THOR: NOT_STARTED.

---

## Priority Group 2 — High: Large Missing Dashboard Features

### New Folder 5: DASHBOARD/modules/flyer-builder/

```
Feature:          flyer-builder
Source Path:      apps/VCSM/src/features/dashboard/flyerBuilder/
Target Folder:    DASHBOARD/modules/flyer-builder/
Route/Surface:    /vport/dashboard/flyer (owner-only dashboard tool)
Dashboard/Tab:    DASHBOARD
Public/Owner:     OWNER
VPORT Kind Scope: ALL
VENOM Status:     NOT_STARTED
ELEKTRA Status:   NOT_STARTED
BLACKWIDOW Status: NOT_STARTED
Triad Status:     TRIAD_NOT_STARTED
Risk Level:       HIGH
Current Blockers: None
Next Command:     VENOM
Reason:           Large feature with a full subsystem (designStudio: canvasStage, sidebarRight,
                  topBar, controller, dal, hooks, model, screens). Has its own DAL — what does
                  it write? Does it expose uploaded content? Is the ownership gate enforced
                  before the canvas saves/publishes? Upload + media paths need audit.
```

**Files to create:**

`README.md` — Feature: flyer-builder (including designStudio subsystem). Source: features/dashboard/flyerBuilder/. Route: DASHBOARD. Owner-only tool for creating printable/shareable marketing materials. Contains subsystem: designStudio/ (canvas, sidebar, top bar, controller, dal, hooks, model, screens).

`audit-status.md` — All 9 commands: NOT_STARTED. VENOM recommended first.

`triad.md` — VENOM: NOT_STARTED. ELEKTRA: NOT_STARTED. BLACKWIDOW: NOT_STARTED. Status: TRIAD_NOT_STARTED.

`findings.md` — No findings yet.

`security.md` — Key trust questions: (1) Is the ownership gate checked before any DAL write in flyerBuilder or designStudio? (2) What does the DAL write — is it scoped to the current actor's VPORT? (3) Does the printable QR component embed internal IDs in generated flyer content? (4) Is there an upload path in designStudio.dal that bypasses ownership? (5) Can a flyer be saved/published for a VPORT the caller does not own?

`ownership.md` — Module: flyer-builder. Owner: VPORT Dashboard team. Kind scope: ALL. OWNER surface only.

`architecture.md` — Source: features/dashboard/flyerBuilder/ + designStudio/ subsystem. Components: printableQr, canvasStage, sidebarRight, topBar. Has controller, dal, hooks, model, screens at both feature root and designStudio level. Separate from dashboard/qrcode/.

`performance.md` — Not yet assessed. Canvas rendering performance may be KRAVEN concern.

`release-status.md` — NOT REVIEWED. THOR: NOT_STARTED.

---

### New Folder 6: DASHBOARD/modules/qrcode/

```
Feature:          qrcode
Source Path:      apps/VCSM/src/features/dashboard/qrcode/
Target Folder:    DASHBOARD/modules/qrcode/
Route/Surface:    Dashboard QR code generation/management
Dashboard/Tab:    DASHBOARD
Public/Owner:     OWNER (generation) + PUBLIC (QR link consumption)
VPORT Kind Scope: ALL
VENOM Status:     NOT_STARTED
ELEKTRA Status:   NOT_STARTED
BLACKWIDOW Status: NOT_STARTED
Triad Status:     TRIAD_NOT_STARTED
Risk Level:       MEDIUM
Current Blockers: None
Next Command:     VENOM
Reason:           QR codes encode VPORT identity data as links. What is embedded in the QR
                  payload? Is it a slug or a raw ID? (Per platform rule: raw UUIDs must never
                  appear in public URLs.) Does the flyer component embed raw IDs?
```

**Files to create:**

`README.md` — Feature: qrcode. Source: features/dashboard/qrcode/. Dashboard QR code generation tool. Has adapters, components (including flyer subcomponent). Separate from flyerBuilder (which uses printableQr). Owner generates QR; public scans QR.

`audit-status.md` — All 9 commands: NOT_STARTED. VENOM recommended first.

`triad.md` — VENOM: NOT_STARTED. ELEKTRA: NOT_STARTED. BLACKWIDOW: NOT_STARTED. Status: TRIAD_NOT_STARTED.

`findings.md` — No findings yet.

`security.md` — Key trust questions: (1) Does the QR payload use human-readable slugs or raw UUIDs? Platform rule: no raw IDs in public URLs. (2) Is there a way to enumerate VPORT profiles via QR parameter scanning? (3) Does the flyer subcomponent pass through IDs that shouldn't be in generated output?

`ownership.md` — Module: qrcode. OWNER surface for generation; PUBLIC for consumption. Kind scope: ALL.

`architecture.md` — Source: features/dashboard/qrcode/. Components include flyer subcomponent. Adapters layer. Related to features/dashboard/flyerBuilder/ (printableQr component).

`performance.md` — Not yet assessed.

`release-status.md` — NOT REVIEWED. THOR: NOT_STARTED.

---

## Priority Group 3 — Medium: Core VPORT Infrastructure

### New Folder 7: DASHBOARD/modules/vport-core/

```
Feature:          vport-core
Source Path:      apps/VCSM/src/features/vport/
Target Folder:    DASHBOARD/modules/vport-core/
Route/Surface:    Core VPORT identity resolution, public scaffold, actor management
Dashboard/Tab:    BOTH (core identity used by all surfaces)
Public/Owner:     BOTH
VPORT Kind Scope: ALL
VENOM Status:     NOT_STARTED
ELEKTRA Status:   NOT_STARTED
BLACKWIDOW Status: NOT_STARTED
Triad Status:     TRIAD_NOT_STARTED
Risk Level:       HIGH
Current Blockers: None
Next Command:     ARCHITECT (map architecture first), then VENOM
Reason:           The core vport/ feature provides adapters, controllers, dal, hooks, model,
                  public, screens, and utils used across dashboard and profile tab surfaces.
                  It is the identity foundation but has no governance coverage whatsoever.
                  ARCHITECT should map the data contract first before VENOM scans trust paths.
```

**Files to create:**

`README.md` — Feature: vport-core. Source: features/vport/. Core VPORT identity and management feature. Provides adapters, controller, dal, hooks, model, public, screens, utils used by dashboard and profile tab features. Not a card or kind-specific module — this is the underlying platform layer for VPORT identity.

`audit-status.md` — All 9 commands: NOT_STARTED. ARCHITECT recommended first.

`triad.md` — VENOM: NOT_STARTED. ELEKTRA: NOT_STARTED. BLACKWIDOW: NOT_STARTED. Status: TRIAD_NOT_STARTED.

`findings.md` — No findings yet.

`security.md` — Key trust questions: (1) What does the dal/ expose — are there public read paths with no auth scope? (2) What does the public/ subdirectory serve? (3) Are there controller paths in this feature that write ownership or identity without VPORT-kind-aware guards? (4) How does this feature relate to features/vport/dal/ vs features/dashboard/vport/dal/?

`ownership.md` — Module: vport-core. BOTH surfaces. Kind scope: ALL. Central identity layer.

`architecture.md` — Source: features/vport/ (8 subdirs: adapters, components, controller, dal, hooks, model, public, screens, utils). Relationship to dashboard/vport/ and profiles/kinds/vport/ needs ARCHITECT mapping.

`performance.md` — Not yet assessed.

`release-status.md` — NOT REVIEWED. THOR: NOT_STARTED.

---

### New Folder 8: TABS/modules/vport-profile-header/

```
Feature:          vport-profile-header
Source Path:      apps/VCSM/src/features/profiles/kinds/vport/ui/vportprofileheader/
Target Folder:    TABS/modules/vport-profile-header/
Route/Surface:    VPORT profile header rendered across all public tabs
Dashboard/Tab:    TAB (renders on all profile tab views)
Public/Owner:     BOTH
VPORT Kind Scope: ALL
VENOM Status:     NOT_STARTED
ELEKTRA Status:   NOT_STARTED
BLACKWIDOW Status: NOT_STARTED
Triad Status:     TRIAD_NOT_STARTED
Risk Level:       MEDIUM
Current Blockers: None
Next Command:     VENOM
Reason:           Renders identity fields (name, type, location, hours, media) across all public
                  tab views. Shared component means any data exposure here affects every tab.
                  No audit on field selection or data minimization for public viewers.
```

**Files to create:**

`README.md` — Feature: vport-profile-header. Source: profiles/kinds/vport/ui/vportprofileheader/. Renders above all profile tab views — name, VPORT type, location, hours, photos. Shared across all 15 tabs. Public + owner both see this.

`audit-status.md` — All 9 commands: NOT_STARTED. VENOM recommended first.

`triad.md` — VENOM: NOT_STARTED. ELEKTRA: NOT_STARTED. BLACKWIDOW: NOT_STARTED. Status: TRIAD_NOT_STARTED.

`findings.md` — No findings yet.

`security.md` — Key trust questions: (1) Which fields does the header expose for public vs authenticated viewers? (2) Are private business fields (internal IDs, contact details) guarded for public view? (3) Is there a visibility check before rendering owner-only header actions?

`ownership.md` — Module: vport-profile-header. Surface: TAB (all tabs). Kind scope: ALL. Shared component.

`architecture.md` — Source: profiles/kinds/vport/ui/vportprofileheader/. UI component layer. Renders in VportProfileViewScreen above tab content.

`performance.md` — Not yet assessed. Shared header means perf issues affect all tabs.

`release-status.md` — NOT REVIEWED. THOR: NOT_STARTED.

---

### New Folder 9: DASHBOARD/modules/settings-vports/

```
Feature:          settings-vports
Source Path:      apps/VCSM/src/features/settings/vports/
Target Folder:    DASHBOARD/modules/settings-vports/
Route/Surface:    VPORT-specific settings management layer
Dashboard/Tab:    DASHBOARD
Public/Owner:     OWNER
VPORT Kind Scope: ALL
VENOM Status:     NOT_STARTED
ELEKTRA Status:   NOT_STARTED
BLACKWIDOW Status: NOT_STARTED
Triad Status:     TRIAD_NOT_STARTED
Risk Level:       MEDIUM
Current Blockers: None
Next Command:     VENOM
Reason:           Separate from the dashboard settings CARD (DASHBOARD.settings covers the card UI).
                  This feature is the underlying settings controller/DAL/model layer for
                  VPORT-specific configuration. May overlap with DASHBOARD.settings coverage
                  but has not been explicitly confirmed as covered.
```

**Files to create:**

`README.md` — Feature: settings-vports. Source: features/settings/vports/. VPORT-specific settings management — controller, dal, hooks, model, ui. Distinct from dashboard/cards/settings/ (the UI card) and DASHBOARD.settings module (the card governance). This is the underlying feature layer.

`audit-status.md` — All 9 commands: NOT_STARTED. VENOM recommended first.

`triad.md` — VENOM: NOT_STARTED. ELEKTRA: NOT_STARTED. BLACKWIDOW: NOT_STARTED. Status: TRIAD_NOT_STARTED.

`findings.md` — No findings yet.

`security.md` — Key trust questions: (1) Are all settings writes gated with an ownership check (assertActorOwnsVportActorController or equivalent)? (2) Is there a settings path that changes VPORT visibility without an ownership check? (3) Does the DAL scope updates to the calling actor's own VPORT? (4) Is there overlap with DASHBOARD.settings findings (ELEK-001/002)?

`ownership.md` — Module: settings-vports. Surface: DASHBOARD. Owner surface only. Kind scope: ALL.

`architecture.md` — Source: features/settings/vports/ (controller, dal, hooks, model, ui). Related to DASHBOARD.settings module findings. Possibly the underlying feature that the settings card uses.

`performance.md` — Not yet assessed.

`release-status.md` — NOT REVIEWED. THOR: NOT_STARTED.

---

## Priority Group 4 — Structural Fix: TABS Audit-Status Updates

These are not new folders — they are updates to existing `TABS/tabs/*/audit-status.md` files to add ELEKTRA and BLACKWIDOW tracking. Must happen before any tab audit can produce a valid triad status.

| Tab Folder | Required Update |
|---|---|
| `tabs/about/audit-status.md` | Add: ELEKTRA: NOT_STARTED, BLACKWIDOW: NOT_STARTED |
| `tabs/booking/audit-status.md` | Add: ELEKTRA: NOT_STARTED, BLACKWIDOW: NOT_STARTED |
| `tabs/contact/audit-status.md` | Add: ELEKTRA: NOT_STARTED, BLACKWIDOW: NOT_STARTED |
| `tabs/content/audit-status.md` | Add: ELEKTRA: NOT_STARTED, BLACKWIDOW: NOT_STARTED |
| `tabs/gallery/audit-status.md` | Add: ELEKTRA: NOT_STARTED, BLACKWIDOW: NOT_STARTED (pending rename decision) |
| `tabs/gas-prices/audit-status.md` | Add: ELEKTRA: NOT_STARTED, BLACKWIDOW: NOT_STARTED |
| `tabs/menu/audit-status.md` | Add: ELEKTRA: NOT_STARTED, BLACKWIDOW: NOT_STARTED |
| `tabs/owner/audit-status.md` | Add: ELEKTRA: NOT_STARTED, BLACKWIDOW: NOT_STARTED |
| `tabs/portfolio/audit-status.md` | Add: ELEKTRA: NOT_STARTED, BLACKWIDOW: NOT_STARTED |
| `tabs/rates/audit-status.md` | Add: ELEKTRA: NOT_STARTED, BLACKWIDOW: NOT_STARTED |
| `tabs/reviews/audit-status.md` | Add: ELEKTRA: NOT_STARTED, BLACKWIDOW: NOT_STARTED |
| `tabs/services/audit-status.md` | Add: ELEKTRA: NOT_STARTED, BLACKWIDOW: NOT_STARTED |
| `tabs/subscribers/audit-status.md` | Add: ELEKTRA: NOT_STARTED, BLACKWIDOW: NOT_STARTED |
| `tabs/team/audit-status.md` | Add: ELEKTRA: NOT_STARTED, BLACKWIDOW: NOT_STARTED |
| `tabs/vibes/audit-status.md` | Add: ELEKTRA: NOT_STARTED, BLACKWIDOW: NOT_STARTED |

---

## Folder Creation Priority Order

| Priority | Folder | Root | Risk | First Command | Rationale |
|---|---|---|---|---|---|
| **1** | `DASHBOARD/modules/join/` | DASHBOARD | HIGH | VENOM | Active on current branch; ownership-establishment path; no security audit |
| **2** | `DASHBOARD/modules/invite/` | DASHBOARD | HIGH | VENOM | Trust artifact; shares DAL with join; no audit |
| **3** | `TABS/modules/public-vport-business-card/` | TABS | HIGH | VENOM | Unauthenticated identity exposure; full feature stack |
| **4** | `TABS/modules/public-vport-menu/` | TABS | HIGH | VENOM | Unauthenticated QR surface; full feature stack |
| **5** | `DASHBOARD/modules/flyer-builder/` | DASHBOARD | HIGH | VENOM | Owner tool with DAL + upload paths; no audit |
| **6** | `DASHBOARD/modules/vport-core/` | DASHBOARD | HIGH | ARCHITECT | Core identity layer used by all surfaces; map first |
| **7** | `DASHBOARD/modules/qrcode/` | DASHBOARD | MEDIUM | VENOM | QR payloads contain identity; check for raw IDs |
| **8** | `TABS/modules/vport-profile-header/` | TABS | MEDIUM | VENOM | Shared header across all public tabs |
| **9** | `DASHBOARD/modules/settings-vports/` | DASHBOARD | MEDIUM | VENOM | Settings writes layer; may overlap DASHBOARD.settings |

---

## Folders That Should NOT Be Created

| Feature | Reason |
|---|---|
| `features/reviews/` (root-level) | Directory appears to be an empty scaffold with no subdirectories. Not an active feature. Verify before creating a governance folder — if it contains no source files, no audit is needed. |
| `features/portfolio/` (root-level) | Same as reviews — appears empty/scaffold. Verify. |
| `settings/privacy/` | Not VPORT-specific enough to need a dedicated VPORT governance folder. Privacy settings are actor-level, not VPORT-kind-level. Covered by DASHBOARD.settings findings. |
| `settings/profile/` | Same as privacy — actor-level settings, not VPORT-kind-specific. No dedicated VPORT folder needed. |
| `settings/account/` | Account-level settings, not VPORT-specific. No dedicated VPORT folder needed. |
| `profiles/adapters/kinds/vport/` | Adapter layer is an architectural boundary, not a user-facing feature. Coverage belongs inside the per-feature folders (each tab has an adapter boundary question already). An isolated adapter-layer folder would duplicate ARCHITECT findings spread across all tab folders. |
| `dashboard/shared/` | Shared components only — not a VPORT feature. No business logic, no DAL paths, no ownership writes. |

---

## Summary: What Gets Built vs What Is Already There

| Category | Total | Exists | Build Plan |
|---|---|---|---|
| DASHBOARD module folders | 34 | 25 | +9 new (join, invite, vport-core, flyer-builder, qrcode, settings-vports + already-have-but-missing triad.md) |
| TABS tab folders | 15 | 15 | 0 new tab folders — but all 15 need ELEKTRA+BW added to audit-status.md |
| TABS module folders (non-tab) | 3 | 0 | +3 new (public-vport-business-card, public-vport-menu, vport-profile-header) |
| Structural governance fixes | 2 | 0 | TABS matrix + photos/gallery contradiction |
| **Net new folders** | **12** | | **9 DASHBOARD + 3 TABS modules** |

---

## Recommended First Implementation Batch

Execute in this order to clear the most critical gaps:

**Batch 1 (current branch — active code):**
- Create `DASHBOARD/modules/join/`
- Create `DASHBOARD/modules/invite/`
- Run VENOM on both after folders exist

**Batch 2 (public exposure):**
- Create `TABS/modules/public-vport-business-card/`
- Create `TABS/modules/public-vport-menu/`
- Add ELEKTRA + BLACKWIDOW to TABS governance matrix
- Run VENOM on both public modules

**Batch 3 (infrastructure audit):**
- Create `DASHBOARD/modules/vport-core/` → Run ARCHITECT first
- Create `DASHBOARD/modules/flyer-builder/` → Run VENOM
- Resolve photos/gallery contradiction → Run ARCHITECT on tab switch

**Batch 4 (coverage cleanup):**
- Create `DASHBOARD/modules/qrcode/`
- Create `TABS/modules/vport-profile-header/`
- Create `DASHBOARD/modules/settings-vports/`
- Update all 15 TABS tab audit-status.md files with ELEKTRA + BLACKWIDOW rows
