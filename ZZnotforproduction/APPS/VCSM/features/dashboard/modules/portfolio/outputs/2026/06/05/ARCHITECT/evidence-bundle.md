# Evidence Bundle — ARCHITECT V2
## Module: dashboard/modules/portfolio
**Date:** 2026-06-05
**Ticket:** TICKET-ARCHITECT-DASHBOARD-MODULE-WAVE-0001
**Scanner Version:** 1.1.0
**Confidence:** HIGH

---

## Scope

Feature: dashboard
Module: portfolio
Root: apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/

---

## Source Files Read

| File | Layer | Lines |
|---|---|---|
| VportDashboardPortfolioScreen.jsx | screen | 1-242 |
| controller/addPortfolioMediaWithRecord.controller.js | controller | 1-79 |
| controller/probeVportPortfolio.controller.js | controller | 1-65 |
| dal/portfolioMediaRecord.write.dal.js | dal | 1-20 |
| hooks/usePortfolioItemSubmit.js | hook | 1-167 |
| hooks/useVportPortfolioProbe.js | hook | 1-54 |
| index.js | barrel | 1-10 |

Source files validated: 7
Source files not read (inventory only): 7 (usePortfolioMediaUpload, 4 components, 2 tests)

---

## Layer Counts

| Layer | Count |
|---|---|
| screen | 1 |
| controller | 2 |
| dal | 1 (write) |
| hook | 3 |
| component | 4 |
| model | 0 |
| adapter (local) | 0 |

---

## Routes

| Route | Access | Owner File |
|---|---|---|
| /actor/:actorId/dashboard/portfolio | PROTECTED | apps/VCSM/src/app/routes/protected/app.routes.jsx |

---

## Call Chains

| ID | Path | User-Controlled Params | Ownership Checked | Confidence |
|---|---|---|---|---|
| CHAIN-portfolio-001 | VportDashboardPortfolioScreen → deleteItem (@portfolio engine) | item.id, targetActorId | YES (screen isOwner + engine-level) | HIGH |
| CHAIN-portfolio-002 | usePortfolioItemSubmit → createItem (@portfolio) → addPortfolioMediaWithRecord → portfolioMediaRecord.write.dal | actorId, files, title, description | YES (3 layers: isOwner + controller assert + DAL callerProfileId) | HIGH |
| CHAIN-portfolio-003 | usePortfolioItemSubmit → updateItem (@portfolio) | editItemId, actorId | YES (screen isOwner + engine-level) | HIGH |
| CHAIN-portfolio-004 | usePortfolioItemSubmit → ctrlSavePortfolioDetail (profiles internals) | identityActorId, actorId, itemId | PARTIAL (identityActorId passed but enforcement inside profiles) | HIGH |
| CHAIN-portfolio-005 | addPortfolioMediaWithRecord → addMedia (@portfolio engine) → createMediaAssetController → updatePortfolioMediaAssetIdDAL | portfolioMediaId, callerProfileId | YES (PORT-V-005: .eq('profile_id', callerProfileId)) | HIGH |

---

## Security-Sensitive Surfaces

| Surface | File | Risk | Priority |
|---|---|---|---|
| updatePortfolioMediaAssetIdDAL | dal/portfolioMediaRecord.write.dal.js | UPDATE with callerProfileId scope — PORT-V-005 confirmed | LOW (mitigated) |
| ctrlSavePortfolioDetail import | hooks/usePortfolioItemSubmit.js | Direct import from profiles/kinds/vport/controller internals | HIGH (boundary violation) |
| publishLocksmithPortfolioUpdateAsPostController import | hooks/usePortfolioItemSubmit.js | Direct import from profiles controller internals | HIGH (boundary violation) |
| assertActorOwnsVportActorController | controller/probeVportPortfolio.controller.js | Ownership assert present — confirmed | LOW (mitigated) |

---

## Database Writes

| DAL | Function | Operation | Table | Guard |
|---|---|---|---|---|
| dal/portfolioMediaRecord.write.dal.js | updatePortfolioMediaAssetIdDAL | UPDATE | portfolio_media | callerProfileId scope (PORT-V-005) |
| @portfolio engine | addMedia, createItem, updateItem, deleteItem | INSERT/UPDATE/DELETE | portfolio_items, portfolio_media, portfolio_tags | engine-level |

---

## Database Reads

| DAL | Function | Table | Caller |
|---|---|---|---|
| vportProfile.read.dal (via booking adapter) | readVportProfileByActorIdDAL | profiles/vport | probeVportPortfolio.controller |
| vportProfileActorAccess.read.dal | readVportProfileActorAccessDAL | profile actor access | probeVportPortfolio.controller |
| actorOwners.read.dal | readActorOwnersByActorIdDAL | actor_owners | probeVportPortfolio.controller |

---

## Engine Usage

| Engine | Method | File |
|---|---|---|
| @portfolio | deleteItem | VportDashboardPortfolioScreen |
| @portfolio | createItem, updateItem, addMedia | usePortfolioItemSubmit |
| profiles adapter | useVportPortfolio, usePublishBarbershopPortfolioPost | VportDashboardPortfolioScreen |
| booking adapter | assertActorOwnsVportActorController | probeVportPortfolio.controller |

---

## Boundary Violations

| File | Import | Risk |
|---|---|---|
| hooks/usePortfolioItemSubmit.js:5 | ctrlSavePortfolioDetail from profiles/kinds/vport/controller/locksmith/locksmithOwner.controller | HIGH — bypasses adapter |
| hooks/usePortfolioItemSubmit.js:6 | publishLocksmithPortfolioUpdateAsPostController from profiles/kinds/vport/controller/locksmith/... | HIGH — bypasses adapter |

---

## Behavior Contract Check (Area 9)

BEHAVIOR.md: MISSING
Check A: FINDING — controllers + DAL + hooks present, no BEHAVIOR.md
Check B: N/A
Check C: N/A
Check D: N/A

---

## Provenance

Scanner maps consumed: feature-map, route-map, write-surface-map, write-execution-map
Source files validated: 7
Confidence: HIGH
