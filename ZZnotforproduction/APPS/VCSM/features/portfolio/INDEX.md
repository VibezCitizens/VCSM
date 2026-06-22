---
name: vcsm.portfolio.index
description: VCSM portfolio feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / portfolio

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-04
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 0 | All 8 controllers live in engines/portfolio/src/controller/ — delegated by design |
| DAL files | 0 | All 8 DAL files live in engines/portfolio/src/dal/ — delegated by design |
| Hooks | 0 | No app-side hook; engine consumed directly by profiles and dashboard |
| Models | 0 | All 4 models live in engines/portfolio/src/model/ — delegated by design |
| Screens | 0 | No standalone portfolio screen — portfolio renders inside profiles and dashboard |
| Components | 0 | No components in feature dir |
| Adapters | 3 | portfolioTrace.adapter.js (feature); engines/portfolio/src/adapters/index.js (engine public API) — cg_layerCounts: adapter: 3 |
| Barrels | 1 | engines/portfolio/index.js re-exports engine adapters — cg_layerCounts: module: 1 |
| Tests | 0 | No tests in feature dir; engines/portfolio has 2 test files (updateItem.controller.test.js, portfolioTags.write.dal.test.js) |
| Routes | 0 | No routes in route-map for this feature |
| Total source files | 2 | apps/VCSM/src/features/portfolio/setup.js + portfolioTrace.adapter.js |

## Write Surface Map

No write surfaces detected by scanner for the feature directory. All write operations are owned by the portfolio engine and executed through its DAL layer:

| Operation | Schema | Table | Function |
|---|---|---|---|
| insert | vport | portfolio_items | dalInsertPortfolioItem (engines/portfolio) |
| update | vport | portfolio_items | dalUpdatePortfolioItem (engines/portfolio) |
| soft-delete | vport | portfolio_items | dalSoftDeletePortfolioItem (engines/portfolio) |
| insert | vport | portfolio_media | portfolioMedia.write.dal.js (engines/portfolio) |
| delete | vport | portfolio_media | portfolioMedia.write.dal.js (engines/portfolio) |
| insert/delete | vport | portfolio_tags | portfolioTags.write.dal.js (engines/portfolio) |

Note: The dashboard feature scanner write surface `updatePortfolioMediaAssetIdDAL → portfolio_media` reflects a write that originates inside the dashboard feature's own DAL, not the portfolio engine.

## Security-Sensitive Surfaces

**Ownership gate:** `apps/VCSM/src/features/portfolio/setup.js` injects the `isActorOwner` resolver into the engine. This resolver queries `vc.actor_owners` scoped by RLS policy `actor_owners_read_own` (user_id = auth.uid()). No explicit user_id filter is added in code — ownership is enforced at the DB layer. PORT-V-001 comment documents this pattern.

**Dev trace store:** `portfolioTraceStore` in setup.js is guarded by `import.meta.env.DEV` for the `debugReporter`. The trace store object itself is always instantiated — only the reporter callback is conditionally null in production. This surface should be reviewed by VENOM to confirm no trace data leaks in production bundles.

## Engine Dependencies

- **engines/portfolio** — primary engine; all domain logic delegated here; consumed via `@portfolio` alias
- **engines/booking** — declared in scanner engine list; not directly imported in feature source files (transitive via consuming features profiles/dashboard)

## Routes

No routes in route-map for this feature. Portfolio content renders embedded within profile screens and dashboard cards, not as standalone routed screens.

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT (PLACEHOLDER — contract not yet written) |
| ARCHITECTURE.md | PRESENT (this run — 2026-06-04) |
| CURRENT_STATUS.md | PRESENT (this run — 2026-06-04) |
