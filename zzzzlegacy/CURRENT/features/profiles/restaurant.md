# Type Preset — Restaurant / Food

**Preset Name:** `VPORT_FOOD_TABS`
**Applies To:** All types in the "Food, Hospitality & Events" group: restaurant, baker, bartender, caterer, chef, cook, server
**Priority:** MEDIUM — group-level default (no individual type overrides in this group)
**Last Updated:** 2026-05-27

---

## Tab Order

```
1. menu           ← LANDING TAB — food menu is primary visit intent
2. reviews        ← taste/service trust signal
3. content        ← recipe posts, specials, event content
4. about          ← hours, location, delivery info
5. services       ← catering, delivery, event packages
6. photos         ← food photography
7. vibes          ← social feed
8. subscribers
(+owner — dynamically injected if isOwner)
```

---

## Design Intent

Food/hospitality profiles convert primarily through the menu. Visitors arrive with the intent to decide what to eat or order — the menu must be immediately accessible. Reviews second for quality trust. About third for location + hours (delivery/dine-in decision).

---

## Menu Tab Specifics

The `menu` tab for food types is backed by a full menu management pipeline:
- Owner creates/edits menu items via `VportDashboardMenuScreen` (dashboard)
- Public visitors view via `VportMenuView` (public tab)
- QR code generation for physical menu sharing
- `vportPrintableFlyer` release flag controls printable menu feature (default: `true`)
- `vportFlyerEditor` flag controls editor (default: `false` — deployed but off)

---

## Key Risks

| Tab | Risk | Notes |
|---|---|---|
| `menu` | MEDIUM | QR access, flyer editor flag, content injection risk |
| `content` | LOW | Recipe/promo posts |

---

## Source

`features/profiles/kinds/vport/model/getVportTabsByType.model.js`

```js
const VPORT_FOOD_TABS = ['menu', 'reviews', 'content', 'about', 'services', 'photos', 'vibes', 'subscribers'];
// applied to group: 'Food, Hospitality & Events'
```

---

## Governance

| Command | Status | Notes |
|---|---|---|
| VENOM | NOT_STARTED | QR access + flyer editor flag gate |
| ARCHITECT | NOT_STARTED | Menu pipeline adapter boundary |
| SENTRY | NOT_STARTED | — |
| SPIDER-MAN | NOT_STARTED | Menu write path regression tests |
| LOGAN | PARTIAL | This doc; full menu pipeline doc needed |
