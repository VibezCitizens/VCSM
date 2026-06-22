---
title: Menu Module — Architecture
status: STUB
feature: public
module: menu
source: venom+bw-derived
created: 2026-06-05
---

# public / modules / menu — ARCHITECTURE

## Slug Resolution

```
/menu/:slug → resolveVportSlug.controller → resolveVportSlug.dal → vc.vports SELECT slug
/menu/:menuSlug → resolveMenuSlug.controller → resolveMenuSlug.dal
```

## Menu + Details Read

```
getVportPublicMenu.controller → readVportPublicMenu.rpc.dal → SECURITY DEFINER RPC
getVportPublicDetails.controller → readVportPublicDetails.rpc.dal
  └── directionsUrl with lat/lng embedded ← VEN-PUBLIC-004 / BW-PUBLIC-012 BYPASSED
```

## Reviews Read

```
getVportPublicReviews.controller
  └── readPublicVportReviews.dal + readPublicVportReviewSummary.dal + readPublicVportReviewDimensions.dal
        └── author_actor_id + target_actor_id returned verbatim ← VEN-PUBLIC-005 / BW-PUBLIC-011 BYPASSED
```

## Cache

```
useVportPublicDetails → TTL 60s cache
  └── `cached !== undefined` null-guard bug — stale null served 60s ← BW-PUBLIC-009
```

## TODO

- [ ] Confirm SECURITY DEFINER RPC for menu read returns no sensitive columns
