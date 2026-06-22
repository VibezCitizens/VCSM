# Type Preset — Gas Station

**Preset Name:** `VPORT_GAS_TABS`
**Applies To:** `gas station` (type-level override)
**Priority:** HIGH — type-level override
**Special Rule:** `gas` tab is ALWAYS reordered to first position by model logic
**Last Updated:** 2026-05-27

---

## Tab Order

```
1. gas            ← LANDING TAB — fuel prices (ALWAYS first, enforced by model)
2. services       ← car wash, air pump, convenience store, etc.
3. content        ← promo posts, price alerts
4. about          ← location, hours, fuel types, amenities
5. reviews        ← pump quality, wait time, cleanliness
6. photos         ← station photos
7. vibes          ← social feed
8. subscribers
(+owner — dynamically injected if isOwner)
```

---

## Special: Gas Tab Always-First Rule

The `gas` tab is not just first in the preset array — it is **enforced to be first at runtime** by a special reorder step in `getVportTabsByType.model.js`:

```js
const gasTab = tabs.find(t => t.key === 'gas');
const rest = tabs.filter(t => t.key !== 'gas');
return gasTab ? [gasTab, ...rest] : tabs;
```

This means even if a future preset accidentally places `gas` in position 2, the model will always pull it to position 1. This is intentional design: gas prices must be instantly visible — they're the reason visitors arrive.

---

## Gas Prices Tab Specifics

- **Public view:** `VportGasPricesView` — fuel price board by grade (regular, mid, premium, diesel, E85)
- **Management:** `VportDashboardGasScreen` — owner price editor
- Owner-side updates are directly reflected in public view
- No publish-as-post system (unlike exchange rates)
- No caching layer detected — needs KRAVEN verification

---

## Key Risks

| Aspect | Risk | Notes |
|---|---|---|
| Owner writes public prices | HIGH | Price manipulation — is there an ownership check on the gas price write controller? Needs VENOM |
| Always-first rule | LOW | Logic not regression-tested — needs SPIDER-MAN |
| No cache detected | MEDIUM | Every page load may hit DB directly — needs KRAVEN |

---

## Source

`features/profiles/kinds/vport/model/getVportTabsByType.model.js`

```js
const VPORT_GAS_TABS = ['gas', 'services', 'content', 'about', 'reviews', 'photos', 'vibes', 'subscribers'];
// applied to: 'gas station'
// Always-first enforcement applied after preset resolution
```

---

## Governance

| Command | Status | Notes |
|---|---|---|
| VENOM | NOT_STARTED | Gas price write ownership gate |
| ARCHITECT | NOT_STARTED | Gas tab vs dashboard screen relationship |
| KRAVEN | NOT_STARTED | No cache layer verified — likely DB hit per page load |
| SENTRY | NOT_STARTED | — |
| SPIDER-MAN | NOT_STARTED | Always-first rule + price write regression tests |
| LOGAN | PARTIAL | This doc |
