# INDEX — VCSM / dashboard / modules / portfolio

**Last ARCHITECT Run:** 2026-06-05
**Status:** SOURCE_VERIFIED
**Ticket:** TICKET-ARCHITECT-DASHBOARD-MODULE-WAVE-0001

---

## Source File Inventory

| File | Layer | Lines Read |
|---|---|---|
| VportDashboardPortfolioScreen.jsx | screen | 1-242 |
| controller/addPortfolioMediaWithRecord.controller.js | controller | 1-79 |
| controller/probeVportPortfolio.controller.js | controller | 1-65 |
| dal/portfolioMediaRecord.write.dal.js | dal | 1-20 |
| hooks/usePortfolioItemSubmit.js | hook | 1-167 |
| hooks/useVportPortfolioProbe.js | hook | 1-54 |
| hooks/usePortfolioMediaUpload.js | hook | not read |
| components/PortfolioBugsBunnyPanel.jsx | component | not read |
| components/PortfolioDevDiagnosticPanel.jsx | component | not read |
| components/portfolio/PortfolioItemForm.jsx | component | not read |
| components/portfolio/PortfolioManagerCard.jsx | component | not read |
| __tests__/portfolio.index.rule9.test.js | test | not read |
| __tests__/portfolio.spiderman.test.js | test | not read |
| index.js | barrel | 1-10 |

## Module Counts (SOURCE_VERIFIED)

| Layer | Count |
|---|---|
| screen | 1 |
| controller | 2 |
| dal | 1 (write) |
| hook | 3 |
| component | 4 |
| model | 0 |
| adapter | 0 local |
| tests | 2 |

## Routes

| Route | Access | Screen |
|---|---|---|
| /actor/:actorId/dashboard/portfolio | PROTECTED (OwnerOnlyDashboardGuard + isOwner check) | VportDashboardPortfolioScreen |

## Write Surfaces

| Table | Operation | Owner | Guard |
|---|---|---|---|
| portfolio_media | UPDATE (media_asset_id) | this module | callerProfileId scope (PORT-V-005) |
| portfolio_items | INSERT/UPDATE | @portfolio engine | engine-level |
| portfolio_media | INSERT/DELETE | @portfolio engine | engine-level |
| portfolio_tags | INSERT/DELETE | @portfolio engine | engine-level |

## Engine Consumption (SOURCE_VERIFIED)

| Engine | Method | File |
|---|---|---|
| @portfolio | deleteItem | VportDashboardPortfolioScreen |
| @portfolio | createItem, updateItem, addMedia | usePortfolioItemSubmit |
| profiles adapter | useVportPortfolio, usePublishBarbershopPortfolioPost | VportDashboardPortfolioScreen |

## Boundary Violations (HIGH)

| File | Import | Risk |
|---|---|---|
| hooks/usePortfolioItemSubmit.js | ctrlSavePortfolioDetail from profiles/kinds/vport/controller/locksmith/locksmithOwner.controller | HIGH |
| hooks/usePortfolioItemSubmit.js | publishLocksmithPortfolioUpdateAsPostController from profiles/kinds/vport/controller/locksmith/... | HIGH |

## Ownership (SOURCE_VERIFIED — 3 layers)

1. Screen: `if (!isOwner) return null` via useVportOwnership
2. Controller: assertActorOwnsVportActorController in probeVportPortfolio
3. DAL: `.eq('profile_id', callerProfileId)` in portfolioMediaRecord.write.dal (PORT-V-005)

## Independence / Completeness

| Field | Value |
|---|---|
| Independence | MOSTLY INDEPENDENT |
| Completeness | MOSTLY COMPLETE |
| BEHAVIOR.md | MISSING |
| Security audit | MISSING (ownership confirmed; boundary violations need remediation) |
