# Runtime Feature Index: portfolio

## Metadata

| Field | Value |
|---|---|
| Feature | portfolio |
| CURRENT Folder | CURRENT/features/portfolio |
| Source Folder | apps/VCSM/src/features/portfolio + engines/portfolio + features/dashboard/vport/dashboard/cards/portfolio |
| Generated | 2026-06-02 |
| Scope | VCSM |
| Evidence Mode | Source scan + CURRENT evidence |
| Architecture State | EVOLVING |
| Module Status | MOSTLY COMPLETE |
| Security Tier | LOW |
| THOR Status | THOR_BLOCKED (ELEK-040 unresolved, VENOM not run) |

---

## Source Inventory

| Layer | Count | Key Files |
|---|---:|---|
| Controllers | 11 | createItem.controller.js, updateItem.controller.js, deleteItem.controller.js, addMedia.controller.js, removeMedia.controller.js, manageTags.controller.js, listPortfolio.controller.js, getPortfolioItem.controller.js (engine); addPortfolioMediaWithRecord.controller.js, probeVportPortfolio.controller.js (dashboard card); VportPortfolio.controller.js (profiles) |
| DALs | 9 | portfolioItems.read.dal.js, portfolioItems.write.dal.js, portfolioMedia.read.dal.js, portfolioMedia.write.dal.js, portfolioTags.read.dal.js, portfolioTags.write.dal.js, barberDetails.read.dal.js, locksmithDetails.read.dal.js (engine); portfolioMediaRecord.write.dal.js (dashboard card) |
| Hooks | 4 | useVportPortfolio.js (profiles), usePortfolioItemSubmit.js (dashboard card), usePortfolioMediaUpload.js (dashboard card), useVportPortfolioProbe.js (dashboard card) |
| Models | 4 | PortfolioItem.model.js, PortfolioMedia.model.js, BarberDetails.model.js, LocksmithDetails.model.js (engine) |
| Screens | 1 | VportDashboardPortfolioScreen.jsx |
| Components | 4 | PortfolioItemForm.jsx, PortfolioManagerCard.jsx, PortfolioDevDiagnosticPanel.jsx, PortfolioBugsBunnyPanel.jsx |
| Routes | 1 | /actor/:actorId/dashboard/portfolio |
| Tests | 0 | NONE FOUND |

Note — feature root (apps/VCSM/src/features/portfolio/) contains only 1 file: setup.js.
All controllers, DALs, models, hooks, screens, and components live in the engine
(engines/portfolio/) or in the dashboard card and profiles features.

---

## Route / Screen Map

| Route / Screen | Source Path | Public/Auth/Owner | Notes |
|---|---|---|---|
| /actor/:actorId/dashboard/portfolio | apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/VportDashboardPortfolioScreen.jsx | OWNER | Guarded by useVportOwnership; non-owners see "Owner access only." |
| VPORT profile portfolio tab | apps/VCSM/src/features/profiles/kinds/vport/ | PUBLIC (read) | Portfolio items displayed via useVportPortfolio; public visitors can view |

---

## Mutation Surface Map

| Surface | Source Path | Write Type | Ownership Gate Known | Risk |
|---|---|---|---|---|
| createItem (engine) | engines/portfolio/src/controller/createItem.controller.js | INSERT vport.portfolio_items | YES — isActorOwner(actorId) DI check | LOW |
| updateItem (engine) | engines/portfolio/src/controller/updateItem.controller.js | UPDATE vport.portfolio_items | YES — isActorOwner + profile_id cross-check | LOW |
| deleteItem (engine) | engines/portfolio/src/controller/deleteItem.controller.js | UPDATE vport.portfolio_items (soft delete) | YES — isActorOwner + profile_id cross-check | LOW |
| addMedia (engine) | engines/portfolio/src/controller/addMedia.controller.js | INSERT vport.portfolio_media | YES — isActorOwner + profile_id cross-check (PORT-V-003) | LOW |
| removeMedia (engine) | engines/portfolio/src/controller/removeMedia.controller.js | UPDATE vport.portfolio_media (deactivate) | YES — isActorOwner | LOW |
| manageTags (engine) | engines/portfolio/src/controller/manageTags.controller.js | DELETE+INSERT vport.portfolio_tags | YES — isActorOwner + profile_id cross-check | LOW |
| addPortfolioMediaWithRecord | features/dashboard/vport/dashboard/cards/portfolio/controller/addPortfolioMediaWithRecord.controller.js | INSERT vport.portfolio_media + platform.media_assets (non-blocking) | YES — delegates to addMedia (engine gate applies) | LOW |
| updatePortfolioMediaAssetIdDAL | features/dashboard/vport/dashboard/cards/portfolio/dal/portfolioMediaRecord.write.dal.js | UPDATE vport.portfolio_media.media_asset_id | PARTIAL — requires callerProfileId + scopes by profile_id; throws on null callerProfileId (PORT-V-005) | MEDIUM |
| ctrlSavePortfolioDetail (locksmith) | features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller.js | UPDATE locksmith portfolio details | NO — ELEK-2026-05-28-040: missing assertActorOwnsVportActorController | HIGH |

