# SETTINGS_DEPENDENCY_MAP

**Ticket:** TICKET-0004 / SETTINGS-ARCH-001
**Phase:** 2 — P1 Settings
**Produced:** 2026-06-02
**Status:** Planning only — no code changes

---

## 1. Full Screen → Hook → Controller → DAL Map

```
VportSettingsFinalScreen.jsx
  ├─ useVportOwnership(actorId)               [dashboard/vport/hooks] ← gate only
  └─ [renders] VportSettingsScreen

VportSettingsScreen.jsx
  ├─ useVportDashboardDetails(actorId)        [profiles/kinds/vport/hooks] — READ
  ├─ useResolvedVportId(actorId)              [settings/vports/hooks]
  │    └─ ctrlResolveVportIdByActorId()
  ├─ useVportAds(actorId)                     [ads/adapters/hooks] — HEAVY
  │    └─ (full ads CRUD surface)
  ├─ useVportDirectoryVisibility(actorId, vportId)  [settings/vports/hooks]
  │    ├─ ctrlGetVportDirectoryState()
  │    └─ ctrlSetVportDirectoryVisible()
  │         └─ ownership gate → DB: vport.profile_public_details
  ├─ useVportBusinessCardSettings(actorId, type, vportId)  [settings/vports/hooks]
  │    ├─ ctrlGetVportBusinessCardSettings()
  │    └─ ctrlSetVportBusinessCardSettings()
  │         └─ ownership gate → DB: business_card_settings
  └─ useSaveVportSettings(actorId, ...)       [settings/hooks] ← ACTS AS CONTROLLER

useSaveVportSettings.js  [129 lines]
  ├─ useVportDashboardDetails(actorId)        ← DUPLICATE READ (also in screen)
  ├─ useSaveVportPublicDetailsByActorId
  │    └─ saveVportPublicDetailsByActorIdController
  │         ├─ assertActorOwnsVportActorController
  │         ├─ readVportProfileByActorIdDAL
  │         ├─ vportCities DAL (resolves city_id)
  │         └─ upsertVportPublicDetailsDAL
  │              └─ DB: vport.profile_public_details (RLS: actor_can_manage_profile)
  ├─ normalizeAddress()                       ← duplicates vportSettingsValidation.model
  ├─ hasCompleteAddress()                     ← duplicates vportSettingsValidation.model
  ├─ getAddressValidationError()              ← duplicates vportSettingsValidation.model
  ├─ [manages] draft state + onChange
  ├─ [manages] saving / saved state
  └─ [manages] toast lifecycle (toastOpen, toastMessage)
```

---

## 2. Ownership Boundaries

### What Each Hook Owns

| Hook | Owns | Source Feature |
|---|---|---|
| `useVportDashboardDetails` | Read-only: rich vport profile, hours, address, social links | `profiles/kinds/vport` |
| `useResolvedVportId` | Single vportId resolution; prevents duplicate DB reads | `settings/vports` |
| `useVportAds` | Full ads CRUD (create, save, publish, pause, archive, remove, list) | `ads/adapters` |
| `useVportDirectoryVisibility` | TRAZE directory_visible + directory_status read/write | `settings/vports` |
| `useVportBusinessCardSettings` | Business card toggle read/write | `settings/vports` |
| `useSaveVportSettings` | About/address/hours draft, validation, save orchestration, toast | `settings/hooks` ← should be controller |

### Feature Boundaries Crossed by VportSettingsScreen

```
cards/settings/
  ↓ imports from
    profiles/kinds/vport/hooks      (dashboard details)
    settings/vports/hooks           (3 hooks: resolvedVportId, directoryVisibility, businessCard)
    ads/adapters/hooks              (ads management)
    settings/adapters/ui/           (Card, field components)
    settings/profile/ui/            (VportAboutDetails.view)
    settings/vports/hooks/          (repeated reference)
```

The screen is the hub of 5 separate feature domains. There is no aggregation boundary
between the screen and the feature imports — the screen is directly responsible for
coordinating them all.

---

## 3. Duplicated Validation

### Validation Layer Conflict

| Validation | Location | Lines | Status |
|---|---|---|---|
| `normalizeAddress()` | `vportSettingsValidation.model.js` | canonical definition | MODEL layer ✓ |
| `normalizeCity/State/Zip/Country` | `vportSettingsValidation.model.js` | canonical definition | MODEL layer ✓ |
| `hasCompleteAddress()` | `vportSettingsValidation.model.js` | canonical definition | MODEL layer ✓ |
| `getAddressValidationError()` | `vportSettingsValidation.model.js` | canonical definition | MODEL layer ✓ |
| `normalizePhoneDigits()` | `vportSettingsValidation.model.js` | canonical definition | MODEL layer ✓ |
| Address validation call | `useSaveVportSettings.js` ~line 75 | applied inline in hook | HOOK layer ✗ |
| Phone validation call | `useSaveVportSettings.js` ~line 85 | applied inline in hook | HOOK layer ✗ |

**Analysis:** The model layer correctly owns the validation *definitions*. The hook calls them
correctly. The duplication is not in code repetition — it is in *responsibility ownership*:
the hook decides WHEN and HOW validation runs (before save, on blur, etc.), which is a
controller concern. Validation application belongs in `settingsCoordinator.controller.js`,
not in a hook.

