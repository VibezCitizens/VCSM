---
type: reorganization-manifest
date: 2026-04-30T22:49:05
author: Claude Code
status: completed
---

# Reorganization: VPORT Business Card → features/public/vportBusinessCard/

## Motivation

VPORT business card is a VPORT domain feature, not a Wanders feature.
It was incorrectly placed under `features/wanders/` in an earlier implementation.
Moved to `features/public/vportBusinessCard/` alongside other public VPORT surfaces.

## Backup

```
zNOTFORPRODUCTION/zcontract/doc/backups/move-vport-business-card-20260430-224905/
```

21 files backed up before any edits.

## Files Moved (Old → New)

| Old Path | New Path |
|---|---|
| `features/wanders/screens/VportBusinessCardPublic.screen.jsx` | `features/public/vportBusinessCard/screen/VportBusinessCardPublic.screen.jsx` |
| `features/wanders/screens/view/VportBusinessCardPublic.view.jsx` | `features/public/vportBusinessCard/view/VportBusinessCardPublic.view.jsx` |
| `features/wanders/screens/view/BusinessCardMainCard.jsx` | `features/public/vportBusinessCard/view/BusinessCardMainCard.jsx` |
| `features/wanders/screens/view/BusinessCardLeadForm.jsx` | `features/public/vportBusinessCard/view/BusinessCardLeadForm.jsx` |
| `features/wanders/screens/view/businessCardHelpers.jsx` | `features/public/vportBusinessCard/view/businessCardHelpers.jsx` |
| `features/wanders/screens/view/businessCardCardStyles.js` | `features/public/vportBusinessCard/view/businessCardCardStyles.js` |
| `features/wanders/screens/view/businessCardFormStyles.js` | `features/public/vportBusinessCard/view/businessCardFormStyles.js` |
| `features/wanders/screens/view/businessCardSections.jsx` | `features/public/vportBusinessCard/view/businessCardSections.jsx` |
| `features/wanders/screens/view/businessCardPrimarySection.jsx` | `features/public/vportBusinessCard/view/businessCardPrimarySection.jsx` |
| `features/wanders/screens/view/businessCardExtraSection.jsx` | `features/public/vportBusinessCard/view/businessCardExtraSection.jsx` |
| `features/wanders/screens/view/components/BusinessCardSectionCard.jsx` | `features/public/vportBusinessCard/view/components/BusinessCardSectionCard.jsx` |
| `features/wanders/core/hooks/useVportBusinessCardExperience.hook.js` | `features/public/vportBusinessCard/hooks/useVportBusinessCardExperience.js` |
| `features/wanders/core/hooks/useVportBusinessCardLeadForm.hook.js` | `features/public/vportBusinessCard/hooks/useVportBusinessCardLeadForm.js` |
| `features/wanders/core/hooks/useVportBusinessCardSections.hook.js` | `features/public/vportBusinessCard/hooks/useVportBusinessCardSections.js` |
| `features/wanders/core/controllers/vportBusinessCard.controller.js` | `features/public/vportBusinessCard/controller/vportBusinessCard.controller.js` |
| `features/wanders/core/dal/read/vportBusinessCard.read.dal.js` | `features/public/vportBusinessCard/dal/vportBusinessCard.read.dal.js` |
| `features/wanders/core/dal/read/businessCardSections.read.dal.js` | `features/public/vportBusinessCard/dal/businessCardSections.read.dal.js` |
| `features/wanders/core/dal/write/vportBusinessCardLead.write.dal.js` | `features/public/vportBusinessCard/dal/vportBusinessCardLead.write.dal.js` |
| `features/wanders/core/dal/edge/sendLeadConfirmationEmail.edge.dal.js` | `features/public/vportBusinessCard/dal/sendLeadConfirmationEmail.edge.dal.js` |
| `features/wanders/core/models/vportBusinessCard.model.js` | `features/public/vportBusinessCard/model/vportBusinessCard.model.js` |
| `features/wanders/core/models/businessCardSettings.model.js` | `features/public/vportBusinessCard/model/businessCardSettings.model.js` |

## New File Added

| File | Purpose |
|---|---|
| `features/public/vportBusinessCard/index.js` | Barrel export for `VportBusinessCardPublicScreen` |

## External Files Updated (Not Moved)

| File | Change |
|---|---|
| `apps/VCSM/src/app/routes/lazyPublic.jsx` | `VportBusinessCardPublicScreen` import updated to new screen path |
| `apps/VCSM/src/features/wanders/core/hooks/useWandersBusinessCardOps.js` | Controller + model imports updated to new paths |
| `apps/VCSM/src/features/dashboard/vport/screens/components/VportSettingsBusinessCard.jsx` | `getSectionToggles` import updated to new model path |

## Files Left in Place (Wanders — Not Touched)

| File | Reason |
|---|---|
| `features/wanders/core/hooks/useWandersBusinessCardOps.js` | Wanders adapter hook — stays in wanders, imports updated |
| `features/wanders/core/adapters/wanders.adapter.js` | Re-exports `useWandersBusinessCardOps` — no change needed |

## Route Unchanged

```
/vport/:slug/card → VportBusinessCardPublicScreen
```

Route registered in `wanders.routes.jsx` as a prop-injected component.
Route path and component identity are preserved — no routing behavior change.

## RPC Unchanged

- `vport.read_business_card_public` — confirmed still called from new DAL
- `vport.get_business_card_sections` — confirmed still called from new DAL
- `vport.submit_business_card_lead` — confirmed still called from new write DAL

## Verification Checks

| Check | Result |
|---|---|
| VportBusinessCard files remaining under `features/wanders` | Only adapter re-export (expected) |
| `read_business_card_public` called from new DAL | ✅ confirmed |
| `select("*")` in new module | ✅ NONE |
| Supabase/vportClient usage outside DAL | ✅ DAL files only |
| `features/wanders` imports inside new module | ✅ NONE |
| Old wanders source files removed | ✅ 21 files deleted |

## Build Result

```
✓ built in 5.41s
PWA v1.2.0 — 255 entries precached
No errors. No warnings related to this change.
```
