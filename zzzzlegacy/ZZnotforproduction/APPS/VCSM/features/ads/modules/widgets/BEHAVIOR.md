---
title: Widgets Module — Behavior
status: STUB
feature: ads
module: widgets
source: architect-derived
created: 2026-06-05
---

# ads / modules / widgets — BEHAVIOR

## Status

STUB. Display-only module. Behavior seeded from ARCHITECT review.

## Confirmed Behaviors

### Render Ad Widget
- OnemoredaysAd.jsx receives ad data via props (exact shape UNVERIFIED)
- Renders ad unit — content type unknown (text, image, CTA button?)
- No mutations, no localStorage reads, no Supabase calls

### Widget Adapter Consumption
- External feature calls adapters/widgets/OnemoredaysAd.adapter.js
- Adapter injects ad data and exposes widget as public surface
- Actual data injection point UNVERIFIED (pipeline module data? direct props?)

## TODO

- [ ] Confirm props interface on OnemoredaysAd.jsx
- [ ] Confirm which features consume this widget (feed? vport profile? elsewhere?)
- [ ] Confirm whether ad copy is user-supplied text (relevant for WIDGETS-SEC-001)
- [ ] Confirm adapter injection — does it pull from adPipeline or accept external props?
