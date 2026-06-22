# IRONMAN OWNERSHIP AUDIT — VPORT Dashboard Cards & Individual Settings

**Feature:** VPORT Dashboard Cards — Individual Settings
**Application Scope:** VCSM
**Date:** 2026-05-26
**Reviewer:** IRONMAN
**Trigger:** Post-fix ownership formalization — ARCHITECT audit + 9-violation fix session fully completed on current branch (`vport-booking-feed-security-updates`)
**Status:** OWNERSHIP CLEAR

---

## IRONMAN TARGET

```text
IRONMAN TARGET
Feature / Engine:  VPORT Dashboard Cards — Individual Settings
Application Scope: VCSM
Reason for ownership review:
  Post-fix formalization. ARCHITECT audit (vcsm.vport-dashboard-cards-settings.architecture.md)
  identified 9 violations, all resolved. This record formalizes ownership, data responsibility,
  rule enforcement boundaries, and change-impact governance after the complete fix session.
```

---

## EXISTING IRONMAN RECORDS CHECK

Searched `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/ironman/`:
- `vcsm.vport-dashboard-cards-settings.owner.md` — **NOT FOUND** (created this session)

---

## CODE ROOTS

```text
CODE ROOTS
Primary path:   apps/VCSM/src/features/dashboard/vport/
Secondary path: apps/VCSM/src/features/settings/vports/
Route config:   apps/VCSM/src/app/routes/lazyApp.jsx
                apps/VCSM/src/app/routes/protected/app.routes.jsx

Entry files:
  screens/VportSettingsFinalScreen.jsx   — route entry, ownership gate (Final Screen)
  screens/VportSettingsScreen.jsx        — hook composition, settings form (View Screen)
  screens/VportDashboardScreen.jsx       — owner dashboard, card grid (combined — pending split)
```

---

## RESPONSIBILITY CLASSIFICATION

| Responsibility Type | Owner | Confidence | Notes |
|---|---|---|---|
| Feature ownership (dashboard) | `dashboard/vport/screens/VportDashboardScreen.jsx` | HIGH | Card grid render, type-aware |
| Feature ownership (settings) | `settings/vports/` + `dashboard/vport/screens/Vport*Settings*` | HIGH | Split across two features, boundary clear |
| DAL ownership (read) | `settings/vports/dal/vports.read.dal.js` | HIGH | `readVportBusinessCardSettingsDAL`, `readVportDirectoryStateDAL` |
| DAL ownership (write) | `settings/vports/dal/vports.write.dal.js` | HIGH | `setVportBusinessCardSettingsDAL`, `setVportDirectoryVisibleDAL`, `syncDirectoryVisibleToPublicDetailsDAL` |
| Controller ownership (business card) | `settings/vports/controller/vportBusinessCardSettings.controller.js` | HIGH | Actor_owners + DAL guard (FIX-001 applied) |
| Controller ownership (directory) | `settings/vports/controller/vportDirectoryVisibility.controller.js` | HIGH | `assertActorOwnsVportActorController` + DAL guard + secondary sync |
| Controller ownership (public details) | `dashboard/vport/controller/saveVportPublicDetailsByActorId.controller.js` | HIGH | Save orchestration |
| UI ownership (settings components) | `dashboard/vport/screens/components/VportSettings*.jsx` | HIGH | 5 pure settings card components |
| UI ownership (dashboard) | `dashboard/vport/screens/components/VportDashboardParts.jsx` | HIGH | `DashboardCard`, `VportBannerHeader` |
| Runtime ownership (gate) | `VportSettingsFinalScreen.jsx` | HIGH | FIX-008 applied — Final Screen split complete |
| Runtime ownership (view) | `VportSettingsScreen.jsx` | HIGH | View Screen — hook composition only |
| Data ownership (settings) | `vport.profiles` | HIGH | `business_card_settings`, `directory_visible`, `directory_status` |
| Data ownership (sync) | `vport.profile_public_details` | HIGH | `directory_visible` sync — controller-owned (FIX-002 applied) |
| Rule ownership (actor owns VPORT) | `assertActorOwnsVportActorController` | HIGH | Enforced in both settings controllers |
| Rule ownership (card catalog) | `dashboard/vport/model/buildDashboardCards.model.js` | HIGH | 16-card frozen catalog |
| Rule ownership (type→view mapping) | `dashboard/vport/model/dashboardViewByVportType.model.js` | HIGH | 8 presets, type→view resolution |
| Rule ownership (settings defaults) | `public/vportBusinessCard/model/businessCardSettings.model.js` | HIGH | DEFAULT → type override → owner saved |
| Rule ownership (form validation) | `dashboard/vport/model/vportSettingsValidation.model.js` | HIGH | Pure model — FIX-005 applied |
| Save orchestration | `dashboard/vport/hooks/useSaveVportSettings.js` | HIGH | FIX-007 applied — hook owns all save logic |
| Documentation ownership | ARCHITECT module report | HIGH | `vcsm.vport-dashboard-cards-settings.architecture.md` — current |
| Security ownership | `assertActorOwnsVportActorController` + DAL WHERE clauses | HIGH | Defense-in-depth — controller + DB layer |
| Migration ownership | CARNAGE | PARTIAL | No migration files reviewed this session |
| Native parity ownership | N/A | N/A | PWA-first, no native transfer required |
| Test coverage | UNASSIGNED | MISSING | No test files exist for settings flows |

