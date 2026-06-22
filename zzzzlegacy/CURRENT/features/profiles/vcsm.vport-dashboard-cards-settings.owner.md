# VPORT Dashboard Cards — Individual Settings — Ownership Record

**Last Updated:** 2026-05-26
**Ownership Clarity:** CLEAR
**Audit Reference:** `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-26_ironman_vport-dashboard-cards-settings-ownership.md`

---

## 1. Purpose

Two tightly linked owner-gated surfaces:

**VportDashboardScreen** — the VPORT owner dashboard. Renders a type-aware grid of `DashboardCard` action tiles. Card set and labels are computed from `vportType` (8 presets) and release flags.

**VportSettingsScreen** — individual settings, reached via the "Settings" dashboard card. Controls:
- TRAZE directory visibility toggle
- Business card display section toggles (type-specific)
- Ads pipeline preview (feature-flagged)
- Public VPORT details (name, address, phone, website, hours, highlights)

Both surfaces are strictly owner-only. Any viewer who is not the verified owner is blocked at the Final Screen gate.

---

## 2. Application Scope

**VCSM**
Scope Label: VCSM
Protected Root: `/Users/vcsm/Desktop/VCSM/apps/VCSM`
No engine dependencies. No cross-root modifications.

---

## 3. Code Roots

| Root | Path |
|---|---|
| Dashboard feature | `apps/VCSM/src/features/dashboard/vport/` |
| Settings infra | `apps/VCSM/src/features/settings/vports/` |
| Route config | `apps/VCSM/src/app/routes/lazyApp.jsx` |

**Route entries:**
- `/actor/:actorId/dashboard` → `VportDashboardScreen` (lazy)
- `/actor/:actorId/settings` → `VportSettingsFinalScreen` → `VportSettingsScreen` (lazy, two-layer)

---

## 4. Core Layers

**DAL**
| File | Responsibility |
|---|---|
| `settings/vports/dal/vports.read.dal.js` | `readVportBusinessCardSettingsDAL`, `readVportDirectoryStateDAL` — `vport.profiles` |
| `settings/vports/dal/vports.write.dal.js` | `setVportBusinessCardSettingsDAL`, `setVportDirectoryVisibleDAL`, `syncDirectoryVisibleToPublicDetailsDAL` |
| `settings/vports/dal/actorOwners.read.dal.js` | Actor ownership reads |
| `dashboard/vport/dal/write/vportPublicDetails.write.dal.js` | Public details write |
| `dashboard/vport/dal/read/actorVport.read.dal.js` | `actorId` → `vportId` resolution |

**Model (canonical locations)**
| File | Exports |
|---|---|
| `dashboard/vport/model/buildDashboardCards.model.js` | `CARD_CATALOG` (16 frozen), `buildDashboardCards`, `getDashboardCardMetaByKey` |
| `dashboard/vport/model/dashboardViewByVportType.model.js` | `DASHBOARD_VIEW_PRESETS` (8), `normalizeVportType`, `getDashboardViewByVportType` |
| `dashboard/vport/model/dashboardVportDetails.model.js` | `normalizeDashboardVportDetails` |
| `dashboard/vport/model/vportSettingsDraft.model.js` | `mapPublicDetailsToDraft` |
| `dashboard/vport/model/vportSettingsValidation.model.js` | `normalizeAddress`, `hasCompleteAddress`, `getAddressValidationError`, `normalizePhoneDigits` |
| `public/vportBusinessCard/model/businessCardSettings.model.js` | `DEFAULT_BUSINESS_CARD_SETTINGS`, `deepMergeSettings`, `getBusinessCardSettings`, `getSectionToggles` |

Re-export stubs (backward compat — do not add logic):
`screens/model/buildDashboardCards.model.js`, `screens/model/dashboardViewByVportType.model.js`, `screens/model/vportBookingHistoryView.model.js`, `screens/lib/vportSettingsValidation.js`