The controller `saveVportPublicDetailsByActorIdController` does **not** re-validate —
it trusts the hook-layer validation entirely. If the save path is ever called directly
(e.g. via the exported controller), validation is skipped. The controller should own
validation delegation.

---

## 4. Cross-Feature Coupling

### `useVportAds` Over-Import

`useVportAds` is imported into `VportSettingsScreen` solely to render an ads preview
(`VportSettingsAdsPreview` shows the first 3 ads). The hook surface imported includes
full CRUD operations: `createDraft`, `saveDraft`, `publish`, `pause`, `archive`, `remove`.

Only `ads` and `loading` are consumed by the preview component.
The screen carries a full write-capable ads management hook for a read-only preview.

**Impact:** If the ads adapter changes, the settings screen is forced to update even though
it uses none of the write operations.

### `useVportDashboardDetails` Double-Load

`useVportDashboardDetails(actorId)` is called:
1. In `VportSettingsScreen` (to hydrate the view)
2. In `useSaveVportSettings` (to initialize the draft)

Both calls are separate hook instances. Each fires its own query on mount.
They resolve from the same 60s TTL cache, so the second call hits cache — but this
is coincidental, not enforced by architecture. If the cache is bypassed, two DB reads run.

**Fix:** `VportSettingsScreen` should load details once, pass them as props to `useSaveVportSettings`
as an input parameter (details already loaded by parent). The hook should not independently
fetch its initialization data.

### 10+ Import Sources in Screen

```javascript
// VportSettingsScreen.jsx imports from:
import { useVportDashboardDetails } from "@/features/profiles/kinds/vport/hooks/...";
import { useResolvedVportId } from "@/features/settings/vports/hooks/...";
import { useVportAds } from "@/features/ads/adapters/hooks/...";
import { useVportDirectoryVisibility } from "@/features/settings/vports/hooks/...";
import { useVportBusinessCardSettings } from "@/features/settings/vports/hooks/...";
import { useSaveVportSettings } from "./hooks/...";
import { VportSettingsAdsPreview } from "./components/...";
import { VportSettingsBusinessCard } from "./components/...";
import { VportSettingsTrazeCard } from "./components/...";
import { Card } from "@/features/settings/ui/...";
import { VportAboutDetails } from "@/features/settings/profile/ui/...";
// + dashboard responsive hooks, identity context, breakpoint, etc.
```

Any refactor of any upstream feature forces a settings screen change.

---

## 5. Coordinator Responsibilities (Current vs Target)

### What `useSaveVportSettings` Currently Does

1. Initializes draft state from `useVportDashboardDetails` (duplicate load)
2. Provides `onChange(patch)` field change handler
3. Validates address completeness via model functions (should be controller)
4. Validates phone format via model functions (should be controller)
5. Calls `useSaveVportPublicDetailsByActorId` → controller
6. Manages `saving` / `saved` lifecycle state
7. Manages `toastOpen` / `toastMessage` / `closeToast` lifecycle
8. Checks `isOwner` before allowing save
9. Returns 9+ properties to screen

This is a controller doing React binding + state management simultaneously.

### Target Responsibility Split

**`settingsCoordinator.controller.js`** (new)
- Owns: validation delegation (calls model functions), cross-feature save orchestration
- Input: `{ targetActorId, callerActorId, draft }`
- Does: validate → assertOwnership → savePublicDetails → (optional) invalidate dashboard details cache
- Returns: `{ ok, error }` — no React state

**`useSaveVportSettings.js`** (reduced to ~50 lines)
- Owns: React bindings only
- Manages: `draft` state, `saving` flag, `saved` flag, `toastOpen`, `toastMessage`
- Calls: `settingsCoordinator.controller.js`
- Does NOT: own validation logic, duplicate reads, cross-feature coordination

---

## 6. Answer: Should `settingsCoordinator.controller.js` Exist?

**YES.**

Evidence:
- `useSaveVportSettings` currently coordinates 5+ hooks from different features — that is a controller pattern, not a hook pattern
- Validation is applied in the hook but defined in the model — the controller should be the boundary between validation rules and persistence
- The save flow crosses three feature domains (profiles, settings/vports, ads) — coordination of cross-domain writes belongs in a controller
- The current hook is 129 lines; a properly scoped hook for this domain should be ~40-50 lines

The coordinator becomes the single point of ownership for: "given a settings draft, what writes happen in what order, with what validations, against what features?"

---

## 7. Estimated Refactor Effort

| Task | Effort |
|---|---|
| Create `settingsCoordinator.controller.js` | 1.5 hours |
| Reduce `useSaveVportSettings` to React bindings only | 45 min |
| Fix double-load of `useVportDashboardDetails` | 30 min |
| Replace `useVportAds` with a read-only ads query in settings | 30 min |
| Merge validation into controller layer | 30 min |
| Reduce screen import surface (10+ → 4-5) | 1 hour |
| **Total** | **~4.5 hours** |

This does NOT include the ARCHITECT work on `vportPublicDetails.write.dal` removing
from `index.js` (VENOM-SETTINGS-001 — separate security task).
