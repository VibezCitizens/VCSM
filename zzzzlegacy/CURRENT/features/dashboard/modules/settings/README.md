# Module: Settings

**VPORT Kinds:** ALL
**Public/Owner:** OWNER only
**Route:** `/actor/:actorId/dashboard/settings`
**Source:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/settings/`
**Governance status:** SECURITY_REVIEW_PENDING
**Last updated:** 2026-05-27

---

## What This Module Does

Provides the VPORT owner settings panel. The owner can update:

- **Public business details** — website URL, booking URL, email, phone, address, hours, highlights, languages, payment methods
- **TRAZE directory visibility** — show/hide the VPORT in the programmatic SEO discovery layer (traffic.vibezcitizens.com)
- **Business card display toggles** — which contact fields, action buttons, and sections appear on the public-facing business card
- **Dashboard tabs overview** — read-only view of active dashboard tabs (links back to dashboard)
- **Ads preview** — feature-flagged via `releaseFlags.vportAdsPipeline`

---

## Source Inventory

### Screens
- `VportSettingsFinalScreen.jsx` — Route entry + identity/ownership gate only (Final Screen per architecture contract). Delegates all composition to `VportSettingsScreen`.
- `VportSettingsScreen.jsx` — Hook wiring + component composition (View Screen per architecture contract). Receives `actorId` and `isOwner` from Final Screen.

### Controller
- `controller/saveVportPublicDetailsByActorId.controller.js` — `saveVportPublicDetailsByActorIdController` — ownership gate → profile resolution → payload normalization → city resolution → upsert to `vport.profile_public_details`

### DAL
- `dal/vportPublicDetails.write.dal.js` — `upsertVportPublicDetailsDAL` — upserts `vport.profile_public_details` on `profile_id` conflict

### Hooks
- `hooks/useSaveVportPublicDetailsByActorId.js` — Wires controller with identity context and cache invalidation
- `hooks/useSaveVportSettings.js` — Draft state, address + phone validation, save orchestration, toast lifecycle

### Models
- `model/vportSettingsDraft.model.js` — `mapPublicDetailsToDraft` — maps public details response to editable draft shape
- `model/vportSettingsValidation.model.js` — Pure address normalization, phone normalization, and validation helpers

### Components
- `components/CardSettingToggleRow.jsx` — Toggle row UI primitive
- `components/VportSettingsAdsPreview.jsx` — Ads pipeline preview section (feature-flagged)
- `components/VportSettingsBusinessCard.jsx` — Business card display toggle section
- `components/VportSettingsTrazeCard.jsx` — TRAZE directory visibility section

---

## Cross-Feature Dependencies (View Screen)

These hooks are called from `VportSettingsScreen` but live outside the `cards/settings/` boundary:

| Hook | Location | Purpose |
|---|---|---|
| `useVportDashboardDetails` | `features/profiles/adapters/kinds/vport/` | Loads public details on mount |
| `useProfilesOps` | `features/profiles/adapters/` | Provides `invalidateVportPublicDetails` + tab metadata |
| `useResolvedVportId` | `features/settings/vports/hooks/` | Resolves `vportId` once for both settings hooks |
| `useVportDirectoryVisibility` | `features/settings/vports/hooks/` | TRAZE visibility toggle read/write |
| `useVportBusinessCardSettings` | `features/settings/vports/hooks/` | Business card display toggles read/write |
| `useVportAds` | `features/ads/adapters/` | Ads list (feature-flagged) |

---

## Database

- **Write table:** `vport.profile_public_details` — upsert on `profile_id` conflict
- **Read path:** `vport.profiles` — resolves `profile_id` from `actorId` before any write
- **City resolution:** reads/creates city record via `resolveVportCity`; silently suppressed on failure (non-blocking)

---

## Architecture Compliance Notes

- **VPD-V-FIX-008:** Final/View screen split enforced — `VportSettingsFinalScreen` handles only identity/ownership gate
- **VPD-V-FIX-007:** Draft state, validation, and save orchestration extracted to `useSaveVportSettings` — no business logic in View Screen
- **VPD-V-FIX-003:** `useResolvedVportId` resolves `vportId` once and shares it between both settings hooks — eliminates a duplicate DB call that previously fired from each hook independently on mount

---

## References

- Architecture doc: **PENDING** — `vcsm.vport-dashboard-settings-card.architecture.md` (not yet created)
- Related: `modules/external-site/` — TRAZE is external discovery (settings TRAZE toggle controls discoverability)