**Controller**
| File | Auth Layer |
|---|---|
| `settings/vports/controller/vportBusinessCardSettings.controller.js` | `assertActorOwnsVportActorController` + DAL WHERE `owner_user_id = auth.uid()` |
| `settings/vports/controller/vportDirectoryVisibility.controller.js` | `assertActorOwnsVportActorController` + DAL WHERE `owner_user_id = auth.uid()` |
| `dashboard/vport/controller/checkVportOwnership.controller.js` | `vc.actor_owners` lookup |
| `dashboard/vport/controller/saveVportPublicDetailsByActorId.controller.js` | actorId-scoped save |
| `settings/profile/controller/resolveVportIdByActorId.controller.js` | actorId → vportId |

**Hook**
| File | Responsibility |
|---|---|
| `settings/vports/hooks/useResolvedVportId.js` | Resolves vportId once; passed to child hooks (eliminates N+1) |
| `settings/vports/hooks/useVportBusinessCardSettings.js` | Card settings read/write lifecycle |
| `settings/vports/hooks/useVportDirectoryVisibility.js` | Directory toggle lifecycle |
| `dashboard/vport/hooks/useSaveVportSettings.js` | Draft state, validation, save orchestration, toast lifecycle |
| `dashboard/vport/hooks/useSaveVportPublicDetailsByActorId.js` | Persistence (internal to save hook) |
| `dashboard/vport/hooks/useVportOwnership.js` | Ownership gate hook |

**Component**
`screens/components/VportSettingsBusinessCard.jsx` — business card section toggles
`screens/components/VportSettingsTrazeCard.jsx` — TRAZE directory toggle card
`screens/components/VportSettingsAdsPreview.jsx` — ads preview (flag-gated)
`screens/components/CardSettingToggleRow.jsx` — atomic toggle row
`screens/components/VportBackButton.jsx` — back nav
`screens/components/VportDashboardParts.jsx` — `DashboardCard`, `VportBannerHeader`
`screens/components/PortfolioDevDiagnosticPanel.jsx` — DEV-only diagnostic

**Screen**
| File | Role |
|---|---|
| `screens/VportSettingsFinalScreen.jsx` | **Final Screen** — route entry, ownership gate only |
| `screens/VportSettingsScreen.jsx` | **View Screen** — hook wiring + composition; accepts `{ actorId, isOwner }` props |
| `screens/VportDashboardScreen.jsx` | Combined Final+View — split pending (low priority) |

---

## 5. Engines Used

**None.** Feature is entirely self-contained within the VCSM application layer.

---

## 6. Database / Schema Ownership

| Table | Access | Owner Controller | DAL File | RLS |
|---|---|---|---|---|
| `vport.profiles` (business_card_settings) | read + write | `vportBusinessCardSettings.controller` | `vports.read.dal`, `vports.write.dal` | `owner_user_id = auth.uid()` WHERE |
| `vport.profiles` (directory_visible, directory_status) | read + write | `vportDirectoryVisibility.controller` | `vports.read.dal`, `vports.write.dal` | `owner_user_id = auth.uid()` WHERE |
| `vport.profile_public_details` (directory_visible) | write (sync only) | `vportDirectoryVisibility.controller` | `vports.write.dal :: syncDirectoryVisibleToPublicDetailsDAL` | DB policy |
| `vc.actor_owners` | read (ownership assertion) | Identity system | `settings/vports/dal/actorOwners.read.dal.js` | DB policy |

Migration owner: **CARNAGE**

---

## 7. Rule Ownership

| Rule | Owner | Layer |
|---|---|---|
| Actor must own VPORT for any settings write | `assertActorOwnsVportActorController` | Controller (both settings controllers) |
| DAL restricts to authenticated owner | `owner_user_id = auth.uid()` WHERE | DAL |
| VPORT type → card set mapping | `dashboardViewByVportType.model.js` | Model |
| Card rendering gated by release flags | `releaseFlags` + `isDashboardCardEnabled()` | Model |
| Settings defaults: global → type → saved override | `businessCardSettings.model.js :: deepMergeSettings` | Model |
| Address validation (partial address blocked) | `vportSettingsValidation.model.js` | Model (enforced by `useSaveVportSettings`) |
| Phone validation (10 digits US) | `vportSettingsValidation.model.js` | Model (enforced by `useSaveVportSettings`) |
| Directory sync is non-blocking | `vportDirectoryVisibility.controller.js` | Controller |
| vportId resolved once per screen mount | `useResolvedVportId.js` | Hook |

---

## 8. Contracts Touched

