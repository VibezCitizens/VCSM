# Tab: rates

**Key:** `rates`
**Label:** Rates
**VPORT Types:** exchange, money exchange
**Landing Tab:** YES — always first in VPORT_RATES_TABS
**Last Updated:** 2026-05-27

## Purpose
Displays the live currency exchange rate board for money exchange businesses. Shows buy and sell rates per currency pair, per-pair last-updated timestamps, and a global last-updated marker.

## Public View
- Component: `VportRatesView`
- Path: `features/profiles/kinds/vport/screens/rates/view/VportRatesView.jsx`
- UI: Buy (emerald) / Sell (amber) columns, scrollable pair list, timestamp per pair
- Access: Public (no auth required)
- Privacy gate: Applies if vport profile is private

## Management Surface
- Screen: `VportDashboardExchangeScreen`
- Route: `/actor/:actorId/dashboard/exchange`
- Access: Owner only (OwnerOnlyDashboardGuard)

## Module Doc
Full architecture: `logan/vports/vcsm.vport.exchange-rate.md`