---

## OWNERSHIP CLARITY CLASSIFICATION

```text
Ownership Clarity: CLEAR
Evidence:
  - All 9 ARCHITECT violations resolved
  - Single owner for each controller, DAL, model, and hook responsibility
  - Layer boundaries enforced: DAL → Model → Controller → Hook → Component → View Screen → Final Screen
  - Both settings controllers have actor_owners + DAL-level auth (defense-in-depth)
  - Save-path business logic extracted to hook layer (useSaveVportSettings)
  - Final/View screen split applied to settings route
  - Model files at correct architectural layer (dashboard/vport/model/)
  - Re-export stubs in place for backward compatibility

Confidence: HIGH
```

---

## LAYER MAP

```text
LAYER MAP

DAL (settings/vports/dal/):
  vports.read.dal.js
    readVportBusinessCardSettingsDAL(vportId)     → vport.profiles (id, business_card_settings)
    readVportDirectoryStateDAL(vportId)            → vport.profiles (id, directory_visible, directory_status)
  vports.write.dal.js
    setVportBusinessCardSettingsDAL(vportId, settings) → vport.profiles (update business_card_settings)
    setVportDirectoryVisibleDAL(vportId, visible)      → vport.profiles (update directory_visible)
    syncDirectoryVisibleToPublicDetailsDAL(vportId, visible) → vport.profile_public_details (update directory_visible)
  actorOwners.read.dal.js
    (actor ownership reads for assertions)
  auth.read.dal.js
    (Supabase auth reads)

DAL (dashboard/vport/dal/):
  write/vportPublicDetails.write.dal.js
    saveVportPublicDetailsDAL(actorId, payload)   → vport.profiles / profile_public_details
  read/actorVport.read.dal.js
    resolveVportIdByActorIdDAL(actorId)           → actorId → vportId lookup

MODEL (dashboard/vport/model/):
  buildDashboardCards.model.js         CARD_CATALOG (16 frozen), getDashboardCardMetaByKey, buildDashboardCards
  dashboardViewByVportType.model.js    DASHBOARD_VIEW_PRESETS (8), normalizeVportType, getDashboardViewByVportType
  dashboardVportDetails.model.js       normalizeDashboardVportDetails
  vportSettingsDraft.model.js          mapPublicDetailsToDraft
  vportSettingsValidation.model.js     normalizeAddress, hasCompleteAddress, getAddressValidationError, normalizePhoneDigits
  vportBookingHistoryView.model.js     filterBookings, groupByDate

MODEL (public/vportBusinessCard/model/):
  businessCardSettings.model.js        DEFAULT_BUSINESS_CARD_SETTINGS, deepMergeSettings, getBusinessCardSettings, getSectionToggles

MODEL RE-EXPORT STUBS (backward compat only — do not add logic):
  dashboard/vport/screens/model/buildDashboardCards.model.js
  dashboard/vport/screens/model/dashboardViewByVportType.model.js
  dashboard/vport/screens/model/vportBookingHistoryView.model.js
  dashboard/vport/screens/lib/vportSettingsValidation.js

CONTROLLER (settings/vports/controller/):
  vportBusinessCardSettings.controller.js
    ctrlGetVportBusinessCardSettings(vportId)
    ctrlSetVportBusinessCardSettings({ vportId, settings, callerActorId, vportActorId })
    Auth: assertActorOwnsVportActorController + DAL WHERE owner_user_id
  vportDirectoryVisibility.controller.js
    ctrlGetVportDirectoryState(vportId)
    ctrlSetVportDirectoryVisible({ vportId, visible, callerActorId, vportActorId })
    Auth: assertActorOwnsVportActorController + DAL WHERE owner_user_id
    Side-effect: non-blocking secondary sync via syncDirectoryVisibleToPublicDetailsDAL

CONTROLLER (dashboard/vport/controller/):
  checkVportOwnership.controller.js
    checkVportOwnership(viewerActorId, targetActorId) → boolean
  saveVportPublicDetailsByActorId.controller.js
    saveVportPublicDetailsByActorId(actorId, payload)

CONTROLLER (settings/profile/controller/):
  resolveVportIdByActorId.controller.js
    ctrlResolveVportIdByActorId(actorId) → vportId

HOOK:
  settings/vports/hooks/useResolvedVportId.js         actorId → vportId (resolved once, passed to child hooks)
  settings/vports/hooks/useVportBusinessCardSettings.js  card settings read/write lifecycle
  settings/vports/hooks/useVportDirectoryVisibility.js   directory toggle lifecycle
  dashboard/vport/hooks/useSaveVportSettings.js          draft state, validation, save, toast lifecycle
  dashboard/vport/hooks/useSaveVportPublicDetailsByActorId.js  persistence hook (internal)
  dashboard/vport/hooks/useVportOwnership.js             ownership gate hook
  dashboard/vport/screens/useDesktopBreakpoint.js        responsive breakpoint

COMPONENT:
  screens/components/VportDashboardParts.jsx        DashboardCard, VportBannerHeader (pure)
  screens/components/CardSettingToggleRow.jsx        atomic toggle row with aria-label (pure)
  screens/components/VportSettingsBusinessCard.jsx   business card section toggles (pure)
  screens/components/VportSettingsTrazeCard.jsx      directory toggle card (pure)
  screens/components/VportSettingsAdsPreview.jsx     ads preview list, flag-gated (pure)
  screens/components/VportBackButton.jsx             back navigation (pure)
  screens/components/PortfolioDevDiagnosticPanel.jsx DEV-only diagnostic panel (guarded)

SCREEN:
  screens/VportSettingsFinalScreen.jsx  Final Screen — route entry + ownership gate
  screens/VportSettingsScreen.jsx       View Screen — hook wiring + component composition
  screens/VportDashboardScreen.jsx      Dashboard — combined Final+View (split pending)
```

