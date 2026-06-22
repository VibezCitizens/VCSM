# VCSM DAL — `professional`

_Generated:_ 2026-05-11  
_Source:_ ARCHITECT static scan · `apps/VCSM/src/features/professional/dal/`  
_Confidence:_ STATICALLY\_TRACED  

---

## Summary

| Item | Count |
|---|---|
| DAL files | 1 |
| Exported functions | 2 |
| Tables accessed | 1 |
| RPCs called | 0 |
| Risk findings | 0 |

## DAL Files

### `professionalBriefings.read.dal.js`

**Path:** `features/professional/briefings/dal/professionalBriefings.read.dal.js`  
**Operations:** `read` · `update`  

**Exported functions:**

| `dalListProfessionalBriefings` | `read` · `update` | `notifications` |
| `dalMarkProfessionalBriefingsSeen` | `read` · `update` | `notifications` |

---

## Tables Accessed

| Table | Operations | Via Functions |
|---|---|---|
| `notifications` | UPDATE | `dalListProfessionalBriefings`, `dalMarkProfessionalBriefingsSeen` |

---

## Risk Findings

No risk findings for this feature.

---

## Pending Reviews

No pending reviews — feature DAL is clean.

---

## Call Chains

Who calls each DAL file — traced from DAL up to Screen.

### `professionalBriefings.read.dal.js`

**Direct callers:**

- `listProfessionalBriefings.controller.js` _Controller_

**Full call chain to screen:**

```
`professionalBriefings.read.dal.js` → `listProfessionalBriefings.controller.js` → `useProfessionalBriefings.js` → `ProfessionalBriefingsScreenView.jsx`
```

---

## Architecture Pipeline

Full build order for this feature — `DAL → Model → Controller → Hook → Components → View Screen → Final Screen`

| Layer | Status | Files |
|---|---|---|
| **DAL** | ✓ PRESENT | _(documented above)_ |
| **Model** | ✓ PRESENT | `professionalBriefing.model.js`, `buildEnterpriseView.model.js` |
| **Controller** | ✓ PRESENT | `listProfessionalBriefings.controller.js` |
| **Adapter** | ✗ MISSING | — |
| **Service** | ✗ MISSING | — |
| **Hook** | ✓ PRESENT | `useProfessionalBriefings.js`, `useEnterpriseWorkspace.js` |
| **Component** | ✓ PRESENT | `BriefingsFilters.jsx`, `BriefingsList.jsx`, `BriefingsSummaryCards.jsx` |
| **View Screen** | ✓ PRESENT | `ProfessionalBriefingsScreenView.jsx`, `NurseHomeScreenView.jsx`, `FacilityInsightsTabView.jsx`, `HousingTabView.jsx` |
| **Final Screen** | ✓ PRESENT | `NurseHomeScreen.jsx`, `ProfessionalAccessScreen.jsx` |

### Model

_Pure transforms — no side effects, no DB access_

- `features/professional/briefings/model/professionalBriefing.model.js`
- `features/professional/enterprise/model/buildEnterpriseView.model.js`

### Controller

_Business rules, ownership, permissions — no React_

- `features/professional/briefings/controller/listProfessionalBriefings.controller.js`

### Hook

_Lifecycle / timing / state wiring — no business rules_

- `features/professional/briefings/hooks/useProfessionalBriefings.js`
- `features/professional/enterprise/hooks/useEnterpriseWorkspace.js`

### Component

_Presentational only — no hooks, no data fetching_

- `features/professional/briefings/components/BriefingsFilters.jsx`
- `features/professional/briefings/components/BriefingsList.jsx`
- `features/professional/briefings/components/BriefingsSummaryCards.jsx`

### View Screen

_Hooks + component composition — no business logic_

- `features/professional/briefings/view/ProfessionalBriefingsScreenView.jsx`
- `features/professional/professional-nurse/screens/NurseHomeScreenView.jsx`
- `features/professional/professional-nurse/screens/views/FacilityInsightsTabView.jsx`
- `features/professional/professional-nurse/screens/views/HousingTabView.jsx`

### Final Screen

_Route entry + identity gate only — no computation_

- `features/professional/professional-nurse/screens/NurseHomeScreen.jsx`
- `features/professional/screens/ProfessionalAccessScreen.jsx`

### Missing Layers

- 🟡 **Adapter** — not detected in static scan
- 🟡 **Service** — not detected in static scan

