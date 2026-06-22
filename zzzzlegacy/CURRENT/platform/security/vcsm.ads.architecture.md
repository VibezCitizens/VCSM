# MODULE ARCHITECTURE REPORT

**Module:** ads
**Application Scope:** apps/VCSM
**Module Type:** Feature Module — VPORT Advertising
**Primary Root:** `apps/VCSM/src/features/ads/`
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** INCOMPLETE

---

## PURPOSE

Owns VPORT ad management: creating, displaying, and managing ads for VPORTs. Provides an ad pipeline that fetches and validates ad data, a VPORT ads settings screen, and an ad widget (OneMoreDays). The module uses a `usecases/` pattern instead of `controllers/` — an architecture layer contract violation.

---

## ENTRY POINTS

- `/ads` → `VportAdsSettingsScreen.jsx`

---

## LAYER MAP

**DAL:** `dal/ad.storage.dal.js` — storage DAL (localStorage-backed)

**API:** `api/ad.api.js` — external API calls for ads

**Model:** `model/ad.model.js`, `model/vportAdsSettingsShell.model.js`

**Lib:** `lib/ad.validation.js`

**Constants:** `constants.js`

**Usecase (NOT controller):** `usecases/adPipeline.usecase.js` — **ARCHITECTURE VIOLATION: business logic outside controller layer**

**Hook:** `hooks/useVportAds.js`, `hooks/useDesktopBreakpoint.js`

**UI:** `ui/VportAdsBackButton.jsx`, `ui/adsPipeline.ui.js`, `ui/components.jsx`

**Screen:** `screens/VportAdsSettingsScreen.jsx`, `screens/adsScreens.js`

**Widget:** `widgets/OnemoredaysAd.jsx`

**Feature config:** `ads.feature.js`

**Adapters:**
- `adapters/hooks/useVportAds.adapter.js`
- `adapters/widgets/OnemoredaysAd.adapter.js`

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Ad management clear | — |
| Controllers present | FAIL | No controller — business logic in usecase | Architecture violation |
| DAL present | PARTIAL | Storage DAL only — no DB DAL | Ads may be storage-only |
| API present | PASS | ad.api.js | — |
| Models present | PASS | 2 models | — |
| Hooks present | PASS | 2 hooks | — |
| Screens present | PASS | VportAdsSettingsScreen | — |
| Adapters present | PASS | 2 adapters | — |
| Documentation | FAIL | No Logan doc | — |

---

## DEAD CODE / SPAGHETTI SIGNALS

| Signal | Evidence | Risk | Recommended Handoff |
|---|---|---|---|
| `usecases/` instead of `controllers/` | Business logic in usecase not controller | HIGH — contract violation | SENTRY |
| `ad.storage.dal.js` — localStorage DAL | Business data in localStorage? | MEDIUM — data loss risk | VENOM |
| `useDesktopBreakpoint.js` in ads | Should be shared utility | LOW | IRONMAN |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Replace usecase with controller | HIGH | Architecture layer violation | SENTRY |
| Clarify if ads use localStorage or DB | HIGH | localStorage = data loss, not shared across sessions | VENOM |
| Logan documentation | HIGH | No canonical ads architecture | LOGAN |

---

## FINAL MODULE STATUS: INCOMPLETE

## RECOMMENDED HANDOFFS:
- SENTRY (boundary: usecase layer violation)
- VENOM (security: localStorage-backed DAL)
- LOGAN (documentation)