---

## DEPENDENCY OWNERSHIP

```text
DEPENDENCY OWNERSHIP
Engines used:         NONE — feature is fully self-contained within VCSM app layer
Shared modules:
  shared/config/releaseFlags             release flag config (read-only)
  shared/components/Skeleton             SkeletonCardList (loading state)
  shared/components/components/Toast     Toast notification
Cross-feature adapters:
  settings/adapters/ui/Card.adapter                   UI card wrapper
  settings/adapters/profile/ui/VportAboutDetails.view.adapter  public details form
  profiles/adapters/kinds/vport/hooks/useVportPublicDetails.adapter  public details data
  profiles/adapters/profiles.adapter (getVportTabsByType)  tab config
  ads/adapters/hooks/useVportAds.adapter              ads list for preview
  booking/controller/assertActorOwnsVportActor.controller  ownership assertion
External services:
  Supabase (PostgreSQL + Auth)
```

---

## DATA OWNERSHIP REGISTRY

| Object | Primary Owner | Read Consumers | Write Owner | RLS Owner | Migration Owner | Docs Owner |
|---|---|---|---|---|---|---|
| `vport.profiles.business_card_settings` (JSONB) | `vportBusinessCardSettings.controller` | `useVportBusinessCardSettings` → `VportSettingsBusinessCard` | `ctrlSetVportBusinessCardSettings` | DB — `owner_user_id = auth.uid()` WHERE clause | CARNAGE | ARCHITECT module report |
| `vport.profiles.directory_visible` | `vportDirectoryVisibility.controller` | `useVportDirectoryVisibility` → `VportSettingsTrazeCard` | `ctrlSetVportDirectoryVisible` | DB — `owner_user_id = auth.uid()` WHERE clause | CARNAGE | ARCHITECT module report |
| `vport.profiles.directory_status` | Admin-only writes | `useVportDirectoryVisibility` (read) | Admin-only | DB | CARNAGE | ARCHITECT module report |
| `vport.profile_public_details.directory_visible` | `vportDirectoryVisibility.controller` (sync) | TRAZE directory index | `syncDirectoryVisibleToPublicDetailsDAL` (non-blocking) | DB | CARNAGE | ARCHITECT module report |
| `vc.actor_owners` | Identity system | `assertActorOwnsVportActorController` | Identity system | DB | CARNAGE | identity ownership record |
| `CARD_CATALOG` (frozen in-memory) | `buildDashboardCards.model.js` | `VportDashboardScreen`, `VportSettingsScreen` (via model) | None (frozen object) | N/A | N/A | ARCHITECT module report |
| `DASHBOARD_VIEW_PRESETS` (frozen in-memory) | `dashboardViewByVportType.model.js` | `VportDashboardScreen`, `VportSettingsScreen` (via model) | None (frozen object) | N/A | N/A | ARCHITECT module report |