> Missing layers may exist but use naming patterns not detected by static scan, or may be delegated to engines.

---

## Dead Code Audit

_Audited:_ 2026-05-11  
_Method:_ Static import trace — grep across all `.js`/`.jsx` in `apps/VCSM/src/`  
_Auditor:_ ARCHITECT

---

### Verdict: DAL Functions LIVE — Enterprise Sub-Feature CONFIRMED DEAD

| Item | Status | Evidence |
|---|---|---|
| `dalListProfessionalBriefings` | LIVE | `listProfessionalBriefings.controller.js` → `useProfessionalBriefings.js` → `ProfessionalBriefingsScreen` → routed at `app.routes.jsx:146` |
| `dalMarkProfessionalBriefingsSeen` | LIVE | Same chain |
| `professionalBriefing.model.js` | LIVE | Imported by `listProfessionalBriefings.controller.js` (live) |
| `EnterpriseWorkspace.jsx` | **CONFIRMED DEAD** | Zero references outside `enterprise/` folder |
| `useEnterpriseWorkspace.js` | **CONFIRMED DEAD** | Only caller is `EnterpriseWorkspace.jsx` (dead) |
| `buildEnterpriseView.model.js` | **CONFIRMED DEAD** | Only caller is `useEnterpriseWorkspace.js` (dead) |

---

### Dead Code Finding #1 — Enterprise sub-feature cluster

**Files:**
- `features/professional/enterprise/ui/EnterpriseWorkspace.jsx`
- `features/professional/enterprise/hooks/useEnterpriseWorkspace.js`
- `features/professional/enterprise/model/buildEnterpriseView.model.js`

**Classification:** CONFIRMED DEAD — full 3-file cluster, self-contained with no external mount point

**Evidence:**
- Zero references to `EnterpriseWorkspace`, `useEnterpriseWorkspace`, or `buildEnterpriseView` found anywhere outside `features/professional/enterprise/`
- `EnterpriseWorkspace.jsx` is never imported by any route, screen, or view
- `useEnterpriseWorkspace.js` is only consumed by `EnterpriseWorkspace.jsx`
- `buildEnterpriseView.model.js` is only consumed by `useEnterpriseWorkspace.js`
- The Architecture Pipeline doc lists `useEnterpriseWorkspace.js` as a present Hook — it exists but its entire chain is orphaned

**Dead chain:**
```
buildEnterpriseView.model.js → useEnterpriseWorkspace.js → EnterpriseWorkspace.jsx → (no mount point)
```

**Risk:** LOW — no runtime harm. The enterprise workspace appears to be a planned or experimental sub-feature that was never wired into the professional route tree.  
**Recommended action:** DELETE CANDIDATE — all 3 files. Confirm with IRONMAN that no planned route exists for this sub-feature before deleting.  
**Handoffs:** IRONMAN (confirm enterprise workspace disposition), LOGAN (remove `useEnterpriseWorkspace.js` from Hook PRESENT list and `buildEnterpriseView.model.js` from Model PRESENT list in Architecture Pipeline)

---

### Structural Finding #1 — `NurseHomeScreenView` is a static mock prototype

**File:** `features/professional/professional-nurse/screens/NurseHomeScreenView.jsx`  
**Classification:** LIVE SCREEN — static mock data, no DB connection  

**Evidence:**
- The screen is fully routed: `app.routes.jsx` → `ProfessionalAccessScreen` → `NurseHomeScreen` → `NurseHomeScreenView`
- `NurseHomeScreenView` contains two hardcoded frozen arrays: `INITIAL_HOUSING_NOTES` and `INITIAL_FACILITY_NOTES` — both with Austin TX placeholder data
- No hook, controller, or DAL is called from this screen — it is entirely self-contained with mock state
- The `FacilityInsightsTabView` and `HousingTabView` tab children render from these same local state arrays

**Risk:** MEDIUM — the screen is live and accessible to users but serves only placeholder data. Any user navigating to the professional workspace sees hardcoded nurse notes from Austin TX, not real data. If this screen is publicly visible or accessible without a feature gate, it is effectively shipping a prototype to production.  
**Recommended action:** Verify a feature gate exists on `ProfessionalAccessScreen` before this reaches production. Wire to live data or mark the route behind a flag.  
**Handoffs:** IRONMAN (confirm gating status), WOLVERINE (wire live data when ready), VENOM (confirm this screen is not accessible to unauthenticated or unauthorized users)

---

