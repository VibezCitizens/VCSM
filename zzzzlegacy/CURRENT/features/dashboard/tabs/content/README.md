# Tab: content

**Key:** `content`
**Label:** Content
**VPORT Types:** Most VPORT types (not health, not retail)
**Landing Tab:** NO
**Last Updated:** 2026-05-27

## Purpose
Displays a content feed scoped to the VPORT — posts, articles, or social content published by the VPORT owner. Similar to Vibes but content-typed rather than social-typed.

## View Component
- Path: `features/profiles/kinds/vport/screens/content/VportContentView.jsx`

## Presets
VPORT_BARBER_TABS, VPORT_BARBERSHOP_TABS, VPORT_GAS_TABS, VPORT_RATES_TABS, VPORT_CREATIVE_TABS, VPORT_SERVICE_TABS, VPORT_FOOD_TABS, VPORT_TABS

## Risk Level: LOW
Read-heavy content feed slice. Adapter boundary for cross-feature content access needs SENTRY verification.