---

## RULE OWNERSHIP REGISTRY

| Rule | Owner | Enforcement Layer | Docs | Risk |
|---|---|---|---|---|
| Actor must own VPORT to access settings writes | `assertActorOwnsVportActorController` | Controller (both settings controllers) | ARCHITECT module report | LOW — defense-in-depth with DAL |
| DAL restricts to authenticated owner | `owner_user_id = auth.uid()` WHERE clause | DAL | ARCHITECT module report | LOW |
| VPORT type determines which card set renders | `dashboardViewByVportType.model.js` | Model | ARCHITECT module report | LOW |
| Release flags gate individual cards | `releaseFlags` + `isDashboardCardEnabled()` | Model | ARCHITECT module report | LOW |
| Business card settings: default → type override → saved | `businessCardSettings.model.js :: deepMergeSettings` | Model | ARCHITECT module report | LOW |
| Address validation: city+state+zip required if any address field set | `vportSettingsValidation.model.js :: hasCompleteAddress` | Model (enforced in `useSaveVportSettings`) | ARCHITECT module report | LOW |
| Phone validation: exactly 10 digits US | `vportSettingsValidation.model.js :: normalizePhoneDigits` | Model (enforced in `useSaveVportSettings`) | ARCHITECT module report | LOW |
| Directory visibility sync: non-blocking, profile_public_details follows profiles | `vportDirectoryVisibility.controller.js` | Controller | ARCHITECT module report | LOW — sync failure warned only |
| vportId resolved once at screen mount, shared to child hooks | `useResolvedVportId.js` | Hook | ARCHITECT module report | LOW — eliminates N+1 |

---

## RUNTIME OWNERSHIP MAP

| Runtime Flow | Entry Point | Owning Feature | Controllers | DALs | Hotspots |
|---|---|---|---|---|---|
| Route access gate | `VportSettingsFinalScreen` | dashboard/vport | `checkVportOwnership` | `actorOwners.read.dal`, `actorVport.read.dal` | Identity + ownership resolved on every mount |
| vportId resolution | `useResolvedVportId` | settings/vports | `ctrlResolveVportIdByActorId` | `actorVport.read.dal` | Resolved once, shared — N+1 eliminated |
| Business card settings load | `useVportBusinessCardSettings` | settings/vports | `ctrlGetVportBusinessCardSettings` | `vports.read.dal` | Fresh read on every settings mount (no cache) |
| Business card settings save | `updateSettings` in hook | settings/vports | `ctrlSetVportBusinessCardSettings` | `vports.write.dal` | Actor_owners assertion on every write |
| Directory toggle load | `useVportDirectoryVisibility` | settings/vports | `ctrlGetVportDirectoryState` | `vports.read.dal` | Fresh read on every settings mount (no cache) |
| Directory toggle save | `.toggle()` in hook | settings/vports | `ctrlSetVportDirectoryVisible` | `vports.write.dal` + `syncDirectoryVisibleToPublicDetailsDAL` | Two DAL writes, second non-blocking |
| Public details load | `useVportPublicDetails` (adapter) | profiles | (via profiles adapter) | (profiles DAL) | Delegated to profiles feature |
| Public details save | `useSaveVportSettings.onSave` | dashboard/vport | `saveVportPublicDetailsByActorId` | `vportPublicDetails.write.dal` | Validation in model layer before persist |

*Runtime ownership: INFERRED — no LOKI trace captured this session.*

