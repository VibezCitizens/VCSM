# Tab: services

**Key:** `services`
**Label:** Services
**VPORT Types:** Most service-type VPORTs
**Landing Tab:** NO
**Last Updated:** 2026-05-27

## Purpose
Displays the VPORT service catalog with pricing, descriptions, and availability. Owner-editable. Visitor read-only.

## View Component
- Path: `features/profiles/kinds/vport/screens/services/view/VportServicesView.jsx`

## Presets
VPORT_BARBER_TABS, VPORT_BARBERSHOP_TABS, VPORT_FOOD_TABS, VPORT_GAS_TABS, VPORT_RATES_TABS, VPORT_SERVICE_BOOK_TABS, VPORT_HEALTH_TABS, VPORT_TRADES_TABS, VPORT_SERVICE_TABS, VPORT_RETAIL_TABS

## Risk Level: MEDIUM
Owner CRUD operations on service catalog. Ownership enforcement required on writes. Adapter boundary with services feature needs SENTRY verification.