### Structural Finding #2 — Doc Architecture Pipeline overstates active coverage

The Architecture Pipeline table marks the following as PRESENT — but they belong to the dead enterprise cluster:

| Listed as PRESENT | Actual Status |
|---|---|
| Model: `buildEnterpriseView.model.js` | DEAD — no active call chain |
| Hook: `useEnterpriseWorkspace.js` | DEAD — no active call chain |

`EnterpriseWorkspace.jsx` itself is absent from the Pipeline table entirely (not listed as Component, View Screen, or Final Screen) — a classification gap.  
**Recommended action:** Update Architecture Pipeline to reflect actual active coverage.  
**Handoffs:** LOGAN (doc correction)

---

### Audit Summary

| Finding | Classification | Priority |
|---|---|---|
| Enterprise cluster: `EnterpriseWorkspace.jsx` + `useEnterpriseWorkspace.js` + `buildEnterpriseView.model.js` | CONFIRMED DEAD | P1 — delete candidates |
| `NurseHomeScreenView` — live route, static mock data only | PROTOTYPE IN PRODUCTION PATH | P0 — verify gate before release |
| Architecture Pipeline overstates active model/hook coverage | DOC INACCURACY | P3 |

**Confirmed dead functions (DAL):** 0  
**Confirmed dead files (feature layer):** 3 — full enterprise sub-feature cluster  
**Doc function count:** ACCURATE (2 DAL functions — both live)  
**Critical flag:** `NurseHomeScreenView` is a routed screen serving hardcoded Austin TX placeholder data — production gate must be verified

---

## Layer Consumer Map

_Audited:_ 2026-05-11  
_Method:_ Static import trace — full upward traversal from DAL through Model → Controller → Hook → Component → View Screen → Final Screen → Router  
_Auditor:_ ARCHITECT

---

### DAL → Model → Controller

Both DAL functions are consumed exclusively by one controller. The model layer sits between the DAL and the controller — the controller calls the DAL, receives raw rows, and immediately passes them through the model before returning.

| DAL Function | Controller | Model Functions Used |
|---|---|---|
| `dalListProfessionalBriefings` | `listProfessionalBriefings.controller.js` | `modelProfessionalBriefingRows`, `modelProfessionalBriefingsSummary` |
| `dalMarkProfessionalBriefingsSeen` | `listProfessionalBriefings.controller.js` | _(no model transform — write-only op)_ |

**Controller exports:**

| Function | Calls DAL | Calls Model | Purpose |
|---|---|---|---|
| `ctrlListProfessionalBriefings` | `dalListProfessionalBriefings` | `modelProfessionalBriefingRows` + `modelProfessionalBriefingsSummary` | Load + filter + shape briefings for a given `actorId` |
| `ctrlMarkProfessionalBriefingsSeen` | `dalMarkProfessionalBriefingsSeen` | — | Mark a set of notification IDs as seen |

---

### Controller → Hook

`listProfessionalBriefings.controller.js` is consumed by exactly one hook.

| Controller | Hook | Functions Used |
|---|---|---|
| `listProfessionalBriefings.controller.js` | `useProfessionalBriefings.js` | `ctrlListProfessionalBriefings`, `ctrlMarkProfessionalBriefingsSeen` |

**Hook return surface:**

`useProfessionalBriefings` returns `{ items, summary, loading, error, filters, setFilters, domainOptions, reload, markVisibleSeen }`. It owns all state management for the briefings list — load, filter, pagination cursor, and mark-seen side effect.

---

### Hook → View Screen

`useProfessionalBriefings.js` is consumed by exactly one view screen.

| Hook | View Screen |
|---|---|
| `useProfessionalBriefings.js` | `ProfessionalBriefingsScreenView.jsx` |

---

### Component Consumers

All three presentational components are consumed only inside `ProfessionalBriefingsScreenView.jsx`. Zero external consumers.

| Component | Consumed By |
|---|---|
| `BriefingsFilters.jsx` | `ProfessionalBriefingsScreenView.jsx` (sole consumer) |
| `BriefingsSummaryCards.jsx` | `ProfessionalBriefingsScreenView.jsx` (sole consumer) |
| `BriefingsList.jsx` | `ProfessionalBriefingsScreenView.jsx` (sole consumer) |

---

### View Screen → Final Screen

| View Screen | Final Screen | Notes |
|---|---|---|
| `ProfessionalBriefingsScreenView.jsx` | `ProfessionalBriefingsScreen.jsx` | Identity gate — redirects to `/feed` if no `actorId` |