---

## OWNERSHIP BOUNDARY RISK

| Area | Risk | Reason | Recommended Clarification |
|---|---|---|---|
| `VportDashboardScreen` Final/View split | LOW | Dashboard screen still combines Final+View in one file — all logic is now in hooks, split is trivial | Split when next touching dashboard screen |
| `business_card_settings` JSONB schema | LOW | No runtime schema validation — any JSONB shape accepted by DB | Consider model-layer shape assertion in `ctrlSetVportBusinessCardSettings` |
| Test coverage | MEDIUM | No test files exist for any settings flow — validation, save, toggle, or ownership gate | Create test suite — assign to IRONMAN tracking |
| Settings component importing from `public/vportBusinessCard/model` directly | LOW | `VportSettingsBusinessCard` calls `getSectionToggles` directly — no adapter wrapper | Acceptable for now; document in ownership boundary rules |

---

## CROSS-ROOT OWNERSHIP REVIEW

| Area | Claimed Owner | Actual Root | Boundary Status | Notes |
|---|---|---|---|---|
| Settings hooks | `settings/vports` (VCSM) | `apps/VCSM` | CLEAN | Correct — single protected root |
| Dashboard model files | `dashboard/vport/model` (VCSM) | `apps/VCSM` | CLEAN | Correct — moved from screens/model/ (FIX-006) |
| `assertActorOwnsVportActorController` | booking feature (VCSM) | `apps/VCSM` | CLEAN | Cross-feature via import, not cross-root |
| No engine imports | — | — | CLEAN | Feature is entirely within VCSM app layer — no engine boundary |
| Route registration | `app/routes/` (VCSM) | `apps/VCSM` | CLEAN | Correct |

---

## OWNERSHIP BOUNDARY WARNINGS

No CRITICAL or HIGH boundary warnings remain post-fix. All FIX-001 through FIX-009 applied.

```text
OWNERSHIP BOUNDARY WARNING (LOW)
Location:   VportDashboardScreen.jsx
Current ambiguity:
  Combined Final Screen + View Screen in one file.
  All business logic has been extracted to hooks, so the violation is cosmetic.
Why it is risky: LOW — no business logic leakage; hooks do the work.
Suggested ownership clarification:
  Extract the actorId/identity/ownership gate block into VportDashboardFinalScreen.jsx.
  Defer until next VportDashboardScreen.jsx edit to avoid churn.
```

```text
OWNERSHIP BOUNDARY WARNING (MEDIUM)
Location:   settings/vports/hooks/*, dashboard/vport/hooks/useSaveVportSettings.js
Current ambiguity:
  Zero test coverage for all settings flows:
  - business card settings read/write
  - directory visibility toggle
  - public details save (validation → persistence)
  - vportId resolution hook
  - Final Screen ownership gate
Why it is risky: MEDIUM — regression risk on future edits; validation model logic untested.
Suggested ownership clarification:
  Create test files:
    settings/vports/hooks/useVportBusinessCardSettings.test.js
    settings/vports/hooks/useVportDirectoryVisibility.test.js
    dashboard/vport/hooks/useSaveVportSettings.test.js
    dashboard/vport/model/vportSettingsValidation.model.test.js
  Assign to IRONMAN tracking for next sprint.
```

---

## GOVERNANCE OWNERSHIP

```text
GOVERNANCE OWNERSHIP
Contracts touched:
  - PROJECT_BOUNDARY_ISOLATION_CONTRACT.md  — boundary isolation (VCSM scope enforced)
  - ARCHITECTURE.md (VCSM)                  — layer order: DAL → Model → Controller → Hook → Screen
  - Actor ownership contract                 — actor_owners enforcement in both controllers
  - Senior Developer Contract                — explicit column selects, file size limits, no TS

Logan docs:
  - zNOTFORPRODUCTION/_CANONICAL/logan/marvel/architect/modules/vcsm.vport-dashboard-cards-settings.architecture.md
    (ARCHITECT module report — current as of 2026-05-26, all violations resolved)

Engine audits:    N/A — no engine dependencies
Security audits:  N/A — defense-in-depth ownership documented in rule registry above
Runtime audits:   LOKI not run — runtime ownership marked INFERRED
Migration audits: CARNAGE not run — no schema changes this session
Native transfer:  N/A — PWA-first, no native parity required
```

---

## IRONMAN OWNERSHIP FINDING

