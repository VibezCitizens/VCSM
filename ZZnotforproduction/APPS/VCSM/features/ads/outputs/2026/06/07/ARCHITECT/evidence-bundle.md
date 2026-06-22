---
name: vcsm.ads.evidence-bundle
description: ARCHITECT V2 evidence bundle — VCSM:ads — 2026-06-07
metadata:
  type: evidence-bundle
  owner: ARCHITECT
  generated: 2026-06-07T10:00:00Z
  scanner-version: 1.1.0
---

# ARCHITECT Evidence Bundle — VCSM:ads
**Generated:** 2026-06-07T10:00:00Z
**Scanner Version:** 1.1.0
**Scope:** VCSM:ads
**Confidence:** HIGH (security surfaces) / MEDIUM (UX files not fully read)

---

## Source Files Read

| Path | Layer | Lines |
|---|---|---|
| apps/VCSM/src/features/ads/dal/ad.storage.dal.js | dal | 1-65 |
| apps/VCSM/src/features/ads/api/ad.api.js | module | 1-12 |
| apps/VCSM/src/features/ads/usecases/adPipeline.usecase.js | module | 1-51 |
| apps/VCSM/src/features/ads/lib/ad.validation.js | model | 1-34 |
| apps/VCSM/src/features/ads/adapters/hooks/useVportAds.adapter.js | adapter | not read |
| apps/VCSM/src/features/ads/hooks/useVportAds.js | hook | not read |

**Total source files validated:** 4 of 18

---

## Layer Counts (VCSM:ads module)

| Layer | Count | Files |
|---|---|---|
| adapter | 2 | useVportAds.adapter.js, OnemoredaysAd.adapter.js |
| controller | 0 | ABSENT — usecase layer used instead |
| dal | 1 | ad.storage.dal.js (localStorage only) |
| hook | 2 | useDesktopBreakpoint.js, useVportAds.js |
| model | 2 | ad.model.js, vportAdsSettingsShell.model.js |
| screen | 2 | VportAdsSettingsScreen.jsx, adsScreens.js |
| component | 3 | VportAdsBackButton.jsx, adsPipeline.ui.js, components.jsx |

---

## Write Surfaces

| Surface | Operation | Storage | Ownership Check | Priority |
|---|---|---|---|---|
| upsertAd | localStorage write | window.localStorage | ABSENT | CRITICAL |
| removeAd | localStorage delete | window.localStorage | ABSENT | HIGH |
| listAdsByActor | localStorage read | window.localStorage | client-side actorId filter | MEDIUM |

---

## Security-Sensitive Surfaces

| Surface | File | Risk | Priority |
|---|---|---|---|
| upsertAd | dal/ad.storage.dal.js:43 | localStorage write; any actorId accepted; no session assertion | CRITICAL |
| removeAd | dal/ad.storage.dal.js:61 | localStorage delete; no ownership check | HIGH |
| validateAdDraft | lib/ad.validation.js:4 | permits http:// URLs for destinationUrl and mediaUrl | MEDIUM |

---

## Call Chains Summary

| Chain | Path | User-Controlled Params | Ownership Checked |
|---|---|---|---|
| CHAIN-ads-001 | useVportAds → listAdsUseCase → fetchAds → listAdsByActor (localStorage) | actorId | NO (client-side filter only) |
| CHAIN-ads-002 | useVportAds → saveDraftUseCase → validateAdDraft + saveAd → upsertAd (localStorage) | ad object | NO |
| CHAIN-ads-003 | useVportAds → deleteAdUseCase → deleteAd → removeAd (localStorage) | id | NO |

---

## Behavior IDs
None — BEHAVIOR.md is PLACEHOLDER.

---

## Architecture State

- No DB-backed persistence — localStorage only (intentional draft/staging feature)
- No controller layer — usecase pattern used instead of canonical DAL→Model→Controller stack
- No RPCs, no edge functions
- VportAdsSettingsScreen is behind ProtectedRoute + ProfileGatedOutlet (route-level protection)
- No tests (0 test files in scanner)
- ads.feature.js present (feature registration file)
- Scanner maps FRESH: generated 2026-06-07T08:11:09Z
