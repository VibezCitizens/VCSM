---
title: Settings Feature — Adapter Boundary
status: ACTIVE
feature: settings
created: 2026-06-07
---

# settings — ADAPTER BOUNDARY

## Public Adapter

**File:** `apps/VCSM/src/features/settings/adapters/settings.adapter.js`

### Exports

| Export | Source | Purpose |
|---|---|---|
| `useVportAccountOps` | `account/hooks/useVportAccountOps` | Cross-feature VPORT operations for other features |
| `useVportDirectoryVisibility` | `vports/hooks/useVportDirectoryVisibility` | Directory visibility toggle state |
| `useVportBusinessCardSettings` | `vports/hooks/useVportBusinessCardSettings` | Business card publish state |
| `useResolvedVportId` | `vports/hooks/useResolvedVportId` | Active VPORT ID resolution |

**Boundary Assessment:** THIN — only 4 exports. Many controllers and hooks are consumed
cross-feature without going through this adapter. Flagged in ARCHITECTURE.md spaghetti scan.

---

## Sub-Adapters

### privacy/hooks/useMyBlocks.adapter.js

| Export | Purpose |
|---|---|
| `useMyBlocks` | React context consumer for block list state |

### profile/ui/VportAboutDetails.view.adapter.js

| Export | Purpose |
|---|---|
| `VportAboutDetails` (view) | VPORT about section view, consumed by external features |

### ui/Card.adapter.js

| Export | Purpose |
|---|---|
| `Card` | Reusable settings card container UI |

---

## Cross-Feature Imports INTO Settings

Settings consumes from other features via their adapters:

| Dependency | Imported Symbol | Used In | Safety |
|---|---|---|---|
| `booking.adapter` | `assertActorOwnsVportActorController` | 3 vports controllers, 1 privacy controller | SAFE |
| `vport.public.adapter` | `useVportCoreOps` | `useVportAccountOps` | SAFE |
| `social/adapters/privacy` | `invalidateActorPrivacyCacheAdapter` | `actorPrivacy.controller.js` | FLAGGED — cross-feature import, not from canonical engine |
| `feed/adapters/feedCache` | `invalidateActorBundleEntry` | `actorPrivacy.controller.js` | FLAGGED — cross-feature import, not from canonical engine |

**Concern:** `invalidateActorPrivacyCacheAdapter` and `invalidateActorBundleEntry` are
imported from peer features (social, feed) rather than from shared engines. This creates
lateral coupling at controller layer. Flagged as ARCHITECTURE.md boundary warning.

---

## What Is NOT Exported (Internal Only)

Controllers, DAL functions, models, and raw hooks not listed above are internal.
No external feature should import them directly.

Current violations exist (see ARCHITECTURE.md spaghetti section).

---

## Undocumented Live Sub-Modules (No Docs Yet)

| Sub-module | Files | Status |
|---|---|---|
| `queries/` | 6 React Query hooks (useAccountSettings, useBlockedCitizens, usePrivacySettings, useProfileSettings, useUpdateVportVisibility, useUserVports) | UNDOCUMENTED — cross-cutting read layer |
| `screen/` | SettingsScreen.jsx | Documented in root SCREENS.md |
| `ui/` | Card.jsx, Row.jsx | UNDOCUMENTED — shared UI primitives |
| `constants.js` | UPLOAD_ENDPOINT, MAX_IMAGE_BYTES, TYPE_OPTIONS | UNDOCUMENTED |
| `sponsored/` | Omd.view.jsx | UNDOCUMENTED — origin unclear |
