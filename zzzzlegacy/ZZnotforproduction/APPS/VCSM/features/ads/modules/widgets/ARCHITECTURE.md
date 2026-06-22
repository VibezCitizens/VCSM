---
title: Widgets Module — Architecture
status: STUB
feature: ads
module: widgets
source: architect-derived
created: 2026-06-05
---

# ads / modules / widgets — ARCHITECTURE

## Status

STUB. Layer stack seeded from ARCHITECT review. Full trace pending.

## Layer Stack

```
Consuming Feature (feed? profile? UNVERIFIED)
  └── adapters/widgets/OnemoredaysAd.adapter.js (public surface)
        └── widgets/OnemoredaysAd.jsx (display component)
              └── props → renders ad content (no data fetching)
```

## Module Boundaries

| Boundary | Owner | Status |
|---|---|---|
| Entry: adapter | OnemoredaysAd.adapter.js | OK |
| Display component | OnemoredaysAd.jsx | OK |
| Data source | props only (UNVERIFIED) | — |
| Mutations | None | OK |

## TODO

- [ ] Confirm consuming features — which features import this widget?
- [ ] Confirm adapter interface — what props does it inject?
- [ ] Confirm whether widget fetches data internally or is purely prop-driven