**Identity gate in `ProfessionalBriefingsScreen.jsx`:**
```js
const actorId = identity?.actorId ?? null
if (!actorId) return <Navigate to="/feed" replace />
return <ProfessionalBriefingsScreenView actorId={actorId} />
```
`useIdentity` imported correctly via `@/features/identity/adapters/identity.adapter` — adapter boundary respected.

---

### Route Registration

Both professional routes are registered in `app.routes.jsx` and lazy-loaded via `lazyApp.jsx`. Both are behind the `releaseFlags.professionalWorkspace` feature flag.

| Route | Screen | Feature Flag | Lazy Registered |
|---|---|---|---|
| `/professional/briefings` | `ProfessionalBriefingsScreen.jsx` | `releaseFlags.professionalWorkspace` | `lazyApp.jsx:36` |
| `/professional-access` | `ProfessionalAccessScreen.jsx` | `releaseFlags.professionalWorkspace` | `lazyApp.jsx:31` |

**If `releaseFlags.professionalWorkspace` is false, both routes render nothing** (the flag check in `app.routes.jsx` blocks the element entirely — confirmed at lines 137–145).

---

### Full DAL → Screen Chain

```
professionalBriefings.read.dal.js
  → listProfessionalBriefings.controller.js  [also calls professionalBriefing.model.js]
    → useProfessionalBriefings.js
      → ProfessionalBriefingsScreenView.jsx
        → BriefingsFilters.jsx (component)
        → BriefingsSummaryCards.jsx (component)
        → BriefingsList.jsx (component)
          → ProfessionalBriefingsScreen.jsx  [identity gate via useIdentity]
            → /professional/briefings  [behind releaseFlags.professionalWorkspace]
```

---

### NurseHome Stack — No DAL Connection

`ProfessionalAccessScreen.jsx` is routed at `/professional-access` behind the same feature flag, but its internal stack has **zero connection to this DAL**.

```
/professional-access
  → ProfessionalAccessScreen.jsx  [embeds NurseHomeScreen as a component]
    → NurseHomeScreen.jsx  (profession="nurse" prop)
      → NurseHomeScreenView.jsx  [static mock data — no hook, no controller, no DAL]
        → FacilityInsightsTabView.jsx  [static]
        → HousingTabView.jsx  [static]
```

`NurseHomeScreen.jsx` is not routed independently — it is embedded as a child component inside `ProfessionalAccessScreen`, not a standalone route.

---

### Architecture Pipeline — Confirmed Active Layers

Correcting the pipeline against the live chain. The enterprise sub-feature layers (`useEnterpriseWorkspace.js`, `buildEnterpriseView.model.js`) are excluded — confirmed dead in Dead Code Audit.

| Layer | Status | Active Files |
|---|---|---|
| DAL | PRESENT | `professionalBriefings.read.dal.js` |
| Model | PRESENT (briefings only) | `professionalBriefing.model.js` |
| Model | DEAD | `buildEnterpriseView.model.js` — no active call chain |
| Controller | PRESENT | `listProfessionalBriefings.controller.js` |
| Adapter | MISSING | No adapter — feature not exposed cross-feature |
| Hook | PRESENT (briefings only) | `useProfessionalBriefings.js` |
| Hook | DEAD | `useEnterpriseWorkspace.js` — no active call chain |
| Component | PRESENT | `BriefingsFilters.jsx`, `BriefingsList.jsx`, `BriefingsSummaryCards.jsx` |
| View Screen | PRESENT (briefings) | `ProfessionalBriefingsScreenView.jsx` |
| View Screen | PRESENT (nurse — static mock) | `NurseHomeScreenView.jsx`, `FacilityInsightsTabView.jsx`, `HousingTabView.jsx` |
| Final Screen | PRESENT | `ProfessionalBriefingsScreen.jsx`, `ProfessionalAccessScreen.jsx` |
| Route | PRESENT — feature-flagged | `/professional/briefings`, `/professional-access` |

---

### Findings Summary

