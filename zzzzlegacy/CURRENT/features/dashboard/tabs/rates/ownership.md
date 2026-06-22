# Tab: rates — Ownership

**Last Updated:** 2026-05-27

## Feature Owner

Module owned by VCSM VPORT Exchange Rate feature set.

## VPORT Types

Only `exchange` and `money exchange` vport types have the `rates` tab in their preset (`VPORT_RATES_TABS`).

## File Ownership

| Layer | File | Owner |
|---|---|---|
| DAL (read) | `features/profiles/kinds/vport/dal/rates/readVportRatesByActor.dal.js` | vport/rates |
| DAL (write) | `features/profiles/kinds/vport/dal/rates/upsertVportRate.dal.js` | vport/rates |
| DAL (exchange) | `features/profiles/kinds/vport/dal/exchange/vportExchangeRatePost.read.dal.js` | vport/exchange |
| Model | `features/profiles/kinds/vport/model/rates/vportRates.model.js` | vport/rates |
| Controller (read) | `features/profiles/kinds/vport/controller/rates/getVportRates.controller.js` | vport/rates |
| Controller (write) | `features/profiles/kinds/vport/controller/rates/upsertVportRate.controller.js` | vport/rates |
| Controller (publish) | `features/profiles/kinds/vport/controller/exchange/publishExchangeRateUpdateAsPost.controller.js` | vport/exchange |
| Hook (read) | `features/profiles/kinds/vport/hooks/rates/useVportRates.js` | vport/rates |
| Hook (write) | `features/profiles/kinds/vport/hooks/rates/useUpsertVportRate.js` | vport/rates |
| Hook (publish) | `features/profiles/kinds/vport/hooks/exchange/usePublishExchangeRatePost.js` | vport/exchange |
| View (public) | `features/profiles/kinds/vport/screens/rates/view/VportRatesView.jsx` | vport/rates |
| Screen (dashboard) | `features/dashboard/vport/screens/VportDashboardExchangeScreen.jsx` | dashboard/vport |
| Adapter (rates) | `features/profiles/adapters/kinds/vport/screens/rates/` | profiles/adapters |

## Cross-Feature Adapters Used

- `features/booking/adapters/booking.adapter` — ownership check
- `features/upload/adapters/posts.adapter` — system post creation