- `PROJECT_BOUNDARY_ISOLATION_CONTRACT.md` — VCSM-only scope
- `ARCHITECTURE.md` (VCSM) — DAL → Model → Controller → Hook → Component → View Screen → Final Screen
- Actor Ownership Contract — `actor_owners` enforcement in controllers
- Senior Developer Contract — explicit column selects, no `select('*')`, file size limits

---

## 9. Documentation Links

| Doc | Location |
|---|---|
| ARCHITECT module report | `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/architect/modules/vcsm.vport-dashboard-cards-settings.architecture.md` |
| IRONMAN audit (this session) | `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-26_ironman_vport-dashboard-cards-settings-ownership.md` |

---

## 10. Runtime Ownership

| Flow | Entry Point | Controllers | DALs |
|---|---|---|---|
| Route gate | `VportSettingsFinalScreen` | `checkVportOwnership` | `actorOwners.read.dal` |
| vportId resolution | `useResolvedVportId` | `ctrlResolveVportIdByActorId` | `actorVport.read.dal` |
| Card settings read/write | `useVportBusinessCardSettings` | `ctrlGet/SetVportBusinessCardSettings` | `vports.read/write.dal` |
| Directory toggle | `useVportDirectoryVisibility` | `ctrlGet/SetVportDirectoryVisible` | `vports.read/write.dal` |
| Public details save | `useSaveVportSettings.onSave` | `saveVportPublicDetailsByActorId` | `vportPublicDetails.write.dal` |

---

## 11. Responsibilities

- Render the correct card grid for the owner's `vportType`
- Gate all settings reads and writes behind verified actor ownership
- Enforce defense-in-depth auth: controller (actor_owners) + DAL (owner_user_id WHERE)
- Resolve vportId exactly once per screen mount; pass to child hooks
- Own the draft lifecycle, validation, persistence, and save feedback for public details
- Sync directory visibility to `profile_public_details` non-blocking after primary write
- Apply type-specific business card settings from global defaults through saved overrides

---

## 12. Boundaries

This feature must **not**:
- Import from another feature's internals — all cross-feature access must go through adapters
- Place business logic in DAL files (secondary syncs belong in controller)
- Place validation logic in screen or hook files — validation belongs in model files
- Resolve vportId more than once per screen mount (N+1 anti-pattern)
- Render in owner mode without a verified actor_owners check
- Expose `profileId` or `vportId` via `useIdentity()`
- Import from any other protected app root (wentrex, Traffic, engines)

---

## 13. Change Impact Rules

When modifying this feature, update:

| Changed Area | Must Also Update |
|---|---|
| `vport.profiles` schema | CARNAGE migration + DAL column lists + this ownership record |
| New settings controller | Add `assertActorOwnsVportActorController` + DAL WHERE guard |
| New card in CARD_CATALOG | Update `dashboardViewByVportType.model.js` presets + `releaseFlags` config |
| `businessCardSettings.model.js` | Update `DEFAULT_BUSINESS_CARD_SETTINGS` + type-specific overrides map |
| New validation rule | Add to `vportSettingsValidation.model.js`, enforce in `useSaveVportSettings` |
| Screen layer changes | Maintain Final Screen / View Screen split — no business logic in screens |
| Any write path | LOGAN: update ARCHITECT module report |

---

## 14. Release Gate Notes

| Gate | Status |
|---|---|
| Auth / ownership rule owner | ✅ CLEAR |
| Write path owner | ✅ CLEAR (single controller per write concern) |
| DAL ownership | ✅ CLEAR (explicit columns, `owner_user_id` WHERE on all) |
| Documentation owner | ✅ CLEAR |
| Cross-root violation | ✅ NONE |
| Engine boundary | ✅ CLEAN |
| Test coverage | ⚠️ MISSING (not a blocker; medium priority) |
| VportDashboardScreen split | ⚠️ PENDING (cosmetic; not a blocker) |

THOR: may release. Note test coverage gap.

---

## 15. Open Ownership Questions

1. **Test coverage** — No test files exist. Assign to IRONMAN sprint tracking.
2. **VportDashboardScreen Final/View split** — Deferred (low priority). Do on next edit.
3. **`business_card_settings` JSONB validation** — No shape assertion at controller layer. VENOM review recommended.
