# Tab: gas-prices

**Key:** `gas-prices`
**Label:** Gas Prices
**VPORT Types:** gas station (type override only)
**Landing Tab:** YES — always first (enforced by model)
**Last Updated:** 2026-05-27

## Purpose
Displays live fuel prices by grade (regular, mid, premium, diesel, E85). Primary reason visitors view a gas station VPORT. Price data is owner-managed.

## View Component
- Path: `features/profiles/kinds/vport/screens/gas/view/VportGasPricesView.jsx`

## Presets
VPORT_GAS_TABS (pos 1, enforced)

## Risk Level: HIGH
Owner writes public-facing fuel prices — price manipulation risk. Always-first tab rule enforced in model (not in preset array). No cache layer detected — may be DB read per page load.