| Finding | Classification | Priority |
|---|---|---|
| Both routes gated by `releaseFlags.professionalWorkspace` — feature flag required for access | FEATURE FLAG GATED | Confirm flag state before release |
| No adapter exists — `professional` feature cannot be consumed cross-feature | MISSING ADAPTER | P3 — acceptable if no cross-feature consumption needed |
| `NurseHomeScreen` embedded as component inside `ProfessionalAccessScreen` — not independently routed | ARCHITECTURAL NOTE | P3 — not a violation, but unusual pattern |
| Enterprise cluster (`EnterpriseWorkspace`, `useEnterpriseWorkspace`, `buildEnterpriseView.model`) — confirmed dead, no active chain | CONFIRMED DEAD | P1 — delete candidates (see Dead Code Audit) |
| `NurseHomeScreenView` serves hardcoded Austin TX mock data — live route, zero real data | PROTOTYPE IN PRODUCTION PATH | P0 — verify gate before release |

**Active DAL consumers:** 1 controller → 1 hook → 1 view screen → 1 final screen — clean, linear chain  
**Dead chains:** 1 (enterprise sub-feature cluster — 3 files, no mount point)

## Codex Fix Pass — 2026-05-11

### Files Changed
| File | Change |
|---|---|
| `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.professional.md` | Appended this fix-pass record only; no prior audit content was removed. |

### Findings Addressed
| Finding | Status | Notes |
|---|---|---|
| DAL functions in `professionalBriefings.read.dal.js` | VERIFIED CLEAN | Current import trace confirms both DAL exports remain live through `listProfessionalBriefings.controller.js`. |
| Enterprise cluster dead-code candidate | DEFERRED | Verified `EnterpriseWorkspace`, `useEnterpriseWorkspace`, and `buildEnterpriseView` have no callers outside `features/professional/enterprise/`. No deletion was performed because this pass is append-only/no-delete and the doc requires IRONMAN disposition. |
| `NurseHomeScreenView` static mock prototype in live path | VERIFIED FEATURE-FLAGGED | Current route config keeps `/professional-access` behind `releaseFlags.professionalWorkspace`, whose default is disabled unless `VITE_ENABLE_PROFESSIONAL_WORKSPACE` opts in. No live-data wiring was attempted. |
| Architecture Pipeline overstates active enterprise coverage | DOCUMENTED CURRENT STATE | Existing later sections already correct active/dead status. No older section was edited because this pass is append-only. |
| Missing adapter layer | NO ACTION | Verified no cross-feature DAL consumption requiring an adapter boundary. Missing adapter remains acceptable unless professional is later exposed cross-feature. |

### Verification
- Commands/searches run:
  - `wc -l zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.professional.md`
  - `sed -n '1,260p' zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.professional.md`
  - `sed -n '261,520p' zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.professional.md`
  - `rg -n "EnterpriseWorkspace|useEnterpriseWorkspace|buildEnterpriseView|professionalWorkspace|ProfessionalAccessScreen|ProfessionalBriefingsScreen|NurseHomeScreen|INITIAL_HOUSING_NOTES|INITIAL_FACILITY_NOTES" apps/VCSM/src --glob '*.js' --glob '*.jsx'`
  - `find apps/VCSM/src/features/professional -type f \\( -name '*.js' -o -name '*.jsx' \\) | sort`
  - `sed -n '1,35p' apps/VCSM/src/shared/config/releaseFlags.js`
  - `sed -n '128,152p' apps/VCSM/src/app/routes/protected/app.routes.jsx`
  - `sed -n '1,55p' apps/VCSM/src/app/routes/lazyApp.jsx`
  - `sed -n '1,90p' apps/VCSM/src/features/professional/screens/ProfessionalAccessScreen.jsx`
  - `sed -n '1,90p' apps/VCSM/src/features/professional/professional-nurse/screens/NurseHomeScreenView.jsx`
- Production callers checked:
  - `dalListProfessionalBriefings`: live through `listProfessionalBriefings.controller.js`.
  - `dalMarkProfessionalBriefingsSeen`: live through `listProfessionalBriefings.controller.js`.
  - `EnterpriseWorkspace`: no callers outside enterprise folder.
  - `useEnterpriseWorkspace`: only consumed by `EnterpriseWorkspace`.
  - `buildEnterpriseView`: only consumed by `useEnterpriseWorkspace`.
  - `/professional-access` and `/professional/briefings`: both gated by `releaseFlags.professionalWorkspace`.
- Remaining risks:
  - Enterprise cluster deletion remains pending IRONMAN confirmation.
  - Static nurse workspace remains placeholder data when the professional workspace flag is enabled.
  - No source changes were made for this doc; build was not rerun after this append-only documentation pass. The previous build after post-scope source changes passed.

### Status
PARTIAL
