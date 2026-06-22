# Type Preset — Money Exchange

**Preset Name:** `VPORT_RATES_TABS`
**Applies To:** `exchange`, `money exchange` (type-level override)
**Priority:** HIGH — type-level override
**Last Updated:** 2026-05-27
**Audit Status:** Most advanced — KRAVEN verified, SPIDER-MAN partial, LOGAN complete

---

## Tab Order

```
1. rates          ← LANDING TAB — live exchange rate board is primary reason for visit
2. services       ← non-FX services (wire transfers, bill pay, money orders)
3. content        ← social content / rate alerts
4. reviews        ← trust signal (Rate Fairness, Speed, Trust, Service)
5. about          ← location, hours, accepted currencies, licensing
6. photos         ← storefront photos
7. vibes          ← social feed
8. subscribers
(+owner — dynamically injected if isOwner)
```

---

## Design Intent

Exchange rate profiles are consulted for real-time financial information. Rates-first ordering because visitors arrive specifically to check buy/sell prices. Trust signals (reviews with Trust dimension heavily weighted) are fourth — visitors must feel safe with the exchange before transacting.

---

## Rates Tab Specifics

The `rates` tab is the most thoroughly audited tab in the system (as of 2026-05-27):

- **Public view:** `VportRatesView` — exchange rate board with buy/sell columns, color-coded (emerald/amber), per-pair timestamps
- **Management:** `VportDashboardExchangeScreen` — owner rate editor with publish-as-post toggle
- **Write controller:** `upsertVportRateController` — ownership enforced, cache invalidation wired
- **Read controller:** `getVportRatesController` — public, no auth required
- **Cache:** 60s TTL on read path; invalidated on every write
- **System post:** `publishExchangeRateUpdateAsPostController` — 1h dedup throttle, always uses `PUBLIC_REALM_ID`

See full module doc: `logan/vports/vcsm.vport.exchange-rate.md`

---

## Known Issues (Deferred)

| ID | Issue | Priority |
|---|---|---|
| DTAB-008 | vport.profiles hit twice per publish | P3 |
| DTAB-009 | Sequential reads in publish controller | P3 |
| DTAB-010 | SF-001 mapVportRateRow imported directly | P3 |
| DTAB-011 | SF-002 usePublishExchangeRatePost imported directly | P3 |

---

## Source

`features/profiles/kinds/vport/model/getVportTabsByType.model.js`

```js
const VPORT_RATES_TABS = ['rates', 'services', 'content', 'reviews', 'about', 'photos', 'vibes', 'subscribers'];
// applied to: 'exchange', 'money exchange'
```

---

## Governance

| Command | Status | Notes |
|---|---|---|
| VENOM | PARTIAL | Not yet formally run; security hardened on branch `vport-booking-feed-security-updates` |
| ARCHITECT | PARTIAL | Module architecture report exists at `architect/modules/vcsm.vport-exchange-rate-dashboard.architecture.md` |
| KRAVEN | VERIFIED | 3 LOW findings, no blockers. Report: `audits/performance/2026-05-27_03-00_kraven_vport-exchange-rate-runtime.md` |
| SENTRY | PARTIAL | MINOR DRIFT (SF-001, SF-002 P3 deferred). Report: `audits/compliance/2026-05-27_02-50_sentry_vport-exchange-rate-p1-fixes.md` |
| SPIDER-MAN | PARTIAL | 26 new tests covering upsert + publish controllers. No hook or view tests yet. |
| LOGAN | COMPLETE | Full canonical doc at `logan/vports/vcsm.vport.exchange-rate.md` |
| THOR | NOT_STARTED | — |
