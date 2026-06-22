# Tab: menu

**Key:** `menu`
**Label:** Menu
**VPORT Types:** Food, Hospitality & Events: restaurant, baker, bartender, caterer, chef, cook, server
**Landing Tab:** YES — landing tab in VPORT_FOOD_TABS
**Last Updated:** 2026-05-27

## Purpose
Displays the food menu with items, categories, and pricing. Supports QR code access for physical menus. Flyer pipeline for printable menus.

## View Component
- Path: `features/profiles/kinds/vport/screens/menu/VportMenuView.jsx`

## Presets
VPORT_FOOD_TABS (pos 1)

## Risk Level: MEDIUM
QR-accessed public surface (no auth). vportPrintableFlyer flag (true). vportFlyerEditor flag (false — deployed but gated). Flyer content injection risk. Security hardening on related QR systems was done on vport-booking-feed-security-updates branch.
