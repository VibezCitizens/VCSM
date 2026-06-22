---
title: Portfolio Module — Architecture
status: STUB
feature: portfolio
module: portfolio
source: venom+bw-derived
created: 2026-06-05
---

# portfolio / modules / portfolio — ARCHITECTURE

## Boot

```
app boot → setup.js → configurePortfolioEngine()
  └── engines/portfolio — registers handlers
```

## Debug Adapter

```
portfolioTrace.adapter.js — exports trace store
  └── Always bundled in production (no DEV gate at adapter level) ← VEN-PORTFOLIO-004
        └── DEV gate exists only inside engines/portfolio debugReporter
```

## Engine Dependency

All portfolio logic lives in engines/portfolio:
- Item CRUD: dalGetPortfolioItemById, dalUpdatePortfolioItem, dalDeletePortfolioMedia
- Tag management: dalReplacePortfolioTags (broken — missing callerProfileId)
- Cache: invalidatePortfolioCache (broken — wrong key format)
- Model: PortfolioItemModel (leaks profileId, createdByActorId)

## TODO

- [ ] Audit engines/portfolio module split — engine governance not yet built