---

## Security-Sensitive Surface Map

| Surface | Source Path | Sensitivity | Evidence |
|---|---|---|---|
| setup.js isActorOwner DI binding | apps/VCSM/src/features/portfolio/setup.js | CRITICAL OWNERSHIP — single file controlling ownership enforcement for entire engine | isActorOwner queries vc.actor_owners with RLS-enforced user_id scoping; must be called before render |
| ctrlSavePortfolioDetail (called from usePortfolioItemSubmit) | features/profiles/kinds/vport/controller/locksmith/ | HIGH — missing ownership gate | ELEK-2026-05-28-040: any authenticated user knowing actorId + portfolioItemId can corrupt locksmith portfolio details |
| updatePortfolioMediaAssetIdDAL | features/dashboard/vport/dashboard/cards/portfolio/dal/ | MEDIUM — ownership scoping | ELEK-2026-05-28-041: silently drops ownership filter if callerProfileId is null (now throws, but original risk documented) |
| VportDashboardPortfolioScreen — deleteItem call | features/dashboard/vport/dashboard/cards/portfolio/VportDashboardPortfolioScreen.jsx | MEDIUM — delete path | Guarded by useVportOwnership at screen level + engine isActorOwner inside deleteItem |

---

## Engine Dependency Map

| Engine | Alias | Import Points | Surfaces |
|---|---|---|---|
| engines/portfolio/ | @portfolio | setup.js, VportDashboardPortfolioScreen.jsx, usePortfolioItemSubmit.js, addPortfolioMediaWithRecord.controller.js, VportPortfolio.controller.js | createItem, updateItem, deleteItem, addMedia, removeMedia, manageTags, listPortfolio, getPortfolioItem, configurePortfolioEngine |
| engines/media/ | @media | usePortfolioMediaUpload.js, addPortfolioMediaWithRecord.controller.js | useMediaUpload, createMediaAssetController, resolveVcsmAppId |

---

## Structural Risk Summary

| Risk | Severity | Status |
|---|---|---|
| ELEK-2026-05-28-040 — ctrlSavePortfolioDetail missing ownership gate | HIGH | OPEN |
| ELEK-2026-05-28-041 — updatePortfolioMediaAssetIdDAL null ownership filter risk | LOW | OPEN (mitigated with throw) |
| Fragmented module layout (portfolio UI distributed across 3 feature paths) | MEDIUM | STRUCTURAL |
| setup.js single point of failure for all engine ownership enforcement | MEDIUM | STRUCTURAL |
| probeVportPortfolio.controller.js crosses feature boundary to dashboard/vport/dal directly | LOW | STRUCTURAL |
| Zero test coverage on portfolio write path | MEDIUM | GAP |
| Zero governance documentation | MEDIUM | GAP |

---

## Governance Coverage

| Doc | Status |
|---|---|
| ARCHITECTURE.md | PRESENT (generated 2026-06-02) |
| DR_STRANGE.md | PRESENT (generated 2026-06-02) |
| vcsm.portfolio.architecture.md | PRESENT (legacy module report) |
| SECURITY.md | MISSING |
| OWNERSHIP.md | MISSING |
| CURRENT_STATUS.md | MISSING |
| TESTS.md | MISSING |
| PERFORMANCE.md | MISSING |
| BLOCKERS.md | MISSING |
| DEFERRED.md | MISSING |
| HISTORY_INDEX.md | MISSING |

---

## Command Coverage

| Command | Status |
|---|---|
| ARCHITECT | COMPLETE — 2026-06-02 |
| VENOM | NOT RUN |
| ELEKTRA | PARTIAL — ELEK-040 and ELEK-041 identified via upload/portfolio cross-path |
| BLACKWIDOW | NOT RUN |
| SENTRY | NOT RUN |
| IRONMAN | NOT RUN |
| SPIDER-MAN | NOT RUN |
| KRAVEN | NOT RUN |
| THOR | BLOCKED |
| CARNAGE | NOT RUN |
| DB | NOT RUN |
| HAWKEYE | NOT RUN |

---

## Recommended Next Command

**VENOM** — security audit on the portfolio engine boundary and write surfaces.
Must resolve ELEK-2026-05-28-040 (missing ownership gate on ctrlSavePortfolioDetail)
before THOR eligibility is possible. Follow with IRONMAN to confirm DI ownership
binding is complete across all write paths.
