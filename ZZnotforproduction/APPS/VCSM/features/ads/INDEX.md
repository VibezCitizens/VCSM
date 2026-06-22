---
name: vcsm.ads.index
description: VCSM ads feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / ads

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-04
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 0 | No controller files present; adPipeline.usecase.js serves as orchestration layer |
| DAL files | 7 (cg) / 1 (fm) | ad.storage.dal.js (localStorage CRUD); api/ad.api.js is a thin shim over DAL |
| Hooks | 1 (cg) / 2 (fm) | useVportAds.js (main lifecycle hook), useDesktopBreakpoint.js |
| Models | 5 (cg) / 2 (fm) | ad.model.js (createAdDraft, normalizeAd), vportAdsSettingsShell.model.js |
| Screens | 3 (cg) / 2 (fm) | VportAdsSettingsScreen.jsx, adsScreens.js barrel |
| Components | 5 (cg) / 3 (fm) | adsPipeline.ui.js (AdEditor, AdsList, AdsEmptyState), VportAdsBackButton.jsx, components.jsx |
| Adapters | 2 (fm) | useVportAds.adapter.js, OnemoredaysAd.adapter.js |
| Barrels | 3 (cg) | ads.feature.js, adapters/hooks/useVportAds.adapter.js, screens/adsScreens.js |
| Tests | 0 | No test files detected by scanner |
| Routes | 0 | No route-map entries detected by scanner |
| Total source files | 18 | From feature-map scanner |

## Write Surface Map

No write surfaces detected by scanner. All persistence is via browser localStorage — no Supabase table writes, no RPCs, no edge functions.

Local storage key: `vc.ads.pipeline.v1` (defined in constants.js)
Operations: listAdsByActor (read), upsertAd (write), removeAd (delete) — all via ad.storage.dal.js against localStorage.

## Security-Sensitive Surfaces

No high-sensitivity Supabase write surfaces in static scan. However, the following runtime security concern is flagged:

- **actorId trust gap:** `VportAdsSettingsScreen` accepts `actorId` from URL params (`useParams().actorId`) without verifying ownership via `actor_owners`. Any authenticated actor can pass any actorId and read/write that actor's localStorage ads on their own device. When backend persistence is added, this becomes a critical authorization gap.

## Engine Dependencies

None detected. This feature is fully self-contained — no engines from `engines/` are imported.

## Routes

No routes in route-map for this feature. VportAdsSettingsScreen is exported via adsScreens.js barrel but scanner detected no registered app-level route pointing to it. Route registration status unknown — requires HAWKEYE verification.

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT (PLACEHOLDER — content not written) |
| ARCHITECTURE.md | PRESENT (this run — 2026-06-04) |
| CURRENT_STATUS.md | PRESENT (this run — 2026-06-04) |
| SCREENS.md | PRESENT (pre-existing) |
