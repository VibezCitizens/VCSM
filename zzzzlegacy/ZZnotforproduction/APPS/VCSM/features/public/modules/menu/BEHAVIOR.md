---
title: Menu Module — Behavior
status: STUB
feature: public
module: menu
source: venom+bw-derived
created: 2026-06-05
---

# public / modules / menu — BEHAVIOR

## Status

STUB.

## Expected Behaviors (UNVERIFIED)

- Anonymous visitor accesses /menu/:slug (or QR redirect) → resolves VPORT slug
- Displays public menu panels (items, prices, sections)
- Displays public reviews summary + individual reviews
- QR access routes: /menu/qr/:slug, /menu/:slug/qr variants
- VportMenuRedirect handles legacy redirect to slug-based URL
- directionsUrl includes lat/lng coordinates (exposed to anonymous viewers)

## TODO

- [ ] Confirm menu TTL cache behavior (null-guard bug — BW-PUBLIC-009)
- [ ] Confirm slug resolution fallback behavior