```text
IRONMAN OWNERSHIP FINDING
- Finding ID:            VCSM-DASH-SETTINGS-001
- Feature / Engine:      VPORT Dashboard Cards — Individual Settings
- Application Scope:     VCSM
- Responsibility Type:   Feature ownership / Data ownership / Rule ownership / Security ownership
- Ownership Clarity:     CLEAR
- Boundary Risk:         LOW (dashboard Final/View split pending) / MEDIUM (test coverage missing)
- Severity:              LOW (no release blockers)
- Primary code roots:
    apps/VCSM/src/features/dashboard/vport/
    apps/VCSM/src/features/settings/vports/
- Core layers:
    DAL: settings/vports/dal/ + dashboard/vport/dal/write/vportPublicDetails.write.dal.js
    Model: dashboard/vport/model/ (canonical) + public/vportBusinessCard/model/
    Controller: settings/vports/controller/ + dashboard/vport/controller/
    Hook: settings/vports/hooks/ + dashboard/vport/hooks/
    Component: dashboard/vport/screens/components/VportSettings*.jsx
    Screen: VportSettingsFinalScreen.jsx (Final) + VportSettingsScreen.jsx (View)
- Engines used:          NONE
- Tables / Objects touched:
    vport.profiles (business_card_settings, directory_visible, directory_status)
    vport.profile_public_details (directory_visible — sync)
    vc.actor_owners (read — ownership assertions)
- Rule ownership:
    Actor ownership assertion: assertActorOwnsVportActorController (controller layer)
    DAL auth enforcement: owner_user_id = auth.uid() WHERE clause
    Type→card mapping: dashboardViewByVportType.model.js
    Settings defaults: businessCardSettings.model.js
    Validation: vportSettingsValidation.model.js
- Contracts touched:
    Boundary Isolation Contract
    VCSM Architecture Contract
    Actor Ownership Contract
- Docs touched:
    vcsm.vport-dashboard-cards-settings.architecture.md (ARCHITECT — current)
    vcsm.vport-dashboard-cards-settings.owner.md (this session — new)
- Runtime ownership:
    Gate: VportSettingsFinalScreen → checkVportOwnership → actor_owners
    Settings write: both controllers enforce assertActorOwnsVportActorController
    Save: useSaveVportSettings owns validation + persistence + toast lifecycle
- Current ambiguity:     LOW — VportDashboardScreen Final/View split pending (cosmetic)
- Risk:                  MEDIUM — test coverage missing
- Recommended ownership clarification:
    1. Create test suite for settings flows (model validation, hooks, ownership gate)
    2. Split VportDashboardScreen into Final + View screens on next edit
    3. Add JSONB shape assertion to business card settings controller
- Recommended handoff:
    Test coverage → IRONMAN sprint tracking
    Dashboard Final/View split → next WOLVERINE session touching dashboard
    JSONB validation → VENOM (trust boundary hardening)
- Rationale:
    All 9 ARCHITECT violations resolved. Ownership is architecturally clean.
    Remaining items are low/medium priority improvements, not blockers.
```

---

## THOR RELEASE GATE NOTES

No CRITICAL or HIGH ownership blockers.

| Gate | Status | Notes |
|---|---|---|
| Auth/ownership rule owner | CLEAR | Defense-in-depth in both controllers + DAL |
| Write path owner | CLEAR | Single controller per write concern |
| DAL ownership | CLEAR | Explicit column selects, `owner_user_id` WHERE on all |
| Documentation owner | CLEAR | ARCHITECT module report current |
| Cross-root violation | NONE | Fully contained in VCSM root |
| Engine boundary | CLEAN | No engine dependencies |
| Test coverage | ⚠️ MISSING | Not a release blocker; medium priority |
| VportDashboardScreen split | ⚠️ PENDING | Cosmetic; not a release blocker |

THOR may release. CAUTION on test coverage gap.

---

## OPEN OWNERSHIP QUESTIONS

1. **Test coverage** — No test files exist for any settings flow. Validation model, save hook, directory toggle, ownership gate — all untested. Assign to IRONMAN sprint tracking.
2. **VportDashboardScreen Final/View split** — Deferred. All logic extracted to hooks; split is cosmetic. Do on next VportDashboardScreen edit.
3. **`business_card_settings` JSONB schema** — No runtime shape assertion in controller. VENOM should review whether this constitutes a trust boundary gap.
